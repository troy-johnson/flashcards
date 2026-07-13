import { describe, expect, it } from "vitest";
import { loadSchedulerContent } from "./content";

describe("loadSchedulerContent", () => {
  const content = loadSchedulerContent();

  it("loads every skill from skills.json", () => {
    expect(content.skills.map((s) => s.skill_id).sort()).toEqual(
      [
        "fluency_1_u1_short_vowel_sentences",
        "fluency_k_u1_cvc_sentences",
        "fluency_k_u2_cvc_sentences",
        "heart_1_u1_batch_01",
        "heart_k_u1_batch_01",
        "pa_k_u1_blend_two_sound",
        "pa_k_u1_isolate_initial_sound",
        "pa_k_u2_segment_three_sound",
        "phonics_1_u1_alphabet_review",
        "phonics_1_u1_short_e_u",
        "phonics_1_u1_short_i",
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
    expect(content.units.map((u) => u.unit_id)).toEqual(["k_u1", "k_u2", "1_u1"]);
  });

  it("indexes live items by id and excludes deprecated ones", () => {
    const ids = Object.keys(content.itemsById);
    // Representative live items across every category are indexed.
    expect(ids).toEqual(
      expect.arrayContaining([
        "pa_k_u1_blend_at",
        "phonics_k_u1_short_a_mat",
        "phonics_k_u2_o_dog",
        "phonics_1_u1_short_i_bit",
        "heart_k_u1_the",
        "heart_1_u1_do",
        "fluency_k_u1_sam_sat",
        "fluency_k_u2_the_cat_sat",
        "fluency_1_u1_the_kid_can_sit"
      ])
    );
    // Deprecated cat items are retired — never indexed (R2-F4).
    expect(ids).not.toContain("phonics_k_u1_short_a_cat");
    expect(ids).not.toContain("fluency_k_u1_cat_sat");
  });

  it("groups items by skill", () => {
    // The short-a vowel exemplar is the R2-F4 replacement, not the retired cat item.
    expect(content.itemsBySkill["phonics_k_u1_short_a"]?.map((i) => i.item_id)).toEqual([
      "phonics_k_u1_short_a_mat"
    ]);
    expect(content.itemsBySkill["pa_k_u1_blend_two_sound"]?.map((i) => i.item_id)).toEqual([
      "pa_k_u1_blend_at"
    ]);
  });

  it("normalizes item text as text ?? prompt ?? item_id", () => {
    // item with prompt only falls back to prompt
    expect(content.itemsById["pa_k_u1_blend_at"]?.text).toBe("Blend /a/ and /t/.");
    // item with text uses text directly
    expect(content.itemsById["phonics_k_u1_short_a_mat"]?.text).toBe("mat");
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

  it("derives card kind from the skill-id prefix (002i D1)", () => {
    expect(content.itemsById["pa_k_u1_blend_at"]?.kind).toBe("pa");
    expect(content.itemsById["phonics_k_u1_short_a_mat"]?.kind).toBe("phonics");
    expect(content.itemsById["heart_k_u1_the"]?.kind).toBe("heart");
    expect(content.itemsById["fluency_k_u1_sam_sat"]?.kind).toBe("fluency");
  });

  it("preserves answer and heart-part fields on normalized items", () => {
    expect(content.itemsById["pa_k_u1_blend_at"]?.answer).toBe("at");
    expect(content.itemsById["heart_k_u1_the"]?.regular_parts).toEqual(["th"]);
    expect(content.itemsById["heart_k_u1_the"]?.irregular_parts).toEqual(["e"]);
  });

  it("preserves authored caregiver and child PA instructions during normalization", () => {
    const item = content.itemsById["pa_k_u1_blend_at"];
    expect(item?.guardian_script).toBe(
      "Say, ‘/a/ /t/.’ Stretch /a/ slightly, then say /t/ right after it."
    );
    expect(item?.student_task).toBe(
      "Your child puts the sounds together and says the word."
    );
  });

  it("keeps caregiver and child instructions absent when they are unauthored", () => {
    const item = content.itemsById["phonics_k_u1_short_a_mat"];
    expect(item).toBeDefined();
    expect(item && "guardian_script" in item).toBe(false);
    expect(item && "student_task" in item).toBe(false);
  });

  it("preserves item speech_text as the sole TTS pronunciation override (003a Task 5)", () => {
    const injected = loadSchedulerContent({
      skills: [{ skill_id: "phonics_test", grade: "K", prerequisites: [] }],
      units: [{ unit_id: "k_u1", grade: "K", skill_ids: ["phonics_test"] }],
      items: [
        { item_id: "phonics_test_read", skill_id: "phonics_test", text: "read", speech_text: "reed" },
        { item_id: "phonics_test_mat", skill_id: "phonics_test", text: "mat" }
      ]
    });
    expect(injected.itemsById["phonics_test_read"]?.speech_text).toBe("reed");
    expect(injected.itemsById["phonics_test_mat"]?.speech_text).toBeUndefined();
  });

  it("throws when a skill id has no known kind prefix", () => {
    expect(() =>
      loadSchedulerContent({
        skills: [{ skill_id: "mystery_k_u1_thing", grade: "K", prerequisites: [] }],
        units: [{ unit_id: "k_u1", grade: "K", skill_ids: ["mystery_k_u1_thing"] }],
        items: [{ item_id: "mystery_k_u1_thing_x", skill_id: "mystery_k_u1_thing", text: "x" }]
      })
    ).toThrow(/kind/);
  });

  it("excludes deprecated items from itemsById and itemsBySkill (never schedulable)", () => {
    const injected = loadSchedulerContent({
      skills: [{ skill_id: "phonics_k_u1_short_a", grade: "K", prerequisites: [] }],
      units: [{ unit_id: "k_u1", grade: "K", skill_ids: ["phonics_k_u1_short_a"] }],
      items: [
        { item_id: "phonics_k_u1_short_a_cat", skill_id: "phonics_k_u1_short_a", text: "mat", deprecated: true },
        { item_id: "phonics_k_u1_short_a_mat", skill_id: "phonics_k_u1_short_a", text: "mat" }
      ]
    });

    // Deprecated item is not resolvable and never reaches a plan.
    expect(injected.itemsById["phonics_k_u1_short_a_cat"]).toBeUndefined();
    expect(injected.itemsBySkill["phonics_k_u1_short_a"]?.map((i) => i.item_id)).toEqual([
      "phonics_k_u1_short_a_mat"
    ]);
  });
});
