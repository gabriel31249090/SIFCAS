---
tipo: pendencias
verificado_em: 2026-11-16
---

# Pendências e perguntas abertas

| Item | Evidência/limite atual | Próxima ação necessária |
| --- | --- | --- |
| Validação e publicação da integração | Integração preparada em codex/integrate-aero-maintenance, preservando main d705518 e entrega 6b27c90; Next atualizado para 16.4.5 após advisory novo | Repetir build e navegador na integração antes de publicar; conferir domínio e papéis na conta correta. Ver [[30-Historico/2026-11-17-Integracao-salva]] |
| Cobertura visual ampliada | Revisão local clara cobre páginas/estados do relatório; gradientes ainda geram incomplete | Ampliar para todos os temas, estados de erro e leitor de tela sem supor conformidade integral |
| Baseline Supabase/RLS remota | supabase/README declara ausência de inventário verificado | Acesso ao projeto correto, exportação estrutural, revisão grants/policies/triggers e testes em staging |
| Patch de status de conta instalado? | Existe patch local e chamada de RPC; aplicação remota não comprovada | Conferir função e grants em staging/remoto autorizado antes de afirmar disponibilidade |
| Homologação importação CSV/ICS | Testes usam contratos isolados; schema remoto desconhecido | Comparar contrato com banco real, testar papéis/escopo, aprovar flags de forma explícita |
| Integração privada SUAP/AVA | OpenAPI/links não equivalem a autorização ou cliente aprovado | Responsável institucional, instância, OAuth/serviço, escopos, consentimento e amostra sintética |
| Dados oficiais Campus/guias | Parte do conteúdo preserva revisão editorial anterior | Conferir fontes/contatos/instância e registrar nova data real de verificação |
| Segurança externa Auth | CAPTCHA/SMTP/proteção de senha dependem de Dashboard/plano | Responsável conferir projeto correto e registrar configuração efetiva |
| Backup e restauração comprovados | Scripts existem; ensaio atual não realizado pelo agente | Executar rotina autorizada com destino descartável e evidência sem credenciais; Storage separado |
| Observabilidade/versão implantada | Código configura Vercel Analytics/Speed Insights e saúde | Confirmar projeto, habilitação e deployment vigente antes de atribuir métricas |
| Semântica da memória após mudanças | Regenerar hashes não atualiza mapas automaticamente | Revisar notas humanas, acrescentar histórico e executar generate/check |

Hipóteses a testar, sem conclusão antecipada: compatibilidade do schema remoto com contratos locais; isolamento integral de cada módulo em RLS; cobertura de teclado/leitor de tela do IFOS final; capacidade de restauração completa incluindo Storage. Ausência de evidência não significa falha confirmada nem sucesso.

[[01-Estado-atual]] · [[10-Mapas/Integracoes-e-limites]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[30-Historico/Indice]]
