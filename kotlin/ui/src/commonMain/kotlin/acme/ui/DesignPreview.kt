// The design preview: every token and every component in every variant and state. The home
// screen links here; the web app has the same page at `/design`, and the GPUI desktop app opens
// it with `acme --design`.

package acme.ui

import acme.tokens.IconName
import acme.tokens.Border
import acme.tokens.Colors
import acme.tokens.DarkColors
import acme.tokens.Mode
import acme.tokens.PointerSizes
import acme.tokens.Radius
import acme.tokens.Sizes
import acme.tokens.Space
import acme.tokens.TouchSizes
import acme.tokens.Typography
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.FlowRowScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.DrawStyle
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The first word of every component color group. Those colors are shown by the components that
 * use them, so the color list leaves them out.
 */
private val ComponentColorGroups = setOf(
    "button", "field", "badge", "banner", "switch", "checkbox", "segmented", "avatar", "progress",
    "list", "top", "tab", "sheet", "scrim",
)

/**
 * The semantic colors by group, in token order. A group is the first word of the token name:
 * `text-on-accent` is in `text`.
 */
internal fun <T> semanticColorGroups(entries: List<Pair<String, T>>): Map<String, List<Pair<String, T>>> =
    entries
        .groupBy { (name, _) -> name.substringBefore('-') }
        .filterKeys { it !in ComponentColorGroups }

private val TextRoles = listOf(
    "display" to Typography.display,
    "title" to Typography.title,
    "heading" to Typography.heading,
    "body" to Typography.body,
    "body-strong" to Typography.bodyStrong,
    "label" to Typography.label,
    "detail" to Typography.detail,
    "footnote" to Typography.footnote,
)

// The generated tokens list the colors but not these, so they are written out here.
private val Spaces = listOf(
    "0.5" to Space.s0_5, "1" to Space.s1, "1.5" to Space.s1_5, "2" to Space.s2, "2.5" to Space.s2_5,
    "3" to Space.s3, "4" to Space.s4, "5" to Space.s5, "6" to Space.s6, "8" to Space.s8,
    "10" to Space.s10, "12" to Space.s12, "16" to Space.s16,
)
private val Radii = listOf(
    "sm" to Radius.sm, "md" to Radius.md, "lg" to Radius.lg, "xl" to Radius.xl, "full" to Radius.full,
)

/** Shows every token and every component. [onBack] is called by the back mark in its top bar. */
@Composable
fun DesignPreview(onBack: () -> Unit) {
    DesignPreviewScreen(onBack = onBack, scrolls = true, sheetOpen = false)
}

/**
 * @param scrolls False lays the whole page out at its full height, for drawing it into one image.
 * @param sheetOpen Starts with the sample bottom sheet open, for the same reason.
 */
@Composable
internal fun DesignPreviewScreen(onBack: () -> Unit, scrolls: Boolean, sheetOpen: Boolean) {
    val ambient = if (LocalColors.current === DarkColors) Mode.Dark else Mode.Light
    // The switch in the top bar pins a mode for this screen only. Until it is used, the screen
    // follows the theme around it.
    var pinned by remember { mutableStateOf<Mode?>(null) }
    val mode = pinned ?: ambient

    AcmeTheme(mode = mode, sizes = LocalSizes.current) {
        val colors = LocalColors.current
        Column(
            Modifier
                .fillMaxSize()
                .background(colors.backgroundBase)
                .windowInsetsPadding(WindowInsets.safeDrawing),
        ) {
            TopBar(
                title = "Design system",
                onBack = onBack,
                trailing = {
                    Button(
                        label = if (mode == Mode.Dark) "Switch to light" else "Switch to dark",
                        onClick = { pinned = if (mode == Mode.Dark) Mode.Light else Mode.Dark },
                        variant = ButtonVariant.Ghost,
                        size = ControlSize.Sm,
                    )
                },
            )
            Column(
                modifier = (if (scrolls) Modifier.weight(1f).verticalScroll(rememberScrollState()) else Modifier)
                    .padding(Space.s4),
                verticalArrangement = Arrangement.spacedBy(Space.s8),
            ) {
                ColorsSection(colors)
                TypographySection()
                SizesSection(colors)
                IconsSection()
                ButtonsSection()
                TextFieldsSection()
                SelectionSection()
                BadgesSection()
                BannersSection()
                CardSection()
                ListSection()
                NavigationSection(colors, sheetOpen)
            }
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(Space.s3)) {
        Text(title, style = Typography.title, heading = true)
        content()
    }
}

/** Samples side by side, wrapping onto the next line when the screen is narrow. */
@Composable
private fun Samples(gap: Dp = Space.s2, content: @Composable FlowRowScope.() -> Unit) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(gap),
        verticalArrangement = Arrangement.spacedBy(Space.s2),
        itemVerticalAlignment = Alignment.CenterVertically,
        content = content,
    )
}

