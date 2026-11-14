// What differs per platform. Everything else in this package is common code.

package acme.ui

import acme.tokens.Sizes
import androidx.compose.runtime.Composable

/** The sizes for the platform's input device: pointer on the desktop, touch on Android and iOS. */
expect val platformSizes: Sizes

/** Whether the system is set to reduce motion. False where the platform has no such setting to read. */
@Composable
internal expect fun systemReducedMotion(): Boolean

/**
 * A layer over the whole window, above everything else in it, for what interrupts the screen: a
 * sheet or a dialog, with its scrim. It takes the focus and every press while it is there. Back
 * and Escape call [onDismiss]. The layer draws nothing itself: the content fills it.
 */
@Composable
internal expect fun WindowLayer(onDismiss: () -> Unit, content: @Composable () -> Unit)
