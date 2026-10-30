import { test } from "node:test";
import assert from "node:assert/strict";
import { levelFromXp, xpForLevel } from "./questModel.js";

test("the level curve matches floor(sqrt(xp / 50)) + 1", () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(700).level, 4);
  assert.equal(levelFromXp(3800).level, 9);
  for (let xp = 0; xp <= 20000; xp += 10) {
    assert.equal(levelFromXp(xp).level, Math.floor(Math.sqrt(xp / 50)) + 1, `xp ${xp}`);
  }
});

test("XP needed per level is 50 * (L - 1)^2", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 50, 200, 450, 800]);
});

test("progress inside a level", () => {
  assert.deepEqual(levelFromXp(700), { level: 4, into: 250, span: 350 });
  assert.deepEqual(levelFromXp(0), { level: 1, into: 0, span: 50 });
  assert.deepEqual(levelFromXp(3800), { level: 9, into: 600, span: 850 });
});
