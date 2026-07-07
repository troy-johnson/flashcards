# PR #52 Remediation Plan — 003a Task 9 Codec Processing Tooling

**Status:** Draft remediation plan  
**Target PR:** #52 (`plan/003a-task9-codec-processing`)  
**Trigger:** Adversarial review (Round 1) identified two blockers: CI ffmpeg dependency and incomplete Task 9 Step 5 target-device listening.  
**Goal:** Make the tooling PR mergeable while preserving the explicit, documented gap that Task 9 remains open until target-device listening is complete.

---

## Blockers from Round 1 Review

1. **CI will fail without `ffmpeg`/`ffprobe`.**  
   The real-ffmpeg integration test in `scripts/audio-process.test.ts` runs in CI via `pnpm test:scripts`, but `.github/workflows/ci.yml` does not install the required binaries. `ubuntu-latest` does not include ffmpeg by default.

2. **Task 9 Step 5 (target-device codec listening) is incomplete.**  
   `docs/research/audio-spikes/codec-comparison.md` correctly documents AAC as the *provisional* codec and states that Task 9 remains open until listening is done on iPadOS Safari, mobile Safari, desktop Safari, and Chrome.

---

## Remediation Scope

This plan treats Blocker 1 as a hard fix-before-merge item and Blocker 2 as a scope-clarification / tracking item. It does **not** expand the PR to include the actual device-listening work, because that depends on access to target hardware and is best tracked as the remaining work to close Task 9.

### In scope for this PR

- Install `ffmpeg` and `ffprobe` in the CI job so the real integration test runs reliably.
- Optionally improve error surfacing for missing binaries (low-risk polish).
- Update the PR description / bead to state that the PR lands the *tooling* and that Task 9 remains open pending the manual listening gate.
- Update `docs/research/audio-spikes/codec-comparison.md` with a clearer pointer to the follow-up work, if needed.

### Out of scope for this PR

- Completing the target-device listening check.
- Adding true-peak / waveform clipping detection.
- Changing the selected codec from AAC to MP3 or Opus.
- Modifying runtime playback, catalog UI, or API routes (these are covered by earlier Task 6–8 PRs).

---

## Proposed Changes

### 1. CI ffmpeg install

Modify `.github/workflows/ci.yml` to install the binaries before the test step, preserving all existing steps after the install:

```yaml
      - run: pnpm install --frozen-lockfile
      # scripts/audio-process.test.ts exercises the real ffmpeg encode path;
      # without ffmpeg those tests self-skip and CI loses that coverage.
      - run: sudo apt-get update && sudo apt-get install -y --no-install-recommends ffmpeg
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm content:validate
      - run: pnpm audio:manifest:check
      - run: bash scripts/check-sentinel.sh
        env:
          BASE_REF: origin/${{ github.base_ref || 'main' }}
```

Rationale: The script is an ffmpeg wrapper; CI should prove the wrapper works against the real binary. This avoids weakening the integration test or adding conditional skip logic.

### 2. Optional binary-error polish

In `scripts/audio-process.ts`, `defaultRunCommand` currently ignores `spawnSync`’s `error` field. Update it to surface the error message in `stderr` when available:

```ts
export const defaultRunCommand: RunCommand = (command, args) => {
  const result = spawnSync(command, [...args], { encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? ""
  };
};
```

Rationale: Makes CI failures and local missing-binary failures easier to diagnose without changing behavior.

### 3. Variable rename (minor cleanup)

In `scripts/audio-process.ts`, change `missing` to `anyMissing` in `checkBinaries` for clarity:

```ts
const anyMissing = REQUIRED_BINARIES.some((binary) => runCommand(binary, ["-version"]).status !== 0);
if (anyMissing) {
  throw new Error(INSTALL_GUIDANCE);
}
```

### 4. Scope clarification

Update the active bead / PR description to state:

> This PR lands the executable `rw-isolated-sound-v1` processing profile and codec-comparison tooling. It does **not** close Task 9; the manual target-device listening gate remains open and is documented in `docs/research/audio-spikes/codec-comparison.md`.

### 5. Verification commands

Before pushing the remediation commit, run the full local verification that matches CI:

```bash
pnpm -r typecheck
pnpm test          # runs workspace tests + test:scripts, which includes the real-ffmpeg integration test
pnpm content:validate
pnpm audio:manifest:check
```

If feasible, also verify that the CI workflow YAML is valid (e.g., via `gh workflow view` or `act` if available).

---

## Commits

One remediation commit is sufficient:

```bash
git add .github/workflows/ci.yml scripts/audio-process.ts
git commit -m "ci(audio): install ffmpeg in CI and improve binary-error diagnostics

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

If the variable rename is included, keep it in the same commit because it is tightly coupled to the diagnostic touch.

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `apt-get` becomes slow or flaky in CI | Use a pinned version or cache if needed; for now, the standard `apt-get install -y ffmpeg` is acceptable on `ubuntu-latest`. |
| Target-device listening later rejects AAC | The spike doc already keeps MP3 as the fallback candidate; a follow-up PR can switch the profile before Task 10 if necessary. |
| True-peak detection is needed later | Documented in the spike; Task 10 recording-session planning will decide whether to add it or accept the current limitation. |

---

## Definition of Done

- [ ] `.github/workflows/ci.yml` installs ffmpeg and ffprobe before `pnpm test`.
- [ ] `pnpm -r test` still passes locally.
- [ ] The PR description / bead clearly states that Task 9 remains open pending target-device listening.
- [ ] The real-ffmpeg integration test has a plausible path to pass in CI.
- [ ] Adversarial review Round 2 is requested after the changes are pushed.

---

## Post-Merge Follow-Up

- Complete the target-device listening check for AAC.
- Update `docs/research/audio-spikes/codec-comparison.md` with results and final codec decision.
- Close Task 9 only after the device gate is recorded.
- Proceed to Task 10 (recording, review, and release of the 44 sound assets).
