import { describe, expect, it } from "vitest";
import { loadSchedulerContent } from "./content";

describe("loadSchedulerContent", () => {
  const content = loadSchedulerContent();

  it("loads every skill from skills.json", () => {
    expect(content.skills.map((s) => s.skill_id).sort()).toEqual(
      [
        "fluency_k_u1_cvc_sentences",
        "heart_k_u1_batch_01",
        "pa_k_u1_blend_two_sound",
        "pa_k_u1_isolate_initial_sound",
        "pa_k_u2_segment_three_sound",
        "phonics_k_u1_consonants_mstp",
        "phonics_k_u1_cvc_blend_short_a",
        "phonics_k_u1_short_a",
        "phonics_k_u2_consonants_ncdg",
        "phonics_k_u2_cvc_blend_short_o",
        "phonics_k_u2_short_o"
      ].sort()
    );
  });

  it("loads every unit from scope-sequence.json", () => {
    expect(content.units.map((u) => u.unit_id)).toEqual(["k_u1", "k_u2"]);
  });

  it("indexes every item by id", () => {
    expect(Object.keys(content.itemsById).sort()).toEqual(
      [
        "fluency_k_u1_cat_sat",
        "heart_k_u1_the",
        "phonics_k_u1_short_a_cat",
        "pa_k_u1_blend_at"
      ].sort()
    );
  });

  it("groups items by skill", () => {
    expect(content.itemsBySkill["phonics_k_u1_short_a"]?.map((i) => i.item_id)).toEqual([
      "phonics_k_u1_short_a_cat"
    ]);
    expect(content.itemsBySkill["pa_k_u1_blend_two_sound"]?.map((i) => i.item_id)).toEqual([
      "pa_k_u1_blend_at"
    ]);
  });

  it("normalizes item text as text ?? prompt ?? item_id", () => {
    // item with prompt only falls back to prompt
    expect(content.itemsById["pa_k_u1_blend_at"]?.text).toBe("Blend /a/ and /t/.");
    // item with text uses text directly
    expect(content.itemsById["phonics_k_u1_short_a_cat"]?.text).toBe("cat");
  });

  it("never produces an item with undefined text", () => {
    for (const item of Object.values(content.itemsById)) {
      expect(item.text).toBeTypeOf("string");
      expect(item.text.length).toBeGreaterThan(0);
    }
  });

  it("exposes daily plan size by grade from scheduler-config.json", () => {
    expect(content.dailyPlanSizeByGrade.K).toBe(16);
    expect(content.dailyPlanSizeByGrade["1"]).toBe(22);
  });

  it("validates that every item references a known skill", () => {
    const skillIds = new Set(content.skills.map((s) => s.skill_id));
    for (const item of Object.values(content.itemsById)) {
      expect(skillIds.has(item.skill_id)).toBe(true);
    }
  });

  it("validates that every unit references known skills", () => {
    const skillIds = new Set(content.skills.map((s) => s.skill_id));
    for (const unit of content.units) {
      for (const skillId of unit.skill_ids) {
        expect(skillIds.has(skillId)).toBe(true);
      }
    }
  });
});
