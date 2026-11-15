# xds as a library

Status: a design, not yet built. Today xds reaches an app only one way: `xds create` copies the sources into a new project. This document defines a second way, in which an existing app installs xds from its platform's package registry and imports the components. It fixes the concepts, the names, the customization model, the version policy and the order of work. It names no files and no build tools on purpose, so that it stays true while the code moves.

## Two ways to take xds

| | Scaffold (exists) | Library (this design) |
| --- | --- | --- |
| What the app receives | The sources: tokens, components, sample apps | Built packages from a registry |
| Who owns the components afterwards | The app. It edits them freely | xds. The app configures them |
| How the app gets a fix | By hand, from the template's history | By raising a version |
| How far the look can change | Without limit | As far as the customization model below reaches |
| Fits | A new product that wants its own design system | An existing app that wants components and a theme |

The two are the same components at the same version. A team may start with the library and move to the scaffold later, when it needs more than the customization model offers ("ejecting"). The reverse move is not supported, because a scaffolded project has usually changed its sources.

## Principles

1. **One source, two exits.** The library packages are built from the same sources the scaffold copies. Nothing is written twice, and no component exists in only one of the two.
2. **The contract is the unit of parity.** The component contract (names, variants, sizes, tones, and the recorded differences between clients) describes every channel. A release is complete only when every channel implements the contract of that release.
3. **One version.** Every package on every registry carries the same version number, and the CLI carries it too.
4. **The theme arrives at run time.** A scaffolded project compiles its tokens into code. A library cannot: the app's theme is not known when the library is built. So every library reads its tokens from a theme value that the app can replace, and ships the default theme inside.
5. **The library does not choose the app's tools.** An app does not have to adopt xds's styling tool, bundler, or image loader to use a component. What a library needs from the app is declared, and kept short.
6. **Customization never breaks the guarantees silently.** Contrast is checked for the built-in themes when xds is built. A custom theme can be checked with the same checker before it ships, and the documentation says which guarantees a customization layer keeps.

## Vocabulary

| Term | Meaning |
| --- | --- |
| Channel | One registry and the kind of app it serves: npm for the web, npm for React Native, crates.io, Maven Central, pub.dev |
| Package | One installable unit on a channel |
| Release train | The set of all packages published under one version number |
| Theme | A complete set of token values for both color modes |
| Theme contract | The list of token names a theme must provide, with their types. It is versioned with the release train |
| Preset | A theme that ships inside the library. `indigo` is the default preset |
| Part | A named piece of a component (a dialog's title, a slider's thumb) that an app may address. Part names are public API |
| Platform peer | Something the app must already have, at a version in a stated range: the framework, the UI toolkit |
| Support window | The range of platform peer versions a release is tested against |
| Stability level | `preview` or `stable`, per channel. It says how much the channel's own platform may still force breaking changes |

## Channels

| Channel | Serves | Packages | What the app does | Platform peers |
| --- | --- | --- | --- | --- |
| npm, web | React, Solid, Vue and Svelte apps | One per framework, one for what they share, one for tokens | Installs its framework's package, imports components, and loads one stylesheet | The framework |
| npm, React Native | React Native and Expo apps | One | Installs it, wraps the app in the theme provider, imports components | React Native; the safe-area and SVG libraries; Expo UI, optional, for DatePicker |
| crates.io | GPUI desktop apps | Components, tokens | Adds the dependency and registers the theme at startup | The GPUI component kit, at one exact version per release |
| Maven Central | Compose Multiplatform apps (Android, iOS, desktop JVM) | One multiplatform library | Adds the dependency and wraps content in the theme | Compose Multiplatform, Kotlin |
| pub.dev | Flutter apps (when the Flutter client exists) | Components, tokens | Adds the dependency and wraps the app in the theme | Flutter |
| CLI | New projects | The `xds` binary | `xds create` | None |

Decisions that hold for every channel:

- **Built output.** A package contains what its ecosystem's consumers expect to receive, compiled and with type information, not sources that only xds's own toolchain can read.
- **Dependencies inside, platform outside.** Libraries that implement behavior are ordinary dependencies of the package, so the app never installs them itself. Only the platform peers above are asked of the app.
- **Styling without a required tool.** On the web, the package ships a finished stylesheet that works in any app. An app that already uses the styling tool xds is written with may instead take the unbuilt stylesheet and compile it with its own, to share utilities and avoid duplicate CSS. Both give the same pixels.
- **Styles stay out of the app's way.** The library's styles sit in their own cascade layer on the web, and read only their own token names everywhere, so an app's styles win where they conflict and the library never restyles the app.
- **A component the platform cannot serve degrades by itself.** Where a component needs an optional platform peer, the app that lacks the peer loses that component only.

### What each channel still needs

| Channel | Gap between today's sources and a library |
| --- | --- |
| npm, web | Built JavaScript, type declarations and a finished stylesheet; an entry in the cascade layer |
| npm, React Native | The theme moves from generated constants to a provider; the exact React Native pin becomes a range |
| crates.io | The theme moves from generated constants to a registered value; the one-to-one tie to the GPUI kit's version is documented and enforced |
| Maven Central | Publication metadata and signing; the theme accepts a color set, not only a mode |
| pub.dev | The Flutter client itself |

