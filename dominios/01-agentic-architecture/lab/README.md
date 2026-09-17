# Lab — Orquestrador com fan-out (Domínio 1)

## Objetivo

Tornar mensurável a diferença entre *falar sobre* fan-out e *ver* fan-out acontecendo. O script
recebe um tópico, dispara **três workers em paralelo** — cada um com um recorte diferente do
problema e um prompt autossuficiente — e mescla as três saídas numa síntese única.

Os quatro conceitos de prova que o código materializa:

| Conceito | Onde aparece no código |
|---|---|
| **Fan-out** | `Promise.all` sobre `LENSES`, na função `main` |
| **Isolamento de contexto** | cada `runIsolated` abre um `query()` próprio, com session id próprio |
| **Passagem explícita de contexto** | `buildWorkerPrompt` monta tópico + briefing + recorte + recortes alheios + formato |
| **Síntese** | as três saídas são **coladas à mão** no prompt do sintetizador |

O ponto que o lab existe para tornar concreto: **nada atravessa entre as sessões**. O worker 2
não sabe o que o worker 1 escreveu, e o sintetizador não sabe nada dos três — por isso o
orquestrador precisa colar os textos no prompt dele. Para deixar isso visível, as opções base
cortam também os canais indiretos: `settingSources: []` (nada de settings de usuário/projeto nem
`CLAUDE.md`) e `skills: []` (nenhuma skill carregada).

## Pré-requisitos

- Node.js 20+ (verificado em v22).
- Credencial do Claude: uma sessão do **Claude Code CLI já autenticada** basta — o Agent SDK
  reaproveita essa credencial. `ANTHROPIC_API_KEY` funciona, mas **não é obrigatório**
  (verificado empiricamente: o lab rodou sem a variável definida).

## Como rodar

```bash
cd dominios/01-agentic-architecture/lab
npm install
npx tsx orchestrator.ts "agentic RAG tradeoffs"
```

Variáveis opcionais:

| Variável | Default | Para quê |
|---|---|---|
| `LAB_MODEL` | `claude-opus-5` | trocar o model id (ex.: `claude-sonnet-5`, bem mais barato) |
| `LAB_MAX_BUDGET_USD` | `1.50` | teto de gasto por chamada, como rede de segurança |

## Critério de "funcionou"

A execução passou se **todos** os itens abaixo aparecerem:

1. **Três blocos `### WORKER:`**, um por recorte, cada um com um **session id diferente** — a
   evidência visível de que são contextos isolados.
2. **Conteúdo efetivamente diferente entre os três.** Se os três falarem da mesma coisa, o
   fan-out foi desperdiçado — é a falha de fronteira vaga descrita nas notas (seção 5).
3. **Um bloco `### SÍNTESE FINAL`** que referencia os três recortes.
4. **Bloco `=== PROVA DO PARALELISMO ===`** em que o *tempo real do fan-out (wall clock)* é
   claramente menor que a *soma dos workers*. O script encerra com código **1** se isso não
   acontecer.

O sinal mais forte é o wall clock ficar ≈ igual ao **worker mais lento**: é a assinatura de
execução paralela. Se ele ficasse ≈ igual à **soma**, os ramos teriam rodado em série.

## Execução observada

Rodada real em 2026-09-17, `claude-opus-5`, tópico `"agentic RAG tradeoffs"`:

```
=== PROVA DO PARALELISMO ===
  worker mecanismo                18580 ms
  worker custos-e-falhas          20355 ms
  worker criterios-de-decisao     15016 ms
  --------------------------------------
  soma dos workers (seria o tempo sequencial)   53951 ms
  worker mais lento                             20355 ms
  tempo real do fan-out (wall clock)            20602 ms
  speedup                                     2.62x
  custo total estimado                        $0.2827
```

Wall clock 20 602 ms contra worker mais lento 20 355 ms: diferença de 247 ms, que é só o overhead
de disparar e coletar. Paralelismo comprovado.

