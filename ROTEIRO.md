# Roteiro de estudo — o caminho, na ordem

Este é o índice executável do programa: a sequência exata a seguir, com o que abrir, o que
produzir e o critério para avançar em cada etapa. Ele não substitui os outros dois guias —
[`cronograma.md`](./cronograma.md) diz **quando** e [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md) diz
**como**; este diz **em que ordem**. Marque as caixas conforme avança; o painel oficial de
progresso continua sendo a tabela do [`README.md`](./README.md).

Uma regra transversal, válida do primeiro checkpoint ao simulado 02: **todo erro — e todo
acerto com hesitação — vai para `simulados/erros.md`**, classificado por causa (desconhecimento
/ desatenção / confusão entre conceitos), porque cada causa pede um remédio diferente. O
protocolo completo está em [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md) §3.

---

## Etapa 0 — Fundamentos (antes da semana 1)

O pré-requisito de tudo. Não conta contra as 12 semanas.

- [ ] Ler [`dominios/00-fundamentos/notas.md`](./dominios/00-fundamentos/notas.md) na ordem —
      §1 o modelo → §2 stateless → §3 ferramentas → §4 agent loop — pelo método de leitura
      ativa (COMO-ESTUDAR §1).
- [ ] Responder por escrito os `### Checkpoint` das seções, **antes** de abrir cada `<details>`
      de respostas.
- [ ] Teste do papel: desenhar de memória o ciclo
      `request → tool_use → execução → tool_result → end_turn`.

**Critério para avançar:** checkpoints certos sem consulta e o desenho saindo inteiro. Quem já
constrói sobre a Claude API na prática faz só os checkpoints como autoteste e segue.

---

## Etapa 1 — Domínio 1: Agentic Architecture & Orchestration (27% · semanas 1–2)

O maior peso da prova — e o modelo de como todos os domínios serão estudados. Quatro
artefatos, **nesta ordem**:

**1a. Notas** — [`dominios/01-agentic-architecture/notas.md`](./dominios/01-agentic-architecture/notas.md)

- [ ] `## 0. A visão geral` — ler uma vez, sem método; é a moldura das oito peças.
- [ ] Semana 1, uma seção por sessão de estudo, ciclo completo de leitura ativa em cada:
      §1 Loop agêntico → §2 Sessões → §3 Subagentes → §4 Paralelismo.
- [ ] Semana 2, mesmo ritmo: §5 Contexto explícito → §6 Hooks → §7 Decomposição →
      §8 Escalonamento.
- [ ] `## 9. Reconstrução` + resumos finais — fechar recontando a execução da §0 de memória,
      justificando cada decisão pelo critério.

**1b. Armadilhas** — [`armadilhas.md`](./dominios/01-agentic-architecture/armadilhas.md)

- [ ] Rodar o baralho inteiro numa sentada: para cada título `### A vs. B`, enunciar **o
      critério** e **o cenário de inversão** antes de abrir a entrada. Uma entrada só sai do
      baralho com dois enunciados corretos em dias diferentes.

**1c. Lab** — [`lab/README.md`](./dominios/01-agentic-architecture/lab/README.md)

- [ ] Passagem 1 — linha de base: ler o `## Critério de "funcionou"` **antes** de rodar;
      anotar os seus números (wall clock, speedup, custo).
- [ ] Passagem 2 — os 5 experimentos do `## Roteiro de quebra`, um por vez, sempre com a
      previsão **escrita** antes de editar. Previsão errada → `simulados/erros.md` (é o evento
      mais valioso da semana).
- [ ] Passagem 3 — modificar o lab em direção ao cenário de §4 (é a passagem que se corta se a
      semana apertar; as duas primeiras, não).

**1d. Checkpoint do domínio** — [`questions.md`](./dominios/01-agentic-architecture/questions.md) + [`gabarito.md`](./dominios/01-agentic-architecture/gabarito.md)

- [ ] As 20 questões em condição de prova: papel, sem consulta, todas de uma vez, tempo total
      anotado. Marcar com `?` toda questão com chute ou hesitação.
- [ ] Corrigir no fim; ler no gabarito a análise dos distratores **também das que acertou**;
      registrar erros (e acertos com `?`) em `simulados/erros.md`.
- [ ] **≥ 16/20 fecha o domínio** → preencher o `Checkpoint %` na tabela do README. Abaixo
      disso, o domínio volta como prioridade na revisão da semana 11.
- [ ] Segunda passada, só das questões do log, **pelo menos uma semana depois** — nunca no
      mesmo dia.

---

## Etapas 2–5 — Domínios 2 a 5 (semanas 3–9)

O material destes domínios ainda não existe — nasce nas Tasks 3–6 do plano mestre
(`docs/superpowers/plans/2026-09-17-ccar-f-prep.md`), já no template didático que o Domínio 1
inaugurou. A sequência interna de estudo de cada um é **a mesma da Etapa 1**: visão geral →
seções de notas (uma por sessão) → armadilhas → lab em três passagens → checkpoint ≥ 80%.

- [ ] **Etapa 2** — Domínio 2: Claude Code Configuration & Workflows (20% · semanas 3–4) —
      `dominios/02-claude-code/`
- [ ] **Etapa 3** — Domínio 3: Prompt Engineering & Structured Output (20% · semanas 5–6) —
      `dominios/03-prompt-structured-output/`
- [ ] **Etapa 4** — Domínio 4: Tool Design & MCP Integration (18% · semanas 7–8) —
      `dominios/04-tool-design-mcp/`
- [ ] **Etapa 5** — Domínio 5: Context Management & Reliability (15% · semana 9) —
      `dominios/05-context-reliability/`

---

## Etapa 6 — Projeto integrador (semana 10)

- [ ] `labs/projeto-integrador/` (nasce na Task 7 do plano): um único pipeline multiagente que
      exercita os cinco domínios de ponta a ponta. Usar o mapa **domínio → componente** do
      README do projeto como revisão final dirigida — cada componente que você não souber
      explicar aponta o domínio a revisitar.

---

## Etapa 7 — Simulado 01 e revisão dirigida (semana 11)

- [ ] `simulados/simulado-01.md` (nasce na Task 8): 60 questões, cronometrado, sem consulta,
      resposta única — condições de prova.
- [ ] Preencher `simulados/erros.md` com **causa e ação** para cada erro.
- [ ] Revisão dirigida pela causa, não pela vontade: desconhecimento → reler **um** `§N` de
      notas · confusão entre conceitos → armadilhas (e escrever a entrada `### A vs. B` que
      faltar) · desatenção → protocolo de leitura (pergunta final antes do cenário).
- [ ] Para cada domínio abaixo de 85%: uma ação concreta de revisão agendada.

---

## Etapa 8 — Simulado 02 e fechamento (semana 12)

- [ ] `simulados/simulado-02.md` (nasce na Task 9), nas mesmas condições de prova.
- [ ] **≥ 85% de acerto = critério de sucesso do programa.**
- [ ] Fechar o painel do README (percentuais por domínio + data alvo) e agendar o exame na
      Pearson VUE — logística em [`referencias/links.md`](./referencias/links.md).

---

## Se a sessão de hoje tem só 30 minutos

Prioridade fixa, nesta ordem: **1º** a próxima seção `## N` de notas pendente (ciclo completo
de leitura ativa — cabe em 30 minutos); **2º** o baralho de armadilhas do domínio corrente;
**3º** refazer erros de `simulados/erros.md` com mais de uma semana de idade. Lab e simulados
pedem sessões inteiras — não os fatie.
