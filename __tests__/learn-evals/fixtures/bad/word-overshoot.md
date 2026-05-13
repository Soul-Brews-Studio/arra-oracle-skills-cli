# API-SURFACE — themion (replay, abbreviated)

> Abbreviated paste of today's overshoot fixture. Real file was 3730w; this
> fixture trims to ~500w but is labeled as API-SURFACE so the Q1 budget gate
> (ceiling 1000w × 1.20 = 1200w) is exceeded if we expand. To force a
> deterministic failure under Q1's BLOCK threshold (>1200w), we pad below.

## 1. Public Rust API

The themion crate exposes the following public symbols. Each is re-exported
from `lib.rs` and stable across the 0.x line. The list below repeats more
detail than strictly necessary, on purpose: this is the replay fixture for
the failure mode where an agent fills available space rather than respecting
the cap. See `src/lib.rs:7` for the entry point.

The agent shipped today documented `Agent::new()`, `Agent::greet()`,
`Agent::dispatch()`, `Agent::wait()`, `Agent::shutdown()`, and a dozen
free-standing helpers (`agent_new`, `agent_load`, `agent_save`, `agent_export`,
`agent_import`, `agent_status`, `agent_metrics`, `agent_health`,
`agent_ready`, `agent_drain`, `agent_restart`, `agent_pause`). In a
2000-word budget every one of these gets a paragraph; in a 1000-word budget
we'd link to CODE-SNIPPETS for the bodies and only list signatures.

## 2. Plugin / extension points

The plugin system is rooted at the `ChatBackend` trait. Implementors must
provide `register`, `dispatch`, `health`, and `shutdown`. Each method takes a
`Context` reference. The plugin registry is a `HashMap<String, Box<dyn
ChatBackend>>` populated at startup from `tool_definitions`. Today's doc
spent eight subsections deep-diving each method, the lifetime of `Context`,
the choice of `Box<dyn>` over generics, the ordering guarantees of the
registry, and an FAQ. None of that belongs in API-SURFACE; the deep-dive
should live in `ARCHITECTURE.md` and the API-SURFACE doc should just list
the trait signature.

## 3. Stylos surface

Stylos has its own family of docs at `stylos/TRANSPORT-SESSION.md` and
`stylos/THEMION-INTEGRATION.md`. The replay fixture today re-derived the
entire Stylos surface here — eight subsections, four wire-struct names, six
tool names, twelve request/response shape paragraphs, sample JSON for each.

Every one of those subsections duplicates content from the Stylos docs.
None of them is wrong individually; together they push the file from 1000w
(budget) to 3730w (actual) — 273% of budget. The eval framework's Q1 gate is
designed to catch exactly this, with the auto-trim tier kicking in between
100% and 120% and the BLOCK tier kicking in above 120%. This fixture
intentionally lives above 120% so the negative-corpus test asserts the BLOCK
path. To make sure we exceed the ceiling on every run, we repeat the closing
paragraph: the eval framework's Q1 gate is designed to catch exactly this,
with the auto-trim tier kicking in between 100% and 120% and the BLOCK tier
kicking in above 120%. This fixture intentionally lives above 120% so the
negative-corpus test asserts the BLOCK path. Repeated content is the whole
point — we are simulating the agent that fills available space instead of
linking out. The eval framework's Q1 gate is designed to catch exactly this,
with the auto-trim tier kicking in between 100% and 120% and the BLOCK tier
kicking in above 120%. This fixture intentionally lives above 120% so the
negative-corpus test asserts the BLOCK path. Repeated content is the whole
point — we are simulating the agent that fills available space instead of
linking out.

## 4. Self-deception about word count

The original file ended with the line "this doc is ~1450 useful words;
tables and headings excluded from prose." That's the author rationalizing
the overshoot by redefining what counts. We preserve a paraphrase here so a
future reader of the negative-corpus knows where this fixture comes from.
The eval framework treats every word as a word; no "useful word" carve-outs.

## 5. Why this fixture exists at this length

