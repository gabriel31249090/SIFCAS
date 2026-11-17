---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# LUMA Local

Nome de interface: **LUMA**. Caminhos técnicos preservam `maisa`: `/maisa`, `/api/maisa/chat` e `/api/maisa/actions/service-request`. A assistente é local e determinística; esta implementação não exige Dify/OpenAI ou chave de provedor de IA.

Fluxo: mensagem → validação e conta ativa → contexto do usuário → classificação de intenção → ferramentas autenticadas/base de conhecimento/catálogo de rotas → resposta estruturada. As consultas continuam sujeitas ao escopo e RLS da sessão. Responder uma pergunta não concede permissão de escrita.

| Camada | Fonte |
| --- | --- |
| Tela e estado da conversa | [maisa/page](../../../app/maisa/page.tsx), [MaisaChat](../../../components/MaisaChat.tsx) |
| API de conversa | [chat/route](../../../app/api/maisa/chat/route.ts) |
| Contexto por usuário/papel | [context](../../../lib/maisa/context.ts) |
| Intenções e respostas | [local](../../../lib/maisa/local.ts) |
| Limites compartilhados | [config](../../../lib/maisa/config.ts) |
| Ação de atendimento | [service-request route](../../../app/api/maisa/actions/service-request/route.ts), [service-request domain](../../../lib/service-request.ts) |

`LUMA_CONFIG` define limites de pergunta, turnos, resumo, itens acadêmicos/agenda/publicações/solicitações/processos, tamanho de texto e chunks de streaming. Na leitura inicial: pergunta até 20.000 caracteres, memória até 20 turnos e até 2.500 caracteres por turno, até 5 sugestões de rotas. Consulte os números atuais no código antes de alterá-los ou assumir capacidade maior.

A criação de solicitação fica separada da resposta e exige confirmação explícita no fluxo. Verifique endpoint, validação de título/descrição, conta ativa e prevenção de uso por usuário sem vínculo. Não simular sucesso de RPC ou ocultar indisponibilidade de dados como resposta factual da assistente.

Não confundir a memória curta de conversa da LUMA com este vault. O vault é documentação de engenharia local, não é base automática de dados de alunos nem endpoint público para a assistente.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Institucional-e-servicos]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[20-Catalogo/Indice]]
