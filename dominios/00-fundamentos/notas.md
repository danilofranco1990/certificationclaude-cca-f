# Módulo 0 — Fundamentos: como uma conversa com Claude funciona por dentro

> **Onde você está:** Módulo 0 — o alicerce de todo o resto do material.
> **O que você precisa saber antes:** programação básica e JSON. Nada de IA.
> **O que você vai aprender:** o que o modelo realmente é, por que a API não guarda memória,
> e por que uma "ferramenta" é um pedido que a **sua aplicação** executa — não o modelo.
> **Por que importa:** os cinco domínios da prova assumem este capítulo inteiro. Subagentes
> (Domínio 1), saída estruturada (Domínio 3), tool design (Domínio 4) e gestão de contexto
> (Domínio 5) são todos variações do ciclo que este módulo ensina.

Este módulo não é um domínio da prova: não tem peso, não tem banco de 20 questões e não entra
na tabela de progresso do `README.md`. Ele existe porque o material dos domínios usa, desde a
primeira página, conceitos que em nenhum outro lugar são ensinados do zero — *stateless*,
*context window*, `tool_use`, *agent loop*. Quem já construiu aplicações sobre a Claude API pode
atravessá-lo rápido: responda os `### Checkpoint` de cada seção por escrito e, se todos saírem
certos, siga para o Domínio 1. Quem nunca montou o ciclo de ferramentas na mão deve ler na ordem,
sem pular os exemplos.

Convenção do repositório: termos técnicos ficam em inglês. Definições de referência em
[`referencias/glossario.md`](../../referencias/glossario.md).

---

## 1. O modelo e a inferência

Antes de qualquer API, é preciso acertar a imagem mental do que está do outro lado da chamada.
Três ideias erradas — todas comuns, todas compreensíveis — sabotam o estudo inteiro se ficarem
de pé:

1. "Claude **lembra** da conversa." (Não lembra — a seção 2 mostra o que acontece de verdade.)
2. "Claude **executa** ferramentas." (Não executa — a seção 3 é inteira sobre isso.)
3. "Claude **é** o Claude Code." (Não é — Claude Code é um software *em volta* do modelo.)

Esta seção desmonta a terceira e prepara as outras duas.

### O problema

Quando alguém escreve "o Claude leu meu arquivo e rodou os testes", há pelo menos três coisas
diferentes escondidas na frase: um **modelo** que gera texto, um **software** que lê arquivos e
executa comandos, e um **protocolo** que liga os dois. Enquanto essas três coisas estiverem
fundidas numa entidade só ("o Claude"), perguntas centrais da prova não fazem sentido — *quem*
executa a ferramenta? *onde* mora a memória? *o que* a compaction descarta? Para responder, é
preciso separar as camadas.

### Modelo mental

O modelo é uma **função de continuação de texto**. Ele recebe uma sequência de texto e produz a
continuação mais adequada, um pedaço por vez:

```text
entrada (o prompt inteiro)                        saída, gerada pedaço a pedaço
─────────────────────────────                     ──────────────────────────────
"A capital da França é"        →   [ modelo ]  →  " Paris."
```

Só isso. Tudo que parece mais sofisticado — conversar, decidir, usar ferramentas — é construído
**em cima** dessa função por software comum, escrito por gente, rodando fora do modelo.

Três termos técnicos nascem aqui, e vale fixá-los agora porque todo o material os usa:

- **Token** — a unidade em que o modelo lê e escreve texto. Um token é um pedaço de palavra:
  "certificação" pode virar 3–4 tokens; palavras curtas e comuns costumam ser 1. Tudo na API é
  medido em tokens: o custo (preço por milhão de tokens), os limites e o tamanho do que cabe
  numa chamada.
- **Inference** (inferência) — o ato de *gerar* a saída a partir da entrada. É o que acontece a
  cada chamada de API. Importante: inferência **não altera o modelo**. Os parâmetros do modelo
  foram fixados no treinamento; conversar com ele não o "ensina" nada. O que muda entre uma
  chamada e outra é só o texto de entrada.
- **Context window** (janela de contexto) — o orçamento total de tokens que uma chamada consegue
  processar, somando entrada e saída. Tudo que o modelo "sabe" sobre a sua conversa precisa
  caber aí dentro. Esse orçamento é finito, e a briga por esse espaço é o assunto do Domínio 5
  inteiro.

### Definição

Um **modelo** (identificado por um *model id*, como `claude-opus-5` ou `claude-sonnet-5`) é uma
rede neural treinada pela Anthropic, com parâmetros congelados, que gera texto por inferência,
token a token, dentro de uma context window finita.

O software que envolve o modelo — que fornece ferramentas, administra o contexto, executa
comandos e conversa com o usuário — chama-se **agentic harness**. Claude Code é um harness.
O aplicativo claude.ai é outro. A sua aplicação, quando você a constrói sobre a API, é outro.
O modelo por baixo pode ser exatamente o mesmo; o que muda é o que está em volta.

> ⚠️ **Não confunda:** *o modelo* ≠ *o harness*. Quando o material do Domínio 1 diz que o
> Claude Code "grava a sessão em JSONL" ou "compacta o contexto", é o **harness** fazendo isso —
> software comum, determinístico. Quando diz que o modelo "decidiu delegar", é o **modelo** —
> geração de texto, probabilística. A prova cobra essa fronteira o tempo todo, geralmente sem
> anunciá-la.

> ⚠️ **Não confunda:** *treinar* ≠ *inferir*. "O agente aprendeu com o erro" nunca significa que
> o modelo mudou. Significa que a informação do erro **entrou no texto de entrada** da chamada
> seguinte — e se sair do texto de entrada (por exemplo, quando o histórico é descartado), o
> "aprendizado" some junto.

### O que acontece se…

**…a saída não couber no limite?** Toda chamada declara um teto de tokens de saída
(`max_tokens`, que você vai ler no próximo capítulo). Se a resposta bater no teto, ela **é
cortada no meio da frase** — sem erro, sem aviso no texto. O que avisa é um campo da resposta
chamado `stop_reason`, que diz *por que a geração parou*. Guarde o nome: `stop_reason` é o
personagem principal da seção 3.