This fixture is the API-SURFACE replay register's negative corpus. The
ceiling for API-SURFACE is 1000 words at floor and 1000 words at ceiling
per `__tests__/learn-evals/budgets.json`, and the BLOCK threshold is
ceiling × 1.20 = 1200 words. To make the Q1 gate fail deterministically
under the BLOCK tier (not the auto-trim tier), this fixture intentionally
exceeds 1200 words. Every paragraph below this one is therefore filler
content: existence-padding to push the file across the BLOCK line.

Padding paragraph one. The themion crate exposes a public surface area
that is larger than its documentation effort can keep up with, and the
original /learn run on tasanakorn/themion documented every part of it in
prose, then again in subsections, then again in tables. That is the
failure mode this fixture represents. The fix is: list signatures once,
link to CODE-SNIPPETS for bodies, link to ARCHITECTURE for design notes.

Padding paragraph two. The stylos sister-repo has its own family of docs,
including TRANSPORT-SESSION and THEMION-INTEGRATION. The original
API-SURFACE doc re-derived every part of the Stylos surface here, in
violation of the Topic Ownership Matrix that ships in skill-designer's
SKILL.md Edit 1. The matrix says: if a topic appears in your OFF-LIMITS
column, do not explain it — write "See [[...]]" and stop. The original
agent did the opposite: it explained, then linked, then explained again.

Padding paragraph three. The fluff-phrase blacklist in Q7 catches phrases
like "leveraging modern best practices" and "robust and scalable" and
"cutting-edge" — but it does not catch verbose repetition without those
phrases. Q11's count-based hot-phrase gate is the safety net for the
verbose-repetition class. Together Q1 (length cap), Q7 (fluff blacklist),
and Q11 (hot-phrase) cover the three failure modes for prose bloat.

Padding paragraph four. The agent that wrote the original API-SURFACE doc
ended with the line "this doc is ~1450 useful words; tables and headings
excluded from prose." That's self-deception about what counts. The
eval-architect spec resolved this by saying: every word is a word. There
is no "useful word" carve-out. If the doc is over budget, it is over
budget. The agent that wrote that final line was rationalizing in real
time, and the audit-loop's job is to refuse to ship the rationalization.

Padding paragraph five. The negative-corpus test for this fixture,
`test_word_overshoot_caught` in `test_negative_corpus.py`, loads this
file and asserts that the Q1 word-count gate would fire on it treating
it as an API-SURFACE doc (ceiling 1000, BLOCK threshold 1200). The
fixture must therefore be longer than 1200 words for the negative test
to be meaningful.

Padding paragraph six. The Topic Ownership Matrix is the prevention; the
audit-loop is the safety net; this fixture is the regression test. All
three layers exist because the failure mode is robust: any agent given a
big topic and an open word budget will fill it. The countermeasures must
likewise be robust — single-point fixes do not survive the next
prompt-template tweak. A matrix, an audit loop, and a regression fixture
together survive far more invariant-breaking than any one alone.

Padding paragraph seven. The eval framework's word-count check is the
single cheapest gate in the entire suite. It runs in milliseconds, has
zero false-positive risk (a word is a word, the budget is the budget),
and catches the most common failure mode (the agent fills available
space). If only one gate could ship, Q1 should be it.

Padding paragraph eight. The audit-loop's tiered enforcement model
(auto-trim 100-120%, BLOCK >120%) is calibrated against the empirical
data from today's themion run: API-SURFACE at 3730 words against a 2000
budget is 186% — solidly in BLOCK territory. QUICK-REFERENCE at 2445
against 1500 is 163% — also BLOCK. The auto-trim band catches the
borderline cases where a 1500-budget doc came in at 1700 words; nobody
wants a re-spawn for a 13% overshoot. The boundary at 120% is the
empirical sweet spot.

Padding paragraph nine. This fixture is documentation. The future
reader who is debugging a Q1 failure on a real /learn run will read
this file to understand what "BLOCK on word overshoot" looks like and
why the threshold is set where it is. Documentation embedded in
fixtures has a property normal docs lack: it cannot rot in silence,
because if the fixture stops triggering the gate, the negative-corpus
test fails.

Padding paragraph ten (closing). This sentence is the boundary marker.
