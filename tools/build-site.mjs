#!/usr/bin/env node
/**
 * Build do site de leitura do repositório CCAR-F.
 *
 * O markdown é a única fonte de verdade. Este script lê os .md do repositório e
 * escreve `site/<mesmo caminho>.html`, mais um `site/index.html` de navegação.
 * O HTML é gerado, nunca editado à mão, e `site/` é ignorado pelo git.
 *
 * Determinismo é requisito: listas de arquivos são ordenadas, não há timestamp
 * nem valor aleatório na saída. Rodar duas vezes produz bytes idênticos.
 *
 * Nada de marcação de apresentação vai para o markdown. O gerador sabe qual
 * arquivo está renderizando e põe um "registro" (`reg-*`) no <body>; o CSS
 * diferencia a partir da estrutura dentro dele.
 */

import {
  copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, Renderer } from 'marked';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'site');
const CSS_SRC = join(ROOT, 'tools', 'site.css');

const SKIP_DIRS = new Set(['node_modules', '.git', 'site', 'dist', '.claude']);

/* ------------------------------------------------------------------ util */

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Lista um diretório do repositório, ordenado por nome (determinismo). */
function listDir(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** Caminho relativo de um diretório do site até um arquivo do site. */
function relHref(fromDir, toPath) {
  const from = fromDir ? fromDir.split('/') : [];
  const to = toPath.split('/');
  let i = 0;
  while (i < from.length && i < to.length - 1 && from[i] === to[i]) i++;
  return '../'.repeat(from.length - i) + to.slice(i).join('/');
}

/** Normaliza `a/b/../c` para `a/c`, em POSIX. */
function normalizeRel(p) {
  const out = [];
  for (const part of p.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

const htmlPathOf = (mdPath) => mdPath.replace(/\.md$/i, '.html');

/* --------------------------------------------------------- descoberta */

/** `labs/**\/README.md`, ignorando node_modules. */
function walkReadmes(dir) {
  const found = [];
  for (const e of listDir(dir)) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) found.push(...walkReadmes(`${dir}/${e.name}`));
    } else if (e.name === 'README.md') {
      found.push(`${dir}/${e.name}`);
    }
  }
  return found;
}

function collectSources() {
  const files = [];
  const add = (p) => {
    if (existsSync(join(ROOT, p)) && !files.includes(p)) files.push(p);
  };

  add('README.md');
  add('COMO-ESTUDAR.md');
  add('cronograma.md');

  for (const e of listDir('referencias')) {
    if (e.isFile() && e.name.endsWith('.md')) add(`referencias/${e.name}`);
  }

  for (const d of listDir('dominios')) {
    if (!d.isDirectory() || SKIP_DIRS.has(d.name)) continue;
    for (const e of listDir(`dominios/${d.name}`)) {
      if (e.isFile() && e.name.endsWith('.md')) add(`dominios/${d.name}/${e.name}`);
    }
    add(`dominios/${d.name}/lab/README.md`);
  }

  for (const p of walkReadmes('labs')) add(p);

  for (const e of listDir('simulados')) {
    if (e.isFile() && e.name.endsWith('.md')) add(`simulados/${e.name}`);
  }

  return files;
}

/* ----------------------------------------------------------- registros */

/**
 * Os três registros de conteúdo do material (mais lab e avulso). É o gerador
 * que sabe disso — o markdown não carrega nenhuma marca de apresentação.
 */
function registerOf(path) {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const parts = path.split('/');
  if (base === 'notas.md') return 'notas';
  if (base === 'armadilhas.md') return 'armadilhas';
  if (base === 'gabarito.md' || /-gabarito\.md$/i.test(base)) return 'gabarito';
  if (base === 'questions.md' || /^simulado-\d+\.md$/i.test(base)) return 'questions';
  if (parts.includes('lab') || parts[0] === 'labs') return 'lab';
  return 'plain';
}

/* -------------------------------------------------------------- título */

function stripInlineMd(s) {
  return s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}