### Checkpoint

Responda por escrito antes de abrir a resposta — o que você produz é o que você sabe:

1. Uma sessão do Claude Code apagou um arquivo errado. O *modelo* apagou o arquivo?
2. Depois de 50 turnos corrigindo o estilo de código de um agente, ele "aprendeu" o estilo?
   O que de fato está fazendo as respostas melhorarem?
3. O que é medido em tokens: o custo, o tamanho da conversa, os dois, ou nenhum?

<details>
<summary>Ver respostas</summary>

1. Não. O modelo gerou **texto** pedindo a remoção; quem executou foi o harness (Claude Code),
   que é software rodando na sua máquina. A distinção decide questões de hooks e permissões.
2. Não aprendeu — parâmetros são congelados. As correções estão **no histórico da conversa**,
   que é reenviado a cada chamada. Se o histórico for descartado ou compactado, o "aprendizado"
   desaparece. (É por isso que regra permanente vai para `CLAUDE.md`, como o Domínio 1 §2 mostra.)
3. Os dois. Custo é cobrado por token de entrada e de saída, e a context window é um orçamento
   de tokens. Toda decisão de arquitetura sobre contexto é, no fundo, uma decisão sobre tokens.

</details>

---

## 2. A API é stateless — e tudo decorre disso

Na seção 1, o modelo ficou definido como uma função de texto para texto. Agora vem a pergunta
que essa definição provoca: se o modelo só vê o texto de entrada da chamada atual… **como existe
uma conversa?**

### O problema

Faça o experimento mental. Sua aplicação faz duas chamadas à API, uma depois da outra:

```text
CHAMADA 1                              CHAMADA 2
"Meu nome é Ana."                      "Qual é o meu nome?"
        ↓                                      ↓
"Olá, Ana! Prazer."                    "Você ainda não me disse seu nome."
```

A segunda resposta não é um defeito. O servidor da API **não guardou nada** entre as duas
chamadas — nem o nome, nem o fato de que houve uma primeira chamada. Cada requisição chega,
é processada e é esquecida.

### Definição

Uma API **stateless** (sem estado) é uma API em que o servidor não retém informação entre
requisições: cada chamada precisa carregar, dentro dela mesma, tudo que é necessário para
processá-la. A Messages API — o endpoint `POST /v1/messages`, que é a porta de entrada de tudo
neste material — é stateless.

A consequência, que é a frase mais importante deste módulo:

**A memória da conversa é responsabilidade da aplicação.** O harness guarda o histórico e o
reenvia **inteiro, a cada chamada**. O que a API chama de `messages` não é "a mensagem nova" —
é **a conversa completa até aqui**.

### Modelo mental

```text
CHAMADA 1                                CHAMADA 2
messages: [                              messages: [
  user: "Meu nome é Ana."                  user:      "Meu nome é Ana.",
]                                          assistant: "Olá, Ana! Prazer.",
        ↓                                  user:      "Qual é o meu nome?"
resposta:                                ]
  assistant: "Olá, Ana! Prazer."                 ↓
                                         resposta:
(o servidor esquece tudo)                  assistant: "Ana."
```

A conversa existe **no array `messages` que a sua aplicação mantém** — em nenhum outro lugar.
O modelo, a cada chamada, relê a conversa inteira do zero e continua a partir dela. A sensação
de continuidade é uma construção do lado de quem chama.

### Leitura guiada — Exemplo 1: a requisição mínima

Esta é a menor chamada válida à Messages API. Leia cada campo antes de seguir:

```json
POST https://api.anthropic.com/v1/messages

{
  "model": "claude-opus-5",
  "max_tokens": 1024,
  "messages": [
    { "role": "user", "content": "Explique o que é um token." }
  ]
}
```

**Campo 1 — `model`.**
*O que representa:* qual modelo processa a chamada (seção 1: modelos diferentes, capacidades e
preços diferentes).
*Por que precisamos dele:* a API serve vários modelos; cada chamada escolhe o seu — inclusive
duas chamadas da mesma conversa poderiam usar modelos diferentes.
*Quem o usa:* o roteamento da API, antes de qualquer inferência.
*Se estiver errado:* um id inexistente é rejeitado com erro de requisição — a chamada nem chega
a um modelo.

**Campo 2 — `max_tokens`.**
*O que representa:* o teto de tokens **da saída** desta chamada. Não é "tamanho desejado" — é
limite de corte.
*Por que precisamos dele:* a saída custa dinheiro e ocupa a context window; o teto protege
contra respostas descontroladas.
*Quem o usa:* o gerador — ele para de emitir tokens ao atingir o teto, esteja a frase completa
ou não.
*Se estiver errado (baixo demais):* a resposta volta truncada, com `stop_reason: "max_tokens"`.
Nenhuma exceção é lançada; quem não checa `stop_reason` publica meia resposta.

**Campo 3 — `messages`.**
*O que representa:* a conversa completa, como uma lista de turnos. Cada turno tem `role`
(`user` ou `assistant`) e `content`.
*Por que precisamos dele:* é o único canal pelo qual o modelo sabe o que aconteceu antes —
a API é stateless.
*Quem o usa:* o modelo — isso **é** o prompt.
*Regras de forma:* o primeiro turno é sempre `user`; os papéis descrevem quem "disse" cada
coisa, e é a aplicação quem escreve todos eles ao remontar o histórico.

Duas linhas fora do JSON também trabalham: o header `x-api-key` autentica **a aplicação** (o
usuário final não tem chave — quem fala com a Anthropic é sempre o seu backend), e
`anthropic-version` congela a versão do contrato da API para a chamada.

E a resposta que volta:

```json
{
  "id": "msg_01XYZ",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Um token é a unidade em que o modelo lê e escreve texto..." }
  ],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 18, "output_tokens": 212 }
}
```

