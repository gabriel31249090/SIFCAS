# Central pública de editais

`/editais` funciona sem login, sem SUAP/AVA e sem banco disponível. O SIFCAS é um projeto de portal; a página informa que não é o portal oficial do IFMT. Nenhuma coleta automática ou sincronização privada é anunciada.

## O que foi conferido

Em 03/11/2026 foram consultados o [Painel de Editais do IFMT](https://ifmt.edu.br/painel-de-editais/) e os detalhes oficiais de [39/2026 Cáceres](https://ifmt.edu.br/blog/edital/edital-no-39-2026-selecao-de-bolsistas-para-projeto-de-extensao-ifmt-campus-caceres-prof-olegario-baldo/), [14/2026 Cáceres](https://ifmt.edu.br/blog/edital/edital-no-14-2026-cas-gab-cas-dg-ccac-rtr-ifmt-vagas-remanescentes-dos-cursos-tecnicos-integrados-ao-ensino-medio/) e [34/2026 Várzea Grande](https://ifmt.edu.br/blog/edital/edital-34-2026-de-selecao-de-bolsistas/).

Foram conferidos os links de documentos apresentados pelas páginas oficiais. PDFs não foram copiados nem seu conteúdo foi auditado. Links a chamadas permanecem na origem e nenhum nome, CPF ou classificação individual foi indexado. A retificação do edital 14/2026 aparece no mesmo registro que o documento original. O edital complementar não é tratado como prova de alteração do prazo: as condições devem ser consultadas no documento.

O fuso não estava explícito nos detalhes consultados. Por isso os horários são mostrados como informados, com “fuso a confirmar”. Não são convertidos para Cuiabá. A referência de calendário do usuário para comparação de **datas** é America/Cuiaba. Um prazo que passou de data deixa de aparecer como aberto; metadados de inscrição sem revisão por mais de sete dias passam a “A confirmar”. Encerramento/cancelamento confirmado prevalece. Não se atribui horário a uma data sem hora.

## Fluxo editorial disponível

Há duas entradas independentes:

1. O catálogo de revisão versionada em `lib/public-notices-data.ts`, com registro de fontes, emissor, campus, número/ano, resumo editorial, trecho original da origem, público, categoria, publicação, abertura, fechamento, status declarado, data de acesso/revisão, versão e documentos relacionados. Para atualizar: reconferir fonte e documentos, registrar divergências, conservar versões anteriores em `previousVersions`, acrescentar retificações/chamadas, atualizar `verifiedOn` e incrementar `revision`. Revisar o diff antes de publicar. Alterar o código local não publica produção.
2. O `/painel-institucional` existente, sujeito à autorização de servidor e RLS, para cadastro editorial de tipo `edital`, visibilidade `public`, referência, resumo e link oficial. Somente registros `published`, com `published_at` no passado e expiração válida entram na leitura pública. Rascunhos/publicações restritas são excluídos explicitamente até para visitantes autenticados com privilégio. Um link oficial aceito é obrigatório para aparecer na central. Metadados dessa entrada ficam “A confirmar”, porque o schema existente não registra revisão do cronograma/fuso. Um cadastro não verifica automaticamente a origem.

O segundo caminho depende do banco existente e de suas políticas reais, ainda pendentes de inventário. A falha ou ausência de configuração dele preserva o catálogo versionado e mostra um estado claro de indisponibilidade. Não se usa chave privilegiada para uma leitura pública. Nenhuma migration é necessária para o catálogo versionado.

Não registrar dados pessoais de resultados em título/resumo/conteúdo editorial. Usar somente links oficiais para resultados e documentos que possam conter esses dados. Não copiar PDFs de resultados para Storage como parte desta entrega.

## Consulta, favoritos e agenda

- Campus Cáceres é o filtro inicial, selecionável. Há busca por texto/número e filtros por campus, tema, ano e situação.
- Favoritos guardam apenas ID público e versão lida no `localStorage` deste navegador. Não há envio de notificações, conta ou assinatura remota. Ao retornar, versão diferente mostra aviso de atualização e permite marcar como lida. Não se promete alerta em segundo plano.
- Um prazo aberto e revisado oferece `.ics` com alarme um dia antes (rota também aceita 3 ou 7 dias). Sem fuso confirmado o evento é de dia inteiro e o texto explica que o fechamento deve ser conferido na origem. Fuso e hora confirmados permitem exportação de instante UTC. O usuário precisa importar o arquivo no seu calendário; não é uma assinatura que se atualiza sozinha.
- “Inscrever-se” só é possível com URL de inscrição confirmada e status aberto. Os três registros iniciais não oferecem esse botão: o 39 não apresentava link específico de inscrição validado, e os demais estão encerrados.
- `/buscar` inclui o catálogo público independentemente da busca de publicações autenticadas; `/agenda-institucional` destaca prazos abertos revisados e sinaliza falha de banco sem afirmar ausência de compromissos.

## Adaptadores e segurança

`lib/public-notices.ts` é o domínio, separado da interface e de `lib/public-notices-server.ts`. As URLs usam HTTPS e allowlist exata de hosts; não são buscadas pelo servidor. Links de documentos externos só são aceitos nos hosts e caminhos previstos. Usuários não podem disparar fetch de URL arbitrária. HTML remoto não é renderizado.

`mergePublicNoticeCatalog` oferece um núcleo para um futuro adaptador autorizado: identidade por fonte + ID (alternativa emissor/campus/número/ano), reingestão idempotente, histórico de versões e retenção do catálogo anterior quando a fonte falha, quando a validação de metadados quebra ou quando uma página vem incompleta. Esse núcleo é testado, mas não existe coletor automático ativo. Antes de habilitar coleta, a TI/responsável precisa confirmar feed/API ou permissão de leitura automatizada, contrato de campos, limites, frequência, responsável editorial, detecção do layout, fuso e regras de revisão. O Portal de Ingresso permanece um atalho oficial aguardando essa validação.

## Validação e demonstração

Testes de domínio: `node --experimental-strip-types --test tests/public-notices.test.mjs`. Cobrem datas inválidas, encerramento dinâmico, revisão vencida, divergências de horário, fuso confirmado, ICS sem hora inventada, identidade, reingestão, versões, falha de fonte/layout e URLs maliciosas. A verificação de RLS remoto continua pendente; o teste estático da consulta pública não substitui esse ensaio.

E2E: `npm run test:e2e -- tests/e2e/editais.spec.ts`. Visita sem login, filtro Cáceres/outro campus, retificação no mesmo edital, documento original, favoritos persistidos e aviso de versão, além de negação de calendário para ID desconhecido/prazo encerrado.

Roteiro: abrir `/editais`; conferir Cáceres; expandir os documentos do 14/2026 e abrir a retificação; favoritar o 39/2026; alternar para todos os campi e pesquisar 34/2026 para ver o conflito. Sem banco, observar aviso de indisponibilidade e permanência do catálogo. O 39/2026 terá “Encerrado” ou “A confirmar” conforme a data da demonstração; não alterar a data do registro para fingir inscrição aberta.

Reversão: reverter os arquivos do catálogo/UI e as integrações de busca/agenda no Git. Não há modificação do banco nem coleta agendada para desfazer.
