# Como estudar este repositório

[`cronograma.md`](./cronograma.md) diz **quando** estudar cada coisa. Este arquivo diz **como** —
o método de uso de cada um dos quatro artefatos que todo domínio produz. Sem isso, o repositório
vira material de leitura, e ler material de prova é a forma mais confortável de não aprendê-lo.

Antes de qualquer domínio vem o [Módulo 0 — Fundamentos](./dominios/00-fundamentos/notas.md),
que se estuda pelo método da seção 1 abaixo, com uma adaptação: ele não tem banco de questões,
então o que faz as vezes de checkpoint são os `### Checkpoint` do próprio texto (respondidos
por escrito, antes de abrir o `<details>`) e o teste da folha de papel — desenhar de memória o
ciclo request → `tool_use` → execução → `tool_result` → `end_turn`.

| Artefato | Arquivo | Método | Está dominado quando |
|---|---|---|---|
| Notas | `dominios/NN-*/notas.md` | leitura ativa | você reproduz o critério de `### Quando usar` de memória |
| Armadilhas | `dominios/NN-*/armadilhas.md` | recuperação ativa | você enuncia o critério lendo só o título `### A vs. B` |
| Questões | `dominios/NN-*/questions.md` + `gabarito.md` | condição de prova | ≥ 80% sem consulta, com cada erro classificado por causa |
| Lab | `dominios/NN-*/lab/` | três passagens | você acerta a previsão da falha antes de rodar o experimento |

Os quatro métodos têm a mesma forma: **produzir alguma coisa antes de conferir** — uma frase, uma
letra num papel, uma previsão escrita. O que você produz é o que você sabe; o que você reconhece
ao reler é só familiaridade com a página, e a prova não mostra a página.

---

## 1. Notas — leitura ativa

O arquivo é `dominios/NN-<dominio>/notas.md`. Todo `notas.md` abre com uma `## 0. A visão geral`
(uma execução completa em que as seções aparecem juntas) e fecha com uma reconstrução e os
resumos finais. No meio, toda seção `## N` tem a mesma forma: abre no problema e no modelo
mental (`### O problema`, `### Modelo mental`), formaliza em `### Definição`, decide em
`### Quando usar` e fecha em `### Checkpoint` + `### Cenário de prova`. Entre elas existem
subseções de mecânica (`### Eventos`, `### Estrutura e bloqueio`, `### Os números`) e blocos de
alerta (`⚠️ Não confunda`, `O que acontece se…`, `Guarde este ponto`). Essa estrutura fixa é o
que torna o método abaixo executável em qualquer domínio.

O ciclo, uma seção `## N` por sessão (leia a `## 0` antes da primeira seção e a reconstrução
depois da última — elas são a moldura, não conteúdo opcional):

1. **Leia a seção inteira**, do problema ao `### Cenário de prova` — mas **pare no
   `### Checkpoint`** e responda as perguntas por escrito antes de abrir o `<details>` de
   respostas. O checkpoint é a primeira medição, com o arquivo ainda aberto.
2. **Feche o arquivo.** Não minimize, feche — o custo de reabrir é o que impede a olhadinha.
3. **Escreva de memória, em uma frase, o critério de `### Quando usar`.** Depois escreva a resposta
   do `### Cenário de prova` e, principalmente, *qual critério a decide*. Se a seção tem um
   `### Modelo mental` com diagrama, desenhe-o de memória numa folha — o teste do papel: quem
   não desenha o fluxo ainda não tem o modelo, só a familiaridade com a página.
4. **Abra e compare.**

O que conta como falha na comparação: você escreveu uma **definição** onde devia ter escrito um
**critério**. "Subagent roda em contexto isolado" é definição — está no `### Definição` e não
decide nada. "A razão entre contexto consumido e contexto devolvido" é critério, e é isso que a
questão vai cobrar. A prova nunca pergunta o que uma coisa é; ela descreve um cenário e pergunta
qual escolha ele pede.

Quando não conseguir reproduzir, **releia só o `### Quando usar`**, não a seção inteira, e refaça
o passo 3 no mesmo dia e de novo no começo da sessão seguinte. Reler tudo é o que dá a sensação de
progresso sem produzir nenhum.

Tabelas de valores literais — `### O que o subagent enxerga` (§3), `### Os números` (§4), os
eventos e códigos de saída de hooks (§6) — são material de **recitação**, não de leitura. Um
cenário inteiro pode girar em torno de `exit 2` bloquear, de o terceiro valor ser `ask` e não
`request`, ou de multiagente custar ~15× os tokens de um chat. Esses são os itens que se decoram
palavra por palavra; o resto se entende.

