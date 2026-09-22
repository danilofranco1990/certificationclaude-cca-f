# Revisão Pedagógica Estrutural — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o repositório de "material de revisão para quem já sabe" em um curso técnico progressivo em que uma pessoa que nunca usou os mecanismos consegue construir o modelo mental de cada um — sem perder um único fato técnico, citação oficial ou artefato do método de estudo já estabelecido.

**Architecture:** Três movimentos. (1) Um **Módulo 0 — Fundamentos** novo, que ensina o alicerce que todo o material assume (modelo, token, API stateless, o ciclo `tool_use` completo, agent loop) — é o pré-requisito que hoje não existe em lugar nenhum. (2) **Reescrita didática de `notas.md` do Domínio 1** sobre um template de seção novo (problema → modelo mental → definição → mecânica → quando usar → checkpoint → cenário de prova), preservando integralmente fatos, citações e a cadeia de referências `§N`. (3) **Template didático promovido a regra** no plano mestre, para que os Domínios 2–5 já nasçam nesse formato. Armadilhas, questões, gabarito e lab **não são reescritos** — eles já cumprem o que a revisão pede (comparações explícitas, raciocínio por distrator, falha controlada) e passam a ser referenciados pela nova camada.

**Tech Stack:** Markdown; `marked` via `tools/build-site.mjs`; diagramas **textuais em blocos ` ```text `** (o site não tem JS e a regra da Task 11 do plano mestre proíbe CDN — Mermaid não renderizaria; diagrama textual renderiza em qualquer superfície: site, GitHub, terminal).

---

## Diagnóstico (exigido pela spec do pedido — "antes de alterar")

### O que está bom e é preservado como está

1. **`armadilhas.md`** — já é exatamente o bloco "comparações explícitas + não confunda" que a revisão pede: critério que separa, cenário de inversão, distrator clássico, ponteiro de teoria. Formato intocado.
2. **`questions.md` + `gabarito.md`** — questões-cenário com explicação de *por que cada distrator é tentador* já treinam raciocínio, não decoreba. Intocados.
3. **`lab/README.md` + Roteiro de quebra** — "o que mudar → o que deve acontecer → a que corresponde" é o hands-on de falha controlada que a revisão pede. Intocado.
4. **`COMO-ESTUDAR.md`** — o método (produzir antes de conferir) é ortogonal à didática do texto e continua válido; só é atualizado onde descreve a estrutura fixa de seção.
5. **Disciplina de fontes** — citações oficiais com link, separação documentado/observado/previsto no lab, nota de terminologia (*verify results*). É o §18 da spec já cumprido.
6. **Cadeia de referências** — gabarito → armadilha → `notas.md §N`. A reescrita **mantém os números §N** exatamente para não quebrar a cadeia.

### As lacunas que este plano ataca

1. **Pré-requisitos ausentes (a maior).** O material assume que o leitor sabe o que é a Messages API, `tool_use`, stateless, token, context window — conceitos que o syllabus só formaliza nos Domínios 3–5, mas que o Domínio 1 usa desde a §1. Não existe o capítulo que ensina o ciclo fundamental (quem chama quem, por que o modelo não executa a ferramenta, como o resultado volta). → **Módulo 0.**
2. **Seções começam no nível 3–4** (implementação/arquitetura) sem passar por intuição e funcionamento. Toda seção abre com `### Definição` (citação da doc) — definição antes do problema, o inverso da progressão pedida. → template novo de seção.
3. **Sem visão geral antes das partes.** O Domínio 1 lista oito seções sem antes mostrar uma execução completa em que todas aparecem juntas. → §0 "A visão geral" + §9 "Reconstrução".
4. **Zero diagramas** em todo o repositório. → diagramas textuais nos fluxos.
5. **Tabelas substituindo explicação.** "O que o subagent enxerga (decorar esta tabela)" manda decorar sem explicar por que cada linha é assim; a tabela de eventos de hooks idem. As tabelas ficam, mas passam a vir *depois* da explicação linha a linha.
6. **Código mostrado, não lido.** O JSON de hooks da §6 aparece sem leitura guiada campo a campo. → leitura guiada.
7. **Sem checkpoints intermediários** — o primeiro exercício está a 20 questões de distância. → `### Checkpoint` por seção, resposta em `<details>`.
8. **Sem "o que acontece se…"** sistemático nas notas (existe só no roteiro de quebra). → bloco por seção onde couber.
9. **Sem analogias** — nenhuma no material; quando entrar, entra com mapeamento + limite, como a spec exige.
10. **Sem resumo de fechamento** ("o que você precisa realmente entender" / "se lembrar só de 3").
11. **Glossário não é contextual** — stateless, harness, JSONL, round-trip, wall clock, race condition aparecem sem definição no ponto de uso; e o glossário geral não tem os termos de fundamentos.
12. **UX de trilha** — o README é painel, não diz "comece aqui"; nenhum arquivo abre com "onde estou / o que preciso saber / o que vou aprender".

