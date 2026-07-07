import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildProcessInvocation,
  checkBinaries,
  DEFAULT_PROFILE_VERSION,
  defaultRunCommand,
  getProfile,
  processClip,
  processDirectory,
  probeClip,
  runCli,
  validateClip,
  type ClipProbe,
  type ProcessDirectoryResult,
  type RunCommand
} from "./audio-process.ts";
import { EXECUTABLE_PROCESSING_PROFILE_VERSIONS } from "./audio-schema.ts";

/** A probe that passes every rw-isolated-sound-v1 gate; tests break one field each. */
const goodProbe = (): ClipProbe => ({
  channels: 1,
  sampleRateHz: 48000,
  bitDepth: 24,
  durationMs: 900,
  maxVolumeDb: -3.2,
  leadingSilenceMs: 80,
  trailingSilenceMs: 120
});

const profile = () => getProfile("rw-isolated-sound-v1");

describe("getProfile", () => {
  it("returns the versioned rw-isolated-sound-v1 profile", () => {
    const p = profile();
    assert.equal(p.version, "rw-isolated-sound-v1");
    assert.equal(p.requiredSourceChannels, 1);
    assert.equal(p.requiredSourceSampleRateHz, 48000);
    assert.equal(p.requiredSourceBitDepth, 24);
    assert.equal(p.outputChannels, 1);
    assert.equal(p.outputSampleRateHz, 44100);
    assert.equal(p.outputBitrateKbps, 96);
    assert.equal(p.minDurationMs, 250);
    assert.equal(p.maxDurationMs, 1500);
    assert.equal(p.maxPeakDb, -3);
    assert.equal(p.codec, "aac");
    assert.equal(p.codecExtension, "m4a");
  });

  it("rejects an unsupported profile version", () => {
    assert.throws(() => getProfile("rw-isolated-sound-v0"), /unsupported processing profile/);
  });

  it("shares one profile-version source of truth with the audio schema allowlist", () => {
    assert.equal(DEFAULT_PROFILE_VERSION, "rw-isolated-sound-v1");
    assert.ok(EXECUTABLE_PROCESSING_PROFILE_VERSIONS.includes(DEFAULT_PROFILE_VERSION));
    for (const version of EXECUTABLE_PROCESSING_PROFILE_VERSIONS) {
      assert.doesNotThrow(() => getProfile(version));
    }
  });
});

describe("validateClip — rw-isolated-sound-v1 gates", () => {
  it("passes a clean mono clip", () => {
    assert.deepEqual(validateClip(goodProbe(), profile()), []);
  });

  it("fails a stereo clip", () => {
    const errors = validateClip({ ...goodProbe(), channels: 2 }, profile());
    assert.ok(errors.some((e) => /mono|channels/.test(e)), `expected channel error, got: ${errors}`);
  });

  it("fails a wrong sample rate", () => {
    const errors = validateClip({ ...goodProbe(), sampleRateHz: 44100 }, profile());
    assert.ok(errors.some((e) => /sample rate/.test(e)), `expected sample-rate error, got: ${errors}`);
  });

  it("fails a wrong or unavailable bit depth", () => {
    const errors = validateClip({ ...goodProbe(), bitDepth: null }, profile());
    assert.ok(errors.some((e) => /bit depth/.test(e)), `expected bit-depth error, got: ${errors}`);
  });

  it("fails a hot clip with too little peak headroom", () => {
    const errors = validateClip({ ...goodProbe(), maxVolumeDb: -0.05 }, profile());
    assert.ok(errors.some((e) => /peak|headroom/i.test(e)), `expected peak-headroom error, got: ${errors}`);
  });

  it("fails a clip outside the duration window", () => {
    const errors = validateClip({ ...goodProbe(), durationMs: 175 }, profile());
    assert.ok(errors.some((e) => /duration/.test(e)), `expected duration error, got: ${errors}`);
  });

  it("fails excessive leading silence", () => {
    const errors = validateClip({ ...goodProbe(), leadingSilenceMs: 900 }, profile());
    assert.ok(errors.some((e) => /leading silence/.test(e)), `expected leading-silence error, got: ${errors}`);
  });

  it("fails excessive trailing silence", () => {
    const errors = validateClip({ ...goodProbe(), trailingSilenceMs: 1400 }, profile());
    assert.ok(errors.some((e) => /trailing silence/.test(e)), `expected trailing-silence error, got: ${errors}`);
  });

  it("collects multiple failures rather than stopping at the first", () => {
    const errors = validateClip({ ...goodProbe(), channels: 2, sampleRateHz: 22050 }, profile());
    assert.equal(errors.length, 2);
  });
});