Se a sessão for curta, as subseções inegociáveis são quatro: `### Modelo mental` monta o desenho,
`### Definição` situa, `### Quando usar` decide, `### Cenário de prova` é a questão já mastigada.
As subseções de mecânica no meio são o que transforma acerto em acerto consistente — mas nessa
ordem. (`### O problema` se lê uma vez e não se revisa: o problema, uma vez visto, não se
"desvê".)

---

## 2. Armadilhas — recuperação ativa

O arquivo é `dominios/NN-<dominio>/armadilhas.md`, e cada entrada é um `### A vs. B`. Ele é o
artefato de maior densidade por minuto do repositório: cada entrada é uma questão que a prova vai
fazer em forma de cenário.

O baralho de flashcards já existe, sem ferramenta nenhuma — são os títulos sozinhos:

```bash
grep '^### ' dominios/01-agentic-architecture/armadilhas.md
```

Para cada título, **antes de abrir o arquivo**, enuncie em voz alta duas coisas, nesta ordem:

1. **O critério que separa os dois lados**, em uma frase.
2. **O cenário em que a escolha se inverte.**

Só então leia a entrada. Ela está escrita nessa mesma ordem (`**O critério:**` e depois
`**Onde a escolha se inverte:**`), então a comparação é direta. Leia até o fim, inclusive os blocos
`> Distrator clássico` — é ali que está a redação que a prova usa para tornar a resposta errada
atraente.

**Autoteste do enunciado:** se a sua frase contém "grande", "complexo", "muito contexto" ou "três
tentativas", você nomeou um **tamanho**, e nenhum critério catalogado aqui é tamanho. Paralelo vs.
sequencial é **dependência de estado**. Escalar vs. tentar de novo é **irreversibilidade + hipótese
nova**. Hook vs. prompt é **qual a consequência de o passo simplesmente não acontecer**. Tamanho e
contagem são exatamente as iscas que os distratores plantam.

Quando errar, a entrada já diz o que reler: ela fecha com `> **Teoria:** ver notas.md §N`. Releia
**só o §N** e volte ao baralho.

Rode o baralho inteiro numa sentada. As que você errou voltam na sessão seguinte; uma entrada só
sai do baralho depois de **dois enunciados corretos em dias diferentes** — acertar duas vezes no
mesmo dia mede memória de curto prazo, que é justamente a que não estará lá na prova.

---

## 3. Questões — condição de prova

São dois arquivos por domínio, e eles são dois de propósito: `questions.md` (só as questões, em
inglês, como na prova) e `gabarito.md` (respostas e, em português, por que cada distrator é
tentador). Abrir o gabarito "só para conferir uma" destrói a medição das outras dezenove —
é por isso que eles são arquivos separados, e é por isso que as respostas vão **num papel**.

**Protocolo:**

- As 20 questões de uma vez, sem consultar `notas.md`, `armadilhas.md` nem o gabarito.
- Uma lista numerada de 1 a 20 no papel, uma letra por linha.
- Marque com `?` toda questão em que você **chutou ou hesitou entre duas** alternativas. Acerto com
  `?` é um erro que ainda não apareceu, e ele conta como erro no log.
- **Tempo:** a duração oficial da prova ainda é pendência externa (ver `README.md`). Não invente um
  cronômetro por questão; cronometre o bloco inteiro e anote o total. Quando o Exam Guide chegar,
  você terá um ritmo real para comparar em vez de uma estimativa inventada.
- Corrija no fim, as 20 de uma vez.

**Checkpoint:** ≥ 80% (16/20) fecha o domínio, conforme `cronograma.md`. Abaixo disso o domínio não
é dado por encerrado e volta como prioridade na revisão da semana 11.

**Todo erro — e todo acerto marcado com `?` — vai para `simulados/erros.md`**, com as colunas:

```
| Questão | Domínio | Resposta dada | Correta | Causa | Ação |
|---|---|---|---|---|---|
```

Esse arquivo nasce formalmente na semana 11 (simulado 01), mas o log começa na **semana 1**: crie-o
com esse cabeçalho no primeiro erro. Use `D1-Q5` na coluna `Questão` para que os erros dos
checkpoints de domínio e os dos simulados convivam na mesma tabela sem ambiguidade.

A coluna que faz o arquivo valer a pena é a **Causa**, porque as três pedem remédios diferentes e só
a primeira pede reler a teoria:

| Causa | O que aconteceu | Ação — e o que **não** adianta |
|---|---|---|
| **Desconhecimento** | você não sabia o conteúdo | releia **um** `## N` de `notas.md` e refaça sobre ele a seção 1 deste arquivo. É a **única** causa cujo remédio é reler teoria |
| **Desatenção** | você sabia e leu o cenário errado — perdeu o "does not compile", o "two weeks later", o "most files are under 100 lines" | reler teoria não corrige nada. O remédio é protocolo de leitura: leia **a pergunta final antes do cenário**, depois sublinhe o fato que decide a resposta, e só então olhe as alternativas |
| **Confusão entre conceitos** | você sabia os dois e escolheu o errado | o remédio é `armadilhas.md`, não `notas.md`. Se o par confundido ainda não está catalogado, **escreva a entrada** `### A vs. B` — critério, cenário de inversão e o `ver notas.md §N` no fim. É o único caso em que estudar produz um commit no repositório |

