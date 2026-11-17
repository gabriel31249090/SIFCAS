---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# Arquitetura e navegação

O SIFCAS usa Next.js App Router. `app/**/page.tsx` define telas, `route.ts` atende endpoints e vários diretórios têm `actions.ts` com ações de servidor. Layout, estados de loading/erro, chrome da aplicação e CSS global compõem a experiência. O projeto requer leitura dos guias locais da versão Next antes de alterar APIs do framework, conforme `AGENTS.md`.

Fluxo comum: requisição → `proxy.ts` → `lib/supabase/proxy.ts` (sessão/rotas/papéis) → página/ação → biblioteca de domínio → cliente Supabase com sessão → autorização no banco. Conteúdo público pode ser servido sem sessão; operações privadas precisam de conta ativa.

| Responsabilidade | Fontes principais |
| --- | --- |
| Shell, metadados e estilos | [layout](../../../app/layout.tsx), [AppChrome](../../../components/AppChrome.tsx), [AppShell](../../../components/AppShell.tsx), `app/*.css` |
| Catálogo de capacidades por papel | [module-catalog](../../../lib/module-catalog.ts), [integrated-modules](../../../lib/integrated-modules.ts) |
| Grupos de navegação e links | [navigation](../../../lib/navigation.ts), [Sidebar](../../../components/Sidebar.tsx), [MobileNav](../../../components/MobileNav.tsx), [Topbar](../../../components/Topbar.tsx) |
| Busca e diretório | [GlobalSearch](../../../components/GlobalSearch.tsx), [ModuleDirectory](../../../components/ModuleDirectory.tsx), [search-utils](../../../lib/search-utils.ts), [buscar](../../../app/buscar/page.tsx) |
| Home e pendências | [home](../../../app/page.tsx), [home-today-server](../../../lib/home-today-server.ts), [pending](../../../lib/pending.ts) |
| Camada de dados | [cliente servidor](../../../lib/supabase/server.ts), [cliente browser](../../../lib/supabase/client.ts), [config-policy](../../../lib/supabase/config-policy.ts) |

Os diretórios `components/` e `lib/` estão integralmente em [[20-Catalogo/Indice]], incluindo símbolos exportados e dependências locais. O inventário também cobre componentes colocalizados em `app/`, como formulários e o desktop IFOS. Consulte [[20-Catalogo/Rotas]] para a lista exata e atualizada de URLs, inclusive parâmetros e metadados.

Papéis no menu são apresentação. Uma alteração no catálogo não concede autorização: conferir proxy, página, ação, queries e políticas. Não presumir que título de cartão ou documentação antiga corresponda a funcionalidade remota operacional.

Fontes editoriais locais: [README](../../../README.md), [melhorias do portal](../../../docs/PORTAL-IMPROVEMENTS.md), [catálogo de assets](../../../docs/ASSET_CATALOG.md). São documentos com contexto próprio, não evidência de execução atual.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Personalizacao-Aero-e-IFOS]] · [[20-Catalogo/Indice]] · [[00-INICIO]]
