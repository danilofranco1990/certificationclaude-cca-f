# Visualizações — simuladores interativos

HTMLs autônomos gerados pela skill `/visualizar-conceito` a partir de conteúdos do material que
precisavam ser *vistos funcionando*. Cada arquivo abre direto no navegador (`file://`), sem
servidor nem dependências, e distingue o que está no material, o que foi confirmado na
documentação oficial e o que é hipótese da simulação.

Os originais em `dominios/` não são alterados; estes HTMLs são fonte (entram no git), não
artefato gerado — `site/` não os inclui.

| Data | Arquivo | Origem | Recorte |
|---|---|---|---|
| 2026-09-24 | [`2026-09-24-00-fundamentos-ciclo-tool-use.html`](./2026-09-24-00-fundamentos-ciclo-tool-use.html) | `dominios/00-fundamentos/notas.md` §3–§4 | o que a aplicação faz após `stop_reason: "tool_use"`: 1 ou 2 `tool_use`, erro com `is_error`, continuação `end_turn` ou nova rodada |
| 2026-09-24 | [`2026-09-24-avulso-proxima-acao-apos-tool-use.html`](./2026-09-24-avulso-proxima-acao-apos-tool-use.html) | conteúdo colado (questão "próxima ação após `stop_reason: "tool_use"`" + cadeia de 5 passos) | a decisão da questão como máquina de estados: alternativa certa × 3 distratores (exibir e aguardar, reenviar, "a API executa"), forma do retorno (falta um `tool_result`, id inventado, sem a mensagem `assistant`) e continuação `end_turn`/`tool_use` |
| 2026-09-24 | [`2026-09-24-avulso-agent-loop-linha-a-linha.html`](./2026-09-24-avulso-agent-loop-linha-a-linha.html) | conteúdo colado (pseudocódigo "Modelo mental: o loop" + leitura linha a linha) | o agent loop como depurador: linha em execução, contadores por linha, variáveis e `messages`; ajustes do código (gravar só o texto, tratar `max_tokens`/`refusal`, limite de voltas) × stop_reason escolhido a cada resposta; validar/negar `abrir_reembolso` |
| 2026-09-24 | [`2026-09-24-avulso-anatomia-loop-agentico.html`](./2026-09-24-avulso-anatomia-loop-agentico.html) | conteúdo colado (D1 §1 "Anatomia do loop agêntico": o problema + modelo mental; restante da §1 lido em `dominios/01-agentic-architecture/notas.md`) | a seta que volta: a mesma tarefa de 4 passos com 5 verificadores (nenhum, auto-relato, linter, testes do próprio modelo, build + casos da spec) e, quando a falha é acusada, 3 reações (corrigir com a falha no contexto, repetir às cegas, ignorar); crença × verdade por passo e comparação dos 7 desfechos |
| 2026-09-30 | [`2026-09-30-avulso-instrucao-vs-hook.html`](./2026-09-30-avulso-instrucao-vs-hook.html) | conteúdo colado (D1 §6 Hooks: o problema, modelo mental, definição; restante da §6, `armadilhas.md` e questão 6 lidos em `dominios/01-agentic-architecture/`) | a regra “nunca edite `infra/prod/`” como instrução × hook numa sessão longa: onde a regra mora (`CLAUDE.md` da raiz × conversa) diante da compaction, o `settings.json` montado pelo usuário (evento, matcher, saída do script) e o pedido do modelo no turno 41 (não tocar, `Edit`, `Write`, `Bash`), com nova tentativa após bloqueio; trilho do ciclo de vida, arquivo em disco, matriz proteção × pedido e o “quase sempre” em números |
