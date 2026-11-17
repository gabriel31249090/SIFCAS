# Formato SIFCAS e demonstração docente

O [modelo sintético](../public/modelo-importacao-academica.csv) descreve `sifcas-academic-v1`. **Não é uma exportação nativa do SUAP nem uma sincronização contínua.** Todos os IDs, turma, datas e registros da amostra são sintéticos.

CSV em UTF-8, com ou sem BOM; `;` ou `,`; CRLF/LF; aspas escapadas com `""`; campos multilinha entre aspas. Limite 750 KB e 10.000 registros. IDs permanecem texto, inclusive zeros iniciais. Datas `AAAA-MM-DD` ou `DD/MM/AAAA`, horários `HH:MM`, decimais com ponto ou vírgula e sem separador de milhares. Nenhuma associação por nome/e-mail.

| Coluna | Uso |
| --- | --- |
| `kind` | `diary`, `enrollment`, `session`, `attendance`, `assessment`, `grade`, `schedule`, `event` |
| `external_id` | ID estável do registro no tipo; não inventar novo ID em reimportação |
| `diary_id`, `period` | Mesmo diário e período em todas as linhas; precisam coincidir com mapa verificado |
| `student_id` | Matrícula externa já ligada a enrollment da turma; obrigatório em enrollment/attendance/grade |
| `title`, `content` | Título de diário/avaliação/evento; conteúdo de aula/evento |
| `date`, `starts_at`, `ends_at` | Data e horários de aula/evento/avaliação conforme tipo |
| `session_id`, `assessment_id` | Referência a aula/avaliação presente no mesmo lote |
| `status` | Matrícula: active/inactive. Frequência: present/absent/late/justified. Nota: graded/missing/exempt/unreported |
| `score`, `max_score`, `weight` | Nota só para graded; escala positiva até 1000; peso positivo explícito ou 1. Nota zero difere de vazio |
| `weekday`, `room` | Horário semanal; 0=domingo, 1=segunda, … 6=sábado no arquivo SIFCAS; não confundir com a codificação 1–7 do módulo local |
| `url` | Referência opcional de evento HTTPS em online/suap.ifmt.edu.br, sem parâmetros/tokens; não há fetch automático |

Exatamente um `diary` e um período por arquivo. Todas as referências precisam existir no lote, e estudantes precisam ter vínculo previamente verificado. Um mesmo estudante não pode ter duas matrículas, notas para a mesma avaliação ou chamadas da mesma aula sob IDs alternativos. O arquivo não altera papéis, identidades, turmas nem matrícula oficial.

O formulário aceita mapeamento de **cabeçalhos**, por exemplo `{"external_id":"registro","diary_id":"diario","student_id":"matricula"}`. Uma coluna não pode mapear dois campos. Valores precisam ser convertidos e revisados de acordo com este contrato; mapeamento de cabeçalho não valida uma exportação oficial desconhecida. Separe diários/períodos em arquivos próprios sem digitar registros individualmente.

## Demonstração em homologação

O diário local do SIFCAS não é uma janela do SUAP e não recebe conteúdo institucional automaticamente. A lista de aulas locais pode estar vazia mesmo que existam registros oficiais. Cópias importadas autorizadas aparecem separadamente, identificadas como somente leitura; a ausência de cópia não significa ausência de conteúdo na origem. Não importar PDFs de boletim ou avaliações de estudante como substituto de um diário docente ou como sincronização oficial.

1. Usar banco descartável, instalar o contrato conforme [integrações](integracoes-ifmt.md), configurar um usuário docente autenticável no Supabase de teste e ligar `teaching_assignments` à turma existente.
2. Operador verifica e cadastra o mapa de diário externo → `class_subject_id` e cada matrícula externa → enrollment existente. O seed versionado serve apenas para testes SQL; ele não cria contas no Supabase Auth para login por navegador.
3. Habilitar a flag, entrar como docente e abrir `/importar-dados-academicos`. Selecionar diário/período existente, CSV e eventual mapeamento.
4. A prévia informa contagens, IDs, dados normalizados e conflitos. Conferir um registro de nota zero, ausente, dispensado e não informado. Confirmar uma vez.
5. Abrir recibo e turma. As seções “Dados importados · somente leitura” mostram origem, horário de coleta e contagens; planejamento local continua separado.
6. Reenviar o mesmo arquivo e confirmar novamente: retorna o mesmo lote/recibo sem duplicar. Alterar um valor existente: conflito bloqueia todo o lote e preserva o anterior.
7. Cancelar outra prévia ou expirá-la; confirmação deve ser recusada. Retomar uma prévia válida pelo histórico.
8. Trocar para docente de outra turma: selecionar/chamar diretamente RPC com o ID anterior deve ser negado. Estudante lê somente seus próprios registros e os eventos compartilhados autorizados. Gestor sem escopo específico não importa.

`npm test` executa esse contrato com fixture SQL. O roteiro de navegador autenticado exige homologação real e contas fornecidas pela TI; não foi apresentado como sincronização institucional realizada.

## Calendário pessoal AVA

`/importar-calendario`: o usuário exporta seu `.ics` na origem, seleciona o arquivo, revisa localmente e confirma. O servidor reinterpreta e valida o arquivo antes de gravar a cópia privada. Até 500 eventos/750 KB; arquivos temporários ficam somente na memória. O banco deriva o dono de `auth.uid()`, nunca do formulário.

Subconjunto aceito: VEVENT individual com UID estável, SUMMARY e DTSTART; `VALUE=DATE` sem hora, horário UTC com `Z`, ou `TZID=America/Cuiaba`. Horários flutuantes, outros fusos, recorrências, alarmes embutidos e durações são recusados integralmente para revisão. Campos DESCRIPTION/URL/ATTACH/ORGANIZER/ATTENDEE são descartados; URLs de assinatura/token nunca são solicitadas. Um cancelamento explícito fica marcado como cancelado. UID repetido no arquivo é erro; reimportar o UID em outro arquivo atualiza apenas a cópia pessoal. Ausência em arquivo não exclui eventos.

A agenda mostra data/hora **na origem e com seu fuso**, sem atribuir hora a dia inteiro. Os eventos não afetam avaliações, notas ou frequência oficiais. “Descartar cópia privada” remove somente eventos do usuário atual. A política institucional de retenção deve ser definida antes de usar exportações reais.

Medir no piloto: tempo entre seleção do diário e abertura da turma, campos redigitados (meta zero quando presentes na exportação validada) e número de divergências após atualização. Não há medições de usuários reais nesta execução.
