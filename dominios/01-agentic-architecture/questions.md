# Questions — Domain 1: Agentic Architecture & Orchestration

20 scenario-based questions. Single correct answer each. Scenarios and options are in English,
matching the exam.

**Respostas:** ficam em [`gabarito.md`](./gabarito.md), em arquivo separado de propósito —
responda as 20 antes de abrir. As explicações lá estão em português.

**Checkpoint:** ≥ 80% (16/20) closes Domain 1.

Coverage: agentic loop (Q1, Q9) · sessions and continuity (Q2, Q10, Q17) · subagents (Q3, Q11,
Q18) · delegation and parallel execution (Q4, Q12, Q19) · explicit context passing (Q5, Q13) ·
hooks (Q6, Q14, Q20) · task decomposition (Q7, Q15) · human escalation (Q8, Q16).

---

### Question 1

A team builds an agent that turns a written specification into a service implementation. The
loop is: read the spec, write the files, run a style linter, and mark the task complete when the
linter is clean. In production, the agent regularly reports tasks as complete when the code does
not compile. The generated code is stylistically clean every time.

What is the correct architectural fix?

A. Raise the agent's iteration limit so it has more turns available to correct its own output.
B. Expand the linter's rule set so it catches a broader class of defects.
C. Make the build and the test suite the loop's verification step, and have the agent act on
   their output before it can mark the task complete.
D. Add few-shot examples of correct implementations to the generation prompt.

---

### Question 2

A customer support agent runs one long-lived session per customer. In sessions that pass roughly
forty turns, the agent starts quoting an outdated refund policy — the correct policy was stated
in the first message of the conversation and has not changed. Short sessions never show the
problem.

What is the most likely cause and the correct fix?

A. The session was resumed with the wrong flag; use `--continue` instead of `--resume` so the
   original instructions are preserved.
B. Compaction discarded the early instruction; move the policy out of conversation history into
   a location that reloads every turn, such as `CLAUDE.md` or the system prompt.
C. The model's attention degrades over long conversations; lower the temperature so it adheres
   more closely to earlier instructions.
D. Move to a 1M-context model so that compaction never triggers and the original message always
   stays in the window.

---

### Question 3

A data platform team's incident-investigation agent runs out of context partway through most
investigations. The workflow has four steps, and the team wants to move exactly one of them into
a subagent to reclaim the most context.

Which step is the best candidate?

A. Rendering the final incident summary into the team's report template.
B. The back-and-forth with the on-call engineer to agree on the incident's severity rating.
C. Applying the one-line configuration change that resolves the incident.
D. Reading 340 rotated log files to identify the three error signatures that spike before the
   outage.

---

### Question 4

A research pipeline has four stages: (1) find candidate sources on a topic, (2) summarize each
source that was found, (3) write a report from the summaries, and (4) check the report's claims
against the original sources.

Which stages can safely run in parallel?

A. Only stage 2, with one subagent per source.
B. Stages 2 and 3, because both operate on the same source material.
C. Stages 3 and 4, because writing and checking are separate concerns that can proceed
   simultaneously.
D. All four, since each stage is handled by a specialized agent with its own context window.

---

### Question 5

An orchestrator fans out five subagents to research a market segment. Each subagent receives the
topic, the same objective ("research this market segment"), the list of approved sources, and the
required output format. The five responses come back well written — and nearly identical, all
covering the same sub-topic.

What should the architect change?

A. Increase the number of subagents so the extra coverage surfaces the neglected sub-topics.
B. Raise each subagent's `maxTurns` so it explores its assignment more deeply before answering.
C. Give each subagent its own explicit slice of the problem **and** the list of the slices
   assigned to the others.
D. Have the orchestrator deduplicate the five responses during synthesis and request
   replacements for the redundant ones.

---

### Question 6

A team adds a line to their project `CLAUDE.md`: "Never edit files under `infra/prod/`." Two
weeks later, during a long session, an agent edits a file under `infra/prod/`. Reviewing the
transcript, the team confirms the agent had no malicious prompt — it simply proceeded.

What is the correct fix?

A. Restate the rule at the very top of `CLAUDE.md`, in bold, so it carries more weight.
B. Add a `PreToolUse` hook matching `Edit|Write` that exits with code 2 when the target path is
   under `infra/prod/`.
C. Add a `PostToolUse` hook matching `Edit|Write` that logs every write under `infra/prod/` so
   violations are caught in the audit review.
