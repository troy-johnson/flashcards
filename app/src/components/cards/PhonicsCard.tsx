import { useState } from "react";
import type { AttemptResult, PracticeCard } from "../../api/types";

type PhonicsCardProps = {
  card: PracticeCard;
  onScore: (result: AttemptResult) => void | Promise<void>;
};

export function PhonicsCard({ card, onScore }: PhonicsCardProps) {
  const [scored, setScored] = useState<AttemptResult | null>(null);

  const handle = (result: AttemptResult) => {
    if (scored) return;
    setScored(result);
    Promise.resolve(onScore(result)).catch(() => setScored(null));
  };

  return (
    <section className="phonics-card" aria-label="Phonics practice card">
      <p className="eyebrow">Read this word</p>
      <div className="card-word">{card.text}</div>
      <div className="tap-controls" aria-label="Guardian tap controls">
        <button type="button" data-result="correct" disabled={scored !== null} onClick={() => handle("correct")}>Correct</button>
        <button type="button" data-result="incorrect" disabled={scored !== null} onClick={() => handle("incorrect")}>Try again</button>
        <button type="button" data-result="skipped" disabled={scored !== null} onClick={() => handle("skipped")}>Skip</button>
      </div>
    </section>
  );
}
