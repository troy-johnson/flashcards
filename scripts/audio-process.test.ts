import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProcessInvocation,
  checkBinaries,
  getProfile,
  validateClip,
  type ClipProbe,
  type RunCommand
} from "./audio-process.ts";

/** A probe that passes every rw-isolated-sound-v1 gate; tests break one field each. */
const goodProbe = (): ClipProbe => ({
  channels: 1,
  sampleRateHz: 44100,
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
    assert.equal(p.requiredChannels, 1);
    assert.equal(p.requiredSampleRateHz, 44100);
  });

  it("rejects an unsupported profile version", () => {
    assert.throws(() => getProfile("rw-isolated-sound-v0"), /unsupported processing profile/);
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
    const errors = validateClip({ ...goodProbe(), sampleRateHz: 48000 }, profile());
    assert.ok(errors.some((e) => /sample rate/.test(e)), `expected sample-rate error, got: ${errors}`);
  });

  it("fails a clipped clip (peak above the profile ceiling)", () => {
    const errors = validateClip({ ...goodProbe(), maxVolumeDb: -0.05 }, profile());
    assert.ok(errors.some((e) => /peak|clip/i.test(e)), `expected clipping error, got: ${errors}`);
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

  it("strips container metadata so byte output is reproducible", () => {
    const args = buildProcessInvocation("in.wav", "sound_m", "out", profile()).args.join(" ");
    assert.match(args, /-map_metadata -1/);
    assert.match(args, /-fflags \+bitexact/);
  });
});
