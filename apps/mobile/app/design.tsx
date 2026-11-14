// The design preview: every token and every component in every variant and state. The home
// screen links here; the web app has the same page at `/design`, and the desktop app opens it
// with `acme --design`.
//
// `/design?from=3` starts at the third section, for taking screenshots from a script, which
// can neither scroll nor tap. For the same reason `/design?sheet=1` opens the bottom sheet,
// `?menu=1` the menu, `?dialog=1` the dialog and `?toast=1` the toast, which then stays.

import {
  border,
  icons,
  motion,
  radius,
  size,
  space,
  colors as tokenColors,
  typography,
} from "@acme/tokens";
import {
  Avatar,
  AvatarStack,
  Badge,
  type BadgeTone,
  Banner,
  type BannerTone,
  BottomSheet,
  Button,
  type ButtonVariant,
  Card,
  Checkbox,
  Chip,
  ChipBar,
  type ControlSize,
  CountBadge,
  Dialog,
  Divider,
  Icon,
  IconButton,
  type IconName,
  type IconSize,
  ListRow,
  Menu,
  ProgressBar,
  SearchField,
  SegmentedControl,
  Skeleton,
  Spinner,
  Switch,
  TabBar,
  Tabs,
  Text,
  TextField,
  type TextVariant,
  Toast,
  TopBar,
  useColors,
} from "@acme/ui-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { type ReactNode, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ControlSize[] = ["sm", "md", "lg"];
// `overlay` is not in the row of tones: it is made for pictures and is shown on blocks below.
const BADGE_TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger"];
const BANNER_TONES: BannerTone[] = ["info", "success", "warning", "danger"];
const ICON_SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
/** Icons made of closed shapes, which is what `filled` is for. */
const FILLABLE_ICONS: IconName[] = ["heart", "star", "bookmark", "thumbs-up", "bell"];
const TEXT_VARIANTS: TextVariant[] = [
  "display",
  "title",
  "heading",
  "body",
  "body-strong",
  "label",
  "detail",
  "footnote",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title" heading>
        {title}
      </Text>
      {children}
    </View>
  );
}

const kebab = (name: string) => name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);

/** Semantic colors by group. Component colors are shown by the components that use them. */
const COMPONENT_COLORS =
  /^(button|field|badge|banner|card|switch|checkbox|segmented|avatar|progress|listRow|topBar|tabBar|sheet|chip|tabs|menu|dialog|toast|tooltip|skeleton)/;

// The preview works offline, so its picture ships with it: a 16 by 16 gradient, scaled up.
const PICTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAn0lEQVR42mNITvuYkfY+N/1tUfrrsoyX1RnPGzKetmY+7sp82J91f3LW3RlZt+dm31yUfX15ztU1OVcYSFK9IecSA0mqt+ZeYCBJ9a7ccwwkqd6fd4aBJNVH8k4xkKT6ZN4JBpJUn80/xkCS6kv5RxhIUn294BADSarvFBxgIEn1w4J9DCSpfla4h4Ek1a8KdzGQpPp90Q4GklR/KdoGANKd6y5LxwwKAAAAAElFTkSuQmCC";
/** Not a picture at all, to show an avatar whose picture fails. */
const BROKEN_PICTURE = "data:image/png;base64,AAAA";

const PEOPLE = [
  { name: "Ada Lovelace", src: PICTURE },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Margaret Hamilton" },
  { name: "Hedy Lamarr" },
];

const FOLDERS: { key: string; title: string; description?: string }[] = [
  { key: "inbox", title: "Inbox", description: "3 unread" },
  { key: "drafts", title: "Drafts" },
  { key: "archive", title: "Archive" },
];

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

const TABS = [
  {
    key: "home",
    label: "Home",
    icon: (color: string) => <Icon name="house" size="lg" color={color} />,
  },
  {
    key: "search",
    label: "Search",
    icon: (color: string) => <Icon name="search" size="lg" color={color} />,
  },
  {
    key: "profile",
    label: "Profile",
    icon: (color: string) => <Icon name="user" size="lg" color={color} />,
  },
] as const;
/** More kinds than fit across a phone, so the bar has something to scroll. */
const KINDS: { key: string; label: string; icon?: IconName }[] = [
  { key: "all", label: "All" },
  { key: "photos", label: "Photos", icon: "image" },
  { key: "videos", label: "Videos", icon: "video" },
  { key: "documents", label: "Documents", icon: "file-text" },
  { key: "music", label: "Music", icon: "music" },
  { key: "links", label: "Links", icon: "link" },
  { key: "places", label: "Places", icon: "map-pin" },
];

