import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

export type ClipProbe = {
  channels: number;
  sampleRateHz: number;
  bitDepth: number | null;
  durationMs: number;
  maxVolumeDb: number;
  leadingSilenceMs: number;
  trailingSilenceMs: number;
};

export type ProcessingProfile = {
  version: "rw-isolated-sound-v1";
  requiredSourceChannels: number;
  requiredSourceSampleRateHz: number;
  requiredSourceBitDepth: number;
  outputSampleRateHz: number;
  minDurationMs: number;
  maxDurationMs: number;
  maxPeakDb: number;
  maxLeadingSilenceMs: number;
  maxTrailingSilenceMs: number;
  codecExtension: "m4a";
  ffmpegArgs: readonly string[];
};

export type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

export type RunCommand = (command: string, args: readonly string[]) => CommandResult;

export type ProcessInvocation = {
  command: "ffmpeg";
  args: string[];
  outputPath: string;
};

export type ProcessFailure = {
  inputPath: string;
  soundId: string;
  message: string;
};

export type ProcessDirectoryResult = {
  processed: ProcessInvocation[];
  failures: ProcessFailure[];
};

export type RunCliOptions = {
  log?: (line: string) => void;
  processDirectoryFn?: (
    inputDir: string,
    outputDir: string,
    profileVersion: string
  ) => ProcessDirectoryResult;
};

const REQUIRED_BINARIES = ["ffmpeg", "ffprobe"] as const;
const INSTALL_GUIDANCE =
  "[audio-process] ffmpeg and ffprobe are required; install them before processing audio";
const SILENCE_FILTER = "silencedetect=n=-50dB:d=0.02";
const SILENCE_EDGE_TOLERANCE_SEC = 0.03;

type FfprobeMetadata = {
  streams?: Array<{
    channels?: number;
    sample_rate?: string | number;
    bits_per_raw_sample?: string | number;
    bits_per_sample?: string | number;
  }>;
  format?: {
    duration?: string | number;
  };
};

const PROFILES: Record<string, ProcessingProfile> = {
  "rw-isolated-sound-v1": {
    version: "rw-isolated-sound-v1",
    requiredSourceChannels: 1,
    requiredSourceSampleRateHz: 48000,
    requiredSourceBitDepth: 24,
    outputSampleRateHz: 44100,
    minDurationMs: 250,
    maxDurationMs: 1500,
    maxPeakDb: -3,
    maxLeadingSilenceMs: 250,
    maxTrailingSilenceMs: 500,
    codecExtension: "m4a",
    ffmpegArgs: [
      "-ac", "1",
      "-ar", "44100",
      "-c:a", "aac",
      "-b:a", "96k",
      "-map_metadata", "-1",
      "-fflags", "+bitexact",
      "-flags:a", "+bitexact"
    ]
  }
};

