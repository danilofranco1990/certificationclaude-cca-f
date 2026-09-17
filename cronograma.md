# Cronograma — 12 semanas

Referência semana a semana do programa de preparação para o CCAR-F. Cada semana de domínio
produz os quatro artefatos padrão (`notas.md`, `armadilhas.md`, `lab/`, `questions.md`) e fecha
com um checkpoint de questões daquele domínio. Meta do checkpoint: **≥ 80%** de acerto. Abaixo
disso, o domínio não é dado por encerrado e volta como prioridade na revisão da semana 11.

## Semana 1 — Domínio 1: Agentic Architecture & Orchestration (parte 1)

- **Foco:** anatomia do loop agêntico (gather context → take action → verify work → repeat),
  sessões e continuidade, subagentes e isolamento de contexto.
- **Artefatos a produzir:** primeira metade de `dominios/01-agentic-architecture/notas.md`
  (subtópicos 1–4 do syllabus do domínio).
- **Entregável que fecha a semana:** rascunho revisado das quatro primeiras seções de notas,
  com pelo menos um cenário de prova por subtópico.

## Semana 2 — Domínio 1: Agentic Architecture & Orchestration (parte 2)

- **Foco:** delegação e execução paralela, passagem explícita de contexto, hooks, decomposição
  de tarefas e escalonamento para humano.
- **Artefatos a produzir:** segunda metade de `notas.md`, `armadilhas.md` completo (≥5
  entradas), `lab/orchestrator.ts` (orquestrador com fan-out via Claude Agent SDK) e
  `questions.md` (20 questões).
- **Entregável que fecha a semana:** lab rodando com paralelismo comprovado e **checkpoint do
  Domínio 1 ≥ 80%** nas 20 questões de `questions.md`.

## Semana 3 — Domínio 2: Claude Code Configuration & Workflows (parte 1)

- **Foco:** hierarquia de `CLAUDE.md`, regras por caminho em `.claude/rules/`, slash commands
  customizados, skills e `SKILL.md`.
- **Artefatos a produzir:** primeira metade de `dominios/02-claude-code/notas.md` (subtópicos
  1–4).
- **Entregável que fecha a semana:** rascunho revisado das quatro primeiras seções de notas,
  com exemplo concreto de cada mecanismo.

## Semana 4 — Domínio 2: Claude Code Configuration & Workflows (parte 2)

- **Foco:** `context: fork`, `allowed-tools` e `argument-hint`, planning mode vs. execução
  direta, modo não-interativo (`claude -p`, `--output-format json`/`stream-json`), CI/CD.
- **Artefatos a produzir:** segunda metade de `notas.md`, `armadilhas.md` completo, lab de
  configuração (`lab/.claude/commands/review-diff.md`, `lab/.claude/skills/api-conventions/SKILL.md`,
  `lab/.claude/rules/sql.md`, `lab/README.md`) e `questions.md` (20 questões).
- **Entregável que fecha a semana:** lab executado com saída JSON válida em modo não-interativo
  e **checkpoint do Domínio 2 ≥ 80%**.

## Semana 5 — Domínio 3: Prompt Engineering & Structured Output (parte 1)

- **Foco:** critérios objetivos, few-shot prompting, saída estruturada via `tool_use`, design de
  JSON Schema (`required`, `nullable`, `enum`, `additionalProperties`).
- **Artefatos a produzir:** primeira metade de `dominios/03-prompt-structured-output/notas.md`
  (subtópicos 1–4).
- **Entregável que fecha a semana:** rascunho revisado com exemplo de schema para cada
  distinção coberta.

## Semana 6 — Domínio 3: Prompt Engineering & Structured Output (parte 2)

- **Foco:** ausente vs. nulo vs. desconhecido, validação e retry com feedback, extração de
  documentos não estruturados, Message Batches API, revisão em múltiplas etapas.
- **Artefatos a produzir:** segunda metade de `notas.md`, `armadilhas.md` completo, lab
  extrator validado (`lab/schema.ts`, `lab/extract.ts`, fixtures) e `questions.md` (20
  questões).
