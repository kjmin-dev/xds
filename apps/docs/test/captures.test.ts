// What the site generator does with captures.json, on a small repository made for each test: the
// pages it gives each component, the mistakes and the sizes it fails the build over, and a picture
// taken before the latest change, which it shows and warns about without failing.

import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import {
  type CaptureContext,
  capturesMarkdown,
  loadCapturePages,
  warningLine,
  webpSize,
} from "../scripts/capture-pages.ts";
import { BUDGET, type Capture, captureInputs, inputsHash, MODES } from "../scripts/captures.ts";

const contract: CaptureContext["contract"] = {
  components: [
    {
      name: "TopBar",
      clients: {
        "mobile-react-native": { source: "packages/ui-native/src/TopBar.tsx" },
        "kotlin-compose": { source: "kotlin/ui/TopBar.kt" },
      },
    },
    {
      name: "TabBar",
      clients: {
        "mobile-react-native": { source: "packages/ui-native/src/TabBar.tsx" },
        "kotlin-compose": { source: "kotlin/ui/TabBar.kt" },
      },
    },
    {
      name: "BottomSheet",
      clients: { "mobile-react-native": { source: "packages/ui-native/src/BottomSheet.tsx" } },
    },
    { name: "Tooltip", clients: { "web-react": { source: "packages/ui/src/Tooltip.tsx" } } },
  ],
};
const clients = [
  { id: "web-react", name: "React" },
  { id: "mobile-react-native", name: "React Native" },
  { id: "kotlin-compose", name: "Compose" },
];
// The token files captures.ts fingerprints for the two touch clients.
const TOKENS = [
  "packages/tokens/src/generated/tokens.ts",
  "kotlin/ui/src/commonMain/kotlin/acme/tokens/Tokens.kt",
];

/** The start of a WebP file of this size, as the extended format writes it, padded to `bytes`. */
function webp(width: number, height: number, bytes = 64): Uint8Array {
  const data = new Uint8Array(Math.max(bytes, 30));
  const view = new DataView(data.buffer);
  data.set(new TextEncoder().encode("RIFF"), 0);
  view.setUint32(4, data.length - 8, true);
  data.set(new TextEncoder().encode("WEBPVP8X"), 8);
  view.setUint32(16, 10, true);
  const uint24 = (at: number, value: number) => {
    view.setUint16(at, value & 0xffff, true);
    data[at + 2] = value >> 16;
  };
  uint24(24, width - 1);
  uint24(27, height - 1);
  return data;
}

