# Armadilhas — Domínio 1

Distinções que a prova cobra em cenário. Cada entrada traz **o critério que separa** as duas
opções e **o cenário em que a escolha se inverte** — porque decorar "subagent é bom" reprova:
a questão vai descrever justamente o caso em que ele é ruim.

---

### Subagente com contexto isolado vs. continuar no contexto principal

**O critério:** a razão entre **contexto consumido** e **contexto devolvido**.

Subagent vale quando a subtarefa queima muito contexto e devolve pouco — ler 200 logs para
reportar 3 anomalias. O ganho é que os 200 logs nunca entram na janela do pai; volta só o
resumo destilado (tipicamente 1–2k tokens, segundo a Anthropic). Não é velocidade, não é
"especialização": é **contenção de contexto**.

O custo tem duas pontas: o subagent que não é fork *"starts fresh and may need time to gather
context"* (round-trip de partida), e os resultados voltam para a janela do pai — muitos
subagents devolvendo muita coisa consomem contexto significativo, invertendo a economia.

**Onde a escolha se inverte:** quando a tarefa exige **ida e volta** — com o usuário ou entre
fases que compartilham contexto. Um subagent não tem histórico, não tem os arquivos que o pai
leu, não tem as skills já invocadas. Se a tarefa é "aplique a abordagem que combinamos nos
últimos seis turnos", o subagent começa sem o que define a tarefa, e o briefing necessário para
compensar acaba custando mais que fazer no contexto principal. Mudança pequena e pontual: idem —
o round-trip custa mais que o trabalho.

> Distrator clássico: "use um subagent para não poluir o contexto principal" aplicado a uma
> tarefa de três linhas. A poluição evitada é menor que o briefing escrito.

> **Teoria:** ver [`notas.md`](./notas.md) §3 — Subagentes.

---
### Execução paralela vs. sequencial

**O critério:** **dependência de estado**, não tamanho nem quantidade de tarefas.

Dois ramos paralelizam se, e somente se, nenhum precisa do resultado do outro **e** nenhum
escreve num estado que o outro lê. Três tarefas grandes e independentes paralelizam bem; duas
tarefas minúsculas encadeadas, não. "É uma tarefa grande, então divide" é raciocínio errado —
tamanho não figura no teste.

Quando há estado compartilhado mutável, o sintoma da violação **não é um erro**: é
não-determinismo. A mesma entrada produz saídas diferentes conforme qual worker terminou
primeiro. Por isso o padrão seguro é worker read-only, com toda escrita concentrada na síntese
do orquestrador.

**Onde a escolha se inverte:** pesquisa paraleliza (fontes independentes); refatoração
tipicamente não (cada mudança altera o estado que a próxima lê). A Anthropic registra isso
diretamente: *"most coding tasks involve fewer truly parallelizable tasks than research"*, e
domínios *"that require all agents to share the same context or involve many dependencies
between agents are not a good fit for multi-agent systems today"*.

> Distrator clássico: paralelizar "gerar relatório" e "revisar relatório". Revisar o que ainda
> não existe é dependência de estado pura, e a questão vai vender isso como ganho de tempo.

> **Teoria:** ver [`notas.md`](./notas.md) §4 — Delegação e execução paralela.

---
### Hook vs. instrução no prompt

**O critério:** **determinístico vs. probabilístico** — ou, na forma útil em prova: *qual é a
consequência de o passo simplesmente não acontecer?*

