import type { AttemptResult, PracticeCard } from "../../api/types";
import { CardShell } from "./CardShell";
import { cardCopy } from "./cardCopy";
import { splitHeartParts } from "./heartParts";

export type DrillCardProps = {
  card: PracticeCard;
  onScore: (result: AttemptResult) => void | Promise<void>;
};

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
function HeartWordCard({ card, onScore }: DrillCardProps) {
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
    </CardShell>
  );
}

/** Fluency: a short decodable sentence, read aloud and guardian-scored. */
function FluencyCard({ card, onScore }: DrillCardProps) {
  return (
    <CardShell label="Fluency practice card" eyebrow={cardCopy.fluency.eyebrow} onScore={onScore}>
      <div className="card-sentence">{card.text}</div>
    </CardShell>
  );
}

function PhonicsCard({ card, onScore }: DrillCardProps) {
  return (
    <CardShell label="Phonics practice card" eyebrow={cardCopy.phonics.eyebrow} onScore={onScore}>
      <div className="card-word">{card.text}</div>
    </CardShell>
  );
}

/**
 * Renders a practice card by its instructional mode. Cards persisted before
 * 002i carry no `kind` and render as phonics (the pre-002i behavior).
 */
export function DrillCard({ card, onScore }: DrillCardProps) {
  switch (card.kind ?? "phonics") {
    case "pa":
      return <PhonemicAwarenessCard card={card} onScore={onScore} />;
    case "heart":
      return <HeartWordCard card={card} onScore={onScore} />;
    case "fluency":
      return <FluencyCard card={card} onScore={onScore} />;
    default:
      return <PhonicsCard card={card} onScore={onScore} />;
  }
}
