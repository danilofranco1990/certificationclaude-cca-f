---
name: visualizar-conceito
description: Use quando um conteúdo de estudo (protocolo, ciclo de requisições, máquina de estados, regra de decisão, camadas de responsabilidade, fluxo com ramificações) não foi compreendido e o usuário quer "ver funcionando", "simular", "visualizar" ou "entender na prática" — ou quando invocado como /visualizar-conceito com um caminho .md ou conteúdo colado. Produz um simulador HTML autônomo e interativo aberto no navegador. Não serve para resumo, slides, questionário ou animação decorativa.
argument-hint: "<caminho/do/arquivo.md | conteúdo colado>"
---

# Visualizar conceito — simulador interativo a partir de material de estudo

**Objetivo:** transformar um conteúdo não compreendido em um **simulador** cujo estado o usuário
manipula e cujas consequências ele observa. O teste de aceitação é um só: *a interação muda o
estado da simulação, os dados exibidos e as consequências?* Revelar parágrafos, avançar slides
ou rodar uma animação decorativa **não** atende.

**REQUIRED SUB-SKILL:** ler `motor.md` (nesta pasta) antes de escrever o HTML — ele define a
arquitetura de snapshots e decisões que torna Play/Pausar/Voltar/ramificar corretos por
construção.

## Entrada

`$ARGUMENTS` é um caminho (`/visualizar-conceito dominios/00-fundamentos/notas.md`) **ou** o
conteúdo em si, colado após o comando. Sem argumento, pergunte o que visualizar.

1. Leia o material **inteiro** (com um caminho: o arquivo todo, não só a seção citada).
2. Se for longo, escolha **um recorte** — um ciclo, uma transição, uma regra — e anote o que
   ficou de fora. Essa lista vai para o HTML e para o relatório final.
3. Não altere o material original. Nunca.

## Onde salvar (convenção deste repositório)

- Saída em `visualizacoes/<YYYY-MM-DD>-<origem>-<conceito>.html`, onde `origem` é o slug do
  domínio (`00-fundamentos`, `04-tool-design-mcp`…) ou `avulso` para conteúdo colado.
  Exemplo: `visualizacoes/2026-09-24-00-fundamentos-ciclo-tool-use.html`.
- **Nunca sobrescreva** um HTML existente sem indicação do usuário: se o nome já existe,
  acrescente `-2`, `-3`… e informe.
- Acrescente uma linha na tabela de `visualizacoes/README.md` (data, arquivo, origem, recorte).
- `visualizacoes/` fica fora de `site/` (gerado) e do `build-site.mjs`; os HTMLs são fonte,
  não artefato gerado — entram no git.

## Processo

### 1. Extrair o modelo antes de desenhar

Escreva, em rascunho, antes de qualquer HTML:

| Elemento | Pergunta a responder |
|---|---|
| Conceito central | Qual a única frase que o simulador precisa provar? |
| Participantes | Quem age? (ex.: modelo/API, aplicação, ferramentas — sempre **separados**) |
| Estados | O que existe em cada instante? (histórico, pendências, contadores, flags) |
| Eventos | O que muda o estado? Quem dispara? |
| Decisões | Onde o usuário escolhe? O que cada escolha altera adiante? |
| Causa → efeito | Que erro de forma produz que sintoma? |

Se não conseguir preencher "decisões" nem "parâmetros ajustáveis", o assunto ainda não está
entendido a ponto de simular — releia o material.

### 2. Escolher a representação pelo assunto

| Assunto | Representação |
|---|---|
| Protocolo, troca de requisições, quem fala com quem | diagrama de sequência com raias por participante |
| Transições, ciclo de vida, `stop_reason`, status | máquina de estados clicável |
| Responsabilidades, "quem faz o quê", harness vs. modelo | camadas empilhadas com o dado atravessando |
| Regra de decisão, critério, tradeoff | parâmetros ajustáveis + resultado observável |
| Orçamento, custo, janela de contexto | medidores que a interação enche/esvazia |

Justifique a escolha em uma frase no HTML. **Não reutilize o diagrama do último simulador por
inércia** — a representação sai do conteúdo, não do template.

### 3. Classificar cada afirmação