Três leituras importam:

- **`content` é um array de blocos**, não uma string. Aqui há um único bloco, de tipo `text`.
  Parece burocracia — até a seção 3, quando um segundo tipo de bloco aparece e esse array se
  torna o mecanismo central da API inteira.

> **Guarde este ponto:** o array de blocos é o que vai permitir que uma mesma resposta contenha
> texto **e** um pedido de ferramenta, lado a lado.

- **`stop_reason: "end_turn"`** — o modelo parou porque considerou a resposta completa. É o
  final feliz. O outro valor que você já conhece é `max_tokens` (corte pelo teto). A tabela
  completa vem na seção 3.
- **`usage`** — a contagem de tokens consumidos, entrada e saída. É daqui que sai o custo, e é
  este campo que os labs do repositório somam para estimar o preço de uma rodada.

### Exemplo 2: a conversa continua — e é você quem a carrega

Para continuar a conversa do Exemplo 1, a aplicação **reenvia tudo** e acrescenta o turno novo:

```json
{
  "model": "claude-opus-5",
  "max_tokens": 1024,
  "messages": [
    { "role": "user",      "content": "Explique o que é um token." },
    { "role": "assistant", "content": "Um token é a unidade em que o modelo lê e escreve texto..." },
    { "role": "user",      "content": "E quantos tokens tem esta frase?" }
  ]
}
```

Repare no que a aplicação fez: pegou o `content` da resposta anterior, gravou-o no array com
`role: "assistant"`, somou a pergunta nova com `role: "user"` e mandou o conjunto. O "e quantos
tokens tem **esta frase**" só faz sentido para o modelo porque a frase anterior está ali, no
mesmo array. É assim que *toda* conversa com Claude funciona, em qualquer produto.

### O que acontece se eu não reenviar o histórico?

O modelo responde à pergunta nova **como se fosse a primeira** — sem contexto, sem o nome da
pessoa, sem as decisões já tomadas. Ele não reclama, não avisa, não "sente falta" de nada:
do ponto de vista dele, aquela é toda a conversa que existe. O sintoma para o usuário é um
assistente com amnésia; o sintoma para o arquiteto é mais sutil — respostas plausíveis,
confiantes e desconectadas do que foi combinado.

E o inverso também tem preço: **reenviar o histórico inteiro a cada chamada significa pagar o
histórico inteiro como tokens de entrada, a cada chamada.** Uma conversa longa fica cara não
porque a resposta cresce, mas porque a *entrada* cresce a cada turno.

> **Guarde este ponto:** esse custo crescente é exatamente o problema que a *compaction* do
> Claude Code administra — e o que ela descarta para caber é o assunto do Domínio 1 §2 e do
> Domínio 5.

### `system` vs. `messages`

Há um terceiro lugar para colocar texto numa chamada: o parâmetro `system` (o *system prompt*).
Ele fica fora do array de mensagens:

```json
{
  "model": "claude-opus-5",
  "max_tokens": 1024,
  "system": "Você é um assistente de suporte da loja Corujita. Responda em português, com no máximo 3 frases.",
  "messages": [
    { "role": "user", "content": "Onde está meu pedido?" }
  ]
}
```

| | `system` | `messages` |
|---|---|---|
| O que carrega | Quem o modelo é, regras do operador, contexto permanente | O diálogo — os turnos de user e assistant |
| Quem escreve | O desenvolvedor da aplicação | O usuário e o modelo (remontados pela aplicação) |
| Muda durante a conversa? | Em geral não — é reenviado igual a cada chamada | Cresce a cada turno |
| Papel na prova | "Instrução de comportamento persistente" | "Histórico, que cresce e um dia não cabe" |

A tabela resume; a distinção que decide questões é esta: **`system` é a voz do operador,
`messages` é a conversa.** Instruções que precisam valer a conversa inteira ficam no `system`
(ou em mecanismos que recarregam a cada turno, como o `CLAUDE.md` do Claude Code), porque o
histórico é o que cresce, dilui e eventualmente se perde. Uma regra dita no primeiro turno de
`messages` é só mais um turno velho competindo por atenção — e o cenário de prova do Domínio 1
§2 é literalmente sobre isso.

### Checkpoint

1. Sua aplicação envia a chamada 2 de uma conversa e esquece de incluir o turno `assistant`
   da chamada 1. O que o modelo "sabe" sobre a própria resposta anterior?
2. Por que o custo por chamada de uma conversa cresce mesmo que as perguntas e respostas
   continuem do mesmo tamanho?
3. Uma regra "responda sempre em português" precisa valer por 200 turnos. `system` ou primeiro
   turno de `messages`? Por quê?

<details>
<summary>Ver respostas</summary>

1. Nada. Para o modelo, a resposta anterior nunca existiu — ele pode inclusive se contradizer,
   com toda a confiança. O que não está no array não está na conversa.
2. Porque a entrada de cada chamada é a conversa inteira até ali. O histórico acumulado é
   reenviado — e cobrado — a cada turno. Entrada cresce ⇒ custo por chamada cresce.
3. `system`. Ele é reenviado igual a cada chamada, com papel de instrução do operador. No
   histórico, a regra é só o turno mais antigo — o primeiro candidato a ser descartado quando o
   contexto apertar.

</details>

---

## 3. Ferramentas: a fronteira entre decidir e executar

Esta é a seção mais importante do módulo. Tudo que a prova chama de *agente* — Domínios 1, 4
e 5 inteiros — é uma elaboração do mecanismo ensinado aqui.

### O problema

A loja Corujita quer que Claude atenda o suporte. Primeiro cliente:
*"Onde está meu pedido #4411?"*

O modelo não tem como responder. A resposta não está nos parâmetros dele (seção 1: conhecimento
congelado no treinamento) e não está no prompt (seção 2: só entra na conversa o que a aplicação
puser lá). A resposta está **no banco de dados da loja** — que a aplicação alcança, e o modelo
não.

As saídas ingênuas não funcionam:

