# xds as a library

The CLI ships the theme contract and can check a custom theme file. The web, Compose and React Native channels are built: [the web library](web-library.md), [the Compose library](compose-library.md) and [the React Native library](react-native-library.md) describe their packages and how an app uses them. The GPUI channel's crates are built and checked, and not yet published: [the GPUI library](gpui-library.md) describes them. The other platform packages below are planned, and apps on those platforms get the components through `xds create`. The [CLI guide](cli.md#xds-check-theme-file) describes the theme file format and the [changelog](../CHANGELOG.md) tracks changes across channels.

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
| npm, React Native | React Native and Expo apps | One | Installs it, wraps the app in the theme provider, imports components | React Native; the safe-area and SVG libraries |
| crates.io | GPUI desktop apps | Components, tokens | Adds the dependency and registers the theme at startup | The GPUI component kit, at one exact version per release |
| Maven Central | Compose Multiplatform apps (Android, iOS, desktop JVM) | One multiplatform library | Adds the dependency and wraps content in the theme | Compose Multiplatform, Kotlin |
| pub.dev | Flutter apps | Components, tokens | Adds the dependency and wraps the app in the theme | Flutter |
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
| npm, web | Nothing: built in L1 ([the web library](web-library.md)) |
| npm, React Native | Nothing: built in L3 ([the React Native library](react-native-library.md)) |
| crates.io | Publication: the crates are built and checked in L4 ([the GPUI library](gpui-library.md)), and publishing them is a step of the release still to come |
| Maven Central | Nothing: built in L2 ([the Compose library](compose-library.md)) |
| pub.dev | Build and publish the Flutter component and token packages, and verify them in an external app |

## Names and ownership

The maintainer owns the GitHub repository and npm scope. The crates.io and pub.dev package records were checked again on 2026-11-20. Those registries assign names on first publication. A lookup returning no package leaves ownership open.

| Channel | Proposed | State | Notes |
| --- | --- | --- | --- |
| npm scope | `@xds` | Registered on 2026-11-16 as an npm organization of the maintainer | Every npm package is published under it |
| npm packages | `@xds/react`, `@xds/solid`, `@xds/vue`, `@xds/svelte`, `@xds/core`, `@xds/tokens`, `@xds/react-native` | Held by the scope. The web packages are built by `npm/web/build.ts` and published with the CLI's release | The unscoped name `xds` is taken by an unrelated Vue state library, so nothing is published unscoped |
| crates.io | `xds-ui`, `xds-tokens` | Unregistered. The L4 crates are built and checked under these names | Claimed when the L4 crates are first published. The unsuffixed `xds` belongs to another crate |
| Maven Central | group `io.github.kjmin-dev`, artifact `xds-ui` | The group corresponds to the maintainer’s GitHub account. The release workflow builds and checks the artifacts | Verify the namespace in Central Portal and set the publishing secrets before the first tag, then [rehearse the release](cli.md#rehearsing-a-release), which has Central validate the signed artifacts. [Namespace verification](https://central.sonatype.org/register/namespace/) |
| pub.dev | `xds_ui`, `xds_tokens` | Unregistered | Claim with the first functional L5 packages. A verified publisher needs a domain |
| GitHub | `kjmin-dev/xds` | Owned | The source of truth for every channel |

The Rust and Dart channels each need their first usable release before both package names can be recorded as held. pub.dev prohibits publication solely to reserve a name. [Cargo publishing guide](https://doc.rust-lang.org/cargo/reference/publishing.html), [pub.dev naming policy](https://pub.dev/policy#name-squatting).

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
- **System-drawn pieces stay the system's.** Where the platform draws a piece, the theme reaches only as far as the platform lets it, and the contract's differences say so.

### How a theme reaches each channel

| Channel | Carrier | Scope of a subtree theme |
| --- | --- | --- |
| Web | Custom properties, set by a stylesheet or a provider | Any element |
| React Native | A provider holding the theme value | Any subtree |
| GPUI | A theme value registered with the app | None: the theme applies to the app. GPUI has no context that reaches a subtree together with the overlays opened from it |
| Compose | The theme composable | Any subtree |
| Flutter | A theme extension | Any subtree |

The L0 CLI checks a theme file against the versioned contract and all contrast pairs. Each channel adds its runtime carrier in its own phase. `xds export-theme` checks the file the same way and writes it for a channel: on the web, as a stylesheet that applies to the elements carrying `data-xds-theme="<name>"`; for Compose (`--format compose`), as a Kotlin `Theme` value that the theme composable takes; for React Native (`--format react-native`), as a TypeScript `Theme` value that the theme provider takes; for GPUI (`--format gpui`), as a Rust `Theme` constant that the app registers with the components. Scaffolded projects can already generate color ramps from a hue.

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
- The root `CHANGELOG.md` is shared by all channels. Each entry names the affected channels. The release workflow takes its GitHub release notes from the section for the tagged version.
- A scaffolded project records its creation version in `.xds.json` as `createdWith`. Older records retain their last known writer in `xds`.

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
- A channel is `preview` while any platform peer or behavior dependency it relies on is itself a prerelease or 0.x with a record of breaking changes. Today that is the web channel (its behavior library is on a prerelease), the GPUI channel (its toolkit is 0.x), the Compose channel (a date picker's value is a kotlinx-datetime `LocalDate`, and kotlinx-datetime is 0.x) and the React Native channel (React Native is 0.x). It becomes `stable` when that dependency does.

### Support windows

- Each release states, per channel, the range of platform peer versions it was tested against. The lower bound moves only as the table above allows.
- The GPUI channel's window is a single version of the toolkit, since the toolkit does not keep compatibility between releases.
- A new major version of a platform peer is supported in a minor release once the checks pass on it.

### Prereleases

A change that needs trying before it is promised goes out as a prerelease of the next version on every channel at once, under each registry's prerelease marking. Prereleases carry no compatibility promise between each other.

## Order of work

Glass material tokens and the Flutter scaffold are in the template. The L0 contract, checker, version source and changelog are implemented. Registry ownership is recorded above. The CLI release workflow ships the binary and its npm launchers. Each library channel joins the same tag when its external consumer check passes. L1 is implemented: the release workflow builds the web packages, runs their consumer check (`npm/web/consumer.ts`) and publishes them with the CLI. L2 is implemented: the release workflow builds and signs the Compose library, runs its consumer check (`maven/consumer.ts`) on the desktop and on Android, and uploads it to Maven Central. L3 is implemented: the release workflow builds the React Native package, runs its consumer check (`npm/react-native/consumer.ts`) in an Expo app and in apps on the oldest and newest supported React Native, and publishes it to npm. The date picker draws its calendar from the tokens, so the package has no calendar peer. L4 is implemented up to publication: the release workflow packages the GPUI crates, runs their consumer check (`crates-io/consumer.ts`) on macOS, and keeps the checked `.crate` files. Publishing them to crates.io is the step still to come.

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

Each phase adds its channel to the continuous checks: the package is built, installed into a project that is not part of the xds workspace, and compared with the scaffolded app. CI runs these checks on every change, without the Android emulator and iOS, and the release workflow runs them whole. A channel that is not checked this way is not published. A run of the release workflow started by hand [rehearses a release](cli.md#rehearsing-a-release): it runs every check, checks the publishing secrets, has Maven Central validate the library, and publishes nothing.

## Not in this design

- Publishing the sample apps, or a hosted component playground beyond the documentation site.
- A Swift package. A SwiftUI app can host the Compose library, and that is revisited if someone asks for it.
- Private registries and mirrors. The packages are ordinary and can be mirrored like any other.
- Paid or closed components.