### Decisões estruturais

- **Os títulos `## N.` e a ordem das oito seções do Domínio 1 não mudam.** Toda a cadeia `§N` (armadilhas, gabarito, COMO-ESTUDAR, lab) continua válida sem retrofit.
- **Template didático de seção** (obrigatório na reescrita do D1 e promovido a regra para D2–5):

  ```text
  ## N. Título
  (1–2 parágrafos: onde estamos na trilha + o gancho)
  ### O problema            ← por que isso existe; o que quebra sem isso
  ### Modelo mental         ← diagrama textual; analogia SÓ com mapeamento + limite
  ### Definição             ← precisa, com as citações oficiais (conteúdo atual preservado)
  (subseções de mecânica — as atuais, agora explicadas antes das tabelas,
   com leitura guiada de código/JSON, blocos "O que acontece se…" e
   blockquotes "⚠️ Não confunda" onde a confusão mora)
  ### Quando usar           ← critério de decisão (conteúdo atual preservado)
  ### Checkpoint            ← 2–3 perguntas; respostas dentro de <details>
  ### Cenário de prova      ← atual + cadeia de raciocínio numerada (1. … 2. … logo …)
  ```

- **`### Definição`, `### Quando usar` e `### Cenário de prova` mantêm exatamente esses nomes** — o CSS do site (`k-def`, `k-when`, `case-block`) e o método do COMO-ESTUDAR dependem deles.
- **Nenhum fato é resumido para caber.** A reescrita só adiciona camadas por baixo dos fatos; toda citação, número, tabela e edge case do texto atual reaparece no novo.
- **Módulo 0 não é domínio de prova** — não tem peso, não tem checkpoint de 20 questões, não entra na tabela de progresso. É pré-requisito de leitura com checkpoints inline.
- **Sistemas fictícios recorrentes** (a spec pede): o **sistema de suporte** (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`) nasce no Módulo 0 e é reusado; o **pipeline de pesquisa multiagente** (levantar fontes → resumir → relatório → checagem) já existe no D1 (§4, Q4, lab) e é promovido a fio condutor nomeado.

---

### Task 1: Módulo 0 — Fundamentos (`dominios/00-fundamentos/notas.md`)

**Files:**
- Create: `dominios/00-fundamentos/notas.md`

- [ ] **Step 1: Carregar a skill `claude-api` antes de escrever**

Todo fato de API do módulo sai validado dela (ou da doc oficial linkada): valores exatos de `stop_reason`, forma do bloco `tool_use` e do `tool_result` (`tool_use_id`, `content`, `is_error`), parâmetro `system`, `tool_choice`, erro retornado quando `tool_use_id` não casa. O que não estiver documentado entra marcado como interpretação — nunca como fato.

- [ ] **Step 2: Escrever o cabeçalho de trilha**

O arquivo abre com o padrão de UX que a spec pede, e que os domínios vão copiar:

```text
> **Onde você está:** Módulo 0 — o alicerce de todo o resto.
> **O que você precisa saber antes:** programação básica e JSON. Nada de IA.
> **O que você vai aprender:** como uma conversa com Claude funciona por dentro —
> e por que uma "ferramenta" é um pedido que a SUA aplicação executa.
> **Por que importa:** os cinco domínios da prova assumem este capítulo inteiro.
```

- [ ] **Step 3: Escrever as quatro seções, no template didático**

**§1. O modelo e a inferência.** Glossário contextual de *modelo*, *inference*, *token*, *context window* (orçamento de entrada+saída), *model id*. Problema → por que token importa (custo, limite, `max_tokens`). ⚠️ Não confunda: modelo ≠ produto que o envolve (Claude Code); o nome para o software em volta é *agentic harness* (primeiro uso do termo, definido aqui).

**§2. A API é stateless — e tudo decorre disso.** Abre com o experimento mental: duas chamadas, "meu nome é Ana" e depois "qual é meu nome?" — a segunda não sabe. Define *stateless* (contextual). Consequência: o histórico é da aplicação e é **reenviado inteiro a cada chamada**; `messages` é a conversa completa, não a última mensagem. Bloco "O que acontece se eu não reenviar o histórico?". Leitura guiada campo a campo (o que representa / por que precisa / quem usa / o que acontece se estiver errado) dos **Exemplos progressivos 1 e 2**: requisição mínima (`model`, `max_tokens`, `messages`) e requisição com histórico (roles alternando). Comparação explícita **`system` vs. `messages`** (tabela + explicação da tabela). Primeiro contato com `stop_reason` (`end_turn`, `max_tokens`) e o "guarde este ponto: o terceiro valor importante aparece na §3".

**§3. Ferramentas: a fronteira entre decidir e executar.** É a seção que responde, na ordem, as dez perguntas da spec (o que acontecia antes / quem chamou quem / por que o modelo não executa / o que a API devolveu / quem executa / como o resultado volta / o que acontece na próxima chamada / onde `stop_reason` entra / o que acontece se ignorar `tool_use` / como isso forma um loop). Estrutura: problema (Claude gera texto; a aplicação precisa de banco/API/arquivo; fronteira entre decisão e execução) → diagrama textual do ciclo completo → analogia do restaurante **com mapeamento explícito** (restaurante→aplicação, garçom→Claude, cozinha→ferramenta, pedido→`tool_use`, prato→`tool_result`) **e limite declarado** (o garçom real vai até a cozinha; Claude não vai a lugar nenhum — ele devolve um pedido estruturado e fica parado esperando a próxima chamada; e diferente do restaurante, a cada rodada o garçom relê a conversa inteira do zero). Nasce o **sistema de suporte** (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`). **Exemplos progressivos 3→7 com leitura guiada**: (3) request com `tools` e a anatomia da tool definition (`name`, `description`, `input_schema` — JSON Schema contextual); (4) response com `stop_reason: "tool_use"` e o bloco `tool_use` campo a campo (`id`, `name`, `input`); (5) a aplicação executa (código dela, não da API — o ponto central); (6) request seguinte com `tool_result` + `tool_use_id` (e o bloco "o que acontece se o `tool_use_id` estiver errado", com `is_error` na sequência); (7) response final `end_turn`. Blocos: "O que acontece se a aplicação ignorar `tool_use`?"; ⚠️ Não confunda *solicitar* ≠ *executar*; ⚠️ Não confunda `tool_use` (quem escreve: o modelo) ≠ `tool_result` (quem escreve: a aplicação). Menção mínima a `tool_choice` com "guarde este ponto: Domínio 4". Checkpoint "preveja o comportamento": dado um response, qual a próxima ação da aplicação.

