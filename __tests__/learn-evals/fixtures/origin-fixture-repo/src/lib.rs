// origin-fixture-repo — synthetic mini-repo for eval-framework fixture tests.
// Three files (Rust + TS + Python) so the green-path docs can cite real file:line refs.

pub mod core;

/// Public entrypoint — the only function the "ARCHITECTURE" doc names.
pub fn agent_new(name: &str) -> Agent {
    Agent { name: name.to_string() }
}

pub struct Agent {
    pub name: String,
}

impl Agent {
    pub fn greet(&self) -> String {
        format!("hello from {}", self.name)
    }
}
