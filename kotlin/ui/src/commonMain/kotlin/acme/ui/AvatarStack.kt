package acme.ui

import acme.tokens.Border
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role

/** One of the people in an [AvatarStack]: what an [Avatar] takes. */
data class AvatarPerson(val name: String, val src: String? = null)

/**
 * Several people as one group: who is in a room, who edited a page. The avatars overlap, and a
 * last circle counts the people that did not fit. A screen reader gets the stack as one image.
 *
 * @param max How many avatars to draw before the rest are counted.
 * @param label What a screen reader says instead of everyone's name, such as "5 members".
 */
@Composable
fun AvatarStack(
    people: List<AvatarPerson>,
    modifier: Modifier = Modifier,
    max: Int = 4,
    size: AvatarSize = AvatarSize.Md,
    label: String? = null,
) {
    val colors = LocalColors.current
    val diameter = avatarDiameter(LocalSizes.current, size)
    val shown = people.take(max.coerceAtLeast(0))
    val more = people.size - shown.size
    // Around the circle, not inside it, so an avatar in a stack is as large as one on its own.
    // Each ring covers the edge of the avatar before it, which is what reads as the gap.
    val ring = Modifier.drawBehind {
        drawCircle(colors.avatarRing, radius = this.size.minDimension / 2 + Border.widthThick.toPx())
    }
    Row(
        modifier = modifier.clearAndSetSemantics {
            contentDescription = label ?: stackName(people)
            role = Role.Image
        },
        horizontalArrangement = Arrangement.spacedBy(-diameter / 4),
    ) {
        for (person in shown) AvatarCircle(person.name, person.src, size, ring)
        if (more > 0) {
            Box(
                modifier = ring.size(diameter).background(colors.avatarOverflowBackground, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                BasicText(
                    text = "+$more",
                    style = avatarTextStyle(size).resolved(colors.avatarOverflowText),
                    softWrap = false,
                    maxLines = 1,
                )
            }
        }
    }
}

/** Everyone's name, including the people the stack only counts. */
internal fun stackName(people: List<AvatarPerson>): String = people.joinToString(", ") { it.name }