**§4. Do ciclo ao agent loop.** O `while (stop_reason === "tool_use")` em pseudocódigo, lido linha a linha. É esse loop que Claude Code e Agent SDK empacotam — reapresenta *harness*. Ponte explícita para o Domínio 1: *gather context → take action → verify results* é este mesmo ciclo com um critério de sucesso no meio. Comparação explícita **Messages API crua vs. Agent SDK vs. Claude Code** (quem escreve o loop, quem fornece as tools). Fechamento do módulo: "O que você precisa realmente entender" (3–7 pontos) + "Se você lembrar apenas de 3 coisas" + bloco "Como isso pode aparecer na prova" com cadeia de raciocínio numerada.

- [ ] **Step 4: Verificar**

Run: `grep -c '^## ' dominios/00-fundamentos/notas.md && grep -c '^### Checkpoint' dominios/00-fundamentos/notas.md && grep -c 'tool_use_id' dominios/00-fundamentos/notas.md`
Expected: 4 seções (mais fechamento), ≥3 checkpoints, `tool_use_id` presente.

- [ ] **Step 5: Commit**

```bash
git add dominios/00-fundamentos
git commit -m "feat(d0): modulo 0 de fundamentos - o ciclo tool_use ensinado do zero"
```

---

### Task 2: Integração do Módulo 0 (glossário, site, trilha)