- **Colocar o banco inteiro no prompt?** A context window é um orçamento finito, e o banco muda
  a cada minuto. Inviável e caro.
- **Dar ao modelo acesso direto ao banco?** Além de tecnicamente impossível — o modelo é uma
  função de texto num servidor da Anthropic, sem rede até a sua infraestrutura —, seria
  indesejável. Consultas precisam de validação, permissão e auditoria; débitos e reembolsos,
  mais ainda. Ninguém entrega as chaves do banco a um gerador de texto probabilístico.

O que precisamos é de uma **fronteira entre decisão e execução**: o modelo, que entende o
pedido do cliente, decide *o que* precisa ser feito; a aplicação, que tem o acesso e a
responsabilidade, decide *se* e *como* executar — e devolve o resultado para o modelo continuar.
É essa fronteira que o mecanismo de ferramentas implementa.

### Modelo mental

O ciclo completo, numa conversa com uma ferramenta:

```text
Usuário
  │  "Onde está meu pedido #4411?"
  ▼
Aplicação ──── REQUEST 1: pergunta + catálogo de tools ────►  Claude
                                                                │ decide: preciso
                                                                │ do banco
Aplicação ◄─── RESPONSE 1: "quero lookup_order(4411)" ──────────┘
  │            (stop_reason: tool_use)
  │
  │  a aplicação executa lookup_order("4411") no banco
  │  resultado: "despachado em 19/09"
  ▼
Aplicação ──── REQUEST 2: histórico + tool_result ──────────►  Claude
                                                                │ agora sabe
Aplicação ◄─── RESPONSE 2: "Seu pedido saiu dia 19..." ─────────┘
  │            (stop_reason: end_turn)
  ▼
Usuário
```

Duas chamadas de API, uma execução no meio — feita pela aplicação. O modelo nunca toca o banco;
ele produz um *pedido estruturado* e, mais tarde, recebe o resultado como texto na conversa.

### Analogia: o restaurante

Um garçom anota o pedido do cliente e o leva à cozinha; a cozinha prepara; o garçom serve.

**Mapeamento** — o que cada peça representa:

```text
Cliente        → usuário
Restaurante    → aplicação
Garçom         → Claude
Comanda        → tool_use (o pedido estruturado: prato, ponto da carne, mesa)
Cozinha        → a ferramenta (a função da aplicação, o banco, a API externa)
Prato pronto   → tool_result
```

O que a analogia acerta: o garçom **não cozinha**. Ele entende o cliente, traduz o desejo numa
comanda precisa e interpreta o prato de volta para a mesa. A competência dele é a conversa e a
tradução — exatamente o papel do modelo.

**Limites** — onde a analogia deixa de valer, e vale explicitá-los para não levar a imagem
longe demais:

1. O garçom real *anda até a cozinha*. Claude não vai a lugar nenhum: ele devolve a comanda na
   própria resposta e **fica parado**. Quem "anda" — pega a comanda, aciona a cozinha, traz o
   prato — é a aplicação. Se a aplicação ignorar a comanda, nada acontece, para sempre.
2. O garçom real lembra da mesa. Claude, entre uma chamada e outra, **relê a conversa inteira
   do zero** (seção 2). A continuidade é reconstruída a cada rodada pelo histórico reenviado.

### Definição

Uma **tool** (ferramenta) é uma função da aplicação **descrita** ao modelo em três partes:
um `name`, uma `description` e um `input_schema` — este último escrito em **JSON Schema**, uma
notação padrão para declarar a forma de um objeto JSON: quais campos existem, de que tipo é
cada um e quais são obrigatórios.

O modelo nunca executa a tool. O que ele faz é emitir, dentro de uma resposta, um bloco
**`tool_use`** — o pedido estruturado — e encerrar o turno com **`stop_reason: "tool_use"`**.
A aplicação executa o que quiser com esse pedido e devolve o resultado num bloco
**`tool_result`** na chamada seguinte. Esse par pedido/resultado é o coração de toda
arquitetura agêntica.

### O sistema de suporte — fio condutor do material

A Corujita expõe quatro tools ao seu agente de suporte. Elas voltam a aparecer ao longo dos
domínios, então vale conhecê-las pelo nome:

```text
get_customer(customer_id)      → dados cadastrais e notas da conta
lookup_order(order_id)         → status, transportadora e prazo de um pedido
process_refund(order_id, amount) → emite um reembolso (ação com consequência real!)
escalate_to_human(summary)     → abre um chamado para um atendente humano
```

Repare que as quatro têm naturezas diferentes: duas são leituras inofensivas, uma move dinheiro
e uma transfere a decisão para uma pessoa. O Domínio 1 §8 constrói em cima exatamente dessa
diferença.

### Leitura guiada — Exemplo 3: a requisição com tools

A aplicação declara o catálogo no parâmetro `tools`. Versão com uma tool só, para leitura:

```json
{
  "model": "claude-opus-5",
  "max_tokens": 1024,
  "tools": [
    {
      "name": "lookup_order",
      "description": "Busca o status atual de um pedido pelo número. Use quando o cliente perguntar sobre entrega, atraso ou a situação de um pedido específico.",
      "input_schema": {
        "type": "object",
        "properties": {
          "order_id": {
            "type": "string",
            "description": "Número do pedido, sem o '#'. Ex.: 4411"
          }
        },
        "required": ["order_id"]
      }
    }
  ],
  "messages": [
    { "role": "user", "content": "Onde está meu pedido #4411?" }
  ]
}
```

**Campo 1 — `name`.**
*O que representa:* o identificador da tool — é ele que o modelo escreve no pedido e que a
aplicação usa para rotear a execução.
*Se estiver errado (vago):* `lookup` diz pouco; `lookup_order` diz o que busca. O modelo escolhe
tools pelo que consegue entender delas.

