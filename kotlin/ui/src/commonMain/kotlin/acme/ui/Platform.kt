// What differs per platform. Everything else in this package is common code.

package acme.ui

import acme.tokens.Sizes
import androidx.compose.runtime.Composable

/** The sizes for the platform's input device: pointer on the desktop, touch on Android and iOS. */
expect val platformSizes: Sizes

/**
 * A layer over the whole window, above everything else in it, for a sheet and its scrim. Back
 * and Escape call [onDismiss]. The layer draws nothing itself: the content fills it.
 */
@Composable
internal expect fun SheetWindow(onDismiss: () -> Unit, content: @Composable () -> Unit)
