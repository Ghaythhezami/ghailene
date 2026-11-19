import test from "node:test";
import assert from "node:assert/strict";
import { nextStoryCategory } from "../src/lib/gallery-sequence.mjs";

test("starts with remote and cycles through categories without repeating the all-works view", () => {
  const slugs = ["__all__", "featured", "remote", "projects"];
  const empty = new Set();
  assert.equal(nextStoryCategory(slugs, "", empty, false), "remote");
  assert.equal(nextStoryCategory(slugs, "remote", empty, false), "featured");
  assert.equal(nextStoryCategory(slugs, "projects", empty, false), "remote");
});

test("stops after every category is empty and resumes after a populated category", () => {
  const slugs = ["remote", "featured", "projects"];
  const empty = new Set();
  assert.equal(nextStoryCategory(slugs, "remote", empty, true), "featured");
  assert.equal(nextStoryCategory(slugs, "featured", empty, true), "projects");
  assert.equal(nextStoryCategory(slugs, "projects", empty, true), null);
  assert.equal(nextStoryCategory(slugs, "remote", empty, false), "featured");
  assert.equal(empty.size, 0);
});