**Campo 2 — `description`.**
*O que representa:* a instrução que ensina o modelo **quando** usar a tool — não apenas o que
ela faz. Repare na segunda frase do exemplo: "Use quando o cliente perguntar sobre…".
*Por que precisamos dela:* o modelo decide entre as tools do catálogo lendo as descriptions.
Elas são **prompt**, não documentação para humanos.
*Se estiver errado:* uma description vaga (ou duas quase idênticas em tools diferentes) produz
escolhas erradas de ferramenta — o modelo não erra com erro, ele escolhe a opção plausível.

> **Guarde este ponto:** "a description é um contrato" é um subtópico inteiro do Domínio 4, com
> exemplos de description boa e ruim para a mesma tool.

**Campo 3 — `input_schema`.**
*O que representa:* a forma exata do argumento que a tool aceita, em JSON Schema: um objeto
com a propriedade `order_id` do tipo `string`, obrigatória (`required`).
*Por que precisamos dele:* é o que permite ao modelo montar um pedido **executável** — e à
aplicação validar o que chegou antes de rodar.
*Um detalhe que passa batido:* a `description` de **cada campo** do schema também é prompt.
"Sem o `#`" no exemplo está lá para o modelo normalizar a entrada — instrução, não comentário.

Como as partes se relacionam: `name` identifica, `description` decide o *quando*, `input_schema`
decide o *como*. Os três juntos são a **tool definition** — a anatomia que o Domínio 4 estuda a
fundo.

### Exemplo 4: a resposta que pede uma ferramenta

O modelo lê a pergunta, lê o catálogo e responde **isto** — leia com atenção, porque este JSON
é provavelmente o mais cobrado da certificação:

```json
{
  "id": "msg_01ABC",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Vou consultar o status do seu pedido." },
    {
      "type": "tool_use",
      "id": "toolu_01A2B3C4",
      "name": "lookup_order",
      "input": { "order_id": "4411" }
    }
  ],
  "stop_reason": "tool_use"
}
```

Agora o array de blocos da seção 2 mostra a que veio: **a mesma resposta carrega um bloco de
texto e um bloco `tool_use`**, lado a lado.

**Bloco `tool_use`, campo a campo:**

- **`type: "tool_use"`** — o tipo do bloco. É a comanda do restaurante.
- **`id`** — o identificador único **deste pedido específico** (`toolu_…`). Pense nele como o
  número da comanda: quando o prato voltar da cozinha, ele volta com esse número, para não haver
  dúvida de qual pedido ele atende. Você vai reencontrá-lo já no Exemplo 6, como `tool_use_id`.
- **`name`** — qual tool o modelo escolheu, pelo `name` declarado no catálogo.
- **`input`** — os argumentos, montados pelo modelo na forma que o `input_schema` declarou.
  Repare: o cliente escreveu `#4411`, e o `input` traz `"4411"` — a description do campo fez
  o seu trabalho de prompt.

E o campo que costura tudo:

- **`stop_reason: "tool_use"`** — o modelo parou de gerar **porque precisa de você**. A resposta
  terminou "no meio" de propósito: o turno está suspenso, aguardando o resultado da ferramenta.

Aqui vale parar e responder explicitamente a pergunta que dá nome à seção. **Por que o modelo
não executa a ferramenta?** Por duas razões independentes, e a prova explora as duas:

1. **Não tem como.** O modelo é inferência num servidor da Anthropic (seção 1). O banco da
   Corujita está na infraestrutura da Corujita. Não existe caminho físico — a única saída do
   modelo é texto.
2. **Não deve.** A execução é onde moram as consequências: dinheiro, dados, efeitos
   irreversíveis. A fronteira obriga essas consequências a passar pelo código da aplicação,
   onde há validação, permissão, log e a chance de dizer não.

Já que `stop_reason` apareceu pela terceira vez, eis a tabela completa — os três primeiros
valores são os que decidem questões:

| `stop_reason` | O que significa | O que a aplicação faz |
|---|---|---|
| `end_turn` | O modelo considerou a resposta completa | Usa o conteúdo; o turno acabou |
| `tool_use` | O modelo pediu ferramenta(s) e está esperando | Executa e devolve `tool_result` |
| `max_tokens` | A saída bateu no teto e foi **cortada** | Trata como resposta incompleta — aumentar o teto, ou continuar |
| `stop_sequence` | A saída atingiu uma sequência de parada configurada | Depende do uso que a aplicação faz dela |
| `pause_turn` | Um turno longo (ex.: com tools do lado do servidor) foi pausado | Reenvia a conversa como está para o modelo continuar |
| `refusal` | O modelo se recusou a continuar por segurança | Não repete cegamente; trata o caso |

A leitura da tabela que importa: `stop_reason` é **o campo de controle do protocolo**. A cada
resposta, é ele que diz à aplicação qual é o próximo passo — seguir, executar ferramenta, ou
tratar um corte. Ignorá-lo é dirigir sem olhar o painel.

### Exemplo 5: a aplicação executa

O que acontece agora **não é uma chamada de API** — é o código da sua aplicação, rodando na sua
infraestrutura:

```text
para cada bloco da resposta com type == "tool_use":
    se bloco.name == "lookup_order":
        resultado = banco.consultarPedido(bloco.input.order_id)
```

Três observações que valem nota de estudo:

- **Este código é seu.** A API não sabe nem pergunta o que você fez com o pedido. Você pode
  executar, recusar, pedir confirmação a um humano, logar e só então executar.
- **É aqui que moram os controles.** Validação do `input` (nunca confie cegamente — o modelo
  monta o input seguindo o schema, mas quem garante os limites do negócio é você), verificação
  de permissão, auditoria.

> **Guarde este ponto:** os *hooks* do Claude Code (Domínio 1 §6) e o sistema de permissões
> (Domínio 2) são exatamente isto — pontos de controle do harness **entre o pedido do modelo e
> a execução**. Quando você chegar lá, lembre deste exemplo: o hook `PreToolUse` roda neste
> instante do ciclo.

- **A execução produz um resultado em texto/JSON** — e ele precisa voltar para o modelo, que
  continua parado à espera.

### Exemplo 6: devolvendo o resultado — `tool_result`

