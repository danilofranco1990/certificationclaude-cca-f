# Domínio 1 — Agentic Architecture & Orchestration (27%)

Maior peso da prova. As questões deste domínio quase nunca perguntam "o que é X"; elas
apresentam uma arquitetura e pedem a **escolha de desenho** — delegar ou não, paralelizar ou
não, hook ou prompt, escalar ou tentar de novo. O que decide a resposta é sempre uma
propriedade específica do cenário, não a preferência geral por um padrão.

Convenção: termos técnicos ficam em inglês. Definições de referência em
[`referencias/glossario.md`](../../referencias/glossario.md).

---

## 1. Anatomia do loop agêntico

### Definição

Um agente é um sistema em que o modelo **dirige o próprio processo e o próprio uso de
ferramentas**. A documentação oficial do Claude Code descreve o ciclo em três fases:

> "When you give Claude a task, it works through three phases: **gather context**, **take
> action**, and **verify results**. These phases blend together."
> — [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

O diagrama que acompanha o texto fecha o ciclo: *gathering context, taking action, verifying
results, and repeating until task complete*. Daí a forma curta usada no repositório:
**gather context → take action → verify work → repeat**.

> **Nota de terminologia.** O glossário deste repositório registra a terceira fase como
> *verify work*; a documentação oficial escreve *verify results*. É a mesma fase — se a prova
> citar uma das duas formas, é do mesmo passo que se trata.

A distinção formal que a Anthropic usa para separar agente de pipeline:

> "**Workflows** are systems where LLMs and tools are orchestrated through predefined code
> paths. **Agents**, on the other hand, are systems where LLMs dynamically direct their own
> processes and tool usage, maintaining control over how they accomplish tasks."
> — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

O software que envolve o modelo e fornece tools, gestão de contexto e ambiente de execução
chama-se **agentic harness** — é o Claude Code, não o modelo.

### Por que a verificação é o passo que define o agente

Uma chamada única produz uma saída e termina; ninguém confere. O que transforma isso em agente
é o retorno de **ground truth do ambiente**:

> "During execution, it's crucial for the agents to gain 'ground truth' from the environment at
> each step (such as tool call results or code execution) to assess its progress."

Sem verificação, o loop vira uma cadeia de prompts encadeados que acumula erro sem detectá-lo:
o passo 4 constrói em cima de um passo 2 errado e nada no sistema percebe. Com verificação, o
erro do passo 2 aparece como teste vermelho, como exceção, como diff que não aplica — e o loop
corrige o rumo. **Um agente sem passo de verificação é um workflow com aparência de agente.**

### Quando usar

Use o loop agêntico quando a tarefa é multi-passo, **não totalmente especificável de antemão**,
e existe um sinal objetivo de sucesso que o agente possa consultar (testes, compilador,
validador de schema, diff). Quando não há esse sinal, o agente não tem como verificar e o
terceiro passo colapsa — nesse caso, prefira uma chamada única ou um workflow com código
determinístico entre as etapas.

A própria Anthropic recomenda não escalar prematuramente:

> "For many applications, however, optimizing single LLM calls with retrieval and in-context
> examples is usually enough."

### Cenário de prova

*Um time monta um pipeline que gera código a partir de uma especificação, roda um linter e
publica. O agente "conclui" tarefas que não compilam.* A resposta não é melhorar o prompt de
geração nem trocar o modelo: é que **o linter não é o critério de sucesso da tarefa**. O passo
de verificação existe, mas verifica a coisa errada. Ligar o build e a suíte de testes ao loop —
e fazer o agente reagir ao resultado — é o que fecha o ciclo.

---

## 2. Sessões e continuidade

### Definição

Uma **session** é uma conversa contínua, com histórico de turnos e estado acumulado. O Claude
Code grava cada mensagem, tool use e resultado num arquivo JSONL sob `~/.claude/projects/`.

A regra de partida:

> "**Sessions are independent.** Each new session starts with a fresh context window, without
> the conversation history from previous sessions."

### Sessão nova vs. resume vs. fork

| Ação | Comando | Efeito no session id | Histórico |
|---|---|---|---|
| Sessão nova | `claude` | id novo | vazio |
| Resume (mais recente no diretório) | `claude --continue` / `claude -c` | **mesmo id** | continua, anexa turnos |
| Resume (escolhendo qual) | `claude --resume` / `claude -r` | **mesmo id** | continua, anexa turnos |
| Fork | `--fork-session` / `/branch` | **id novo** | cópia do histórico |

> "Resuming a session with `claude --continue` or `claude --resume` reopens it under the same
> session ID and appends new messages to the existing conversation. Forking with
> `--fork-session` or `/branch` copies the history into a new session ID, leaving the original
> unchanged."

A diferença entre `--continue` e `--resume` **não é o que acontece com a sessão** — as duas
retomam sob o mesmo id. É como a sessão é escolhida: `--continue` pega automaticamente a mais
recente do diretório atual; `--resume` abre um seletor (ou aceita um nome/id/caminho).

### O que persiste e o que não persiste

Persiste no resume: histórico completo (incluindo tool calls e resultados), modelo, checkpoints
e snapshots de arquivo para `/rewind`.

**Não** persiste: flags de configuração passadas na invocação (`--mcp-config`, `--settings`,
`--add-dir`, `--fallback-model`) — precisam ser passadas de novo — e tasks de background.

Entre sessões diferentes, nada do histórico atravessa. O que atravessa por outro mecanismo é o
`CLAUDE.md` (carregado toda sessão) e a auto memory.

### Quando o histórico deixa de ajudar

Contexto acumulado não é neutro: ele compete por espaço na janela e dilui a atenção. Quando a
janela enche, o Claude Code administra sozinho, e a ordem importa:

> "It clears older tool outputs first, then summarizes the conversation if needed. Your requests
> and key code snippets are preserved; detailed instructions from early in the conversation may
> be lost. Put persistent rules in CLAUDE.md rather than relying on conversation history."

Esse é o ponto de virada: **instruções dadas cedo na conversa são exatamente o que a compaction
perde**. Se uma regra precisa valer até o fim, ela não pode viver no histórico — vai para o
`CLAUDE.md`.

O sinal de que é hora de começar sessão nova em vez de continuar: a tarefa mudou de assunto e o
histórico anterior não é premissa da nova tarefa. Aí o histórico só ocupa espaço e oferece ao
modelo âncoras erradas (arquivos lidos para outro fim, decisões revogadas, abordagens
abandonadas). Continuar é certo quando a tarefa nova **depende** do que foi estabelecido antes.

### Cenário de prova

*Um agente de suporte roda uma sessão longa por cliente. Depois de 40 turnos, ele passa a citar
a política de reembolso errada — a que estava correta no início da conversa.* A causa provável
não é o modelo: é a compaction tendo descartado a instrução inicial. A correção arquitetural é
tirar a política do histórico e colocá-la onde ela recarrega a cada turno (`CLAUDE.md`,
system prompt, ou um resource lido sob demanda), não pedir ao agente "para lembrar melhor".

---

## 3. Subagentes

### Definição

Um **subagent** é uma instância de Claude invocada por um agente orquestrador para executar uma
subtarefa **em contexto próprio**. No Claude Code, subagents são definidos em `.claude/agents/`
(ou `~/.claude/agents/`) como Markdown com frontmatter, e no Agent SDK via a opção `agents`,
com objetos `AgentDefinition`.

A ferramenta que invoca um subagent chama-se **`Agent`**. Atenção ao histórico do nome:

> "In version 2.1.63, the Task tool was renamed to Agent. Existing `Task(...)` references in
> settings and agent definitions still work as aliases."

Material mais antigo — e possivelmente a prova — ainda diz `Task`. É a mesma ferramenta.

### O isolamento de contexto é o benefício principal

Não é "paralelismo" nem "especialização": é que o trabalho sujo do subagent **não entra na
janela do pai**.

> "A subagent starts fresh unless it's a fork... Either way, the subagent's tool calls stay out
> of your context, and Claude gets back a summary when the subagent finishes."

E, quantificado:

> "Each subagent might explore extensively, using tens of thousands of tokens or more, but
> returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens)."
> — [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Essa assimetria — dezenas de milhares de tokens gastos, 1–2k devolvidos — é a razão econômica
do subagent. Quem lê isso como "subagent serve para ir mais rápido" erra a questão de prova.

### O que o subagent enxerga (decorar esta tabela)

Um subagent que **não** é fork:

| Recebe | Não recebe |
|---|---|
| O próprio system prompt (da definição do agente) | **Histórico da conversa do pai** |
| A task message que o pai escreveu ao delegar | Skills já invocadas no pai |
| `CLAUDE.md` da hierarquia (salvo `omitClaudeMd: true`) | **Arquivos que o pai já leu** |
| Snapshot do git status | Output style do pai |
| Skills pré-carregadas via `skills` | Auto memory da conversa principal |
| Roster de agentes irmãos nomeados | O tamanho de janela do pai (usa a do próprio modelo) |

A exceção é o **fork**, que herda o contexto do pai por inteiro. Fork é assunto do Domínio 2;
aqui basta saber que ele é a exceção que confirma a regra.

Consequência prática, e é daqui que saem as questões: **o pai já leu o arquivo, o subagent
não.** "Continue a análise que começamos" é um prompt vazio para um subagent — não existe
"começamos" do lado dele.

### O custo: round-trip e contexto de volta

O subagent não é grátis em duas frentes.

**Latência de partida.** A documentação é explícita: *"A subagent that isn't a fork starts
fresh and may need time to gather context."* Ele precisa redescobrir o que o pai já sabia.

**Contexto na volta.** *"When subagents complete, their results return to your main
conversation. Running many subagents that each return detailed results can consume significant
context."* Vinte subagents devolvendo 2k tokens cada são 40k tokens na janela do pai — a
economia se inverte.

### Quando usar

Delegue a um subagent quando a subtarefa (a) produz **output verboso que o pai não precisa
ver**, (b) é autocontida o bastante para caber num briefing escrito, e (c) pode devolver um
resumo em vez do trabalho bruto. Fique no contexto principal quando a tarefa exige idas e
vindas com o usuário, quando as fases compartilham muito contexto, ou quando a mudança é
pequena e pontual — o round-trip custaria mais que a tarefa.

### Cenário de prova

*Um agente precisa auditar 200 arquivos de log e reportar as três anomalias mais graves.*
Subagent, sem dúvida: os 200 arquivos são exatamente o output verboso que não deve entrar na
janela principal, e "as três anomalias" é um resumo destilável. *O mesmo agente precisa
refatorar uma função depois de discutir a abordagem com o usuário por seis turnos.* Contexto
principal: a discussão **é** o contexto, e um subagent começaria sem ela.

---

## 4. Delegação e execução paralela

### Definição

**Fan-out** é disparar vários subagents ao mesmo tempo, cada um com um recorte independente do
problema, e sintetizar os resultados depois. É o padrão orchestrator-worker:

> "When a user submits a query, the lead agent analyzes it, develops a strategy, and spawns
> subagents to explore different aspects simultaneously."
> — [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

### O teste é dependência de estado, não tamanho

Duas subtarefas podem rodar em paralelo se, e somente se, **nenhuma precisa do resultado da
outra e nenhuma escreve num estado que a outra lê**. Tamanho não entra na conta: três tarefas
grandes e independentes paralelizam; duas tarefas minúsculas encadeadas, não.

A formulação oficial do limite:

> "some domains that require all agents to share the same context or involve many dependencies
> between agents are not a good fit for multi-agent systems today"

E a observação que costuma virar distrator: *"most coding tasks involve fewer truly
parallelizable tasks than research."* Pesquisa paraleliza bem porque as fontes são
independentes; refatoração não, porque cada mudança altera o estado que a próxima lê.

### Por que estado compartilhado impede paralelismo

Se dois workers escrevem no mesmo arquivo, no mesmo registro ou no mesmo scratchpad, o
resultado passa a depender da ordem de escrita — que é justamente o que o paralelismo não
garante. O sintoma não é um erro: é **não-determinismo**. A mesma entrada produz saídas
diferentes conforme quem terminou primeiro. Por isso o padrão seguro é workers **read-only**
sobre o estado compartilhado, com toda escrita concentrada no passo de síntese do orquestrador.

### Os números

| Métrica | Valor documentado |
|---|---|
| Ganho de qualidade (Opus 4 lead + Sonnet 4 subagents vs. Opus 4 sozinho) | **+90,2%** na eval interna de pesquisa |
| Tokens de um sistema multiagente vs. chat | **~15×** |
| Tokens de um agente (single) vs. chat | **~4×** |
| Redução de tempo em queries complexas | **até 90%** |

A leitura correta: multiagente compra **qualidade e tempo de parede** pagando **tokens**. Se a
tarefa não justifica 15× o custo, o desenho está errado mesmo que funcione.

### Limites operacionais do Claude Code

- **20 subagents concorrentes** por sessão, por padrão. Além disso, a chamada falha com
  `Concurrent subagent limit reached`. Ajustável via `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`.
- **Profundidade de aninhamento de 3 camadas** abaixo da conversa principal, por padrão.
  Ajustável via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`.

### Cenário de prova

*Um pipeline de pesquisa precisa (1) levantar fontes sobre um tema, (2) resumir cada fonte,
(3) escrever um relatório e (4) revisar o relatório contra as fontes.* Só o passo 2 paraleliza —
um subagent por fonte, sem estado compartilhado. O passo 1 precede tudo; o 3 depende de todos os
resumos; o 4 depende do 3. A resposta errada clássica é "paralelize 3 e 4 para ganhar tempo":
revisar um relatório que ainda não existe é dependência de estado pura.

---

## 5. Passagem explícita de contexto

### O antipadrão

Assumir que o subagent sabe algo que só o pai sabe. Como a tabela da seção 3 mostra, o subagent
não recebe histórico, não recebe os arquivos já lidos e não recebe as skills já invocadas. Todo
prompt de delegação que contenha "como discutimos", "continue de onde paramos", "o arquivo que
acabamos de ver" ou "aplique o mesmo critério" está referenciando um contexto que **não existe**
do outro lado. O subagent não erra com erro: ele preenche a lacuna com uma suposição plausível e
segue em frente com confiança.

A própria SDK documenta o campo `omitClaudeMd` como sendo "for agents that take everything they
need from the delegation prompt" — a expectativa de projeto é que o prompt seja autossuficiente.

### O que precisa estar no prompt do subagent

A lista canônica da Anthropic:

> "Each subagent needs an **objective**, an **output format**, **guidance on the tools and
> sources to use**, and **clear task boundaries**."

Traduzindo para o que falta com mais frequência:

1. **Objetivo** — o que produzir, não a área do assunto.
2. **Formato de saída** — para que a síntese consiga mesclar sem reprocessar.
3. **Tools e fontes** — onde buscar, e onde não buscar.
4. **Fronteiras da tarefa** — e, no fan-out, **o que os outros workers estão cobrindo**.
5. **Os fatos que o pai já tem** — caminhos de arquivo, ids, decisões já tomadas, valores
   literais. Recolher de novo o que o pai já sabe é o round-trip desperdiçado da seção 3.

### A falha concreta de fronteira

O que acontece quando as fronteiras ficam vagas, documentado:

> "one subagent explored the 2021 automotive chip crisis while 2 others duplicated work
> investigating current 2025 supply chains, without an effective division of labor."

Dois terços do custo do fan-out jogados fora — e o orquestrador ainda recebe três respostas que
parecem concordar, quando na verdade duas são a mesma resposta. **Concordância entre workers
que receberam o mesmo recorte não é evidência de nada.**

### Cenário de prova

*Um orquestrador dispara cinco subagents para pesquisar um mercado e recebe cinco respostas
quase idênticas, todas sobre o mesmo subtema.* A causa não é falta de capacidade dos workers
nem temperatura do modelo: é ausência de fronteiras explícitas no prompt de delegação. A
correção é dar a cada worker o próprio recorte **e a lista dos recortes alheios**, não aumentar
o número de workers nem pedir "seja mais criativo".

---

## 6. Hooks

### Definição

Um **hook** é um handler configurado em `settings.json` que o Claude Code executa
**automaticamente** num ponto fixo do ciclo de vida da sessão. A diferença que a prova cobra:

- **Instrução em prompt é probabilística.** "Sempre rode os testes antes de commitar" é uma
  solicitação ao modelo. Ele quase sempre atende. *Quase* é o problema.
- **Hook é determinístico.** Roda sempre, independentemente do que o modelo decidiu, inclusive
  quando o modelo "esqueceu", quando o contexto foi compactado e quando o modelo tentou
  explicitamente pular o passo.

Regra de decisão: se a consequência de o passo **não** acontecer é inaceitável — política de
segurança, gate de compliance, formatação obrigatória, registro de auditoria — é hook. Se é
preferência de estilo, é prompt (ou `CLAUDE.md`).

### Eventos

O conjunto de eventos é grande (mais de 30 na versão atual). Os que aparecem em prova:

| Evento | Dispara |
|---|---|
| `SessionStart` | Quando uma sessão começa ou é retomada |
| `SessionEnd` | Quando uma sessão termina |
| `UserPromptSubmit` | Ao submeter um prompt, **antes** de Claude processá-lo |
| `PreToolUse` | **Antes** de uma tool call executar |
| `PostToolUse` | **Depois** de uma tool call ter sucesso |
| `PostToolUseFailure` | Depois de uma tool call falhar |
| `Stop` | Quando Claude termina de responder |
| `SubagentStart` / `SubagentStop` | Quando um subagent é criado / termina |
| `PreCompact` / `PostCompact` | Antes / depois da compaction de contexto |
| `Notification` | Quando o Claude Code emite uma notificação |

`PreToolUse` e `PostToolUse` são o par mais cobrado, e a distinção é literal: **`PreToolUse`
roda antes e pode impedir a execução; `PostToolUse` roda depois, quando a ação já aconteceu.**
Um hook que precisa *barrar* uma escrita em produção tem de ser `PreToolUse` — em `PostToolUse`
o arquivo já foi escrito.

`SubagentStop` é a resposta certa quando o cenário pede uma ação a cada término de subagent
(logar, validar, contabilizar) sem depender de o orquestrador lembrar de fazê-lo.

### Estrutura e bloqueio

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "./scripts/check-protected-paths.sh" }
        ]
      }
    ]
  }
}
```

O `matcher` filtra por nome de ferramenta (aceita `"*"`, lista com `|` e regex). O `type` do
handler pode ser `command`, `http`, `mcp_tool`, `prompt` ou `agent`.

Como o hook decide o destino da ação:

- **Exit 0** — sem objeção; segue o fluxo normal de permissão. Para `UserPromptSubmit`,
  `UserPromptExpansion`, `SessionStart` e `PostModelSwitch`, o stdout entra no contexto como
  informação que Claude vê.
- **Exit 2** — **bloqueia** a ação. É o código de bloqueio, e ele vence: *"Even a JSON
  `permissionDecision` of `allow` cannot override exit 2."* Nem todo evento é bloqueável.
- **Outros códigos** — não bloqueiam por si; o stderr vai para o debug log.

Em `PreToolUse` o hook também pode devolver JSON em stdout com
`hookSpecificOutput.permissionDecision` (`allow` / `deny` / `request`) para decidir sem depender
do exit code.

### Onde configurar

`~/.claude/settings.json` (todos os projetos, local) · `.claude/settings.json` (projeto,
versionável) · `.claude/settings.local.json` (projeto, gitignored) · managed policy settings
(organização) · `hooks/hooks.json` de plugin · frontmatter de skill · frontmatter de subagent.

Para uma regra que **toda a equipe** deve obedecer, a resposta é `.claude/settings.json`
commitado — não o settings do usuário, que não sai da máquina de quem o escreveu.

### Cenário de prova

*Uma equipe adiciona ao `CLAUDE.md`: "nunca edite arquivos em `infra/prod/`". Duas semanas
depois, um agente edita um arquivo lá.* Era previsível: `CLAUDE.md` é instrução, e instrução é
probabilística — ainda por cima sujeita a se perder na compaction. A resposta é um hook
`PreToolUse` com matcher `Edit|Write` que sai com código 2 quando o caminho casa com
`infra/prod/`. "Reforçar a redação da regra" e "repetir a regra no prompt" são os distratores.

---

## 7. Decomposição de tarefas

### Os três critérios para quebrar

**1. Independência.** A subtarefa pode ser executada sem o resultado das outras? Se sim, ela é
candidata a fan-out. Se não, ela é um estágio de pipeline sequencial — ainda pode valer a pena
separar, mas não paraleliza.

**2. Tamanho de contexto.** A subtarefa consome muito contexto e devolve pouco? Esse é o perfil
ideal para subagent (ler 200 arquivos, devolver 3 achados). O perfil inverso — pouco contexto
consumido, muita saída — não compensa o round-trip.

**3. Verificabilidade.** Existe um critério objetivo para dizer que esta subtarefa terminou
certo? Se não existe, a decomposição só **espalha** a incerteza: o orquestrador recebe um
resultado que não consegue avaliar e o incorpora como premissa. Subtarefa não verificável é
onde o erro entra no sistema sem alarme.

O terceiro critério é o mais esquecido e o mais cobrado. Decompor uma tarefa em pedaços que
ninguém sabe conferir aumenta o número de pontos de falha sem aumentar a confiança no todo.

### Quando não decompor

Quando as fases compartilham muito contexto (o custo de repassar o contexto supera o ganho),
quando a tarefa é pequena, e quando o resultado de cada pedaço não é verificável de forma
independente. Decomposição tem custo fixo: escrever briefing autossuficiente, pagar round-trip,
sintetizar. Abaixo de certo tamanho, o custo fixo domina.

### Cenário de prova

*Um arquiteto quer decompor "migrar o serviço de autenticação para OAuth2" em seis subagents
paralelos.* A questão é qual critério quebra o plano. Independência: as seis partes tocam o
mesmo código e o mesmo schema — estado compartilhado, logo não paralelizam. Verificabilidade:
"migrou certo" só é conferível com o sistema inteiro de pé, não parte por parte. A decomposição
defensável aqui é **sequencial e por fase** (levantar chamadas existentes → desenhar o novo
fluxo → migrar → verificar), com o levantamento inicial — que é leitura ampla e resumo curto —
sendo o único pedaço que cabe em fan-out.

---

## 8. Escalonamento para humano

### Os quatro gatilhos

| Gatilho | O que é | Por que o agente não resolve sozinho |
|---|---|---|
| **Baixa confiança** | O agente não tem base para decidir | Continuar significa chutar e apresentar o chute como resultado |
| **Ação irreversível** | Apagar dados, emitir pagamento, publicar, enviar e-mail ao cliente | Se estiver errado, não há rollback — o custo do erro é assimétrico |
| **Conflito de requisitos** | Duas instruções válidas se contradizem | Escolher uma é **decidir pelo usuário**, não executar por ele |
| **Falha repetida** | A mesma abordagem falhou de novo | O agente está sem hipótese nova; repetir só gasta tokens |

### O critério que separa escalar de tentar de novo

Não é o número de tentativas. São duas perguntas:

1. **A ação é reversível?** Se não é, escale **antes** da primeira tentativa. Três tentativas de
   apagar a base de produção não são melhores que uma.
2. **A nova tentativa tem hipótese nova?** Se a falha revelou informação (uma mensagem de erro
   específica, um campo faltando, uma permissão negada), o retry tem conteúdo e vale. Se a
   tentativa seguinte é idêntica à anterior, não é retry — é repetição.

Um corolário útil: **conflito de requisitos nunca é resolvido por retry.** Não é falha de
execução, é ambiguidade de especificação, e nenhuma quantidade de tentativas a desfaz.

### Calibração de confiança

A confiança declarada pelo modelo não é acurácia — ver o Domínio 5. Consequência para este
domínio: um gate de escalonamento que confia só no auto-relato do agente ("estou 90% confiante")
é um gate fraco. Gatilhos robustos são objetivos: a ação está numa lista de operações
irreversíveis; o validador falhou N vezes; duas fontes discordam; um campo obrigatório ficou
nulo.

### Como escalar preservando o estado

Escalar mal é destruir o trabalho: o humano recebe "não consegui" e recomeça do zero. Escalar
bem entrega um **pacote de handoff**:

1. **O objetivo original**, como foi recebido.
2. **O que já foi feito e verificado**, com os resultados concretos.
3. **Onde travou**, literalmente — a mensagem de erro, o conflito, os dois requisitos em
   choque.
4. **As opções**, com o tradeoff de cada uma — o humano decide, não investiga.
5. **O estado durável**, num scratchpad externo, para que a retomada não dependa da sessão.

O ponto arquitetural: o estado tem de sobreviver ao fim da sessão. Se ele só existe na janela de
contexto, a escalada perde tudo assim que a sessão fecha — é para isso que serve o scratchpad
externo (Domínio 5).

### Cenário de prova

*Um agente de atendimento processa reembolsos. A política diz "reembolso automático até R$ 200".
Um cliente pede R$ 180, mas o pedido está fora da janela de 30 dias, e uma nota no cadastro diz
"cliente VIP — tratar com flexibilidade".* Dois requisitos válidos em choque: a regra da janela e
a instrução de flexibilidade. Nenhum retry resolve, e a emissão do reembolso é irreversível.
Escalar é a resposta — apresentando as duas leituras e o valor, não perguntando "o que eu faço?".
Os distratores fortes são "aplicar a regra mais restritiva" e "aplicar a regra mais específica
(VIP)": os dois **decidem pelo humano** uma questão de política que o agente não tem autoridade
para fechar.

---

## Mapa rápido de decisão

| Pergunta do cenário | O que decide |
|---|---|
| Subagent ou contexto principal? | O output é verboso e descartável? A tarefa cabe num briefing escrito? |
| Paralelo ou sequencial? | Existe dependência de estado entre os ramos? (tamanho não conta) |
| Hook ou prompt? | A consequência de o passo não acontecer é inaceitável? |
| Sessão nova ou resume? | A tarefa nova depende do que foi estabelecido antes? |
| Escalar ou tentar de novo? | A ação é reversível? A tentativa tem hipótese nova? |
| Decompor ou não? | Cada pedaço é independente, econômico em contexto **e** verificável? |
