// The first screen of the app. Replace it with your own.

package acme.app

import acme.tokens.Space
import acme.tokens.Typography
import acme.ui.Badge
import acme.ui.BadgeTone
import acme.ui.Button
import acme.ui.ButtonVariant
import acme.ui.Card
import acme.ui.LocalColors
import acme.ui.Text
import acme.ui.TextTone
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
internal fun Home(onOpenDesign: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LocalColors.current.backgroundBase)
            // Keeps clear of the status bar, the notch and the home indicator.
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .padding(Space.s4),
        verticalArrangement = Arrangement.spacedBy(Space.s4),
    ) {
        Text("Acme", style = Typography.display, heading = true)
        Card(
            title = "Your app starts here",
            description = "This screen is kotlin/shared/src/commonMain/kotlin/acme/app/Home.kt.",
            actions = { Badge("Compose", tone = BadgeTone.Accent) },
        ) {
            Text("Build it from the components in acme.ui.", tone = TextTone.Secondary)
            Button("Open the design preview", onClick = onOpenDesign, variant = ButtonVariant.Primary)
        }
    }
}