A aplicação monta a **segunda chamada**: o histórico inteiro (seção 2 — sempre o histórico
inteiro!), incluindo a resposta do modelo com o `tool_use`, mais um turno novo com o resultado:

```json
{
  "model": "claude-opus-5",
  "max_tokens": 1024,
  "tools": [ { "name": "lookup_order", "description": "...", "input_schema": { "...": "..." } } ],
  "messages": [
    { "role": "user", "content": "Onde está meu pedido #4411?" },
    {
      "role": "assistant",
      "content": [
        { "type": "text", "text": "Vou consultar o status do seu pedido." },
        { "type": "tool_use", "id": "toolu_01A2B3C4", "name": "lookup_order",
          "input": { "order_id": "4411" } }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01A2B3C4",
          "content": "status: despachado em 19/09; transportadora: Loggi; previsão de entrega: 24/09"
        }
      ]
    }
  ]
}
```

**Leitura guiada do turno novo:**

- **`role: "user"`** — surpresa frequente: o resultado da ferramenta entra na conversa **como
  turno de user**, não de assistant e não de um papel especial "tool". A lógica do protocolo:
  `assistant` é o que o modelo disse; **tudo que chega até o modelo vem "do lado de fora", e o
  lado de fora fala com `role: user`** — seja o humano digitando, seja a aplicação entregando
  um resultado de ferramenta.
- **`type: "tool_result"`** — o bloco-resposta da comanda.
- **`tool_use_id`** — o número da comanda, copiado do `id` do bloco `tool_use`. É o elo que diz
  *qual* pedido este resultado atende. Com várias ferramentas em voo, é ele que impede a
  cozinha de entregar o prato na mesa errada.
- **`content`** — o resultado em si, serializado como texto (ou blocos). O modelo vai ler isto
  como parte da conversa.
- **`is_error`** (não usado acima) — quando a execução **falha**, devolva o erro assim:
  `{ "type": "tool_result", "tool_use_id": "...", "content": "pedido não encontrado", "is_error": true }`.
  Devolver o erro é melhor que esconder: o modelo reage — tenta outro caminho, pede
  esclarecimento — em vez de esperar para sempre por um resultado que não vem.

E duas regras de forma que derrubam implementações reais:

- O turno `assistant` com o bloco `tool_use` **precisa estar no histórico reenviado**. Cada
  `tool_result` deve corresponder a um `tool_use` da mensagem anterior; se a aplicação "limpar"
  o histórico e remover o pedido — ou trocar o `tool_use_id` — a API **rejeita a requisição com
  erro de validação** antes mesmo de chegar ao modelo.
- Uma resposta pode conter **vários blocos `tool_use`** (chamadas em paralelo). A aplicação
  executa todos e devolve **todos os `tool_result` numa única mensagem `user`** — um por
  `tool_use_id`.

### Exemplo 7: a resposta final

Com o resultado em mãos — quer dizer, no contexto — o modelo completa o trabalho:

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Boa notícia: seu pedido #4411 foi despachado no dia 19/09 pela Loggi, com previsão de entrega para 24/09." }
  ],
  "stop_reason": "end_turn"
}
```

`stop_reason: "end_turn"` fecha o ciclo: não há mais pedidos pendentes, a resposta é para o
usuário. O fluxo inteiro, visto de cima:

```text
REQUEST 1  (tools + pergunta)
   ↓
RESPONSE 1 (stop_reason: tool_use)      ← o modelo DECIDIU
   ↓
APLICAÇÃO EXECUTA                       ← a única etapa em que algo acontece no mundo
   ↓
REQUEST 2  (histórico + tool_result)
   ↓
