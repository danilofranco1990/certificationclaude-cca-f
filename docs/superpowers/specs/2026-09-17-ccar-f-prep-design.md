# Design — Preparação para a Claude Certified Architect – Foundations (CCAR-F)

**Data:** 2026-09-17
**Status:** aprovado (abordagem C, idioma híbrido)

## Objetivo

Chegar à prova CCAR-F com domínio de julgamento em cenários reais — não memorização — cobrindo
os cinco domínios do syllabus, em 12 semanas de estudo aprofundado.

Critério de sucesso: dois simulados completos, cronometrados e sem consulta, com **≥ 85% de acerto**,
e um projeto integrador funcionando que exercite os cinco domínios de ponta a ponta.

## Contexto e restrições

- Certificação oficial da Anthropic, aplicada pela Pearson VUE (exame proctored). Preço listado: US$ 125.
- Escopo oficial: Claude Code, Claude Agent SDK, Claude API e MCP.
- Formato: múltipla escolha baseada em cenários (atendimento ao cliente, geração/revisão de código,
  pipelines multiagente de pesquisa, automação de CI/CD, extração estruturada, arquitetura conversacional).
- O candidato tem base prática sólida em construção de agentes e uso de Claude Code. A preparação
  assume isso e ataca as lacunas "de prova": nomes exatos, semântica precisa de flags e APIs, taxonomias.
- **Pendências externas** (não bloqueiam o início):
  1. Exam Guide oficial em PDF (atrás de login no Anthropic Partner Academy) — única fonte confiável
     de nº de questões, tempo e nota de corte. Ao obter, salvar em `referencias/` e realinhar o material.
  2. Confirmação de acesso ao Claude Partner Network (adesão gratuita) — origem dos cursos de
     preparação gratuitos e da compra do exame.

## Decisões

**Abordagem: híbrida, guiada pelos pesos da prova.** Cada domínio recebe teoria condensada + lab
cirúrgico + banco de questões-cenário. Ao final, um projeto integrador e simulados cronometrados.
O tempo é alocado pelo peso do domínio, não por afinidade.

**Idioma:** questões e alternativas em **inglês** (realismo de prova); notas, armadilhas e gabarito
comentado em **português**, com todo termo técnico preservado em inglês.

**Pesos por domínio** (fonte secundária, a confirmar com o Exam Guide oficial):

| # | Domínio | Peso | Semanas |
|---|---------|------|---------|
| 1 | Agentic Architecture & Orchestration | 27% | 1–2 |
| 2 | Claude Code Configuration & Workflows | 20% | 3–4 |
| 3 | Prompt Engineering & Structured Output | 20% | 5–6 |
| 4 | Tool Design & MCP Integration | 18% | 7–8 |
| 5 | Context Management & Reliability | 15% | 9 |

## Estrutura de arquivos

```
Certificacao Claude/
├── README.md                     # painel: progresso por domínio, próximo passo
├── cronograma.md                 # as 12 semanas, com entregável de cada uma
├── referencias/
│   ├── exam-guide.pdf            # (a obter)
│   ├── links.md                  # fontes oficiais Anthropic/Pearson
│   └── glossario.md              # termo EN -> definição PT
├── dominios/
│   ├── 01-agentic-architecture/
│   ├── 02-claude-code/
│   ├── 03-prompt-structured-output/
│   ├── 04-tool-design-mcp/
│   └── 05-context-reliability/
├── labs/
│   └── projeto-integrador/
└── simulados/
    ├── simulado-01.md
    ├── simulado-02.md
    └── erros.md                  # log de erros e revisão dirigida
```

Cada pasta de domínio segue o mesmo padrão de quatro arquivos:

- `notas.md` — teoria condensada em português, organizada pelos subtópicos do syllabus.
- `armadilhas.md` — **o arquivo mais valioso.** Distinções que a prova cobra: erro transitório vs.
  validação vs. permissão vs. regra de negócio; `tool_choice` `auto` vs. `any` vs. `tool`; subagente
  vs. contexto compartilhado; planning mode vs. execução direta. Formato: par confundível + o critério
  que os separa + o cenário onde a escolha muda.
- `lab/` — exercício executável e curto, com objetivo declarado e critério de "funcionou".
- `questions.md` — 15–20 questões-cenário em inglês, gabarito ao final com explicação em português
  de por que cada distrator está errado.

## Ritmo semanal

Dentro de cada semana de domínio: leitura e produção das notas → lab → armadilhas e questões.
Checkpoint ao fim de cada domínio: as questões daquele domínio, meta ≥ 80%. Abaixo disso, o
domínio não é dado por fechado e volta na revisão da semana 11.

- **Semanas 1–9:** os cinco domínios, na ordem e duração da tabela acima.
- **Semana 10:** projeto integrador — pipeline multiagente de pesquisa com servidor MCP próprio,
  orquestração de subagentes, extração estruturada validada por schema e execução não-interativa
  em CI/CD. Um só projeto que toca os cinco domínios.
- **Semana 11:** simulado 01 cronometrado, sem consulta. Revisão dirigida pelos erros, registrada
  em `simulados/erros.md`.
- **Semana 12:** simulado 02 e revisão final focada nos domínios que ficaram abaixo da meta.

## Questões de prática

Construídas a partir do syllabus e da documentação oficial, no estilo de cenário da prova.
**Não são questões reais do exame** e não usaremos brain dumps — além de violar os termos do exame,
treinam reconhecimento em vez de julgamento, que é exatamente o que a prova mede.

Cada questão traz: cenário curto, pergunta, 4 alternativas, resposta e explicação de cada distrator.

## Fora de escopo (YAGNI)

- Aplicativo web de flashcards ou sistema automatizado de repetição espaçada — markdown e revisão
  manual bastam para 12 semanas.
- Fundamentos de programação, Python/TypeScript ou conceitos gerais de LLM: a base já existe.
- Cobertura de produtos Anthropic fora do escopo do exame (Claude.ai consumer, billing, etc.).
