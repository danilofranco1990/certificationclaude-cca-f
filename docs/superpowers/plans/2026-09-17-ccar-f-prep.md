# CCAR-F Prep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produzir todo o material de preparação para a Claude Certified Architect – Foundations: cinco módulos de domínio (notas, armadilhas, lab, questões), um projeto integrador e dois simulados cronometrados.

**Architecture:** Um módulo por domínio, na ordem do peso na prova. Cada módulo entrega cinco artefatos independentes e commitáveis separadamente: `notas.md` (teoria, PT), `armadilhas.md` (distinções confundíveis, PT), `lab/` (código executável), `questions.md` (só as questões-cenário, em EN) e `gabarito.md` (respostas e explicações, em PT). Ver o **Template de módulo de domínio** abaixo — ele é obrigatório e vale mais que a descrição individual de cada task. Os labs crescem em complexidade e desembocam no projeto integrador da Task 7.

**Tech Stack:** Markdown; Claude Code CLI; Claude Agent SDK (TypeScript); Claude API (Messages, Tool Use, Message Batches); MCP SDK; Node.js 20+.

**Convenção de verificação:** artefatos de conteúdo são verificados por critério objetivo (contagem, presença de seção, formato). Labs são verificados por comando executável com saída esperada.

**Convenção de progresso (vale para todas as tasks):** ao fechar qualquer task, antes do commit, marque as células correspondentes na tabela de progresso do `README.md` e reescreva a seção "Próximo passo" apontando a próxima task. `README.md` entra no commit da própria task. Isso não é repetido em cada task abaixo de propósito — é uma regra única para não haver duas fontes de verdade.

**Template de módulo de domínio (obrigatório nas Tasks 2 a 6).** Estabelecido na revisão da Task 2 para que os cinco módulos tenham a mesma forma:

1. **Estrutura fixa de seção em `notas.md`.** Toda seção abre com `### Definição` (mesmo que seja uma linha apontando para o glossário), tem uma subseção de critério de decisão sempre chamada `### Quando usar` (mesmo quando o conteúdo é "quando *não* usar"), e fecha com `### Cenário de prova`. Sem variação de nome entre seções.
2. **Referências cruzadas são campo obrigatório, não enfeite.** Toda entrada de `armadilhas.md` termina com `ver notas.md §N`. Toda entrada do gabarito que testa uma armadilha aponta `ver armadilhas.md — <título>`. Retrofitar isso depois de cinco domínios é caro; escrever junto é quase de graça.
3. **Gabarito em arquivo separado.** Cada módulo produz `questions.md` (só as questões) e `gabarito.md` (respostas e explicações). Um único arquivo permite que um scroll ou um `Ctrl+F` estrague o autoteste. Vale também para os simulados das Tasks 8 e 9: `simulado-NN.md` e `simulado-NN-gabarito.md`, substituindo o marcador `<!-- GABARITO -->`.
4. **Glossário atualizado no mesmo commit.** Quando as notas de um domínio refinam ou contradizem um termo já em `referencias/glossario.md`, o glossário é corrigido no commit daquela task — nunca deixado divergir.
5. **Padrão de código dos labs.** Quando um lab tiver dois caminhos de demonstração, compartilhar a configuração por spread (`{ ...BASE_OPTIONS, ...overrides }`), nunca copiando campos à mão. Usar os tipos de união discriminada do SDK em vez de `as unknown as`. O lab existe para ensinar o SDK — código que contorna o tipo ensina a contornar o tipo.
6. **`lab/README.md` traz sempre** o critério de "funcionou" *antes* do comando, a execução real observada com números, o custo de pior caso da rodada completa, e uma linha de troubleshooting separando "meu código está errado" de "o ambiente atrapalhou".
7. **Roteiro de quebra em todo `lab/README.md`.** O lab ensina por falha controlada, não por execução bem-sucedida. Cada lab traz uma seção `## Roteiro de quebra` com no mínimo quatro experimentos, cada um no formato: **o que mudar** (alteração concreta e pontual no código) → **o que deve acontecer** (a falha ou degradação esperada, observável) → **a que armadilha ou questão isso corresponde**. Experimentos que já ocorreram de verdade durante a construção do lab entram com essa marcação, porque falha real vale mais que falha imaginada.

**Fonte de verdade dos pesos:** a tabela do `README.md`. Os percentuais nos títulos das tasks e a distribuição de questões dos simulados (Tasks 8 e 9) são **derivados** dela. Se o Exam Guide oficial trouxer pesos diferentes, atualize o `README.md` primeiro e recalcule a distribuição dos simulados a partir dele.

---

### Task 1: Scaffolding do repositório