Instrução em prompt (ou em `CLAUDE.md`) é um pedido ao modelo. Ele atende quase sempre — e
*quase* é exatamente o que falha numa política de segurança. Pior: instruções dadas cedo na
conversa são o que a compaction descarta primeiro (*"detailed instructions from early in the
conversation may be lost"*), então a mesma regra que funcionou no turno 3 pode evaporar no
turno 60.

Hook roda sempre, independentemente do que o modelo decidiu, lembrou ou tentou pular. Se a
consequência da omissão é inaceitável — compliance, gate de segurança, auditoria, formatação
obrigatória —, é hook. Se é preferência de estilo, é prompt.

**Onde a escolha se inverte:** quando a regra exige **julgamento sobre o conteúdo**. Hook é
código: ele casa padrões, checa caminhos, roda validadores. "Não edite `infra/prod/`" é hook
(`PreToolUse`, matcher `Edit|Write`, exit 2). "Prefira nomes descritivos a abreviações" não é
hook — não existe script que decida isso; é `CLAUDE.md`. Tentar codificar julgamento semântico
num hook produz falso positivo que trava o agente.

> **Teoria:** ver [`notas.md`](./notas.md) §6 — Hooks.

---
### Sessão nova vs. resume

**O critério:** **a tarefa nova depende do que foi estabelecido antes?** Se depende, resume. Se
não depende, sessão nova — e o histórico antigo deixa de ser ativo e vira passivo: ocupa janela,
dilui atenção e oferece âncoras erradas (arquivos lidos para outro fim, decisões já revogadas,
abordagens abandonadas).

Mecânica que a prova cobra: `--continue` (`-c`) e `--resume` (`-r`) **fazem a mesma coisa com a
sessão** — reabrem sob o **mesmo session id** e anexam turnos. A diferença é só *como a sessão é
escolhida*: `--continue` pega automaticamente a mais recente do diretório; `--resume` abre um
seletor (ou aceita nome/id/caminho). Quem cria **id novo** é o **fork** (`--fork-session`,
`/branch`), que copia o histórico e deixa o original intacto.

**Onde a escolha se inverte:** quando o histórico não é só inútil, mas **ativamente nocivo** —
o agente já tentou três abordagens erradas e está ancorado nelas. Aí sessão nova vence mesmo que
a tarefa seja a mesma, porque o valor de descartar o beco sem saída supera o de preservar o
contexto. O inverso também cai em prova: a sessão está longa e cara, mas a tarefa continua a
mesma; a resposta é `/compact` (resumir dentro da sessão) ou fork, não começar do zero e perder
o que já foi estabelecido.

> **Teoria:** ver [`notas.md`](./notas.md) §2 — Sessões e continuidade.

---
### Escalonar para humano vs. tentar de novo

**O critério:** **irreversibilidade e hipótese nova** — nunca o número de tentativas.

Duas perguntas resolvem a questão:

1. **A ação é reversível?** Se não é, escale **antes da primeira tentativa**. Três tentativas de
   emitir um pagamento não são mais seguras que uma; são três chances de errar sem rollback.
2. **A próxima tentativa tem hipótese nova?** Se a falha revelou informação — erro específico,
   campo faltando, permissão negada —, o retry tem conteúdo. Se a tentativa seguinte é idêntica
   à anterior, não é retry, é repetição, e repetição não converge.

**Onde a escolha se inverte:** em **conflito de requisitos**, escalar é a única resposta,
independentemente de quantas tentativas restam e de quão reversível seja a ação. Conflito não é
falha de execução — é ambiguidade de especificação, e o agente escolher um lado é decidir pelo
usuário, não executar por ele. No sentido oposto: falha **transitória** (timeout, 429, indisponi-
bilidade) não escala na primeira ocorrência; retry com backoff é a resposta, e escalar cedo
demais transforma um soluço de rede em intervenção humana.

> Distrator clássico: "tentou 3 vezes, agora escale". A contagem é irrelevante; o cenário terá
> plantado ou uma irreversibilidade (escale já) ou um erro transitório (continue tentando).

> **Teoria:** ver [`notas.md`](./notas.md) §8 — Escalonamento para humano.

---
### `PreToolUse` vs. `PostToolUse`

**O critério:** **a ação já aconteceu?** `PreToolUse` roda **antes** da tool call e pode
impedi-la; `PostToolUse` roda **depois** de a chamada ter tido sucesso — o efeito colateral já
existe no mundo.

Bloqueio: exit **2** barra a ação, e vence qualquer JSON em contrário (*"Even a JSON
`permissionDecision` of `allow` cannot override exit 2"*). Em `PreToolUse` também é possível
decidir por JSON, com `hookSpecificOutput.permissionDecision` em **`allow` / `deny` / `ask`** —
mais `defer`, que existe só em modo não-interativo com `-p`. Atenção ao terceiro valor: é
**`ask`**, não `request`. Entre hooks concorrentes vence o mais restritivo, na ordem `deny` →
`defer` → `ask` → `allow`. Exit 0 não bloqueia, e outros códigos não bloqueiam por si.

**Onde a escolha se inverte:** para **prevenir**, só `PreToolUse` serve — em `PostToolUse` o
arquivo já foi escrito, o e-mail já saiu, o registro já foi apagado. Mas para **reagir ao
resultado** — formatar o arquivo recém-editado, rodar o type-checker sobre o que mudou, registrar
o que foi feito —, `PostToolUse` é o certo, porque `PreToolUse` não tem acesso a um resultado que
ainda não existe. A armadilha é escolher `PostToolUse` para um gate de segurança: ele roda, ele
loga, ele até reclama — e o dano já está feito.

> **Teoria:** ver [`notas.md`](./notas.md) §6 — Hooks.