RESPONSE 2 (stop_reason: end_turn)      ← o modelo CONCLUIU
```

### O que acontece se…

**…a aplicação ignorar o `tool_use` e mostrar a resposta ao usuário?** O usuário lê "Vou
consultar o status do seu pedido." — e nada mais acontece, nunca. O turno está suspenso à
espera de um `tool_result` que não virá. Não há erro, não há timeout do lado do modelo: há uma
conversa quebrada. Toda aplicação sobre a Messages API **precisa** tratar
`stop_reason: "tool_use"`; não é um caso opcional do protocolo.

**…o `tool_use_id` do resultado não casar com nenhum pedido?** Erro de validação na API — a
requisição é rejeitada. O elo pedido↔resultado é verificado estruturalmente.

**…a ferramenta falhar e a aplicação não devolver nada?** O mesmo turno suspenso do primeiro
caso. O contrato é: pediu, respondeu — nem que a resposta seja `is_error: true`.

**…duas tools tiverem descriptions quase idênticas?** O modelo não tem como distinguir quando
usar cada uma; a escolha vira sorteio plausível. O sintoma é intermitente — o pior tipo — e o
conserto é reescrever as descriptions até um humano de fora conseguir dizer, só por elas, qual
tool usar em qual situação. (Domínio 4 volta nisso com exemplos ✅/❌.)

### ⚠️ Não confunda

> ⚠️ **Não confunda:** Claude **solicitar** uma ferramenta ≠ Claude **executar** a ferramenta.
> O modelo só produz o pedido (`tool_use`). Execução é sempre da aplicação/harness. Em toda
> questão de prova que diga "o modelo executou…", desconfie do enunciado — o que executa é o
> harness, e essa diferença costuma ser a chave da resposta.

> ⚠️ **Não confunda:** `tool_use` ≠ `tool_result`. São os dois lados da mesma transação, com
> autores opostos: `tool_use` é escrito **pelo modelo** (num turno assistant); `tool_result` é
> escrito **pela aplicação** (num turno user). Se você souber *quem escreve* cada bloco, metade
> das pegadinhas de protocolo desarma.

> ⚠️ **Não confunda:** `tools` (o catálogo declarado na requisição) ≠ `tool_use` (um pedido
> concreto numa resposta). Declarar uma tool não obriga o modelo a usá-la — por padrão
> (`tool_choice: auto`), usar ou não é decisão dele.

Sobre esse último ponto: existe um parâmetro, `tool_choice`, que controla a decisão — `auto`
(o modelo decide; padrão), `any` (é obrigado a chamar alguma tool), `tool` (é obrigado a chamar
uma tool específica) e `none` (proibido de chamar).

> **Guarde este ponto:** as diferenças entre `auto`, `any`, `tool` e `none` — e o uso de
> `tool_choice` para forçar saída estruturada — são assunto dos Domínios 3 e 4. Por ora, basta
> saber que o padrão é `auto` e que o catálogo não obriga nada.

### Checkpoint — preveja o comportamento

1. A aplicação recebe uma resposta cujo `content` tem **dois** blocos `tool_use`
   (`get_customer` e `lookup_order`), `stop_reason: "tool_use"`. Descreva exatamente o que ela
   deve enviar na próxima requisição.
2. Um desenvolvedor, "por limpeza", remove do histórico os turnos antigos de tool_use/tool_result
   antes de cada chamada — inclusive o par da rodada corrente. O que acontece?
3. `lookup_order` lançou uma exceção de banco. O que a aplicação envia ao modelo?

<details>
<summary>Ver respostas</summary>

1. O histórico inteiro (incluindo o turno assistant com os dois `tool_use`) mais **uma única**
   mensagem `user` contendo **dois** blocos `tool_result`, cada um com o `tool_use_id` do pedido
   que atende. Executar os dois antes de responder; nunca dividir os resultados em duas
   mensagens.
2. Se remover o par da rodada corrente, a API rejeita a requisição com erro de validação — o
   `tool_result` fica órfão do seu `tool_use`. (Sobre os pares antigos: o mecanismo correto para
   contexto que cresceu demais é compaction/gestão de contexto, Domínio 5 — não amputação manual
   que quebra o protocolo.)
3. `{ "type": "tool_result", "tool_use_id": "...", "content": "<mensagem de erro útil>",
   "is_error": true }`. O modelo reage ao erro; silêncio deixa o turno suspenso, e inventar um
   resultado seria pior.

</details>

### Cenário de prova

*Uma aplicação de suporte recebeu de `POST /v1/messages` uma resposta com
`stop_reason: "tool_use"`. Qual deve ser a próxima ação da aplicação?*

A cadeia de raciocínio, no formato que vale para toda questão desse tipo:

```text
1. stop_reason: "tool_use" significa: o modelo suspendeu o turno para pedir ferramenta(s).
2. Portanto Claude ainda NÃO terminou — o texto que veio junto não é a resposta final.
3. A aplicação precisa: extrair cada bloco tool_use (name, input, id) e executá-los ela mesma.
4. Depois precisa: enviar nova requisição com o histórico completo + um tool_result por
   pedido, casando cada tool_use_id, numa única mensagem user.
5. Somente então Claude poderá continuar — e a nova resposta trará outro stop_reason,
   que pode ser end_turn (acabou) ou tool_use de novo (o ciclo continua).
```

Os distratores clássicos: "exibir o texto ao usuário e aguardar" (ignora o protocolo — turno
suspenso), "reenviar a mesma requisição" (nada mudou; o modelo pedirá de novo) e "a API executa
a ferramenta automaticamente" (viola a fronteira decisão/execução — a API nunca executa tools
declaradas pela aplicação).

---

## 4. Do ciclo ao agent loop

A seção 3 fechou um ciclo de **uma** ferramenta. O passo final do módulo é ver o que acontece
quando ninguém sabe, de antemão, quantas ferramentas a tarefa vai exigir.

### O problema

*"Quero devolver o produto do meu último pedido."* Para atender, o agente da Corujita
provavelmente precisa de `get_customer` (descobrir quem é e achar o último pedido), depois
`lookup_order` (conferir elegibilidade), depois talvez `process_refund` — ou
`escalate_to_human`, dependendo do que as consultas revelarem. **Três ou quatro rodadas do
ciclo, encadeadas, em que cada decisão depende do resultado anterior.**

A aplicação não pode codificar essa sequência de antemão, porque a sequência certa depende dos
dados. O que ela pode fazer é **repetir o ciclo da seção 3 até o modelo dizer que acabou** —
e o sinal de "acabou" ela já conhece.

### Modelo mental — o loop

```text
messages = [ pergunta do usuário ]

repita:
    response = POST /v1/messages  (model, tools, messages)     # seção 3, request
    messages += response.content                               # grava o turno do assistant
                                                               # (com os tool_use dentro!)
    se response.stop_reason == "tool_use":
        para cada bloco tool_use em response.content:
            resultado = executar(bloco.name, bloco.input)      # o código é SEU
            messages += tool_result(bloco.id, resultado)       # numa única msg user
        # volta ao topo — o modelo decide o próximo passo
    senão:
        pare — a resposta final está em response.content
