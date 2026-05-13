# QUICK-REFERENCE — clean-repo

For the deeper view, see [[0930_ARCHITECTURE.md]] and
[[0930_CODE-SNIPPETS.md]].

## Install

```bash
git clone https://example.invalid/clean-repo
cd clean-repo
cargo build
npm install
pip install -e .
```

## Usage

Rust kernel — see `src/lib.rs:7`:

```rust
let a = agent_new("nat");
println!("{}", a.greet());
```

TypeScript engine — see `src/core.ts:10`:

```ts
const cfg = loadConfig();
const eng = new CoreEngine(cfg);
console.log(eng.run());
```

Python CLI — see `src/cli.py:12`:

```bash
python3 src/cli.py --verbose
```