describe("checkBinaries", () => {
  const missing: RunCommand = () => ({ status: 1, stdout: "", stderr: "not found" });
  const present: RunCommand = () => ({ status: 0, stdout: "ffmpeg version 8", stderr: "" });

  it("throws the exact install guidance when ffmpeg/ffprobe are missing", () => {
    assert.throws(
      () => checkBinaries(missing),
      /\[audio-process\] ffmpeg and ffprobe are required; install them before processing audio/
    );
  });

  it("passes silently when both binaries respond", () => {
    assert.doesNotThrow(() => checkBinaries(present));
  });
});

describe("probeClip", () => {
  it("probes metadata, peak volume, and edge silence through injected ffprobe/ffmpeg commands", () => {
    const commands: string[] = [];
    const runCommand: RunCommand = (command, args) => {
      commands.push(`${command} ${args.join(" ")}`);

      if (args[0] === "-version") {
        return { status: 0, stdout: `${command} version`, stderr: "" };
      }

      if (command === "ffprobe") {
        return {
          status: 0,
          stdout: JSON.stringify({
            streams: [{ channels: 1, sample_rate: "48000", bits_per_sample: 24 }],
            format: { duration: "0.900000" }
          }),
          stderr: ""
        };
      }

      if (command === "ffmpeg" && args.includes("volumedetect")) {
        return { status: 0, stdout: "", stderr: "[Parsed_volumedetect_0] max_volume: -3.4 dB" };
      }

      if (command === "ffmpeg" && args.some((arg) => arg.startsWith("silencedetect="))) {
        return {
          status: 0,
          stdout: "",
          stderr: [
            "[silencedetect @ 0x1] silence_start: 0",
            "[silencedetect @ 0x1] silence_end: 0.080 | silence_duration: 0.080",
            "[silencedetect @ 0x1] silence_start: 0.780",
            "[silencedetect @ 0x1] silence_end: 0.900 | silence_duration: 0.120"
          ].join("\n")
        };
      }

      return { status: 1, stdout: "", stderr: `unexpected command ${command}` };
    };

    assert.deepEqual(probeClip("raw/stop-p.m4a", runCommand), {
      channels: 1,
      sampleRateHz: 48000,
      bitDepth: 24,
      durationMs: 900,
      maxVolumeDb: -3.4,
      leadingSilenceMs: 80,
      trailingSilenceMs: 120
    });

    assert.ok(commands.some((command) => command.includes("ffprobe -v error")));
    assert.ok(commands.some((command) => command.includes("-af volumedetect")));
    assert.ok(commands.some((command) => command.includes("-af silencedetect=n=-50dB:d=0.02")));
  });

  it("fails clearly when probing commands fail", () => {
    const runCommand: RunCommand = (command, args) => {
      if (args[0] === "-version") {
        return { status: 0, stdout: `${command} version`, stderr: "" };
      }
      return { status: 1, stdout: "", stderr: "decode error" };
    };

    assert.throws(() => probeClip("raw/bad.m4a", runCommand), /ffprobe failed.*decode error/);
  });

  it("maps a positive-infinity peak to Infinity so the clipping gate rejects it", () => {
    const runCommand: RunCommand = (command, args) => {
      if (args[0] === "-version") {
        return { status: 0, stdout: `${command} version`, stderr: "" };
      }
      if (command === "ffprobe") {
        return {
          status: 0,
          stdout: JSON.stringify({
            streams: [{ channels: 1, sample_rate: "48000", bits_per_sample: 24 }],
            format: { duration: "0.9" }
          }),
          stderr: ""
        };
      }
      if (command === "ffmpeg" && args.includes("volumedetect")) {
        return { status: 0, stdout: "", stderr: "[Parsed_volumedetect_0] max_volume: inf dB" };
      }
      return { status: 0, stdout: "", stderr: "" };
    };

    const probe = probeClip("raw/hot.wav", runCommand);
    assert.equal(probe.maxVolumeDb, Number.POSITIVE_INFINITY);
    const errors = validateClip(probe, profile());
    assert.ok(errors.some((e) => /peak|headroom/i.test(e)), `expected peak error, got: ${errors}`);
  });
});

