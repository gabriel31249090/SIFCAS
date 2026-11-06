# SIFCAS, SUAP, AVA e portais públicos

Branch de trabalho: `codex/importacao-academica-editais`. Data da inspeção: **03/11/2026**, referência do usuário America/Cuiaba. Nenhuma migration, promoção de usuário, mensagem à TI ou publicação foi executada em produção. SIFCAS é um projeto independente, sem autorização demonstrada para se apresentar como portal oficial do IFMT.

## Evidência e limites

- `https://sifcas.vercel.app/api/health` retornou **HTTP 200**, `database.status=ok` e motor local da MAISA/LUMA durante esta execução. Isso confirma a RPC de saúde naquele instante; não verifica schema, grants, RLS ou disponibilidade dos módulos privados.
- As duas conexões Supabase disponíveis negaram `get_project` para **xqhilujzacwebeexljaf**. Nenhum outro projeto foi consultado como substituto. Não há senha PostgreSQL, DB URL, token de gestão autorizado nem credenciais de SUAP/Moodle. A configuração publicável não concede acesso administrativo.
- Não existe baseline remota verificada. `supabase/isolated` contém **contratos e schema mínimo sintético de teste**, não uma reconstrução do banco oficial. Compatibilidade remota permanece **pendente**.
- Os 40 guias públicos foram reaproveitados de `origin/codex/ifmt-campus-guides`, comparada com a base atual. Conservam a data editorial anterior de 16/10/2026; não representam uma nova verificação de todos os contatos e cursos.
- Em 06/11/2026, a especificação pública `https://suap.ifmt.edu.br/api/openapi.json` respondeu com OpenAPI 3.1.0, identificando o serviço como **SUAP API 1.0.0**. Ela documenta endpoints autenticados de ensino; isso não comprova liberação de cliente, escopo, consentimento, uso em produção ou permissões para esta aplicação.
- Em 06/11/2026, `https://cas.ifmt.edu.br/wp-json/` identificou o site como **IFMT Campus Cáceres** e anunciou a API REST WordPress. O feed de posts publicado é público; não é um sistema de reclamações nem uma fonte de diário acadêmico.

## Contratos das fontes

| Fonte / instância | Método e campos permitidos nesta entrega | Escopos / papéis | Estado / responsável a confirmar |
| --- | --- | --- | --- |
| SUAP `https://suap.ifmt.edu.br` | OpenAPI público; leitura documentada de diários, aulas, materiais, trabalhos, períodos e próximas avaliações. A autenticação/escopos precisam ser aprovados | OpenAPI lista JWT bearer, `OAuth2TokenAuth` bearer e sessão. A rota pública `/api/token/pair` requer usuário e senha | Explorar OAuth cliente/consentimento com TI. SIFCAS não deve coletar ou armazenar senha SUAP, nem testar tokens de usuários |
| AVA Moodle `https://online.ifmt.edu.br` | Moodle fornece External Services, mas cada serviço/função tem que ser habilitado pelo administrador. O feed/API autenticado do AVA ainda não foi homologado | Token individual restrito às funções e cursos autorizados, somente após configuração do administrador; não pedir senha do Moodle | Confirmar com administrador Moodle versão, token/service, funções de leitura, escopos e limites |
| Moodle `ava.ifmt.edu.br` | Referência histórica nos guias; não equiparada à instância integrada | Nenhuma credencial ou conexão | Link oficial; confirmar instância por turma |
| Portal CAS `https://cas.ifmt.edu.br` (Campus Cáceres) | Notícias públicas pelo WordPress REST API. O SIFCAS exibe links para as publicações, sem copiar matérias ou exigir login | Visitante; apenas metadados já publicados | Feed público conectado na rota `/noticias`; eventos e avisos acadêmicos não são extraídos do corpo das notícias |
| Arquivos `sifcas-academic-v1` | Diário, matrículas verificadas, aulas, frequência, avaliações, notas, horários e eventos; IDs externos textuais | Professor vinculado; gestor/admin somente com escopo explícito por turma. Aluno lê somente seus dados | Importação validada em PostgreSQL isolado. **Não é formato nativo SUAP** |
| Painel `https://ifmt.edu.br/painel-de-editais/` | Metadados públicos revisados, número/ano, campus, público, datas, documentos por link e versões | Visitante, independente da integração privada | Catálogo editorial verificado em 03/11/2026; coleta automática desabilitada |
| Campus Cáceres `https://cas.ifmt.edu.br` | Guias/contatos públicos e feed WordPress de notícias; publicações editoriais locais continuam no módulo SIFCAS | Visitante; editor autorizado apenas no painel SIFCAS | Feed público conectado a `/noticias`; não publica, altera nem encaminha dados ao portal |
| Ingresso `https://seletivo.ifmt.edu.br` | Link oficial, sem supor formato/API | Visitante | Disponibilidade e coleta pendentes |
| SIGE / Gnuteca | `https://eventos.ifmt.edu.br` / `https://biblioteca.ifmt.edu.br` | Visitante segue à origem | Links oficiais; sem integração de conta |