function firstH1(md) {
  let fenced = false;
  for (const line of md.split('\n')) {
    if (/^\s{0,3}(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const m = /^#\s+(.+?)\s*$/.exec(line);
    if (m) return stripInlineMd(m[1]);
  }
  return null;
}

/* ------------------------------------------- pré-processo das questões */

const OPT_RE = /^([A-Z])\.\s+\S/;

/**
 * As alternativas das questões são linhas `A. ...` .. `D. ...` — markdown as
 * junta num único parágrafo. Aqui viram lista, sem tocar no arquivo fonte.
 */
function transformOptions(md) {
  const lines = md.split('\n');
  const out = [];
  let fenced = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s{0,3}(```|~~~)/.test(line)) { fenced = !fenced; out.push(line); i++; continue; }

    if (!fenced && OPT_RE.test(line)) {
      const items = [];
      let j = i;
      let ok = true;
      while (j < lines.length && lines[j].trim() !== '') {
        if (OPT_RE.test(lines[j])) {
          const key = lines[j][0];
          if (key.charCodeAt(0) !== 'A'.charCodeAt(0) + items.length) { ok = false; break; }
          items.push({ key, parts: [lines[j].slice(2).trim()] });
        } else if (items.length && /^\s+\S/.test(lines[j])) {
          items[items.length - 1].parts.push(lines[j].trim());
        } else {
          ok = false; break;
        }
        j++;
      }
      if (ok && items.length >= 2) {
        for (const it of items) {
          out.push(`- <span class="opt-key">${it.key}</span> ${it.parts.join(' ')}`);
        }
        i = j;
        continue;
      }
    }

    out.push(line);
    i++;
  }
  return out.join('\n');
}

/* ------------------------------------------------------------ renderer */

function inlineText(tokens) {
  let s = '';
  for (const t of tokens || []) {
    if (t.type === 'text' || t.type === 'codespan' || t.type === 'escape') s += t.text || '';
    else if (t.tokens) s += inlineText(t.tokens);
    else s += t.raw || '';
  }
  return s;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-') || 'sec';
}

function uniqueSlug(text, seen) {
  const base = slugify(text);
  const n = seen.get(base) || 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

const NOTAS_HEADINGS = new Map([
  ['definição', 'k-def'],
  ['quando usar', 'k-when'],
  ['cenário de prova', 'k-case'],
]);

function quoteClass(text) {
  const lead = String(text || '').replace(/^[\s>]+/, '').replace(/^[*_]+/, '').trim();
  if (/^Distrator\s+cl[áa]ssico/i.test(lead)) return 'q-trap';
  if (/^(Teoria|Armadilha\s+testada)\b/i.test(lead)) return 'q-ref';
  return '';
}

/**
 * Reescreve links relativos. `.md` de página construída vira `.html`; qualquer
 * outro alvo relativo aponta para o arquivo original, subindo para fora de
 * `site/`. Links absolutos e âncoras puras ficam intactos.
 */
function makeHrefRewriter(ctx) {
  return (href) => {
    const raw = String(href || '');
    if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) {
      return raw;
    }
    const hash = raw.indexOf('#');
    const path = hash === -1 ? raw : raw.slice(0, hash);
    const anchor = hash === -1 ? '' : raw.slice(hash);
    if (!path) return raw;

    const target = normalizeRel(ctx.srcDir ? `${ctx.srcDir}/${path}` : path);

    if (/\.md$/i.test(target) && ctx.built.has(target)) {
      return relHref(ctx.srcDir, htmlPathOf(target)) + anchor;
    }
    // Alvo fora do site: aponta para o arquivo de origem no repositório.
    ctx.unresolved.add(target);
    return '../'.repeat(ctx.depth + 1) + target + anchor;
  };
}

function makeMarked(ctx) {
  const seen = new Map();
  const rewrite = makeHrefRewriter(ctx);

  const renderer = {
    heading(token) {
      const html = this.parser.parseInline(token.tokens);
      const plain = inlineText(token.tokens).trim();
      const id = uniqueSlug(plain, seen);

      if (ctx.register === 'questions' && token.depth === 3 && /^Question\s+\d+/i.test(plain)) {
        return `<h3 id="${id}" class="q-head"><span class="q-chip">${html}</span></h3>\n`;
      }
      const cls = ctx.register === 'notas' && token.depth === 3
        ? NOTAS_HEADINGS.get(plain.toLowerCase()) || ''
        : '';
      const attr = cls ? ` class="${cls}"` : '';
      return `<h${token.depth} id="${id}"${attr}>${html}</h${token.depth}>\n`;
    },

    /*
     * `strong:first-child` no CSS casa com o primeiro **elemento**, mesmo que
     * haja texto antes — pega negrito no meio da frase. Quem sabe se o negrito
     * abre o parágrafo é o token, não o seletor.
     */
    paragraph(token) {
      const html = Renderer.prototype.paragraph.call(this, token);
      const first = (token.tokens || [])[0];
      return first && first.type === 'strong'
        ? html.replace('<p>', '<p class="lead-label">')
        : html;
    },

    link(token) {
      const patched = { ...token, href: rewrite(token.href) };
      return Renderer.prototype.link.call(this, patched);
    },

    image(token) {
      const patched = { ...token, href: rewrite(token.href) };
      return Renderer.prototype.image.call(this, patched);
    },

    table(token) {
      return `<div class="scroll-x">\n${Renderer.prototype.table.call(this, token)}</div>\n`;
    },

    code(token) {
      return `<div class="scroll-x">\n${Renderer.prototype.code.call(this, token)}</div>\n`;
    },

    blockquote(token) {
      const html = Renderer.prototype.blockquote.call(this, token);
      const cls = quoteClass(token.text);
      return cls ? html.replace('<blockquote>', `<blockquote class="${cls}">`) : html;
    },
  };

  return new Marked({ gfm: true, breaks: false }, { renderer });
}

/**
 * Em `notas.md`, o bloco `### Cenário de prova` é a parte aplicada — ele sai
 * do fluxo como seção destacada. O agrupamento é feito nos tokens, não por
 * regex no HTML.
 */
function renderTokens(inst, tokens, register) {
  if (register !== 'notas') return inst.parser(tokens);

  let html = '';
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    buf.links = tokens.links;
    html += inst.parser(buf);
    buf = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const isCase = t.type === 'heading' && t.depth === 3
      && inlineText(t.tokens).trim().toLowerCase() === 'cenário de prova';
    if (!isCase) { buf.push(t); continue; }

    const group = [t];
    let j = i + 1;
    while (j < tokens.length) {
      const n = tokens[j];
      if (n.type === 'hr') break;
      if (n.type === 'heading' && n.depth <= 3) break;
      group.push(n);
      j++;
    }
    flush();
    group.links = tokens.links;
    html += `<section class="case-block" aria-label="Cenário de prova">\n${inst.parser(group)}</section>\n`;
    i = j - 1;
  }
  flush();
  return html;
}

/* ---------------------------------------------------------- navegação */

const ROOT_LABELS = new Map([
  ['README.md', 'Início'],
  ['COMO-ESTUDAR.md', 'Como estudar'],
  ['cronograma.md', 'Cronograma'],
]);

const DOMAIN_LABELS = new Map([
  ['notas.md', 'Notas'],
  ['armadilhas.md', 'Armadilhas'],
  ['questions.md', 'Questões'],
  ['gabarito.md', 'Gabarito'],
]);

const DOMAIN_ORDER = ['notas.md', 'armadilhas.md', 'questions.md', 'gabarito.md'];

function titleize(base) {
  const stem = base.replace(/\.md$/i, '').replace(/[-_]+/g, ' ');
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

/** Pesos vêm da tabela de progresso do README — nunca hardcoded aqui. */
function readWeights() {
  const md = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const rows = new Map();
  for (const line of md.split('\n')) {
    const m = /^\|\s*(\d+)\.\s*([^|]+?)\s*\|\s*(\d+)\s*%\s*\|/.exec(line);
    if (m) rows.set(Number(m[1]), { name: stripInlineMd(m[2]), weight: Number(m[3]) });
  }
  return rows;
}

function buildNav(sources, titles, weights) {
  const groups = [];
  const rootItems = [];
  for (const p of sources) {
    if (ROOT_LABELS.has(p)) rootItems.push({ path: p, label: ROOT_LABELS.get(p) });
  }
  if (rootItems.length) groups.push({ label: 'Painel', items: rootItems });

  const domainDirs = [];
  for (const d of listDir('dominios')) {
    if (d.isDirectory() && !SKIP_DIRS.has(d.name)) domainDirs.push(d.name);
  }
  for (const dir of domainDirs) {
    const prefix = `dominios/${dir}/`;
    const own = sources.filter((p) => p.startsWith(prefix));
    if (!own.length) continue;

    const items = [];
    for (const name of DOMAIN_ORDER) {
      const p = prefix + name;
      if (own.includes(p)) items.push({ path: p, label: DOMAIN_LABELS.get(name) });
    }
    for (const p of own) {
      const base = p.slice(prefix.length);
      if (base === 'lab/README.md' || DOMAIN_ORDER.includes(base)) continue;
      items.push({ path: p, label: titleize(base) });
    }
    if (own.includes(`${prefix}lab/README.md`)) {
      items.push({ path: `${prefix}lab/README.md`, label: 'Lab' });
    }

    const n = Number((/^(\d+)-/.exec(dir) || [])[1]);
    const meta = weights.get(n);
    groups.push({
      label: meta ? `${n}. ${meta.name}` : titleize(dir),
      weight: meta ? meta.weight : null,
      items,
    });
  }

  const tail = [
    ['Referências', (p) => p.startsWith('referencias/')],
    ['Simulados', (p) => p.startsWith('simulados/')],
    ['Labs', (p) => p.startsWith('labs/')],
  ];
  for (const [label, pred] of tail) {
    const items = sources.filter(pred).map((p) => ({ path: p, label: titles.get(p) || titleize(p) }));
    if (items.length) groups.push({ label, items });
  }

  return groups;
}

function navHtml(groups, currentPath, fromDir, maxWeight) {
  let h = '';
  for (const g of groups) {
    h += '<div class="nav-group">\n';
    h += `<p class="nav-head">${esc(g.label)}</p>\n`;
    if (g.weight != null) {
      const w = Math.round((g.weight / maxWeight) * 100);
      h += '<p class="nav-weight">'
        + `<span class="nav-bar"><span class="nav-bar-fill" style="width:${w}%"></span></span>`
        + `<span class="nav-pct">${g.weight}% da prova</span></p>\n`;
    }
    h += '<ul class="nav-list">\n';
    for (const it of g.items) {
      const cur = it.path === currentPath;
      const attr = cur ? ' class="is-current" aria-current="page"' : '';
      h += `<li><a href="${esc(relHref(fromDir, htmlPathOf(it.path)))}"${attr}>${esc(it.label)}</a></li>\n`;
    }
    h += '</ul>\n</div>\n';
  }
  return h;
}

/* ------------------------------------------------------------- página */

const FONT_LINKS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600'
    + '&family=IBM+Plex+Serif:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">',
].join('\n');

function page({ title, register, fromDir, nav, body }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${FONT_LINKS}
<link rel="stylesheet" href="${esc(relHref(fromDir, 'site.css'))}">
</head>
<body class="reg-${register}">
<a class="skip-link" href="#doc">Pular para o conteúdo</a>
<div class="shell">
<details class="nav-box">
<summary class="nav-toggle">Material</summary>
<nav class="nav-body" aria-label="Material de estudo">
<p class="nav-brand"><a href="${esc(relHref(fromDir, 'index.html'))}">CCAR-F</a></p>
${nav}</nav>
</details>
<main class="main">
<article class="doc" id="doc">
${body}</article>
<p class="foot">HTML gerado a partir dos <code>.md</code> do repositório por <code>npm run build</code>. Não edite estes arquivos.</p>
</main>
</div>
</body>
</html>
`;
}

/* --------------------------------------------------------------- build */

function indexBody(groups, maxWeight) {
  let h = '<h1>CCAR-F — material de estudo</h1>\n';
  h += '<p class="lede">Índice do material de preparação para a <strong>Claude Certified Architect – '
    + 'Foundations</strong>. Os domínios aparecem na ordem do peso na prova; a barra ao lado de cada um '
    + 'indica quanto ele vale, e é de onde sai a prioridade de estudo.</p>\n';
  for (const g of groups) {
    h += '<section class="idx-group">\n';
    h += `<h2>${esc(g.label)}</h2>\n`;
    if (g.weight != null) {
      const w = Math.round((g.weight / maxWeight) * 100);
      h += '<p class="nav-weight">'
        + `<span class="nav-bar"><span class="nav-bar-fill" style="width:${w}%"></span></span>`
        + `<span class="nav-pct">${g.weight}% da prova</span></p>\n`;
    }
    h += '<ul class="idx-list">\n';
    for (const it of g.items) {
      h += `<li><a href="${esc(htmlPathOf(it.path))}">${esc(it.label)}</a>`
        + ` <span class="idx-path">${esc(it.path)}</span></li>\n`;
    }
    h += '</ul>\n</section>\n';
  }
  return h;
}

function build() {
  const sources = collectSources();
  if (!sources.length) {
    console.error('Nenhum markdown encontrado. Rode a partir da raiz do repositório.');
    process.exitCode = 1;
    return;
  }

  const built = new Set(sources);
  const raw = new Map();
  const titles = new Map();
  for (const p of sources) {
    const md = readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
    raw.set(p, md);
    titles.set(p, firstH1(md) || p.slice(p.lastIndexOf('/') + 1));
  }

  const weights = readWeights();
  const groups = buildNav(sources, titles, weights);
  const maxWeight = Math.max(1, ...[...weights.values()].map((w) => w.weight));

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  copyFileSync(CSS_SRC, join(OUT, 'site.css'));

  const unresolved = new Set();

  for (const p of sources) {
    const srcDir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
    const depth = srcDir ? srcDir.split('/').length : 0;
    const register = registerOf(p);

    const ctx = { srcDir, depth, register, built, unresolved };
    const inst = makeMarked(ctx);
    let md = raw.get(p);
    if (register === 'questions') md = transformOptions(md);

    const tokens = inst.lexer(md);
    const body = renderTokens(inst, tokens, register);

    const html = page({
      title: titles.get(p),
      register,
      fromDir: srcDir,
      nav: navHtml(groups, p, srcDir, maxWeight),
      body,
    });

    const dest = join(OUT, htmlPathOf(p));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, html, 'utf8');
  }

  writeFileSync(join(OUT, 'index.html'), page({
    title: 'Preparação CCAR-F',
    register: 'plain',
    fromDir: '',
    nav: navHtml(groups, null, '', maxWeight),
    body: indexBody(groups, maxWeight),
  }), 'utf8');

  console.log(`site/: ${sources.length + 1} páginas + site.css`);
  for (const u of [...unresolved].sort()) {
    console.log(`  aviso: link fora do site, mantido apontando para a origem — ${u}`);
  }
}

build();
