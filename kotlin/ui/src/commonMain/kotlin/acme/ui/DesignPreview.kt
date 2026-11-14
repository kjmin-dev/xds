// The design preview: every token and every component in every variant and state. The home
// screen links here; the web app has the same page at `/design`, and the GPUI desktop app opens
// it with `acme --design`.

package acme.ui

import acme.tokens.IconName
import acme.tokens.Border
import acme.tokens.Colors
import acme.tokens.DarkColors
import acme.tokens.Mode
import acme.tokens.Motion
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The first word of every component color group. Those colors are shown by the components that
 * use them, so the color list leaves them out.
 */
private val ComponentColorGroups = setOf(
    "button", "field", "badge", "banner", "card", "switch", "checkbox", "radio", "segmented",
    "chip", "tabs", "menu", "dialog", "toast", "tooltip", "skeleton", "thumbnail", "sidebar",
    "empty", "accordion", "avatar", "progress", "slider", "list", "top", "tab", "sheet", "scrim",
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
    DesignPreviewScreen(onBack = onBack, scrolls = true, open = null)
}

/** What the preview can start with open, so that it can be drawn into an image open. */
internal enum class PreviewOverlay { Sheet, Menu, Select, Dialog, Toast }

/**
 * @param scrolls False lays the whole page out at its full height, for drawing it into one image.
 * @param open The sample overlay to start with open, for the same reason.
 */
