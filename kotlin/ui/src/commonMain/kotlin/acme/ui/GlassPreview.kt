package acme.ui

import acme.tokens.IconName
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

private val destinations = listOf(
    TabItem("home", "Home") { Icon(IconName.House) },
    TabItem("search", "Search") { Icon(IconName.Search) },
    TabItem("profile", "Profile") { Icon(IconName.User) },
)

@Composable
internal fun GlassPreview(tier: String?, autoscroll: Boolean, sheetOpen: Boolean, modifier: Modifier = Modifier.fillMaxWidth().height(440.dp)) {
    val colors = LocalColors.current
    var selected by remember { mutableStateOf("home") }
    var sheet by remember { mutableStateOf(sheetOpen) }
    val scroll = rememberScrollState()
    val sections = listOf(
        "Information" to colors.statusInfoSubtle,
        "Success" to colors.statusSuccessSubtle,
        "Warning" to colors.statusWarningSubtle,
        "Review" to colors.statusDangerSubtle,
    )
    LaunchedEffect(autoscroll, scroll.maxValue) {
        if (autoscroll && scroll.maxValue in 1 until Int.MAX_VALUE) {
            scroll.animateScrollTo(scroll.maxValue, tween(10_000, easing = LinearEasing))
        }
    }
    CompositionLocalProvider(LocalPreviewBlur provides (tier != "solid")) {
        GlassScene {
            Box(modifier) {
                Column(Modifier.fillMaxSize().glassBackdrop().verticalScroll(scroll)) {
                    repeat(24) { index ->
                        val (label, color) = sections[index % sections.size]
                        Column(
                            Modifier.fillMaxWidth().background(color).padding(Space.s4),
                            verticalArrangement = Arrangement.spacedBy(Space.s1),
                        ) {
                            Text(label, style = Typography.heading)
                            Text("Collection ${index + 1}")
                        }
                    }
                }
                TopBar("Collections", Surface.Glass, trailing = {
                    Button("Details", onClick = { sheet = true }, variant = ButtonVariant.Secondary, size = ControlSize.Sm)
                })
                TabBar(destinations, selected, { selected = it }, Modifier.align(Alignment.BottomCenter).padding(Space.s3), Surface.Glass)
                BottomSheet(sheet, { sheet = false }, Surface.Glass, title = "Collection details") {
                    Text("These collections are available offline.", tone = TextTone.Secondary)
                    Button("Done", onClick = { sheet = false })
                }
            }
        }
    }
}
