import { useEffect, useMemo, useState } from "react";
import { getAudioCatalog } from "../api/literacy";
import { ApiError } from "../api/client";
import type { AudioCatalogResponse, AudioCatalogSound } from "../api/types";
import { createPlaybackController } from "../audio/playback";

/**
 * Protected production audio-catalog UI (003a Task 8). Admin-only review
 * surface over GET /guardian/audio-catalog: every instructional sound with its
 * recording/review state, plus the grapheme-pattern mappings. Reviewer
 * metadata renders only after the authorized API response.
 */

type LoadState =
  | { phase: "loading" }
  | { phase: "denied" }
  | { phase: "error" }
  | { phase: "ready"; catalog: AudioCatalogResponse };

const shortSha = (sha?: string) => (sha ? sha.slice(0, 12) : "");

const slpApproved = (sound: AudioCatalogSound) =>
  sound.reviews.some((r) => r.kind === "slp" && r.status === "approved");

function PlayButton({
  sound,
  onResult
}: {
  sound: AudioCatalogSound;
  onResult: (soundId: string, failed: boolean) => void;
}) {
  if (!sound.playback_url) return null;
  const src = sound.playback_url;
  return (
    <button
      type="button"
      data-play
      aria-label={`Play ${sound.ipa} as in ${sound.example_word}`}
      onClick={async () => {
        const result = await catalogPlayback.play({ kind: "recorded", src });
        onResult(sound.sound_id, result.status === "failed" || result.status === "unavailable");
      }}
    >
      ▶ {sound.instructional_label}
    </button>
  );
}

/** Module-level controller so the whole page shares one "one clip at a time" lane. */
const catalogPlayback = createPlaybackController();

export function AudioCatalogRoute() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [rowErrors, setRowErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    getAudioCatalog()
      .then((catalog) => {
        if (!cancelled) setState({ phase: "ready", catalog });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) setState({ phase: "denied" });
        else setState({ phase: "error" });
      });
    return () => {
      cancelled = true;
      catalogPlayback.cancel();
    };
  }, []);

  const soundsById = useMemo(
    () =>
      state.phase === "ready"
        ? Object.fromEntries(state.catalog.sounds.map((s) => [s.sound_id, s]))
        : {},
    [state]
  );

  const onPlayResult = (soundId: string, failed: boolean) =>
    setRowErrors((prev) => ({ ...prev, [soundId]: failed }));

  if (state.phase === "loading") {
    return (
      <main className="page-shell">
        <section className="panel"><p>Loading audio catalog…</p></section>
      </main>
    );
  }
  if (state.phase === "denied") {
    return (
      <main className="page-shell">
        <section className="panel"><h1>Audio catalog</h1><p>You are not authorized to view this page (access is limited to the pilot operator).</p></section>
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="page-shell">
        <section className="panel"><h1>Audio catalog</h1><p>Could not load the audio catalog. Refresh to try again.</p></section>
      </main>
    );
  }

  const { sounds, patterns } = state.catalog;
  const recordedCount = sounds.filter((s) => s.playback_url).length;
  const approvedCount = sounds.filter(slpApproved).length;

  return (
    <main className="page-shell">
      <section className="panel audio-catalog">
        <h1>Audio catalog</h1>
        <p>
          {recordedCount}/{sounds.length} recorded · {approvedCount}/{sounds.length} SLP-approved
        </p>

        <h2>Instructional sounds ({sounds.length})</h2>
        <ul className="catalog-list">
          {sounds.map((sound) => (
            <li key={sound.sound_id} data-sound-row={sound.sound_id} className="catalog-row">
              <div className="catalog-row-main">
                <strong>{sound.instructional_label}</strong> {sound.ipa} — as in <em>{sound.example_word}</em>
                <PlayButton sound={sound} onResult={onPlayResult} />
                {rowErrors[sound.sound_id] && <span role="alert"> Could not play this clip.</span>}
              </div>
              <div className="catalog-row-meta">
                {sound.playback_url ? (
                  <>
                    <span>clip {shortSha(sound.playback_sha256)}</span>
                    {sound.reviews.map((r, i) => (
                      <span key={i}>
                        {" "}· {r.kind} {r.status === "approved" ? "approved" : "changes requested"} by {r.reviewer} on {r.reviewed_at}
                      </span>
                    ))}
                    {!slpApproved(sound) && <span> · SLP approval required before learner use</span>}
                  </>
                ) : (
                  <span>Not recorded — SLP approval required before learner use</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <h2>Grapheme patterns ({patterns.length})</h2>
        <ul className="catalog-list">
          {patterns.map((pattern) => (
            <li key={pattern.mapping_id} data-pattern-row={pattern.mapping_id} className="catalog-row">
              <div className="catalog-row-main">
                <strong>{pattern.grapheme}</strong> — as in <em>{pattern.example_word}</em>
                {pattern.sound_ids.map((soundId) => {
                  const sound = soundsById[soundId];
                  return sound ? <PlayButton key={soundId} sound={sound} onResult={onPlayResult} /> : null;
                })}
              </div>
              {pattern.note && <div className="catalog-row-meta">{pattern.note}</div>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
