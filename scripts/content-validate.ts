import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkManifestMigration } from "./manifest-migration.ts";

const root = process.cwd();
const contentRoot = process.env.CONTENT_VALIDATE_CONTENT_ROOT
  ? resolve(root, process.env.CONTENT_VALIDATE_CONTENT_ROOT)
  : resolve(root, "content");
const usingDefaultContentRoot = contentRoot === resolve(root, "content");
const readContentJson = <T>(path: string): T => JSON.parse(readFileSync(join(contentRoot, path), "utf8"));
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
type Item = {
  item_id: string;
  skill_id: string;
  text?: string;
  prompt?: string;
  audio_id?: string;
  deprecated?: boolean;
};
type DecodabilityEntry = { skill_id: string; graphemes: string[] };
type ScopeUnit = { unit_id: string; grade: "K" | "1"; skill_ids: string[] };
type ManifestCategory = { v1_target: number; required_now: number };
type Manifest = {
  schema_version: 2;
  phase: "phase_a";
  categories: Record<
    | "phonics_skills"
    | "heart_words"
    | "decodable_words"
    | "fluency_sentences"
    | "recorded_sound_targets"
    | "grapheme_pattern_mappings",
    ManifestCategory
  >;
};
const MANIFEST_CATEGORIES = [
  "phonics_skills",
  "heart_words",
  "decodable_words",
  "fluency_sentences",
  "recorded_sound_targets",
  "grapheme_pattern_mappings"
] as const;
type ManifestCategoryName = (typeof MANIFEST_CATEGORIES)[number];

const skills = readContentJson<Skill[]>("skills.json");
const items = readContentJson<Item[]>("items/seed.json");
const scope = readContentJson<ScopeUnit[]>("scope-sequence.json");
const audio = readContentJson<{ audio: { audio_id: string; src?: string; tts_fallback?: boolean }[] }>("audio/manifest.json");
const manifest = readContentJson<Manifest>("manifest.json");

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

// Grade monotonicity: scope-sequence must list all units of an earlier grade
// before any unit of a later grade. The cross-unit prerequisite check below relies
// on a single global scope-array index, which is only sound under this ordering.
let maxGradeSeen = -1;
for (const unit of scope) {
  const gradeOrder = GRADE_ORDER[unit.grade];
  if (gradeOrder < maxGradeSeen) {
    fail(`scope-sequence: ${unit.grade} unit ${unit.unit_id} appears after a grade-1 unit; all K units must precede grade-1 units`);
  }
  maxGradeSeen = Math.max(maxGradeSeen, gradeOrder);
}

const skillUnitIndex = new Map<string, number>();
scope.forEach((unit, idx) => { for (const skillId of unit.skill_ids) skillUnitIndex.set(skillId, idx); });
for (const skill of skills) {
  const skillIdx = skillUnitIndex.get(skill.skill_id);
  if (skillIdx === undefined) continue;
  for (const prereqId of skill.prerequisites ?? []) {
    const prereqIdx = skillUnitIndex.get(prereqId);
    if (prereqIdx !== undefined && prereqIdx > skillIdx) {
      fail(`skill ${skill.skill_id} has prerequisite ${prereqId} from a later unit (unit index ${prereqIdx} > ${skillIdx})`);
    }
  }
}

const decodabilityMapPath = join(contentRoot, "decodability-map.json");
if (existsSync(decodabilityMapPath)) {
  const decodabilityEntries = readContentJson<DecodabilityEntry[]>("decodability-map.json");
  unique("decodability skill_id", decodabilityEntries.map((entry) => entry.skill_id));
  const introducedBySkill = new Map<string, string[]>();
  for (const entry of decodabilityEntries) {
    if (!skillsById.has(entry.skill_id)) fail(`decodability-map references missing skill ${entry.skill_id}`);
    introducedBySkill.set(entry.skill_id, entry.graphemes.map((grapheme) => grapheme.toLowerCase()));
  }

  const scopeSkillOrder = scope.flatMap((unit) => unit.skill_ids);
  const cumulativeGraphemesBySkill = new Map<string, Set<string>>();
  const cumulativeHeartWordsBySkill = new Map<string, Set<string>>();
  const cumulativeGraphemes = new Set<string>();
  const cumulativeHeartWords = new Set<string>();
  const liveItemsBySkill = new Map<string, Item[]>();
  for (const item of items.filter((row) => !row.deprecated)) {
    (liveItemsBySkill.get(item.skill_id) ?? liveItemsBySkill.set(item.skill_id, []).get(item.skill_id)!).push(item);
  }

  for (const skillId of scopeSkillOrder) {
    for (const grapheme of introducedBySkill.get(skillId) ?? []) cumulativeGraphemes.add(grapheme);
    for (const item of liveItemsBySkill.get(skillId) ?? []) {
      if (item.item_id.startsWith("heart_") && item.text) cumulativeHeartWords.add(item.text.toLowerCase());
    }
    cumulativeGraphemesBySkill.set(skillId, new Set(cumulativeGraphemes));
    cumulativeHeartWordsBySkill.set(skillId, new Set(cumulativeHeartWords));
  }

  const untaughtGraphemes = (text: string, allowed: Set<string>) => {
    const source = text.toLowerCase().replace(/[^a-z]/g, "");
    const graphemes = [...allowed].sort((a, b) => b.length - a.length);
    const missing: string[] = [];
    for (let i = 0; i < source.length;) {
      const match = graphemes.find((grapheme) => source.startsWith(grapheme, i));
      if (match) {
        i += match.length;
      } else {
        missing.push(source[i]!);
        i += 1;
      }
    }
    return [...new Set(missing)];
  };

  const checkDecodableText = (item: Item, text: string) => {
    const allowed = cumulativeGraphemesBySkill.get(item.skill_id);
    if (!allowed) fail(`item ${item.item_id} references skill ${item.skill_id} outside scope-sequence`);
    const missing = untaughtGraphemes(text, allowed);
    if (missing.length > 0) {
      fail(`decodability: ${item.item_id} uses untaught grapheme ${missing[0]} in "${text}"`);
    }
  };

  for (const item of items.filter((row) => !row.deprecated)) {
    const text = item.text ?? item.prompt;
    if (!text) continue;
    if (item.item_id.startsWith("phonics_")) checkDecodableText(item, text);
    if (item.item_id.startsWith("fluency_")) {
      const heartWords = cumulativeHeartWordsBySkill.get(item.skill_id) ?? new Set<string>();
      for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
        if (!heartWords.has(word)) checkDecodableText(item, word);
      }
    }
  }
}

