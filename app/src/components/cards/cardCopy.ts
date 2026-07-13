/**
 * Drill-surface copy per card mode (002i rw-qjk). This is practice-UI chrome,
 * not brand copy — brand strings live in packages/copy (FR3).
 */
export const cardCopy = {
  pa: {
    eyebrow: "Listen and say it",
    guardianLabel: "What you say",
    studentLabel: "What your child does",
    /** Guardian-facing line so the adult knows what a correct response sounds like. */
    answerPrefix: "Listen for:"
  },
  phonics: { eyebrow: "Read this word" },
  heart: { eyebrow: "Read this heart word" },
  fluency: { eyebrow: "Read this sentence" }
} as const;
