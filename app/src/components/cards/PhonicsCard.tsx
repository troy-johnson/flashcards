import type { AttemptResult, PracticeCard } from "../../api/types";

type PhonicsCardProps = {
  card: PracticeCard;
  onScore: (result: AttemptResult) => void;
};

export function PhonicsCard({ card, onScore }: PhonicsCardProps) {
  return (
    <section className="phonics-card" aria-label="Phonics practice card">
      <p className="eyebrow">Read this word</p>
      <div className="card-word">{card.text}</div>
      <div className="tap-controls" aria-label="Guardian tap controls">
        <button type="button" data-result="correct" onClick={() => onScore("correct")}>Correct</button>
        <button type="button" data-result="incorrect" onClick={() => onScore("incorrect")}>Try again</button>
        <button type="button" data-result="skipped" onClick={() => onScore("skipped")}>Skip</button>
      </div>
    </section>
  );
}