const hasRealAudioSource = (entry: { src?: string }) => typeof entry.src === "string" && entry.src.trim().length > 0;
const isRecordedSoundAsset = (entry: { audio_id: string }) =>
  entry.audio_id.startsWith("phoneme_") || entry.audio_id.startsWith("digraph_");
// Deprecated (retired) content is kept for ID immutability but does not count
// toward the content bar — only live content satisfies the manifest gate.
const liveSkills = skills.filter((skill) => !skill.deprecated);
const liveItems = items.filter((item) => !item.deprecated);
const actualManifestCounts: Record<ManifestCategoryName, number> = {
  phonics_skills: liveSkills.filter(
    (skill) => skill.skill_id.startsWith("pa_") || skill.skill_id.startsWith("phonics_")
  ).length,
  heart_words: liveItems.filter((item) => item.item_id.startsWith("heart_")).length,
  decodable_words: liveItems.filter((item) => item.item_id.startsWith("phonics_")).length,
  fluency_sentences: liveItems.filter((item) => item.item_id.startsWith("fluency_")).length,
  // recorded_sound_targets counts only real approved playback assets (recorded
  // phoneme/digraph clips). grapheme_pattern_mappings counts complete mappings
  // that reference valid sound IDs; that mapping data structure lands in a later
  // task, so its actual coverage is 0 until then (v1 target stays at 12).
  recorded_sound_targets: audio.audio.filter((entry) => hasRealAudioSource(entry) && isRecordedSoundAsset(entry)).length,
  grapheme_pattern_mappings: 0
};

if (manifest.schema_version !== 2) {
  fail(`manifest schema_version must be 2, found ${manifest.schema_version ?? "missing"}`);
}

const expectedManifestCategories = new Set<string>(MANIFEST_CATEGORIES);
const actualManifestCategories = Object.keys(manifest.categories);
if (
  actualManifestCategories.length !== MANIFEST_CATEGORIES.length ||
  actualManifestCategories.some((category) => !expectedManifestCategories.has(category))
) {
  fail(`manifest categories must include exactly: ${MANIFEST_CATEGORIES.join(", ")}`);
}

for (const category of MANIFEST_CATEGORIES) {
  const target = manifest.categories[category];
  if (target.required_now > target.v1_target) {
    fail(`${category} required_now ${target.required_now} exceeds v1_target ${target.v1_target}`);
  }
  const actual = actualManifestCounts[category];
  if (actual < target.required_now) {
    fail(`${category} requires at least ${target.required_now}, found ${actual}`);
  }
  if (target.required_now < target.v1_target) {
    console.warn(
      `[content-validate] ${category}: ${target.required_now}/${target.v1_target} required for Phase A v1 target`
    );
  }
}

const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
if (usingDefaultContentRoot && currentBranch !== "main") {
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

  const previousManifest =
    readJsonFromGit<{ categories: Record<string, ManifestCategory> }>("origin/main", "content/manifest.json") ??
    readJsonFromGit<{ categories: Record<string, ManifestCategory> }>("main", "content/manifest.json");
  if (previousManifest) {
    const migrationError = checkManifestMigration(previousManifest, manifest);
    if (migrationError) fail(migrationError);
  }
}

for (const item of items) {
  const skill = skillsById.get(item.skill_id);
  if (skill?.deprecated && !item.deprecated) fail(`item ${item.item_id} references deprecated skill ${item.skill_id}; deprecate the item too`);
}

console.log(`[content-validate] ok: ${skills.length} skills, ${items.length} items, ${audio.audio.length} audio entries`);