**Files:**
- Modify: `referencias/glossario.md`
- Modify: `tools/build-site.mjs`
- Modify: `tools/site.css`
- Modify: `README.md`
- Modify: `cronograma.md`

- [ ] **Step 1: Glossário — termos de fundamentos (Domínio 0)**

Adicionar linhas com Domínio `0`, mantendo a ordenação (domínio, depois alfabética): `agentic harness`, `inference`, `messages` (o array), `stateless`, `stop_reason`, `system prompt`, `token`, `tool_result`, `SDK`. Ajustar a linha de `tool_use` (hoje marcada Domínio 3) apenas se o texto contradisser o Módulo 0 — a definição em detalhe continua sendo do D3. Nota no preâmbulo: o Domínio `0` é o módulo de fundamentos, fora do syllabus.

- [ ] **Step 2: `tools/build-site.mjs` — rótulo do módulo 0 e blocos novos**

(a) Em `buildNav`, quando `weights.get(n)` não existir e `n === 0`, usar rótulo `0. Fundamentos` (sem barra de peso). (b) Em `quoteClass`, adicionar classes: `/^⚠️|^N[ãa]o confunda/` → `q-warn`; `/^Guarde este ponto/i` → `q-note`. (c) Em `NOTAS_HEADINGS`, adicionar `['o problema', 'k-prob']`, `['modelo mental', 'k-mm']`, `['checkpoint', 'k-check']`.

- [ ] **Step 3: `tools/site.css` — estilos mínimos dos blocos novos**

`blockquote.q-warn` no padrão do `q-trap` (borda `--warn`, fundo `color-mix`); `blockquote.q-note` leve como `q-ref` mas em `--muted`; `h3.k-prob`, `h3.k-mm`, `h3.k-check` no padrão do `k-def` (versalete, `--muted`; `k-check` em `--accent`); `details`/`summary` dentro de `.doc`: `summary` com cursor pointer e cor `--accent`, corpo com recuo — o suficiente para o checkpoint ser utilizável, nada além.

- [ ] **Step 4: `README.md` — trilha de estudo**

Nova seção `## Trilha de estudo` logo após o parágrafo de abertura: `Módulo 0 (fundamentos, pré-requisito) → Domínio 1 → … → Domínio 5 → Projeto integrador → Simulados`, com uma linha explicando que o Módulo 0 fica fora da tabela de pesos por não ser domínio de prova, e que ninguém deve abrir o Domínio 1 sem ele. Link para `dominios/00-fundamentos/notas.md`.

- [ ] **Step 5: `cronograma.md` — o módulo 0 no tempo**

Seção curta `## Antes da semana 1 — Módulo 0: Fundamentos` (sem renumerar as 12 semanas): estudar antes do Domínio 1; quem já domina o ciclo `tool_use` faz só os checkpoints como autoteste e segue.

- [ ] **Step 6: Verificar**

Run: `npm run build && node -e "const h=require('fs').readFileSync('site/index.html','utf8'); if(!h.includes('0. Fundamentos')) throw new Error('modulo 0 fora do indice')"`
Expected: build sem erro; grupo `0. Fundamentos` no índice; página `site/dominios/00-fundamentos/notas.html` existente.

- [ ] **Step 7: Commit**

```bash
git add referencias/glossario.md tools/ README.md cronograma.md
git commit -m "feat: integra modulo 0 na trilha, no glossario e no site"
```

---

### Task 3: Domínio 1 — reescrita didática, abertura + §§1–4

**Files:**
- Modify: `dominios/01-agentic-architecture/notas.md`

Regras que valem para as Tasks 3 e 4:

- **Preservação integral:** toda citação oficial, tabela, número (~15×, ~4×, +90,2%, até 90%, 20 concorrentes, 3 camadas, 1–2k tokens), edge case e nota de terminologia do texto atual reaparece. O diff pode reordenar dentro da seção; não pode apagar fato.
- **Âncoras estáveis:** títulos `## N.` idênticos aos atuais; `### Definição`, `### Quando usar`, `### Cenário de prova` mantêm nome e papel.
- **Conexões explícitas:** cada seção abre situando ("na §anterior vimos X; agora…") e usa `> Guarde este ponto:` para o que só fecha em seção/domínio futuro.
- **Cenário de prova** ganha cadeia de raciocínio numerada no fim (`1. o cenário diz… 2. o critério é… 3. logo…`).

