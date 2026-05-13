// core.ts — TypeScript half of the origin-fixture-repo.
// The "CODE-SNIPPETS" fixture doc cites this file at line 10 (run() definition).

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
