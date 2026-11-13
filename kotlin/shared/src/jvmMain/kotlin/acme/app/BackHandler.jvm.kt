package acme.app

import androidx.compose.runtime.Composable

@Composable
internal actual fun BackHandler(onBack: () -> Unit) {
    // A desktop window has no Back button: the top bar's back mark is the way back.
}
