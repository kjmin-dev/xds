import assert from "node:assert/strict";
import { test } from "node:test";
import { mediaCardIds } from "./media-card.ts";

test("a media card is named by its title and then its details", () => {
  assert.deepEqual(mediaCardIds("c", ["Ada", "3 days ago"]), {
    title: "c-title",
    details: ["c-meta-0", "c-meta-1"],
    names: "c-title c-meta-0 c-meta-1",
  });
  assert.equal(mediaCardIds("c").names, "c-title");
});
