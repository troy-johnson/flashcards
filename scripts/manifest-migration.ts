// Pure, side-effect-free manifest migration/immutability rules, extracted from
// content-validate.ts so the v1->v2 carve-out can be unit-tested directly. The
// validator's on-branch immutability check only runs against the real `content/`
// root on a non-main branch, so a subprocess test against a temp content root
// cannot reach these paths; testing the logic here closes that gap.

export type ManifestCategory = { v1_target: number; required_now: number };
export type ManifestCategoriesLike = { categories: Record<string, ManifestCategory> };

// Compares a candidate manifest (`current`) against the manifest on main
// (`previous`). Returns an error message if the change violates the immutable
// v1-target rule, or null if `current` is a legal successor of `previous`.
//
// Schema v1 -> v2 migration: the single phoneme_digraph_audio target (56) splits
// into the independent recorded_sound_targets (44) and grapheme_pattern_mappings
// (12) gates. Exactly that split is permitted; everything else keeps the
// non-decrease rule. Once main itself is schema v2 (no phoneme_digraph_audio),
// the carve-out stops triggering and all categories use the normal rule.
export const checkManifestMigration = (
  previous: ManifestCategoriesLike,
  current: ManifestCategoriesLike
): string | null => {
  for (const [category, previousTarget] of Object.entries(previous.categories)) {
    if (category === "phoneme_digraph_audio") {
      if (previousTarget.v1_target !== 56) {
        return `unexpected legacy phoneme_digraph_audio v1_target ${previousTarget.v1_target} on main; expected 56`;
      }
      const recorded = current.categories.recorded_sound_targets;
      const mappings = current.categories.grapheme_pattern_mappings;
      if (!recorded || !mappings || recorded.v1_target !== 44 || mappings.v1_target !== 12) {
        return `phoneme_digraph_audio (56) may only migrate to recorded_sound_targets (44) and grapheme_pattern_mappings (12); found ${recorded?.v1_target} and ${mappings?.v1_target}`;
      }
      continue;
    }
    const currentTarget = current.categories[category];
    if (!currentTarget) return `manifest category ${category} present on main is missing on HEAD`;
    if (currentTarget.v1_target < previousTarget.v1_target) {
      return `${category} v1_target ${currentTarget.v1_target} is below main's ${previousTarget.v1_target}; v1 targets are immutable`;
    }
  }
  return null;
};
