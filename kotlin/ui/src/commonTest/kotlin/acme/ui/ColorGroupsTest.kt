package acme.ui

import acme.tokens.LightColors
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ColorGroupsTest {
    @Test
    fun groupsByTheFirstWordInTokenOrder() {
        val groups = semanticColorGroups(listOf("text-primary" to 1, "border-default" to 2, "text-on-accent" to 3))
        assertEquals(listOf("text", "border"), groups.keys.toList())
        assertEquals(listOf("text-primary" to 1, "text-on-accent" to 3), groups["text"])
    }

    @Test
    fun leavesOutComponentColors() {
        val groups = semanticColorGroups(listOf("button-primary-text" to 1, "top-bar-border" to 2, "scrim" to 3))
        assertTrue(groups.isEmpty())
    }

    // Fails when a component color group is added to the tokens and not to the preview's list:
    // its colors would otherwise show up among the semantic ones.
    @Test
    fun theTokensHaveOnlyTheSemanticGroupsTheDocsName() {
        assertEquals(
            listOf("background", "text", "border", "accent", "control", "danger", "status", "overlay"),
            semanticColorGroups(LightColors.entries()).keys.toList(),
        )
    }
}
