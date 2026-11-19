import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, net, protocol, session, shell } from "electron";

// The built web app is served from app://acme/, not file://: the web app links to /design and
// loads /assets/... from the root, which under file:// would point at the root of the disk.
const SCHEME = "app";
const ORIGIN = `${SCHEME}://acme`;
// Forge copies the same Vite output into the packaged app’s Resources directory.
const WEB = app.isPackaged
  ? path.join(process.resourcesPath, "dist")
  : path.join(import.meta.dirname, "..", "dist");
// `mise run //desktop-electron:dev` sets this to the wrapped app's dev server.
const DEV_SERVER =
  !app.isPackaged && process.env.DEV_SERVER_URL === "http://localhost:5178"
    ? process.env.DEV_SERVER_URL
    : undefined;
function belongsToApp(url: URL): boolean {
  if (DEV_SERVER) return url.origin === DEV_SERVER;
  return url.protocol === "app:" && url.host === "acme";
}
// `--path /design?theme=dark#buttons` opens the web app at that address, as a browser would.
const START = process.argv[process.argv.indexOf("--path") + 1];
const startPath = process.argv.includes("--path") && START ? START : "/";

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/** The policy for the built app: its own files, and only the inline scripts index.html has. */
function contentSecurityPolicy(html: string): string {
  const hashes = [...html.matchAll(/<script\b(?![^>]*\ssrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) =>
      `'sha256-${createHash("sha256")
        .update(match[1] ?? "")
        .digest("base64")}'`,
  );
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function serveWebApp(): void {
  const index = path.join(WEB, "index.html");
  const html = readFileSync(index, "utf8");
  const policy = contentSecurityPolicy(html);
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    if (!belongsToApp(url)) return new Response(null, { status: 404 });
    const { pathname } = url;
    const file = path.join(WEB, decodeURIComponent(pathname));
    // Nothing outside the web app, however the path is written.
    if (!file.startsWith(WEB + path.sep) && file !== WEB) {
      return new Response("Not found", { status: 404 });
    }
    // A path without a file extension is a page of the app, such as /design.
    if (path.extname(file) === "" || file === index) {
      return new Response(html, {
        headers: { "content-type": "text/html", "content-security-policy": policy },
      });
    }
    return net.fetch(pathToFileURL(file).toString());
  });
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    title: "Acme",
    webPreferences: {
      // Electron's defaults, stated so that a change to them is a visible decision: the page
      // runs like a web page, with no Node.js and no access to Electron's internals.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.once("ready-to-show", () => window.show());
  const base = DEV_SERVER ?? ORIGIN;
  const page = new URL(startPath, base);
  void window.loadURL(belongsToApp(page) ? page.href : base);
}

// Every window and frame: no new windows, no navigation away from the app, and links to
// websites open in the browser instead.
app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) void shell.openExternal(url);
    return { action: "deny" };
  });
  contents.on("will-navigate", (event, url) => {
    if (belongsToApp(new URL(url))) return;
    event.preventDefault();
    if (url.startsWith("https:")) void shell.openExternal(url);
  });
});

app.enableSandbox();
app.on("window-all-closed", () => app.quit());
// Electron emits ready after the entry module has finished evaluating.
void app.whenReady().then(() => {
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  if (!DEV_SERVER) serveWebApp();
  createWindow();
});