- **Entregável que fecha a semana:** extrator rodando nos dois fixtures (contrato completo e
  ambíguo, sem campo inventado) e **checkpoint do Domínio 3 ≥ 80%**.

## Semana 7 — Domínio 4: Tool Design & MCP Integration (parte 1)

- **Foco:** anatomia da tool definition, a description como contrato, design de parâmetros,
  `tool_choice` (`auto`/`any`/`tool`/`none`).
- **Artefatos a produzir:** primeira metade de `dominios/04-tool-design-mcp/notas.md`
  (subtópicos 1–4).
- **Entregável que fecha a semana:** rascunho revisado com exemplo de description boa vs. ruim
  para a mesma tool.

## Semana 8 — Domínio 4: Tool Design & MCP Integration (parte 2)

- **Foco:** primitivas MCP (server, tools, resources, prompts), transports (stdio vs. HTTP),
  erros estruturados (`is_error`), ferramentas nativas do Claude Code.
- **Artefatos a produzir:** segunda metade de `notas.md` (com a tabela de taxonomia de erros),
  `armadilhas.md` completo, lab de servidor MCP (`lab/errors.ts`, `lab/server.ts`) e
  `questions.md` (20 questões).
- **Entregável que fecha a semana:** `server.ts --selftest` imprimindo os quatro cenários de
  erro sem recomendar retry para erro de regra de negócio, e **checkpoint do Domínio 4 ≥ 80%**.

## Semana 9 — Domínio 5: Context Management & Reliability

- **Foco:** janela de contexto e compaction, lost in the middle, preservação literal de fatos
  críticos, resumos progressivos, scratchpad externo, propagação de erro em multiagente,
  calibração de confiança, proveniência e ambiguidade.
- **Artefatos a produzir:** `dominios/05-context-reliability/notas.md` completo,
  `armadilhas.md` completo, lab de pipeline com proveniência (`lab/research.ts`,
  `lab/check-preservation.ts`) e `questions.md` (20 questões).
- **Entregável que fecha a semana:** `check-preservation.ts` saindo com código 0 (zero
  divergência numérica entre scratchpad e relatório) e **checkpoint do Domínio 5 ≥ 80%**.

## Semana 10 — Projeto integrador

- **Foco:** consolidar os cinco domínios em um único pipeline multiagente de pesquisa — servidor
  MCP próprio, orquestração de subagentes com contexto explícito, extração estruturada validada
  por schema, verificação de preservação numérica, e execução por slash command e por CI.
- **Artefatos a produzir:** `labs/projeto-integrador/` completo (README com mapa domínio →
  componente, `mcp-server/errors.ts`, `mcp-server/server.ts`, `schema.ts`, `orchestrator.ts`,
  `.claude/commands/research.md`, `.github/workflows/research.yml`).
- **Entregável que fecha a semana:** `orchestrator.ts` gerando `relatorio.json` válido contra o
  schema, com fonte e data em toda afirmação e zero divergência numérica.

## Semana 11 — Simulado 01 e revisão dirigida

- **Foco:** simular a prova real em condições de prova (cronometrado, sem consulta, resposta
  única) e transformar cada erro em ação concreta de estudo.
- **Artefatos a produzir:** `simulados/simulado-01.md` (60 questões novas, distribuídas pelo
  peso real de cada domínio) e `simulados/erros.md` preenchido a partir do resultado.
- **Entregável que fecha a semana:** simulado 01 aplicado sob cronômetro, log de erros
  completo com causa (desconhecimento / desatenção / confusão entre conceitos) e ação de
  revisão para cada domínio abaixo de 85%.

## Semana 12 — Simulado 02 e revisão final

- **Foco:** segunda rodada cronometrada, com dificuldade deslocada para os domínios que ficaram
  abaixo de 85% no simulado 01, e fechamento do painel de progresso.
- **Artefatos a produzir:** `simulados/simulado-02.md` (60 questões novas) e atualização final
  do `README.md` com os percentuais por domínio e a data alvo do exame.
- **Entregável que fecha a semana:** simulado 02 aplicado sob as mesmas condições de prova,
  com **≥ 85% de acerto** — critério de sucesso do programa — e painel de progresso fechado.
