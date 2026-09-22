# Preparação — Claude Certified Architect – Foundations (CCAR-F)

Painel de controle do estudo para a certificação **Claude Certified Architect – Foundations
(CCAR-F)**, da Anthropic, aplicada pela **Pearson VUE** em modalidade **proctored** (com
supervisão remota ou em centro de testes). Preço listado: **US$ 125**.

Programa de estudo de 12 semanas, organizado pelos cinco domínios oficiais do syllabus,
fechando com um projeto integrador e dois simulados cronometrados.

## Trilha de estudo

```text
Módulo 0 (fundamentos) → Domínio 1 → Domínio 2 → Domínio 3 → Domínio 4 → Domínio 5
                                                → Projeto integrador → Simulados 01 e 02
```

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

- Método de estudo — como usar notas, armadilhas, questões e labs:
  [`COMO-ESTUDAR.md`](./COMO-ESTUDAR.md)
- Cronograma semana a semana: [`cronograma.md`](./cronograma.md)
- Spec de design deste programa: [`docs/superpowers/specs/2026-09-17-ccar-f-prep-design.md`](./docs/superpowers/specs/2026-09-17-ccar-f-prep-design.md)
