---
tipo: checkpoint-integracao
data: 2026-11-17
fuso: America/Cuiaba
base_main: d705518e13bf72a73ebddd2c9aa99ed568527782
base_entrega: 6b27c90
---

# Integração salva para continuar

A entrega da ferramenta, segurança, memória e regressões está salva e enviada em `6b27c90`, na branch `codex/aero-asset-collection`. A checagem completa dessa branch passou em 17/11: lint, TypeScript, 195 testes, auditorias, assets e memória. Os 45 cenários Playwright e quatro testes do perfil em produção local são os resultados de 16/11, não medições do domínio público.

No worktree `../SIFCAS-integration`, branch `codex/integrate-aero-maintenance`, foi integrado o trabalho à main `d705518`. Os dois conflitos foram resolvidos: manter imports Aero e readability; combinar feed CAS e suas falhas independentes com avisos e marcadores DEMO das notícias. Login/HIBP, controles DEMO e paginação do diário foram preservados. Nenhuma rotina SQL remota foi executada.

Um seletor global `!important` de readability foi delimitado para preservar a distinção entre campos editáveis e somente leitura do perfil; a regressão de navegador passou a exigir essa distinção. Lint e 198 testes unitários passaram na integração antes da última atualização de framework.

O build integrado com Next 16.4.1 compilou, verificou TypeScript e gerou 106 páginas, mas terminou com `SecurityFatalError` por um advisory publicado após a consulta anterior: [GHSA-mfr8-8qww-v76h](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h), afetando até 16.4.4. A versão mínima corrigida 16.4.5 foi instalada e fixada também em eslint-config-next; package.json, lockfile e pacote instalado conferem. A proteção não foi desativada.

**Antes de publicar:** repetir auditoria de dependências, build de produção local e os cenários do perfil/navegador na integração com 16.4.5. Regenerar/checkar o catálogo após qualquer correção. A main/produção remota ainda não recebeu esta integração; o commit da branch é um checkpoint para revisão, não uma confirmação de produção.

O original `SIFCAS-assets` preserva as alterações pessoais de `.obsidian/graph.json` e os dois arquivos `.base`. A revisão automática bloqueou a limpeza de caches; nenhum cache foi apagado. Os relatórios e checkpoints permanecem em `reports/maintenance` nos respectivos worktrees.

[[01-Estado-atual]] · [[30-Historico/2026-11-16-Manutencao-Node]] · [[40-Decisoes-e-pendencias/Pendencias]]
