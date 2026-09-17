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

## Nota honesta sobre o mecanismo

O script usa **três chamadas `query()` concorrentes do Agent SDK**, não a tool `Agent` (o
mecanismo de subagent do Claude Code, renomeado de `Task` na versão 2.1.63). A escolha é
deliberada:

- Um subagent invocado pela tool `Agent` só é disparado **se o modelo orquestrador decidir
  disparar**. Isso é não-determinístico e impossível de cronometrar ramo a ramo — justamente o
  que o lab precisa medir.
- Três `query()` concorrentes dão o mesmo isolamento de contexto que interessa ao domínio (cada
  um com sessão, janela e system prompt próprios), de forma determinística e instrumentável.

A diferença que **não** deve ser esquecida na prova: com a tool `Agent`, é o modelo que decide
delegar, e o resultado volta como resumo para a janela do pai; aqui, quem decide é o código, e
quem cola o resultado no próximo prompt é o orquestrador. O conceito de isolamento é o mesmo; o
gatilho da delegação é que muda.

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
