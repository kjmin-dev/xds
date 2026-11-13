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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
    "button", "field", "badge", "banner", "card", "switch", "checkbox", "segmented", "avatar",
    "progress", "list", "top", "tab", "sheet", "scrim",
)

// The preview has to work without a network, so the picture it shows is part of the code: a
// 64-pixel PNG as a data URI, which Coil decodes like a downloaded one.
private const val SamplePicture = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAC+klEQVR42u2ZLZOrMBSG+TlXVlYikcjIyMgjIyOPPDIS" +
    "iURGRiKRSCQSGde7HbY7vbvLZ9KG3unM4zrlvA85CSEkFytfmuQtEFvAWfnSvAUOIKBemrdAEGpybek6c+mtayvXFFsE" +
    "jIqJxUtvL679ydXELl8hGYyKhWv0ZWh+Tf9JXzuL8xeJJuBqWkh/cxhmHaIJXIZ6Of2tlw4n4JpiZfqRweDBBDqzScA1" +
    "xbEE1vfPYheFF+gqpSUIxk9n9ud05XRmgnEtoatuAlvSXwV6OynQVyogCPCV+yenM0OAvlKr1p9/RsBMVQwm0JUqy/hU" +
    "9HuyjA+t3TaJm3JGAP3pSjVz438ZipQP/YZBGCxNlQ4jsPLe35MzWNs/nZ0pHUAAAbamHyHSywJD0xt6rMCm5vnWSIvp" +
    "h7qYr+4rUCi5L/1IqSd3RK5veqMXA/gKABc+AsBFX9FQl66zo4nrG9fZoS5XBki6Cn1gOfcRYDn3DJB0JfqQpl4Caco9" +
    "A/gK7FhAvz3UIgsEaKG4AlKAj4AUEFmgQuUjUKGKLOAzj/1n8FWgLcmT3c+yQkn/6gEE2pLE9seZ4CJI6aQtKAib1tMs" +
    "46HqBhNoCwIO67YPELBoSIG2oBJVnk+208dPJaqwFQMLjBhEBMmZyPMrnAkEaRAfUeshAs8kaQp6ad4C/5lArUlLJYUU" +
    "DMYZPCIYSCG1VLUOLqDJH0MohVx/sCWFNIRBSvsKlApnFv6Fo6FcfPzdX0DvwxCx3OuN/vZOIwzR7hg7BQjU7uOgXw99" +
    "CdROgVrrrXAGoaLfwxnsCLNNwBJ5vsUvzu+PEo8SeHT6fQ5J9M7x7KWkJr0GJeRz0o8oIVcGWyVQKnpm+s9zX0XBBPJM" +
    "PF8gz8QqAUt6HgT1/PQjCGox3rLAOeWxBM4p9xUgwFjpPz9DAXoJBNnteO6UFgWKKQzquOlHDOqZkHMC0fvnrotmBLCY" +
    "Arg8ggBwORMyMVhMkWXiCAJZJmZCzglEXEC/LaY7BY6Q/jaPJ0P+BUIkpe4e8D4dAAAAAElFTkSuQmCC"

// A source that never loads: it is a data URI as well, but what it holds is not a picture.
private const val BrokenPicture = "data:image/png;base64,bm90IGEgcGljdHVyZQ=="

