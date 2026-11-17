---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# Acadêmico e importações

O núcleo acadêmico liga curso, turma, disciplinas, vínculo docente e matrícula a avaliações, notas, aulas, frequência e documentos. [academic](../../../lib/academic.ts), [diary](../../../lib/diary.ts), [diary-security](../../../lib/diary-security.ts), [teacher-workspace](../../../lib/teacher-workspace.ts) e [documents](../../../lib/documents.ts) concentram consultas/regras. Os nomes de tabelas/RPCs e seus chamadores estão em [[20-Catalogo/Banco-e-RPCs]].

| Experiência | Rotas e fontes |
| --- | --- |
| Consulta do estudante | `/boletim`, `/disciplinas`, `/horarios`, `/avaliacoes`, `/agenda-aluno` |
| Trabalho docente | `/minhas-turmas`, `/diario-professor`; ações do diário verificam escopo |
| Gestão acadêmica | `/gestao-academica`, restrita a manager/admin no proxy |
| Documentos | `/documentos-academicos`, `/documentos-academicos/[id]`, `/verificar-documento` |
| Cópia de dados acadêmicos | `/importar-dados-academicos`, `/importar-dados-academicos/lotes/[id]` |
| Calendário privado | `/importar-calendario`, agenda pessoal |

Importação CSV: [parser](../../../lib/academic-import.ts) → [orquestração de servidor](../../../lib/academic-import-server.ts) → [ações](../../../app/importar-dados-academicos/actions.ts) → contratos/RPCs previstos em [academic-import.sql](../../../supabase/isolated/academic-import.sql). O formato `sifcas-academic-v1` é próprio do SIFCAS, **não é exportação nativa comprovada do SUAP**. Preservar origem, lote, IDs externos e distinção visual entre cópia importada e lançamento local. Professor precisa de vínculo; manager/admin não ganha escopo irrestrito implicitamente.

O conjunto `academic-import.fixture.sql`, `.seed.sql`, `.sql` e `.rollback.sql` suporta teste/homologação com schema sintético e rollback. O teste PGlite não usa produção e não demonstra compatibilidade com schema remoto desconhecido. Flags de importação permanecem dependentes da configuração e homologação documentadas; não habilitá-las só porque um teste isolado passou.

Calendário ICS: [ical](../../../lib/ical.ts), [ações de calendário](../../../app/importar-calendario/actions.ts), [PersonalCalendar](../../../components/PersonalCalendar.tsx), [contrato SQL](../../../supabase/isolated/personal-calendar.sql) e rollback. A importação é agenda pessoal e precisa respeitar limites do parser e isolamento do usuário. Não equivale a sincronização autenticada contínua SUAP/AVA.

Painel Hoje combina contexto acadêmico e itens relevantes: [home-today](../../../lib/home-today.ts), [home-today-server](../../../lib/home-today-server.ts). O IFOS recebe somente itens com caminho de módulo acessível, limitados no servidor. Não usar uma visualização resumida como autorização de escrita.

Guia de uso/formato: [importacao-academica](../../../docs/importacao-academica.md). Percurso local: [homologação sintética](../../../docs/frutiger-e-homologacao-local.md), `npm run dev:academic` e `npm run test:e2e:academic`. As sessões sintéticas são locais; não representam autenticação real da instituição.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Integracoes-e-limites]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[20-Catalogo/Indice]]
