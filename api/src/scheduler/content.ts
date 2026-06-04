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
  audio_id?: string;
  regular_parts?: string[];
  irregular_parts?: string[];
};

/** A normalized item with a guaranteed non-empty `text`. */
export type SchedulerItem = Omit<RawItem, "text"> & { text: string };

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
 * card with `text: undefined`. Throws if an item or unit references an unknown
 * skill.
 */
export function loadSchedulerContent(): SchedulerContent {
  const skills = skillsJson as Skill[];
  const units = scopeSequence as Unit[];
  const rawItems = seedItems as RawItem[];

  const skillIds = new Set(skills.map((s) => s.skill_id));

  const itemsById: Record<string, SchedulerItem> = {};
  const itemsBySkill: Record<string, SchedulerItem[]> = {};

  for (const raw of rawItems) {
    if (!skillIds.has(raw.skill_id)) {
      throw new Error(`item ${raw.item_id} references unknown skill ${raw.skill_id}`);
    }
    const item: SchedulerItem = { ...raw, text: raw.text ?? raw.prompt ?? raw.item_id };
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
