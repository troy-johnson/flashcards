import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), "utf8"));
const readJsonFromGit = <T>(ref: string, path: string): T | null => {
  try {
    return JSON.parse(execSync(`git show ${ref}:${path}`, { stdio: ["ignore", "pipe", "ignore"] }).toString());
  } catch {
    return null;
  }
};
const fail = (message: string): never => {
  throw new Error(`[content-validate] ${message}`);
};

const GRADE_ORDER: Record<string, number> = { K: 0, "1": 1 };

type Skill = { skill_id: string; grade: "K" | "1"; prerequisites?: string[]; deprecated?: boolean };
type Item = { item_id: string; skill_id: string; audio_id?: string; deprecated?: boolean };
type ScopeUnit = { unit_id: string; grade: "K" | "1"; skill_ids: string[] };

const skills = readJson<Skill[]>("content/skills.json");
const items = readJson<Item[]>("content/items/seed.json");
const scope = readJson<ScopeUnit[]>("content/scope-sequence.json");
const audio = readJson<{ audio: { audio_id: string; tts_fallback?: boolean }[] }>("content/audio/manifest.json");

const unique = (label: string, values: string[]) => {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) fail(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
};
unique("skill_id", skills.map((s) => s.skill_id));
unique("item_id", items.map((i) => i.item_id));
unique("audio_id", audio.audio.map((a) => a.audio_id));

const skillsById = new Map(skills.map((s) => [s.skill_id, s]));
const audioIds = new Set(audio.audio.map((a) => a.audio_id));
for (const item of items) {
  if (!skillsById.has(item.skill_id)) fail(`item ${item.item_id} references missing skill ${item.skill_id}`);
  if (item.audio_id && !audioIds.has(item.audio_id)) fail(`item ${item.item_id} references missing audio ${item.audio_id}`);
}
for (const unit of scope) {
  for (const skillId of unit.skill_ids) {
    if (!skillsById.has(skillId)) fail(`unit ${unit.unit_id} references missing skill ${skillId}`);
  }
}

const firstUnits = new Map<string, ScopeUnit>();
for (const unit of scope) if (!firstUnits.has(unit.grade)) firstUnits.set(unit.grade, unit);
for (const unit of firstUnits.values()) {
  const unitSkills = new Set(unit.skill_ids);
  for (const skillId of unit.skill_ids) {
    const skill = skillsById.get(skillId);
    for (const prereq of skill?.prerequisites ?? []) {
      if (!unitSkills.has(prereq)) fail(`first unit ${unit.unit_id} has unmet prerequisite ${prereq}`);
    }
  }
}

for (const skill of skills) {
  for (const prereqId of skill.prerequisites ?? []) {
    const prereq = skillsById.get(prereqId);
    if (!prereq) fail(`skill ${skill.skill_id} prereq ${prereqId} is not a defined skill`);
    if (GRADE_ORDER[prereq.grade] > GRADE_ORDER[skill.grade]) {
      fail(`skill ${skill.skill_id} (grade ${skill.grade}) has prereq ${prereqId} from later grade ${prereq.grade}`);
    }
  }
}

const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
if (currentBranch !== "main") {
  const checkImmutability = <T extends { deprecated?: boolean }>(
    label: string,
    path: string,
    keyOf: (row: T) => string,
    current: T[]
  ) => {
    const previous = readJsonFromGit<T[]>("origin/main", path) ?? readJsonFromGit<T[]>("main", path);
    if (!previous) return;
    const currentIds = new Set(current.map(keyOf));
    for (const row of previous) {
      const id = keyOf(row);
      if (row.deprecated) continue;
      if (!currentIds.has(id)) fail(`${label} ${id} present on main is missing on HEAD without deprecation; IDs are immutable post-ship`);
    }
  };
  checkImmutability<Skill>("skill_id", "content/skills.json", (s) => s.skill_id, skills);
  checkImmutability<Item>("item_id", "content/items/seed.json", (i) => i.item_id, items);
}

for (const item of items) {
  const skill = skillsById.get(item.skill_id);
  if (skill?.deprecated && !item.deprecated) fail(`item ${item.item_id} references deprecated skill ${item.skill_id}; deprecate the item too`);
}

console.log(`[content-validate] ok: ${skills.length} skills, ${items.length} items, ${audio.audio.length} audio entries`);