## Os dois caminhos

O lab implementa os **mesmos três recortes** de duas formas, porque cada uma ensina metade do
assunto.

### Caminho A (padrão) — três `query()` concorrentes

```bash
npx tsx orchestrator.ts "agentic RAG tradeoffs"
```

Quem decide delegar é o **código**. Determinístico, cronometrável ramo a ramo, e por isso é o
caminho que produz a prova de paralelismo acima. Cada `query()` é uma sessão própria, com janela
e system prompt próprios — o isolamento de contexto que interessa ao domínio.

### Caminho B — subagents de verdade, via `options.agents` e a tool `Agent`

```bash
npx tsx orchestrator.ts "agentic RAG tradeoffs" --via-agent-tool
```

Aqui aparece a superfície que a prova cobra: `options.agents` como
`Record<string, AgentDefinition>`, com `description`, `prompt`, `tools`, `model` e `maxTurns`; e
a delegação acontecendo pela tool **`Agent`**, decidida pelo modelo.

Detalhes que o código demonstra e que valem como nota de estudo:

- **`allowedTools` precisa conter `"Agent"`**, senão cada delegação pede aprovação.
- **O prompt nomeia os três agents explicitamente** ("Use the *mecanismo* agent…"). A
  documentação chama isso de *explicit invocation*, e ela é necessária porque, com Opus 5 sob o
  system prompt preset do Claude Code, o harness instrui o modelo a **não** chamar a tool `Agent`
  a menos que seja pedido.
- **Detecção de delegação** casa `"Agent"` **e** `"Task"` no `tool_use`: a tool foi renomeada na
  versão 2.1.63 e o nome antigo ainda aparece em versões e listagens mais velhas.
- O script **conta** quantos subagents foram de fato invocados e avisa quando o modelo delega
  para menos que os três — que é exatamente a razão de o caminho A não depender disso para medir.

Execução observada (2026-09-17, `claude-opus-5`):

```
  → delegou para o subagent: mecanismo
  → delegou para o subagent: custos-e-falhas
  → delegou para o subagent: criterios-de-decisao

### SÍNTESE (produzida pelo orquestrador-modelo)
(73824 ms · session bc577dfa-0705-45ec-87ce-ea0ef168aac4 · $0.3263)
```

### A diferença que a prova cobra

| | Caminho A | Caminho B |
|---|---|---|
| Quem decide delegar | o código | o **modelo** |
| Mecanismo | `query()` concorrentes | tool `Agent` + `options.agents` |
| Como o resultado volta | o orquestrador cola no próximo prompt | volta como resultado da tool para a janela do pai |
| Paralelismo | garantido por `Promise.all` | decisão do modelo (subagents rodam em background por padrão) |
| Cronometrável ramo a ramo | sim | não |

O conceito de isolamento de contexto é idêntico nos dois. O que muda é o **gatilho da delegação**
— e é sobre o gatilho que as questões costumam girar.

## Detalhes de implementação que valem como nota de estudo

- **`maxTurns: 4`, não `1`.** `maxTurns` conta round-trips de API, e o passo de *thinking* do
  modelo consome um. Com `maxTurns: 1` as três chamadas morrem com
  `Reached maximum number of turns (1)` — foi o primeiro resultado real deste lab.
- **`allowedTools: []`.** Os workers rodam sem ferramenta alguma, de propósito: um worker que
  sai navegando torna o tempo de cada ramo imprevisível e arruína a medição. Num pipeline de
  pesquisa de verdade é aqui que entrariam `WebSearch`/`WebFetch`.
- **Marcador `UNCERTAIN:`.** Os workers marcam afirmações de que não têm certeza, e o
  sintetizador é instruído a carregá-las como ressalva em vez de promovê-las a fato. É o
  antídoto barato contra a propagação de erro entre agentes (Domínio 5): sem isso, a incerteza
  do worker vira premissa do orquestrador sem deixar rastro.