**Files:**
- Create: `README.md`
- Create: `cronograma.md`
- Create: `referencias/links.md`
- Create: `referencias/glossario.md`
- Create: `.gitignore`

- [ ] **Step 1: Criar a árvore de diretórios**

```bash
mkdir -p referencias labs/projeto-integrador simulados \
  dominios/01-agentic-architecture/lab \
  dominios/02-claude-code/lab \
  dominios/03-prompt-structured-output/lab \
  dominios/04-tool-design-mcp/lab \
  dominios/05-context-reliability/lab
```

- [ ] **Step 2: Escrever `.gitignore`**

```
node_modules/
.env
*.log
dist/
.DS_Store
```

- [ ] **Step 3: Escrever `README.md`**

Painel de controle, nesta ordem: (a) identificação do exame — Claude Certified Architect – Foundations (CCAR-F), Pearson VUE, proctored, US$ 125; (b) tabela de progresso com uma linha por domínio, colunas `Domínio | Peso | Notas | Armadilhas | Lab | Questões | Checkpoint %`, todas as células de status iniciando como `[ ]`; (c) seção "Próximo passo" com uma única frase apontando a task corrente; (d) seção "Pendências externas" listando o Exam Guide oficial e a confirmação de acesso ao Claude Partner Network; (e) link para `cronograma.md` e para o spec em `docs/superpowers/specs/2026-09-17-ccar-f-prep-design.md`.

- [ ] **Step 4: Escrever `cronograma.md`**

Uma seção por semana, das 12, cada uma com: foco, artefatos a produzir e o entregável que fecha a semana. Semanas 1–2 domínio 1; 3–4 domínio 2; 5–6 domínio 3; 7–8 domínio 4; 9 domínio 5; 10 projeto integrador; 11 simulado 01 e revisão dirigida; 12 simulado 02 e revisão final. Cada semana que fecha um domínio termina com o checkpoint de ≥80% nas questões daquele domínio.

- [ ] **Step 5: Escrever `referencias/links.md`**

Links oficiais agrupados, cada um com uma linha dizendo para que serve no estudo:
- Pearson VUE — https://www.pearsonvue.com/us/en/anthropic.html
- Anúncio das quatro certificações — https://claude.com/blog/four-role-based-claude-certifications
- Página do exame no Partner Academy — https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification
- Docs de Claude Code, Claude Agent SDK, Messages API, Message Batches API e Model Context Protocol.

- [ ] **Step 6: Escrever `referencias/glossario.md`**

Tabela `Termo (EN) | Definição (PT) | Domínio`, com no mínimo 30 termos do syllabus: agentic loop, subagent, fan-out, hook, session, context window, lost in the middle, scratchpad, progressive summarization, provenance, tool_choice, tool_use, JSON Schema, enum, null em JSON Schema vs. nullable do OpenAPI, few-shot, Message Batches API, MCP server, MCP resource, transport, stdio, planning mode, headless mode, path-specific rules, skill, slash command, context fork, allowed-tools, argument-hint, confidence calibration, human escalation.

- [ ] **Step 7: Verificar**

Run: `ls -R dominios referencias simulados labs && wc -l README.md cronograma.md referencias/glossario.md`
Expected: as 5 pastas de domínio, cada uma com subpasta `lab/`; `cronograma.md` com 12 seções de semana; `glossario.md` com ≥30 linhas de tabela.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffolding do repositorio de estudo CCAR-F"
```

---

### Task 2: Domínio 1 — Agentic Architecture & Orchestration (27%)

**Files:**
- Create: `dominios/01-agentic-architecture/notas.md`
- Create: `dominios/01-agentic-architecture/armadilhas.md`
- Create: `dominios/01-agentic-architecture/lab/orchestrator.ts`
- Create: `dominios/01-agentic-architecture/lab/README.md`
- Create: `dominios/01-agentic-architecture/questions.md`

- [ ] **Step 1: Escrever `notas.md`**

Oito seções, uma por subtópico do syllabus, cada uma com definição, quando usar e um cenário de prova:

1. **Anatomia do loop agêntico** — gather context → take action → verify work → repeat. Por que o passo de verificação é o que separa um agente de uma chamada única.
2. **Sessões e continuidade** — sessão nova vs. resume; o que persiste entre turnos; quando o histórico deixa de ajudar e passa a poluir.
3. **Subagentes** — isolamento de contexto como benefício principal; custo de round-trip; o subagente não enxerga o contexto do pai a menos que ele seja passado explicitamente.
4. **Delegação e execução paralela** — tarefas independentes vs. dependentes; fan-out; por que estado compartilhado impede paralelismo.
5. **Passagem explícita de contexto** — o antipadrão de assumir contexto implícito; o que precisa ser repetido no prompt do subagente.
6. **Hooks** — execução determinística em pontos do ciclo (antes/depois de uso de ferramenta, início de sessão, parada); hook vs. instrução em prompt.
7. **Decomposição de tarefas** — critérios para quebrar: independência, tamanho de contexto, verificabilidade.
8. **Escalonamento para humano** — gatilhos: baixa confiança, ação irreversível, conflito de requisitos, falha repetida; como escalar preservando o estado.

- [ ] **Step 2: Escrever `armadilhas.md`**

Formato por entrada: `### A vs. B` → o critério que separa → o cenário onde a escolha inverte. Mínimo cinco entradas:

