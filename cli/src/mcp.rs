//! `xds mcp`: a Model Context Protocol server on stdin and stdout, for agents that cannot run a
//! shell. Every tool is one of the commands with `--json`, so the two never disagree.
//!
//! Tools that write take `write`, and without it only say what they would do.

use std::path::PathBuf;

use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, ContentBlock, Implementation, ServerCapabilities, ServerConfig};
use rmcp::{ServerHandler, ServiceExt, schemars, tool, tool_handler, tool_router};
use serde::Deserialize;
use serde_json::Value;

use crate::commands::{self, AddArgs, CreateArgs, ThemeArgs};
use crate::error::Error;
use crate::inspect::{self, ComponentsArgs, ContrastArgs, DoctorArgs, TokensArgs};
use crate::output::Out;
use crate::style::Style;

/// What a tool sends back: the command's JSON result, or its error message.
fn reply(result: crate::error::Result<Value>) -> CallToolResult {
    let text = |value: &Value| {
        vec![ContentBlock::text(
            serde_json::to_string_pretty(value).expect("a JSON value can be written"),
        )]
    };
    match result {
        Ok(value) => CallToolResult::success(text(&value)),
        // A check that did not pass is still an answer.
        Err(Error::Failed(value)) => CallToolResult::success(text(&value)),
        Err(error) => CallToolResult::error(vec![ContentBlock::text(error.to_string())]),
    }
}

/// Nothing is printed for a person: stdout carries the protocol.
fn out() -> Out {
    Out::new(Style::plain(), true)
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct TokensRequest {
    /// Part of a token path, such as `button` or `color.text`. Omit for every token.
    query: Option<String>,
    /// One of: palette, semantic, component, base.
    tier: Option<String>,
    /// Project directory. Defaults to the working directory, else the built-in template.
    project: Option<PathBuf>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ComponentsRequest {
    /// Only this client: web-react, desktop-gpui, mobile-react-native or kotlin-compose.
    client: Option<String>,
    project: Option<PathBuf>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ComponentRequest {
    /// Component name, such as `Button`.
    name: String,
    /// Only this client.
    client: Option<String>,
    /// Include the source code on each client.
    #[serde(default)]
    code: bool,
    project: Option<PathBuf>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ContrastRequest {
    /// Hex color (`#4f46e5`) or color token (`text.secondary`).
    foreground: String,
    /// Hex color or color token (`background.surface`).
    background: String,
    /// Required ratio: 4.5 for text, 3 for large text and UI parts.
    min: Option<f64>,
    project: Option<PathBuf>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ProjectRequest {
    project: Option<PathBuf>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CreateRequest {
    /// Where to create the project.
    directory: PathBuf,
    /// Lowercase letters and digits, starting with a letter.
    name: String,
    /// Target ids, or `["all"]`.
    targets: Vec<String>,
    theme: Option<String>,
    /// Display name. Defaults to the name, capitalized.
    title: Option<String>,
    /// Write the files. Without it this is a dry run.
    #[serde(default)]
    write: bool,
    /// Allow a directory that is not empty.
    #[serde(default)]
    force: bool,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct AddRequest {
    targets: Vec<String>,
    project: Option<PathBuf>,
    /// Write the files. Without it this is a dry run.
    #[serde(default)]
    write: bool,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ThemeRequest {
    /// Theme name, from `list`.
    name: String,
    project: Option<PathBuf>,
    /// Change the project. Without it this is a dry run.
    #[serde(default)]
    write: bool,
}

#[derive(Debug, Clone)]
struct Server {
    tool_router: ToolRouter<Self>,
}

#[tool_router]
impl Server {
    #[tool(description = "List the client stacks (targets) and color themes.")]
    fn list(&self) -> CallToolResult {
        reply(commands::list(out()))
    }

    #[tool(description = "Design tokens with their value per mode or input device.")]
    fn tokens(&self, Parameters(request): Parameters<TokensRequest>) -> CallToolResult {
        reply(inspect::tokens(
            &TokensArgs {
                query: request.query,
                tier: request.tier,
                project: request.project,
            },
            out(),
        ))
    }

    #[tool(description = "List the components and which clients have each.")]
    fn components(&self, Parameters(request): Parameters<ComponentsRequest>) -> CallToolResult {
        reply(inspect::components(
            &ComponentsArgs {
                name: None,
                code: false,
                client: request.client,
                project: request.project,
            },
            out(),
        ))
    }

    #[tool(description = "One component: options, states, tokens, source per client.")]
    fn component(&self, Parameters(request): Parameters<ComponentRequest>) -> CallToolResult {
        reply(inspect::components(
            &ComponentsArgs {
                name: Some(request.name),
                code: request.code,
                client: request.client,
                project: request.project,
            },
            out(),
        ))
    }

    #[tool(description = "WCAG contrast between two colors or color tokens, per mode.")]
    fn contrast(&self, Parameters(request): Parameters<ContrastRequest>) -> CallToolResult {
        reply(inspect::contrast(
            &ContrastArgs {
                foreground: request.foreground,
                background: request.background,
                min: request.min,
                project: request.project,
            },
            out(),
        ))
    }

    #[tool(description = "Check a project: record, tokens, theme, generated files.")]
    fn doctor(&self, Parameters(request): Parameters<ProjectRequest>) -> CallToolResult {
        reply(inspect::doctor(
            &DoctorArgs {
                project: request.project,
            },
            out(),
        ))
    }

    #[tool(description = "Scaffold a project. Dry run unless `write` is true.")]
    fn create(&self, Parameters(request): Parameters<CreateRequest>) -> CallToolResult {
        reply(commands::create(
            &CreateArgs {
                directory: request.directory,
                name: Some(request.name),
                title: request.title,
                targets: Some(request.targets),
                theme: request.theme,
                yes: true,
                dry_run: !request.write,
                force: request.force,
            },
            out(),
        ))
    }

    #[tool(description = "Add client stacks to a project. Dry run unless `write` is true.")]
    fn add(&self, Parameters(request): Parameters<AddRequest>) -> CallToolResult {
        reply(commands::add(
            &AddArgs {
                targets: request.targets,
                project: request.project,
                dry_run: !request.write,
            },
            out(),
        ))
    }

    #[tool(description = "Apply a color theme to a project. Dry run unless `write` is true.")]
    fn theme(&self, Parameters(request): Parameters<ThemeRequest>) -> CallToolResult {
        reply(commands::theme(
            &ThemeArgs {
                name: Some(request.name),
                project: request.project,
                dry_run: !request.write,
            },
            out(),
        ))
    }
}

#[tool_handler(router = self.tool_router)]
impl ServerHandler for Server {
    fn get_info(&self) -> ServerConfig {
        ServerConfig::new(ServerCapabilities::builder().enable_tools().build())
            .with_server_info(Implementation::new("xds", env!("CARGO_PKG_VERSION")))
            .with_instructions(
                "Answers questions about an xds design system (tokens, components, themes, \
             contrast) and scaffolds projects. Tools read the project in the working directory, \
             or the template built into xds. Tools that write are dry runs unless `write` is true.",
            )
    }
}

/// Serves until the client closes stdin.
pub fn serve() -> crate::error::Result<Value> {
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    runtime
        .block_on(async {
            let server = Server {
                tool_router: Server::tool_router(),
            };
            let service = server
                .serve(rmcp::transport::stdio())
                .await
                .map_err(|error| error.to_string())?;
            service.waiting().await.map_err(|error| error.to_string())?;
            Ok::<(), String>(())
        })
        .map_err(Error::Message)?;
    Ok(Value::Null)
}