D. Move the rule into a path-specific rules file scoped to `infra/prod/**` so it applies only
   where it matters.

---

### Question 7

An architect proposes decomposing "migrate the authentication service from session cookies to
OAuth2" into six subagents running in parallel, each owning one part of the migration, with the
orchestrator merging their work at the end.

What is the strongest objection to this plan?

A. Six concurrent subagents exceeds Claude Code's default concurrency limit, so the spawns will
   fail.
B. Each subagent starts with a fresh context and would have to rediscover the existing
   authentication call sites, so the same investigation is duplicated six times.
C. Multi-agent systems use roughly 15× the tokens of a plain chat interaction, and the migration
   does not justify that cost.
D. The six parts touch the same code and the same schema, and "migrated correctly" is only
   verifiable with the whole system running — so the parts are neither independent nor
   independently verifiable.

---

### Question 8

A support agent processes refunds. Policy says refunds up to R$ 200 are automatic. A customer
requests R$ 180. The order falls outside the 30-day refund window, but the customer record
carries an account-manager note reading "VIP customer — handle with flexibility."

What should the agent do?

A. Escalate to a human, presenting the amount, the 30-day rule, the VIP note, and the two
   defensible readings.
B. Apply the more restrictive rule and decline the refund, since the 30-day window is explicit
   policy and the VIP note is not.
C. Apply the more specific rule and issue the refund, since the VIP note was written about this
   particular customer.
D. Retry the decision with a clarifying prompt that asks the model to weigh the two rules and
   commit to one.

---

### Question 9

A finance team needs to pull the invoice number, issue date, and total from 50,000 scanned
invoices. The vendor's invoice layout is consistent across all of them, and the team already
staffs a small queue of humans who handle exceptions.

Which architecture fits this workload?

A. An orchestrator that fans out one subagent per invoice field, then merges the three results.
B. A single structured-output call per invoice, validated against a JSON Schema, with records
   that fail validation routed to the existing human queue.
C. An agentic loop per invoice that re-reads the document and retries until the agent is
   confident in all three fields.
D. A multi-agent pipeline with a reader agent, an extractor agent, and a reviewer agent that
   cross-checks the extractor's output.

---

### Question 10

An engineer is 30 turns into a session that established a working approach to a tricky bug. She
wants to try a completely different approach, but wants the current conversation preserved
intact so she can come back to it if the experiment fails.

Which mechanism fits?

A. `claude --continue`, which reopens the most recent session in the directory.
B. `claude --resume`, which lets her pick the session from a list.
C. `--fork-session` (or `/branch`), which copies the history into a new session ID and leaves
   the original untouched.
D. `/clear` followed by re-explaining the bug and the established approach in a fresh session.

---

### Question 11

A project's `CLAUDE.md` documents a naming convention. Separately, in turn 12 of a long session,
the team and the agent agreed to deviate from that convention for one specific module. The
orchestrator then delegates work on that module to a subagent. The subagent follows the
documented convention and ignores the agreed deviation.

Why?

A. A subagent receives the `CLAUDE.md` hierarchy but does not receive the parent's conversation
   history, so the turn-12 agreement never reached it.
B. The subagent's `tools` list omitted `Read`, so it could not load the file where the deviation
   was recorded.
C. Subagents always run with `omitClaudeMd: true` by default, so neither the convention nor the
   deviation was available and the subagent guessed.
D. The parent's context was compacted before delegation, which dropped the turn-12 agreement
   from the message it sent.

---

### Question 12

Two workers in a fan-out both append their findings to the same scratchpad file, which the
synthesis step later reads. The pipeline produces a different final report on each run, even
with identical inputs. No errors are raised.

What is the correct diagnosis and fix?

A. The workers are hitting a race in the file API; add retries with backoff around the writes.
B. The concurrency limit is throttling one worker; raise
   `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`.
C. Language models are inherently non-deterministic; set the temperature to 0 for both workers.
D. The branches share mutable state, so they are not independent; make the workers read-only and
   concentrate all writes in the orchestrator's synthesis step.

---

### Question 13

An orchestrator has already resolved a customer's account ID, pulled their current plan tier,
and located the relevant contract file path. It then delegates "analyze this customer's upgrade
options" to a subagent, passing the objective, the output format, and the approved data sources.
The subagent spends most of its turns re-running the same lookups the orchestrator already
completed.

What is missing from the delegation prompt?