/** A repository with the contract's sources and the token files, and an empty public/. */
async function repository(t: { after: (fn: () => Promise<void>) => void }) {
  const root = await mkdtemp(join(tmpdir(), "docs-captures-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const write = async (path: string, content: string | Uint8Array) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  };
  const sources = contract.components.flatMap((c) => Object.values(c.clients).map((x) => x.source));
  for (const path of [...sources, ...TOKENS]) await write(path, `// ${path}\n`);
  const context: CaptureContext = {
    root,
    publicDir: join(root, "apps/docs/public"),
    contract,
    clients,
  };

  /** A capture as `docs:capture` records it, with its files in public/. */
  const capture = async (
    entry: Partial<Capture> = {},
    { still = 1024, clip = 1024, size = [780, 1696] } = {},
  ): Promise<Capture> => {
    const made: Capture = {
      name: "navigation",
      components: ["TopBar", "TabBar"],
      platform: "ios",
      client: "mobile-react-native",
      source: "a Release build in the iOS 26.5 Simulator (iPhone 17 Pro)",
      date: "2026-11-15",
      alt: "The top of the design preview: a top bar over a tab bar.",
      inputs: "",
      ...entry,
    };
    made.inputs = entry.inputs ?? (await inputsHash(root, captureInputs(made, contract)));
    for (const mode of MODES) {
      const [width = 0, height = 0] = size;
      await write(
        `apps/docs/public/captures/${made.name}/${made.platform}-${mode}.webp`,
        webp(width, height, still),
      );
      if (made.clip) {
        await write(
          `apps/docs/public/captures/${made.name}/${made.platform}-${mode}.mp4`,
          new Uint8Array(clip),
        );
      }
    }
    return made;
  };
  return { root, context, write, capture };
}

test("each component shows its pictures under a tab per platform, in the order of the tabs", async (t) => {
  const { context, capture } = await repository(t);
  const captures = [
    await capture({ platform: "compose", client: "kotlin-compose" }),
    await capture({}, { size: [780, 560] }),
    await capture({ name: "sheet", components: ["BottomSheet"], clip: true }),
  ];
  const { pages, warnings } = await loadCapturePages({ captures }, context);

  assert.deepEqual(warnings, []);
  assert.deepEqual(Object.keys(pages).sort(), ["BottomSheet", "TabBar", "TopBar"]);
  const topBar = pages.TopBar;
  assert.equal(topBar?.initial, "live");
  assert.deepEqual(
    topBar?.tabs.map(({ platform, label }) => `${platform} ${label}`),
    ["ios iOS", "compose Compose"],
  );
  const [ios] = topBar?.tabs[0]?.captures ?? [];
  assert.deepEqual(ios?.stills, {
    light: { src: "/captures/navigation/ios-light.webp", width: 780, height: 560 },
    dark: { src: "/captures/navigation/ios-dark.webp", width: 780, height: 560 },
  });
  assert.equal(ios?.client, "React Native");
  assert.equal(ios?.stale, false);
  assert.equal(ios?.clips, undefined);
  assert.deepEqual(pages.BottomSheet?.tabs[0]?.captures[0]?.clips, {
    light: "/captures/sheet/ios-light.mp4",
    dark: "/captures/sheet/ios-dark.mp4",
  });
  assert.equal(
    capturesMarkdown(topBar ?? { initial: "live", tabs: [] }),
    "The page also shows pictures of the real component, taken from the clients: iOS ([light](/captures/navigation/ios-light.webp), [dark](/captures/navigation/ios-dark.webp)) and Compose ([light](/captures/navigation/compose-light.webp), [dark](/captures/navigation/compose-dark.webp)).",
  );
});

test("an empty manifest gives no page any tabs", async (t) => {
  const { context } = await repository(t);
  assert.deepEqual(await loadCapturePages({ captures: [] }, context), { pages: {}, warnings: [] });
});

test("a mistake in the manifest fails the build and says what it is", async (t) => {
  const { context, capture, write } = await repository(t);
  const cases: [string, () => Promise<Capture[]>, RegExp][] = [
    ["empty alt", async () => [await capture({ alt: " " })], /navigation \(ios\): `alt` is empty/],
    [
      "unknown platform",
      async () => [await capture({ platform: "watchos" as Capture["platform"] })],
      /navigation \(watchos\): unknown platform; expected one of ios, android, compose/,
    ],
    [
      "client that is not a target",
      async () => [await capture({ client: "flutter", inputs: "sha256:0" })],
      /flutter is not a target in template\.json/,
    ],
    [
      "component that is not in the contract",
      async () => [await capture({ components: ["Carousel"], inputs: "sha256:0" })],
      /Carousel is not in design\/components\.json/,
    ],
    [
      "component the client does not have",
      async () => [await capture({ components: ["Tooltip"], inputs: "sha256:0" })],
      /Tooltip is not on mobile-react-native in design\/components\.json/,
    ],
    [
      "date in another form",
      async () => [await capture({ date: "15/11/2026" })],
      /`date` is "15\/11\/2026", not a day written as YYYY-MM-DD/,
    ],
    ["date that is no day", async () => [await capture({ date: "2026-02-30" })], /YYYY-MM-DD/],
    [
      "missing still",
      async () => {
        const made = await capture({ name: "gone" });
        await rm(join(context.publicDir, "captures/gone/ios-dark.webp"));
        return [made];
      },
      /gone \(ios\): public\/captures\/gone\/ios-dark\.webp is missing/,
    ],
    [
      "missing clip",
      async () => [{ ...(await capture({ name: "still-only" })), clip: true }],
      /public\/captures\/still-only\/ios-light\.mp4 is missing/,
    ],
    [
      "still that is not a WebP image",
      async () => {
        const made = await capture({ name: "png" });
        await write("apps/docs/public/captures/png/ios-light.webp", "\x89PNG\r\n\x1a\n");
        return [made];
      },
      /public\/captures\/png\/ios-light\.webp is not a WebP image/,
    ],
    [
      "the same name and platform twice",
      async () => [await capture(), await capture({ alt: "Again." })],
      /navigation \(ios\): appears twice/,
    ],
  ];
  for (const [name, make, message] of cases) {
    await assert.rejects(loadCapturePages({ captures: await make() }, context), message, name);
  }

  // Every problem at once, so that one build lists all there is to fix.
  const both = [await capture({ alt: "", date: "today" })];
  await assert.rejects(loadCapturePages({ captures: both }, context), (error: Error) => {
    assert.match(error.message, /`alt` is empty/);
    assert.match(error.message, /`date` is "today"/);
    return true;
  });
});

test("a still, a clip or a page over its budget fails the build", async (t) => {
  const { context, capture } = await repository(t);
  const at = await capture({}, { still: BUDGET.still });
  assert.ok(await loadCapturePages({ captures: [at] }, context), "exactly at the budget is fine");

  const still = await capture({}, { still: BUDGET.still + 1 });
  await assert.rejects(
    loadCapturePages({ captures: [still] }, context),
    /public\/captures\/navigation\/ios-light\.webp is 60\.1 KB, over the 60 KB a still may take/,
  );
  const clip = await capture({ clip: true }, { clip: BUDGET.clip + 2048 });
  await assert.rejects(
    loadCapturePages({ captures: [clip] }, context),
    /ios-dark\.mp4 is 152\.0 KB, over the 150 KB a clip may take/,
  );

  // Each file within its own budget, but six stills and two clips on the TopBar page are not.
  const page = [
    await capture({ platform: "ios" }, { still: 50 * 1024 }),
    await capture({ platform: "android" }, { still: 50 * 1024 }),
    await capture({ platform: "compose", client: "kotlin-compose" }, { still: 50 * 1024 }),
    await capture({ name: "back", components: ["TopBar"], clip: true }, { clip: 60 * 1024 }),
  ];
  await assert.rejects(loadCapturePages({ captures: page }, context), (error: Error) => {
    assert.match(
      error.message,
      /the TopBar page would show 422\.0 KB of captures, over the 400 KB a page may take/,
    );
    assert.doesNotMatch(error.message, /TabBar page/);
    return true;
  });
});

test("a picture taken before the latest change shows, says so, and warns without failing", async (t) => {
  const { context, capture, write } = await repository(t);
  const captures = [
    await capture(),
    await capture({ platform: "compose", client: "kotlin-compose" }),
  ];
  await write("packages/ui-native/src/TabBar.tsx", "// changed since\n");

  const { pages, warnings } = await loadCapturePages({ captures }, context);
  const [ios, compose] = pages.TopBar?.tabs.map((tab) => tab.captures[0]) ?? [];
  assert.equal(ios?.stale, true);
  assert.equal(compose?.stale, false, "Compose does not read the React Native source");
  assert.deepEqual(warnings, [
    "navigation (ios) was taken before the latest change to one of packages/tokens/src/generated/tokens.ts, packages/ui-native/src/TabBar.tsx and packages/ui-native/src/TopBar.tsx. Its pages say so; take it again with `mise run docs:capture`.",
  ]);

  // A checkout that turns line endings into CRLF has changed nothing.
  await write("packages/ui-native/src/TopBar.tsx", "// packages/ui-native/src/TopBar.tsx\r\n");
  await write("packages/ui-native/src/TabBar.tsx", "// packages/ui-native/src/TabBar.tsx\n");
  assert.deepEqual((await loadCapturePages({ captures }, context)).warnings, []);
});

test("the warning is an annotation on the manifest under GitHub Actions", () => {
  assert.equal(
    warningLine("navigation (ios) is old.", false),
    "docs: warning: captures.json: navigation (ios) is old.",
  );
  assert.equal(
    warningLine("50% old\nreally", true),
    "::warning file=apps/docs/captures.json::50%25 old%0Areally",
  );
});

test("the size of a WebP image is read from each of its three headers", () => {
  const riff = (chunk: string, body: number[]) => {
    const data = new Uint8Array(30);
    data.set(new TextEncoder().encode(`RIFF\0\0\0\0WEBP${chunk}\0\0\0\0`), 0);
    data.set(body, 20);
    return data;
  };
  // Lossy: a key frame's tag, the start code, then 780 and 1696 in 14 bits each.
  const lossy = riff("VP8 ", [
    0,
    0,
    0,
    0x9d,
    0x01,
    0x2a,
    780 & 0xff,
    780 >> 8,
    1696 & 0xff,
    1696 >> 8,
  ]);
  assert.deepEqual(webpSize(lossy), { width: 780, height: 1696 });
  // Lossless: the signature, then 779 and 1695 packed into 28 bits.
  const bits = 779 | (1695 << 14);
  const lossless = riff("VP8L", [
    0x2f,
    bits & 0xff,
    (bits >> 8) & 0xff,
    (bits >> 16) & 0xff,
    bits >>> 24,
  ]);
  assert.deepEqual(webpSize(lossless), { width: 780, height: 1696 });
  assert.deepEqual(webpSize(webp(20_000, 3)), { width: 20_000, height: 3 });

  assert.equal(webpSize(new TextEncoder().encode("\x89PNG\r\n\x1a\n".padEnd(40, "\0"))), undefined);
  assert.equal(webpSize(riff("VP8 ", [0, 0, 0, 1, 2, 3])), undefined, "no start code");
});

test("Flutter captures track the bytes of both Linux reference images", async (t) => {
  const capture = {
    name: "sheet",
    client: "dart-flutter",
    platform: "flutter" as const,
    components: ["BottomSheet"],
  };
  const contract = {
    components: [{ name: "BottomSheet", clients: { "dart-flutter": { source: "modals.dart" } } }],
  };
  const paths = captureInputs(capture, contract).filter((path) => path.endsWith(".png"));
  assert.deepEqual(paths, [
    "flutter/ui/test/goldens/open-sheet-dark.png",
    "flutter/ui/test/goldens/open-sheet-light.png",
  ]);
  const root = await mkdtemp(join(tmpdir(), "flutter-capture-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = "sheet.png";
  await writeFile(join(root, path), Buffer.from([0xff]));
  const before = await inputsHash(root, [path]);
  await writeFile(join(root, path), Buffer.from([0xfe]));
  assert.notEqual(await inputsHash(root, [path]), before);
});
