# CODE-SNIPPETS — clean-repo

Verbatim code excerpts. For structural overview see [[0930_ARCHITECTURE.md]];
for install/usage see [[0930_QUICK-REFERENCE.md]].

## Rust kernel

The public constructor and struct, end-to-end. From `src/lib.rs:7`:

```rust
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
```

## TypeScript engine

The TS half, including the config interface and load helper. From
`src/core.ts:4`:

```ts
export interface Config {
  name: string;
  verbose: boolean;
}

export class CoreEngine {
  constructor(private cfg: Config) {}
  run(): string {
    return `engine for ${this.cfg.name}`;
  }
}

export function loadConfig(): Config {
  return { name: "default", verbose: false };
}
```

## Python CLI

The argv-parsing shim and main entry. From `src/cli.py:8`:

```python
def parse_args(argv):
    return {"verbose": "--verbose" in argv}


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    print("running" if args["verbose"] else "quiet")
    return 0
```

## Three-language wiring

Each snippet stands alone — there is no shared state between the three
runtimes. Build each independently:

```bash
cargo build --release
tsc src/core.ts
python3 src/cli.py --verbose
```
