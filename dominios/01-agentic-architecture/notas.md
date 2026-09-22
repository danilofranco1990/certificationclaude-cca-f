# Domínio 1 — Agentic Architecture & Orchestration (27%)

> **Onde você está:** Domínio 1 de 5 — o de maior peso na prova (27%).
> **O que você precisa saber antes:** o [Módulo 0](../00-fundamentos/notas.md) inteiro — o
> agent loop, a fronteira decisão/execução (`tool_use`/`tool_result`) e a API stateless. Este
> domínio constrói diretamente sobre essas três ideias e as cita pelo nome.
> **O que você vai aprender:** a camada de arquitetura sobre o loop — verificação, sessões,
> subagentes, paralelismo, passagem de contexto, hooks, decomposição e escalonamento humano.
> **Por que importa:** as questões deste domínio quase nunca perguntam "o que é X"; elas
> apresentam uma arquitetura e pedem a **escolha de desenho** — delegar ou não, paralelizar ou
> não, hook ou prompt, escalar ou tentar de novo. O que decide a resposta é sempre uma
> propriedade específica do cenário, não a preferência geral por um padrão.

Convenção: termos técnicos ficam em inglês. Definições de referência em
[`referencias/glossario.md`](../../referencias/glossario.md). Método de estudo em
[`COMO-ESTUDAR.md`](../../COMO-ESTUDAR.md) §1 — uma seção `## N` por sessão, produzindo antes de
conferir.

---

## 0. A visão geral — uma execução completa

Antes de estudar as oito peças deste domínio separadamente, veja as oito trabalhando juntas.
O sistema abaixo — um **pipeline de pesquisa multiagente** — é o fio condutor do domínio: ele
reaparece no cenário de prova da §4, na Question 4 do banco e no lab, sempre o mesmo.

O pedido do usuário: *"produza um relatório sobre os tradeoffs de agentic RAG, com as
afirmações checadas contra as fontes."* Uma execução bem desenhada:

```text
Usuário: "relatório sobre agentic RAG, checado contra as fontes"
   │
   ▼
ORQUESTRADOR (a conversa principal — uma sessão)                 §2 sessões
   │
   ├─ decompõe a tarefa em estágios:                             §7 decomposição
   │    1. levantar fontes   2. resumir cada fonte
   │    3. escrever o relatório   4. checar contra as fontes
   │
   ├─ o estágio 2 não tem dependência entre as fontes:
   │  FAN-OUT — um subagent por fonte, em paralelo               §4 paralelismo
   │    │
   │    ├── SUBAGENT A ┐  cada um em contexto isolado,           §3 subagentes
   │    ├── SUBAGENT B │  com um briefing autossuficiente
   │    └── SUBAGENT C ┘  escrito pelo orquestrador              §5 contexto explícito
   │         cada término dispara um hook SubagentStop,
   │         que registra custo e duração num ledger             §6 hooks
   │
   ├─ SÍNTESE: o orquestrador escreve o relatório
   │  a partir dos resumos (estágio 3 — sequencial)
   │
   ├─ VERIFICAÇÃO: o estágio 4 confere cada afirmação
   │  contra as fontes — o "verify results" do loop              §1 o loop
   │
   └─ duas fontes se contradizem numa afirmação central:
      o agente ESCALA a decisão, com o dossiê pronto             §8 escalonamento
```

O que este desenho tem de deliberado — cada item vira uma seção:

- **Só o estágio 2 virou fan-out.** Os outros três são sequenciais por **dependência de
  dados**, não por preguiça: 3 precisa de todos os resumos, 4 precisa do relatório (§4).
- **Cada subagent recebeu um briefing completo**, porque nada do que o orquestrador sabe
  atravessa até ele por outro caminho — é o stateless do Módulo 0, um nível acima (§3, §5).
- **O registro de custo mora num hook, não numa frase de prompt**: precisa acontecer sempre,
  inclusive quando um subagent falha no meio (§6).
- **A checagem do estágio 4 é o que faz disso um agente**, e não uma corrente de prompts (§1).
- **O conflito entre fontes não foi "resolvido" pelo agente**: virou escalonamento com o
  estado preservado, porque a decisão não era dele (§8).

O padrão de estudo deste arquivo:

```text
VISÃO GERAL (§0)  →  PEÇAS (§§1–8)  →  RECONSTRUÇÃO (§9)
```

Cada peça abre no problema que a origina, monta o modelo mental e só então formaliza. A §9
volta a este mesmo diagrama com todos os critérios de decisão preenchidos — se ao chegar lá
você conseguir recontar a execução justificando cada escolha, o domínio está de pé.

---

## 1. Anatomia do loop agêntico

No Módulo 0 §4, o agent loop terminou como esqueleto: *chamar o modelo → executar as tools →
devolver resultados → repetir até `end_turn`*. Este capítulo pergunta o que falta a esse
esqueleto para merecer o nome de **agente** — e a resposta, que decide várias questões de
prova, é: **um passo de verificação com critério objetivo.**

### O problema

Tire a verificação e veja o que sobra. Uma tarefa de quatro passos: gerar o código, escrever os
testes, integrar, publicar. O passo 2 sai errado — os testes não testam o que importa. Nada
acusa. O passo 3 constrói sobre o 2; o passo 4 publica o conjunto. O erro não desapareceu:
**compôs**. Uma cadeia de gerações sem conferência acumula erro em silêncio, porque cada elo
trata a saída do anterior como premissa boa — e o modelo, que é probabilístico (Módulo 0 §1),
fornece matéria-prima para o erro com fluência total.

