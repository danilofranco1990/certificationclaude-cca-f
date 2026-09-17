# CCAR-F Prep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produzir todo o material de preparação para a Claude Certified Architect – Foundations: cinco módulos de domínio (notas, armadilhas, lab, questões), um projeto integrador e dois simulados cronometrados.

**Architecture:** Um módulo por domínio, na ordem do peso na prova. Cada módulo entrega quatro artefatos independentes e commitáveis separadamente: `notas.md` (teoria, PT), `armadilhas.md` (distinções confundíveis, PT), `lab/` (código executável) e `questions.md` (questões-cenário em EN com gabarito comentado em PT). Os labs crescem em complexidade e desembocam no projeto integrador da Task 7.

**Tech Stack:** Markdown; Claude Code CLI; Claude Agent SDK (TypeScript); Claude API (Messages, Tool Use, Message Batches); MCP SDK; Node.js 20+.

**Convenção de verificação:** artefatos de conteúdo são verificados por critério objetivo (contagem, presença de seção, formato). Labs são verificados por comando executável com saída esperada.

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

Tabela `Termo (EN) | Definição (PT) | Domínio`, com no mínimo 30 termos do syllabus: agentic loop, subagent, fan-out, hook, session, context window, lost in the middle, scratchpad, progressive summarization, provenance, tool_choice, tool_use, JSON Schema, enum, nullable, few-shot, Message Batches API, MCP server, MCP resource, transport, stdio, planning mode, headless mode, path-specific rules, skill, slash command, context fork, allowed-tools, argument-hint, confidence calibration, human escalation.

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
6. **Frontmatter `allowed-tools` e `argument-hint`** — restringir ferramentas por comando; sinalizar a forma do argumento.
7. **Planning mode vs. execução direta** — quando exigir plano aprovado antes de agir.
8. **Modo não-interativo** — `claude -p`, `--output-format json` e `stream-json`, como consumir a saída em script.
9. **CI/CD** — Claude Code em GitHub Actions; permissões em ambiente sem humano; saída estruturada como contrato do pipeline.

- [ ] **Step 2: Escrever `armadilhas.md`**

Mínimo cinco entradas, mesmo formato da Task 2:

- CLAUDE.md **vs.** Skill **vs.** slash command (sempre em contexto / sob demanda por descrição / invocado explicitamente)
- `context: fork` **vs.** execução no contexto principal
- `allowed-tools` no comando **vs.** `permissions` em `settings.json`
- Planning mode **vs.** permission mode
- `--output-format json` **vs.** `stream-json`

- [ ] **Step 3: Escrever o lab — configuração completa**

Projeto de exemplo com: slash command `review-diff` usando `argument-hint`, `allowed-tools` restrito a leitura e `context: fork`; Skill `api-conventions` com description acionável; regra por caminho em `.claude/rules/sql.md` valendo só para `**/*.sql`. O `README.md` explica o que cada peça demonstra.

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
4. **Design de JSON Schema** — `required`, opcional, `nullable`, `enum`, `additionalProperties`; a `description` de cada campo funciona como prompt.
5. **Ausente vs. nulo vs. desconhecido** — modelar "não encontrado" explicitamente em vez de deixar o modelo inventar.
6. **Validação e retry com feedback** — devolver a mensagem do validador ao modelo em vez de repetir a mesma chamada.
7. **Extração de documentos não estruturados** — ancorar cada campo numa citação do trecho de origem.
8. **Message Batches API** — assíncrono, alto volume, custo reduzido, janela de processamento; quando não usar.
9. **Revisão em múltiplas etapas** — instância independente como revisora e por que a mesma instância tende a se auto-aprovar.

- [ ] **Step 2: Escrever `armadilhas.md`**

Mínimo cinco entradas:

- `tool_use` com schema **vs.** pedir JSON no texto da resposta
- Campo opcional **vs.** `nullable` **vs.** `enum` com valor `unknown`
- Retry cego **vs.** retry com a mensagem de validação
- Message Batches **vs.** chamada síncrona **vs.** streaming
- Auto-revisão na mesma instância **vs.** instância independente

- [ ] **Step 3: Escrever o lab — extrator validado**

`schema.ts` define o JSON Schema de extração de contrato: partes, datas, valores, `enum` de tipo de contrato e campos nullable. `extract.ts` envia um documento não estruturado, força `tool_use`, valida a saída e, em caso de falha, faz **um** retry injetando o erro de validação no prompt. As duas fixtures fornecem um contrato completo e um com campo faltando.

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

`schema.ts` define o relatório final como JSON Schema, com `enum` de nível de confiança e campos nullable para o que não foi encontrado.

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

60 questões **em inglês**, distribuídas pelo peso real da prova: 16 do domínio 1, 12 do 2, 12 do 3, 11 do 4, 9 do 5. Questões novas, não reaproveitadas dos bancos de domínio. Cabeçalho `### Question N`. Instruções de prova no topo: cronometrado, sem consulta, resposta única. Gabarito em seção separada ao final, após um marcador `<!-- GABARITO -->` para permitir esconder na primeira leitura.

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

60 questões novas em inglês, mesma distribuição por peso da Task 8, com dificuldade deslocada para os domínios em que o log de erros da Task 8 mostrou desempenho abaixo de 85%. Mesmo formato de gabarito escondido.

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