const PAGES = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "members", label: "Members" },
  { value: "settings", label: "Settings" },
] as const;

const PAGES_WITH_ICONS = [
  { value: "overview", label: "Overview", icon: "layout-grid" },
  { value: "activity", label: "Activity", icon: "list" },
  { value: "members", label: "Members", icon: "users" },
  { value: "settings", label: "Settings", icon: "settings" },
] as const;

const COLOR_NAMES = (Object.keys(tokenColors.light) as (keyof typeof tokenColors.light)[]).filter(
  (name) => !COMPONENT_COLORS.test(name),
);

export default function Design() {
  const colors = useColors();
  const [value, setValue] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("week");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("home");
  const [starred, setStarred] = useState(true);
  const [liked, setLiked] = useState(true);
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState("72");
  const [bio, setBio] = useState("Wrote the first program.");
  const [bannerShown, setBannerShown] = useState(true);
  const [folder, setFolder] = useState("inbox");
  const [picked, setPicked] = useState(false);
  const [muted, setMuted] = useState(true);
  const [search, setSearch] = useState("");
  const [found, setFound] = useState("quarterly report");
  const [kinds, setKinds] = useState<readonly string[]>(["photos"]);
  const [page, setPage] = useState<(typeof PAGES)[number]["value"]>("overview");
  const [pinned, setPinned] = useState(true);
  const params = useLocalSearchParams<{
    from?: string;
    sheet?: string;
    menu?: string;
    dialog?: string;
    toast?: string;
  }>();
  const from = Number(params.from ?? 1);
  const [sheet, setSheet] = useState(params.sheet === "1");
  const [dialog, setDialog] = useState(params.dialog === "1");
  const [toast, setToast] = useState(params.toast === "1");

  const sections = [
    <Section key="colors" title="Colors">
      <View style={styles.swatches}>
        {COLOR_NAMES.map((name) => (
          <View key={name} style={styles.swatch}>
            <View
              style={[
                styles.chip,
                { backgroundColor: colors[name], borderColor: colors.borderDefault },
              ]}
            />
            <Text variant="footnote" tone="secondary" style={styles.swatchName}>
              {kebab(name)}
            </Text>
          </View>
        ))}
      </View>
    </Section>,

    <Section key="text" title="Typography">
      {TEXT_VARIANTS.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant} · 다람쥐 헌 쳇바퀴 Quick fox 123
        </Text>
      ))}
    </Section>,

    <Section key="sizes" title="Space, radius, size">
      <View style={styles.row}>
        {Object.entries(space)
          .sort(([, a], [, b]) => a - b)
          .map(([name, points]) => (
            <View key={name} style={styles.sample}>
              <View
                style={{ width: points, height: points, backgroundColor: colors.accentDefault }}
              />
              <Text variant="footnote" tone="secondary">
                {name.replace("_", ".")}
              </Text>
            </View>
          ))}
      </View>
      <View style={styles.row}>
        {Object.entries(radius).map(([name, points]) => (
          <View
            key={name}
            style={[styles.radius, { borderRadius: points, borderColor: colors.borderStrong }]}
          >
            <Text variant="footnote" tone="secondary">
              {name}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="detail" tone="secondary">
        Body {typography.body.fontSize}/{typography.body.lineHeight}. Control heights: touch{" "}
        {size.touch.controlSm}/{size.touch.controlMd}/{size.touch.controlLg}, pointer{" "}
        {size.pointer.controlSm}/{size.pointer.controlMd}/{size.pointer.controlLg}. The mobile app
        uses the touch sizes.
      </Text>
    </Section>,

    <Section key="icons" title="Icons">
      <View style={styles.row}>
        {(Object.keys(icons) as IconName[]).map((name) => (
          <Icon key={name} name={name} label={name} />
        ))}
      </View>
      <View style={[styles.row, styles.end]}>
        {ICON_SIZES.map((iconSize) => (
          <Icon key={iconSize} name="house" size={iconSize} label={`house, ${iconSize}`} />
        ))}
      </View>
      <View style={styles.row}>
        {FILLABLE_ICONS.map((name) => (
          <View key={name} style={styles.pair}>
            <Icon name={name} />
            <Icon name={name} filled label={`${name}, filled`} />
          </View>
        ))}
      </View>
    </Section>,

    <Section key="buttons" title="Buttons">
      {VARIANTS.map((variant) => (
        <View key={variant} style={styles.row}>
          {SIZES.map((buttonSize) => (
            <Button key={buttonSize} variant={variant} size={buttonSize} label="Save" />
          ))}
          <Button variant={variant} label="Off" disabled />
          <Button variant={variant} label="Saving" loading />
        </View>
      ))}
      <Button variant="primary" label="Full width" fullWidth />
      <View style={styles.row}>
        <Button size="sm" iconStart="plus" label="New" />
        <Button variant="primary" iconEnd="arrow-right" label="Next" />
        <Button size="lg" iconStart="download" iconEnd="chevron-down" label="Export" />
        <Button variant="primary" iconStart="cloud-upload" label="Uploading" loading />
      </View>
      {/* Toggles: press them. The filled icon and the outline say "on", not the tint alone. */}
      <View style={styles.row}>
        <Button
          iconStart="star"
          label={starred ? "Starred" : "Star"}
          selected={starred}
          onPress={() => setStarred(!starred)}
        />
        <Button
          variant="ghost"
          iconStart="heart"
          label={liked ? "Liked" : "Like"}
          selected={liked}
          onPress={() => setLiked(!liked)}
        />
        <Button iconStart="bookmark" label="Saved" selected disabled />
      </View>
      {/* The same variants and sizes, holding only an icon. */}
      {VARIANTS.map((variant) => (
        <View key={variant} style={styles.row}>
          {SIZES.map((buttonSize) => (
            <IconButton
              key={buttonSize}
              variant={variant}
              size={buttonSize}
              icon="pencil"
              label={`Edit, ${buttonSize}`}
            />
          ))}
          <IconButton variant={variant} icon="pencil" label="Edit, disabled" disabled />
          <IconButton variant={variant} icon="pencil" label="Saving" loading />
        </View>
      ))}
      <View style={styles.row}>
        <IconButton
          icon="bell"
          label="Mute notifications"
          selected={muted}
          onPress={() => setMuted(!muted)}
        />
        <IconButton
          variant="secondary"
          icon="star"
          label="Star"
          selected={starred}
          onPress={() => setStarred(!starred)}
        />
        <IconButton icon="bookmark" label="Saved" selected disabled />
      </View>
    </Section>,

    <Section key="fields" title="Text fields">
      <TextField
        label="Email"
        placeholder="name@example.com"
        description="We send the sign-in code to this address."
        value={value}
        onChange={setValue}
      />
      <TextField
        label="Sign-in code"
        value="12345"
        onChange={() => {}}
        error="That code is wrong or has expired."
      />
      <TextField label="Organization" value="Acme Inc." onChange={() => {}} disabled />
      <TextField
        label="Search"
        placeholder="People and teams"
        value={query}
        onChange={setQuery}
        leading={<Icon name="search" />}
        trailing={
          <Button
            variant="ghost"
            size="sm"
            iconStart="x"
            accessibilityLabel="Clear the search"
            onPress={() => setQuery("")}
          />
        }
      />
      <TextField
        label="Weight"
        value={weight}
        onChange={setWeight}
        keyboardType="decimal-pad"
        trailing={<Text>kg</Text>}
      />
      <TextField
        label="About you"
        description="Shown on your profile."
        value={bio}
        onChange={setBio}
        multiline
        rows={3}
        maxLength={80}
        leading={<Icon name="pencil" />}
      />
      <SearchField
        label="Search people"
        placeholder="Search people"
        value={search}
        onChange={setSearch}
      />
      <SearchField label="Search files" value={found} onChange={setFound} onSubmit={() => {}} />
      <SearchField
        label="Search the archive"
        placeholder="Unavailable offline"
        value=""
        onChange={() => {}}
        disabled
      />
    </Section>,

    <Section key="selection" title="Selection">
      <View style={styles.row}>
        <Switch checked={notifications} onChange={setNotifications} label="Notifications" />
        <Switch checked={false} onChange={() => {}} label="Off" />
        <Switch checked onChange={() => {}} label="Locked" disabled />
      </View>
      <View style={styles.row}>
        <Checkbox checked={agreed} onChange={setAgreed} label="Remember me" />
        <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
        <Checkbox checked onChange={() => {}} label="Locked" disabled />
      </View>
      <SegmentedControl
        options={VIEWS}
        value={view}
        onChange={setView}
        accessibilityLabel="Calendar view"
      />
      <SegmentedControl
        options={VIEWS}
        value={view}
        onChange={setView}
        accessibilityLabel="Calendar view"
        fullWidth
      />
    </Section>,

    <Section key="chips" title="Chips">
      <View style={styles.row}>
        <Chip label="Unselected" />
        <Chip label="Selected" selected />
        <Chip label="With icon" iconStart="flag" />
        <Chip label="Selected" iconStart="flag" selected />
        <Chip label="Off" disabled />
        <Chip label="Off" selected disabled />
      </View>
      {/* Press them: the bar holds no state, the screen does. */}
      <ChipBar label="Kind of file">
        {KINDS.map((kind) => {
          const on = kinds.includes(kind.key);
          return (
            <Chip
              key={kind.key}
              label={kind.label}
              {...(kind.icon ? { iconStart: kind.icon } : {})}
              selected={on}
              onPress={() =>
                setKinds(on ? kinds.filter((key) => key !== kind.key) : [...kinds, kind.key])
              }
            />
          );
        })}
      </ChipBar>
    </Section>,

    <Section key="tabs" title="Tabs">
      <Tabs items={PAGES} value={page} onChange={setPage} label="Project pages" />
      <Tabs items={PAGES_WITH_ICONS} value={page} onChange={setPage} label="Project pages" />
      <Tabs
        items={PAGES.slice(0, 3)}
        value={page}
        onChange={setPage}
        label="Project pages"
        fullWidth
      />
    </Section>,

    <Section key="badges" title="Badges">
      <View style={styles.row}>
        {BADGE_TONES.map((tone) => (
          <Badge key={tone} tone={tone} label={tone} />
        ))}
      </View>
      <View style={styles.row}>
        <Badge tone="success" label="Online" dot />
        <Badge tone="warning" label="Connecting" dot />
        <Badge tone="danger" label="Offline" dot />
      </View>
      <View style={styles.row}>
        <Badge tone="success" icon="check" label="Verified" />
        <Badge tone="accent" icon="star" label="Featured" />
        <Badge tone="warning" icon="clock" label="Pending" dot />
      </View>
      {/* The overlay tone is the same in both modes, so it is shown on the darkest and on the
          lightest page color, whichever mode the preview is in. */}
      <View style={styles.row}>
        <View style={[styles.block, { backgroundColor: tokenColors.dark.backgroundBase }]}>
          <Badge tone="overlay" label="overlay" />
          <Badge tone="overlay" icon="clock" label="3:24" />
        </View>
        <View
          style={[
            styles.block,
            {
              backgroundColor: tokenColors.light.backgroundBase,
              borderColor: colors.borderDefault,
            },
          ]}
        >
          <Badge tone="overlay" label="overlay" />
          <Badge tone="overlay" icon="clock" label="3:24" />
        </View>
      </View>
      <View style={styles.row}>
        <CountBadge count={3} />
        <CountBadge count={120} />
        <CountBadge count={3} label="3 unread notifications">
          <Icon name="bell" size="lg" />
        </CountBadge>
        <CountBadge count={120} label="More than 99 messages">
          <Avatar name="Ada Lovelace" size="lg" />
        </CountBadge>
        <CountBadge count={2} label="2 items in the cart">
          <Button iconStart="shopping-cart" label="Cart" />
        </CountBadge>
        {/* Nothing to count: the icon is drawn alone. */}
        <CountBadge count={0}>
          <Icon name="mail" size="lg" />
        </CountBadge>
      </View>
    </Section>,

    <Section key="banners" title="Banners">
      {BANNER_TONES.map((tone) => (
        <Banner key={tone} tone={tone} title={tone}>
          Your changes are saved on this device.
        </Banner>
      ))}
      {bannerShown ? (
        <Banner
          tone="info"
          title="A new version is ready"
          action={{ label: "Restart now", onPress: () => {} }}
          onDismiss={() => setBannerShown(false)}
          dismissLabel="Dismiss the update notice"
        >
          Restart the app to get it.
        </Banner>
      ) : (
        <Button label="Show the dismissed banner" onPress={() => setBannerShown(true)} />
      )}
      <Banner tone="warning" onDismiss={() => {}}>
        You are offline.
      </Banner>
    </Section>,

    <Section key="card" title="Card">
      <Card
        title="Weekly report"
        description="Updated a few minutes ago."
        actions={<Badge tone="success" label="Online" dot />}
      >
        <Text tone="secondary">A card groups related content.</Text>
        <Divider />
        <View style={styles.row}>
          <Spinner size="sm" />
          <Spinner label="Loading" />
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar name="Alan Turing" size="xl" />
        </View>
        {/* A picture, and a picture that fails: the second falls back to the initials. */}
        <View style={styles.row}>
          <Avatar name="Ada Lovelace" src={PICTURE} />
          <Avatar name="Ada Lovelace" size="xl" src={PICTURE} />
          <Avatar name="Grace Hopper" size="xl" src={BROKEN_PICTURE} />
        </View>
        <View style={styles.row}>
          <AvatarStack people={PEOPLE.slice(0, 3)} />
          <AvatarStack people={PEOPLE} />
          <AvatarStack people={PEOPLE} max={2} size="lg" label="Six people are editing" />
        </View>
        <ProgressBar value={0.6} label="Upload" />
      </Card>
      <Card
        title="With a picture"
        description="The picture runs to the card's edges."
        media={
          <View>
            <Image source={{ uri: PICTURE }} resizeMode="cover" style={styles.picture} />
            <View style={styles.onPicture}>
              <Badge tone="overlay" icon="clock" label="3:24" />
            </View>
          </View>
        }
      >
        <Text tone="secondary">The badge on it uses the overlay tone.</Text>
      </Card>
      <Card
        title="Pressable"
        description={picked ? "Selected. Press to clear." : "The whole card is one button."}
        selected={picked}
        onPress={() => setPicked(!picked)}
      />
      <Card title="Selected" description="A heavier outline, at the same size." selected />
    </Section>,

    <Section key="list" title="List">
      <Card flush>
        <ListRow
          leading={<Avatar name="Ada Lovelace" />}
          title="Ada Lovelace"
          description="ada@example.com"
          trailing={<Badge tone="accent" label="Owner" />}
        />
        <Divider />
        <ListRow
          title="Notifications"
          description="Mentions and replies"
          trailing={
            <Switch
              checked={notifications}
              onChange={setNotifications}
              accessibilityLabel="Notifications"
            />
          }
        />
        <Divider />
        <ListRow
          title="Language"
          trailing={<Text tone="secondary">English</Text>}
          chevron
          onPress={() => {}}
        />
        <Divider />
        <ListRow
          title="Storage"
          description="Unavailable offline"
          chevron
          onPress={() => {}}
          disabled
        />
        <Divider />
        <ListRow
          leading={<Icon name="palette" />}
          title="Appearance"
          description="The row you are on"
          selected
          onPress={() => {}}
        />
      </Card>
      {/* Compact rows, as in a menu: press one to select it. */}
      <Card flush>
        {FOLDERS.map((item) => (
          <ListRow
            key={item.key}
            compact
            title={item.title}
            description={item.description}
            selected={folder === item.key}
            onPress={() => setFolder(item.key)}
          />
        ))}
      </Card>
    </Section>,

    <Section key="navigation" title="Navigation">
      <View style={[styles.frame, { borderColor: colors.borderDefault }]}>
        <TopBar
          title="Settings"
          onBack={() => {}}
          trailing={<Button variant="ghost" size="sm" label="Edit" />}
        />
        <View style={styles.frameBody}>
          <Button label="Open a bottom sheet" onPress={() => setSheet(true)} />
        </View>
        <View style={styles.frameBar}>
          <TabBar items={TABS} value={tab} onChange={setTab} />
        </View>
      </View>
    </Section>,

    <Section key="menu" title="Menu">
      <View style={styles.row}>
        <Menu
          label="Report"
          defaultOpen={params.menu === "1"}
          trigger={<Button iconEnd="chevron-down" label="Actions" />}
          items={[
            { label: "Rename", icon: "pencil", onSelect: () => {} },
            { label: "Duplicate", icon: "copy", onSelect: () => {} },
            { label: "Pinned", icon: "pin", selected: pinned, onSelect: () => setPinned(!pinned) },
            { type: "separator" },
            { label: "Share", icon: "share-2", disabled: true, onSelect: () => {} },
            { label: "Delete", icon: "trash", danger: true, onSelect: () => {} },
          ]}
        />
        <Menu
          label="Sort by"
          align="end"
          trigger={<IconButton icon="ellipsis" label="Sort by" />}
          items={[
            { label: "Name", selected: true, onSelect: () => {} },
            { label: "Date", onSelect: () => {} },
            { label: "Size", onSelect: () => {} },
          ]}
        />
      </View>
    </Section>,

    <Section key="dialog" title="Dialog">
      <View style={styles.row}>
        <Button variant="danger" label="Delete the report" onPress={() => setDialog(true)} />
      </View>
    </Section>,

    <Section key="toast" title="Toast">
      <View style={styles.row}>
        <Button label="Archive the report" onPress={() => setToast(true)} />
      </View>
    </Section>,

    <Section key="skeleton" title="Skeleton">
      {/* The card says that it is loading; the shapes are hidden from a screen reader. */}
      <Card>
        <View accessible accessibilityLabel="Loading" style={styles.loading}>
          <View style={styles.loadingHeader}>
            <Skeleton shape="circle" height={size.touch.avatarLg} />
            <View style={styles.loadingLines}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </View>
          </View>
          <Skeleton shape="rect" height={space[16] * 2} />
          <Skeleton />
          <Skeleton />
          <Skeleton width="70%" />
        </View>
      </Card>
    </Section>,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundBase }}>
      <SafeAreaView edges={["bottom", "left", "right"]} style={styles.screen}>
        {/* The one screen with a navigation bar: it gives the way back to the app. */}
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Design system",
            headerBackTitle: "App",
            headerStyle: { backgroundColor: colors.backgroundBase },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
        {/* A tap on a button while the keyboard is up is that button's, not only the keyboard's. */}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
          {sections.slice(from - 1)}
        </ScrollView>
        <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Share report">
          <Text tone="secondary">A sheet holds a short task and leaves the screen behind it.</Text>
          <Button variant="primary" label="Copy link" fullWidth onPress={() => setSheet(false)} />
          <Button label="Cancel" fullWidth onPress={() => setSheet(false)} />
        </BottomSheet>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="Delete the report?"
          description="The report and its comments are removed for everyone. This cannot be undone."
          actions={
            <>
              <Button label="Cancel" onPress={() => setDialog(false)} />
              <Button variant="danger" label="Delete" onPress={() => setDialog(false)} />
            </>
          }
        />
      </SafeAreaView>
      {/* Outside the safe area view: the toast keeps clear of the screen's edges by itself. */}
      <Toast
        open={toast}
        onClose={() => setToast(false)}
        message="The report was archived."
        action={{ label: "Undo", onPress: () => {} }}
        // Opened by a script, it stays until the picture is taken.
        duration={params.toast === "1" ? 0 : motion.duration.toast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loading: {
    gap: space[3],
  },
  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  loadingLines: {
    flex: 1,
    gap: space[2],
  },
  page: {
    padding: space[4],
    gap: space[8],
  },
  section: {
    gap: space[3],
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space[2],
  },
  end: {
    alignItems: "flex-end",
  },
  pair: {
    flexDirection: "row",
    gap: space[1],
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: space[2],
  },
  swatch: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  swatchName: {
    flex: 1,
  },
  chip: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  sample: {
    alignItems: "center",
    gap: space[1],
  },
  // Stands in for a picture under an overlay badge.
  block: {
    flexDirection: "row",
    gap: space[2],
    padding: space[3],
    borderWidth: border.width.thin,
    borderColor: "transparent",
    borderRadius: radius.md,
  },
  picture: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  onPicture: {
    position: "absolute",
    bottom: space[2],
    end: space[2],
  },
  // A small stand-in for a screen, to show the bars where they belong.
  frame: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  // The tab bar floats: it keeps a margin from the edges of the screen.
  frameBar: {
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  frameBody: {
    alignItems: "center",
    padding: space[6],
  },
  radius: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