describe("processClip", () => {
  const probingRunCommand = (probeOverrides: Partial<ClipProbe> = {}): { calls: string[]; runCommand: RunCommand } => {
    const probe = { ...goodProbe(), ...probeOverrides };
    const calls: string[] = [];
    const runCommand: RunCommand = (command, args) => {
      calls.push(`${command} ${args.join(" ")}`);

      if (args[0] === "-version") {
        return { status: 0, stdout: `${command} version`, stderr: "" };
      }

      if (command === "ffprobe") {
        return {
          status: 0,
          stdout: JSON.stringify({
            streams: [{ channels: probe.channels, sample_rate: String(probe.sampleRateHz), bits_per_sample: probe.bitDepth ?? 0 }],
            format: { duration: String(probe.durationMs / 1000) }
          }),
          stderr: ""
        };
      }

      if (command === "ffmpeg" && args.includes("volumedetect")) {
        return { status: 0, stdout: "", stderr: `[Parsed_volumedetect_0] max_volume: ${probe.maxVolumeDb} dB` };
      }

      if (command === "ffmpeg" && args.some((arg) => arg.startsWith("silencedetect="))) {
        return { status: 0, stdout: "", stderr: "" };
      }

      if (command === "ffmpeg") {
        return { status: 0, stdout: "encoded", stderr: "" };
      }

      return { status: 1, stdout: "", stderr: `unexpected command ${command}` };
    };

    return { calls, runCommand };
  };

  it("validates a source clip before encoding it", () => {
    const { calls, runCommand } = probingRunCommand();
    const invocation = processClip("raw/sound_m.wav", "sound_m", "out", "rw-isolated-sound-v1", runCommand);

    assert.equal(invocation.outputPath, "out/sound_m.m4a");
    assert.ok(calls.some((call) => call.startsWith("ffprobe ")));
    assert.ok(calls.some((call) => call.includes("-af volumedetect")));
    assert.ok(calls.some((call) => call.startsWith("ffmpeg -y -i raw/sound_m.wav")));
  });

  it("does not encode a clip that fails profile validation", () => {
    const { calls, runCommand } = probingRunCommand({ sampleRateHz: 44100 });

    assert.throws(
      () => processClip("raw/bad.wav", "sound_bad", "out", "rw-isolated-sound-v1", runCommand),
      /audio validation failed.*sample rate/
    );
    assert.equal(calls.some((call) => call.startsWith("ffmpeg -y -i raw/bad.wav")), false);
  });
});