- [ ] **Step 1: Reescrever o preâmbulo do domínio + nova seção `## 0. A visão geral`**

Preâmbulo ganha o cabeçalho de trilha (onde estou / o que devo saber — apontando o Módulo 0 / o que vou aprender / por que importa — 27% da prova). A `## 0. A visão geral` mostra **uma execução completa** do pipeline de pesquisa multiagente (o mesmo de §4/Q4/lab): usuário pede um relatório → orquestrador decompõe (§7) → fan-out de workers com briefings explícitos (§4, §5) → subagents em contexto isolado (§3) → hooks disparando nos pontos fixos (§6) → síntese → verificação (§1) → um caso que escala para humano (§8) — com um diagrama textual único em que cada estágio carrega o número da seção que o explica. Fecha com o padrão anunciado: `VISÃO GERAL → PEÇAS → DETALHAMENTO → RECONSTRUÇÃO (§9)`.

- [ ] **Step 2: Reescrever §1 (Anatomia do loop agêntico)**

Problema: encadear prompts sem conferir acumula erro invisível (o passo 4 constrói sobre um passo 2 errado). Modelo mental: diagrama textual do ciclo com o retorno de *ground truth*. Conexão com Módulo 0 §4 ("o loop que você já conhece, agora com verificação"). Comparação explícita workflow vs. agente (a citação oficial atual) — explicada antes da tabela. "O que acontece se não houver sinal objetivo de sucesso?" Checkpoint. Cenário de prova atual + cadeia.

- [ ] **Step 3: Reescrever §2 (Sessões e continuidade)**

Problema: a janela é finita e a conversa não é (nasce daqui a compaction — glossário contextual de *compaction* e *JSONL*). Modelo mental: a sessão como arquivo que o harness reabre. Mecânica atual preservada (tabela nova-vs-resume-vs-fork explicada linha a linha, o que persiste/não persiste). "O que acontece se a regra crítica viver só no histórico?" (ponte para §6 e D5). ⚠️ Não confunda `--continue`/`--resume` (mesmo id) × fork (id novo). Checkpoint. Cenário atual + cadeia.

- [ ] **Step 4: Reescrever §3 (Subagentes)**

Problema primeiro: a auditoria de 200 logs entope a janela do pai — precisamos gastar contexto *em outro lugar*. Modelo mental: diagrama pai/filho com o funil (dezenas de milhares de tokens dentro, 1–2k de volta). A tabela "o que o subagent enxerga" agora vem **depois** de uma passagem que explica linha a linha por que cada item está de cada lado (o que viaja no prompt de invocação vs. o que o subagent carrega por conta própria); a tabela vira o resumo de recitação, não a explicação. Custo (round-trip, contexto de volta) preservado. "O que acontece se eu delegar uma tarefa de três linhas?" Checkpoint "preveja": prompt de delegação com "continue a análise que começamos" — o que o subagent faz? Cenário atual + cadeia.

- [ ] **Step 5: Reescrever §4 (Delegação e execução paralela)**

Problema: ganhar tempo de parede sem corromper resultado. Modelo mental: diagrama fan-out/síntese do orchestrator-worker. O critério (dependência de estado, não tamanho) com exemplo ✅/❌ lado a lado (pesquisa vs. refatoração). "Por que estado compartilhado impede paralelismo" ganha o passo a passo do não-determinismo (duas escritas, duas ordens possíveis, dois relatórios diferentes, zero erro — glossário contextual de *race condition*). Números preservados com a leitura correta (qualidade e tempo comprados com tokens). Limites operacionais preservados. Checkpoint "encontre o erro": um plano que paraleliza gerar-e-revisar. Cenário atual + cadeia.

- [ ] **Step 6: Verificar**

Run: `grep -c '^## ' dominios/01-agentic-architecture/notas.md && grep -c '^### Checkpoint' dominios/01-agentic-architecture/notas.md && grep -c 'Cenário de prova' dominios/01-agentic-architecture/notas.md`
Expected: 10 seções `##` (0–8 + mapa/9 parcial na Task 4 — neste ponto ≥6), checkpoints ≥4, cenários intactos.