- Subagente com contexto isolado **vs.** continuar no contexto principal
- Execução paralela **vs.** sequencial (o teste é dependência de estado, não tamanho da tarefa)
- Hook **vs.** instrução no prompt (determinístico vs. probabilístico)
- Sessão nova **vs.** resume
- Escalonar para humano **vs.** tentar novamente (irreversibilidade e confiança, não número de tentativas)

- [ ] **Step 3: Escrever o lab — orquestrador com fan-out**

`lab/orchestrator.ts` usa o Claude Agent SDK para receber um tópico, disparar três subagentes em paralelo com recortes diferentes do problema — cada um recebendo contexto explícito — e sintetizar as três respostas numa saída única. `lab/README.md` traz objetivo, comando para rodar e critério de "funcionou".

- [ ] **Step 4: Rodar o lab**

Run: `cd dominios/01-agentic-architecture/lab && npm install && npx tsx orchestrator.ts "agentic RAG tradeoffs"`
Expected: três blocos de resultado de subagente seguidos de uma síntese final; tempo total menor que a soma dos três, provando o paralelismo.

- [ ] **Step 5: Escrever `questions.md`**

20 questões-cenário **em inglês**, distribuídas pelos oito subtópicos, cada uma com cenário curto, 4 alternativas e uma resposta correta. Cabeçalho de cada questão no formato `### Question N`. Ao final, seção `## Answer Key` com a resposta e, **em português**, por que cada distrator está errado. Cenários obrigatórios: ao menos um de pipeline multiagente de pesquisa, um de atendimento ao cliente com escalonamento e um de decomposição em subagentes.

- [ ] **Step 6: Verificar**

Run: `grep -c '^### Question' dominios/01-agentic-architecture/questions.md && grep -c '^### ' dominios/01-agentic-architecture/armadilhas.md`
Expected: 20 e um número ≥5.

- [ ] **Step 7: Commit**

```bash
git add dominios/01-agentic-architecture
git commit -m "feat(d1): notas, armadilhas, lab e questoes de agentic architecture"
```

---

### Task 3: Domínio 2 — Claude Code Configuration & Workflows (20%)

**Files:**
- Create: `dominios/02-claude-code/notas.md`
- Create: `dominios/02-claude-code/armadilhas.md`
- Create: `dominios/02-claude-code/lab/.claude/commands/review-diff.md`
- Create: `dominios/02-claude-code/lab/.claude/skills/api-conventions/SKILL.md`
- Create: `dominios/02-claude-code/lab/.claude/rules/sql.md`
- Create: `dominios/02-claude-code/lab/README.md`
- Create: `dominios/02-claude-code/questions.md`

- [ ] **Step 1: Escrever `notas.md`**

Nove seções:

1. **Hierarquia de CLAUDE.md** — enterprise, usuário (`~/.claude/CLAUDE.md`), projeto, subdiretório; ordem de precedência e o que cada nível deve conter.
2. **Regras por caminho em `.claude/rules/`** — regra que só vale para um glob de arquivos; quando isso é melhor que inchar o CLAUDE.md.
3. **Slash commands customizados** — arquivos em `.claude/commands/`, o corpo como prompt, `$ARGUMENTS`.
4. **Skills** — `SKILL.md` com `name` e `description`; a description é o gatilho de acionamento; progressive disclosure, em que só o metadado fica em contexto até a skill ser invocada.
5. **Frontmatter `context: fork`** — roda em contexto separado e devolve só o resultado; quando isso protege a janela principal.
6. **Frontmatter `allowed-tools`, `disallowed-tools` e `argument-hint`** — `allowed-tools` **concede** permissão para as ferramentas listadas durante o turno que invoca a skill, para que sejam usadas sem pedir aprovação; ele **não restringe nada** — toda ferramenta continua chamável e as permissões de base seguem valendo. Quem remove ferramentas do pool é `disallowed-tools`. Ambos os efeitos duram um turno e caem na mensagem seguinte. `argument-hint` sinaliza a forma do argumento.
7. **Planning mode vs. execução direta** — quando exigir plano aprovado antes de agir.
8. **Modo não-interativo** — `claude -p`, `--output-format json` e `stream-json`, como consumir a saída em script.
9. **CI/CD** — Claude Code em GitHub Actions; permissões em ambiente sem humano; saída estruturada como contrato do pipeline.