A. The output format, which would have told the subagent when it had gathered enough.
B. A tighter objective, which would have kept the subagent from exploring unrelated data.
C. The concrete facts the orchestrator already holds — the account ID, the plan tier, and the
   contract file path.
D. A higher `maxTurns`, so the subagent can finish the lookups and still have turns left for the
   analysis.

---

### Question 14

A platform team wants to record the token cost and duration of every subagent a session spawns,
into a central ledger. The record must be written for every subagent that finishes — including
the ones that fail partway through.

Which hook event should they configure?

A. `Stop`, which fires when Claude finishes responding.
B. `PostToolUse` with a matcher on the subagent-spawning tool, which fires once the tool call
   returns.
C. `SessionEnd`, which fires when the session terminates and all subagent activity is known.
D. `SubagentStop`, which fires when a subagent finishes.

---

### Question 15

A content team decomposes "improve the product onboarding copy" into five subagents, each
rewriting one section. The orchestrator concatenates the five rewrites and ships the result.
Nobody on the team can say whether any individual rewrite improved on the original or made it
worse.

Which decomposition criterion did this plan violate?

A. Independence — the five sections are part of one document, so they cannot be worked on
   separately.
B. Verifiability — there is no objective criterion for judging whether any single rewrite
   succeeded, so the orchestrator incorporates unevaluable output as if it were finished work.
C. Context size — five subagents each returning a full section consumes more context than
   writing the copy in the main session.
D. Concurrency — five parallel subagents exceed what a single session can coordinate reliably.

---

### Question 16

A support agent needs a customer's order status before it can answer. The order-lookup tool
returns HTTP 503 twice in a row. The agent has made no changes to any system and has taken no
irreversible action.

What should it do?

A. Escalate to a human, since two consecutive failures indicate the agent is out of hypotheses.
B. Escalate to a human, because anything touching a customer's order is an irreversible
   operation.
C. Report to the customer that the order cannot be found, and offer to open a ticket.
D. Retry with exponential backoff, since a 503 is a transient failure rather than an escalation
   trigger.

---

### Question 17

A session has been running for hours. It is getting expensive per request, but the task is
ongoing and several architectural decisions established earlier in the conversation still govern
the work. The engineer wants to cut cost without losing those decisions.

What is the right move?

A. Run `/compact` with a focus instruction naming the decisions that must survive.
B. Start a fresh session and restate the decisions from memory.
C. Switch to a smaller, cheaper model with `/model` so each request costs less.
D. Fork the session with `--fork-session`, since the fork starts with a smaller context.

---

### Question 18

An agent was changed to delegate every file read to a subagent, on the theory that keeping file
contents out of the main context would speed things up. Most files are under 100 lines. End-to-
end latency got substantially worse, even though the main context stayed smaller than before.

What explains this?

A. The subagents exceeded the default nesting depth limit and were silently retried.
B. A subagent that is not a fork starts fresh and must gather its own context, so the round-trip
   costs more than the small read it replaces.
C. The subagents inherited the parent's model, so each small read ran on the same large model the
   parent uses.
D. Each subagent returned a full summary of the file, so the parent's context grew faster than
   if it had read the files directly.

---

### Question 19

A team had strong results using an orchestrator that fans out research subagents across
independent sources. They applied the same pattern to a code refactor: six subagents, each
refactoring one part of the same module, merged at the end. Results were worse than a single
agent doing the refactor sequentially, at roughly 15× the token cost of a chat interaction.

What explains the difference between the two applications of the pattern?

A. The refactor needed a more capable orchestrator model to merge the six outputs correctly.
B. Six subagents is too few to cover a refactor; research succeeded because it used more of
   them.
C. Research sources are independent, while the parts of a refactor have many dependencies on
   each other and share the same context — a domain the pattern does not fit.
D. The refactor subagents should have been given write access to a shared branch so their
   changes would merge cleanly.

---

### Question 20

A team agrees that every agent-authored commit message in their repository must pass an
organization-wide format check. The rule must apply to every engineer on the team, including new
hires who clone the repo tomorrow, without anyone having to configure anything locally.

Where should the hook be configured?

A. In `.claude/settings.json`, committed to the repository.
B. In `~/.claude/settings.json` on each engineer's machine.
C. In `.claude/settings.local.json`, so each engineer's copy stays independent.
D. As an instruction in the project's `CLAUDE.md`, which every session loads automatically.

---

As respostas, com a explicação de cada distrator, estão em [`gabarito.md`](./gabarito.md).
