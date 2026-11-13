package acme.app

import androidx.compose.runtime.Composable

@Composable
internal actual fun BackHandler(onBack: () -> Unit) {
    androidx.activity.compose.BackHandler(onBack = onBack)
}