- [ ] **Step 2: Escrever `armadilhas.md`**

Mínimo cinco entradas, mesmo formato da Task 2:

- CLAUDE.md **vs.** Skill **vs.** slash command (sempre em contexto / sob demanda por descrição / invocado explicitamente)
- `context: fork` **vs.** execução no contexto principal
- `allowed-tools` (concede, um turno) **vs.** `disallowed-tools` (restringe, um turno) **vs.** `permissions` em `settings.json` (persistente)
- Planning mode **vs.** permission mode
- `--output-format json` **vs.** `stream-json`

- [ ] **Step 3: Escrever o lab — configuração completa**

Projeto de exemplo com: slash command `review-diff` usando `argument-hint`, `allowed-tools` concedendo as ferramentas de leitura sem prompt, `disallowed-tools` removendo `Write` e `Edit` do pool, e `context: fork`; Skill `api-conventions` com description acionável; regra por caminho em `.claude/rules/sql.md` valendo só para `**/*.sql`. O `README.md` explica o que cada peça demonstra — em particular, que é `disallowed-tools`, e não `allowed-tools`, que impede a escrita.

- [ ] **Step 4: Rodar o lab**

Run: `cd dominios/02-claude-code/lab && claude -p "/review-diff HEAD" --output-format json | head -40`
Expected: JSON válido na saída; o comando roda em contexto forkado e não solicita ferramentas de escrita.

- [ ] **Step 5: Escrever `questions.md`**

20 questões em inglês pelos nove subtópicos, cabeçalho `### Question N`, seção `## Answer Key` explicada em português. Cenários obrigatórios: ao menos um de automação de CI/CD e um de organização de configuração em monorepo.

- [ ] **Step 6: Verificar**

Run: `grep -c '^### Question' dominios/02-claude-code/questions.md && grep -c '^### ' dominios/02-claude-code/armadilhas.md`
Expected: 20 e um número ≥5.

- [ ] **Step 7: Commit**

```bash
git add dominios/02-claude-code
git commit -m "feat(d2): notas, armadilhas, lab e questoes de Claude Code"
```

---

### Task 4: Domínio 3 — Prompt Engineering & Structured Output (20%)

**Files:**
- Create: `dominios/03-prompt-structured-output/notas.md`
- Create: `dominios/03-prompt-structured-output/armadilhas.md`
- Create: `dominios/03-prompt-structured-output/lab/schema.ts`
- Create: `dominios/03-prompt-structured-output/lab/extract.ts`
- Create: `dominios/03-prompt-structured-output/lab/fixtures/contrato.txt`
- Create: `dominios/03-prompt-structured-output/lab/fixtures/contrato-ambiguo.txt`
- Create: `dominios/03-prompt-structured-output/lab/README.md`
- Create: `dominios/03-prompt-structured-output/questions.md`

- [ ] **Step 1: Escrever `notas.md`**

Nove seções:

1. **Critérios objetivos** — transformar "escreva um bom resumo" em rubrica verificável.
2. **Few-shot prompting** — quantidade, diversidade, e por que incluir o caso difícil entre os exemplos.
3. **Saída estruturada via `tool_use`** — forçar o formato pelo schema da ferramenta em vez de pedir JSON em texto livre.
4. **Design de JSON Schema** — `required`, campos opcionais, `enum`, `additionalProperties`; a `description` de cada campo funciona como prompt. Como expressar nulo em JSON Schema: `"type": ["string", "null"]` ou `anyOf` — e por que `nullable: true` é keyword do OpenAPI 3.0 e não tem efeito algum num `input_schema`.
5. **Ausente vs. nulo vs. desconhecido** — modelar "não encontrado" explicitamente em vez de deixar o modelo inventar.
6. **Validação e retry com feedback** — devolver a mensagem do validador ao modelo em vez de repetir a mesma chamada.
7. **Extração de documentos não estruturados** — ancorar cada campo numa citação do trecho de origem.
8. **Message Batches API** — assíncrono, alto volume, custo reduzido, janela de processamento; quando não usar.
9. **Revisão em múltiplas etapas** — instância independente como revisora e por que a mesma instância tende a se auto-aprovar.

- [ ] **Step 2: Escrever `armadilhas.md`**

Mínimo cinco entradas:

- `tool_use` com schema **vs.** pedir JSON no texto da resposta
- Campo opcional (fora de `required`) **vs.** nulo explícito (`"type": ["string","null"]`) **vs.** `enum` com valor `unknown` — incluindo a pegadinha de escrever `nullable: true`, que é OpenAPI e é silenciosamente ignorado em JSON Schema
- Retry cego **vs.** retry com a mensagem de validação
- Message Batches **vs.** chamada síncrona **vs.** streaming
- Auto-revisão na mesma instância **vs.** instância independente

- [ ] **Step 3: Escrever o lab — extrator validado**

`schema.ts` define o JSON Schema de extração de contrato: partes, datas, valores, `enum` de tipo de contrato e campos que aceitam null via `"type": ["string", "null"]`. `extract.ts` envia um documento não estruturado, força `tool_use`, valida a saída e, em caso de falha, faz **um** retry injetando o erro de validação no prompt. As duas fixtures fornecem um contrato completo e um com campo faltando.

- [ ] **Step 4: Rodar o lab**

Run: `cd dominios/03-prompt-structured-output/lab && npm install && npx tsx extract.ts fixtures/contrato.txt && npx tsx extract.ts fixtures/contrato-ambiguo.txt`
Expected: primeiro arquivo produz JSON validado contra o schema; segundo produz o campo ausente como `null`, nunca um valor inventado.

- [ ] **Step 5: Escrever `questions.md`**

20 questões em inglês pelos nove subtópicos, cabeçalho `### Question N`, `## Answer Key` em português. Cenários obrigatórios: ao menos um de extração estruturada de documento e um de processamento em lote de alto volume.

- [ ] **Step 6: Verificar**

Run: `grep -c '^### Question' dominios/03-prompt-structured-output/questions.md && grep -c '^### ' dominios/03-prompt-structured-output/armadilhas.md`
Expected: 20 e um número ≥5.

- [ ] **Step 7: Commit**

```bash
git add dominios/03-prompt-structured-output
git commit -m "feat(d3): notas, armadilhas, lab e questoes de prompt e saida estruturada"
```

---

### Task 5: Domínio 4 — Tool Design & MCP Integration (18%)

**Files:**
- Create: `dominios/04-tool-design-mcp/notas.md`
- Create: `dominios/04-tool-design-mcp/armadilhas.md`
- Create: `dominios/04-tool-design-mcp/lab/errors.ts`
- Create: `dominios/04-tool-design-mcp/lab/server.ts`
- Create: `dominios/04-tool-design-mcp/lab/README.md`
- Create: `dominios/04-tool-design-mcp/questions.md`

- [ ] **Step 1: Escrever `notas.md`**

Oito seções:

1. **Anatomia da tool definition** — nome, description, `input_schema`.
2. **A description como contrato** — dizer quando usar **e quando não usar**; o erro mais comum é descrever o que a ferramenta faz sem dizer quando aplicá-la.
3. **Parâmetros** — nomenclatura, tipos, defaults, `enum` para fechar o espaço de valores.
4. **`tool_choice`** — `auto`, `any`, `tool`, `none`: efeito de cada um e quando forçar.
5. **MCP: servidor, tools, resources, prompts** — o que é cada primitiva e quando usar resource em vez de tool.
6. **Transports** — stdio vs. HTTP; implicações de deploy e autenticação.
7. **Erros estruturados** — `is_error` e mensagem acionável que diz ao modelo o que fazer em seguida.
8. **Ferramentas nativas do Claude Code** — `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`: o que cada uma faz melhor e o custo de usar `Bash` para o trabalho das outras.

Incluir a **taxonomia de erros** como tabela: `Transitório` (retry com backoff) · `Validação` (corrigir o input e repetir) · `Permissão` (escalar, não repetir) · `Regra de negócio` (não repetir, explicar ao usuário).

- [ ] **Step 2: Escrever `armadilhas.md`**

Mínimo cinco entradas:

- `tool_choice: any` **vs.** `tool` **vs.** `auto`
- MCP resource **vs.** MCP tool
- `Grep`/`Glob` nativos **vs.** `Bash` com grep/find
- `Edit` **vs.** `Write` (edição pontual vs. substituição total)
- Erro transitório **vs.** erro de regra de negócio (retry ajuda ou apenas repete a falha)

- [ ] **Step 3: Escrever o lab — servidor MCP com taxonomia de erros**

`errors.ts` implementa as quatro classes de erro, cada uma com mensagem acionável distinta. `server.ts` expõe três tools (`search_orders`, `refund_order`, `get_policy`) e um resource (`policy://refunds`). `refund_order` falha com erro de regra de negócio quando o pedido está fora da janela de reembolso, e com erro de permissão quando o valor excede o limite.

- [ ] **Step 4: Rodar o lab**