private val SamplePeople = listOf(
    AvatarPerson("Kim Minjun", SamplePicture),
    AvatarPerson("Lee Seoyeon"),
    AvatarPerson("Park Jihoon", SamplePicture),
    AvatarPerson("Choi Yuna"),
    AvatarPerson("Jung Doyun"),
    AvatarPerson("Han Jiwoo"),
    AvatarPerson("Yoon Seojun"),
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
                BadgesSection(colors)
                BannersSection()
                CardSection(colors)
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

        Samples {
            Button("Add", onClick = {}, variant = ButtonVariant.Primary, iconStart = IconName.Plus)
            Button("Next", onClick = {}, iconEnd = IconName.ArrowRight)
            Button("Share", onClick = {}, variant = ButtonVariant.Ghost, size = ControlSize.Sm, iconStart = IconName.Share2)
            Button("Download", onClick = {}, size = ControlSize.Lg, iconStart = IconName.Download)
            // The spinner stands where the icon was, so this one is as wide as when it is idle.
            Button("Download", onClick = {}, size = ControlSize.Lg, iconStart = IconName.Download, loading = true)
        }

        var liked by remember { mutableStateOf(true) }
        var saved by remember { mutableStateOf(true) }
        // Each toggle next to one that is off, for the difference.
        Samples {
            Button("Like", { liked = !liked }, iconStart = IconName.Heart, selected = liked)
            Button("Like", onClick = {}, iconStart = IconName.Heart, selected = false)
            Button("Saved", { saved = !saved }, variant = ButtonVariant.Ghost, iconStart = IconName.Bookmark, selected = saved)
            Button("Save", onClick = {}, variant = ButtonVariant.Ghost, iconStart = IconName.Bookmark, selected = false)
        }
        Samples {
            // A primary button reports the state and keeps its look; a disabled one looks disabled.
            Button("Following", onClick = {}, variant = ButtonVariant.Primary, iconStart = IconName.UserCheck, selected = true)
            Button("Like", onClick = {}, enabled = false, iconStart = IconName.Heart, selected = true)
        }
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

        var query by remember { mutableStateOf("") }
        TextField(
            label = "Search",
            value = query,
            onValueChange = { query = it },
            placeholder = "People and reports",
            leading = { Icon(IconName.Search) },
        )
        var weight by remember { mutableStateOf("72") }
        TextField(
            label = "Weight",
            value = weight,
            onValueChange = { weight = it },
            trailing = { Text("kg", tone = TextTone.Inherit) },
        )
        var password by remember { mutableStateOf("correct horse") }
        var revealed by remember { mutableStateOf(false) }
        TextField(
            label = "Password",
            value = password,
            onValueChange = { password = it },
            secure = !revealed,
            leading = { Icon(IconName.Lock) },
            trailing = {
                Button(
                    label = if (revealed) "Hide" else "Show",
                    onClick = { revealed = !revealed },
                    variant = ButtonVariant.Ghost,
                    size = ControlSize.Sm,
                )
            },
        )

        var about by remember { mutableStateOf("Keeps the design tokens in order, and the weekly report on time.") }
        TextField(
            label = "About you",
            value = about,
            onValueChange = { about = it },
            description = "Shown on your profile.",
            multiline = true,
            maxLength = 80,
        )
        var note by remember { mutableStateOf("") }
        TextField(
            label = "Note",
            value = note,
            onValueChange = { note = it },
            placeholder = "What should the team know?",
            leading = { Icon(IconName.Pencil) },
            multiline = true,
            rows = 2,
        )
        var handle by remember { mutableStateOf("minjun.kim.design") }
        TextField(
            label = "Handle",
            value = handle,
            onValueChange = { handle = it },
            error = "Handles have letters and numbers only.",
            maxLength = 20,
        )
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
private fun BadgesSection(colors: Colors) {
    Section("Badges") {
        Samples {
            // The overlay tone is for pictures: it is shown on blocks below.
            for (tone in BadgeTone.entries - BadgeTone.Overlay) Badge(tone.name.lowercase(), tone = tone)
        }
        Samples {
            Badge("Online", tone = BadgeTone.Success, dot = true)
            Badge("Connecting", tone = BadgeTone.Warning, dot = true)
            Badge("Offline", tone = BadgeTone.Danger, dot = true)
        }
        Samples {
            Badge("New", tone = BadgeTone.Accent, icon = IconName.Sparkles)
            Badge("Verified", tone = BadgeTone.Success, icon = IconName.Check)
            Badge("Live", tone = BadgeTone.Danger, dot = true, icon = IconName.Radio)
            Badge("Draft", icon = IconName.Pencil)
        }
        Samples {
            // One of the two is dark and the other light in either mode, as pictures are.
            for (block in listOf(colors.backgroundInverse, colors.backgroundSurface)) {
                val shape = RoundedCornerShape(Radius.md)
                Box(
                    modifier = Modifier
                        .size(width = 144.dp, height = 81.dp)
                        .background(block, shape)
                        .border(Border.widthThin, colors.borderDefault, shape)
                        .padding(Space.s2),
                    contentAlignment = Alignment.BottomEnd,
                ) {
                    Badge("12:04", tone = BadgeTone.Overlay, icon = IconName.Play)
                }
            }
        }
        // Wider apart than other samples: the badges hang over the corner of what they count.
        Samples(gap = Space.s6) {
            CountBadge(3)
            CountBadge(120)
            CountBadge(3, label = "3 unread notifications") { Icon(IconName.Bell, size = IconSize.Lg) }
            CountBadge(120, label = "More than 99 unread messages") { Icon(IconName.Mail, size = IconSize.Lg) }
            CountBadge(7, label = "7 messages from Kim Minjun") { Avatar("Kim Minjun", size = AvatarSize.Lg) }
            CountBadge(2, label = "2 items in the cart") {
                Button("Cart", onClick = {}, iconStart = IconName.ShoppingCart)
            }
            // Nothing to count, so no badge.
            CountBadge(0) { Icon(IconName.Bell, size = IconSize.Lg) }
        }
    }
}

@Composable
private fun BannersSection() {
    Section("Banners") {
        for (tone in BannerTone.entries) {
            Banner("Your changes are saved on this device.", tone = tone, title = tone.name.lowercase())
        }

        var dismissed by remember { mutableStateOf(false) }
        if (dismissed) {
            Button("Show the banner again", onClick = { dismissed = false })
        } else {
            Banner(
                message = "Restart the app to finish installing it.",
                title = "A new version is ready",
                action = BannerAction("Restart now") {},
                onDismiss = { dismissed = true },
            )
        }
        Banner(
            message = "The report could not be sent. Check the connection and try again.",
            tone = BannerTone.Danger,
            action = BannerAction("Try again") {},
        )
        Banner("Your changes are saved.", tone = BannerTone.Success, onDismiss = {}, dismissLabel = "Close")
    }
}

@Composable
private fun CardSection(colors: Colors) {
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
                Avatar("Kim Minjun", size = AvatarSize.Xl)
                Avatar("다람쥐")
            }
            Samples {
                for (size in AvatarSize.entries) Avatar("Kim Minjun", size = size, src = SamplePicture)
                // The picture cannot be loaded, so the initials stay.
                Avatar("Lee Seoyeon", size = AvatarSize.Xl, src = BrokenPicture)
            }
            Samples(gap = Space.s6) {
                AvatarStack(SamplePeople.take(3))
                AvatarStack(SamplePeople)
                AvatarStack(SamplePeople, max = 2, size = AvatarSize.Sm, label = "7 members")
                AvatarStack(SamplePeople, max = 3, size = AvatarSize.Lg)
                AvatarStack(SamplePeople, max = 2, size = AvatarSize.Xl)
            }
            ProgressBar(0.6f, label = "Report progress")
            Samples {
                Spinner(size = SpinnerSize.Sm)
                Spinner(label = "Loading")
            }
        }

        Card(
            title = "Hallasan at dawn",
            description = "24 photos from the trip.",
            media = {
                // Stands for a picture, which the preview does not download.
                Box(
                    modifier = Modifier.fillMaxWidth().height(144.dp).background(colors.accentSubtle).padding(Space.s3),
                    contentAlignment = Alignment.BottomEnd,
                ) {
                    Icon(IconName.Image, Modifier.align(Alignment.Center), size = IconSize.Xl, color = colors.accentDefault)
                    Badge("24", tone = BadgeTone.Overlay, icon = IconName.Image)
                }
            },
        ) {
            Text("Media runs from edge to edge, above the padding.", tone = TextTone.Secondary)
        }

        // Pressable cards as a choice of one: the whole card is the button.
        var plan by remember { mutableStateOf("team") }
        Card(
            title = "Personal",
            description = "For one person. Pressing the card chooses it.",
            onClick = { plan = "personal" },
            selected = plan == "personal",
        )
        Card(
            title = "Team",
            description = "For up to ten people.",
            onClick = { plan = "team" },
            selected = plan == "team",
        )
        Card(title = "Selected", description = "A card that is not pressable can be selected too.", selected = true)
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

        var folder by remember { mutableStateOf("inbox") }
        Card(flush = true) {
            ListRow(
                title = "Inbox",
                description = "3 unread",
                leading = { Icon(IconName.Mail) },
                trailing = { CountBadge(3, label = "3 unread messages") },
                onClick = { folder = "inbox" },
                selected = folder == "inbox",
            )
            Divider()
            ListRow(
                title = "Drafts",
                description = "Nothing waiting",
                leading = { Icon(IconName.FileText) },
                onClick = { folder = "drafts" },
                selected = folder == "drafts",
            )
        }

        // Compact rows, as in a sidebar or a menu.
        val pages = listOf(
            Triple("overview", "Overview", IconName.LayoutGrid),
            Triple("reports", "Reports", IconName.ChartColumn),
            Triple("members", "Members", IconName.Users),
        )
        var page by remember { mutableStateOf("reports") }
        Card(flush = true) {
            for ((key, title, icon) in pages) {
                ListRow(
                    title = title,
                    leading = { Icon(icon, size = IconSize.Sm) },
                    onClick = { page = key },
                    selected = page == key,
                    compact = true,
                )
            }
            Divider()
            ListRow(
                title = "Settings",
                description = "Notifications and sign-in",
                leading = { Icon(IconName.Settings, size = IconSize.Sm) },
                chevron = true,
                onClick = {},
                compact = true,
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