## Names and ownership

Checked on 2026-11-15 by querying the public registries. A name that is free today is not reserved until it is registered, and registering is the maintainer's action.

| Channel | Proposed | State | Notes |
| --- | --- | --- | --- |
| npm scope | `@xds` | No public package exists under it. Whether the scope itself is registered cannot be seen from outside | First choice. Fallback: `@xds-ui` |
| npm packages | `@xds/react`, `@xds/solid`, `@xds/vue`, `@xds/svelte`, `@xds/core`, `@xds/tokens`, `@xds/react-native` | Free | The unscoped name `xds` is taken by an unrelated Vue state library, so nothing is published unscoped |
| crates.io | `xds-ui`, `xds-tokens` | Free | `xds` is taken by an unrelated crate |
| Maven Central | group `io.github.kjmin-dev`, artifact `xds-ui` | The group is verified through the GitHub account that owns this repository | A group under a domain the maintainer controls is the alternative, verified through DNS |
| pub.dev | `xds_ui`, `xds_tokens` | Free | A verified publisher needs a domain |
| GitHub | `kjmin-dev/xds` | Owned | The source of truth for every channel |

"xDS" is also the name of a family of service-mesh APIs. The scoped and suffixed names above avoid a clash in the registries; search results will still mix the two.

The placeholder `acme` stays the name inside the template. The release build renames it to the names above, the same way `xds create` renames it to a project's name.

## Customization

### Layers

An app reaches for the first layer that does what it needs. Each layer is narrower in what it touches and weaker in what xds can still guarantee.

| Layer | What the app changes | How much | Guarantees kept |
| --- | --- | --- | --- |
| 0. Mode | Light, dark, or the system's setting; may differ for a part of the screen | A setting | All |
| 1. Preset | One of the built-in themes | A setting | All: contrast is checked for every preset |
| 2. Generated theme | An accent hue, and optionally a neutral hue and vividness. xds derives both ramps | A few numbers | Contrast, once the theme passes the checker |
| 3. Foundation | The scales every component reads: corner radius, type families and type scale, density (control heights and spacing), motion durations and easing, elevation | Token values | Parity between clients. Legibility at extreme values is the app's to check |
| 4. Semantic colors | Individual color roles (surface, text, border, status colors) in either mode | Token values | Parity. Contrast only if the theme is checked again |
| 5. Component tokens | One component's own colors and sizes | Token values | Parity. Contrast only if checked again |
| 6. Component defaults | Which variant, size or tone a component takes when the app passes none | A setting per component | All |
| 7. Instance | Layout around a component, and the platform's own styling hook on a component or one of its parts | Per use | The component's behavior and accessibility. The look is the app's |
| 8. Eject | Anything | The scaffold | None from the library: the app owns the sources |

Rules that make the layers hold together:

- **A theme is data.** Layers 1 to 5 are all expressed as one theme value: a full set of tokens, or a partial set laid over a preset. The same theme file drives every channel, so an app family with a web app and a phone app writes its brand once.
- **A theme can be scoped.** A theme or a mode may apply to a subtree as well as to the whole app, for a dark panel in a light app or a second brand in one screen.
- **Themes can change while the app runs.** Switching mode or theme does not need a rebuild or a restart.
- **Parts are the stable handle.** Layer 7 addresses a component through its documented parts and states. What is not a documented part is internal and may change in any release.
- **Not offered inside the library:** new variants, sizes or tones for an existing component, and changes to a component's structure or behavior. An app wraps the component, or ejects. Keeping these out is what lets the contract promise the same component on every client.
- **System-drawn pieces stay the system's.** Where the platform draws a piece (the calendar on iOS and Android), the theme reaches only as far as the platform lets it, and the contract's differences say so.

### How a theme reaches each channel

| Channel | Carrier | Scope of a subtree theme |
| --- | --- | --- |
| Web | Custom properties, set by a stylesheet or a provider | Any element |
| React Native | A provider holding the theme value | Any subtree |
| GPUI | A theme value registered with the app | A window; a subtree where the toolkit allows |
| Compose | The theme composable | Any subtree |
| Flutter | A theme extension | Any subtree |

The CLI turns a theme file into each carrier's form, and runs the contrast check on it. It already generates themes from a hue for scaffolded projects.

### Against other systems

The aim is to offer no less than the systems apps already know, short of changing a component's structure.

| Capability | Material UI | Chakra UI | Mantine | Radix Themes | Material 3 (Compose, Flutter) | xds library |
| --- | --- | --- | --- | --- | --- | --- |
| Light and dark, scoped | Yes | Yes | Yes | Yes | Yes | Layer 0 |
| Brand color from one input | Partly | No | Yes | Yes (accent) | Yes (seed color) | Layer 2 |
| Radius, type, spacing scales | Yes | Yes | Yes | Yes (radius, scaling) | Yes (shapes, typography) | Layer 3 |
| Semantic color roles | Yes | Yes | Yes | Partly | Yes | Layer 4 |
| Per-component tokens | Yes | Yes (recipes) | Yes | No | Yes (component defaults) | Layer 5 |
| Default props per component | Yes | Yes | Yes | No | No | Layer 6 |
| Style hook on parts | Yes (slots) | Yes | Yes | Class name | Modifier, style | Layer 7 |
| New variants in the theme | Yes | Yes | Yes | No | No | No: wrap or eject |
| One theme across web and native | No | No | No | No | Per toolkit | Yes |
| Contrast checked for a custom theme | No | No | No | Built-in scales only | No | Yes, by the checker |
| Take the sources | No | No | No | No | No | Layer 8 |