```

Leia o pseudocódigo linha a linha, porque cada linha é uma regra já estudada:

- `messages += response.content` — o histórico completo, sempre, incluindo os blocos `tool_use`
  (seções 2 e 3). Quem grava só o texto quebra o elo do `tool_use_id`.
- `se stop_reason == "tool_use"` — **eis onde `stop_reason` entra no fluxo**: ele é a condição
  do laço. Não é um campo informativo; é o sinal de controle que decide se o loop continua ou
  termina.
- `executar(...)` — a fronteira da seção 3, agora dentro de um laço. Cada iteração passa pelo
  seu código; cada iteração é uma chance de validar, negar, logar.
- `senão: pare` — `end_turn` encerra. (Uma implementação real também trata `max_tokens`,
  `refusal` e um limite máximo de iterações — um agente que nunca para é um incidente à
  espera.)

Esse laço tem nome: **agent loop** (ou *agentic loop*). Um **agente** é isto — um modelo dentro
de um loop de ferramentas, dirigindo os próprios passos, com a aplicação executando e devolvendo
resultados a cada volta.

### Definição

**Agent loop** é o laço `chamar o modelo → executar as tools pedidas → devolver resultados →
repetir` que se encerra quando o modelo para de pedir ferramentas. O software que implementa
esse laço e fornece as ferramentas é o **agentic harness** (seção 1).

E aqui as camadas do módulo se encaixam de vez: **Claude Code e o Claude Agent SDK são
harnesses prontos** — o mesmo loop acima, já escrito, com ferramentas embutidas (ler e editar
arquivos, rodar comandos, buscar na web), gestão de contexto e controles de permissão. Quando
você digita no Claude Code, ele monta o array `messages`, chama a mesma Messages API deste
módulo, executa os `tool_use` que o modelo emite e devolve os `tool_result`. Não há mágica
nova; há o ciclo da seção 3, industrializado.

### Comparação: Messages API crua vs. Agent SDK vs. Claude Code

| | Messages API | Claude Agent SDK | Claude Code |
|---|---|---|---|
| Quem escreve o agent loop | **Você** | O SDK | O produto |
| Ferramentas | Só as que você definir | Embutidas (Read, Write, Bash, Grep…) + as suas via MCP | Embutidas + as suas via MCP |
| Gestão de contexto (compaction etc.) | Você | O SDK | O produto |
| Forma de uso | HTTP/SDK, requisição a requisição | Biblioteca (`query()` em TypeScript/Python) | CLI interativo ou `-p` em script |
| Você usa quando… | precisa de controle total do loop, ou o loop nem existe (chamada única) | quer construir **seu** agente sem reescrever o harness | quer **usar** um agente pronto no terminal/CI |

A tabela compara; a régua para decidir é uma só: **quanto do harness você quer possuir?** Para
extrair um campo de um documento, não há loop — Messages API, chamada única. Para construir um
orquestrador próprio (como o lab do Domínio 1), o Agent SDK dá o loop e o isolamento de sessões,
e você fica com a lógica. Para trabalhar num repositório, Claude Code é o harness completo.
Possuir mais do harness compra controle e custa manutenção — esse tradeoff reaparece na prova
em forma de cenário.

### A ponte para o Domínio 1

A documentação do Claude Code descreve o trabalho de um agente em três fases: **gather context →
take action → verify results → repeat**. Você já conhece esse ciclo — é o agent loop visto de
mais alto:

```text
gather context   →  o que entra em `messages` (histórico, arquivos, tool_results anteriores)
take action      →  os blocos tool_use que o modelo emite e o harness executa
verify results   →  ler o tool_result e conferir se funcionou (testes, build, validador)
repeat           →  o laço, governado por stop_reason
```

O que o Domínio 1 acrescenta a este esqueleto é a camada de **arquitetura**: o que fazer quando
a conversa não cabe na janela (sessões e compaction), quando a tarefa é grande demais para um
loop só (subagentes e paralelismo), quando um passo não pode depender da boa vontade do modelo
(hooks) e quando a decisão não é do agente (escalonamento humano). Cada uma dessas peças assume
que você enxerga o loop por baixo — e agora você enxerga.

### Cenário de prova

*Um desenvolvedor implementou o loop mas gravava no histórico apenas o TEXTO das respostas do
modelo (descartando os demais blocos do `content`). As chamadas seguintes à API passaram a ser
rejeitadas com erro de validação sempre que uma ferramenta era usada. Por quê?*

```text
1. O turno assistant gravado no histórico perdeu os blocos tool_use (só o texto sobrou).
2. O tool_result enviado em seguida referencia um tool_use_id…
3. …que não existe em lugar nenhum do histórico reenviado — o elo pedido↔resultado quebrou.
4. A API valida essa correspondência estruturalmente e rejeita a requisição.
5. Correção: gravar `response.content` INTEIRO no histórico, sempre — texto e tool_use juntos.
```

O distrator clássico oferece "aumentar `max_tokens`" ou "usar `tool_choice: auto`" — parâmetros
reais, irrelevantes para um erro que é de **forma do histórico**, não de geração.

---

## O que você precisa realmente entender

Não é um resumo do texto — são os modelos mentais que precisam estar de pé antes do Domínio 1:

1. **Três camadas, três responsáveis.** Modelo (gera texto, probabilístico) ≠ harness (executa,
   determinístico) ≠ protocolo (a Messages API ligando os dois). Toda questão de "quem faz o
   quê" se resolve identificando a camada.
2. **Stateless: a conversa é o array.** O servidor não guarda nada; `messages` reenviado inteiro
   é a única memória. Continuidade é construção da aplicação — e custa tokens de entrada a cada
   turno.
3. **A fronteira decisão/execução.** O modelo emite `tool_use` (um pedido); a aplicação executa
   e devolve `tool_result` (numa mensagem `user`, casando o `tool_use_id`). O modelo nunca
   executa nada.
4. **`stop_reason` é controle, não informação.** Ele diz à aplicação o próximo passo do
   protocolo — e é a condição de parada do agent loop.
5. **Agente = modelo + loop + ferramentas + verificação.** Claude Code e o Agent SDK são esse
   loop, pronto. *Gather context → take action → verify results → repeat* é o mesmo ciclo, com
   nome de gente grande.
6. **Descriptions e schemas são prompt.** O modelo decide *quando* usar cada tool lendo a
   description, e monta o *input* lendo o schema. Texto ruim ali produz comportamento ruim —
   sem nenhuma mensagem de erro.

## Se você lembrar apenas de 3 coisas

1. **A API é stateless — a conversa inteira viaja em `messages`, a cada chamada.**
2. **O modelo decide; a aplicação executa.** `tool_use` é pedido, `tool_result` é resposta, e
   `tool_use_id` é o elo entre os dois.
3. **`stop_reason` governa o loop:** `tool_use` = execute e devolva; `end_turn` = acabou.

---

**Próximo assunto:** [Domínio 1 — Agentic Architecture & Orchestration](../01-agentic-architecture/notas.md),
onde este loop ganha verificação, sessões, subagentes, hooks e os critérios de arquitetura que
valem 27% da prova.
