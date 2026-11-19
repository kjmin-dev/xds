// The built web app in the shell: served from app://, under its Content Security Policy, with
// the design preview reachable by address and by the app's own links. `SCREENSHOTS=<dir>` also
// saves the preview in light and dark mode there.
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { _electron } from "playwright";

const SCREENSHOTS = process.env.SCREENSHOTS;

for (const theme of ["light", "dark"]) {
  test(`the design preview in ${theme} mode`, async () => {
    const app = await _electron.launch({
      args: [".", "--path", `/design?theme=${theme}`],
      cwd: fileURLToPath(new URL("..", import.meta.url)),
    });
    try {
      const page = await app.firstWindow();
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.getByRole("heading", { name: "Acme design system" }).waitFor();
      assert.ok(page.url().startsWith("app://acme/design"), page.url());
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
      if (SCREENSHOTS) await page.screenshot({ path: `${SCREENSHOTS}/design-${theme}.png` });

      // Back to the app and to the preview again, the way a person would go.
      await page.getByRole("link", { name: "Back to the app" }).click();
      await page.getByRole("button", { name: "Open the design preview" }).click();
      await page.getByRole("heading", { name: "Acme design system" }).waitFor();

      // The page runs like a web page: no Node.js, and no leaving the app for a website.
      assert.equal(
        await page.evaluate(() => "require" in globalThis || "process" in globalThis),
        false,
      );
      await page.evaluate(() => {
        location.href = "http://example.com/";
      });
      await page.waitForTimeout(300);
      assert.ok(page.url().startsWith("app://acme/"), page.url());
      assert.deepEqual(errors, []);
    } finally {
      await app.close();
    }
  });
}
