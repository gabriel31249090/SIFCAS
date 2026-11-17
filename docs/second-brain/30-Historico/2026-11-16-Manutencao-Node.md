---
tipo: implementacao-e-validacao
data: 2026-11-16
fuso: America/Cuiaba
commit_base: b73b65b1ec73157996650139f5cb2a4650f7be40
---

# Ferramenta de manutenção Node.js

O usuário autorizou converter também em ferramenta executável o algoritmo Portugol `ManutencaoSistemaV6_Completo`. A implementação está em `tools/maintenance`, com entrada `npm run maintain`. [Guia e correspondência com o algoritmo](../../../tools/maintenance/README.md).

O pipeline usa registros de adapters, configuração como dados, detecção a partir do projeto, execução sem shell, timeout/cancelamento, relatórios e estados explícitos. Nunca transporta os números fixos do pseudocódigo para os resultados. A única correção automática registrada é o catálogo de memória, com branch de trabalho, baseline aprovada, checkpoint delimitado, nova validação e rollback. SQL remoto, correções genéricas de código, atualização de dependências, commit/push e deploy não são ações registradas.

Validações efetivamente executadas em 16/11:

- 24/24 testes próprios passaram; ESLint dos novos arquivos passou. Exercitam argv literal, falhas, timeout, cancelamento, dry-run, retries, baseline, rollback e JSON válido após redação. Incluem restauração dos imports de `next-env.d.ts` e preservação de edições humanas.
- Depois foi adicionado o teste da trava real da CLI em produção/Vercel. O processo do arquivo de testes isola e restaura essas variáveis; a CLI subprocesso continua bloqueando a execução com saída 3. Os 25/25 testes passaram normalmente e também com `VERCEL=1` externo.
- `--mode dry_run --profile complete`: 14 checks planejados, nenhuma ação aplicada, saída 0.
- `--only security,routes,interactions,assets,db-fixture,remote-db`: cinco verificações locais passaram, incluindo 24/24 testes SQL/RLS PGlite; banco remoto indisponível, saída 1. Isso não comprova produção.
- `--mode safe --only memory,unit --fix memory-catalog`: baseline real, checkpoint do catálogo, regeneração e segundo ciclo aprovados; 194/194 testes passaram; uma ação alterou arquivos; saída 0. Checkpoint e relatório preservados localmente em `reports/maintenance/2026-11-16T12-00-20-200Z-402e21f2`.

Os relatórios começaram em `test-results/maintenance`, mas o início da suíte Playwright limpou essa árvore. O caminho final foi corrigido para `reports/maintenance`, ignorado pelo Git. O relatório/checkpoint da correção real foi preservado ali. Registros de execuções anteriores apagados pela limpeza não são apresentados como artefatos disponíveis.

A execução completa encontrou testes da coleção ainda referenciando nomes e sprites SVG antigos. `aero-assets.spec.ts` foi atualizado para os nomes atuais e recortes WebP, preservando verificações de persistência por conta, teclado, foto, resets e carregamento. `aero-images.spec.ts` passou a gravar sua coleta de rede no diretório da execução, sem sobrescrever evidência histórica de 12/11. A primeira execução foi interrompida para corrigir esses testes, sem ser contada como aprovada.

A consulta npm inicial reportou três pacotes de execução afetados (`next`, `sharp`, `source-map-js`). As correções mínimas verificadas em fontes primárias exigiram Next/eslint-config-next 16.4.1, Sharp 0.35.5 e source-map-js 1.2.2, este último dentro do intervalo já permitido pelo PostCSS. [Advisory do Next](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr), [Sharp](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w), [release source-map-js](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2). Após atualização sem force/override, `npm ls` confirmou essas resoluções; `npm run maintain -- --only dependencies --network` reportou zero vulnerabilidades de execução e saída 0 em `reports/maintenance/2026-11-16T12-07-13-159Z-db055e9c`. Isso não é uma auditoria de todas as dependências de desenvolvimento nem garantia geral de segurança.

O build local com Next 16.4.1 compilou, verificou TypeScript e gerou 106 páginas estáticas; os quatro cenários do estudante no perfil (claro/escuro × 375/1440 px) passaram em 22,6 segundos nesse build. Na checagem geral seguinte, lint, TypeScript, 194 testes, três auditorias e assets passaram; a memória detectou a atualização automática do título no bloco do Next em `AGENTS.md` (`#` para `##`). O bloco humano foi preservado, a mudança gerada revisada e o catálogo regenerado. Uma mudança posterior desse arquivo pelo adapter browser passa a gerar aviso explícito, preservando o conteúdo para revisão.

Consulta de deploy somente leitura em 16/11: o commit do perfil `b73b65b` tem Preview success, publicado em 13/11 às 12:00:18 de Cuiabá: [Preview](https://sifcas-jowbez0ue-gabriel31249090s-projects.vercel.app). [Dashboard](https://vercel.com/gabriel31249090s-projects/sifcas/3u9doKfWa9m1q5uZMNMX6LtjFpMp). A Production registrada é `d705518`, da `main`, publicada em 13/11 às 11:59:24 de Cuiabá. `main` e esta branch divergem desde `5377d34`, com 39/16 commits exclusivos na consulta. A main tem outras melhorias e não contém `app/perfil/profile.css`; não houve sobrescrita, merge ou promoção automática. Esses registros não comprovam o alias servido pelo domínio principal.

O ajuste pessoal do gráfico do Obsidian continua preservado e fora dos commits.

## Fechamento retomado em 17/11

O relatório final do adapter browser confirmou 45/45 cenários aprovados em 5,8 minutos, código do runner e do pipeline 0, sem timeout. Artefato: `reports/maintenance/2026-11-16T12-09-28-491Z-c486b415/report.json`. Os imports de tipos do Next foram restaurados e as portas da fixture não estavam mais escutando na retomada. Esse resultado é local e sintético.

A repetição de `npm test` após acrescentar o cenário de CI concluiu com 195/195 testes aprovados (25 da ferramenta e 170 anteriores). O lint focado dos arquivos finais e a checagem de memória passaram. O build e os quatro cenários em produção local com Next 16.4.1 permanecem os resultados de 16/11 descritos acima; não foram reapresentados como uma nova medição do domínio público.

Os arquivos locais `Sem título.base` e `Sem título 1.base` surgiram no vault e foram tratados como trabalho do usuário: preservados e não incluídos no commit, assim como `.obsidian/graph.json`.

[[01-Estado-atual]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[30-Historico/Indice]]
