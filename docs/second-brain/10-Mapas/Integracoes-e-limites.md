---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-local-de-codigo-e-documentos
---

# Integrações e limites

O SIFCAS reúne integrações com níveis de evidência distintos. Conferir cada contrato antes de chamá-lo de conectado, homologado ou oficial. A documentação histórica relata que o projeto é independente e não comprova autorização para se apresentar como portal oficial do IFMT.

| Integração | Evidência local e limite |
| --- | --- |
| Supabase Auth/Postgres/Storage | Clientes SSR/browser e contratos no código. Projeto referenciado em documentação: `xqhilujzacwebeexljaf`. Schema e RLS remotos não auditados nesta tarefa; baseline ausente |
| CSV acadêmico | Formato SIFCAS próprio e contratos isolados; não é conector nativo SUAP |
| Agenda ICS | Importação privada de calendário; não comprova sincronização contínua com AVA/SUAP |
| WordPress CAS | Consumo público de metadados de notícias em `lib/cas-news.ts`; não publica nem altera o portal de origem |
| Editais IFMT | Catálogo editorial local com links e datas de revisão; coleta automática não é presumida |
| SUAP | Documento histórico registra OpenAPI público observado em 06/11. Cliente OAuth, escopos, consentimento e autorização institucional continuam pendentes |
| Moodle/AVA | Links/guias; serviços externos e funções de leitura dependem de habilitação pelo administrador |
| Vercel | Configuração/deploy e observabilidade no código; métricas dependem do projeto e da versão realmente implantada |
| E-mail Supabase | Templates versionados e script de configuração/aplicação; presença de template não comprova configuração SMTP remota |
| Agent bridge MCP | Fila SQLite local entre agentes, documentação e script próprios; operação não exige enviar dados a terceiros |

Fontes: [integracoes-ifmt](../../../docs/integracoes-ifmt.md), [validacao-integracoes](../../../docs/validacao-integracoes.md), [supabase/README](../../../supabase/README.md), [agent-bridge-mcp](../../../docs/agent-bridge-mcp.md).

Configuração: [supabase config](../../../lib/supabase/config.ts), [config-policy](../../../lib/supabase/config-policy.ts), [next config](../../../next.config.ts). Sem configuração Supabase válida, guias/editais públicos podem continuar disponíveis, enquanto o banco fica indisponível. Não inserir fallback de produção para facilitar demonstração local. Consulte nomes de flags e opções no código e nos guias; valores/segredos não pertencem ao vault.

Uma nova integração precisa registrar instância/versão, responsável institucional e técnico, autorização, finalidade, campos mínimos, papéis/escopos, IDs externos, paginação/limites/timeouts, consentimento/revogação, dados sintéticos e data de homologação. Não coletar senha SUAP/Moodle como atalho.

Saúde HTTP 200 e documentação OpenAPI são evidências específicas e temporais: não demonstram integração privada aprovada, disponibilidade de todos os módulos ou RLS correto. Esta catalogação não consultou os serviços remotos; fatos de rede citados são atribuições aos documentos com suas datas.

[[10-Mapas/Academico-e-importacoes]] · [[10-Mapas/Auth-perfis-e-RLS]] · [[40-Decisoes-e-pendencias/Pendencias]] · [[20-Catalogo/Documentacao]]
