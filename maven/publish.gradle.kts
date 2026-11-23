// The Maven publication of the Compose library. maven/build.ts copies it beside the `ui` module of
// a project that `xds create` makes under the name xds and applies it from there, so a scaffolded
// project carries none of it. It publishes every Kotlin target's artifact, with its sources, an
// empty documentation jar and a POM as Maven Central asks, to the directory `-Pxds.repository`
// names, at the version `-Pxds.version` gives. Signing needs SIGNING_KEY and SIGNING_PASSWORD.

import org.gradle.api.publish.PublishingExtension
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.api.publish.maven.tasks.AbstractPublishToMaven
import org.gradle.plugins.signing.Sign
import org.gradle.plugins.signing.SigningExtension

apply(plugin = "maven-publish")
apply(plugin = "signing")

group = "io.github.kjmin-dev"
version = providers.gradleProperty("xds.version").get()

configure<PublishingExtension> {
    repositories {
        maven {
            name = "release"
            url = uri(providers.gradleProperty("xds.repository").get())
        }
    }
    publications.withType<MavenPublication>().configureEach {
        val publication = name
        // Maven Central asks every artifact for a documentation jar. The KDoc is in the sources
        // jar, which editors read, so this one is empty. One per publication: a jar shared by
        // several would be signed by several tasks.
        val javadoc = tasks.register<Jar>("javadocJarFor${publication.replaceFirstChar(Char::uppercase)}") {
            archiveBaseName = "${project.name}-$publication"
            archiveClassifier = "javadoc"
        }
        artifact(javadoc)
        pom {
            name = "xds UI"
            description = "The components of the xds design system for Compose Multiplatform: Android, iOS and desktop."
            url = "https://github.com/kjmin-dev/xds"
            licenses {
                license {
                    name = "MIT License"
                    url = "https://opensource.org/license/mit"
                    distribution = "repo"
                }
            }
            developers {
                developer {
                    id = "kjmin-dev"
                    name = "kjmin-dev"
                    url = "https://github.com/kjmin-dev"
                }
            }
            scm {
                url = "https://github.com/kjmin-dev/xds"
                connection = "scm:git:https://github.com/kjmin-dev/xds.git"
                developerConnection = "scm:git:ssh://git@github.com/kjmin-dev/xds.git"
            }
        }
    }
}

// GitHub Actions gives a secret that is not set as an empty variable. That is no key: the files
// are left unsigned, the consumer checks still run, and upload.ts refuses to send them.
val signingKey = providers.environmentVariable("SIGNING_KEY").filter { it.isNotBlank() }
val signingPassword = providers.environmentVariable("SIGNING_PASSWORD").filter { it.isNotEmpty() }
if (signingKey.isPresent) {
    configure<SigningExtension> {
        useInMemoryPgpKeys(signingKey.get(), signingPassword.orNull)
        sign(the<PublishingExtension>().publications)
    }
    // Every publication's module file names the others' artifacts, so publishing one reads what
    // the other publications' signing tasks wrote.
    tasks.withType<AbstractPublishToMaven>().configureEach { dependsOn(tasks.withType<Sign>()) }
}
