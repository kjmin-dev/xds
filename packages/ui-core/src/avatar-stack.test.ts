import assert from "node:assert/strict";
import { test } from "node:test";
import { avatarStack } from "./avatar-stack.ts";

test("an avatar stack counts and names those who did not fit", () => {
  const people = [{ name: "Ada" }, { name: "Grace" }, { name: "Alan" }];
  const stack = avatarStack(people, 2);
  assert.deepEqual(stack.shown, [{ name: "Ada" }, { name: "Grace" }]);
  assert.equal(stack.rest, 1);
  assert.equal(stack.name, "Ada, Grace, Alan");
  assert.equal(avatarStack(people, 4, "Everyone").name, "Everyone");
  assert.equal(avatarStack(people).rest, 0);
});