- [ ] **Step 7: Commit**

```bash
git add dominios/01-agentic-architecture/notas.md
git commit -m "feat(d1): reescrita didatica - visao geral e secoes 1-4"
```

---

### Task 4: Domínio 1 — reescrita didática, §§5–8 + reconstrução

**Files:**
- Modify: `dominios/01-agentic-architecture/notas.md`

- [ ] **Step 1: Reescrever §5 (Passagem explícita de contexto)**

Reconexão explícita com §3 (a tabela do que não atravessa) e com o Módulo 0 §2 (stateless: nada viaja que não esteja na mensagem — é a mesma lei, um nível acima). Exemplo ✅/❌ de prompt de delegação (um com "como discutimos", um autossuficiente com os cinco itens da lista canônica), lidos item a item. A falha de fronteira documentada preservada. "O que acontece se dois workers receberem o mesmo recorte?" (concordância não é evidência). Checkpoint. Cenário atual + cadeia.

- [ ] **Step 2: Reescrever §6 (Hooks)**

Problema: instrução é probabilística e a compaction a apaga — para consequência inaceitável isso não basta. Modelo mental: pontos fixos do ciclo de vida onde código roda *sempre* (diagrama textual do ciclo com os eventos pendurados). **Leitura guiada do JSON de configuração campo a campo** (`PreToolUse`, `matcher`, `type`, `command` — o que representa / por que precisa / o que acontece se errado). Tabela de eventos explicada antes de tabelada; exit codes e o enum `allow/deny/ask/defer` preservados com as duas pegadinhas. "O que acontece se eu usar `PostToolUse` para um gate de segurança?" ⚠️ Não confunda bloquear (exit 2 / `deny`) × observar (exit ≠ 0/2). Checkpoint "encontre o erro": hook de compliance em `PostToolUse`. Cenário atual + cadeia.

- [ ] **Step 3: Reescrever §7 (Decomposição de tarefas)**

Reconexão: §3 deu o *mecanismo* (subagent), §4 o *paralelismo*; esta seção decide *onde cortar*. Os três critérios explicados cada um com um mini-exemplo ✅/❌. O terceiro (verificabilidade) ganha o passo a passo do erro sem alarme (subtarefa não verificável → resultado vira premissa → o erro entra no sistema). "O que acontece se eu decompor sem critério de verificação?" Checkpoint "arquitetura": mini-cenário pedindo qual critério quebra. Cenário atual + cadeia.

- [ ] **Step 4: Reescrever §8 (Escalonamento para humano)**

Problema: existe decisão que não é do agente — o objetivo é devolvê-la *bem*. Os quatro gatilhos explicados antes da tabela. As duas perguntas (reversível? hipótese nova?) com exemplo ✅/❌ (503 com backoff vs. reembolso com conflito). Pacote de handoff item a item, conectado ao scratchpad (D5, "guarde este ponto"). Calibração de confiança preservada. ⚠️ Não confunda escalar × desistir; falha repetida do agente × falha transitória do ambiente. Checkpoint. Cenário atual + cadeia.

- [ ] **Step 5: Escrever `## 9. Reconstrução — o sistema inteiro de novo` + fechamento**

Volta ao diagrama da §0, agora com o leitor sabendo cada peça: reconta a mesma execução citando o critério de cada decisão (por que fan-out aqui e não ali, por que hook e não prompt, por que escalou). Em seguida `## O que você precisa realmente entender` (5–7 modelos mentais, não resumo do texto) e `## Se você lembrar apenas de 3 coisas`. O `## Mapa rápido de decisão` atual é preservado como última seção (agora com uma linha explicando como usá-lo na véspera da prova).

- [ ] **Step 6: Verificar**

Run: `grep -c '^### Checkpoint' dominios/01-agentic-architecture/notas.md && grep -n '^## ' dominios/01-agentic-architecture/notas.md`
Expected: 8 checkpoints (um por seção 1–8); seções `## 0.`–`## 9.`, fechamento e mapa presentes, na ordem.

- [ ] **Step 7: Commit**

```bash
git add dominios/01-agentic-architecture/notas.md
git commit -m "feat(d1): reescrita didatica - secoes 5-8, reconstrucao e fechamento"
```