O que falta é um retorno do mundo real a cada volta do loop: um sinal de acerto que **não venha
do próprio modelo**.

### Modelo mental

```text
          ┌────────────────────────────────────┐
          ▼                                    │
   gather context                              │
   (histórico, arquivos,                       │
    tool_results anteriores)                   │
          │                                    │
          ▼                                    │
    take action                        falhou: corrigir
   (tool_use: editar, rodar,           o rumo e repetir
    buscar — o harness executa)                │
          │                                    │
          ▼                                    │
   verify results ─────────────────────────────┘
   (testes, build, diff, validador)
          │
          ▼ passou
    tarefa completa
```

A seta que volta é o agente. O que a alimenta é a **verdade do ambiente** — um sinal que o
modelo não controla: o teste passou ou não passou, o código compilou ou não compilou, o diff
aplicou ou não aplicou. Sem essa seta, o desenho vira uma linha reta de prompts encadeados —
e linha reta não corrige rumo.

### Definição

Um agente é um sistema em que o modelo **dirige o próprio processo e o próprio uso de
ferramentas**. A documentação oficial do Claude Code descreve o ciclo em três fases:

> "When you give Claude a task, it works through three phases: **gather context**, **take
> action**, and **verify results**. These phases blend together."
> — [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

O diagrama que acompanha o texto fecha o ciclo: *gathering context, taking action, verifying
results, and repeating until task complete*. Daí a forma curta usada no repositório:
**gather context → take action → verify results → repeat**.

> **Nota de terminologia.** A forma oficial é **verify results** — é a que aparece na
> documentação, e é a que este repositório adota. *Verify work* é uma variante informal que
> circula em material de terceiros e **não aparece em nenhum lugar da documentação oficial**.
> Se a prova usar a forma informal, trata-se do mesmo passo; mas se duas alternativas
> competirem pela redação da fase, a que casa com a documentação é *verify results*.

A distinção formal que a Anthropic usa para separar agente de pipeline:

> "**Workflows** are systems where LLMs and tools are orchestrated through predefined code
> paths. **Agents**, on the other hand, are systems where LLMs dynamically direct their own
> processes and tool usage, maintaining control over how they accomplish tasks."
> — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

Em termos do Módulo 0: nos dois casos há modelo, tools e loop. A diferença é **quem segura o
volante**. No *workflow*, o caminho está escrito em código — o modelo preenche etapas de um
fluxo que a aplicação fixou de antemão. No *agente*, o modelo decide o próximo passo a cada
volta, lendo os resultados que voltam. E o software que envolve o modelo e fornece tools,
gestão de contexto e ambiente de execução continua se chamando **agentic harness** (Módulo 0
§1) — é o Claude Code, não o modelo.

### Por que a verificação é o passo que define o agente

Uma chamada única produz uma saída e termina; ninguém confere. O que transforma isso em agente
é o retorno de **ground truth do ambiente**:

> "During execution, it's crucial for the agents to gain 'ground truth' from the environment at
> each step (such as tool call results or code execution) to assess its progress."

Sem verificação, o loop vira a cadeia do `### O problema`: acumula erro sem detectá-lo, o
passo 4 constrói em cima de um passo 2 errado e nada no sistema percebe. Com verificação, o
erro do passo 2 aparece como teste vermelho, como exceção, como diff que não aplica — e o loop
corrige o rumo. **Um agente sem passo de verificação é um workflow com aparência de agente.**

### O que acontece se…

**…não existir sinal objetivo de sucesso?** O terceiro passo colapsa: "verify results" vira
"pergunte ao modelo se ele acha que acertou" — auto-relato, não verificação. (Confiança
declarada não é acurácia; o Domínio 5 formaliza isso como *calibração de confiança*.) Sem o
sinal, o loop agêntico perde justamente o que o define — e o desenho honesto passa a ser uma
chamada única ou um workflow determinístico.

**…o sinal existir, mas medir a coisa errada?** O caso mais traiçoeiro: o loop "tem"
verificação, a equipe relaxa, e o erro passa por um portão que olhava para o outro lado.
Verificação que verifica a propriedade errada dá **falsa confiança** — pior que ausência
declarada. Guarde a frase: ela é o cenário de prova desta seção e reaparece no lab, cujo exit
code só verifica o paralelismo — uma rodada pode sair verde com o conteúdo arruinado.

### Quando usar

Use o loop agêntico quando a tarefa é multi-passo, **não totalmente especificável de antemão**,
e existe um sinal objetivo de sucesso que o agente possa consultar (testes, compilador,
validador de schema, diff). Quando não há esse sinal, o agente não tem como verificar e o
terceiro passo colapsa — nesse caso, prefira uma chamada única ou um workflow com código
determinístico entre as etapas.

A própria Anthropic recomenda não escalar prematuramente:

> "For many applications, however, optimizing single LLM calls with retrieval and in-context
> examples is usually enough."

A régua tem, portanto, três perguntas: é multi-passo? é impossível especificar o caminho de
antemão? existe ground truth consultável? Três sins pedem agente. Qualquer não pede o desenho
mais simples — e a prova adora um cenário em que o desenho mais simples é a resposta certa
(a Question 9 do banco é exatamente isso).

### Checkpoint

Responda por escrito antes de abrir:

1. Um workflow e um agente usam o mesmo modelo, as mesmas tools e um loop. O que os separa,
   em uma frase?
2. Por que "o agente declara 95% de confiança" não serve como passo de verificação?
3. Um pipeline gera código, roda linter e publica — e publica código que não compila. A
   verificação está *ausente* ou *presente-mas-errada*? Que diferença isso faz para o conserto?

<details>
<summary>Ver respostas</summary>

1. Quem decide o próximo passo: no workflow, o caminho está pré-escrito em código; no agente,
   o modelo dirige o próprio processo lendo os resultados de cada volta.
2. Porque vem do próprio modelo — não é ground truth do ambiente. Verificação exige um sinal
   que o modelo não controla (teste, build, validador).
3. Presente-mas-errada: o linter é um sinal objetivo, só que da propriedade errada (estilo, não
   funcionamento). O conserto não é "adicionar verificação", é **trocar o critério** — ligar
   build e testes ao loop. Diagnosticar errado leva ao distrator ("melhore o prompt").

</details>

### Cenário de prova

*Um time monta um pipeline que gera código a partir de uma especificação, roda um linter e
publica. O agente "conclui" tarefas que não compilam.* A resposta não é melhorar o prompt de
geração nem trocar o modelo: é que **o linter não é o critério de sucesso da tarefa**. O passo
de verificação existe, mas verifica a coisa errada. Ligar o build e a suíte de testes ao loop —
e fazer o agente reagir ao resultado — é o que fecha o ciclo.

A cadeia de raciocínio, no formato que serve para toda questão do tipo:

```text
1. O cenário diz: o agente conclui tarefas que não compilam, e o linter passa sempre.
2. Logo existe verificação — mas ela mede estilo, não funcionamento. O sinal está saturado.
3. O critério do loop: verify results exige ground truth da propriedade que importa.
4. Compilar e passar testes é o ground truth de "funciona"; linter limpo não é.
5. Resposta: ligar build e testes ao loop e fazer o agente reagir ao resultado. Mais
   iterações, mais regras de linter ou few-shot não criam o sinal que falta.
```

---

## 2. Sessões e continuidade

A §1 fechou o loop de **uma** tarefa. Mas ninguém trabalha com um agente por uma tarefa só: o
uso real atravessa horas, dias e dezenas de assuntos. Este capítulo pergunta o que acontece com
**a conversa** nesse tempo — onde ela vive, o que sobrevive a um fechamento de terminal, e
quando ela deixa de ajudar e passa a atrapalhar.

### O problema

Duas verdades do Módulo 0 entram em rota de colisão numa conversa longa:

1. A conversa inteira é reenviada a cada chamada — `messages` carrega tudo, sempre (Módulo 0 §2).
2. A context window é um orçamento finito (Módulo 0 §1).

Conversa que cresce + janela que não cresce = em algum momento, **não cabe**. Alguém precisa
decidir o que descartar, e qualquer escolha perde alguma coisa. Há ainda um segundo problema,
mais mundano: a API não guarda nada, então se o terminal fechar, a conversa morre — a menos que
**alguém** a grave. Persistir e caber são os dois trabalhos do mecanismo de sessões do Claude
Code, e cada um tem um custo que a prova explora.

### Modelo mental

```text
   o modelo            a SESSÃO (no harness)              o disco
  (stateless)      ┌────────────────────────┐    ~/.claude/projects/<proj>/
      ▲            │ histórico de turnos    │    └── <session-id>.jsonl
      │ cada       │ tool calls/results     │◄── cada evento vira
      └─ chamada ──│ estado acumulado       │    uma linha gravada
                   └───────────┬────────────┘
                               │ quando a janela enche:
                               ▼
                          COMPACTION
              descarta tool outputs antigos, resume o resto
           (instruções antigas são o que se perde primeiro)
```

A sessão é o **arquivo de conversa que o harness mantém** para simular continuidade sobre uma
API sem memória. Dois termos contextuais antes de seguir: **JSONL** é um formato de arquivo com
um objeto JSON por linha — cada mensagem, tool use e resultado vira uma linha, o que torna o
arquivo apensável e reabrível; **compaction** é a rotina do harness que, quando a janela aperta,
descarta e resume conteúdo antigo para a conversa voltar a caber. Note quem faz o quê: gravar e
compactar é o *harness* (determinístico); o *modelo* só vê o que sobrou na janela.

### Definição

Uma **session** é uma conversa contínua, com histórico de turnos e estado acumulado. O Claude
Code grava cada mensagem, tool use e resultado num arquivo JSONL sob `~/.claude/projects/`.

A regra de partida:

> "**Sessions are independent.** Each new session starts with a fresh context window, without
> the conversation history from previous sessions."

### Sessão nova vs. resume vs. fork

Três maneiras de abrir o Claude Code, três destinos diferentes para o histórico:

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

A leitura da tabela, linha a linha:

- **Sessão nova** é recomeçar: janela limpa, nada do que foi discutido existe. É a escolha
  certa quando o histórico viraria ruído (o critério vem no `### Quando usar`).
- **Resume** é reabrir **a mesma** conversa: mesmo id, turnos novos anexados ao mesmo arquivo.
  O experimento e o original vivem juntos — o que der errado agora contamina o que veio antes.
- **A diferença entre `--continue` e `--resume` não é o que acontece com a sessão** — as duas
  retomam sob o mesmo id. É *como a sessão é escolhida*: `--continue` pega automaticamente a
  mais recente do diretório atual; `--resume` abre um seletor (ou aceita um nome/id/caminho).
- **Fork** é o único que **bifurca**: copia o histórico para um id novo e deixa o original
  intacto. É a resposta quando se quer experimentar sem arriscar o que já foi construído — o
  contexto vem junto, o risco não volta.

> ⚠️ **Não confunda:** `--continue`/`--resume` (mesmo id, anexa turnos) ≠ fork (id novo, copia
> o histórico). Questões de prova adoram oferecer `--continue` vs. `--resume` como se fossem
> comportamentos diferentes da sessão — não são; a diferença real está entre *retomar* e
> *bifurcar*. E note que fork **não economiza contexto**: a cópia nasce do mesmo tamanho.

### O que persiste e o que não persiste

Persiste no resume: histórico completo (incluindo tool calls e resultados), modelo, checkpoints
e snapshots de arquivo para `/rewind`.

**Não** persiste: flags de configuração passadas na invocação. Se a sessão dependia de
`--mcp-config`, `--settings`, `--plugin-dir`, `--fallback-model` ou de diretórios adicionados com
`--add-dir`, é preciso passá-las de novo; diretórios adicionados no meio da sessão com `/add-dir`
também não são restaurados. Os arquivos de settings (`settings.json`, `settings.local.json`) são
relidos no launch, então configuração que mora neles não precisa ser repassada. Quanto a tasks:
*scheduled tasks* que não expiraram **são** restauradas; **background Bash e monitor tasks não**.

A lógica por trás da lista, que ajuda a reconstruí-la de memória: **persiste o que mora no
arquivo da sessão** (a conversa e seus derivados); **não persiste o que morava na invocação**
(flags são argumentos de um processo que já terminou). Settings em arquivo voltam porque são
relidos do disco a cada launch — não porque a sessão os guardou.

Entre sessões diferentes, nada do histórico atravessa. O que atravessa por outro mecanismo é o
`CLAUDE.md` (carregado toda sessão) e a auto memory.

### O que acontece se…

**…uma regra crítica viver só no histórico da conversa?** Contexto acumulado não é neutro: ele
compete por espaço na janela e dilui a atenção. Quando a janela enche, o Claude Code administra
sozinho, e a ordem importa:

> "It clears older tool outputs first, then summarizes the conversation if needed. Your requests
> and key code snippets are preserved; detailed instructions from early in the conversation may
> be lost. Put persistent rules in CLAUDE.md rather than relying on conversation history."

Esse é o ponto de virada: **instruções dadas cedo na conversa são exatamente o que a compaction
perde**. A regra funcionou no turno 3, evaporou no turno 60 — e ninguém avisou. Se uma regra
precisa valer até o fim, ela não pode viver no histórico — vai para o `CLAUDE.md` (ou para o
system prompt: é a mesma lição do `system` vs. `messages` do Módulo 0 §2, agora com a compaction
como vilã).

> **Guarde este ponto:** "regra que não pode falhar" tem uma resposta ainda mais forte que
> `CLAUDE.md` — o hook, que é código e roda sempre. A §6 desenha essa escada:
> histórico < `CLAUDE.md` < hook.

### Quando usar

**Quando o histórico deixa de ajudar e passa a poluir.** O sinal de que é hora de começar
sessão nova em vez de continuar: a tarefa mudou de assunto e o histórico anterior não é
premissa da nova tarefa. Aí o histórico só ocupa espaço e oferece ao modelo âncoras erradas
(arquivos lidos para outro fim, decisões revogadas, abordagens abandonadas). Continuar é certo
quando a tarefa nova **depende** do que foi estabelecido antes.

### Checkpoint

1. Uma engenheira quer testar uma abordagem radicalmente diferente sem perder a conversa atual,
   que estabeleceu 30 turnos de decisões. Sessão nova, `--resume` ou fork? Por quê?
2. Em que `--continue` e `--resume` diferem — e em que *não* diferem?
3. A sessão ficou cara, mas a tarefa continua a mesma e depende das decisões já tomadas.
   Por que "começar sessão nova" é a resposta errada, e o que fazer em vez disso?

<details>
<summary>Ver respostas</summary>

1. Fork (`--fork-session` / `/branch`): é o único que copia o histórico para um id novo
   deixando o original intacto — experimenta com todo o contexto, sem risco de contaminar.
   Resume anexaria o experimento à conversa que ela quer preservar; sessão nova jogaria fora
   os 30 turnos.
2. Diferem só em *como a sessão é escolhida* (mais recente do diretório vs. seletor). Não
   diferem em nada do que acontece com a sessão: ambas reabrem sob o mesmo id e anexam turnos.
3. Sessão nova descarta as decisões que ainda governam o trabalho — cumpre a metade barata do
   requisito e falha na cara. A resposta é `/compact` (resumir dentro da sessão, podendo nomear
   o que deve sobreviver), que reduz a entrada reenviada sem perder o que foi estabelecido.

</details>

### Cenário de prova

*Um agente de suporte roda uma sessão longa por cliente. Depois de 40 turnos, ele passa a citar
a política de reembolso errada — a que estava correta no início da conversa.* A causa provável
não é o modelo: é a compaction tendo descartado a instrução inicial. A correção arquitetural é
tirar a política do histórico e colocá-la onde ela recarrega a cada turno (`CLAUDE.md`,
system prompt, ou um resource lido sob demanda), não pedir ao agente "para lembrar melhor".

```text
1. O cenário diz: só sessões LONGAS falham, e o que se perde é uma instrução DADA NO INÍCIO.
2. Sessão longa = janela cheia = compaction — e o que a compaction perde primeiro é
   exatamente instrução detalhada do começo da conversa (citação acima).
3. Logo a instrução não está sendo desobedecida; ela não está mais na janela.
4. O conserto é de arquitetura, não de prompt: mover a política para um lugar que recarrega
   a cada turno (CLAUDE.md / system prompt / resource).
5. Distratores: temperatura (variabilidade de amostragem, não retenção), janela maior
   (adia a compaction, não a elimina), trocar --resume por --continue (mesma coisa).
```

---

## 3. Subagentes

A §2 mostrou a janela da conversa principal como um orçamento disputado, com a compaction de
guarda-costas. Este capítulo apresenta a alternativa arquitetural: em vez de espremer tudo numa
janela só, **gastar contexto em outro lugar** — e trazer de volta só a conclusão.

### O problema

O agente precisa auditar 200 arquivos de log e reportar as três anomalias mais graves. Fazer
isso na conversa principal significa: 200 arquivos entram na janela que a §2 acabou de mostrar
que é finita e disputada; afogam o histórico útil; aceleram a compaction. E o pior vem depois de
pronto: a auditoria acabou, mas os 200 logs **continuam na conversa**, reenviados e cobrados a
cada chamada seguinte (Módulo 0 §2 — a entrada viaja inteira, sempre), pagando aluguel por um
trabalho que já terminou.

O que queremos é outra coisa: que a leitura suja aconteça numa **janela descartável**, e que só
a conclusão — três anomalias, algumas linhas — entre na conversa que importa.

### Modelo mental

```text
     conversa principal (o pai)
     ──────────────────────────────
     ... histórico útil ...
           │
           │  tool Agent: um briefing escrito          ← único canal de ida
           ▼
     ┌────────────────────────────────┐
     │ SUBAGENT — janela própria,     │
     │ que nasce vazia                │
     │   lê os 200 arquivos           │  ← dezenas de milhares de tokens
     │   investiga, compara, destila  │    queimados AQUI, não no pai
     └────────────────┬───────────────┘
                      │  só a mensagem final volta     ← único canal de volta
                      ▼
     ... "3 anomalias: X, Y, Z" ...                    ← ~1–2k tokens
     (a janela descartável morre; o pai segue leve)
```

Um **funil**: muito contexto entra na janela do filho, pouco volta para a do pai. Essa
assimetria é a razão de existir do subagent. Guarde o desenho — as questões deste tópico são
todas variações de "o funil está do lado certo?".

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

> "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation
> history, the skills you've already invoked, or the files Claude has already read. The exception
> is a fork, which inherits the parent conversation instead of starting fresh."
> — [Subagents](https://code.claude.com/docs/en/sub-agents)

E, do lado do SDK, o que atravessa de volta para o pai:

> "intermediate tool calls and results stay inside the subagent; only its final message returns
> to the parent."
> — [Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents)

E, quantificado:

> "Each subagent might explore extensively, using tens of thousands of tokens or more, but
> returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens)."
> — [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Essa assimetria — dezenas de milhares de tokens gastos, 1–2k devolvidos — é a razão econômica
do subagent. Quem lê isso como "subagent serve para ir mais rápido" erra a questão de prova.

### O que o subagent enxerga — e por quê

Antes da tabela, o princípio que a gera — porque quem entende o princípio reconstrói a tabela
sozinho, e quem só a decora erra a primeira variação. O princípio é o do Módulo 0 §2, um nível
acima: **o subagent é uma conversa nova, e numa conversa nova só existe o que for escrito
nela.** O que chega até ele vem de exatamente duas origens:

1. **O prompt de delegação** — a task message que o pai escreveu. É o único conteúdo que sai do
   contexto do pai e atravessa (a §5 é inteira sobre escrever bem esse prompt).
2. **O que o harness carrega em toda sessão nova, de qualquer forma** — o system prompt da
   definição do agente, a hierarquia de `CLAUDE.md` (arquivos no disco, relidos sempre), um
   snapshot do git status, as skills pré-carregadas e o roster de agentes irmãos.

Tudo que não vem por uma dessas duas vias **não chega** — não porque alguém bloqueou, mas
porque não existe terceiro canal por onde viajaria. O histórico do pai, os arquivos que o pai
já leu, as skills que o pai invocou, a auto memory: nada disso mora em disco recarregável nem
foi escrito no prompt, logo não existe do lado de lá.

Com o princípio em mãos, a tabela vira o que sempre deveria ser — o resumo de recitação:

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

### O que acontece se…

**…eu delegar uma tarefa de três linhas?** O funil inverte. A economia de contexto do subagent
é a diferença entre o que ele consome e o que devolve; numa mudança pequena, essa diferença é
quase nula — e sobram os custos fixos: escrever o briefing, pagar a partida "a frio" (o
subagent precisa se situar), esperar o round-trip. O agente fica **mais lento** com a janela
**igualmente saudável** — o desenho pagou o preço do isolamento sem ter o que isolar. É a
Question 18 do banco, e o distrator favorito é culpar o modelo.

**…eu delegar uma tarefa que depende da conversa?** O subagent preenche as lacunas do briefing
com suposições plausíveis e segue em frente, confiante — ele não tem como saber o que não sabe.
O resultado volta bem escrito e sutilmente errado. (A §5 mostra a forma concreta dessa falha.)

### Quando usar

Delegue a um subagent quando a subtarefa (a) produz **output verboso que o pai não precisa
ver**, (b) é autocontida o bastante para caber num briefing escrito, e (c) pode devolver um
resumo em vez do trabalho bruto. Fique no contexto principal quando a tarefa exige idas e
vindas com o usuário, quando as fases compartilham muito contexto, ou quando a mudança é
pequena e pontual — o round-trip custaria mais que a tarefa.

Em uma linha, o critério do funil: **a razão entre contexto consumido e contexto devolvido.**
Alta a favor do consumo → subagent. Próxima de 1, ou invertida → contexto principal.

### Checkpoint — preveja o comportamento

1. Um orquestrador delega com o prompt: *"Continue a análise que começamos e aplique o mesmo
   critério de severidade."* O que o subagent faz com isso?
2. Um desenho dispara 20 subagents de pesquisa, cada um devolvendo ~2k tokens de resumo
   detalhado. O que acontece com a janela do pai?
3. O subagent seguiu a convenção de nomes documentada no `CLAUDE.md`, mas ignorou a exceção
   combinada com o usuário no turno 12 da conversa. Bug?

<details>
<summary>Ver respostas</summary>

1. Não há "começamos" nem "mesmo critério" do lado dele — nada do histórico atravessa. Ele não
   falha com erro: **inventa** uma análise e um critério plausíveis e executa com confiança.
   O conserto é briefing autossuficiente (§5), não "subagent melhor".
2. 20 × 2k = ~40k tokens entrando na janela principal — a economia de contexto se inverte
   pela via da volta. Muitos subagents devolvendo muito é um dos dois custos documentados.
3. Não — comportamento esperado. `CLAUDE.md` chega (é relido do disco em toda sessão); o acordo
   do turno 12 mora no histórico do pai, que não atravessa. As duas origens do que o subagent
   enxerga explicam o caso inteiro (é a Question 11).

</details>

### Cenário de prova

*Um agente precisa auditar 200 arquivos de log e reportar as três anomalias mais graves.*
Subagent, sem dúvida: os 200 arquivos são exatamente o output verboso que não deve entrar na
janela principal, e "as três anomalias" é um resumo destilável. *O mesmo agente precisa
refatorar uma função depois de discutir a abordagem com o usuário por seis turnos.* Contexto
principal: a discussão **é** o contexto, e um subagent começaria sem ela.

```text
1. O critério não é tamanho nem "especialização": é o funil consumido/devolvido.
2. Caso A: 200 arquivos entram, 3 achados saem — funil fortíssimo → subagent.
3. Caso B: o insumo essencial (6 turnos de discussão) mora no histórico, que não atravessa;
   o briefing para compensar custaria mais que a tarefa → contexto principal.
4. Regra de bolso para a prova: identifique O QUE a subtarefa consome e O QUE devolve
   antes de olhar as alternativas.
```

---

## 4. Delegação e execução paralela

A §3 entregou o mecanismo: janelas descartáveis que devolvem resumos. Este capítulo faz a
pergunta seguinte, de arquitetura: com vários subagents à disposição, **o que pode rodar ao
mesmo tempo** — e o que só parece que pode?

### O problema

Tempo de parede. Resumir cada uma de dez fontes, em série, custa a soma dos dez tempos; em
paralelo, custa o tempo da mais lenta. A tentação, diante de qualquer tarefa grande, é
paralelizar tudo. O perigo é que paralelizar o que tem dependência **não produz uma mensagem de
erro** — produz uma de duas coisas piores: um paralelismo de mentira (os ramos rodam "juntos",
mas um precisa esperar o outro, e o ganho evapora) ou um resultado corrompido em silêncio (os
ramos pisam no mesmo estado, e cada rodada sai diferente). Precisamos de um teste que diga,
**antes de rodar**, o que pode e o que não pode.

### Modelo mental

```text
                ORQUESTRADOR
        decompõe e escreve os briefings
          │           │           │
          ▼           ▼           ▼        fan-out: ramos independentes,
      worker A    worker B    worker C     read-only sobre qualquer
      (fonte 1)   (fonte 2)   (fonte 3)    estado compartilhado
          │           │           │
          └───────────┼───────────┘
                      ▼
                   SÍNTESE                 o único passo que lê tudo —
            (o orquestrador mescla         e o único que escreve
             e escreve o resultado)
```

### Definição

**Fan-out** é disparar vários subagents ao mesmo tempo, cada um com um recorte independente do
problema, e sintetizar os resultados depois. É o padrão orchestrator-worker:

> "When a user submits a query, the lead agent analyzes it, develops a strategy, and spawns
> subagents to explore different aspects simultaneously."
> — [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

### Quando usar

**O teste é dependência de estado, não tamanho.** Duas subtarefas podem rodar em paralelo se, e
somente se, **nenhuma precisa do resultado da outra e nenhuma escreve num estado que a outra
lê**. Tamanho não entra na conta: três tarefas grandes e independentes paralelizam; duas tarefas
minúsculas encadeadas, não.

O teste aplicado aos dois lados, porque a prova sempre traz os dois:

✅ **Paraleliza — resumir 10 fontes de pesquisa.** Nenhum resumo lê outro resumo; nenhum
escreve onde outro lê. Dez ramos, zero dependência: o wall clock cai para o tempo do mais
lento, e o resultado independe da ordem de término.

❌ **Não paraleliza — refatorar seis partes do mesmo módulo.** Cada mudança altera o estado (o
código) que as outras leem. E repare na isca: são seis tarefas *grandes* — o tamanho sugere
divisão, e o tamanho é irrelevante. O teste é dependência, e aqui ela está em toda parte.

A formulação oficial do limite:

> "some domains that require all agents to share the same context or involve many dependencies
> between agents are not a good fit for multi-agent systems today"

E a observação que costuma virar distrator: *"most coding tasks involve fewer truly
parallelizable tasks than research."* Pesquisa paraleliza bem porque as fontes são
independentes; refatoração não, porque cada mudança altera o estado que a próxima lê.

### Por que estado compartilhado impede paralelismo

Se dois workers escrevem no mesmo arquivo, no mesmo registro ou no mesmo scratchpad, o
resultado passa a depender da ordem de escrita — que é justamente o que o paralelismo não
garante. O passo a passo da corrupção, porque a prova cobra pelo **sintoma**:

```text
1. worker A e worker B anexam achados ao MESMO scratchpad, que a síntese lê depois
2. rodada 1: A termina primeiro → o arquivo fica [A, B] → a síntese lê [A, B]
3. rodada 2: B termina primeiro → o arquivo fica [B, A] → a síntese lê [B, A]
4. mesma entrada, relatórios finais diferentes — e NENHUM erro em nenhuma rodada
```

Isso é uma **race condition** (condição de corrida): o resultado depende de quem chega
primeiro, e "quem chega primeiro" é exatamente o que a execução paralela não promete. O sintoma
não é um erro: é **não-determinismo** — a mesma entrada produz saídas diferentes conforme quem
terminou primeiro. Por isso o padrão seguro é workers **read-only** sobre o estado
compartilhado, com toda escrita concentrada no passo de síntese do orquestrador (o desenho do
modelo mental acima).

> ⚠️ **Não confunda:** a dependência tem duas formas, com sintomas opostos. *Um ramo lê o que o
> outro produz* → os ramos serializam por baixo dos panos e o sintoma é **lentidão** (speedup
> ~1×). *Dois ramos escrevem onde a síntese lê* → o sintoma é **não-determinismo sem erro**.
> Mesmo critério — dependência de estado —, duas caras. Decore o critério, não o sintoma; o
> Experimento 4 do lab produz uma forma e a Question 12 cobra a outra.

### Os números

| Métrica | Valor documentado |
|---|---|
| Ganho de qualidade (Opus 4 lead + Sonnet 4 subagents vs. Opus 4 sozinho) | **+90,2%** na eval interna de pesquisa |
| Tokens de um sistema multiagente vs. chat | **~15×** |
| Tokens de um agente (single) vs. chat | **~4×** |
| Redução de tempo em queries complexas | **até 90%** |

A leitura correta: multiagente compra **qualidade e tempo de parede** pagando **tokens**. Se a
tarefa não justifica 15× o custo, o desenho está errado mesmo que funcione. (E um subproduto
útil para questões com aritmética: multiagente vs. agente único é ~15×/~4× ≈ 3,75× — não 15×.)

### Limites operacionais do Claude Code

- **20 subagents concorrentes** por sessão, por padrão. Além disso, a chamada falha com
  `Concurrent subagent limit reached`. Ajustável via `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`.
- **Profundidade de aninhamento de 3 camadas** abaixo da conversa principal, por padrão.
  Ajustável via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`.

Os dois números são material de recitação — e de distrator: "seis subagents estouram o limite
de concorrência" é falso com folga, e aparece como alternativa exatamente para quem meio-lembra.

### Checkpoint — encontre o erro

Um plano de projeto propõe: *"para ganhar tempo, rode em paralelo o worker que escreve o
relatório e o worker que o revisa — escrita e revisão são responsabilidades separadas."*

1. Qual é o erro?
2. Qual palavra do enunciado é a isca?
3. Se rodar assim mesmo, qual é o sintoma?

<details>
<summary>Ver respostas</summary>

1. A revisão **lê** o que a escrita **produz** — dependência de dados direta. Revisar um
   relatório que ainda não existe não é concorrência, é fila disfarçada.
2. "Responsabilidades separadas": separação de responsabilidade descreve a divisão do
   *trabalho*, não a independência dos *dados*. O teste de paralelismo é sobre dados/estado.
3. Ou o revisor espera o escritor (speedup ~1× — paralelismo de mentira), ou revisa versões
   parciais e o resultado varia por rodada. Nenhum dos dois vem com mensagem de erro.

</details>

### Cenário de prova

*Um pipeline de pesquisa precisa (1) levantar fontes sobre um tema, (2) resumir cada fonte,
(3) escrever um relatório e (4) revisar o relatório contra as fontes.* Só o passo 2 paraleliza —
um subagent por fonte, sem estado compartilhado. O passo 1 precede tudo; o 3 depende de todos os
resumos; o 4 depende do 3. A resposta errada clássica é "paralelize 3 e 4 para ganhar tempo":
revisar um relatório que ainda não existe é dependência de estado pura.

```text
1. Aplique o teste a cada par de estágios: quem precisa do resultado de quem?
2. 1 → alimenta todos; 3 → precisa de TODOS os resumos de 2; 4 → precisa do relatório de 3.
3. Dentro do estágio 2, os itens (as fontes) são mutuamente independentes → fan-out ali.
4. "Janela de contexto própria para cada estágio" não muda nada: isolamento resolve
   CONTAMINAÇÃO de contexto, não DEPENDÊNCIA de dados — são problemas diferentes.
5. Resposta: paralelizar somente o estágio 2, um subagent por fonte.
```

---

## 5. Passagem explícita de contexto

### Definição

Passagem explícita de contexto é a prática de escrever no prompt de delegação **tudo** que o
subagent precisa saber, porque nada do contexto do pai chega até ele por outro caminho.

**O antipadrão é o inverso: assumir contexto implícito.** Assumir que o subagent sabe algo que só o pai sabe. Como a tabela da seção 3 mostra, o subagent
não recebe histórico, não recebe os arquivos já lidos e não recebe as skills já invocadas. Todo
prompt de delegação que contenha "como discutimos", "continue de onde paramos", "o arquivo que
acabamos de ver" ou "aplique o mesmo critério" está referenciando um contexto que **não existe**
do outro lado. O subagent não erra com erro: ele preenche a lacuna com uma suposição plausível e
segue em frente com confiança.

A documentação do SDK é literal sobre o único canal que existe:

> "The only content you pass from parent to subagent is the Agent tool's prompt string, so
> include any file paths, error messages, or decisions the subagent needs directly in that
> prompt."
> — [Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents)

No mesmo espírito, o campo `omitClaudeMd` é documentado como sendo "for agents that take
everything they need from the delegation prompt" — a expectativa de projeto é que o prompt de
delegação seja autossuficiente.

### Quando usar

**Sempre — a pergunta útil é *o que* precisa estar no prompt do subagent.** A lista canônica da Anthropic:

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

### Quando usar

**A pergunta é: qual é a consequência de o passo simplesmente não acontecer?** Se a consequência
é inaceitável — política de segurança, gate de compliance, formatação obrigatória, registro de
auditoria — é hook. Se é preferência de estilo, é prompt (ou `CLAUDE.md`).

**Quando *não* usar:** quando a regra exige julgamento sobre o conteúdo. Hook é código — casa
padrões, checa caminhos, roda validadores. "Não edite `infra/prod/`" é hook; "prefira nomes
descritivos a abreviações" não é, porque não existe script que decida isso.

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
- **Outros códigos** — não bloqueiam por si. A ação segue como *non-blocking error*: o transcript
  mostra um aviso `<hook name> hook error` seguido da primeira linha do stderr prefixada por
  `Failed with non-blocking status code:` (o stderr completo só aparece no debug log).

Em `PreToolUse` o hook também pode devolver JSON em stdout com
`hookSpecificOutput.permissionDecision` — e este é o enum a decorar:

| Valor | Efeito |
|---|---|
| `allow` | Pula o prompt interativo de permissão. Regras de `deny`/`ask`, incluindo deny lists gerenciadas pela organização, continuam valendo |
| `deny` | Cancela a tool call e devolve `permissionDecisionReason` para Claude |
| `ask` | Mostra o prompt de permissão ao usuário, normalmente |
| `defer` | **Só em modo não-interativo, com `-p`.** Encerra o processo preservando a tool call, para um wrapper do Agent SDK coletar input e retomar |

Duas pegadinhas aqui. A primeira: o terceiro valor é **`ask`**, não `request` — é o erro de
memorização mais provável do tópico. A segunda: quando vários hooks respondem, vence a resposta
**mais restritiva**, na ordem `deny` → `defer` → `ask` → `allow`.

E o fato que fecha questões de segurança: *"A hook that returns `permissionDecision: "deny"`
blocks the tool even in `bypassPermissions` mode or with `--dangerously-skip-permissions`."* O
hook é a única camada que o usuário não contorna trocando de permission mode.

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

### Definição

Decomposição é quebrar uma tarefa em subtarefas que possam ser executadas — e conferidas —
separadamente. Não é o mesmo que delegar: dá para decompor em fases sequenciais no próprio
contexto, sem subagent nenhum. A pergunta de desenho é **onde cortar**, e é ela que os três
critérios abaixo respondem.

### Quando usar

**Os três critérios para quebrar.**

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

**Quando *não* decompor.** Quando as fases compartilham muito contexto (o custo de repassar o contexto supera o ganho),
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

### Definição

Escalonamento é interromper a execução automática e devolver a decisão a um humano. Não é
"desistir": é reconhecer que a decisão seguinte não é do agente. O que separa um escalonamento
bom de um ruim é se o humano recebe um pacote pronto para decidir ou um "não consegui".

**Os quatro gatilhos.**

| Gatilho | O que é | Por que o agente não resolve sozinho |
|---|---|---|
| **Baixa confiança** | O agente não tem base para decidir | Continuar significa chutar e apresentar o chute como resultado |
| **Ação irreversível** | Apagar dados, emitir pagamento, publicar, enviar e-mail ao cliente | Se estiver errado, não há rollback — o custo do erro é assimétrico |
| **Conflito de requisitos** | Duas instruções válidas se contradizem | Escolher uma é **decidir pelo usuário**, não executar por ele |
| **Falha repetida** | A mesma abordagem falhou de novo | O agente está sem hipótese nova; repetir só gasta tokens |

### Quando usar

**O critério que separa escalar de tentar de novo não é o número de tentativas.** São duas
perguntas:

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