Run: `cd dominios/04-tool-design-mcp/lab && npm install && npx tsx server.ts --selftest`
Expected: quatro cenários de erro impressos, cada um com sua classe e ação recomendada; nenhum deles recomendando retry para erro de regra de negócio.

- [ ] **Step 5: Escrever `questions.md`**

20 questões em inglês pelos oito subtópicos, cabeçalho `### Question N`, `## Answer Key` em português. Cenários obrigatórios: ao menos um de atendimento ao cliente com reembolso e um de escolha entre ferramentas nativas do Claude Code.

- [ ] **Step 6: Verificar**

Run: `grep -c '^### Question' dominios/04-tool-design-mcp/questions.md && grep -c '^### ' dominios/04-tool-design-mcp/armadilhas.md`
Expected: 20 e um número ≥5.

- [ ] **Step 7: Commit**

```bash
git add dominios/04-tool-design-mcp
git commit -m "feat(d4): notas, armadilhas, lab e questoes de tool design e MCP"
```

---

### Task 6: Domínio 5 — Context Management & Reliability (15%)

**Files:**
- Create: `dominios/05-context-reliability/notas.md`
- Create: `dominios/05-context-reliability/armadilhas.md`
- Create: `dominios/05-context-reliability/lab/research.ts`
- Create: `dominios/05-context-reliability/lab/check-preservation.ts`
- Create: `dominios/05-context-reliability/lab/README.md`
- Create: `dominios/05-context-reliability/questions.md`

- [ ] **Step 1: Escrever `notas.md`**

Oito seções:

1. **Janela de contexto** — orçamento, o que ocupa espaço, compaction.
2. **Lost in the middle** — degradação de atenção no meio do contexto; posicionar o crítico no início ou no fim.
3. **Preservação de fatos críticos** — números, datas, percentuais e valores monetários devem ser copiados literalmente, nunca parafraseados.
4. **Resumos progressivos** — resumir incrementalmente preservando uma lista de fatos intocáveis.
5. **Scratchpad externo** — tirar estado da janela e colocá-lo em arquivo; quando isso vence o resumo.
6. **Propagação de erro em multiagente** — o erro de um subagente vira premissa do orquestrador; barreiras de verificação.
7. **Calibração de confiança** — confiança declarada não é acurácia; quando exigir revisão humana.
8. **Proveniência e ambiguidade** — fonte, data e citação junto de cada afirmação; quando perguntar ao usuário e quando assumir declarando a premissa.

- [ ] **Step 2: Escrever `armadilhas.md`**

Mínimo cinco entradas:

- Resumir **vs.** preservar literalmente (o que nunca pode ser parafraseado)
- Compaction automática **vs.** scratchpad externo
- Confiança alta **vs.** acurácia
- Perguntar ao usuário **vs.** assumir e declarar a premissa
- Repassar resultado do subagente **vs.** verificar antes de incorporar

- [ ] **Step 3: Escrever o lab — pipeline com proveniência**

`research.ts` roda uma pesquisa em múltiplas etapas mantendo um scratchpad em arquivo, onde cada fato guarda `valor`, `fonte` e `data`. `check-preservation.ts` compara os números do scratchpad com os do relatório final e falha se algum valor numérico divergir.

- [ ] **Step 4: Rodar o lab**

Run: `cd dominios/05-context-reliability/lab && npm install && npx tsx research.ts "mercado de agentes 2026" && npx tsx check-preservation.ts`
Expected: `check-preservation.ts` sai com código 0 e reporta zero divergências numéricas entre scratchpad e relatório.

- [ ] **Step 5: Escrever `questions.md`**

20 questões em inglês pelos oito subtópicos, cabeçalho `### Question N`, `## Answer Key` em português. Cenários obrigatórios: ao menos um de pipeline multiagente de pesquisa com proveniência e um de conflito entre requisitos do usuário.

- [ ] **Step 6: Verificar**

Run: `grep -c '^### Question' dominios/05-context-reliability/questions.md && grep -c '^### ' dominios/05-context-reliability/armadilhas.md`
Expected: 20 e um número ≥5.

- [ ] **Step 7: Commit**

```bash
git add dominios/05-context-reliability
git commit -m "feat(d5): notas, armadilhas, lab e questoes de contexto e confiabilidade"
```

---

### Task 7: Projeto integrador (semana 10)

**Files:**
- Create: `labs/projeto-integrador/README.md`
- Create: `labs/projeto-integrador/mcp-server/errors.ts`
- Create: `labs/projeto-integrador/mcp-server/server.ts`
- Create: `labs/projeto-integrador/schema.ts`
- Create: `labs/projeto-integrador/orchestrator.ts`
- Create: `labs/projeto-integrador/.claude/commands/research.md`
- Create: `labs/projeto-integrador/.github/workflows/research.yml`