Todo fato exibido leva uma etiqueta visível: **material** (está no texto de origem), **doc
oficial** (confirmado na documentação, com data e URL) ou **simulação** (hipótese criada para o
exemplo). Quando o assunto depender do comportamento atual de uma API ou produto, **consulte a
documentação oficial** antes de afirmar (WebFetch / Context7 / skill `claude-api`). Toda
continuação "plausível" — como um modelo reagindo a um erro — é **simulação**, nunca garantia.
O HTML declara, em destaque, que não faz chamadas reais.

### 4. Construir o HTML autônomo

Um único arquivo, CSS e JS embutidos, **zero dependências externas** (sem CDN, sem fontes
remotas), funcionando em `file://`. Requisitos:

- **Sequência** → Play, Pausar, Próxima etapa, Etapa anterior, Reiniciar, velocidade. Play
  avança etapa por etapa; pausar/voltar restaura **exatamente** o visual, os dados e a
  explicação daquela etapa (snapshots — ver `motor.md`).
- **Decisão do usuário** → o avanço automático para e espera; a escolha determina as etapas
  seguintes; voltar e trocar a escolha **descarta os estados futuros** do caminho anterior.
- **Sem sequência** → parâmetros ou ações que alteram um resultado observável.
- Etapa 0 é uma **visão geral**. Em cada etapa dá para inspecionar: quem agiu, o que
  aconteceu, dados que entraram/saíram, o que mudou no estado, transições possíveis. Painéis,
  indicadores e exemplos derivam **todos** do mesmo snapshot — nunca dessincronizam.
- Exemplos **pequenos e concretos**; JSON com os campos relevantes destacados, mostrando como
  o conteúdo muda ao longo da execução. Use os exemplos do próprio material quando existirem.
- Português claro, termos técnicos em inglês (convenção do repositório). Analogia só com
  mapeamento explícito elemento→elemento **e** a lista de onde ela deixa de valer.
- Fecho: referência técnica breve, erros de interpretação frequentes, o que ficou fora, fontes
  com data. Sem apostila, sem questionário obrigatório.
- Layout que funciona a 380 px de largura e no tema escuro (`prefers-color-scheme`).

### 5. Testar no navegador (obrigatório)

Abra o arquivo no Chrome (`file:///…`) e verifique, executando de fato:

- [ ] Play percorre as etapas e **para sozinho** na primeira decisão
- [ ] Pausar congela; Próxima/Anterior movem um passo; Reiniciar zera decisões e estado
- [ ] Voltar a uma etapa reproduz os mesmos dados e a mesma explicação (compare snapshots)
- [ ] Trocar uma decisão reconstrói o caminho e apaga as decisões posteriores
- [ ] Os dados dos painéis batem entre si (ex.: `tool_use_id` do resultado = `id` do pedido)
- [ ] Console sem erros; nenhuma requisição de rede externa
- [ ] Largura de celular e tema escuro legíveis

Se o Chrome não estiver disponível, diga isso explicitamente — não afirme que testou.

### 6. Relatar

Informe: caminho do HTML, recorte escolhido e o que ficou fora, o que foi **efetivamente**
testado (lista acima, item a item), fontes consultadas com data, e as hipóteses marcadas como
simulação.

## Armadilhas

| Sintoma | Por que falha | Correção |
|---|---|---|
| Botão "próximo" só troca o parágrafo | não há estado | modele estado e faça a etapa mutá-lo |
| Animação bonita sem dado | decorativa | cada movimento corresponde a um dado que muda no painel |
| Voltar não restaura a explicação anterior | render incremental | snapshots por etapa (`motor.md`) |
| Dois caminhos se misturam após trocar decisão | estados futuros não descartados | reconstrua o caminho a partir da decisão |
| "O modelo vai tentar de novo" sem etiqueta | comportamento não garantido apresentado como fato | etiqueta **simulação** + citação da doc |
| Mesmo diagrama para todo assunto | template antes do conteúdo | escolha pela tabela da etapa 2 |
| Fonte do Google, lib via CDN | quebra em `file://` offline | tudo embutido |

## Exemplo de invocação

```text
/visualizar-conceito dominios/01-agentic-architecture/notas.md
   → escolhe um recorte (ex.: §6 hooks: PreToolUse com exit 0/2 bloqueando ou não a ação),
     representa como máquina de estados com a decisão "exit code" ajustável.

/visualizar-conceito Um subagente recebe apenas o prompt que o orquestrador escreve; ele não
enxerga o histórico do pai. O resultado volta como texto único para o contexto do pai.
   → conteúdo colado; salva em visualizacoes/<data>-avulso-contexto-do-subagente.html
```
