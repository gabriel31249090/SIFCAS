---
tipo: estado-atual
verificado_em: 2026-11-17
commit_base: b73b65b1ec73157996650139f5cb2a4650f7be40
evidencia: codigo-e-testes-locais-sinteticos
---

# Estado atual

**Checkpoint imediato de 17/11:** a integração da `main` `d705518` com a entrega `6b27c90` foi preparada em `codex/integrate-aero-maintenance`, no worktree `../SIFCAS-integration`. Os conflitos de layout/notícias foram resolvidos preservando estilos, feed CAS e identificação DEMO. Lint e 198 testes unitários passaram na integração com Next 16.4.1; o build compilou e gerou 106 páginas, mas terminou bloqueado por um novo advisory. Next e eslint-config-next foram atualizados para 16.4.5, com package/lock/instalação coerentes. **Falta repetir build e navegador nessa versão integrada antes de publicar em produção.** Ver [[30-Historico/2026-11-17-Integracao-salva]]. A `main` remota não foi alterada nesta integração.

Em 16/11, a ferramenta Node.js de manutenção foi implementada em `tools/maintenance`. O planejamento completo funciona sem executar comandos; 25 testes próprios passaram, inclusive com ambiente Vercel externo. Regras estáticas, assets e 24 contratos SQL/RLS sintéticos foram executados pelos adapters. A correção real do catálogo passou com checkpoint, nova checagem de memória e 194/194 testes, em dois ciclos. Next/eslint-config-next foram atualizados para 16.4.1, Sharp para 0.35.5 e source-map-js para 1.2.2 após avisos reais do npm; a nova consulta de dependências de execução reportou zero vulnerabilidades. Build de produção local com 106 páginas e quatro cenários do perfil passaram nessa versão. Ver [[30-Historico/2026-11-16-Manutencao-Node]] para os resultados finais e os limites.

Na retomada de 17/11, os relatórios concluídos confirmaram 195/195 testes do projeto e 45/45 cenários da suíte sintética Playwright, incluindo os testes atualizados da coleção. O adapter browser encerrou com saída 0 e restaurou os imports gerados; a fixture foi encerrada. O gráfico do Obsidian e os dois arquivos `.base` criados pelo usuário foram preservados fora da entrega.

A correção do perfil está salva e enviada em `b73b65b`, com Preview Vercel success em 13/11 às 12:00:18 de Cuiabá. A Production registrada corresponde à `main` `d705518`, com histórico divergente e outras alterações; ela não contém a correção completa do perfil desta branch. Não sobrescrever nem promover a branch inteira sem integrar e revisar essa divergência. O registro GitHub não garante o alias atual após promoções manuais.

Em 13/11, o perfil recebeu estilos delimitados para corrigir faixa duplicada, retrato e contraste dos campos/atalhos. Os 19 cenários Playwright de desenvolvimento e quatro no build de produção local passaram com contas sintéticas. ESLint, TypeScript, os 170 testes existentes e o build com 106 páginas passaram. Ver [[30-Historico/2026-11-13-Perfil]] para o escopo e os limites; o envio do formulário verifica a apresentação de erro da fixture, sem comprovar gravação remota.

Checkpoint de entrega em 12/11/2026: IFOS salvo em `f341b35`; imagens, legibilidade e memória em `02d4183`, na branch `codex/aero-asset-collection`. A `main` foi integrada preservando as mensagens de login voltadas ao usuário. O manifesto em [[20-Catalogo/Indice]] registra hashes das fontes efetivamente catalogadas, inclusive documentação final posterior ao commit base.

**Implementado e verificado localmente:** layout IFOS por conta com redimensionamento; recortes e miniaturas WebP; revisão delimitada de contraste, teclado e zoom; vault e comandos de recuperação. Em 13/11, a API GitHub registrou o IFOS `f341b35` como Production/success (12/11 às 15:05 em Cuiabá) e `02d4183` como Preview/success. Isso não identifica sozinho o commit servido pelo domínio após eventuais promoções manuais. A publicação das melhorias posteriores ainda precisa ser confirmada na conta correta; um plano pago não foi diagnosticado como requisito.

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

Validação local desta entrega: 170 testes do app e 15 do auditor passaram; 15 cenários Playwright passaram (5 novos do IFOS, 9 regressões de papéis/mobile/desktop e 1 da coleção). Build Next.js de produção local concluiu com 106 páginas estáticas. Lighthouse local em `/noticias`: performance 100, acessibilidade 100, boas práticas 96, SEO 100; os números não representam o domínio publicado ou métricas de campo. A primeira tentativa teve erro de trace `NO_NAVSTART`; a repetição concluída gerou a evidência final. Os avisos de observabilidade local permanecem no relatório, sem serem escondidos para melhorar a nota.

Geração, checagem de links/hashes e recuperação de memória foram executadas. Textos usam hashes canônicos LF; arquivos binários mantêm os bytes originais. `npm run check` e o workflow Quality incluem a checagem de assets e da memória; consultar [[30-Historico/2026-11-13-Fechamento]] para a validação consolidada final.

Próximos pontos: [[40-Decisoes-e-pendencias/Pendencias]]. Proveniência: [[30-Historico/2026-11-12-Inventario-inicial]].
