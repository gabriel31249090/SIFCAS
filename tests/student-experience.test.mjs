import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultStudentExperience, experienceCss, importStudentExperience, legacyExperienceStorageKey, migrateLegacyStudentExperience, parseStudentExperience } from "../lib/student-experience.ts";

test("student appearance preferences use safe defaults and allow listed visual themes", () => {
  const parsed = parseStudentExperience({
    ...defaultStudentExperience,
    palette: "bubblegum",
    wallpaper: "photo-sky",
    profileFrame: "pixel",
    profilePhoto: "https://example.invalid/avatar.svg",
  });
  assert.equal(parsed.palette, "bubblegum");
  assert.equal(parsed.profileFrame, "pixel");
  assert.equal(parsed.profilePhoto, null);
  assert.equal(parsed.wallpaper, "photo-sky");
  assert.equal(parsed.profileAvatar, "asset-glass-1");
  assert.equal(parsed.profileBannerArt, "asset-banner-1");
  assert.equal(parsed.profileFrameArt, "asset-frame-1");
  assert.match(experienceCss(parsed).wallpaper, /images\.unsplash\.com/);
  assert.equal(experienceCss({ ...defaultStudentExperience, wallpaper: "asset-landscape-1" }).wallpaper, "");
});

test("imported preferences reject unsafe values, paths and unbounded numbers", () => {
  const parsed = parseStudentExperience({
    palette: "url(javascript:alert(1))",
    wallpaper: "https://example.invalid/image",
    hiddenNavigation: ["https://example.invalid/", "/boletim", "/%0a"],
    widgets: ["metrics", "<script>"],
    reminders: { enabled: true, minutes: 9999, categories: ["task", "private"] },
    studyGoalMinutes: 9_999_999,
    dailySummary: { enabled: true, time: "25:99", agenda: false },
  });
  assert.equal(parsed.palette, "aqua");
  assert.equal(parsed.wallpaper, defaultStudentExperience.wallpaper);
  assert.deepEqual(parsed.hiddenNavigation, ["/boletim"]);
  assert.deepEqual(parsed.widgets, ["metrics"]);
  assert.equal(parsed.reminders.minutes, 30);
  assert.deepEqual(parsed.reminders.categories, ["task"]);
  assert.equal(parsed.studyGoalMinutes, 1440);
  assert.equal(parsed.dailySummary.time, "07:00");
  assert.equal(parsed.dailySummary.agenda, false);
  assert.equal(parsed.wallpaper, defaultStudentExperience.wallpaper);
  assert.equal(experienceCss(parsed).wallpaper, "");
});

test("student preference parser tolerates empty, malformed and oversized profile photo data", () => {
  assert.deepEqual(parseStudentExperience(null), defaultStudentExperience);
  assert.equal(parseStudentExperience("{bad").palette, "aqua");
  assert.equal(parseStudentExperience({ profilePhoto: `data:image/png;base64,${"A".repeat(700_001)}` }).profilePhoto, null);
});

