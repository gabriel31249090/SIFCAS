<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Memória do projeto

Antes de alterar o projeto, leia `docs/second-brain/00-INICIO.md` e `docs/second-brain/01-Estado-atual.md`. Esse vault Obsidian é a memória versionada do SIFCAS; a fonte de verdade continua sendo o código e as evidências atuais.

- Recupere apenas o domínio necessário: `npm run memory:recall -- "IFOS" --limit 5`. Consulte os caminhos de código indicados antes de decidir. Não carregue o catálogo inteiro no contexto.
- Diferencie fatos verificados, propostas e bloqueios. Registre data, fonte e resultado dos testes; uma nota antiga de deploy não confirma o estado atual da Vercel.
- Ao concluir uma tarefa, atualize o estado atual e a nota do domínio afetado; registre decisões relevantes no histórico. Nunca armazene tokens, senhas, cookies, arquivos `.env` ou dados reais de alunos.
- Depois das alterações, execute `npm run memory:catalog` e `npm run memory:check`. O inventário gerado registra hashes e detecta mudanças não catalogadas. Atualizar um hash não significa validar o comportamento.
- Preserve as notas humanas. O gerador só mantém a área de inventário automático. Não substitua o histórico nem registre uma tarefa incompleta como concluída.

Para abrir no Obsidian, use a pasta `docs/second-brain` como vault. O clone oficial em `../references/obsidian-releases` contém releases e diretórios da comunidade, não o código-fonte do aplicativo Obsidian.
