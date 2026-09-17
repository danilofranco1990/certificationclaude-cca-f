# Gabarito — Domain 1: Agentic Architecture & Orchestration

Respostas e explicações das 20 questões de [`questions.md`](./questions.md). As explicações estão
em português; os termos técnicos permanecem em inglês.

> **Não abra este arquivo antes de responder.** Ele mora separado de `questions.md` exatamente
> para que um scroll ou um `Ctrl+F` não estrague o autoteste da semana 1.

Cada entrada traz a alternativa correta, por que ela é correta e **por que cada distrator é
tentador** — é nesse último ponto que está o aprendizado. Quando a questão testa uma distinção
catalogada, a entrada aponta a armadilha correspondente.

---


### Q1 — C

**Por que C:** o loop tem um passo de verificação, mas ele verifica a coisa errada. Um linter de
estilo não é ground truth sobre "o código funciona". A documentação da Anthropic é explícita
sobre a necessidade de obter ground truth do ambiente a cada passo (*"tool call results or code
execution"*). Ligar build e testes ao loop — e fazer o agente **reagir** ao resultado — é o que
fecha o ciclo *gather context → take action → verify results*.

- **A (mais iterações):** iterações extras não ajudam porque nada informa ao agente que existe um
  problema. Ele já acredita ter terminado; mais turnos só o fazem terminar de novo.
- **B (mais regras no linter):** amplia a classe de defeitos de estilo detectados, mas um linter
  continua não sendo um compilador. O cenário diz que o código está estilisticamente limpo
  *sempre* — o sinal já está saturado.
- **D (few-shot):** reduz a taxa de erro na geração, o que é bom, mas não verifica nada. O agente
  continua sem saber se acertou. Melhorar a geração não substitui verificar a saída.

### Q2 — B

**Por que B:** quando a janela enche, o Claude Code *"clears older tool outputs first, then
summarizes the conversation if needed... detailed instructions from early in the conversation may
be lost. Put persistent rules in CLAUDE.md rather than relying on conversation history."* É
exatamente o padrão do cenário: sessões curtas não compactam e não falham; sessões longas sim.

- **A (`--continue` vs. `--resume`):** os dois reabrem a sessão sob o **mesmo session id** e
  anexam turnos. A diferença é apenas *como a sessão é escolhida*, não o que acontece com o
  histórico. Trocar um pelo outro não muda nada.
- **C (temperatura):** temperatura controla variabilidade de amostragem, não retenção de
  contexto. A instrução não está sendo desobedecida — ela não está mais na janela.
- **D (janela de 1M):** adia a compaction, não a elimina; e o cenário descreve uma sessão que
  continua crescendo. Uma correção que depende de nunca atingir o limite é frágil por
  construção. A instrução precisa recarregar a cada turno, não caber por mais tempo.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Hook vs. instrução no prompt*.


### Q3 — D

**Por que D:** é o único passo com a razão certa — **consome muitíssimo contexto e devolve
pouquíssimo**. 340 arquivos entram, três assinaturas de erro saem. Essa assimetria é a razão
econômica do subagent: a Anthropic descreve o subagent explorando dezenas de milhares de tokens
e devolvendo *"only a condensed, distilled summary of its work (often 1,000-2,000 tokens)"*.

- **A (renderizar o template):** perfil invertido — entra pouco contexto, sai muito texto. Não há
  contexto a economizar, e o resultado precisa voltar inteiro para a janela do pai de qualquer
  forma.
- **B (discussão com o on-call):** exige ida e volta com um humano. Subagent não tem histórico da
  conversa e não participa do diálogo; delegar isso quebra a interação.
- **C (mudança de uma linha):** pequena demais. O round-trip de partida do subagent — que *"starts
  fresh and may need time to gather context"* — custa mais que a própria edição.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Subagente com contexto isolado vs. continuar no contexto principal*.


### Q4 — A

**Por que A:** o teste é dependência de estado. O estágio 2 (resumir cada fonte) tem N itens
mutuamente independentes: nenhum resumo precisa de outro. Os demais são estritamente
encadeados — 1 precede tudo, 3 depende de **todos** os resumos, e 4 depende do relatório que 3
produz.

- **B (2 e 3):** o estágio 3 escreve o relatório *a partir dos* resumos. Rodá-lo em paralelo com
  a produção deles significa escrever sobre material que ainda não existe.
- **C (3 e 4):** o distrator mais atraente, e a armadilha clássica — revisar um relatório que
  ainda está sendo escrito é dependência de estado pura. "São preocupações separadas" descreve a
  divisão de responsabilidade, não a de dados.
- **D (todos os quatro):** janela de contexto própria resolve **isolamento**, não **dependência**.
  Dar a cada estágio seu próprio contexto não faz o estágio 4 deixar de precisar da saída do 3.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Execução paralela vs. sequencial*.


### Q5 — C

**Por que C:** ao worker faltou a **fronteira da tarefa**. A lista canônica da Anthropic para um
subagent é *"an objective, an output format, guidance on the tools and sources to use, and clear
task boundaries"* — o cenário entrega fontes e formato, entrega um objetivo que é **o mesmo para
os cinco**, e omite por completo o quarto item. Objetivo idêntico sem fronteira é a receita de
cinco workers escolhendo o mesmo recorte. A falha documentada é
literalmente esta: *"one subagent explored the 2021 automotive chip crisis while 2 others
duplicated work investigating current 2025 supply chains, without an effective division of
labor."* Cada worker precisa do próprio recorte **e** de saber o que os outros cobrem.

- **A (mais subagents):** multiplica o custo da duplicação. Dez workers sem fronteira produzem
  dez respostas sobre o mesmo subtema, não dez subtemas.
- **B (mais `maxTurns`):** aprofunda a exploração *dentro do mesmo recorte*. O problema não é
  profundidade insuficiente — é que os cinco escolheram o mesmo recorte.
- **D (deduplicar na síntese):** trata o sintoma depois de já ter pago por ele. Quatro quintos do
  custo do fan-out foram gastos antes da deduplicação, e pedir substituições serializa o que
  deveria ter sido paralelo.

### Q6 — B

**Por que B:** `CLAUDE.md` é instrução, e instrução é **probabilística** — uma solicitação que o
modelo atende quase sempre. Para uma regra cuja violação é inaceitável, a resposta é um mecanismo
**determinístico**, que roda independentemente do que o modelo decidiu. `PreToolUse` roda **antes**
da tool call e pode impedi-la; exit code 2 bloqueia a ação, e bloqueia de forma soberana (*"Even
a JSON `permissionDecision` of `allow` cannot override exit 2"*).

- **A (negrito no topo):** continua sendo instrução. Ainda é probabilístico, e ainda é o tipo de
  conteúdo que a compaction descarta primeiro numa sessão longa — que é exatamente o cenário.
- **C (`PostToolUse` que loga):** roda **depois** de a escrita ter sucesso. Detecta, não previne;
  o arquivo de produção já foi alterado. Confundir detecção com prevenção é a armadilha central
  do par `PreToolUse`/`PostToolUse`.
- **D (regra por caminho):** escopar a regra ao glob a torna mais limpa e mais barata em contexto,
  mas não muda a natureza dela: continua sendo texto que o modelo pode não seguir. Organização
  melhor, mesma garantia — nenhuma.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Hook vs. instrução no prompt* · *`PreToolUse` vs. `PostToolUse`*.


### Q7 — D

**Por que D:** dois dos três critérios de decomposição falham ao mesmo tempo. **Independência:**
as seis partes tocam o mesmo código e o mesmo schema, ou seja, compartilham estado mutável —
logo não paralelizam. **Verificabilidade:** "migrou certo" só é conferível com o sistema inteiro
de pé, então o orquestrador recebe seis resultados que não consegue avaliar e os incorpora como
premissas.

- **A (limite de concorrência):** factualmente errado, e é a pegadinha para quem meio-lembra o
  número. O padrão do Claude Code é **20** subagents concorrentes; seis passa com folga.
- **B (cada subagent redescobre as call sites):** o mecanismo é **verdadeiro** — um subagent que
  não é fork começa com contexto limpo e precisa se situar. Mas é uma objeção de *eficiência*, e
  tem conserto barato: passar as call sites já levantadas no prompt de delegação. D aponta um
  problema de *correção*, que nenhum prompt melhor resolve. Distrator forte justamente porque não
  é falso — é insuficiente.
- **C (15× tokens):** o número está certo (sistemas multiagente usam ~15× os tokens de um **chat**;
  contra um agente único, que já gasta ~4× o chat, a razão é ≈3,75×), mas custo é a objeção **mais
  fraca** aqui. Se o desenho fosse válido, 15× poderia ser aceitável numa migração; o que condena
  o plano é ele não funcionar, não ele ser caro.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Execução paralela vs. sequencial*.


### Q8 — A

**Por que A:** é **conflito de requisitos** — duas instruções válidas que se contradizem — somado
a uma **ação irreversível** (emitir dinheiro). Nenhum dos dois é falha de execução, então nenhuma
tentativa adicional resolve. O agente não tem autoridade para fechar uma questão de política, e a
escalada correta entrega o pacote de decisão pronto (valor, as duas regras, as duas leituras) em
vez de perguntar "o que eu faço?".

- **B (aplicar a mais restritiva):** parece prudente, mas é **decidir pelo humano**. Escolher a
  regra restritiva é uma decisão de política tanto quanto escolher a permissiva — prudência não
  converte uma escolha de política numa não-escolha.
- **C (aplicar a mais específica):** "específico vence genérico" é heurística de resolução de
  regras, não autoridade delegada. E aqui ela libera a ação irreversível, que é o pior momento
  para o agente arbitrar sozinho.
- **D (retry com prompt esclarecedor):** retry não desfaz ambiguidade de especificação. A
  informação que falta não está no modelo — está com quem define a política. Mais tentativas
  produzem escolhas mais confiantes, não mais corretas.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Escalonar para humano vs. tentar de novo*.


### Q9 — B

**Por que B:** a tarefa não pede agente. Layout consistente, três campos fixos e uma fila humana
já existente para exceções — é trabalho de chamada única com saída estruturada, mais um
verificador **externo e determinístico** (o schema) para decidir o que vai para o humano.
Exatamente o caso em que a Anthropic recomenda não escalar: *"For many applications, however,
optimizing single LLM calls with retrieval and in-context examples is usually enough."* Agente se
justifica quando a tarefa é multi-passo e não totalmente especificável de antemão; nada aqui é.

- **A (um subagent por campo):** três round-trips para extrair três campos do mesmo documento
  curto. O custo fixo da delegação domina, e o documento teria de ser passado a cada um.
- **C (loop agêntico por nota):** substitui um critério objetivo por um subjetivo. "Até o agente
  estar confiante" é auto-relato, e confiança declarada não é acurácia — em 50 mil documentos,
  isso troca uma barreira determinística por uma que o próprio agente decide quando baixar. Além
  disso, sem um schema, não há como saber quando o loop deveria parar.
- **D (pipeline de três agentes):** três agentes para uma extração de layout fixo. Cada fronteira
  entre agentes é uma passagem de contexto a mais e um ponto de falha a mais, sem nenhum ganho de
  qualidade a comprar.

### Q10 — C

**Por que C:** fork é o único mecanismo que **cria um session id novo** copiando o histórico e
deixando o original intacto: *"Forking with `--fork-session` or `/branch` copies the history into
a new session ID, leaving the original unchanged."* É precisamente o requisito — experimentar sem
perder o estado atual.

- **A (`--continue`) e B (`--resume`):** os dois reabrem sob o **mesmo** session id e anexam
  turnos à conversa existente. O experimento passaria a viver dentro da mesma sessão que ela quer
  preservar — se der errado, contaminou o que deveria estar guardado. A diferença entre A e B é só
  como a sessão é escolhida (mais recente do diretório vs. seletor), e nenhuma das duas bifurca.
- **D (`/clear` e reexplicar):** descarta a janela atual e obriga a reconstruir de memória o que
  30 turnos estabeleceram. Perde exatamente o que o fork preserva de graça.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Sessão nova vs. resume*.


### Q11 — A

**Por que A:** é a divisão exata que a documentação especifica. Um subagent que não é fork
**recebe** a hierarquia de `CLAUDE.md`, a task message, o snapshot de git status e as skills
pré-carregadas; e **não recebe** o histórico da conversa, os arquivos que o pai já leu, as skills
já invocadas nem a auto memory. A convenção estava no `CLAUDE.md` (chegou); o acordo do turno 12
estava no histórico (não chegou). O comportamento do subagent é o esperado, não um bug.

- **B (`tools` sem `Read`):** o desvio não estava em arquivo nenhum — foi combinado na conversa.
  Nenhuma ferramenta de leitura o alcançaria.
- **C (`omitClaudeMd` por padrão):** invertido. `omitClaudeMd` é opcional e vem desligado; se
  estivesse ligado, o subagent **não** teria seguido a convenção documentada — que é justamente o
  que ele fez.
- **D (compaction antes da delegação):** plausível, mas não é necessário invocar compaction para
  explicar o caso. O histórico não chega ao subagent nem numa sessão curta sem compaction alguma:
  o isolamento é a regra, não um efeito colateral de janela cheia.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Subagente com contexto isolado vs. continuar no contexto principal*.


### Q12 — D

**Por que D:** a assinatura do problema é decisiva — **saída diferente a cada execução, sem erro
algum**. Isso é não-determinismo por ordem de escrita: dois ramos escrevem no mesmo estado e o
resultado depende de quem terminou primeiro, que é exatamente o que o paralelismo não garante.
Os ramos não eram independentes, então nunca deveriam ter sido paralelos nessa forma. O padrão
seguro é worker read-only, com toda escrita concentrada na síntese.

- **A (retry com backoff):** retry não resolve corrida; ele reordena as escritas de novo, com a
  mesma ausência de garantia. E não há falha a retentar — nada errou.
- **B (limite de concorrência):** throttling atrasaria os workers, não mudaria o conteúdo do
  relatório. Além disso, o padrão é 20 subagents concorrentes; dois não chegam perto.
- **C (temperatura 0):** o distrator mais atraente, porque a variação de LLM é uma explicação
  genuína para saídas diferentes. Mas ela não explica **este** cenário: a variação aqui vem da
  ordem de escrita no arquivo compartilhado, e com temperatura 0 nos dois workers o relatório
  final continuaria variando conforme quem escreveu primeiro.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Execução paralela vs. sequencial*.


### Q13 — C

**Por que C:** o subagent não herda nada do pai — nem o histórico, nem os arquivos lidos, nem os
valores já resolvidos. Tudo que o orquestrador já descobriu e não colocou no prompt, o subagent
tem de redescobrir. O sintoma no cenário é literal: ele gasta os turnos refazendo as mesmas
buscas. Passar os fatos concretos (account ID, plan tier, caminho do contrato) elimina o
round-trip desperdiçado.

- **A (formato de saída):** o cenário diz que o formato **foi** passado. E formato governa como
  responder, não o que já se sabe.
- **B (objetivo mais restrito):** o objetivo também foi passado, e o subagent não estava
  explorando dados fora do escopo — estava buscando exatamente os dados certos, só que de novo.
- **D (mais `maxTurns`):** paga pelo desperdício em vez de removê-lo. Dá ao subagent orçamento
  para refazer o trabalho do pai e ainda analisar — mais caro e mais lento, com o mesmo resultado.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Subagente com contexto isolado vs. continuar no contexto principal*.


### Q14 — D

**Por que D:** `SubagentStop` dispara quando um subagent termina, e é o evento desenhado para
exatamente este propósito. O requisito de cobrir **também os subagents que falham** é o que
fecha a questão.

- **A (`Stop`):** dispara quando Claude termina de responder — é o fim do turno do agente
  principal, não o fim de cada subagent. Um turno pode conter vários subagents, ou nenhum.
- **B (`PostToolUse` na tool de subagent):** é o distrator forte, porque a ideia é razoável — a
  tool `Agent` retorna e o hook dispara. Mas `PostToolUse` roda **depois de uma tool call ter
  sucesso**; os subagents que falham não passam por ele (falha é `PostToolUseFailure`), e o
  requisito explícito é registrar os que falham.
- **C (`SessionEnd`):** granularidade errada e tarde demais. Dispara uma vez, no fim da sessão,
  quando os dados por subagent teriam de ter sido acumulados por outro meio — que é o problema
  original.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *`PreToolUse` vs. `PostToolUse`*.


### Q15 — B

**Por que B:** não existe critério objetivo para dizer que um rewrite de copy "ficou certo".
Decompor uma tarefa em pedaços que ninguém sabe conferir não distribui o trabalho — distribui a
incerteza: o orquestrador recebe cinco saídas que não consegue avaliar e as concatena como se
fossem trabalho concluído. O sintoma no cenário é a assinatura disso: *ninguém sabe dizer quais
seções pioraram*.

- **A (independência):** é o critério que este plano até **atende** razoavelmente — cinco seções
  distintas podem ser reescritas sem que uma dependa do texto da outra, e a afirmação de que
  "não podem ser trabalhadas separadamente" é forte demais. O cenário não relata um defeito de
  coordenação entre seções; relata a impossibilidade de **avaliar** qualquer uma delas.
- **C (tamanho de contexto):** cinco seções de copy de onboarding são pequenas. O custo de
  contexto não é o que está causando a inconsistência de qualidade.
- **D (concorrência):** cinco está muito abaixo do limite padrão de 20 subagents concorrentes, e
  o cenário não relata falha de spawn nem de coordenação — relata falha de qualidade.

### Q16 — D

**Por que D:** 503 é falha **transitória** — infraestrutura indisponível, não decisão errada nem
ambiguidade. Retry com backoff é a resposta correta, e escalar aqui transformaria um soluço de
rede em intervenção humana. Nenhum dos quatro gatilhos de escalonamento está presente: não há
ação irreversível, não há conflito de requisitos, não há baixa confiança sobre o que fazer, e a
"falha repetida" é do sistema externo, não do agente.

- **A (duas falhas, escale):** o número de tentativas não é o critério — é a armadilha central
  deste tópico. O que decide é se a ação é irreversível e se a próxima tentativa tem hipótese
  nova; um 503 é justamente o caso em que a mesma tentativa, mais tarde, tende a funcionar.
- **B (pedido é irreversível):** o cenário descreve uma **consulta** de status, e diz
  explicitamente que nenhuma ação irreversível foi tomada. Ler o status de um pedido não altera
  nada.
- **C (dizer que não foi encontrado):** é factualmente falso e o pior desfecho dos quatro — o
  agente relataria ao cliente uma conclusão sobre os dados quando o que houve foi indisponibilidade
  do serviço. Transforma um erro de infraestrutura numa informação errada entregue ao cliente.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Escalonar para humano vs. tentar de novo*.


### Q17 — A

**Por que A:** `/compact` resume a conversa **dentro da mesma sessão**, liberando janela sem
descartar o que foi estabelecido, e aceita instrução de foco (`/compact focus on...`) — que é
precisamente o mecanismo para nomear o que não pode ser perdido. Atende aos dois requisitos:
reduz custo por request e preserva as decisões.

- **B (sessão nova):** cumpre a metade barata do requisito e falha na outra. Recomeçar descarta as
  decisões, e reconstruí-las de memória é justamente o que ela quer evitar.
- **C (modelo menor):** o distrator mais tentador, porque de fato reduz o preço por token e
  preserva as decisões. Mas ataca o sintoma, não a causa: o custo de uma sessão longa sobe porque
  **o histórico inteiro é reenviado a cada request**, e trocar de modelo não encolhe o histórico.
  A conta continua crescendo, só que com outro multiplicador — e ainda se paga com um modelo
  menos capaz numa tarefa arquitetural em andamento.
- **D (fork):** fork **copia** o histórico para um id novo. A nova sessão começa com o mesmo
  volume de contexto — nenhuma economia — e a premissa da alternativa ("o fork começa com menos
  contexto") é falsa.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Sessão nova vs. resume*.


### Q18 — B

**Por que B:** o subagent tem um custo fixo de partida. A documentação diz que um subagent que não
é fork *"starts fresh and may need time to gather context"* — ele não herda os arquivos que o pai
leu nem o histórico, então precisa se situar antes de fazer qualquer coisa. Para um arquivo de 100
linhas, esse custo fixo domina completamente o trabalho. Subagent compensa quando muito contexto
entra e pouco sai; aqui entra pouco e sai pouco.

- **A (limite de aninhamento):** o limite padrão é de 3 camadas abaixo da conversa principal, e o
  cenário descreve um único nível de delegação. Além disso, atingir o limite não gera retry
  silencioso.
- **C (herdaram o modelo do pai):** o mecanismo é verdadeiro — um subagent sem `model` definido
  roda no modelo do pai. Mas isso não explica nada: se o pai lesse o arquivo diretamente, usaria
  **o mesmo modelo**. Um fator que é idêntico nos dois desenhos não pode explicar a diferença
  entre eles. Distrator que sobrevive à leitura rápida e morre na comparação.
- **D (resumos incharam o contexto):** o efeito é real em outros cenários — muitos subagents
  devolvendo muito conteúdo consomem contexto significativo. Mas o cenário fecha essa porta
  explicitamente: o contexto principal **ficou menor** do que antes. O desenho entregou a
  economia de contexto que prometia; o que ele não entregou foi latência, e latência se explica
  pelo round-trip de partida.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Subagente com contexto isolado vs. continuar no contexto principal*.


### Q19 — C

**Por que C:** é o limite documentado do padrão: *"some domains that require all agents to share
the same context or involve many dependencies between agents are not a good fit for multi-agent
systems today"*, e, diretamente sobre o caso, *"most coding tasks involve fewer truly
parallelizable tasks than research."* Pesquisa funciona porque fontes são independentes;
refatorar o mesmo módulo é o oposto — cada mudança altera o estado que a próxima lê.

- **A (orquestrador melhor):** o problema não é a mescla, é que as partes nunca foram
  independentes. Um merge melhor não desfaz decisões tomadas por seis agentes que não viam o
  trabalho um do outro.
- **B (poucos subagents):** inverte a causa. Mais agentes sobre o mesmo módulo aumentam as
  dependências cruzadas e o conflito, não a cobertura.
- **D (branch compartilhada com escrita):** piora exatamente o que já estava errado. Dar escrita
  concorrente sobre estado compartilhado introduz não-determinismo por ordem de escrita, além dos
  conflitos de merge.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Execução paralela vs. sequencial*.


### Q20 — A

**Por que A:** `.claude/settings.json` é o nível de projeto **versionável** — commitado no
repositório, vale para todo mundo que clona, sem configuração local. É o único dos quatro que
satisfaz "aplica a todos, inclusive a quem clonar amanhã, sem ninguém configurar nada".

- **B (`~/.claude/settings.json`):** é o settings do usuário, local à máquina de quem o escreveu.
  Não sai dali, e cada novo integrante teria de configurar por conta própria — exatamente o que o
  requisito proíbe.
- **C (`.claude/settings.local.json`):** é por projeto, mas **gitignored** por design, justamente
  para preferências que não devem ser compartilhadas. Não chega a ninguém mais.
- **D (`CLAUDE.md`):** erra a categoria antes de errar o local. `CLAUDE.md` é instrução —
  probabilística — e o requisito é um check de formato obrigatório. Ainda que o arquivo seja
  commitado e chegue a todos, ele não **garante** a execução; hook garante.

> **Armadilha testada:** ver [`armadilhas.md`](./armadilhas.md) — *Hook vs. instrução no prompt*.


