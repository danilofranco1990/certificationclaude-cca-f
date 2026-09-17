/**
 * Lab do Domínio 1 — CCAR-F
 * Orquestrador com fan-out: um tópico, três subagents em paralelo, uma síntese.
 *
 * O que este arquivo demonstra (os quatro conceitos de prova):
 *
 *  1. FAN-OUT — três recortes independentes do mesmo problema disparados de uma vez
 *     com `Promise.all`. O paralelismo só é seguro porque os três recortes não
 *     compartilham estado mutável: nenhum worker lê a saída de outro.
 *
 *  2. ISOLAMENTO DE CONTEXTO — cada `query()` do Claude Agent SDK abre sua própria
 *     sessão, com janela de contexto própria. O worker 2 não enxerga nada do que o
 *     worker 1 produziu, e o sintetizador não enxerga nada dos três.
 *
 *  3. PASSAGEM EXPLÍCITA DE CONTEXTO — como nada é herdado, tudo que o worker
 *     precisa saber tem de estar no prompt dele: o tópico, o briefing comum, o
 *     recorte que lhe cabe, os recortes dos colegas (para não duplicar trabalho) e
 *     o formato de saída. `settingSources: []` corta até o CLAUDE.md do projeto,
 *     para deixar visível que nada chega por osmose.
 *
 *  4. SÍNTESE — o orquestrador cola as três saídas no prompt do sintetizador.
 *     Esse "colar" é a passagem explícita de contexto acontecendo de novo.
 *
 * Uso:
 *   npx tsx orchestrator.ts "agentic RAG tradeoffs"
 */

import {
  query,
  type AgentDefinition,
  type Options,
} from "@anthropic-ai/claude-agent-sdk";

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/**
 * Model id. O default é `claude-sonnet-5` porque este lab existe para ser rodado
 * várias vezes — o que se mede aqui é a forma da orquestração, não a qualidade
 * da prosa dos workers, e o paralelismo aparece igual nos dois modelos.
 *
 * Para ver saída mais próxima da qualidade real de um pipeline de pesquisa:
 *   LAB_MODEL=claude-opus-5 npx tsx orchestrator.ts "<tópico>"
 */
const MODEL = process.env.LAB_MODEL ?? "claude-sonnet-5";

/** Teto de gasto por chamada, como rede de segurança do lab. */
const MAX_BUDGET_USD = Number(process.env.LAB_MAX_BUDGET_USD ?? "1.50");

/**
 * Opções comuns a todas as chamadas.
 *
 * `allowedTools: []` deixa os workers sem ferramenta alguma. Isso é deliberado:
 * o ponto do lab é medir o paralelismo da orquestração, e um worker que sai
 * navegando pelo disco ou pela web torna o tempo de cada ramo imprevisível.
 * Num pipeline de pesquisa real, é aqui que entrariam WebSearch/WebFetch.
 *
 * `settingSources: []` impede que settings de usuário/projeto e CLAUDE.md entrem
 * na sessão do worker — a demonstração de que contexto não passa implicitamente.
 */
const BASE_OPTIONS: Options = {
  model: MODEL,
  // Sem ferramentas, uma resposta basta — mas `maxTurns` conta round-trips de
  // API, e o passo de thinking do modelo consome um. `1` derruba a chamada com
  // "Reached maximum number of turns"; 4 dá folga sem deixar o worker vagar.
  maxTurns: 4,
  allowedTools: [],
  settingSources: [],
  // Nenhuma skill carregada. Junto com `settingSources: []`, fecha o último
  // canal por onde contexto do ambiente entraria na sessão do worker sem ter
  // sido passado explicitamente no prompt.
  skills: [],
  maxBudgetUsd: MAX_BUDGET_USD,
};

// ---------------------------------------------------------------------------
// Os três recortes (lenses)
// ---------------------------------------------------------------------------