test("legacy saved appearance preferences migrate to the Frutiger Aero defaults without losing custom choices", () => {
  const migrated = migrateLegacyStudentExperience({
    theme: "system",
    wallpaper: "sky",
    profileAvatar: "none",
    profileBannerArt: "none",
    profileFrameArt: "none",
    buttonSkin: "none",
    desktopSticker: "none",
    profileBanner: "aurora",
    favorites: ["/editais"],
  });
  assert.equal(legacyExperienceStorageKey, "sifcas:student-experience:v1");
  assert.equal(migrated.wallpaper, defaultStudentExperience.wallpaper);
  assert.equal(migrated.profileAvatar, defaultStudentExperience.profileAvatar);
  assert.equal(migrated.profileBannerArt, defaultStudentExperience.profileBannerArt);
  assert.equal(migrated.profileFrameArt, defaultStudentExperience.profileFrameArt);
  assert.equal(migrated.buttonSkin, defaultStudentExperience.buttonSkin);
  assert.equal(migrated.desktopSticker, defaultStudentExperience.desktopSticker);
  assert.equal(migrated.profileBanner, "none");
  assert.equal(migrated.theme, "system");
  assert.deepEqual(migrated.favorites, ["/editais"]);

  const customized = migrateLegacyStudentExperience({
    wallpaper: "asset-landscape-3",
    profileAvatar: "asset-glass-4",
    profileBannerArt: "asset-banner-5",
    profileFrameArt: "asset-frame-3",
    buttonSkin: "asset-button-2",
    desktopSticker: "asset-sticker-2",
  });
  assert.equal(customized.wallpaper, "asset-landscape-3");
  assert.equal(customized.profileAvatar, "asset-glass-4");
  assert.equal(customized.profileBannerArt, "asset-banner-5");
  assert.equal(customized.profileFrameArt, "asset-frame-3");
  assert.equal(customized.buttonSkin, "asset-button-2");
  assert.equal(customized.desktopSticker, "asset-sticker-2");
});

test("preference records isolate defaults and discard unrelated imported data", () => {
  const first = parseStudentExperience(null);
  const second = parseStudentExperience({ privateAcademicData: { grades: [10] }, dailySummary: [], reminders: [] });
  first.widgets.pop();
  first.favorites.push("/private");
  first.reminders.categories.pop();
  first.dailySummary.time = "22:00";
  assert.deepEqual(second, defaultStudentExperience);
  assert.notEqual(first.widgets, defaultStudentExperience.widgets);
  assert.equal("privateAcademicData" in second, false);
});

test("imported paths remain local and repeated selections are deduplicated", () => {
  const parsed = parseStudentExperience({
    favorites: ["//outside", "/boletim", "/boletim", "/", "/agenda-aluno", "/a//b"],
    hiddenNavigation: ["//example/com", "/editais", "/editais"],
    navigationOrder: ["/perfil", "/perfil"],
    widgets: ["metrics", "metrics", "agenda"],
    reminders: { categories: ["task", "task", "notice"] },
  });
  assert.deepEqual(parsed.favorites, ["/boletim", "/", "/agenda-aluno"]);
  assert.deepEqual(parsed.hiddenNavigation, ["/editais"]);
  assert.deepEqual(parsed.navigationOrder, ["/perfil"]);
  assert.deepEqual(parsed.widgets, ["metrics", "agenda"]);
  assert.deepEqual(parsed.reminders.categories, ["task", "notice"]);
});

test("importing unrelated JSON cannot silently reset saved preferences", () => {
  for (const value of [null, [], "aqua", {}, { grades: [10] }]) {
    assert.throws(() => importStudentExperience(value), /preferências/);
  }
  assert.equal(importStudentExperience({ palette: "meadow" }).palette, "meadow");
  assert.equal(importStudentExperience(defaultStudentExperience).theme, "light");
});

test("focus statistics only accept calendar dates and finite whole numbers", () => {
  assert.equal(parseStudentExperience({ focusDate: "2026-02-31" }).focusDate, "");
  assert.equal(parseStudentExperience({ focusDate: "2026-13-01" }).focusDate, "");
  assert.equal(parseStudentExperience({ focusDate: "2028-02-29" }).focusDate, "2028-02-29");
  assert.equal(parseStudentExperience({ focusDate: "2026-11-04", focusDuration: -100, focusMinutes: NaN }).focusDate, "2026-11-04");
  assert.equal(parseStudentExperience({ focusDuration: -100 }).focusDuration, 1);
  assert.equal(parseStudentExperience({ focusMinutes: NaN }).focusMinutes, 0);
});

test("personalization stays accessible when imported preferences hide navigation", () => {
  assert.deepEqual(parseStudentExperience({ hiddenNavigation: ["/personalizacao", "/boletim"] }).hiddenNavigation, ["/boletim"]);
});
