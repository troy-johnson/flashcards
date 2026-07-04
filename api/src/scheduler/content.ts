import scopeSequence from "../../../content/scope-sequence.json";
import schedulerConfig from "../../../content/scheduler-config.json";
import seedItems from "../../../content/items/seed.json";
import skillsJson from "../../../content/skills.json";

export type Skill = {
  skill_id: string;
  grade: string;
  prerequisites: string[];
};

export type Unit = {
  unit_id: string;
  grade: string;
  skill_ids: string[];
};

/** A seed item as authored: `text` may be absent, with `prompt` as a fallback. */
type RawItem = {
  item_id: string;
  skill_id: string;
  text?: string;
  prompt?: string;
  answer?: string;
  /** Sole TTS pronunciation override (003a): spoken form when it differs from `text`. */
  speech_text?: string;
  audio_id?: string;
  regular_parts?: string[];
  irregular_parts?: string[];
  /** Retired content kept for ID immutability; never loaded into a plan. */
  deprecated?: boolean;
};

/** Overridable raw sources; defaults to the bundled `content/` JSON. Used for tests. */
export type SchedulerContentSources = {
  skills?: Skill[];
  units?: Unit[];
  items?: RawItem[];
};

/** Instructional drill mode, derived from the skill-id naming convention (002i D1). */
export type CardKind = "pa" | "phonics" | "heart" | "fluency";

/** A normalized item with a guaranteed non-empty `text` and a derived `kind`. */
export type SchedulerItem = Omit<RawItem, "text"> & { text: string; kind: CardKind };

const KIND_PREFIXES: readonly CardKind[] = ["pa", "phonics", "heart", "fluency"];

/** Derives the drill mode from a `<kind>_...` skill id; throws on an unknown prefix. */
function deriveKind(skillId: string): CardKind {
  const kind = KIND_PREFIXES.find((prefix) => skillId.startsWith(`${prefix}_`));
  if (!kind) throw new Error(`skill ${skillId} has no known card-kind prefix`);
  return kind;
}

export type SchedulerContent = {
  skills: Skill[];
  units: Unit[];
  itemsById: Record<string, SchedulerItem>;
  itemsBySkill: Record<string, SchedulerItem[]>;
  dailyPlanSizeByGrade: Record<string, number>;
};

/**
 * Loads and validates the static scheduler content from the `content/` JSON files.
 *
 * Each item's `text` is resolved as `text ?? prompt ?? item_id` (matching the
 * legacy plan builder in routes/practice.ts) so the planner can never emit a
 * card with `text: undefined`. Items marked `deprecated` are kept in the JSON
 * for ID immutability but are skipped here so they can never reach a plan.
 * Throws if a (non-deprecated) item or unit references an unknown skill.
 */
export function loadSchedulerContent(sources: SchedulerContentSources = {}): SchedulerContent {
  const skills = sources.skills ?? (skillsJson as Skill[]);
  const units = sources.units ?? (scopeSequence as Unit[]);
  const rawItems = sources.items ?? (seedItems as RawItem[]);

  const skillIds = new Set(skills.map((s) => s.skill_id));

  const itemsById: Record<string, SchedulerItem> = {};
  const itemsBySkill: Record<string, SchedulerItem[]> = {};

  for (const raw of rawItems) {
    if (raw.deprecated) continue;
    if (!skillIds.has(raw.skill_id)) {
      throw new Error(`item ${raw.item_id} references unknown skill ${raw.skill_id}`);
    }
    const item: SchedulerItem = {
      ...raw,
      text: raw.text ?? raw.prompt ?? raw.item_id,
      kind: deriveKind(raw.skill_id)
    };
    itemsById[item.item_id] = item;
    (itemsBySkill[item.skill_id] ??= []).push(item);
  }

  for (const unit of units) {
    for (const skillId of unit.skill_ids) {
      if (!skillIds.has(skillId)) {
        throw new Error(`unit ${unit.unit_id} references unknown skill ${skillId}`);
      }
    }
  }

  const dailyPlanSizeByGrade = { ...(schedulerConfig.daily_plan as Record<string, number>) };

  return { skills, units, itemsById, itemsBySkill, dailyPlanSizeByGrade };
}
