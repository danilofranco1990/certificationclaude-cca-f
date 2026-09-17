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

## Como rodar

```bash
cd dominios/01-agentic-architecture/lab
npm install
npx tsx orchestrator.ts "agentic RAG tradeoffs"
```

Variáveis opcionais:

| Variável | Default | Para quê |
|---|---|---|
| `LAB_MODEL` | `claude-sonnet-5` | trocar o model id. `claude-opus-5` dá saída mais próxima da qualidade real de um pipeline de pesquisa, por ~4x o custo |
| `LAB_MAX_BUDGET_USD` | `1.50` | teto de gasto **por chamada**, como rede de segurança |

### Quanto custa uma rodada

`LAB_MAX_BUDGET_USD` limita **cada chamada**, não a rodada. O caminho A faz quatro chamadas
(três workers + síntese), então o pior caso teórico de uma rodada completa é **4 × 1,50 =
US$ 6,00**. Na prática, medido:

| Rodada | Custo observado (`total_cost_usd`) |
|---|---|
| Caminho A, `claude-sonnet-5` (default) | US$ 0,4291 |
| Caminho A, `claude-opus-5` | US$ 0,2760 |
| Caminho B, `claude-sonnet-5` (default) | US$ 0,1410 |
| Caminho B, `claude-opus-5` | US$ 0,3263 |

Números de rodadas únicas, não médias. `total_cost_usd` é **estimativa**, não fatura, e varia
bastante entre execuções — a linha do sonnet acima saiu mais cara que a do opus, o que é ruído de
uma amostra só, não uma propriedade dos modelos. Use a tabela para ordem de grandeza (centavos a
dezenas de centavos), não para comparar modelos.

Baixe `LAB_MAX_BUDGET_USD` se quiser um teto mais apertado; o script trata o estouro como falha
do worker, não como crash.

## Execução observada

Rodada real em 2026-09-17, modelo default (`claude-sonnet-5`), tópico `"agentic RAG tradeoffs"`:

```
=== PROVA DO PARALELISMO ===
  worker mecanismo                14216 ms
  worker custos-e-falhas          14387 ms
  worker criterios-de-decisao     12400 ms
  --------------------------------------
  soma dos workers (seria o tempo sequencial)   41003 ms
  worker mais lento                             14387 ms
  tempo real do fan-out (wall clock)            14416 ms
  speedup                                     2.84x
  custo total estimado                        $0.4291
```

Wall clock 14 416 ms contra worker mais lento 14 387 ms: diferença de **29 ms**, que é só o
overhead de disparar e coletar. Paralelismo comprovado.

A mesma rodada em `claude-opus-5` deu 19 420 ms de wall clock contra 56 200 ms de soma (2,89x) —
o speedup é praticamente o mesmo, que é justamente por que o default barato não prejudica a
demonstração.

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

- **Subagents rodam em background por padrão** — e isso morde. Uma chamada da tool `Agent` que
  omite `run_in_background` dispara um subagent em background; o modelo marca
  `run_in_background: false` só quando precisa do resultado para continuar. Na primeira versão
  deste lab, o orquestrador delegou os três corretamente e **respondeu sem esperar**, com um
  "os três estão rodando em background, aviso quando terminarem" — delegação perfeita, síntese
  vazia. A correção foi no prompt: dizer que ele precisa das três respostas em mãos antes de
  escrever qualquer coisa, e que a resposta dele tem de ser o briefing pronto. Vale como lição
  geral: com a tool `Agent`, *esperar* é comportamento a instruir, não default.

Execução observada (2026-09-17, modelo default `claude-sonnet-5`, já com a instrução de esperar):

```
  → delegou para o subagent: mecanismo
  → delegou para o subagent: custos-e-falhas
  → delegou para o subagent: criterios-de-decisao

### SÍNTESE (produzida pelo orquestrador-modelo)
(52746 ms · session 32588e06-d8db-4579-a3ce-4cee5ed4e899 · $0.1410)

# Briefing: Agentic RAG Tradeoffs
## Em uma frase
Agentic RAG transforma a recuperação de contexto de um passo fixo de pré-processamento em uma
ação dentro de um loop de decisão do agente...
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

## Troubleshooting — "meu código está errado" vs. "o ambiente atrapalhou"

O lab sai com código 1 quando o wall clock não fica abaixo da soma dos workers. Antes de mexer
no código, separe as duas causas:

| Sintoma | Provável causa | É defeito de código? |
|---|---|---|
| Wall clock ≈ soma dos workers, e os três tempos individuais são normais | os ramos rodaram em série | **sim** — alguém trocou `Promise.all` por `for/await` |
| Wall clock ≈ worker mais lento, mas um worker demorou muito mais que os outros | latência de rede ou fila do provedor num dos ramos | não — rode de novo |
| Um ou mais workers falham com `error_max_budget_usd` | `LAB_MAX_BUDGET_USD` baixo demais para o modelo escolhido | não — suba o teto ou use um modelo mais barato |
| Todos os workers falham com erro de autenticação | não há credencial: CLI não autenticado e sem `ANTHROPIC_API_KEY` | não — rode `claude` uma vez e faça login |
| `Reached maximum number of turns` | `maxTurns` baixo demais (o passo de *thinking* consome um turno) | **sim** |
| Caminho B delega para menos de três agents | o modelo decidiu não delegar — o script avisa | não — é o ponto que o caminho B existe para mostrar |

Regra prática: **o único sintoma que prova defeito de código é wall clock ≈ soma com tempos
individuais normais.** Todo o resto é ambiente, e a resposta certa é rodar de novo antes de
editar qualquer coisa.

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
