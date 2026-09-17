# Glossário

Termos do syllabus com definição precisa em português. Termos técnicos permanecem em inglês
(convenção do repositório). Coluna "Domínio" aponta o módulo em que o termo é aprofundado —
vários termos são citados em mais de um domínio; a coluna indica onde ele é definido em detalhe.

| Termo (EN) | Definição (PT) | Domínio |
|---|---|---|
| agentic loop | O ciclo *gather context → take action → verify work → repeat* que caracteriza um agente, em oposição a uma única chamada ao modelo. A etapa de verificação é o que distingue um agente de uma completion isolada. | 1 |
| subagent | Instância de Claude invocada por um agente orquestrador para executar uma subtarefa em contexto próprio, isolado do contexto do agente pai; só enxerga o que for passado explicitamente no prompt de invocação. | 1 |
| fan-out | Padrão de disparar múltiplos subagents em paralelo, cada um com um recorte independente do problema, para depois sintetizar os resultados. Só é seguro quando as subtarefas não compartilham estado mutável. | 1 |
| hook | Script determinístico configurado em `settings.json` que o Claude Code executa automaticamente em um ponto fixo do ciclo de vida (ex.: `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`). Roda sempre, independentemente do que o modelo decidir — ao contrário de uma instrução em prompt, que é probabilística. | 1 |
| session | Uma conversa contínua com Claude Code, com histórico de turnos e estado (arquivos abertos, contexto acumulado). Pode ser retomada (`--resume`/`--continue`) ou iniciada do zero, o que descarta o histórico anterior. | 1 |
| context window | O orçamento total de tokens (entrada + saída) que o modelo processa em uma chamada. Tudo que está "em contexto" — histórico, saída de ferramentas, arquivos lidos — compete por esse mesmo espaço. | 5 |
| lost in the middle | Efeito de degradação da atenção do modelo sobre informação posicionada no meio de um contexto longo; informação no início ou no fim do prompt tende a ser melhor aproveitada. | 5 |
| scratchpad | Arquivo externo usado como memória de trabalho de um agente, fora da janela de contexto. Permite preservar fatos exatos (números, fontes) sem depender de o modelo "lembrar" corretamente ao longo de um resumo. | 5 |
| progressive summarization | Técnica de resumir uma conversa ou pesquisa longa de forma incremental, turno a turno, mantendo explicitamente uma lista de fatos que nunca podem ser parafraseados ou aproximados. | 5 |
| provenance | Metadado que acompanha uma afirmação produzida por um agente, indicando de onde ela veio (fonte, data, citação). Necessário para que o resultado de um passo de pesquisa possa ser auditado e verificado depois. | 5 |
| tool_choice | Parâmetro da Messages API que controla se e como o modelo deve chamar ferramentas: `auto` (o modelo decide), `any` (deve chamar alguma ferramenta, mas escolhe qual), `tool` (força uma ferramenta específica pelo nome) ou `none` (proíbe chamada de ferramenta). | 4 |
| tool_use | Tipo de content block que Claude retorna ao decidir invocar uma ferramenta, contendo o nome da ferramenta e os argumentos que satisfazem o `input_schema` declarado. Também usado como técnica para forçar saída estruturada, em vez de pedir JSON em texto livre. | 3 |
| JSON Schema | Especificação formal (usada no `input_schema` de uma tool ou no schema de saída estruturada) que define os campos esperados, seus tipos e quais são obrigatórios (`required`). A `description` de cada campo funciona como instrução para o modelo, não só como documentação. | 3 |
| enum | Restrição de JSON Schema que fecha o valor de um campo a uma lista finita e explícita de opções, eliminando variação de formato ou valores fora da lista. | 3 |
| nullable | Propriedade de um campo de schema que permite explicitamente o valor `null` além do tipo declarado. Usada para modelar "não encontrado" ou "não aplicável" de forma explícita, em vez de deixar o modelo inventar um valor ou simplesmente omitir o campo. | 3 |
| few-shot | Técnica de prompt engineering que inclui exemplos completos de entrada e saída desejada no prompt. A qualidade depende de diversidade dos exemplos e de incluir pelo menos um caso difícil/de borda, não só os casos fáceis. | 3 |
| Message Batches API | Endpoint da Claude API para enviar um grande volume de requisições de uma vez para processamento assíncrono, com janela de processamento de até 24h e custo reduzido (cerca de 50%) frente a chamadas síncronas. Inadequado quando a resposta precisa ser imediata. | 3 |
| MCP server | Processo que expõe tools, resources e/ou prompts para um cliente (como Claude Code) seguindo o Model Context Protocol. É a unidade de integração que um agente conecta para ganhar acesso a um sistema externo. | 4 |
| MCP resource | Primitiva do MCP que expõe dado somente leitura, endereçável por URI (ex.: `policy://refunds`), para ser lido como contexto. Diferente de uma tool, não é "chamada" com argumentos para executar uma ação. | 4 |
| transport | Mecanismo de comunicação entre cliente e servidor MCP (ex.: stdio ou HTTP). A escolha muda a forma de deploy e o modelo de autenticação disponível. | 4 |
| stdio | Transport do MCP em que cliente e servidor trocam mensagens via entrada/saída padrão de um processo local. Simples de configurar, mas assume que servidor e cliente rodam na mesma máquina. | 4 |
| planning mode | Modo do Claude Code em que o agente apresenta um plano de ação para aprovação explícita antes de executar qualquer mudança. Usado quando o custo de uma ação errada é alto. | 2 |
| headless mode | Execução do Claude Code sem interface interativa, via `claude -p`, tipicamente em scripts ou CI/CD, consumindo a saída em formato estruturado (`--output-format json` ou `stream-json`) em vez de texto para leitura humana. | 2 |
| path-specific rules | Regras de projeto definidas em `.claude/rules/` que valem apenas para arquivos que casam com um glob específico (ex.: `**/*.sql`), em vez de entrar no `CLAUDE.md` geral e ficar sempre em contexto. | 2 |
| skill | Conjunto empacotado de instruções (`SKILL.md` com `name` e `description`) que fica fora do contexto até sua `description` combinar com a tarefa atual. A description funciona como o gatilho de acionamento — o mecanismo chamado de progressive disclosure. | 2 |
| slash command | Prompt reutilizável definido como arquivo em `.claude/commands/`, invocado explicitamente digitando `/nome-do-comando`. O corpo do arquivo é o próprio prompt, podendo referenciar `$ARGUMENTS`. | 2 |
| context fork | Frontmatter (`context: fork`) de um slash command ou subagente que faz a execução rodar em contexto separado do principal, devolvendo só o resultado final. Protege a janela de contexto do agente-pai de ficar poluída com passos intermediários. | 2 |
| allowed-tools | Frontmatter que restringe, para um slash command ou subagente específico, o conjunto de ferramentas que ele pode invocar — por exemplo, limitar a apenas leitura para evitar mudanças acidentais. | 2 |
| argument-hint | Frontmatter de um slash command que documenta, para quem for invocá-lo, a forma esperada do argumento (ex.: um hash de commit, um caminho de arquivo). | 2 |
| confidence calibration | Grau em que a confiança declarada por um modelo (ou agente) corresponde à sua acurácia real. Confiança alta declarada não é garantia de acerto — por isso não deve substituir critérios objetivos de verificação. | 5 |
| human escalation | Ato de interromper a execução automática e devolver a decisão a um humano, disparado por gatilhos como baixa confiança, ação irreversível, conflito de requisitos ou falha repetida. Deve preservar o estado acumulado para que o humano não precise recomeçar do zero. | 1 |