@Composable
private fun ColorsSection(colors: Colors) {
    Section("Colors") {
        // Read from the generated tokens, so a new color appears here without touching this file.
        for ((group, entries) in semanticColorGroups(colors.entries())) {
            Text(group, style = Typography.label, tone = TextTone.Secondary)
            BoxWithConstraints {
                // Two columns on a phone, more where there is room.
                val columns = (maxWidth / 200.dp).toInt().coerceIn(2, 4)
                Column(verticalArrangement = Arrangement.spacedBy(Space.s2)) {
                    for (line in entries.chunked(columns)) {
                        Row {
                            for ((name, color) in line) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    horizontalArrangement = Arrangement.spacedBy(Space.s2),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    val chip = RoundedCornerShape(Radius.sm)
                                    Box(
                                        Modifier
                                            .size(28.dp)
                                            .background(color, chip)
                                            .border(Border.widthThin, colors.borderDefault, chip),
                                    )
                                    Text(name, Modifier.weight(1f), Typography.footnote, TextTone.Secondary)
                                }
                            }
                            // Keeps the cells of a short last line as wide as the others.
                            repeat(columns - line.size) { Spacer(Modifier.weight(1f)) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TypographySection() {
    Section("Typography") {
        for ((name, style) in TextRoles) {
            Text("$name · 다람쥐 헌 쳇바퀴 Quick fox 123", style = style)
        }
    }
}

@Composable
private fun SizesSection(colors: Colors) {
    Section("Space, radius, size") {
        Samples {
            for ((name, length) in Spaces) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(Space.s1),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Box(Modifier.size(length).background(colors.accentDefault))
                    Text(name, style = Typography.footnote, tone = TextTone.Secondary)
                }
            }
        }
        Samples {
            for ((name, radius) in Radii) {
                Box(
                    Modifier.size(48.dp).border(Border.widthThin, colors.borderStrong, RoundedCornerShape(radius)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(name, style = Typography.footnote, tone = TextTone.Secondary)
                }
            }
        }
        val used = if (LocalSizes.current === TouchSizes) "touch" else "pointer"
        Text(
            "Body ${Typography.body.fontSize.value.toInt()}/${Typography.body.lineHeight.value.toInt()}. " +
                "Control heights: touch ${heights(TouchSizes)}, pointer ${heights(PointerSizes)}. " +
                "This screen uses the $used sizes.",
            style = Typography.detail,
            tone = TextTone.Secondary,
        )
    }
}

private fun heights(sizes: Sizes): String =
    listOf(sizes.controlSm, sizes.controlMd, sizes.controlLg).joinToString("/") { it.value.toInt().toString() }

@Composable
private fun IconsSection() {
    Section("Icons") {
        Samples(gap = Space.s4) {
            for (name in IconName.entries) Icon(name, label = name.name)
        }
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(Space.s3),
            itemVerticalAlignment = Alignment.Bottom,
        ) {
            for (size in IconSize.entries) Icon(IconName.House, size = size, label = "House, ${size.name}")
        }
        Samples(gap = Space.s3) {
            // Icons made of closed shapes, which is what `filled` is for.
            for (name in FillableIcons) {
                Row(horizontalArrangement = Arrangement.spacedBy(Space.s1)) {
                    Icon(name)
                    Icon(name, filled = true, label = "${name.name}, filled")
                }
            }
        }
    }
}

private val FillableIcons =
    listOf(IconName.Heart, IconName.Star, IconName.Bookmark, IconName.ThumbsUp, IconName.Bell)

@Composable
private fun ButtonsSection() {
    Section("Buttons") {
        for (variant in ButtonVariant.entries) {
            Samples {
                for (size in ControlSize.entries) {
                    Button("Save", onClick = {}, variant = variant, size = size)
                }
                Button("Off", onClick = {}, variant = variant, enabled = false)
                Button("Saving", onClick = {}, variant = variant, loading = true)
            }
        }
        Button("Full width", onClick = {}, variant = ButtonVariant.Primary, fullWidth = true)
    }
}

@Composable
private fun TextFieldsSection() {
    Section("Text fields") {
        var email by remember { mutableStateOf("") }
        TextField(
            label = "Email",
            value = email,
            onValueChange = { email = it },
            placeholder = "name@example.com",
            description = "We send the sign-in code to this address.",
        )
        TextField(
            label = "Sign-in code",
            value = "12345",
            onValueChange = {},
            error = "That code is wrong or has expired.",
        )
        TextField(label = "Organization", value = "Acme Inc.", onValueChange = {}, enabled = false)
    }
}

@Composable
private fun SelectionSection() {
    Section("Selection") {
        var notify by remember { mutableStateOf(true) }
        var quiet by remember { mutableStateOf(false) }
        // Wider apart than other samples: each one ends in a label, and the next must not read
        // as part of it.
        Samples(gap = Space.s6) {
            Switch(notify, { notify = it }, label = "Notifications")
            Switch(quiet, { quiet = it }, label = "Quiet hours")
        }
        Samples(gap = Space.s6) {
            Switch(true, {}, label = "On, disabled", enabled = false)
            Switch(false, {}, label = "Off, disabled", enabled = false)
        }

        var remember by remember { mutableStateOf(true) }
        var updates by remember { mutableStateOf(false) }
        Samples(gap = Space.s6) {
            Checkbox(remember, { remember = it }, label = "Remember me")
            Checkbox(updates, { updates = it }, label = "Send me updates")
        }
        Samples(gap = Space.s6) {
            Checkbox(true, {}, label = "On, disabled", enabled = false)
            Checkbox(false, {}, label = "Off, disabled", enabled = false)
        }

        val periods = listOf("day" to "Day", "week" to "Week", "month" to "Month")
        var period by remember { mutableStateOf("week") }
        SegmentedControl(periods, period, { period = it })
        SegmentedControl(periods, period, { period = it }, fullWidth = true)
    }
}

@Composable
private fun BadgesSection() {
    Section("Badges") {
        Samples {
            for (tone in BadgeTone.entries) Badge(tone.name.lowercase(), tone = tone)
        }
        Samples {
            Badge("Online", tone = BadgeTone.Success, dot = true)
            Badge("Connecting", tone = BadgeTone.Warning, dot = true)
            Badge("Offline", tone = BadgeTone.Danger, dot = true)
        }
    }
}

@Composable
private fun BannersSection() {
    Section("Banners") {
        for (tone in BannerTone.entries) {
            Banner("Your changes are saved on this device.", tone = tone, title = tone.name.lowercase())
        }
    }
}

@Composable
private fun CardSection() {
    Section("Card") {
        Card(
            title = "Weekly report",
            description = "Updated a few minutes ago.",
            actions = { Badge("Online", tone = BadgeTone.Success, dot = true) },
        ) {
            Text("A card groups related content.", tone = TextTone.Secondary)
            Divider()
            Samples {
                Avatar("Kim Minjun", size = AvatarSize.Sm)
                Avatar("Kim Minjun")
                Avatar("Kim Minjun", size = AvatarSize.Lg)
                Avatar("다람쥐")
            }
            ProgressBar(0.6f, label = "Report progress")
            Samples {
                Spinner(size = SpinnerSize.Sm)
                Spinner(label = "Loading")
            }
        }
    }
}

@Composable
private fun ListSection() {
    Section("List") {
        var notify by remember { mutableStateOf(true) }
        // Flush, so the rows and the dividers run from edge to edge of the card.
        Card(flush = true) {
            ListRow(
                title = "Notifications",
                description = "Sign-in codes and weekly reports.",
                trailing = { Switch(notify, { notify = it }) },
            )
            Divider()
            ListRow(
                title = "Kim Minjun",
                description = "name@example.com",
                leading = { Avatar("Kim Minjun") },
                chevron = true,
                onClick = {},
            )
            Divider()
            ListRow(
                title = "Version",
                trailing = { Text("1.0.0", tone = TextTone.Secondary) },
            )
        }
    }
}

@Composable
private fun NavigationSection(colors: Colors, sheetOpen: Boolean) {
    Section("Navigation") {
        // Each bar is drawn in a frame that stands for the screen's edges. The frame does not
        // clip, so the tab bar's shadow is whole.
        val framed = Modifier.border(Border.widthThin, colors.borderDefault, RoundedCornerShape(Radius.lg))
        Box(framed) {
            TopBar(
                title = "Settings",
                onBack = {},
                trailing = { Button("Edit", onClick = {}, variant = ButtonVariant.Ghost, size = ControlSize.Sm) },
            )
        }

        var tab by remember { mutableStateOf("home") }
        Box(framed) {
            TabBar(
                items = listOf(
                    TabItem("home", "Home") { Icon(IconName.House, size = IconSize.Lg) },
                    TabItem("search", "Search") { Icon(IconName.Search, size = IconSize.Lg) },
                    TabItem("profile", "Profile") { Icon(IconName.User, size = IconSize.Lg) },
                ),
                selected = tab,
                onSelect = { tab = it },
                // The margins an app gives the bar: at the sides and below it. The one above
                // stands in for the content it floats over.
                modifier = Modifier.padding(Space.s4),
            )
        }

        var open by remember { mutableStateOf(sheetOpen) }
        Button("Open the sheet", onClick = { open = true })
        BottomSheet(open = open, onDismiss = { open = false }, title = "Share the report") {
            Text("Anyone with the link can read it.", tone = TextTone.Secondary)
            Button("Copy the link", onClick = { open = false }, variant = ButtonVariant.Primary, fullWidth = true)
            Button("Cancel", onClick = { open = false }, variant = ButtonVariant.Ghost, fullWidth = true)
        }
    }
}

