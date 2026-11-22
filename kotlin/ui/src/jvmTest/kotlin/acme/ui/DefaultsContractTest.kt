package acme.ui

import java.io.File
import java.lang.reflect.Modifier
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

// An option whose values the contract lists one by one, short of `surface`, which only the
// touch clients have: the web libraries' Defaults covers the same ones.
private val Enumerated = listOf("variant", "size", "tone", "shape", "ratio", "layout")

// Text takes its variant as a type role, under the name its parameter has.
private val Renamed = mapOf("Text.variant" to "style")

class DefaultsContractTest {
    @Test
    fun everyEnumeratedOptionOfAComposeComponentCanBeGivenADefault() {
        // Gradle runs the tests in the module's directory, two below the one design/ is in.
        val contract = Json.parseToJsonElement(File("../../design/components.json").readText()).jsonObject
        val expected = sortedMapOf<String, List<String>>()
        for (component in contract.getValue("components").jsonArray.map { it.jsonObject }) {
            if ("kotlin-compose" !in component.getValue("clients").jsonObject) continue
            val name = component.getValue("name").jsonPrimitive.content
            val options = component.getValue("options").jsonObject
            val listed = Enumerated.filter { options[it] is JsonArray }.map { Renamed["$name.$it"] ?: it }
            if (listed.isNotEmpty()) expected[name] = listed.sorted()
        }

        val actual = sortedMapOf<String, List<String>>()
        for (getter in ComponentDefaults::class.java.declaredMethods.filter { it.name.startsWith("get") }) {
            val component = getter.name.removePrefix("get")
            // Static fields are the Compose compiler's, such as `${'$'}stable`.
            val fields = getter.returnType.declaredFields.filterNot { Modifier.isStatic(it.modifiers) }
            actual[component] = fields.map { it.name }.sorted()
        }
        assertEquals(expected, actual)
    }
}
