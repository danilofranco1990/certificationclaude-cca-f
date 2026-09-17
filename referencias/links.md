# Links de referência

Fontes oficiais Anthropic/Pearson usadas neste programa de estudo. Links verificados em
2026-09-17 (alguns redirecionam de `docs.claude.com` para os domínios atuais `code.claude.com`
e `platform.claude.com` — o redirecionamento é esperado e está correto).

## Exame e certificação

- **Pearson VUE — página do programa de certificação Claude**
  https://www.pearsonvue.com/us/en/anthropic.html
  Para que serve: ponto de entrada oficial de inscrição e agendamento do exame (OnVUE,
  proctored); lista as quatro certificações do programa, política de reagendamento e de
  retake. Usar para confirmar logística de agendamento quando a data do exame for marcada.

- **Anúncio das quatro certificações baseadas em papel (blog da Anthropic)**
  https://claude.com/blog/four-role-based-claude-certifications
  Para que serve: contextualiza onde a CCAR-F se encaixa entre as quatro credenciais
  (Associate Foundations, Developer Foundations, Architect Foundations, Architect
  Professional) e para qual perfil profissional cada uma foi desenhada — útil para calibrar
  o nível de profundidade esperado na prova (arquitetura de soluções, não só uso do produto).

- **Página do exame CCAR-F no Anthropic Partner Academy (Skilljar)**
  https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification
  Para que serve: página de compra/acesso do exame; confirma escopo oficial (Claude Code,
  Claude Agent SDK, Claude API, MCP) e preço (US$ 125). É também o portal onde ficam, atrás de
  login, o **Exam Guide oficial em PDF**, os Termos e Condições e a Anthropic Certification
  Exam Policy — a pendência externa nº 1 listada no `README.md`.

## Documentação técnica

- **Claude Code — documentação**
  https://docs.claude.com/en/docs/claude-code/overview
  Para que serve: referência de comandos, configuração (`CLAUDE.md`, `.claude/rules/`, slash
  commands, skills, hooks, `settings.json`), modo não-interativo e uso em CI/CD — base direta
  dos Domínios 1 e 2.

- **Claude Agent SDK — documentação**
  https://docs.claude.com/en/docs/agent-sdk/overview
  Para que serve: API para construir agentes programaticamente (TypeScript/Python) sobre o
  mesmo agent loop do Claude Code — base do lab de orquestração com fan-out do Domínio 1 e do
  projeto integrador.

- **Messages API — referência**
  https://docs.claude.com/en/api/messages
  Para que serve: contrato da chamada síncrona a Claude (mensagens, `tool_use`, `tool_choice`,
  streaming) — base dos Domínios 3 e 4.

- **Message Batches API — referência**
  https://docs.claude.com/en/api/messages/batches
  Para que serve: processamento assíncrono em lote, custo reduzido e janela de processamento —
  conteúdo específico do Domínio 3 (quando usar batch em vez de chamada síncrona).

- **Model Context Protocol — documentação**
  https://modelcontextprotocol.io/
  Para que serve: especificação e guias de servidores/clientes MCP (tools, resources, prompts,
  transports stdio/HTTP) — base do Domínio 4.
