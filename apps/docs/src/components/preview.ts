// The preview tabs of a component page (PreviewTabs.astro): ARIA tabs with a roving tabindex,
// whose choice holds on every page of the site, and the clips of the pictures in them, which play
// only when asked to. The tab chosen last is selected before the page is painted, by the script
// inline in PreviewTabs.astro; this handles every choice after that.

/** Where the tab chosen last is kept. The inline script reads it too. */
export const STORAGE_KEY = "xds-docs:preview";

export function setUpPreview(block: HTMLElement) {
  const tabs = [...block.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panel = (tab: HTMLElement) =>
    block.querySelector<HTMLElement>(`[data-panel="${tab.dataset.tab}"]`);

  const select = (chosen: HTMLButtonElement) => {
    for (const tab of tabs) {
      const selected = tab === chosen;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const shown = panel(tab);
      if (!shown) continue;
      shown.hidden = !selected;
      // A clip stops with its tab, rather than play on where no one sees it.
      if (!selected) {
        for (const figure of shown.querySelectorAll<HTMLElement>("[data-clip]")) stop(figure);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, chosen.dataset.tab ?? "live");
    } catch {
      // Storage can be turned off, or full; the choice then lasts for this page only.
    }
  };

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const to = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1 }[
        event.key
      ];
      if (to === undefined) return;
      event.preventDefault();
      // The arrows go round, from the last tab to the first and back.
      const next = tabs.at(to % tabs.length);
      if (!next) return;
      select(next);
      next.focus();
    });
  }

  for (const figure of block.querySelectorAll<HTMLElement>("[data-clip]")) setUpClip(figure);
}

// ---------------------------------------------------------------- clips

/** The mode the site is in, which Starlight keeps on the root element. */
const mode = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** Each clip that plays, by its figure. */
const playing = new Map<HTMLElement, HTMLVideoElement>();
let watching = false;

function setUpClip(figure: HTMLElement) {
  figure.querySelector("button[aria-pressed]")?.addEventListener("click", () => {
    if (playing.has(figure)) stop(figure);
    else play(figure);
  });
  for (const video of figure.querySelectorAll("video")) {
    video.addEventListener("ended", () => stop(figure));
  }
  if (watching) return;
  watching = true;
  // A change of the site's mode while a clip plays carries on in the other mode's clip, as the
  // still changes with it.
  new MutationObserver(() => {
    for (const [each, video] of playing) {
      if (video.dataset.mode === mode()) continue;
      video.pause();
      play(each, video.currentTime);
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

/** Plays the clip of the site's mode, from `time`. */
function play(figure: HTMLElement, time = 0) {
  const video = figure.querySelector<HTMLVideoElement>(`video[data-mode="${mode()}"]`);
  if (!video) return;
  // Set only now: a browser fetches a video's poster even while the video is hidden, which would
  // download the other mode's still for nothing. It is the still on show, so it is in the cache.
  video.poster = video.dataset.poster ?? "";
  video.currentTime = time;
  playing.set(figure, video);
  figure.dataset.playing = "";
  figure.querySelector("button[aria-pressed]")?.setAttribute("aria-pressed", "true");
  // A clip that cannot play leaves the still. A play cut short by a change of mode is not one.
  video.play().catch(() => {
    if (playing.get(figure) === video) stop(figure);
  });
}

/** Stops the clip and shows the still again, which is its last frame. */
function stop(figure: HTMLElement) {
  for (const video of figure.querySelectorAll("video")) video.pause();
  playing.delete(figure);
  delete figure.dataset.playing;
  figure.querySelector("button[aria-pressed]")?.setAttribute("aria-pressed", "false");
}
