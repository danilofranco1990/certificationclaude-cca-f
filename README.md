# Preparação — Claude Certified Architect – Foundations (CCAR-F)

Painel de controle do estudo para a certificação **Claude Certified Architect – Foundations
(CCAR-F)**, da Anthropic, aplicada pela **Pearson VUE** em modalidade **proctored** (com
supervisão remota ou em centro de testes). Preço listado: **US$ 125**.

Programa de estudo de 12 semanas, organizado pelos cinco domínios oficiais do syllabus,
fechando com um projeto integrador e dois simulados cronometrados.

## Como usar este repositório para estudar

Este repositório não é um curso para ler de ponta a ponta: é um **programa de estudo com método**.
Cada domínio da prova vira quatro artefatos (notas, armadilhas, lab, questões), e cada artefato
tem um jeito próprio de ser estudado. O que todos têm em comum: **você produz alguma coisa
antes de conferir** — uma frase, uma letra, uma previsão. Reler não conta como estudo.

### 1. Pré-requisitos

| Para quê | O que precisa |
|---|---|
| Ler o material | Só um editor ou o GitHub — tudo é markdown |
| Ler como site (opcional) | [Node.js](https://nodejs.org) 20+ |
| Rodar os labs | Node.js 20+ e uma sessão do [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) já autenticada (ou `ANTHROPIC_API_KEY`) |
| Usar a skill `/visualizar-conceito` | O [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) e um navegador (Chrome recomendado) |

### 2. Clonar e abrir

```bash
git clone https://github.com/danilofranco1990/certificationclaude-cca-f.git
cd certificationclaude-cca-f
npm install          # só é necessário para gerar o site de leitura
```

### 3. Siga a ordem: três guias, três perguntas

| Guia | Responde | Quando abrir |
|---|---|---|
| [`ROTEIRO.md`](./ROTEIRO.md) | **Em que ordem?** — checklist executável, etapa por etapa, com o critério para avançar | Toda sessão de estudo: é o seu ponto de partida |
| [`cronograma.md`](./cronograma.md) | **Quando?** — as 12 semanas, com o entregável de cada uma | Para planejar a semana |
| [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md) | **Como?** — o método de cada artefato e como classificar erros | Uma vez, antes de começar, e de novo quando o estudo parecer não render |

**Rotina de cada sessão:** abra o `ROTEIRO.md`, pegue a próxima caixa desmarcada, estude pelo
método daquele artefato, marque a caixa. Comece sempre pelo
[Módulo 0 — Fundamentos](./dominios/00-fundamentos/notas.md).

### 4. Os quatro artefatos de cada domínio

Cada domínio vive em `dominios/NN-<nome>/` e segue esta sequência:

| # | Artefato | Como estudar | Está dominado quando |
|---|---|---|---|
| 1 | `notas.md` | **Leitura ativa**: leia uma seção, responda o `### Checkpoint` por escrito *antes* de abrir as respostas, feche o arquivo e escreva de memória o critério de `### Quando usar` | você reproduz o critério sem olhar |
| 2 | `armadilhas.md` | **Recuperação ativa**: leia só o título `### A vs. B` e enuncie a diferença antes de abrir o texto | você enuncia o critério só com o título |
| 3 | `lab/` | **Três passagens**: leia o `## Critério de "funcionou"`, *preveja por escrito* onde vai falhar, e só então rode e provoque a falha no `## Roteiro de quebra` | você acerta a previsão antes de rodar |
| 4 | `questions.md` + `gabarito.md` | **Condição de prova**: responda sem consulta, cronometrado, e só depois abra o gabarito | ≥ 80% de acerto, cada erro classificado por causa |

> **Registre os erros.** Todo erro — e todo acerto com hesitação — vai para `simulados/erros.md`,
> classificado como *desconhecimento*, *desatenção* ou *confusão entre conceitos*. Cada causa
> pede um remédio diferente (estudar, ler com calma, comparar os pares). Detalhes em
> [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md) §3.

### 5. Ler como site (opcional)

```bash
npm run build
```

Abra `site/index.html` no navegador para ler tudo numa versão HTML responsiva, com navegação por
domínio. Detalhes na seção [Ler como site](#ler-como-site) mais abaixo.

### 6. Ver o conceito funcionando: a skill `/visualizar-conceito`

Alguns conceitos — o ciclo `tool_use`, o agent loop, hooks, regras de decisão — não entram só
lendo. Para esses casos o repositório traz uma **skill do Claude Code** que transforma o trecho
que você não entendeu num **simulador HTML interativo**: você aperta Play, pausa, volta,
escolhe uma alternativa e vê as consequências no estado da simulação.

**Como a skill chega até você.** Ela está em
[`.claude/skills/visualizar-conceito/`](./.claude/skills/visualizar-conceito/SKILL.md) — uma
skill **de projeto**, versionada junto com o repositório. Basta abrir o Claude Code *dentro da
pasta clonada*; não há nada para instalar:

```bash
cd certificationclaude-cca-f
claude
```

**Como usar — duas formas de chamar:**

```text
# (a) apontando para um arquivo do material
/visualizar-conceito dominios/01-agentic-architecture/notas.md

# (b) colando o trecho que você não entendeu, logo depois do comando
/visualizar-conceito Um subagente recebe apenas o prompt que o orquestrador escreve; ele não
enxerga o histórico do pai. O resultado volta como texto único para o contexto do pai.
```

Sem argumento, a skill pergunta o que você quer visualizar. Também dispara sozinha se você disser
algo como *"não entendi, quero ver funcionando"*, *"simula isso"* ou *"visualiza esse fluxo"*.

**O que acontece em seguida:**

1. A skill lê o material inteiro e escolhe **um recorte** (um ciclo, uma transição, uma regra),
   avisando o que ficou de fora.
2. Monta o modelo antes de desenhar: participantes, estados, eventos, decisões e
   causa → efeito. Escolhe a representação pelo assunto — diagrama de sequência para protocolos,
   máquina de estados para `stop_reason`, camadas para "quem faz o quê", parâmetros ajustáveis
   para regras de decisão.
3. Gera **um único arquivo HTML**, sem dependências externas, e o salva em
   `visualizacoes/AAAA-MM-DD-<origem>-<conceito>.html` (nunca sobrescreve um existente).
4. Abre no Chrome e **testa de verdade** — Play, Pausar, Voltar, troca de decisão, console sem
   erros, largura de celular e tema escuro — e relata o que foi e o que não foi testado.
5. Registra o novo simulador na tabela de [`visualizacoes/README.md`](./visualizacoes/README.md).

**Como ler o simulador.** Cada fato exibido traz uma etiqueta: **material** (está no texto de
origem), **doc oficial** (confirmado na documentação, com data e URL) ou **simulação** (hipótese
criada para o exemplo). Os simuladores **não fazem chamadas reais** à API — tudo é simulado
localmente. Sempre que uma decisão aparece, o avanço automático para e espera a sua escolha;
voltar e trocar a escolha descarta o caminho anterior.

**Quando usar:** logo depois de travar num checkpoint ou numa questão errada, como parte do
ciclo de erro. **Quando não usar:** a skill não serve para resumo, slides, questionário ou
animação decorativa — se o conteúdo não tem estado nem decisão, releia a nota.

Os simuladores já gerados estão em [`visualizacoes/`](./visualizacoes/README.md) e abrem direto
no navegador (duplo clique no `.html`), sem servidor — bons para rever um conceito ou para ver
o formato antes de pedir o seu.

### 7. Mapa do repositório

```text
README.md               painel de progresso (esta página)
ROTEIRO.md              o caminho, na ordem — comece aqui a cada sessão
COMO-ESTUDAR.md         o método de cada artefato
cronograma.md           as 12 semanas
dominios/
  00-fundamentos/       módulo 0: o que todos os domínios assumem
  01-…05-*/             notas.md, armadilhas.md, questions.md, gabarito.md, lab/
labs/projeto-integrador/   projeto final que junta os domínios
simulados/              simulados cronometrados + erros.md (registro de erros)
referencias/            glossário e links oficiais
visualizacoes/          simuladores HTML gerados pela skill
.claude/skills/         a skill /visualizar-conceito
tools/                  gerador do site de leitura
docs/superpowers/       spec e planos que deram origem ao programa
```

> Domínios 2–5, projeto integrador e simulados ainda estão por construir — ver o painel abaixo.

---

## Trilha de estudo

```text
Módulo 0 (fundamentos) → Domínio 1 → Domínio 2 → Domínio 3 → Domínio 4 → Domínio 5
                                                → Projeto integrador → Simulados 01 e 02
```

O passo a passo executável dessa trilha — com o que abrir, o que produzir e o critério para
avançar em cada etapa — está em [`ROTEIRO.md`](./ROTEIRO.md).

Comece pelo [`Módulo 0 — Fundamentos`](./dominios/00-fundamentos/notas.md): ele ensina do zero o
que todos os domínios assumem (o modelo, a API stateless, o ciclo `tool_use`, o agent loop).
Não é domínio de prova — não tem peso nem checkpoint de questões, e por isso fica fora da tabela
abaixo —, mas **nenhum domínio deve ser aberto antes dele**. Quem já domina o ciclo de
ferramentas na prática usa os `### Checkpoint` do módulo como autoteste rápido e segue adiante.

## Progresso por domínio

| Domínio | Peso | Notas | Armadilhas | Lab | Questões | Checkpoint % |
|---|---|---|---|---|---|---|
| 1. Agentic Architecture & Orchestration | 27% | [x] | [x] | [x] | [x] | — |
| 2. Claude Code Configuration & Workflows | 20% | [ ] | [ ] | [ ] | [ ] | — |
| 3. Prompt Engineering & Structured Output | 20% | [ ] | [ ] | [ ] | [ ] | — |
| 4. Tool Design & MCP Integration | 18% | [ ] | [ ] | [ ] | [ ] | — |
| 5. Context Management & Reliability | 15% | [ ] | [ ] | [ ] | [ ] | — |

> Esta tabela e a seção "Próximo passo" são atualizadas ao fechar cada task — antes do commit
> daquela task, nunca depois — para que o painel nunca fique desatualizado.

> Pesos por domínio vêm de fonte secundária — **a confirmar com o Exam Guide oficial** assim
> que estiver disponível (ver "Pendências externas" abaixo).

## Próximo passo

Executar a Task 3 do plano: Domínio 2 — Claude Code Configuration & Workflows (20%), com
`notas.md`, `armadilhas.md`, o lab de configuração e as 20 questões — **já sob o template
didático** (itens 8–12 do template de módulo; o Domínio 1 reescrito é o modelo de referência).

> Revisão pedagógica de 2026-09-22 entregue (plano em
> [`docs/superpowers/plans/2026-09-22-revisao-pedagogica.md`](./docs/superpowers/plans/2026-09-22-revisao-pedagogica.md)):
> novo Módulo 0 de fundamentos (o ciclo `tool_use` ensinado do zero), `notas.md` do Domínio 1
> reescrito no arco problema → modelo mental → definição → checkpoint → cenário (com visão
> geral, reconstrução e resumos finais), glossário com os termos de fundamentos, e o template
> de módulo do plano mestre atualizado para os Domínios 2–5 nascerem nesse formato. Nenhuma
> célula da tabela muda — armadilhas, lab e questões do Domínio 1 seguem os mesmos.

> Task 11 entregue: `npm run build` gera o site de leitura (ver "Ler como site" abaixo). Os
> Domínios 2–5 já nascem renderizáveis, sem mexer no gerador. Nenhuma célula de domínio muda —
> esta task não fecha domínio nenhum.

> Task 10 entregue: [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md) define o método de uso de cada
> artefato, e o lab do Domínio 1 ganhou seu `## Roteiro de quebra` com cinco experimentos.

> Domínio 1 entregue (notas, armadilhas, lab e 20 questões). O `Checkpoint %` da linha 1 segue
> vazio de propósito: ele só é preenchido depois de responder
> [`dominios/01-agentic-architecture/questions.md`](./dominios/01-agentic-architecture/questions.md)
> em condição de prova, na semana 2 do cronograma.

## Pendências externas

1. **Exam Guide oficial (PDF)** — atrás de login no Anthropic Partner Academy; é a única fonte
   confiável de número de questões, tempo de prova e nota de corte. Ao obter, salvar em
   `referencias/` e realinhar pesos e cronograma se necessário. Até lá, a tabela de pesos acima
   é a fonte de verdade: a distribuição de questões dos simulados (`simulados/simulado-01.md`
   e `simulado-02.md`) é derivada dela e deve ser recalculada se os pesos oficiais vierem
   diferentes.
2. **Confirmação de acesso ao Claude Partner Network** (adesão gratuita) — origem dos cursos
   de preparação gratuitos da Anthropic e do caminho de compra do exame.

## Ler como site

Todo o material tem uma versão HTML responsiva, gerada a partir dos próprios `.md`:

```bash
npm install
npm run build
```

Abra `site/index.html` no navegador. A navegação fica agrupada por domínio e mostra o peso de
cada um na prova, lido desta tabela de progresso.

O **markdown continua sendo a única fonte de verdade**: `site/` é artefato gerado, está no
`.gitignore` e nunca deve ser editado à mão — qualquer correção vai no `.md` e se propaga no
próximo build. O gerador é `tools/build-site.mjs` e o estilo, `tools/site.css`.

## Navegação

- Roteiro de estudo — a sequência exata a seguir, etapa por etapa: [`ROTEIRO.md`](./ROTEIRO.md)
- Método de estudo — como usar notas, armadilhas, questões e labs:
  [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md)
- Cronograma semana a semana: [`cronograma.md`](./cronograma.md)
- Spec de design deste programa: [`docs/superpowers/specs/2026-09-17-ccar-f-prep-design.md`](./docs/superpowers/specs/2026-09-17-ccar-f-prep-design.md)