The one deliberate gap is new variants declared in the theme. It is the feature that makes two apps' "Button" differ in ways a shared contract cannot describe.

## Versions

### One number

- Every package on every channel, and the CLI, share one version, following semantic versioning.
- A release publishes every channel, including channels with no change of their own. "Is my phone app on the same xds as my web app" is then answered by comparing two numbers.
- There is one changelog. Each entry says which channels it touches.
- A scaffolded project records the version it was created from, so its distance from the current release can be told.

### What counts as breaking

| Change | Level |
| --- | --- |
| Removing or renaming a component, an option, a value, a part, or a token in the theme contract | Major |
| Changing what an option does | Major |
| Raising the lower bound of a platform peer | Major, except on a `preview` channel |
| A new component, option, value, part or token (with a default in every preset) | Minor |
| A visible change to a component's look with the default theme | Minor, called out in the changelog with a picture |
| A fix that restores documented behavior or look | Patch |
| Widening a support window upward | Patch |

Before 1.0 the same table applies one level down: what would be major is a minor, and the rest are patches.

### Deprecation

Something to be removed is first marked deprecated in a minor release, keeps working for at least one more minor release, and is removed in the next major. The changelog names the replacement. A token rename ships both names for the deprecation period.

### Stability levels

A channel's platform sometimes forces breaks that xds does not choose: a UI toolkit on 0.x, or a behavior library on a prerelease.

- A `stable` channel follows the table above without exception.
- A `preview` channel has the same version number and the same contract, but may raise or change its platform peer in a minor release. It is published under the registry's prerelease marking where the registry has one.
- A channel is `preview` while any platform peer or behavior dependency it relies on is itself a prerelease or 0.x with a record of breaking changes. Today that is the web channel (its behavior library is on a prerelease) and the GPUI channel (its toolkit is 0.x). It becomes `stable` when that dependency does.

### Support windows

- Each release states, per channel, the range of platform peer versions it was tested against. The lower bound moves only as the table above allows.
- The GPUI channel's window is a single version of the toolkit, since the toolkit does not keep compatibility between releases.
- A new major version of a platform peer is supported in a minor release once the checks pass on it.

### Prereleases

A change that needs trying before it is promised goes out as a prerelease of the next version on every channel at once, under each registry's prerelease marking. Prereleases carry no compatibility promise between each other.

## Order of work

The library work runs beside the existing roadmap (the React Native date picker, glass, the desktop shells, Flutter), not ahead of it. Two dependencies set the order: the theme contract should be fixed after glass adds its material tokens, and the pub.dev channel needs the Flutter client.

| Phase | Work | Done when | Depends on |
| --- | --- | --- | --- |
| L0. Foundations | Register the names. Write the theme contract as data, and make the checker accept a theme file. Define the release train and the single changelog | The names are held; a custom theme file passes or fails the contrast check from the CLI | Glass tokens, for the contract's final shape |
| L1. Web | Built packages for the four frameworks and tokens; the finished and unbuilt stylesheets; layers 0 to 7 on the web | An app with no xds tooling installs the package, and its components match the scaffolded app's pixel for pixel in both modes, with the default theme and with a custom one | L0 |
| L2. Compose | Publication to Maven Central; the theme accepts a full theme value | A separate Android and desktop project consumes the artifact and renders the preview identically | L0 |
| L3. React Native | The theme provider; the peer range; the optional calendar peer | A bare React Native app and an Expo app both consume the package; the oldest and newest supported React Native pass | L0, the React Native date picker |
| L4. GPUI | The registered theme; publication | A separate crate depends on the published crate and renders the preview identically | L0 |
| L5. Flutter | Publication with the client's first release | The same as L2, for Flutter | The Flutter client |
| L6. 1.0 | Every channel `stable` or explicitly `preview`; the deprecation policy in force | One release train published from one tag by automation | L1 to L4 |

L1 goes first because the web's theme carrier already exists and its audience is the widest. L2 follows because its theme change is the smallest. L3 and L4 each need their theme moved from constants to a value, which is the largest single change in this design.

Each phase adds its channel to the continuous checks: the package is built, installed into a project that is not part of the xds workspace, and compared with the scaffolded app. A channel that is not checked this way is not published.

## Not in this design

- Publishing the sample apps, or a hosted component playground beyond the documentation site.
- A Swift package. A SwiftUI app can host the Compose library, and that is revisited if someone asks for it.
- Private registries and mirrors. The packages are ordinary and can be mirrored like any other.
- Paid or closed components.
