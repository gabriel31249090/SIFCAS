---
tipo: decisoes
atualizado_em: 2026-11-12
---

# Decisões e razões

| Decisão | Razão e evidência | Estado |
| --- | --- | --- |
| Código e evidência datada prevalecem sobre memória | Hash informa desatualização; anotação antiga não é prova de comportamento atual | Método deste vault |
| Quatro camadas e recuperação local limitada | Reduz carregamento de contexto; funciona sem API/Obsidian aberto | Implementado nos scripts de memória |
| Plugins somente core, sem plugins comunitários | Navegação, busca, graph e backlinks bastam; reduz dependências para retomada | Configuração versionada em `.obsidian` |
| Inventário guarda metadados/relações, sem copiar fontes inteiras | Mantém ligação à fonte e evita duplicação/dados pessoais | Método deste vault |
| Supabase remoto não pode ser reconstruído por inferência | Não há baseline remota verificada; documentação exige projeto correto e staging | Restrição documentada em supabase/README |
| Importação CSV própria é cópia rastreável | Diferencia origem importada de escrita local; não pressupõe API privada SUAP | Contratos de importação e docs |
| LUMA usa motor local e confirmação de escrita | Não depende de provedor IA; ações não decorrem automaticamente de conversa | Código e docs de LUMA |
| Preferências visuais são locais | Não promovem papel, não alteram matrícula e não sincronizam por si só | Contrato StudentExperience |
| IFOS reutiliza módulos autorizados | Desktop recebe catálogo por papel; superfícies novas preservam permissão | Página servidor IFOS |

Decisões históricas do produto acima são descrições do código/documentação, não aprovação nova do agente. Ao mudar uma delas, registrar problema, alternativas concretas, escolha, consequências e teste no histórico. Hipóteses não devem entrar nesta tabela como decisões concluídas.

[[30-Historico/Indice]] · [[40-Decisoes-e-pendencias/Pendencias]] · [[02-Como-retomar]]