Cada novo contrato deve registrar: responsável institucional e técnico, campus, instância, versão do serviço, autorização, finalidade, campos mínimos, papéis, escopos, amostra sintética, IDs/chaves de unicidade, paginação, limites, timeouts, política de atualização/revogação e data de homologação. Não há conector privado ativo a completar com endpoints presumidos.

## Evidência e plano de sincronização SUAP/AVA

A especificação OpenAPI pública do SUAP declara, entre outras, estas rotas de leitura autenticada:

| Dado | Rota publicada no OpenAPI do SUAP | Uso SIFCAS candidato |
| --- | --- | --- |
| Diários do docente | `GET /api/ensino/meus-diarios/` e `GET /api/ensino/meus-diarios/{ano_letivo}/{periodo_letivo}/` | Descobrir diários do sujeito autenticado |
| Aulas e conteúdo | `GET /api/ensino/diarios/{id_diario}/aulas/` | Ler conteúdos e datas do diário |
| Materiais e trabalhos | `GET /api/ensino/diarios/{id_diario}/materiais/` e `GET /api/ensino/diarios/{id_diario}/trabalhos/` | Exibir links e prazos autorizados |
| Etapas e próximas avaliações | `GET /api/ensino/disciplinas/{disciplina}/etapas/` e `GET /api/ensino/minhas-proximas-avaliacoes/` | Alimentar agenda sem inventar calendário |
| Períodos letivos | `GET /api/ensino/meus-periodos-letivos/` | Filtrar agenda pelo ano/etapa atual |
| Dados pessoais de estudante | `/api/ensino/meu-boletim/...`, `/api/ensino/frequencia-periodo-letivo/...` | Adiar até aprovação de campos, finalidade e acesso individual |

O documento também publica `/api/token/pair`, que recebe `username` e `password` e devolve tokens. Não é aceitável pedir a senha institucional no SIFCAS, persistir refresh tokens fora de um cofre aprovado ou usar token de um professor para buscar dados de outra pessoa. Embora o OpenAPI liste `OAuth2TokenAuth` como bearer, ele não descreve no documento público o fluxo de autorização, registro de cliente, scopes ou consentimento. A TI do IFMT precisa fornecer esses detalhes e aprovar um cliente. Sem OAuth delegado, a alternativa é um serviço backend de leitura com conta de integração institucional formalmente aprovada, campos mínimos, RLS/mapeamento por vínculo, rotação de segredo e auditoria. Esse serviço ainda não foi autorizado/configurado.

Depois da autorização, a primeira sincronização privada deve ser somente leitura e manual, pelo usuário docente autenticado, para um diário explicitamente vinculado. Gravar como cópia de origem com timestamp, identificador do diário/período, cursor/paginação e log sem payload sensível; rejeitar mudança de vínculo, repetição e conflitos sem apagar dados existentes. Agendamento automático só depois de validar limites, revogação, retenção e sincronização incremental em homologação. Nenhum dado acadêmico é escrito de volta ao SUAP.

O portal `online.ifmt.edu.br` usa Moodle. A API External Services do Moodle existe, mas seu administrador precisa criar/habilitar o serviço externo, atribuir funções específicas a um token e restringi-lo a permissões/cursos necessários. Não há evidência pública de que a instância IFMT tenha esse serviço habilitado para o SIFCAS. Solicitar à TI Moodle lista/versionamento de funções de leitura para cursos, conteúdos, tarefas e calendário; não usar APIs internas de sessão do navegador ou tokens copiados.

Neste levantamento, `cas.ifmt.edu.br` identifica o portal público do **Campus Cáceres** em WordPress, não um servidor central CAS/SSO. O nome DNS, isoladamente, não prova que o IFMT oferece Central Authentication Service nem fornece um protocolo de login federado. Para autenticação única, pedir à TI a URL real do provedor de identidade, protocolo (OIDC/SAML), metadados, registro de cliente, escopos/claims, logout e política de identidade; não apontar o login do SIFCAS para o site do campus.

