import { useEffect, useState } from "react";
import type { AttemptResult, PracticeCard } from "../../api/types";
import { createPlaybackController, type PlaybackController } from "../../audio/playback";
import { CardShell } from "./CardShell";
import { cardCopy } from "./cardCopy";
import { splitHeartParts } from "./heartParts";

export type DrillCardProps = {
  card: PracticeCard;
  onScore: (result: AttemptResult) => void | Promise<void>;
  playback?: PlaybackController | undefined;
};

const practicePlayback = createPlaybackController();

function PracticeAudioButton({
  card,
  label,
  playback
}: {
  card: PracticeCard;
  label: "Hear this word" | "Hear this sentence";
  playback: PlaybackController;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => playback.cancel(), [playback]);

  const play = async () => {
    setBusy(true);
    setError(null);
    const result = await playback.play({ kind: "tts", text: card.speech_text ?? card.text });
    if (result.status === "failed" || result.status === "unavailable") {
      setError("Could not play that audio. You can keep practicing.");
    }
    setBusy(false);
  };

  return (
    <div className="practice-audio">
      <button
        type="button"
        className="practice-audio-button"
        aria-label={label}
        aria-busy={busy}
        disabled={busy}
        onClick={() => void play()}
      >
        {busy ? "Playing…" : label}
      </button>
      {error && <p className="practice-audio-error" role="alert">{error}</p>}
    </div>
  );
}

/** Phonemic awareness: the child hears/does the prompt; the guardian sees the expected answer. */
function PhonemicAwarenessCard({ card, onScore }: DrillCardProps) {
  const hasRoleInstructions = card.guardian_script && card.student_task;

  return (
    <CardShell label="Phonemic awareness practice card" eyebrow={cardCopy.pa.eyebrow} onScore={onScore}>
      {hasRoleInstructions ? (
        <div className="pa-role-instructions">
          <section className="pa-role-instruction">
            <h2>{cardCopy.pa.guardianLabel}</h2>
            <p>{card.guardian_script}</p>
          </section>
          <section className="pa-role-instruction">
            <h2>{cardCopy.pa.studentLabel}</h2>
            <p>{card.student_task}</p>
          </section>
        </div>
      ) : (
        <div className="card-prompt">{card.text}</div>
      )}
      {card.answer && (
        <p className="guardian-answer">
          {cardCopy.pa.answerPrefix} <strong>{card.answer}</strong>
        </p>
      )}
    </CardShell>
  );
}

/** Heart word: regular parts read normally; irregular parts get the heart treatment (002i D4). */
function HeartWordCard({ card, onScore, playback = practicePlayback }: DrillCardProps) {
  const segments = splitHeartParts(card.text, card.irregular_parts ?? []);
  return (
    <CardShell label="Heart word practice card" eyebrow={cardCopy.heart.eyebrow} onScore={onScore}>
      <div className="card-word">
        {segments
          ? segments.map((seg, i) =>
              seg.heart ? (
                <span key={i} className="heart-part">{seg.text}</span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )
          : card.text}
      </div>
      <PracticeAudioButton card={card} label="Hear this word" playback={playback} />
    </CardShell>
  );
}

/** Fluency: a short decodable sentence, read aloud and guardian-scored. */
function FluencyCard({ card, onScore, playback = practicePlayback }: DrillCardProps) {
  return (
    <CardShell label="Fluency practice card" eyebrow={cardCopy.fluency.eyebrow} onScore={onScore}>
      <div className="card-sentence">{card.text}</div>
      <PracticeAudioButton card={card} label="Hear this sentence" playback={playback} />
    </CardShell>
  );
}

function PhonicsCard({ card, onScore, playback = practicePlayback }: DrillCardProps) {
  return (
    <CardShell label="Phonics practice card" eyebrow={cardCopy.phonics.eyebrow} onScore={onScore}>
      <div className="card-word">{card.text}</div>
      <PracticeAudioButton card={card} label="Hear this word" playback={playback} />
    </CardShell>
  );
}

/**
 * Renders a practice card by its instructional mode. Cards persisted before
 * 002i carry no `kind` and render as phonics (the pre-002i behavior).
 */
export function DrillCard({ card, onScore, playback }: DrillCardProps) {
  switch (card.kind ?? "phonics") {
    case "pa":
      return <PhonemicAwarenessCard card={card} onScore={onScore} />;
    case "heart":
      return <HeartWordCard card={card} onScore={onScore} playback={playback} />;
    case "fluency":
      return <FluencyCard card={card} onScore={onScore} playback={playback} />;
    default:
      return <PhonicsCard card={card} onScore={onScore} playback={playback} />;
  }
}
