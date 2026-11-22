// Layer 6 of the library's customization (docs/library.md): the variant, size, tone, shape,
// ratio or layout a component takes when the app passes none. The web libraries' `Defaults` does
// the same, for the same components and options.

package acme.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.text.TextStyle

/** The defaults of an [Avatar]. */
@Immutable
class AvatarDefaults(val size: AvatarSize? = null)

/** The defaults of an [AvatarStack]. */
@Immutable
class AvatarStackDefaults(val size: AvatarSize? = null)

/** The defaults of a [Badge]. */
@Immutable
class BadgeDefaults(val tone: BadgeTone? = null)

/** The defaults of a [Banner]. */
@Immutable
class BannerDefaults(val tone: BannerTone? = null)

/** The defaults of a [Button]. */
@Immutable
class ButtonDefaults(val variant: ButtonVariant? = null, val size: ControlSize? = null)

/** The defaults of an [Icon]. */
@Immutable
class IconDefaults(val size: IconSize? = null)

/** The defaults of an [IconButton]. */
@Immutable
class IconButtonDefaults(val variant: ButtonVariant? = null, val size: ControlSize? = null)

/** The defaults of a [MediaCard]. */
@Immutable
class MediaCardDefaults(val layout: MediaCardLayout? = null)

/** The defaults of a [Skeleton]. */
@Immutable
class SkeletonDefaults(val shape: SkeletonShape? = null)

/** The defaults of a [Spinner]. */
@Immutable
class SpinnerDefaults(val size: SpinnerSize? = null)

/**
 * The defaults of a [Text]. Its variant is a type role, as [Text] takes it: `Typography.title`.
 * A [style] set here wins over the type role a component sets for the content it holds.
 */
@Immutable
class TextDefaults(val style: TextStyle? = null, val tone: TextTone? = null)

/** The defaults of a [Thumbnail]. */
@Immutable
class ThumbnailDefaults(val ratio: ThumbnailRatio? = null)

/**
 * What the components inside [Defaults] take for an option they are given no value for. An
 * option left null keeps the value of the [Defaults] around this one, or else the component's
 * own default.
 */
@Immutable
class ComponentDefaults(
    val avatar: AvatarDefaults = AvatarDefaults(),
    val avatarStack: AvatarStackDefaults = AvatarStackDefaults(),
    val badge: BadgeDefaults = BadgeDefaults(),
    val banner: BannerDefaults = BannerDefaults(),
    val button: ButtonDefaults = ButtonDefaults(),
    val icon: IconDefaults = IconDefaults(),
    val iconButton: IconButtonDefaults = IconButtonDefaults(),
    val mediaCard: MediaCardDefaults = MediaCardDefaults(),
    val skeleton: SkeletonDefaults = SkeletonDefaults(),
    val spinner: SpinnerDefaults = SpinnerDefaults(),
    val text: TextDefaults = TextDefaults(),
    val thumbnail: ThumbnailDefaults = ThumbnailDefaults(),
) {
    /** These defaults with every option [inner] gives in place of this one's. */
    internal fun with(inner: ComponentDefaults) = ComponentDefaults(
        avatar = AvatarDefaults(inner.avatar.size ?: avatar.size),
        avatarStack = AvatarStackDefaults(inner.avatarStack.size ?: avatarStack.size),
        badge = BadgeDefaults(inner.badge.tone ?: badge.tone),
        banner = BannerDefaults(inner.banner.tone ?: banner.tone),
        button = ButtonDefaults(inner.button.variant ?: button.variant, inner.button.size ?: button.size),
        icon = IconDefaults(inner.icon.size ?: icon.size),
        iconButton = IconButtonDefaults(inner.iconButton.variant ?: iconButton.variant, inner.iconButton.size ?: iconButton.size),
        mediaCard = MediaCardDefaults(inner.mediaCard.layout ?: mediaCard.layout),
        skeleton = SkeletonDefaults(inner.skeleton.shape ?: skeleton.shape),
        spinner = SpinnerDefaults(inner.spinner.size ?: spinner.size),
        text = TextDefaults(inner.text.style ?: text.style, inner.text.tone ?: text.tone),
        thumbnail = ThumbnailDefaults(inner.thumbnail.ratio ?: thumbnail.ratio),
    )
}

/** The defaults in effect. The components read it in their parameters' default values. */
internal val LocalComponentDefaults = staticCompositionLocalOf { ComponentDefaults() }

/**
 * Gives the components inside it a default for their variant, size, tone, shape, ratio or
 * layout: `Defaults(ComponentDefaults(button = ButtonDefaults(size = ControlSize.Lg)))`. A value
 * the app passes to a component wins. One inside another replaces only the options it names.
 * The parts a component draws itself, such as a banner's action, keep their own options.
 */
@Composable
fun Defaults(value: ComponentDefaults, content: @Composable () -> Unit) {
    val outer = LocalComponentDefaults.current
    val merged = remember(outer, value) { outer.with(value) }
    CompositionLocalProvider(LocalComponentDefaults provides merged, content = content)
}