---

### Task 5: Método e template — COMO-ESTUDAR, plano mestre, amarrações

**Files:**
- Modify: `COMO-ESTUDAR.md`
- Modify: `docs/superpowers/plans/2026-09-17-ccar-f-prep.md`
- Modify: `dominios/01-agentic-architecture/armadilhas.md`

- [ ] **Step 1: `COMO-ESTUDAR.md` — atualizar a descrição da estrutura e absorver os checkpoints**

Na seção 1: a estrutura fixa agora é "abre no problema e no modelo mental, tem `### Definição` e `### Quando usar`, e fecha em `### Checkpoint` + `### Cenário de prova`" — o ciclo de leitura ativa ganha o passo "responda o Checkpoint por escrito **antes** de abrir o `<details>`". Nota no preâmbulo: o Módulo 0 se estuda pelo método da seção 1, sem checkpoint de questões. Nenhuma outra seção muda.

- [ ] **Step 2: Plano mestre — promover a didática a regra de template**

Em `2026-09-17-ccar-f-prep.md`, acrescentar ao **Template de módulo de domínio** os itens:

8. **Template didático de seção** (o bloco de código da seção "Decisões estruturais" deste plano, copiado na íntegra) — problema antes da definição, modelo mental com diagrama textual, tabelas só depois da explicação, leitura guiada de todo código/JSON, checkpoint por seção com resposta em `<details>`.
9. **Visão geral antes das partes:** todo `notas.md` abre com `## 0.` mostrando uma execução completa em que as seções aparecem juntas, e fecha com reconstrução + "o que você precisa realmente entender" + "se lembrar apenas de 3 coisas".
10. **Glossário contextual:** termo técnico novo é definido no primeiro uso e entra em `referencias/glossario.md` no mesmo commit.
11. **Analogia só com mapeamento e limite declarados.**
12. **Sistemas recorrentes:** novos exemplos preferem estender o sistema de suporte (Módulo 0) e o pipeline de pesquisa (D1) a inventar cenário novo.

Registrar no topo do plano mestre uma nota: "Template didático estabelecido na revisão de 2026-09-22 (ver `2026-09-22-revisao-pedagogica.md`); Domínio 1 é o modelo de referência."

- [ ] **Step 3: `armadilhas.md` do D1 — amarração leve**

Só o preâmbulo: uma frase dizendo que cada entrada é o par "⚠️ Não confunda" das notas em forma de flashcard, e que o Checkpoint da seção correspondente é o aquecimento para o baralho. Entradas intocadas.

- [ ] **Step 4: Verificar**

Run: `grep -c 'Checkpoint' COMO-ESTUDAR.md && grep -c 'Template didático' docs/superpowers/plans/2026-09-17-ccar-f-prep.md`
Expected: ≥1 e ≥1.

- [ ] **Step 5: Commit**

```bash
git add COMO-ESTUDAR.md docs/superpowers/plans/ dominios/01-agentic-architecture/armadilhas.md
git commit -m "feat: metodo e template de modulo absorvem a camada didatica"
```

---

### Task 6: Build final, painel e fechamento

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Build completo e inspeção**

Run: `npm run build`
Expected: sem erro; zero avisos novos de link fora do site; abrir `site/dominios/00-fundamentos/notas.html` e `site/dominios/01-agentic-architecture/notas.html` e conferir: diagramas textuais legíveis no `<pre>`, `<details>` dos checkpoints abrindo/fechando, blockquotes `⚠️`/`Guarde este ponto` estilizados, case-blocks intactos.

- [ ] **Step 2: Conferência de preservação**

Para cada citação oficial e número do `notas.md` antigo (lista: as 9 citações em inglês, os valores ~15×/~4×/+90,2%/até 90%/20/3/1–2k, as tabelas de §2, §3, §4, §6), `grep` no novo confirmando presença. Qualquer ausência é regressão — corrigir antes do commit.

- [ ] **Step 3: `README.md` — painel**

Atualizar "Próximo passo": a Task 3 do plano mestre (Domínio 2) continua sendo a próxima, **agora sob o template didático**; nota curta registrando a revisão pedagógica entregue (módulo 0 + D1 reescrito), no padrão das notas de task anteriores.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: painel atualizado apos a revisao pedagogica"
```
