---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# Testes, deploy e operações

Os comandos são definidos em [package.json](../../../package.json), com dependências fixadas pelo lockfile e Node 24. Esta nota descreve o pipeline configurado; resultados de execução precisam de data/ambiente/comando no histórico.

| Objetivo | Comando/configuração |
| --- | --- |
| Verificação completa | `npm run check`: lint, typecheck, testes e auditorias |
| Regressão de domínio/SQL | `npm test`: Node test runner com strip-types e concorrência 1; testes `tests/*.test.mjs` |
| Auditorias estáticas | `npm run audit:ui`, `audit:routes`, `audit:quality`; combinadas em `npm run audit` |
| Produção local | `npm run build`: auditorias + testes + `next build` |
| Smoke público | `npm run test:e2e`, [playwright.config](../../../playwright.config.ts) |
| Percurso sintético acadêmico | `npm run test:e2e:academic`, `npm run dev:academic`, [runner](../../../scripts/run-academic-e2e.mjs) |
| Banco local/homologação | PGlite e fixtures em `tests/`/`supabase/isolated`; não comprovam schema remoto |
| Memória | `node scripts/second-brain-check.mjs`, `node scripts/second-brain-recall.mjs "tema"` |

Cobertura catalogada: importação acadêmica e RLS isolada, status de contas admin, personalização/assets, catálogo/segurança/SEO, calendário, diário/docente, editais/notícias, solicitações, configuração Supabase, e-mail e bridge MCP. Suítes browser ficam em `tests/e2e` e `tests/academic-browser`; consulte todas as fichas em [[20-Catalogo/Indice]]. A auditoria visual em `tools/sifcas-ui-auditor` possui escopo e evidências próprios; seus relatórios não representam automaticamente toda a experiência autenticada.

CI: [.github/workflows/quality.yml](../../../.github/workflows/quality.yml) roda em push/PR para `main`, Node 24, `npm ci`, lint, build (que repete auditorias/testes), instalação Chromium e smoke público. O workflow lido não executa explicitamente `npm run typecheck` separado nem a suíte acadêmica completa; o comportamento de checagem do build depende do Next. Não relatar uma cobertura que o workflow não possui.

Vercel: [vercel.json](../../../vercel.json), [next.config](../../../next.config.ts), [layout](../../../app/layout.tsx), [health](../../../app/api/health/route.ts). Há Analytics/Speed Insights no layout e headers defensivos. `/api/health` deve validar o contrato da RPC; saúde não substitui auditoria de autorização. Monitoramento interno está em `/monitoramento`, alterações críticas em `/auditoria`.

Operações Supabase: scripts de geração de tipos e configuração de e-mails verificam projeto/saída; não executá-los contra projeto substituto. `supabase db pull` deve produzir baseline a partir do projeto correto, revisada e testada em staging antes de uso. [PRODUCTION](../../../docs/PRODUCTION.md) e [supabase/README](../../../supabase/README.md) detalham dependências administrativas.

Backups: `npm run db:backup` usa ferramentas PostgreSQL, valida índice com `pg_restore --list` e grava SHA-256. `npm run db:restore-test` requer destino descartável e confirmação explícita, recusa produção. Storage exige cópia separada. O vault não guarda dumps nem strings de conexão. Existência dos scripts não comprova backup/restauração realizados.

Para esta sessão: não houve commit/deploy executado pelo agente de memória nem execução de migrations. O histórico registra somente os checks de memória efetivamente feitos; o coordenador deve acrescentar os resultados finais do produto após as alterações paralelas.

[[30-Historico/Indice]] · [[40-Decisoes-e-pendencias/Pendencias]] · [[20-Catalogo/Indice]] · [[00-INICIO]]
