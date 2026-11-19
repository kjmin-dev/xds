import type { Mode } from "../captures.ts";

/** The captures this task knows how to take. */
export type CaptureName = "navigation" | "sheet" | "datepicker" | "daterange";

/** What a platform drew for one capture: a PNG per mode, and a recording per mode for a clip. */
export type Raw = { still: Record<Mode, string>; clip?: Record<Mode, string> };

export type Taken = {
  /** Where the pictures were taken, for the caption, as captures.ts's `source` describes it. */
  source: string;
  shots: Map<CaptureName, Raw>;
};

/** The directories one platform's run works in, all under the task's build directory. */
export type Workspace = {
  /** For the platform's builds and devices: DerivedData, the AVD. */
  build: string;
  /** For the PNG files and recordings the platform draws. */
  raw: string;
  /** For the logs of every platform. */
  logs: string;
  /** For Maestro's state and its reports, shared by iOS and Android. */
  maestro: string;
};