- [ ] **Step 1: Escrever `README.md` com o mapa domínio → componente**

Tabela explícita ligando cada um dos cinco domínios ao componente do projeto que o exercita, para que o projeto sirva de revisão final dirigida.

- [ ] **Step 2: Servidor MCP do projeto**

`mcp-server/errors.ts` porta as quatro classes de erro da Task 5 (transitório, validação, permissão, regra de negócio). `mcp-server/server.ts` expõe as tools de busca e leitura de fontes usando essas classes.

- [ ] **Step 3: Saída estruturada**

`schema.ts` define o relatório final como JSON Schema, com `enum` de nível de confiança e campos que aceitam null (via `"type": [...,"null"]`) para o que não foi encontrado.

- [ ] **Step 4: Orquestrador multiagente**

`orchestrator.ts` faz fan-out de subagentes de pesquisa com contexto explícito, mantém scratchpad com proveniência, sintetiza via `tool_use` validado contra `schema.ts` com um retry com feedback, e verifica preservação numérica antes de emitir.

- [ ] **Step 5: Entrada por slash command e por CI**

`.claude/commands/research.md` com `argument-hint` e `allowed-tools`. `.github/workflows/research.yml` roda o mesmo pipeline em modo não-interativo com `--output-format json` e publica o relatório como artefato.

- [ ] **Step 6: Rodar de ponta a ponta**

Run: `cd labs/projeto-integrador && npm install && npx tsx orchestrator.ts "impacto de MCP em integracoes corporativas" --out relatorio.json`
Expected: `relatorio.json` válido contra o schema, toda afirmação carregando fonte e data, e zero divergência numérica entre scratchpad e relatório.

- [ ] **Step 7: Commit**

```bash
git add labs/projeto-integrador
git commit -m "feat: projeto integrador multiagente com MCP, saida estruturada e CI"
```

---

### Task 8: Simulado 01 e revisão dirigida (semana 11)

**Files:**
- Create: `simulados/simulado-01.md`
- Create: `simulados/erros.md`

- [ ] **Step 1: Montar `simulado-01.md`**

60 questões **em inglês**, distribuídas pelo peso real da prova: 16 do domínio 1, 12 do 2, 12 do 3, 11 do 4, 9 do 5. **Esses números são derivados da tabela de pesos do `README.md`** (27/20/20/18/15% × 60, arredondado) — se os pesos mudarem quando o Exam Guide oficial chegar, recalcule esta distribuição antes de escrever as questões. Questões novas, não reaproveitadas dos bancos de domínio. Cabeçalho `### Question N`. Instruções de prova no topo: cronometrado, sem consulta, resposta única. Gabarito em arquivo separado `simulados/simulado-01-gabarito.md`, conforme o item 3 do template de módulo.

- [ ] **Step 2: Criar `erros.md`**

Template de log com colunas `Questão | Domínio | Resposta dada | Correta | Causa (desconhecimento / desatenção / confusão entre conceitos) | Ação`.

- [ ] **Step 3: Verificar**

Run: `grep -c '^### Question' simulados/simulado-01.md`
Expected: 60.

- [ ] **Step 4: Commit**

```bash
git add simulados
git commit -m "feat: simulado 01 e log de erros"
```

---

### Task 9: Simulado 02 e revisão final (semana 12)

**Files:**
- Create: `simulados/simulado-02.md`
- Modify: `README.md`

- [ ] **Step 1: Montar `simulado-02.md`**

60 questões novas em inglês, mesma distribuição por peso da Task 8, com dificuldade deslocada para os domínios em que o log de erros da Task 8 mostrou desempenho abaixo de 85%. Gabarito em `simulados/simulado-02-gabarito.md`, mesmo formato.

- [ ] **Step 2: Fechar o painel no `README.md`**

Preencher a tabela de progresso com os percentuais finais por domínio e registrar a data alvo do exame.

- [ ] **Step 3: Verificar**

Run: `grep -c '^### Question' simulados/simulado-02.md`
Expected: 60.

- [ ] **Step 4: Commit**

```bash
git add simulados README.md
git commit -m "feat: simulado 02 e fechamento do painel de progresso"
```

---

### Task 10: COMO-ESTUDAR.md e roteiros de quebra

> **Executar imediatamente, antes da Task 3.** A regra 7 do template afeta os labs dos Domínios 2–5; o Domínio 1 precisa ser retrofitado agora para servir de modelo.

**Files:**
- Create: `COMO-ESTUDAR.md`
- Modify: `dominios/01-agentic-architecture/lab/README.md`
- Modify: `README.md`

- [ ] **Step 1: Escrever `COMO-ESTUDAR.md`**

