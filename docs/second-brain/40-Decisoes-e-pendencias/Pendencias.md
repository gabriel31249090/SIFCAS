---
tipo: pendencias
verificado_em: 2026-11-12
---

# Pendências e perguntas abertas

| Item | Evidência/limite atual | Próxima ação necessária |
| --- | --- | --- |
| Publicação das melhorias posteriores ao IFOS | Consulta GitHub de 13/11: f341b35 registrado Production/success; imagens e memória 02d4183 em Preview/success | Conferir/promover o commit final na própria conta e validar o domínio e papéis; os registros não comprovam o alias atual sozinhos |
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
