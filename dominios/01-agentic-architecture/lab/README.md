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

> Uma execução verde é a **linha de base**, não o fim do lab. O que se aprende aqui está no
> [`## Roteiro de quebra`](#roteiro-de-quebra), no fim deste arquivo — método em
> [`COMO-ESTUDAR.md`](../../../COMO-ESTUDAR.md) §4.

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

---

## Roteiro de quebra

O lab ensina por **falha controlada**. Uma execução bem-sucedida mostra o happy path; a prova
pergunta sintoma → causa, e sintoma só existe quando algo quebra. Cinco experimentos, cada um no
formato **o que mudar** → **o que deve acontecer** → **a que corresponde**.

Como rodar cada um (o protocolo completo está em [`COMO-ESTUDAR.md`](../../../COMO-ESTUDAR.md) §4):

1. Leia **só o "o que mudar"** e **escreva a sua previsão** antes de editar.
2. Aplique a edição, rode, observe.
3. Só então leia "o que deve acontecer" e compare. Previsão errada vale mais que previsão certa —
   registre-a em `simulados/erros.md`.
4. Desfaça antes do próximo: `git checkout -- orchestrator.ts`. **Um experimento por vez** — duas
   quebras simultâneas produzem um sintoma que você não consegue atribuir.

Os números de linha são do `orchestrator.ts` como ele está hoje; use o trecho citado como âncora se
tiverem escorregado. Cada experimento marca se a falha foi **observada de verdade** na construção do
lab ou se é **previsão** derivada do código e do material.

### Experimento 1 — Worker sem contexto explícito

**O que mudar.** Em `buildWorkerPrompt` (~linha 146), apague o bloco do recorte e o dos recortes
alheios — estas seis linhas:

```ts
    `YOUR ASSIGNMENT ("${lens.id}"):`,
    `  ${lens.assignment}`,
    ``,
    `OTHER WORKERS ARE COVERING (do NOT write about these — you would only`,
    `duplicate their work, and the merge step would have to throw yours away):`,
    siblings,
```

e ponha no lugar uma única linha, com o objetivo genérico que é igual para os três:

```ts
    `YOUR ASSIGNMENT: research this topic and report what an architect should know.`,
```

Para a reprodução completa da Question 5, achate também o papel: em `main` (~linha 367), troque
`lens.role` por `LENSES[0].role` na chamada de `runIsolated`, para que os três workers recebam o
mesmo system prompt. (`siblings` fica sem uso; `tsx` não reclama, porque transpila sem type check.)

**O que deve acontecer** *(previsão — não executado)*. Os três blocos `### WORKER:` voltam cobrindo
o mesmo subtema em palavras diferentes; a síntese incha em "Pontos de concordância" e esvazia
"Tensões". O custo não cai: você pagou três workers por um worker de informação. E — o detalhe que é
a lição — **o script sai com código 0**: o único critério automatizado é o de paralelismo, e ele
continua satisfeito. Os três rodaram em paralelo, rápido e inutilmente. Com a edição mínima (só o
bloco `OTHER WORKERS`, mantendo `assignment` e `role`), a convergência deve ser parcial: o que sobra
de fronteira é o que viajou no system prompt.

**A que corresponde.** É a **Question 5** ao vivo — subagents com objetivo idêntico e sem fronteira,
devolvendo respostas quase iguais — e o `### A falha concreta de fronteira` de
[`notas.md`](../notas.md) §5. Também é a Question 13 pela outra ponta: lá falta o *fato* que o pai
já tem; aqui falta a *fronteira*. As duas são a mesma regra — nada atravessa que não esteja no
prompt.

### Experimento 2 — `maxTurns: 1`

**O que mudar.** Em `BASE_OPTIONS` (~linha 67), `maxTurns: 4` → `maxTurns: 1`. É o `maxTurns` que
tem o comentário sobre o passo de thinking logo acima — **não** o de `buildAgentDefinitions`
(~linha 253), que é dos subagents do caminho B.

**O que deve acontecer** — ✅ **falha real ocorrida na construção deste lab**. Os três workers morrem
antes de produzir texto: cada bloco `### WORKER:` sai como `[FALHOU: ...]`. Na construção a mensagem
foi `Reached maximum number of turns (1)`; conforme a versão do SDK ela pode chegar como o subtype
`error_max_turns`. Em seguida o script imprime `Todos os workers falharam; nada a sintetizar.` e sai
com código **1** (`echo $?` no bash, `$LASTEXITCODE` no PowerShell). A causa é que `maxTurns` conta
**round-trips de API**, e o passo de raciocínio do modelo já consome um — com orçamento 1 não sobra
turno para responder.

Bônus de dois segundos: rode `--via-agent-tool` com essa mesma edição. O caminho B **não quebra**,
porque ele sobrescreve `maxTurns: 20` sobre o spread de `BASE_OPTIONS`. Precedência de spread
visível em uma linha.

**A que corresponde.** Ao distrator **B da Question 5** ("raise each subagent's `maxTurns` so it
explores its assignment more deeply"): `maxTurns` não é botão de profundidade de raciocínio, é
orçamento de round-trips — e a prova disso é que `1` não produz resposta rasa, produz resposta
nenhuma. Também é a linha `Reached maximum number of turns` da tabela de Troubleshooting, a única
entrada de falha de worker classificada ali como defeito de código.

### Experimento 3 — Caminho B sem instruir o orquestrador a esperar

**O que mudar.** Em `runViaAgentTool` (~linha 271), apague as três linhas que mandam esperar (e a
string vazia que vem depois):

```ts
    `You need all three answers in hand before you can write anything, so do NOT run them`,
    `in the background and do NOT reply until every one of them has returned. Your reply must`,
    `be the finished briefing itself — never a note saying the agents are still running.`,
    ``,
```

Rode `npx tsx orchestrator.ts "agentic RAG tradeoffs" --via-agent-tool`.

**O que deve acontecer** — ✅ **falha real ocorrida na construção deste lab**. A delegação funciona
perfeitamente: saem as três linhas `→ delegou para o subagent:` e o rodapé diz
`Subagents invocados: 3`. E a síntese vem vazia — no lugar do briefing, um recado de que os três
estão rodando em background e que ele avisa quando terminarem. Delegação nota 10, resultado zero.
A causa: **subagents rodam em background por padrão**; o modelo só marca `run_in_background: false`
quando entende que precisa do resultado para continuar.

**A que corresponde.** À linha "Paralelismo" da tabela *A diferença que a prova cobra* — no caminho
A o `Promise.all` garante; no caminho B quem decide é o modelo. E à armadilha **Hook vs. instrução
no prompt** de [`armadilhas.md`](../armadilhas.md), pela via mais desconfortável: aqui não existe
hook disponível, então o comportamento obrigatório só pode ser *pedido*. O caminho A tem a espera
por construção (código); o caminho B, por solicitação (prompt) — e o que é pedido pode não
acontecer.

### Experimento 4 — Dependência de estado entre dois workers

**O que mudar.** Em `main` (~linha 365), troque o `Promise.all` por uma cadeia em que cada worker lê
a saída do anterior:

```ts
  const mecanismo = await runIsolated(
    LENSES[0].id, buildWorkerPrompt(topic, LENSES[0]), LENSES[0].role,
  );
  const custos = await runIsolated(
    LENSES[1].id,
    buildWorkerPrompt(topic, LENSES[1]) +
      `\n\nBASE ANALYSIS FROM THE "${LENSES[0].id}" WORKER (build on it, do not contradict it):\n` +
      mecanismo.text,
    LENSES[1].role,
  );
  const criterios = await runIsolated(
    LENSES[2].id,
    buildWorkerPrompt(topic, LENSES[2]) +
      `\n\nBASE ANALYSIS FROM THE "${LENSES[1].id}" WORKER (build on it, do not contradict it):\n` +
      custos.text,
    LENSES[2].role,
  );
  const workers = [mecanismo, custos, criterios];
```

**O que deve acontecer** *(previsão — não executado; o comportamento do relatório final sai
direto do código)*. Os tempos individuais dos três workers ficam normais, mas o wall clock passa a
ser ≈ a soma deles: o speedup cai de ~2,8x para ~1,0x, o script imprime
`ATENÇÃO: sem ganho de tempo — os ramos não rodaram em paralelo.` e sai com código **1**. Nenhuma
tarefa mudou de tamanho — bastou uma ler o que a outra produziu.

Variante que ensina mais: encadeie **só** `mecanismo → custos` e deixe `criterios` no `Promise.all`.
O paralelismo não desaparece, ele encolhe — speedup em algum ponto entre 1,0x e a sua linha de base
(previsão: ~1,3x–1,6x). É o retrato do cenário de prova de §4: num pipeline de quatro estágios, só
um paraleliza, e os outros três não ficaram "grandes demais" — ficaram dependentes.

**A que corresponde.** À armadilha **Execução paralela vs. sequencial: o teste é dependência de
estado, não tamanho** ([`armadilhas.md`](../armadilhas.md)), à `### Por que estado compartilhado
impede paralelismo` de [`notas.md`](../notas.md) §4, e às Questions **4** e **19**. Note que este
experimento produz a forma *dependência de dados* ("um lê o que o outro produz"), cujo sintoma é
lentidão. A **Question 12** cobra a outra forma — dois workers escrevendo no mesmo estado que a
síntese lê —, e ali o sintoma **não é lentidão, é não-determinismo**: sem erro nenhum, o relatório
sai diferente a cada rodada. Mesmo critério, sintomas opostos; é por isso que o critério é o que se
decora, não o sintoma. De quebra, a cadeia reproduz de propósito o único sintoma que a tabela de
Troubleshooting classifica como defeito de código — wall clock ≈ soma com tempos individuais
normais.

### Experimento 5 (exploração) — De três para cinco lentes

**O que mudar.** Acrescente duas entradas ao array `LENSES` (~linha 89):

```ts
  {
    id: "seguranca",
    role:
      "You are a security engineer. You reason about trust boundaries and data " +
      "exposure. You never discuss performance.",
    assignment:
      "Explain the SECURITY SURFACE: which new trust boundaries this introduces, " +
      "what data crosses them, and what an attacker gains from each component.",
  },
  {
    id: "evolucao-e-manutencao",
    role:
      "You are a staff engineer who maintains systems after launch. You reason " +
      "about change over time. You never discuss initial implementation.",
    assignment:
      "Explain MAINTENANCE AND EVOLUTION: what has to change when requirements " +
      "shift, what becomes hard to debug, and what locks the team in.",
  },
```

Nada mais precisa mudar — `buildWorkerPrompt` deriva os `siblings` de `LENSES`, o `Promise.all`
mapeia `LENSES` e a síntese cola tudo que voltou com sucesso. **A largura do fan-out é uma array**,
e é justamente por isso que ela cresce sem ninguém perceber. Rode o mesmo tópico com 3 e com 5 e
anote as duas rodadas.

**O que deve acontecer** *(previsão — não executado; o ponto do experimento são os seus números)*.
O wall clock deve continuar ≈ o worker mais lento: paralelismo não degrada em 5 (o teto do Claude
Code é 20 subagents concorrentes, ajustável por `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` — o limite
que morde é econômico, não técnico). O custo dos workers sobe ~linearmente (~1,7x). Quem muda de
natureza é a **síntese**: ela é o único passo que recebe *tudo*, então o prompt dela cresce a cada
lente enquanto o briefing de saída continua do mesmo tamanho.

Anote por rodada: `lentes | wall clock | custo total | nº de tensões distintas na síntese`. A última
coluna é a medida qualitativa do que a lente marginal trouxe de informação nova.

**A que corresponde.** Ao `### O custo: round-trip e contexto de volta` de
[`notas.md`](../notas.md) §3 — *"running many subagents that each return detailed results can
consume significant context"*, 20 subagents × 2k tokens = 40k na janela do pai. Aqui o sintetizador
é o pai, em miniatura: a entrada dele cresce com o número de lentes e a saída útil não. **A inversão
acontece quando a lente marginal adiciona menos informação única do que adiciona tokens ao
sintetizador** — e o sintoma prático é o recorte ficar fino demais e voltar a se sobrepor ao do
vizinho, que é o Experimento 1 chegando pela porta dos fundos (gabarito da Question 5, distrator A:
"mais subagents multiplica o custo da duplicação"). Rode com 7 lentes se quiser ver isso sem
ambiguidade.
