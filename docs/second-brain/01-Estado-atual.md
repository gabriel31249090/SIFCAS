---
tipo: estado-atual
verificado_em: 2026-11-12
commit_base: bdc55fcc16f3a8c1bf994ead5841e3f8e8387f87
evidencia: leitura-local-de-codigo-e-documentos
---

# Estado atual

Checkpoint inicial: HEAD `bdc55fcc16f3a8c1bf994ead5841e3f8e8387f87`. A árvore já tinha `next-env.d.ts` modificado quando a catalogação começou. O manifesto em [[20-Catalogo/Indice]] mede também arquivos modificados; confira sua data e hashes para saber qual versão foi efetivamente catalogada.

**Em andamento nesta sessão de 12/11/2026:** melhorias de IFOS e acessibilidade por outros agentes, além desta memória. O conteúdo do inventário pode incluir alterações locais mais recentes que o commit base. O checkpoint final precisa registrar a validação conjunta; este registro inicial não atribui aprovação ou sucesso a testes da aplicação.

Fatos verificados por leitura local nesta catalogação:

- Next.js App Router, React e TypeScript; `package.json` requer Node `>=24 <25`. A versão exata de dependências está no lockfile.
- SSR Supabase, sessão por cookie, cinco papéis (`student`, `teacher`, `staff`, `manager`, `admin`) e estados `active`, `pending`, `suspended`. Proxy, ações e RLS precisam ser considerados em conjunto.
- Há módulos acadêmicos, importações CSV/ICS, documentos verificáveis, serviços, processos, conteúdo institucional, notícias públicas, editais, notificações e busca. O inventário descreve todos os arquivos do escopo, sem garantir que cada fluxo remoto esteja operacional.
- LUMA usa motor local determinístico em `/maisa`; as rotas de API ainda usam o nome técnico `maisa`.
- Personalização do estudante reside no navegador. A rota `/ifos` monta um desktop experimental a partir dos módulos acessíveis e do painel Hoje.
- Não existe baseline SQL remota verificada. `supabase/isolated/` fornece contratos/fixtures para homologação; `supabase/patches/` não implica aplicação em produção.
- Referência oficial do Obsidian já clonada fora do app: `../references/obsidian-releases`, origin `https://github.com/obsidianmd/obsidian-releases.git`, HEAD `598dc9bbbb5f82017843b0739509b85d93f019a4`, conferido localmente. O app Obsidian é fechado; esse repositório contém releases e listas, não o código do editor.

Evidências históricas, **não revalidadas remotamente nesta catalogação**:

- Documentos de 03/11 relatam saúde HTTP 200 e negação de acesso administrativo ao Supabase correto. Saúde não demonstra schema, grants ou RLS.
- Documentos de integração descrevem inspeção pública de SUAP/WordPress em 06/11, sem conector privado SUAP/AVA homologado.
- Relatórios anteriores de testes/auditorias permanecem com suas próprias datas e ressalvas. Não transportá-los para o estado atual como resultados recém-executados.

Validação desta entrega de memória: o agente executa geração, checagem de catálogo/links e consultas locais; o resultado exato deve constar no histórico. Lint, testes, E2E e build do produto exigem registro separado do responsável pela validação final.

Próximos pontos: [[40-Decisoes-e-pendencias/Pendencias]]. Proveniência: [[30-Historico/2026-11-12-Inventario-inicial]].
