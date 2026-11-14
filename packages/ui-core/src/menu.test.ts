import assert from "node:assert/strict";
import { test } from "node:test";
import { firstMenuValue } from "./menu.ts";

test("the first item that can be chosen is named by its position", () => {
  const item = (disabled = false) => ({ label: "Item", onSelect: () => {}, disabled });
  assert.equal(firstMenuValue([item(), item()]), "0");
  assert.equal(firstMenuValue(["separator", item(true), item()]), "2");
  assert.equal(firstMenuValue([item(true), "separator"]), undefined);
});