type Lens = {
  id: string;
  /** Papel do worker — vira o system prompt da sessão isolada dele. */
  role: string;
  /** A pergunta específica deste recorte. */
  assignment: string;
};

const LENSES: Lens[] = [
  {
    id: "mecanismo",
    role:
      "You are a systems analyst. You explain how a technique actually works at " +
      "the level of components and data flow. You never speculate about adoption " +
      "or market trends.",
    assignment:
      "Explain the MECHANISM: what the moving parts are, how data and control " +
      "flow between them, and which design decisions are load-bearing.",
  },
  {
    id: "custos-e-falhas",
    role:
      "You are a reliability engineer. You care about what breaks, what it costs, " +
      "and how failure is detected. You never explain basic mechanics.",
    assignment:
      "Explain the COSTS AND FAILURE MODES: latency, token/monetary cost, the " +
      "specific ways this fails in production, and how each failure is detected.",
  },
  {
    id: "criterios-de-decisao",
    role:
      "You are a solutions architect. You produce decision criteria, not " +
      "tutorials. You are explicit about when NOT to use something.",
    assignment:
      "Produce DECISION CRITERIA: the conditions under which this is the right " +
      "choice, the simpler alternative it should lose to, and the concrete " +
      "signals that say 'do not use this here'.",
  },
];

// ---------------------------------------------------------------------------
// Prompt de cada worker — contexto explícito, montado por inteiro
// ---------------------------------------------------------------------------

/**
 * Note o que precisa ser repetido em CADA prompt, justamente porque o worker
 * abre uma sessão limpa: o tópico, o objetivo comum, o recorte dele, os recortes
 * dos OUTROS (fronteira de escopo) e o formato de saída.
 *
 * O bloco "Other workers are covering" é o que evita a falha de fan-out descrita
 * pela Anthropic no post sobre o sistema multiagente de pesquisa: sem divisão de
 * trabalho explícita, subagents duplicam a mesma investigação.
 */