describe("processDirectory", () => {
  it("processes WAV masters deterministically and returns a per-sound failure list", () => {
    const root = mkdtempSync(join(tmpdir(), "audio-process-"));
    try {
      const inputDir = join(root, "masters");
      const outputDir = join(root, "playback");
      mkdirSync(inputDir);
      writeFileSync(join(inputDir, "sound_a.wav"), "");
      writeFileSync(join(inputDir, "sound_z.wav"), "");
      writeFileSync(join(inputDir, "ignore.txt"), "");

      const calls: string[] = [];
      const runCommand: RunCommand = (command, args) => {
        calls.push(`${command} ${args.join(" ")}`);

        if (args[0] === "-version") {
          return { status: 0, stdout: `${command} version`, stderr: "" };
        }

        if (command === "ffprobe") {
          const inputPath = args[args.length - 1];
          const sampleRateHz = String(inputPath).endsWith("sound_z.wav") ? 44100 : 48000;
          return {
            status: 0,
            stdout: JSON.stringify({
              streams: [{ channels: 1, sample_rate: String(sampleRateHz), bits_per_sample: 24 }],
              format: { duration: "0.8" }
            }),
            stderr: ""
          };
        }

        if (command === "ffmpeg" && args.includes("volumedetect")) {
          return { status: 0, stdout: "", stderr: "[Parsed_volumedetect_0] max_volume: -6.0 dB" };
        }

        if (command === "ffmpeg" && args.some((arg) => arg.startsWith("silencedetect="))) {
          return { status: 0, stdout: "", stderr: "" };
        }

        if (command === "ffmpeg") {
          return { status: 0, stdout: "encoded", stderr: "" };
        }

        return { status: 1, stdout: "", stderr: `unexpected command ${command}` };
      };

      const result = processDirectory(inputDir, outputDir, "rw-isolated-sound-v1", runCommand);

      assert.equal(result.processed.length, 1);
      assert.equal(result.processed[0]?.outputPath, join(outputDir, "sound_a.m4a"));
      assert.deepEqual(result.failures.map((failure) => failure.soundId), ["sound_z"]);
      assert.match(result.failures[0]?.message ?? "", /sample rate/);
      assert.equal(calls.some((call) => call.includes("ignore.txt")), false);
      assert.equal(calls.some((call) => call.startsWith("ffmpeg -y -i") && call.includes("sound_z.wav")), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails fast with install guidance when ffmpeg/ffprobe are missing, instead of per-file validation failures", () => {
    const root = mkdtempSync(join(tmpdir(), "audio-process-nobin-"));
    try {
      const inputDir = join(root, "masters");
      mkdirSync(inputDir);
      writeFileSync(join(inputDir, "sound_a.wav"), "");

      const missing: RunCommand = () => ({ status: 1, stdout: "", stderr: "not found" });

      assert.throws(
        () => processDirectory(inputDir, join(root, "playback"), "rw-isolated-sound-v1", missing),
        /ffmpeg and ffprobe are required; install them before processing audio/
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("runCli", () => {
  it("requires an input directory", () => {
    assert.throws(() => runCli([]), /missing required --input <directory>/);
  });

  it("rejects a flag whose value is missing or is another flag", () => {
    assert.throws(() => runCli(["--input", "--output", "out"]), /missing value for --input/);
    assert.throws(
      () => runCli(["--input", "masters", "--profile"], { processDirectoryFn: () => ({ processed: [], failures: [] }) }),
      /missing value for --profile/
    );
  });

  it("uses the default profile and output directory while reporting processed files", () => {
    const logs: string[] = [];
    const result: ProcessDirectoryResult = {
      processed: [
        {
          command: "ffmpeg",
          args: [],
          outputPath: "scratch/audio-process/playback/sound_a.m4a"
        }
      ],
      failures: []
    };
    const calls: Array<{ inputDir: string; outputDir: string; profileVersion: string }> = [];

    runCli(["--input", "approved-takes"], {
      log: (line) => logs.push(line),
      processDirectoryFn: (inputDir, outputDir, profileVersion) => {
        calls.push({ inputDir, outputDir, profileVersion });
        return result;
      }
    });

    assert.deepEqual(calls, [
      {
        inputDir: "approved-takes",
        outputDir: "scratch/audio-process/playback",
        profileVersion: "rw-isolated-sound-v1"
      }
    ]);
    assert.deepEqual(logs, ["[audio-process] wrote scratch/audio-process/playback/sound_a.m4a"]);
  });

  it("honors explicit output and profile flags", () => {
    const calls: Array<{ inputDir: string; outputDir: string; profileVersion: string }> = [];

    runCli(["--input", "masters", "--output", "tmp/playback", "--profile", "rw-isolated-sound-v1"], {
      log: () => {},
      processDirectoryFn: (inputDir, outputDir, profileVersion) => {
        calls.push({ inputDir, outputDir, profileVersion });
        return { processed: [], failures: [] };
      }
    });

    assert.deepEqual(calls, [
      {
        inputDir: "masters",
        outputDir: "tmp/playback",
        profileVersion: "rw-isolated-sound-v1"
      }
    ]);
  });

  it("formats per-sound failures and exits without hiding successful outputs", () => {
    assert.throws(
      () =>
        runCli(["--input", "approved-takes"], {
          log: () => {},
          processDirectoryFn: () => ({
            processed: [],
            failures: [
              {
                inputPath: "approved-takes/sound_z.wav",
                soundId: "sound_z",
                message: "audio validation failed for sound_z: clip sample rate must be 48000Hz; found 44100Hz"
              }
            ]
          })
        }),
      /1 file\(s\) failed validation:\nsound_z: audio validation failed/
    );
  });
});

describe("buildProcessInvocation — deterministic profile application", () => {
  it("applies only the named profile and derives a deterministic output filename", () => {
    const inv = buildProcessInvocation("raw/take3 short_a FINAL.wav", "sound_short_a", "out", profile());
    // Output name comes from the sound id + profile codec, never the input take name.
    assert.equal(inv.outputPath, "out/sound_short_a.m4a");
    assert.equal(inv.command, "ffmpeg");
    const args = inv.args.join(" ");
    // Mono, 44.1kHz, AAC at the profile bitrate — the exact encode contract.
    assert.match(args, /-ac 1/);
    assert.match(args, /-ar 44100/);
    assert.match(args, /-c:a aac/);
    assert.match(args, /-b:a 96k/);
    // Deterministic across calls.
    assert.deepEqual(inv, buildProcessInvocation("raw/take3 short_a FINAL.wav", "sound_short_a", "out", profile()));
  });

  it("preserves dots in sound ids instead of stripping arbitrary extensions", () => {
    const inv = buildProcessInvocation("raw/take.wav", "sound.th.voiced", "out", profile());
    assert.equal(inv.outputPath, "out/sound.th.voiced.m4a");
  });

  it("uses the sound id verbatim even when it ends in a known audio extension", () => {
    // Ids ending in ".opus"/".wav" must not be re-stripped: two distinct ids
    // ("sound_th" and "sound_th.opus") would otherwise collide on one output
    // path and -y would silently overwrite the first encode.
    const inv = buildProcessInvocation("raw/take.wav", "sound_th.opus", "out", profile());
    assert.equal(inv.outputPath, "out/sound_th.opus.m4a");
  });

  it("strips container metadata so byte output is reproducible", () => {
    const args = buildProcessInvocation("in.wav", "sound_m", "out", profile()).args.join(" ");
    assert.match(args, /-map_metadata -1/);
    assert.match(args, /-fflags \+bitexact/);
  });
});

describe("real ffmpeg integration", () => {
  it("processes a compliant generated WAV through the real probe and encode path", () => {
    const root = mkdtempSync(join(tmpdir(), "audio-process-real-"));
    try {
      const inputPath = join(root, "sound_integration.wav");
      const outputDir = join(root, "playback");
      const synth = defaultRunCommand("ffmpeg", [
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-f", "lavfi",
        "-i", "sine=frequency=440:duration=0.9:sample_rate=48000",
        "-ac", "1",
        "-c:a", "pcm_s24le",
        inputPath
      ]);

      assert.equal(synth.status, 0, synth.stderr || synth.stdout);

      const invocation = processClip(
        inputPath,
        "sound_integration",
        outputDir,
        "rw-isolated-sound-v1"
      );

      assert.equal(invocation.outputPath, join(outputDir, "sound_integration.m4a"));
      assert.equal(existsSync(invocation.outputPath), true);
      assert.ok(statSync(invocation.outputPath).size > 0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