export const defaultRunCommand: RunCommand = (command, args) => {
  const result = spawnSync(command, [...args], { encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
};

export function getProfile(version: string): ProcessingProfile {
  const profile = PROFILES[version];
  if (!profile) {
    throw new Error(`unsupported processing profile: ${version}`);
  }
  return profile;
}

export function validateClip(probe: ClipProbe, profile: ProcessingProfile): string[] {
  const errors: string[] = [];

  if (probe.channels !== profile.requiredSourceChannels) {
    errors.push(`clip must be mono (${profile.requiredSourceChannels} channel); found ${probe.channels} channels`);
  }
  if (probe.sampleRateHz !== profile.requiredSourceSampleRateHz) {
    errors.push(
      `clip sample rate must be ${profile.requiredSourceSampleRateHz}Hz; found ${probe.sampleRateHz}Hz`
    );
  }
  if (probe.bitDepth !== profile.requiredSourceBitDepth) {
    const found = probe.bitDepth === null ? "unknown" : `${probe.bitDepth}-bit`;
    errors.push(`clip bit depth must be ${profile.requiredSourceBitDepth}-bit; found ${found}`);
  }
  if (probe.durationMs < profile.minDurationMs || probe.durationMs > profile.maxDurationMs) {
    errors.push(
      `clip duration ${probe.durationMs}ms must be between ${profile.minDurationMs}ms and ${profile.maxDurationMs}ms`
    );
  }
  if (probe.maxVolumeDb > profile.maxPeakDb) {
    errors.push(`clip peak ${probe.maxVolumeDb}dB exceeds ${profile.maxPeakDb}dB ceiling; possible clipping`);
  }
  if (probe.leadingSilenceMs > profile.maxLeadingSilenceMs) {
    errors.push(
      `leading silence ${probe.leadingSilenceMs}ms exceeds ${profile.maxLeadingSilenceMs}ms profile limit`
    );
  }
  if (probe.trailingSilenceMs > profile.maxTrailingSilenceMs) {
    errors.push(
      `trailing silence ${probe.trailingSilenceMs}ms exceeds ${profile.maxTrailingSilenceMs}ms profile limit`
    );
  }

  return errors;
}

export function checkBinaries(runCommand: RunCommand = defaultRunCommand): void {
  const missing = REQUIRED_BINARIES.some((binary) => runCommand(binary, ["-version"]).status !== 0);
  if (missing) {
    throw new Error(INSTALL_GUIDANCE);
  }
}

function assertCommandOk(command: string, result: CommandResult, inputPath: string): void {
  if (result.status !== 0) {
    throw new Error(`[audio-process] ${command} failed for ${inputPath}: ${result.stderr || result.stdout}`);
  }
}

function parseOptionalBitDepth(value: string | number | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseFfprobeMetadata(stdout: string, inputPath: string): Pick<ClipProbe, "channels" | "sampleRateHz" | "bitDepth" | "durationMs"> {
  let metadata: FfprobeMetadata;
  try {
    metadata = JSON.parse(stdout) as FfprobeMetadata;
  } catch (error) {
    throw new Error(`[audio-process] ffprobe returned invalid JSON for ${inputPath}: ${(error as Error).message}`);
  }

  const stream = metadata.streams?.[0];
  const channels = Number(stream?.channels);
  const sampleRateHz = Number(stream?.sample_rate);
  const bitDepth = parseOptionalBitDepth(stream?.bits_per_raw_sample) ?? parseOptionalBitDepth(stream?.bits_per_sample);
  const durationSec = Number(metadata.format?.duration);

  if (!Number.isFinite(channels) || !Number.isFinite(sampleRateHz) || !Number.isFinite(durationSec)) {
    throw new Error(`[audio-process] ffprobe output missing audio metadata for ${inputPath}`);
  }

  return {
    channels,
    sampleRateHz,
    bitDepth,
    durationMs: Math.round(durationSec * 1000)
  };
}

function parseMaxVolumeDb(stderr: string, inputPath: string): number {
  const match = stderr.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?|inf)) dB/);
  if (!match) {
    throw new Error(`[audio-process] ffmpeg volumedetect output missing max_volume for ${inputPath}`);
  }
  return match[1] === "-inf" ? Number.NEGATIVE_INFINITY : Number(match[1]);
}

function parseSilenceEdgesMs(stderr: string, durationMs: number): Pick<ClipProbe, "leadingSilenceMs" | "trailingSilenceMs"> {
  const durationSec = durationMs / 1000;
  const intervals: Array<{ startSec: number; endSec?: number }> = [];

  for (const line of stderr.split(/\r?\n/)) {
    const start = line.match(/silence_start:\s*([0-9.]+)/);
    if (start) {
      intervals.push({ startSec: Number(start[1]) });
    }

    const end = line.match(/silence_end:\s*([0-9.]+)/);
    if (end) {
      const openInterval = [...intervals].reverse().find((interval) => interval.endSec === undefined);
      if (openInterval) {
        openInterval.endSec = Number(end[1]);
      }
    }
  }

  const bounded = intervals
    .map((interval) => ({
      startSec: interval.startSec,
      endSec: Math.min(interval.endSec ?? durationSec, durationSec)
    }))
    .filter((interval) => Number.isFinite(interval.startSec) && interval.endSec > interval.startSec);

  const first = bounded[0];
  const last = bounded[bounded.length - 1];

  return {
    leadingSilenceMs:
      first && first.startSec <= SILENCE_EDGE_TOLERANCE_SEC ? Math.round(first.endSec * 1000) : 0,
    trailingSilenceMs:
      last && last.endSec >= durationSec - SILENCE_EDGE_TOLERANCE_SEC
        ? Math.round((durationSec - last.startSec) * 1000)
        : 0
  };
}