### Perguntas para homologação institucional

1. A TI pode registrar um OAuth client SUAP para esta aplicação? Qual authorization/token URL, scopes, redirect URI, consentimento, TTL, revogação e política de dados?
2. Qual unidade/campus, identidade estável e vínculos podem ser expostos? O que professores e estudantes podem consultar por conta própria?
3. Qual é a versão e URL do Moodle institucional vigente? Quais funções External Services, cursos e dados podem ser lidos? Existe token delegado e ambiente de teste?
4. Os payloads e paginação foram validados com fixtures anonimizadas? Qual intervalo, limite de requisição, disponibilidade e contato de suporte?
5. Qual é a base legal/finalidade, retenção, eliminação, trilha de acesso, resposta a incidente e processo de revogação?
6. Para solicitações de manutenção/infraestrutura, qual setor recebe chamados por campus, qual protocolo, notificação, SLA, escalonamento e política de anexos?

### Portal do Campus Cáceres

O endpoint público `https://cas.ifmt.edu.br/wp-json/wp/v2/posts` foi consultado sem autenticação e retornou publicações, títulos, datas e links para artigos do próprio `cas.ifmt.edu.br`. A rota `/noticias` agora consome esse feed somente de leitura, valida que os links ficam no mesmo host, mostra o estado de indisponibilidade e direciona o leitor à publicação original. Isso é integração de conteúdo público do **Campus Cáceres**, não autenticação CAS/SSO, sistema de chamados nem sincronização acadêmica privada.

A página pública `https://cas.ifmt.edu.br/o-campus/` lista contatos organizacionais, inclusive a Coordenação de Serviços Auxiliares; `https://ifmt.edu.br/participacao-social/ouvidoria/` documenta canais formais de manifestação. `/solicitacoes` agora referencia essas fontes, mas não envia a solicitação para elas. Confirmar o destino de chamados de infraestrutura e integração com qualquer protocolo antes de implementar roteamento ou afirmar recebimento.

## Solicitações e reclamações

O formulário `/solicitacoes` grava pedidos no SIFCAS por categoria, prioridade, título e descrição e exibe uma referência curta baseada no UUID interno. Para infraestrutura, exige campus/local e armazena essa localização junto à descrição existente. Essa referência não é um protocolo institucional. O código disponível não associa categorias a setores de campus, não define destinatário institucional, não comprova envio de e-mail/notificação e não oferece anexos, SLA ou histórico de encaminhamento a outro sistema. A atribuição a uma pessoa na fila do SIFCAS não equivale a encaminhar à manutenção ou à administração do campus.

Até a administração confirmar, por campus, quais equipes recebem cada categoria, contatos/canais de escalonamento, prazos, permissões e política de anexos/dados, a interface identifica o canal como não homologado e instrui o usuário a contatar também a via oficial. A página pública de contatos de Cáceres lista a Coordenação de Serviços Auxiliares, mas não estabelece que os pedidos do SIFCAS são recebidos por essa equipe; a tela oferece o link para consulta, sem enviar dados pessoais por e-mail. A Ouvidoria do IFMT também publica as orientações para manifestações formais. Não usar o SIFCAS como canal de emergência. O fluxo de bebedouro ainda precisa de destinatário e protocolo confirmados pela administração do campus.

