---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# Institucional e serviços

[institutional](../../../lib/institutional.ts) e [integrated-modules](../../../lib/integrated-modules.ts) conectam módulos institucionais; [experience](../../../lib/experience.ts) reúne atalhos, base de conhecimento, preferências de notificações e consultas do estudante. Ver tabelas/RPCs efetivamente referenciadas em [[20-Catalogo/Banco-e-RPCs]].

| Domínio | Superfícies principais |
| --- | --- |
| Conteúdo público | `/noticias`, `/publicacoes/[id]`, `/agenda-institucional`, `/transparencia` |
| Editais | `/editais`, `/editais/agenda`; catálogo editorial público e calendário |
| Campus e guias | `/campus`, `/campus/[slug]`; dados públicos/links com status editorial |
| Atendimento | `/servicos`, `/solicitacoes`, `/base-conhecimento`, `/reportar-erro` |
| Documentos e trâmite | `/documentos`, `/processos`, documentos acadêmicos em fluxo próprio |
| Oportunidades | `/oportunidades`, `/estagios`, `/auxilios`, `/projetos`, `/tcc` |
| Vida institucional | `/ensino`, `/pesquisa`, `/extensao`, `/estudante`, `/pessoas`, `/administracao` |
| Operação interna | `/painel-institucional`, `/auditoria`, `/monitoramento`, `/pendencias`, `/notificacoes` |
| Preferências e descoberta | `/perfil`, `/atalhos`, `/preferencias-notificacoes`, `/aplicativos`, `/buscar` |

As ações de servidor colocalizadas em cada área fazem validação e escrita. Não deduzir poderes de edição pelo acesso à página: verificar papel, escopo, usuário, estado da conta e RLS em cada ação. [service-request](../../../lib/service-request.ts) também é usado por LUMA; a criação pela assistente exige confirmação explícita.

Editais: [public-notices-data](../../../lib/public-notices-data.ts) contém metadados editoriais; [public-notices](../../../lib/public-notices.ts) define regras, [public-notices-server](../../../lib/public-notices-server.ts) integra consumo. Documentação: [central-editais](../../../docs/central-editais.md). Datas de conferência editorial são parte da evidência; catálogo local não significa coleta automática ativa.

Notícias: [cas-news](../../../lib/cas-news.ts) consome metadados públicos do WordPress do Campus Cáceres; a notícia deve levar à origem. Publicações editoriais SIFCAS têm fluxo e visibilidade próprios. Não extrair eventos acadêmicos ou reclamações a partir de inferências sobre o corpo de notícias.

Campus: [campus-content](../../../lib/campus-content.ts), [CampusResources](../../../components/CampusResources.tsx). Guias e contatos têm data editorial histórica; conferir status/fonte antes de apresentar dado como atual. Áreas planejadas não devem parecer serviços ativos sem destino.

Anexos: [endpoint por ID](../../../app/api/anexos/%5Bid%5D/route.ts) deve respeitar acesso ao objeto e URL assinada/Storage privado. A presença em prefixo público no proxy não elimina as verificações do handler.

[[10-Mapas/Integracoes-e-limites]] · [[10-Mapas/LUMA]] · [[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Rotas]]