export function probeClip(inputPath: string, runCommand: RunCommand = defaultRunCommand): ClipProbe {
  checkBinaries(runCommand);

  const metadata = runCommand("ffprobe", [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_entries", "stream=channels,sample_rate,bits_per_raw_sample,bits_per_sample:format=duration",
    "-of", "json",
    inputPath
  ]);
  assertCommandOk("ffprobe", metadata, inputPath);
  const baseProbe = parseFfprobeMetadata(metadata.stdout, inputPath);

  const volume = runCommand("ffmpeg", ["-hide_banner", "-nostats", "-i", inputPath, "-af", "volumedetect", "-f", "null", "-"]);
  assertCommandOk("ffmpeg volumedetect", volume, inputPath);

  const silence = runCommand("ffmpeg", ["-hide_banner", "-nostats", "-i", inputPath, "-af", SILENCE_FILTER, "-f", "null", "-"]);
  assertCommandOk("ffmpeg silencedetect", silence, inputPath);

  return {
    ...baseProbe,
    maxVolumeDb: parseMaxVolumeDb(volume.stderr, inputPath),
    ...parseSilenceEdgesMs(silence.stderr, baseProbe.durationMs)
  };
}

export function buildProcessInvocation(
  inputPath: string,
  soundId: string,
  outputDir: string,
  profile: ProcessingProfile
): ProcessInvocation {
  const safeSoundId = basename(soundId, extname(soundId));
  const outputPath = join(outputDir, `${safeSoundId}.${profile.codecExtension}`);
  return {
    command: "ffmpeg",
    args: ["-y", "-i", inputPath, ...profile.ffmpegArgs, outputPath],
    outputPath
  };
}

export function processClip(
  inputPath: string,
  soundId: string,
  outputDir: string,
  profileVersion = "rw-isolated-sound-v1",
  runCommand: RunCommand = defaultRunCommand
): ProcessInvocation {
  const profile = getProfile(profileVersion);
  const validationErrors = validateClip(probeClip(inputPath, runCommand), profile);
  if (validationErrors.length > 0) {
    throw new Error(`audio validation failed for ${soundId}: ${validationErrors.join("; ")}`);
  }
  const invocation = buildProcessInvocation(inputPath, soundId, outputDir, profile);
  const result = runCommand(invocation.command, invocation.args);
  if (result.status !== 0) {
    throw new Error(`audio processing failed for ${soundId}: ${result.stderr || result.stdout}`);
  }
  return invocation;
}

export function processDirectory(
  inputDir: string,
  outputDir: string,
  profileVersion = "rw-isolated-sound-v1",
  runCommand: RunCommand = defaultRunCommand
): ProcessDirectoryResult {
  const resolvedInput = resolve(inputDir);
  const resolvedOutput = resolve(outputDir);
  mkdirSync(resolvedOutput, { recursive: true });

  const files = readdirSync(resolvedInput, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".wav"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const processed: ProcessInvocation[] = [];
  const failures: ProcessFailure[] = [];

  for (const file of files) {
    const inputPath = join(resolvedInput, file);
    const soundId = basename(file, extname(file));
    try {
      processed.push(processClip(inputPath, soundId, resolvedOutput, profileVersion, runCommand));
    } catch (error) {
      failures.push({ inputPath, soundId, message: (error as Error).message });
    }
  }

  return { processed, failures };
}

function readCliValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

export function runCli(args: string[], options: RunCliOptions = {}): void {
  const inputDir = readCliValue(args, "--input");
  if (!inputDir) {
    throw new Error("[audio-process] missing required --input <directory>");
  }

  const profileVersion = readCliValue(args, "--profile") ?? "rw-isolated-sound-v1";
  const outputDir = readCliValue(args, "--output") ?? "content/audio/playback";
  const log = options.log ?? console.log;
  const processDirectoryFn = options.processDirectoryFn ?? processDirectory;
  const result = processDirectoryFn(inputDir, outputDir, profileVersion);

  for (const item of result.processed) {
    log(`[audio-process] wrote ${item.outputPath}`);
  }

  if (result.failures.length > 0) {
    const failureList = result.failures
      .map((failure) => `${failure.soundId}: ${failure.message}`)
      .join("\n");
    throw new Error(`[audio-process] ${result.failures.length} file(s) failed validation:\n${failureList}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}
