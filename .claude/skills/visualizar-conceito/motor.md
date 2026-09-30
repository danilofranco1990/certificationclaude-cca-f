# Motor de simulação — snapshots, decisões e controles

Padrão de arquitetura para o JavaScript embutido no HTML. Ele garante, por construção, os
requisitos de Play/Pausar/Voltar e de ramificação por decisão. Adapte nomes; não abandone a
estrutura.

## Princípio

**O caminho é uma lista de etapas construída de forma pura a partir das decisões.** Cada etapa
carrega um snapshot completo do estado. Toda a interface renderiza a partir de
`caminho[atual]`. Nada é renderizado incrementalmente — por isso voltar, pausar e pular
restauram exatamente o que existia naquela etapa.

```text
decisoes  ──buildPath()──►  caminho = [etapa0, etapa1, …, etapaN]
                              cada etapa: { titulo, ator, explicacao, dados, visuais,
                                            transicoes, decision?, state: snapshot }
atual ────────────────────►  renderAll(caminho[atual])
```

## Etapas de decisão

`buildPath` percorre o roteiro; ao chegar numa decisão **sem valor**, inclui a etapa de
decisão e **retorna** — o caminho termina ali (pendente). Com valor, inclui a etapa marcada
como resolvida e continua pelo ramo escolhido.

Trocar uma decisão em uma etapa `i`: apagar as decisões de todas as etapas de decisão com
índice `> i` no caminho anterior, gravar a nova, reconstruir, manter `atual = i`. Isso descarta
os estados futuros do caminho antigo sem misturar ramos.

## Núcleo (copiar e adaptar)

```js
let decisions = {};      // id -> valor escolhido
let path = [];           // etapas construídas
let cur = 0, playing = false, timer = null, speed = 1;
const BASE_MS = 2200;
const clone = (x) => JSON.parse(JSON.stringify(x));

function buildPath(dec) {
  const steps = [];
  const st = { /* estado inicial do domínio */ };
  const add = (s) => { s.index = steps.length; s.state = clone(st); steps.push(s); return s; };
  const decision = (s) => {              // devolve true se já resolvida
    const v = dec[s.decision.id];
    s.decision.value = v === undefined ? null : v;
    add(s);
    return v !== undefined;
  };

  add({ kind: 'info', title: 'Visão geral', /* … */ });
  // … mutar `st`, depois add({...}) — a ordem "muta, depois add" grava o pós-estado
  if (!decision({ kind: 'decision', decision: { id: 'cenario', options: [/*…*/] } })) return steps;
  // ramos dependem de dec.cenario …
  return steps;
}

function choose(step, value) {
  for (const s of path) if (s.kind === 'decision' && s.index > step.index) delete decisions[s.decision.id];
  decisions[step.decision.id] = value;
  path = buildPath(decisions);
  cur = step.index;
  renderAll();
}

const unresolved = (s) => s.kind === 'decision' && decisions[s.decision.id] === undefined;

function tick() {
  if (unresolved(path[cur]) || cur >= path.length - 1) { pause(); return; }
  cur++; renderAll();
  if (unresolved(path[cur]) || cur >= path.length - 1) pause();   // para NA decisão
}
function play()  { if (playing) return; playing = true; timer = setInterval(tick, BASE_MS / speed); renderControls(); }
function pause() { playing = false; clearInterval(timer); timer = null; renderControls(); }
function next()  { if (!unresolved(path[cur]) && cur < path.length - 1) { cur++; renderAll(); } }
function prev()  { if (cur > 0) { cur--; renderAll(); } }
function reset() { pause(); decisions = {}; path = buildPath(decisions); cur = 0; renderAll(); }
function setSpeed(v) { speed = v; if (playing) { pause(); play(); } }
```

## Painéis mínimos (todos lidos de `path[cur]`)

| Painel | Fonte na etapa |
|---|---|
| Palco (diagrama) | `visuais` das etapas `1..cur`, com a etapa `cur` em destaque |
| Etapa | `ator`, `titulo`, `explicacao` (com etiquetas material/doc/simulação), `decision` |
| Dados | `dados.json` + `dados.hl` (chaves a destacar; `chave=valor` para destacar só um caso) |
| Estado | campos de `state` em tabela |
| Transições | `transicoes` (o que pode acontecer a partir deste estado) |
| Histórico/linha do tempo | `state` acumulado; marque o que é novo comparando com `path[cur-1].state` |

## Controles

Play · Pausar · ◀ Anterior · Próxima ▶ · Reiniciar · velocidade (0.5×–4×) · indicador
"Etapa i de N" (N muda quando uma decisão estende o caminho — diga isso na interface). Linha
do tempo clicável com ◆ nas decisões. Atalhos: ← → espaço.

## Etiquetas de origem

```html
<span class="tag t-mat">material</span>
<span class="tag t-doc" title="URL · data">doc oficial</span>
<span class="tag t-sim">simulação</span>
```

Legenda no topo; aviso "esta simulação não faz chamadas reais" no topo.

## Verificação por JavaScript (Chrome)

Exponha `window.__sim = { get cur(){…}, path(){…}, decisions(){…}, goto, choose, play, pause }`
para que o teste no navegador confira snapshots e ramificações sem depender de cliques
frágeis; os cliques continuam sendo testados nos botões reais.