@Composable
internal fun DesignPreviewScreen(onBack: () -> Unit, scrolls: Boolean, open: PreviewOverlay?) {
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
                ControlsSection(selectOpen = open == PreviewOverlay.Select)
                ChipsSection()
                TabsSection()
                BadgesSection(colors)
                BannersSection()
                CardSection(colors)
                MediaSection()
                ListSection()
                AccordionSection()
                EmptyStateSection()
                NavigationSection(colors, sheetOpen = open == PreviewOverlay.Sheet)
                MenuSection(open = open == PreviewOverlay.Menu)
                DialogSection(open = open == PreviewOverlay.Dialog)
                ToastSection(open = open == PreviewOverlay.Toast)
                SkeletonSection()
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

        // The same variants and sizes, holding only an icon.
        for (variant in ButtonVariant.entries) {
            Samples {
                for (size in ControlSize.entries) {
                    IconButton(IconName.Pencil, "Edit, ${size.name.lowercase()}", onClick = {}, variant = variant, size = size)
                }
                IconButton(IconName.Pencil, "Edit, disabled", onClick = {}, variant = variant, enabled = false)
                IconButton(IconName.Pencil, "Saving", onClick = {}, variant = variant, loading = true)
            }
        }
        var muted by remember { mutableStateOf(true) }
        var starred by remember { mutableStateOf(true) }
        // Each toggle next to one that is off, as above.
        Samples {
            // Icons of closed shapes, which a selected icon button fills.
            IconButton(IconName.Bell, "Mute notifications", { muted = !muted }, selected = muted)
            IconButton(IconName.Bell, "Mute notifications", onClick = {}, selected = false)
            IconButton(IconName.Star, "Star", { starred = !starred }, variant = ButtonVariant.Secondary, selected = starred)
            IconButton(IconName.Star, "Star", onClick = {}, variant = ButtonVariant.Secondary, selected = false)
            IconButton(IconName.Bookmark, "Saved", onClick = {}, enabled = false, selected = true)
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

        // Empty, with a value and its clear control, and disabled.
        var people by remember { mutableStateOf("") }
        SearchField(label = "Search people", value = people, onValueChange = { people = it }, placeholder = "Search people")
        var files by remember { mutableStateOf("Quarterly report") }
        SearchField(label = "Search files", value = files, onValueChange = { files = it }, onSubmit = {})
        SearchField(
            label = "Search the archive",
            value = "",
            onValueChange = {},
            placeholder = "Unavailable offline",
            enabled = false,
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

        var delivery by remember { mutableStateOf<String?>("standard") }
        RadioGroup(
            label = "Delivery",
            options = listOf(
                RadioOption("standard", "Standard", description = "3 to 5 days, free"),
                RadioOption("express", "Express", description = "The next day, 5,000 won"),
                RadioOption("pickup", "Pick up at the store"),
            ),
            value = delivery,
            onValueChange = { delivery = it },
        )
        // Nothing is chosen yet, which is what the error is about: choosing clears it.
        var billing by remember { mutableStateOf<String?>(null) }
        RadioGroup(
            label = "Billing",
            options = listOf(RadioOption("monthly", "Monthly"), RadioOption("yearly", "Yearly")),
            value = billing,
            onValueChange = { billing = it },
            error = if (billing == null) "Choose how often to be billed." else null,
        )
        RadioGroup(
            label = "Region",
            options = listOf(
                RadioOption("kr", "Korea", description = "Set by your organization"),
                RadioOption("jp", "Japan"),
            ),
            value = "kr",
            onValueChange = {},
            enabled = false,
        )

        val periods = listOf("day" to "Day", "week" to "Week", "month" to "Month")
        var period by remember { mutableStateOf("week") }
        SegmentedControl(periods, period, { period = it })
        SegmentedControl(periods, period, { period = it }, fullWidth = true)
    }
}

private val Countries = listOf(
    SelectOption("kr", "Korea"),
    SelectOption("jp", "Japan"),
    SelectOption("tw", "Taiwan"),
    SelectOption("sg", "Singapore"),
    SelectOption("us", "United States"),
)

// With a second line, which the list shows under each label.
private val Languages = listOf(
    SelectOption("ko", "한국어", description = "Korean"),
    SelectOption("en", "English"),
    SelectOption("ja", "日本語", description = "Japanese"),
    SelectOption("zh", "中文", description = "Chinese, simplified"),
)

/** @param selectOpen Starts with the list of the select that has a value open. */
@Composable
private fun ControlsSection(selectOpen: Boolean) {
    Section("Controls") {
        // Empty, chosen, with an error, and disabled.
        var country by remember { mutableStateOf<String?>(null) }
        Select(
            label = "Country",
            options = Countries,
            value = country,
            onValueChange = { country = it },
            placeholder = "Choose a country",
            description = "Where the order is sent.",
        )
        var language by remember { mutableStateOf<String?>("ko") }
        Select(
            label = "Language",
            options = Languages,
            value = language,
            onValueChange = { language = it },
            modifier = Modifier,
            placeholder = null,
            description = null,
            error = null,
            enabled = true,
            initiallyOpen = selectOpen,
        )
        var zone by remember { mutableStateOf<String?>(null) }
        Select(
            label = "Time zone",
            options = listOf(SelectOption("seoul", "Seoul"), SelectOption("tokyo", "Tokyo")),
            value = zone,
            onValueChange = { zone = it },
            placeholder = "Choose a time zone",
            error = if (zone == null) "Choose a time zone to see the right times." else null,
        )
        Select(
            label = "Currency",
            options = listOf(SelectOption("krw", "Korean won")),
            value = "krw",
            onValueChange = {},
            enabled = false,
        )

        var volume by remember { mutableStateOf(40f) }
        Slider(label = "Volume", value = volume, onValueChange = { volume = it }, showValue = true)
        var opacity by remember { mutableStateOf(0.75f) }
        Slider(
            label = "Opacity",
            value = opacity,
            onValueChange = { opacity = it },
            min = 0f,
            max = 1f,
            step = 0.05f,
            showValue = true,
        )
        Slider(label = "Brightness", value = 70f, onValueChange = {}, enabled = false)
    }
}

// More than fit across a desktop window, so the bar scrolls there as well as on a phone.
private val FileKinds = listOf(
    Triple("docs", "Documents", IconName.FileText),
    Triple("sheets", "Spreadsheets", IconName.ChartColumn),
    Triple("images", "Images", IconName.Image),
    Triple("video", "Videos", IconName.Video),
    Triple("audio", "Audio", IconName.Music),
    Triple("links", "Links", IconName.Link),
    Triple("shared", "Shared with me", IconName.Users),
    Triple("starred", "Starred", IconName.Star),
    Triple("archived", "Archived", null),
    Triple("trash", "In the trash", null),
)

@Composable
private fun ChipsSection() {
    Section("Chips") {
        Samples {
            Chip("Unselected", onClick = {})
            Chip("Selected", onClick = {}, selected = true)
            Chip("With icon", onClick = {}, iconStart = IconName.Flag)
            Chip("Selected", onClick = {}, selected = true, iconStart = IconName.Flag)
            Chip("Off", onClick = {}, enabled = false)
            Chip("Off", onClick = {}, selected = true, enabled = false)
        }
        // Press them: the bar holds no state, the screen does.
        var kinds by remember { mutableStateOf(setOf("docs", "images")) }
        ChipBar(label = "Kind of file") {
            for ((key, label, icon) in FileKinds) {
                val on = key in kinds
                Chip(label, onClick = { kinds = if (on) kinds - key else kinds + key }, selected = on, iconStart = icon)
            }
        }
    }
}

private val Pages = listOf(
    TabsItem("overview", "Overview", IconName.LayoutGrid),
    TabsItem("activity", "Activity", IconName.History),
    TabsItem("members", "Members", IconName.Users),
    TabsItem("files", "Files", IconName.FileText),
    TabsItem("settings", "Settings", IconName.Settings),
)

@Composable
private fun TabsSection() {
    Section("Tabs") {
        var page by remember { mutableStateOf("overview") }
        Tabs(Pages.map { TabsItem(it.value, it.label) }, page, { page = it }, label = "Project pages")
        // With icons the row is wider than a phone, and scrolls.
        Tabs(Pages, page, { page = it }, label = "Project pages")
        Tabs(Pages.take(3).map { TabsItem(it.value, it.label) }, page, { page = it }, label = "Project pages", fullWidth = true)
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
private fun MediaSection() {
    Section("Media") {
        SectionHeader(
            title = "Continue watching",
            description = "Pick up where you left off.",
            action = SectionHeaderAction("See all") {},
        )
        // Every ratio at the same width, so the heights show the shapes.
        Samples(gap = Space.s3) {
            for (ratio in ThumbnailRatio.entries) {
                Thumbnail(SamplePicture, "A portrait at sunset", Modifier.width(120.dp), ratio = ratio)
            }
        }
        // The picture cannot be loaded, there is none, a badge, a bar, and both.
        Samples(gap = Space.s3) {
            val wide = Modifier.width(160.dp)
            Thumbnail(BrokenPicture, "Hallasan at dawn", wide)
            Thumbnail(null, "", wide)
            Thumbnail(SamplePicture, "A portrait at sunset", wide, badge = "12:04")
            Thumbnail(SamplePicture, "A portrait at sunset", wide, progress = 0.4f)
            Thumbnail(SamplePicture, "A portrait at sunset", wide, badge = "1:02:45", progress = 0.75f)
        }

        BoxWithConstraints {
            // Two across where there is room, as in a feed, their tops in line.
            val across = if (maxWidth >= 640.dp) 2 else 1
            val width = (maxWidth - Space.s4 * (across - 1)) / across
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(Space.s4),
                verticalArrangement = Arrangement.spacedBy(Space.s4),
            ) {
                MediaCard(
                    title = "Designing tokens that last: a talk from the Seoul design meetup",
                    modifier = Modifier.width(width),
                    src = SamplePicture,
                    alt = "A portrait at sunset",
                    badge = "24:10",
                    progress = 0.35f,
                    meta = listOf("Kim Minjun", "12K views · 3 days ago"),
                    leading = { Avatar("Kim Minjun", src = SamplePicture) },
                    action = { VideoMenu() },
                    onClick = {},
                )
                MediaCard(
                    title = "Hallasan at dawn",
                    modifier = Modifier.width(width),
                    src = BrokenPicture,
                    alt = "Hallasan at dawn",
                    badge = "8:31",
                    meta = listOf("Lee Seoyeon", "2 weeks ago"),
                    leading = { Avatar("Lee Seoyeon") },
                    action = { VideoMenu() },
                    onClick = {},
                )
            }
        }
        // As wide as a list beside a video would be, rather than the whole window.
        val listWidth = Modifier.widthIn(max = 560.dp)
        MediaCard(
            title = "A short guide to color contrast, and why 4.5 to 1 is the number",
            modifier = listWidth,
            layout = MediaCardLayout.Horizontal,
            src = SamplePicture,
            alt = "A portrait at sunset",
            badge = "6:12",
            meta = listOf("Park Jihoon", "3.4K views"),
            action = { VideoMenu() },
            onClick = {},
        )
        MediaCard(
            title = "Not pressable: the card has no fill and no padding of its own",
            modifier = listWidth,
            layout = MediaCardLayout.Horizontal,
            src = SamplePicture,
            alt = "A portrait at sunset",
            ratio = ThumbnailRatio.Ratio1x1,
            meta = listOf("Choi Yuna"),
        )

        // On its own, not over a group of content.
        SectionHeader(
            title = "Recommended for you",
            description = "Based on what you watched this week.",
            icon = IconName.Sparkles,
            level = 3,
        )
    }
}

/** The menu a media card's action opens. */
@Composable
private fun VideoMenu() {
    Menu(
        label = "Video",
        items = listOf(
            MenuItem.Action("Save to a list", onSelect = {}, icon = IconName.ListPlus),
            MenuItem.Action("Share", onSelect = {}, icon = IconName.Share2),
            MenuItem.Separator,
            MenuItem.Action("Not interested", onSelect = {}, icon = IconName.Ban),
        ),
        align = MenuAlign.End,
    ) { open ->
        IconButton(IconName.EllipsisVertical, "More actions", onClick = open, size = ControlSize.Sm)
    }
}

// Plain text in a body takes the body's look; the second body holds a control as well.
private val Questions = listOf(
    AccordionItem("tokens", "Where do the colors come from?") {
        Text("From the design tokens. Every component reads them, so a change to a token changes every client at once.")
    },
    AccordionItem("themes", "Can I change the accent color?", description = "Themes and ramps") {
        Column(verticalArrangement = Arrangement.spacedBy(Space.s3)) {
            Text("Make a theme with a new hue. Its ramps are generated, and the contrast of every pairing is checked on build.")
            Button("Make a theme", onClick = {}, size = ControlSize.Sm, iconStart = IconName.Palette)
        }
    },
    AccordionItem("fonts", "Why does the text look different on each platform?") {
        Text("The font files are not bundled, so each platform draws text in its own default font.")
    },
)

@Composable
private fun AccordionSection() {
    Section("Accordion") {
        // One open at a time.
        var single by remember { mutableStateOf(setOf("tokens")) }
        Accordion(Questions, single, { single = it })
        // Several open at once.
        var several by remember { mutableStateOf(setOf("tokens", "themes")) }
        Accordion(Questions, several, { several = it }, multiple = true)
    }
}

@Composable
private fun EmptyStateSection() {
    Section("Empty state") {
        Card {
            EmptyState(
                icon = IconName.Search,
                title = "No results for “tokens”",
                description = "Check the spelling, or search all files instead of this folder.",
                action = { Button("Search all files", onClick = {}) },
            )
        }
        EmptyState(
            icon = IconName.BellOff,
            title = "No notifications",
            description = "When someone mentions you, it shows up here.",
        )
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

/** @param open Starts with the first menu open. */
@Composable
private fun MenuSection(open: Boolean) {
    Section("Menu") {
        var pinned by remember { mutableStateOf(true) }
        var sort by remember { mutableStateOf("name") }
        // A popup with a pointer, a sheet of rows on touch.
        Samples {
            Menu(
                label = "Report",
                items = listOf(
                    MenuItem.Action("Rename", onSelect = {}, icon = IconName.Pencil),
                    MenuItem.Action("Duplicate", onSelect = {}, icon = IconName.Copy),
                    MenuItem.Action("Pinned", onSelect = { pinned = !pinned }, icon = IconName.Pin, selected = pinned),
                    MenuItem.Separator,
                    MenuItem.Action("Share", onSelect = {}, icon = IconName.Share2, enabled = false),
                    MenuItem.Action("Delete", onSelect = {}, icon = IconName.Trash, danger = true),
                ),
                modifier = Modifier,
                align = MenuAlign.Start,
                initiallyOpen = open,
            ) { openMenu ->
                Button("Actions", onClick = openMenu, iconEnd = IconName.ChevronDown)
            }
            Menu(
                label = "Sort by",
                items = listOf("name" to "Name", "date" to "Date", "size" to "Size").map { (key, label) ->
                    MenuItem.Action(label, onSelect = { sort = key }, selected = sort == key)
                },
                align = MenuAlign.End,
            ) { openMenu ->
                IconButton(IconName.Ellipsis, "Sort by", onClick = openMenu)
            }
        }
    }
}

/** @param open Starts with the dialog open. */
@Composable
private fun DialogSection(open: Boolean) {
    Section("Dialog") {
        var shown by remember { mutableStateOf(open) }
        Samples {
            Button("Delete the report", onClick = { shown = true }, variant = ButtonVariant.Danger)
        }
        Dialog(
            open = shown,
            onClose = { shown = false },
            title = "Delete the report?",
            description = "The report and its comments are removed for everyone. This cannot be undone.",
            actions = {
                Button("Cancel", onClick = { shown = false })
                Button("Delete", onClick = { shown = false }, variant = ButtonVariant.Danger)
            },
        )
    }
}

/** @param open Starts with the toast open, and keeps it until it is drawn. */
@Composable
private fun ToastSection(open: Boolean) {
    Section("Toast") {
        var shown by remember { mutableStateOf(open) }
        Samples {
            Button("Archive the report", onClick = { shown = true })
        }
        Toast(
            open = shown,
            onClose = { shown = false },
            message = "The report was archived.",
            action = ToastAction("Undo") {},
            duration = if (open) 0 else Motion.durationToast,
        )
    }
}

@Composable
private fun SkeletonSection() {
    Section("Skeleton") {
        // The card says that it is loading; the shapes are hidden from a screen reader.
        Card(modifier = Modifier.semantics(mergeDescendants = true) { contentDescription = "Loading" }) {
            Column(verticalArrangement = Arrangement.spacedBy(Space.s3)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Space.s3),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Skeleton(shape = SkeletonShape.Circle, height = LocalSizes.current.avatarLg)
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Space.s2)) {
                        Skeleton(Modifier.fillMaxWidth(0.6f))
                        Skeleton(Modifier.fillMaxWidth(0.4f))
                    }
                }
                Skeleton(shape = SkeletonShape.Rect, height = Space.s16 * 2)
                Skeleton()
                Skeleton()
                Skeleton(Modifier.fillMaxWidth(0.7f))
            }
        }
    }
}