O método, não o cronograma — `cronograma.md` já diz *quando*, este diz *como*. Quatro seções:

1. **Notas — leitura ativa.** Ler uma seção, fechar o arquivo, escrever de memória o critério de "Quando usar", comparar. O que não se reproduz é o que ainda não se sabe; sublinhar não revela isso.
2. **Armadilhas — recuperação ativa.** Ler só o título `### A vs. B` e enunciar o critério em voz alta antes de ler a resposta. Dominada é a armadilha cujo critério se enuncia sem olhar.
3. **Questões — condição de prova.** Responder sem abrir `gabarito.md`, marcar num papel, corrigir depois. Cada erro vai para `simulados/erros.md` classificado por causa — desconhecimento, desatenção ou confusão entre conceitos — porque as três pedem remédios diferentes e só a primeira pede reler a teoria.
4. **Labs — três passagens.** Rodar como está para ter linha de base; quebrar de propósito seguindo o `## Roteiro de quebra`; modificar em direção a um cenário de prova. Explicitar que a segunda passagem é onde está o aprendizado, e que rodar uma vez com sucesso ensina quase nada.

- [ ] **Step 2: Escrever o `## Roteiro de quebra` do lab do Domínio 1**

No mínimo quatro experimentos, no formato da regra 7. Os quatro obrigatórios, todos verificados durante a construção ou derivados diretamente do material:

- Remover o contexto explícito do prompt de um worker → as respostas convergem → é o cenário da Question 5, ao vivo.
- `maxTurns: 1` → os três workers morrem com `Reached maximum number of turns`, porque o passo de raciocínio consome um turno → **falha real ocorrida na construção**.
- Path B sem instruir o orquestrador a esperar → delega os três corretamente e responde sem síntese → com o `Agent` tool, esperar é comportamento que se instrui, não padrão → **falha real ocorrida na construção**.
- Criar dependência de estado entre dois workers → o speedup desaparece → armadilha "Execução paralela vs. sequencial: o teste é dependência de estado, não tamanho".

Um quinto, de exploração: subir de três para cinco lentes e observar custo e contexto devolvido crescerem — em que ponto a economia de contexto do subagente se inverte.

- [ ] **Step 3: Verificar**

Run: `grep -c '^## ' COMO-ESTUDAR.md && grep -A200 '^## Roteiro de quebra' dominios/01-agentic-architecture/lab/README.md | grep -c '^### '`
Expected: 4 seções em `COMO-ESTUDAR.md`; ≥4 experimentos no roteiro.

- [ ] **Step 4: Commit**

---

### Task 11: Build de HTML legível

> **Executar depois da Task 10 e antes da Task 3**, para que os Domínios 2–5 já nasçam renderizáveis.

Converter os `.md` do repositório em HTML estilizado e responsivo, com o markdown permanecendo a única fonte de verdade. O HTML é gerado, nunca editado à mão.

**Files:**
- Create: `tools/build-site.mjs`
- Create: `tools/site.css`
- Create: `package.json` (raiz)
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: `package.json` na raiz**

Uma dependência (`marked`) e um script `build` que roda `node tools/build-site.mjs`. Nada além disso.

- [ ] **Step 2: `tools/build-site.mjs`**

Varre `README.md`, `COMO-ESTUDAR.md`, `cronograma.md`, `referencias/*.md`, `dominios/*/*.md`, `dominios/*/lab/README.md`, `labs/**/README.md` e `simulados/*.md`; converte cada um para `site/<mesmo caminho>.html`; gera `site/index.html` com a navegação agrupada por domínio. Reescreve links `.md` → `.html` para que a navegação funcione dentro do site. Ignora `node_modules`. Determinístico: rodar duas vezes produz bytes idênticos.

- [ ] **Step 3: `tools/site.css`**

Mobile-first, largura de leitura confinada (~68ch), tipografia com hierarquia clara, tema claro e escuro via `prefers-color-scheme`, tabelas com scroll horizontal próprio, blocos de código legíveis. Sem CDN, sem fonte externa, sem framework. Legibilidade em sessão longa é o critério, não decoração.

- [ ] **Step 4: `.gitignore` e `README.md`**

Adicionar `site/` ao `.gitignore` — é artefato gerado. Documentar `npm run build` no `README.md`.

- [ ] **Step 5: Verificar**

Run: `npm install && npm run build && ls site/ site/dominios/01-agentic-architecture/ && node -e "const h=require('fs').readFileSync('site/index.html','utf8'); if(!h.includes('viewport')) throw new Error('sem meta viewport')"`
Expected: `site/index.html` e um `.html` por `.md` de origem; nenhum link `.md` remanescente no HTML gerado; segunda execução produz bytes idênticos.

- [ ] **Step 6: Commit**
