---
pattern: "Eval frameworks teach what passing looks like — fixture quality is curriculum quality."
date: 2026-05-13
source: __tests__/rrr-evals/fixtures/ψ/memory/retrospectives/2026-05/13/12.00_sample-good.md
concepts:
  - eval-design
  - fixture-as-documentation
  - anti-rationalization
  - audit-loop
---

# Eval frameworks teach what passing looks like

When the fixture-good case is shallow, the eval framework teaches shallowness.
When the fixture-good case is honest, the eval teaches honesty. The sample
fixture is not test data — it is curriculum. Every new eval gate added to /rrr
should be reflected first in the sample-good fixture so that "passing" means
"matches the sample," not "passes the regex."

The Round 3 brainstorm spec said `assert anti_rationalization` but the brainstorm
itself flagged that gate 2 (excavation) can pass with theater. The sample-good
fixture must demonstrate genuine excavation, otherwise the test green-lights
shallow excavation in production retros.