O [manual IFMT de integração SUAP–AVA](https://wiki.ifmt.edu.br/books/uso-do-ava-moodle-guia-doa-professora/page/capitulo-3-integracao-entre-suap-e-ava-moodle) confirma que criação de salas e inscrições já pertencem à integração institucional. O SIFCAS não as repete. O [IFPasse](https://cas.ifmt.edu.br/ifpasse/) menciona OAuth2/SUAP, mas não fornece autorização ou contrato de dados para este projeto. A documentação do [Moodle](https://docs.moodle.org/en/Using_web_services) exige habilitação de serviços e funções pelo administrador; isso não comprova habilitação no IFMT.

## Configuração de desenvolvimento

1. Node 24; `npm ci` (`npm.cmd` no PowerShell).
2. Copiar `.env.example` para `.env.local`. Configurar **URL e chave publicável do mesmo Supabase local/homologação**, além de `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. A chave deve vir do ambiente real; nenhum valor secreto ou fictício foi criado.
3. Sem configuração, as páginas públicas de guias/editais funcionam; autenticação/saúde do banco falham explicitamente. Desenvolvimento/testes recusam a URL do projeto de produção. Não há fallback de chave de produção no cliente nem na CSP.
4. Habilitar `SIFCAS_ACADEMIC_IMPORT_ENABLED=true` e/ou `SIFCAS_PERSONAL_CALENDAR_ENABLED=true` **somente** após instalar e homologar o respectivo contrato no ambiente isolado correto. Flags ficam no servidor.
5. `npm run dev`; abrir localhost. Os botões de importação não simulam persistência quando o armazenamento não está instalado.

## Banco isolado e reversão

`npm test` executa PostgreSQL em memória com `@electric-sql/pglite`, sem Docker, credenciais remotas ou dados pessoais. Os testes criam um banco descartável novo, carregam `academic-import.fixture.sql` → `academic-import.sql` → `academic-import.seed.sql`, assumem papéis SQL reais (`anon`, `authenticated`) e mudam somente o sujeito sintético da sessão. O calendário usa banco descartável próprio e `personal-calendar.sql`.

As tabelas `academic_import_*` guardam **cópias de leitura**, separadas de `classes`, `class_subjects`, `enrollments`, `teaching_assignments`, `class_sessions`, `academic_assessments`, `attendance_records` e `grades` existentes. Esses dados aparecem em seções identificadas no diário, gestão, boletim, horários, avaliações e agenda; não alimentam silenciosamente as médias/lançamentos locais. Nenhuma atualização volta a SUAP/AVA.

Diário externo → turma SIFCAS e matrícula externa → enrollment precisam de mapeamento previamente verificado pelo operador. A importação não cria identidade, turma institucional, matrícula oficial ou papel. Gestores precisam de `academic_import_operator_scopes` por turma; ser ADM não libera lote institucional arbitrário. Unicidade inclui instância/diário/período, com turma obtida do mapa. Não há associação por nome.

Prévia tem 30 minutos; confirmação revalida proprietário, vínculo atual, escala, estudantes e conflitos dentro da transação. Bloqueio por diário e chave única impedem duplicação. Conflitos bloqueiam o lote completo, preservando o anterior. Ausência em arquivo nunca exclui registros. Retomada é por lote durante a validade; **não há upload multipart/cursor de arquivo grande**, pois cada unidade é um diário de até 750 KB/10 mil registros.

Payload bruto não é enviado ao Storage nem guardado como arquivo. Texto normalizado de prévia fica privado, é descartado ao aplicar/cancelar e deve ser expurgado por `purge_expired_academic_imports()` em agendamento operacional **a configurar**. Antes do piloto, combinar retenção dos snapshots, trilha de auditoria, descarte e desligamento. Não ativar piloto com dados reais sem responsável e agendamento de expurgo. Sem expurgo, o acesso expira em 30 minutos, mas o operador ainda precisa descartar o payload vencido do banco.

Reversão: desabilitar flags, preservar trilha necessária segundo a política institucional, e aplicar apenas em ambiente isolado `academic-import.rollback.sql` e/ou `personal-calendar-rollback.sql`. Os testes verificam que tabelas acadêmicas preexistentes continuam presentes. Para produção, obter baseline real, comparar contratos/grants/RLS, criar migrations específicas revisadas e ensaiar restauração antes de qualquer aplicação.

## Matriz de cobertura

| Área | Classificação | Entrega / próximo requisito |
| --- | --- | --- |
| Diário, turma e matrículas | Importação validada em fixture isolada | Cópia CSV SIFCAS; reutiliza turma/vínculos existentes. Exportação oficial depende de amostra anonimizada e revisão |
| Aulas, conteúdos, frequência, avaliações, notas e escala | Importação validada em fixture isolada | Zero/ausente/dispensado/não informado distintos; conflitos preservam versão anterior |
| Horários e eventos por turma | Importação validada em fixture isolada | Seções de leitura nas telas existentes |
| Agenda pessoal AVA `.ics` | Importação validada em fixture isolada | UID/título/data/situação; UTC, America/Cuiaba ou dia inteiro; recorrência e horários flutuantes recusados |
| Agenda unificada “Hoje” | Agregação local implementada | Planejamento/avaliações/horários SIFCAS, cópias de diários, calendário privado e editais; fontes identificadas, falhas explícitas e datas Cuiabá. Ver docs/frutiger-e-homologacao-local.md |
| Progresso e fila oficial de correção | Integração aguardando autorização | Sem consulta privada aprovada; estados da cópia não comprovam entrega/correção/fechamento |
| Vínculos/períodos/matrículas SUAP próprios; boletim oficial | Integração aguardando autorização | Não deduzir papel do e-mail; identidade externa precisa de vínculo verificado |
| Salas, seções, tarefas, questionários e prazos AVA | Integração aguardando autorização | Confirmar instância, funções de leitura e capacidades por usuário; entrega/correção na origem |
| Cursos, períodos, ofertas, docentes e lotes campus | Integração aguardando autorização | Schema real, escopo de campus, revisão e contrato de lote institucional |
| Histórico, documentos, processos, chamados, central de serviços e protocolo | Link oficial | Ações privadas permanecem na origem e conforme permissão |
| Pesquisa, extensão, bolsas, estágio, jovem aprendiz, NEPP, egressos, laboratórios e convênios | Link oficial | Guias/catálogo público; projetos e submissões privadas dependem de contrato |
| TCC e defesas | Link oficial | Módulo local existente; fonte institucional não sincronizada |
| Auxílios, atendimento, orientação e inscrições | Link oficial | Somente informações públicas; comprovantes na origem |
| Renda, saúde, vacinação, prontuários e caracterização socioeconômica | Fora de escopo por sensibilidade | Não importar documentos comprobatórios |
| Mensagens privadas, sessões, dispositivos, credenciais, logs de segurança e pessoal em massa | Fora de escopo por sensibilidade | Não replicar |
| Editais/retificações/resultados | Link oficial + metadados públicos verificados | Central pública editorial; resultados só por link, sem indexação individual |
| Notícias, cursos, contatos, calendário público, biblioteca e serviços | Link oficial | 40 guias reaproveitados; coleta/feed depende de contrato |
| Eventos/certificados SIGE, Gnuteca, transparência, ouvidoria e licitações | Link oficial | Sem integração de conta |

## O que a TI precisa liberar

1. Acesso **somente leitura inicialmente** ao schema, grants, RLS, funções e versão PostgreSQL do projeto correto `xqhilujzacwebeexljaf`, com inventário sem dados pessoais. Se for usar PostgreSQL, obter a URL no botão **Connect** do projeto correto; mantê-la no servidor/gerenciador de segredos.
2. Ambiente de homologação separado e contas de teste por perfil/campus. Confirmar retenção, finalidade, responsáveis, política de menores, expurgo e desativação.
3. Layouts oficiais anonimizados de exportação de diários/matrículas/aulas/frequência/avaliações/notas e definição de escala/etapas/fechamento. Exemplos SIFCAS não certificam compatibilidade SUAP.
4. Caso oferecido, cliente OAuth institucional, documentação Authorization Code/PKCE, scopes mínimos de leitura por módulo, callbacks fixos de homologação/produção, TTLs, revogação e identificador estável verificado. Não unir contas automaticamente por e-mail. Sem contrato, o login permanece no sistema de origem.
5. Para Moodle, instância por turma, versão, funções documentadas autorizadas, limites, paginação/cursor, escopos delegados e disponibilidade de exportação `.ics`. Não usar token de administrador compartilhado para alunos.
6. Para portais públicos, feed/API ou autorização explícita de coleta, responsáveis editoriais, campos, fuso, limites e regras de retificação. Até lá, revisão editorial/link.

A promoção de `gabriel31249090@gmail.com` permanece separada e pendente de acesso administrativo verificado e revisão do esquema. Nenhum bypass por e-mail foi introduzido.

## Segurança e restrições intencionais

Cada ação usa a sessão autenticada; IDs de formulário não concedem acesso. CSV é UTF-8 estrito, BOM/CRLF/multilinha são aceitos; macros, XLSX, PDF e fórmulas não são interpretados como dados acadêmicos. Exportação CSV tem escape contra fórmulas. Não há fetch de URLs fornecidas por arquivo, cookies copiados, senha institucional, scraping autenticado, tokens privados de calendário ou credenciais em `NEXT_PUBLIC_`.

Um novo conector oficial precisará de timeout/retry com backoff, cursor, estado de sincronização e métricas sem payload pessoal. Esses requisitos não são fingidos por conectores vazios nesta entrega. Concorrência entre clientes PostgreSQL reais, RLS do projeto remoto, login real E2E e exportações oficiais continuam sujeitos à homologação; a suíte isolada não os substitui.