function buildWorkerPrompt(topic: string, lens: Lens): string {
  const siblings = LENSES.filter((l) => l.id !== lens.id)
    .map((l) => `  - "${l.id}": ${l.assignment}`)
    .join("\n");

  return [
    `TOPIC: ${topic}`,
    ``,
    `SHARED BRIEF: You are one of three independent analysts. Your three answers`,
    `will later be merged, by a separate agent, into a single briefing for a`,
    `software architect who is deciding whether to adopt this technique.`,
    ``,
    `YOUR ASSIGNMENT ("${lens.id}"):`,
    `  ${lens.assignment}`,
    ``,
    `OTHER WORKERS ARE COVERING (do NOT write about these — you would only`,
    `duplicate their work, and the merge step would have to throw yours away):`,
    siblings,
    ``,
    `OUTPUT FORMAT:`,
    `  - 4 to 6 bullet points, one line each, no preamble and no closing summary.`,
    `  - Be concrete and specific. Prefer a named tradeoff over a generality.`,
    `  - If you are uncertain about a claim, prefix that bullet with "UNCERTAIN:".`,
    ``,
    `You have no tools and no access to any other agent's context. Everything you`,
    `need is in this message.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Execução de uma chamada isolada
// ---------------------------------------------------------------------------

type RunResult = {
  id: string;
  text: string;
  ms: number;
  costUsd: number;
  sessionId: string;
  ok: boolean;
  failure?: string;
};

/**
 * Roda um `query()` até o fim e devolve o texto final. Cada chamada destas é uma
 * sessão própria do Agent SDK — daí o `sessionId` distinto impresso no relatório.
 */
async function runIsolated(
  id: string,
  prompt: string,
  systemPrompt: string,
): Promise<RunResult> {
  const startedAt = Date.now();
  let text = "";
  let costUsd = 0;
  let sessionId = "";
  let ok = false;
  let failure: string | undefined;

  try {
    for await (const message of query({
      prompt,
      options: { ...BASE_OPTIONS, systemPrompt },
    })) {
      if (message.type === "result") {
        sessionId = message.session_id;
        costUsd = message.total_cost_usd;
        if (message.subtype === "success") {
          text = message.result;
          ok = true;
        } else {
          failure = message.subtype;
        }
      }
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  return { id, text, ms: Date.now() - startedAt, costUsd, sessionId, ok, failure };
}

// ---------------------------------------------------------------------------
// CAMINHO B — os mesmos três recortes como subagents de verdade (`agents`)
// ---------------------------------------------------------------------------

/**
 * O caminho principal deste lab usa três `query()` concorrentes, porque isso é
 * determinístico e cronometrável. Mas a prova pergunta sobre o mecanismo de
 * subagent do Claude Code, não sobre `Promise.all` — então aqui estão os MESMOS
 * três recortes expressos na superfície real do SDK: `options.agents`, um
 * `Record<string, AgentDefinition>`, invocados pelo modelo através da tool
 * `Agent`.
 *
 * Diferenças que valem como nota de estudo:
 *
 *  - Quem decide delegar é o MODELO, não o código. Por isso o prompt nomeia os
 *    três agents explicitamente ("Use the X agent..."): a documentação chama isso
 *    de explicit invocation, e ela é necessária aqui porque, com Opus 5 sob o
 *    system prompt preset do Claude Code, o harness instrui o modelo a não
 *    chamar a tool `Agent` a menos que seja pedido.
 *  - `allowedTools` precisa conter `"Agent"`, senão a delegação pede aprovação.
 *  - O paralelismo passa a ser decisão do modelo: subagents rodam em background
 *    por padrão, e o modelo marca `run_in_background: false` quando precisa do
 *    resultado antes de continuar.
 *  - Só a mensagem final de cada subagent volta ao pai; as tool calls
 *    intermediárias ficam dentro dele.
 */
function buildAgentDefinitions(topic: string): Record<string, AgentDefinition> {
  const entries = LENSES.map((lens) => [
    lens.id,
    {
      // `description` é o que o modelo lê para decidir quando usar este agent.
      description: `Covers the "${lens.id}" angle of a technical topic. ${lens.assignment}`,
      // `prompt` é o system prompt do subagent — o papel dele.
      prompt: `${lens.role}\n\n${buildWorkerPrompt(topic, lens)}`,
      // Sem ferramentas: mesma razão do caminho A.
      tools: [],
      model: MODEL,
      maxTurns: 4,
    } satisfies AgentDefinition,
  ]);

  return Object.fromEntries(entries) as Record<string, AgentDefinition>;
}

async function runViaAgentTool(topic: string): Promise<void> {
  console.log(`\n=== CAMINHO B: subagents via a tool \`Agent\` ===`);
  console.log(`Tópico : ${topic}`);
  console.log(`Agents : ${LENSES.map((l) => l.id).join(", ")}\n`);

  const prompt = [
    `TOPIC: ${topic}`,
    ``,
    `Delegate to all three of these agents:`,
    ...LENSES.map((l) => `  - Use the ${l.id} agent for its assigned angle.`),
    ``,
    `You need all three answers in hand before you can write anything, so do NOT run them`,
    `in the background and do NOT reply until every one of them has returned. Your reply must`,
    `be the finished briefing itself — never a note saying the agents are still running.`,
    ``,
    `Then merge their three answers into ONE briefing in Portuguese (pt-BR),`,
    `keeping technical terms in English, with these sections: "Em uma frase",`,
    `"Pontos de concordância", "Tensões", "Veredito". Carry over anything a`,
    `subagent marked "UNCERTAIN:" as an explicit caveat.`,
  ].join("\n");

  const startedAt = Date.now();
  const invoked: string[] = [];

  for await (const message of query({
    prompt,
    options: {
      // Mesma configuração base do caminho A, por spread — os dois caminhos
      // precisam compartilhar config de verdade, não por cópia manual que
      // dessincroniza na primeira vez que BASE_OPTIONS ganhar um campo.
      ...BASE_OPTIONS,
      // "Agent" precisa estar aqui para a delegação não pedir aprovação.
      // Sobrescreve o `allowedTools: []` do caminho A.
      allowedTools: ["Agent"],
      // O orquestrador precisa de turnos para delegar três vezes e sintetizar.
      maxTurns: 20,
      agents: buildAgentDefinitions(topic),
    },
  })) {
    // Detecção de invocação de subagent, usando a união discriminada do SDK:
    // `SDKAssistantMessage` tem `type: "assistant"` e os content blocks têm
    // `type: "tool_use"`. A tool aparece como "Agent" nas versões atuais e como
    // "Task" antes da 2.1.63 — casar os dois nomes é recomendação da própria
    // documentação.
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "tool_use" && (block.name === "Agent" || block.name === "Task")) {
          const input = block.input as { subagent_type?: string };
          const which = input.subagent_type ?? "general-purpose";
          invoked.push(which);
          console.log(`  → delegou para o subagent: ${which}`);
        }
      }
    }

    if (message.type === "result") {
      console.log(`\n### SÍNTESE (produzida pelo orquestrador-modelo)`);
      console.log(
        `(${Date.now() - startedAt} ms · session ${message.session_id} · $${message.total_cost_usd.toFixed(4)})\n`,
      );
      console.log(message.subtype === "success" ? message.result : `[FALHOU: ${message.subtype}]`);
      console.log(`\nSubagents invocados: ${invoked.length ? invoked.join(", ") : "nenhum"}`);
      if (invoked.length < LENSES.length) {
        console.log(
          `ATENÇÃO: o modelo delegou para ${invoked.length} de ${LENSES.length}. ` +
            `Delegação é decisão do modelo — é exatamente por isso que o caminho A ` +
            `não depende dela para medir paralelismo.`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Orquestração
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const viaAgentTool = argv.includes("--via-agent-tool");
  const topic = argv.filter((a) => a !== "--via-agent-tool").join(" ").trim();

  if (!topic) {
    console.error('Uso: npx tsx orchestrator.ts "<tópico>" [--via-agent-tool]');
    console.error('Ex.: npx tsx orchestrator.ts "agentic RAG tradeoffs"');
    process.exit(2);
  }

  if (viaAgentTool) {
    await runViaAgentTool(topic);
    return;
  }

  console.log(`\n=== ORQUESTRADOR COM FAN-OUT ===`);
  console.log(`Tópico : ${topic}`);
  console.log(`Model  : ${MODEL}`);
  console.log(`Workers: ${LENSES.map((l) => l.id).join(", ")}\n`);

  // --- FAN-OUT -------------------------------------------------------------
  // Promise.all dispara os três de uma vez. Trocar por um for/await sequencial
  // produziria exatamente a mesma saída, em ~3x o tempo — é essa a diferença que
  // o relatório de tempo no fim mede.
  console.log(`--- fan-out: disparando ${LENSES.length} workers em paralelo ---\n`);
  const fanOutStart = Date.now();

  const workers = await Promise.all(
    LENSES.map((lens) =>
      runIsolated(lens.id, buildWorkerPrompt(topic, lens), lens.role),
    ),
  );

  const fanOutWallMs = Date.now() - fanOutStart;

  for (const w of workers) {
    console.log(`### WORKER: ${w.id}`);
    console.log(`(${w.ms} ms · session ${w.sessionId || "n/a"} · $${w.costUsd.toFixed(4)})`);
    console.log(w.ok ? w.text : `[FALHOU: ${w.failure}]`);
    console.log("");
  }

  const succeeded = workers.filter((w) => w.ok);
  if (succeeded.length === 0) {
    console.error("Todos os workers falharam; nada a sintetizar.");
    process.exit(1);
  }
  if (succeeded.length < workers.length) {
    const falhos = workers.filter((w) => !w.ok).map((w) => w.id).join(", ");
    console.log(
      `ATENÇÃO: ${workers.length - succeeded.length} de ${workers.length} workers falharam ` +
        `(${falhos}). A síntese vai adiante com ${succeeded.length}, mas o briefing está ` +
        `incompleto: o recorte que falhou não aparece em lugar nenhum do resultado.\n`,
    );
  }

  // --- SÍNTESE -------------------------------------------------------------
  // O sintetizador abre OUTRA sessão limpa. Ele não tem como "lembrar" do que os
  // workers escreveram: as três saídas são coladas no prompt dele na mão.
  console.log(`--- síntese: mesclando ${succeeded.length} resultado(s) ---\n`);

  const synthesisPrompt = [
    `TOPIC: ${topic}`,
    ``,
    `Three independent analysts examined this topic from different angles. They`,
    `did not see each other's work, and you did not see them work. Their full`,
    `output is below — it is the only information you have.`,
    ``,
    ...succeeded.map((w) => `## ANALYST "${w.id}"\n${w.text}\n`),
    `TASK: Merge the three into ONE briefing for a software architect deciding`,
    `whether to adopt this technique. Structure it as:`,
    `  1. "Em uma frase" — the single sentence that captures the tradeoff.`,
    `  2. "Pontos de concordância" — what two or more analysts independently said.`,
    `  3. "Tensões" — where the analysts pull in different directions, and why.`,
    `  4. "Veredito" — adopt / adopt with guardrails / do not adopt, plus the one`,
    `     condition that would flip the verdict.`,
    ``,
    `Carry over any bullet marked "UNCERTAIN:" as an explicit caveat — do not`,
    `silently promote it to a fact. Write in Portuguese (pt-BR); keep technical`,
    `terms in English.`,
  ].join("\n");

  const synthesis = await runIsolated(
    "sintetizador",
    synthesisPrompt,
    "You are a technical editor. You merge independent analyses without inventing " +
      "claims that none of the sources made. You preserve stated uncertainty.",
  );

  console.log(`### SÍNTESE FINAL`);
  console.log(`(${synthesis.ms} ms · session ${synthesis.sessionId || "n/a"} · $${synthesis.costUsd.toFixed(4)})\n`);
  console.log(synthesis.ok ? synthesis.text : `[FALHOU: ${synthesis.failure}]`);

  // --- PROVA DO PARALELISMO ------------------------------------------------
  const sumWorkersMs = workers.reduce((acc, w) => acc + w.ms, 0);
  const slowestMs = Math.max(...workers.map((w) => w.ms));
  const speedup = sumWorkersMs / fanOutWallMs;
  const totalCost =
    workers.reduce((acc, w) => acc + w.costUsd, 0) + synthesis.costUsd;

  console.log(`\n=== PROVA DO PARALELISMO ===`);
  for (const w of workers) console.log(`  worker ${w.id.padEnd(22)} ${String(w.ms).padStart(7)} ms`);
  console.log(`  ${"-".repeat(38)}`);
  console.log(`  soma dos workers (seria o tempo sequencial) ${String(sumWorkersMs).padStart(7)} ms`);
  console.log(`  worker mais lento                           ${String(slowestMs).padStart(7)} ms`);
  console.log(`  tempo real do fan-out (wall clock)          ${String(fanOutWallMs).padStart(7)} ms`);
  console.log(`  speedup                                     ${speedup.toFixed(2)}x`);
  console.log(`  custo total estimado                        $${totalCost.toFixed(4)}`);

  if (fanOutWallMs < sumWorkersMs) {
    console.log(`\n  OK: o fan-out custou menos tempo que a soma das partes.`);
  } else {
    console.log(`\n  ATENÇÃO: sem ganho de tempo — os ramos não rodaram em paralelo.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