**Como achar o `§N` de uma questão errada.** A entrada do gabarito fecha com
`> **Armadilha testada:** ver armadilhas.md — <título>` sempre que a questão cobra uma distinção
catalogada; a entrada de `armadilhas.md`, por sua vez, fecha com `> **Teoria:** ver notas.md §N`.
Siga a cadeia. Quando a questão não testa armadilha nenhuma, use a linha `Coverage:` no topo de
`questions.md`: ela lista o subtópico de cada número de questão, na mesma ordem das seções `## N`
de `notas.md`.

Depois de corrigir, leia no `gabarito.md` a explicação dos distratores **também das questões que
você acertou**. A resposta certa é uma linha; a análise de por que as outras três são tentadoras é
o padrão que se repete na prova inteira.

**Segunda passada:** refaça só as questões do log, **pelo menos uma semana depois**, nunca no mesmo
dia — no mesmo dia você está lembrando a letra, não decidindo o cenário.

---

## 4. Labs — três passagens

Rodar o lab uma vez com sucesso ensina quase nada. Uma execução bem-sucedida mostra o happy path,
e o happy path não é o que a prova pergunta: ela pergunta **sintoma → causa**, e sintoma só existe
quando alguma coisa quebra. Daí as três passagens — e a segunda é onde está o aprendizado.

### Passagem 1 — linha de base

Leia o `## Critério de "funcionou"` do `lab/README.md` **antes** de rodar; ele vem antes do comando
por esse motivo. Rode conforme `## Como rodar` e **anote os seus números** — wall clock, speedup,
custo. Os experimentos da passagem 2 se leem contra a *sua* linha de base, não contra a execução
registrada no README, que saiu de outra máquina em outro dia.

Antes de começar, olhe `### Quanto custa uma rodada`: a execução é paga. `LAB_MAX_BUDGET_USD` é a
rede de segurança, e vale apertá-la antes de fazer muitas rodadas seguidas.

Se um critério falhar logo de cara, vá ao `## Troubleshooting` **antes** de editar qualquer coisa —
ele separa "meu código está errado" de "o ambiente atrapalhou", e só um dos dois merece depuração.

### Passagem 2 — quebra (é aqui que está o aprendizado)

Todo lab tem um `## Roteiro de quebra` com experimentos no formato **o que mudar** → **o que deve
acontecer** → **a que armadilha ou questão isso corresponde**. Para cada experimento, nesta ordem:

1. Leia **só o "o que mudar"** e **escreva a sua previsão** antes de editar. Prever é responder a
   uma questão de prova com o gabarito fechado — é o mesmo exercício da seção 3, com o lab no lugar
   da alternativa.
2. Aplique a edição, rode, observe.
3. Só agora leia o "o que deve acontecer" e compare.
4. Desfaça antes do próximo: `git checkout -- orchestrator.ts`. **Um experimento por vez.** Duas
   quebras simultâneas produzem um sintoma que você não consegue atribuir a nenhuma das duas.

Previsão que bateu confirma o seu modelo. **Previsão que errou é o evento mais valioso da semana**:
ela vai para `simulados/erros.md` como qualquer erro de questão, com `Questão` = `D1-lab-exp2` e
causa quase sempre "desconhecimento". Uma previsão errada é um erro de prova que apareceu antes da
prova.

Atenção a um detalhe que é lição por si só: **nem toda quebra é detectada pelo script**. No lab do
Domínio 1, o código de saída só reprova o critério de paralelismo — um experimento pode terminar com
saída verde e resultado arruinado. Julgar pelo exit code é confiar num passo de verificação que
verifica a coisa errada, que é exatamente a falha do `### Cenário de prova` de `notas.md` §1.

### Passagem 3 — modificar em direção a um cenário de prova

Pegue um `### Cenário de prova` de `notas.md` ou uma questão de `questions.md` e altere o lab até
ele reproduzir aquele cenário. No Domínio 1, o alvo natural é o cenário de §4 (= Question 4): o
pipeline de pesquisa de quatro estágios — levantar fontes, resumir cada fonte, escrever o relatório,
checar o relatório contra as fontes. Implemente os quatro sobre o `orchestrator.ts` e veja na prática
qual deles se recusa a paralelizar.

O critério de parada é este: você consegue explicar o resultado sem abrir `notas.md`. Esta passagem
é a que se corta quando a semana aperta; as passagens 1 e 2, não.
