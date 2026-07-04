import { useRef, useState, type ReactNode } from "react";
import type { AttemptResult } from "../../api/types";

type CardShellProps = {
  /** aria-label for the card section. */
  label: string;
  eyebrow: string;
  children: ReactNode;
  onScore: (result: AttemptResult) => void | Promise<void>;
};

/**
 * Shared drill-card frame: eyebrow, card body, guardian tap controls. Scoring
 * fires once per card; a rejected save re-enables the buttons so the guardian
 * can retry (the drill never advances on an unsaved tap).
 */
export function CardShell({ label, eyebrow, children, onScore }: CardShellProps) {
  const [scored, setScored] = useState<AttemptResult | null>(null);
  // Ref guard: a rapid double-tap lands before React re-renders the disabled
  // state, so the state check alone would double-fire the score.
  const firedRef = useRef(false);

  const handle = (result: AttemptResult) => {
    if (firedRef.current) return;
    firedRef.current = true;
    setScored(result);
    Promise.resolve(onScore(result)).catch(() => {
      firedRef.current = false;
      setScored(null);
    });
  };

  return (
    <section className="phonics-card" aria-label={label}>
      <p className="eyebrow">{eyebrow}</p>
      {children}
      <div className="tap-controls" aria-label="Guardian tap controls">
        <button type="button" data-result="correct" disabled={scored !== null} onClick={() => handle("correct")}>Correct</button>
        <button type="button" data-result="incorrect" disabled={scored !== null} onClick={() => handle("incorrect")}>Try again</button>
        <button type="button" data-result="skipped" disabled={scored !== null} onClick={() => handle("skipped")}>Skip</button>
      </div>
    </section>
  );
}
