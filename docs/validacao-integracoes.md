# Validação efetiva da entrega

Execução em **03/11/2026**, Windows/PowerShell, Node **24.22.2**, npm **11.19.1**, Next.js **16.3.4**, PGlite **0.5.15**, Playwright **1.63.0**. Sem arquivo de credenciais Supabase local, sem acesso PostgreSQL remoto, sem Docker e sem credenciais institucionais.

| Verificação | Resultado efetivo |
| --- | --- |
| `npm.cmd ci` | Concluído: 369 pacotes. A primeira tentativa falhou por ENOSPC; após liberar caches de dependências o comando terminou com sucesso. PGlite foi adicionado depois como dependência de desenvolvimento, com versão e lockfile fixados |
| `npm.cmd run check` | Aprovado: lint, tipos, **125 testes** e três auditorias internas, zero falhas |
| `npm.cmd run build` final | Aprovado: **125 testes**, zero falhas, compilação otimizada, verificação TypeScript e geração de rotas concluídas |
| `npm.cmd run test:e2e -- --workers=1` | **15 aprovados**, zero falhas, em servidor local da versão compilada |
| `git diff --check` / revisão do index | Sem erros de whitespace; alterações locais anteriores separadas do commit |
| Saúde produção, consulta somente leitura | HTTP **200**, `database.status=ok`, motor local da MAISA/LUMA |
| Saúde localhost sem banco configurado | HTTP **503**, estado explícito de dependência indisponível, sem fallback para produção |
| Inventário Supabase remoto | **Não realizado**: ambas as conexões disponíveis negaram acesso a `xqhilujzacwebeexljaf` |
| Migrations / deploy de produção / promoção ADM | **Não executados** |

O navegador já instalado era Chromium headless **1248**, reutilizado para evitar outro download no disco com pouco espaço. Foi selecionado por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; a versão de Chromium padrão solicitada pelo Playwright instalado era 1243. A suíte passou no navegador efetivamente usado. Não se declara execução em Firefox, WebKit ou aparelhos físicos.

As primeiras execuções encontraram e corrigiram: impureza de `Date.now` nas páginas de prévia (substituída pelo timestamp de requisição existente), tipagem antiga do histórico MAISA, reconhecimento de arquivo público pelo auditor de rotas e seletores E2E ambíguos/redirect relativo. Os resultados acima correspondem às execuções bem-sucedidas posteriores.

## O que os testes realmente provam

- CSV: BOM, UTF-8 estrito, CRLF, multilinha, escape de aspas, separador, colunas/aliases ambíguos, limites, zeros iniciais, decimais brasileiros, fórmulas, datas inválidas e negação de importação de administrador.
- Domínio acadêmico: lote coerente de um diário, matrículas e referências, horários, frequência separada de notas, escala e distinção entre zero, ausente, dispensado e não informado.
- PostgreSQL real em memória: funções SQL e RLS da **extensão isolada** executadas com papéis e sujeitos sintéticos. Docente de outra turma, aluno, gestor/ADM sem escopo, conta suspensa, ID de diário/matrícula adulterado, campos sensíveis extras e notas fora da escala são negados. Gestor/ADM com escopo explícito funciona; revogação bloqueia acesso posterior.
- Confirmação repetida/idempotência, conflitos sem sobrescrita, rollback integral de lote inválido, cancelamento, expiração, expurgo do payload e reversão do contrato preservando tabelas acadêmicas preexistentes.
- Calendário privado: outro usuário não lê nem altera eventos, dono é derivado da sessão, lote inválido não grava parcialmente, reimportação por UID não duplica e descarte de uma conta preserva as outras. Arquivo não altera notas/frequência.
- Diário local: autorização por vínculo e estudante, seleção de registro antigo fora da página, paginação acima de 24 itens, resposta do servidor menor que o range e limite de nota obtido da avaliação persistida, não do formulário. Ações Next usam esses validadores; os testes de helpers usam mocks explícitos.
- Editais: validade dinâmica, revisão vencida, divergências de horário, fuso confirmado, precisão de data, alarme ICS, idempotência e versões, retenção do catálogo em falha/layout quebrado e allowlist de URLs. O adaptador de coleta é somente um núcleo de domínio testado; não há coletor remoto ativo.
- Navegador: visitante consulta filtros/retificação/documento oficial, favoritos e aviso de versão, busca e guias, tela estreita, links de contato, descoberta pública, política de senha e negação anônima das rotas privadas. O catálogo permaneceu acessível sem banco configurado.

## O que continua pendente

Não houve importação de exportação oficial SUAP, sincronização autenticada, login institucional, RLS/grants do banco remoto, teste E2E autenticado com conta Supabase real nem piloto com pessoas/dados reais. O SQL versionado é contrato de homologação e o schema mínimo é sintético, não uma baseline inferida de produção.

PGlite processa consultas de uma instância em uma fila; `Promise.all` cobre confirmações repetidas, **não prova concorrência entre múltiplas conexões PostgreSQL**. Locks e ordem de bloqueio estão implementados, mas corrida real, mudanças concorrentes de matrícula/escopo e limites da hospedagem precisam de homologação. Não há retomada por cursor de arquivo grande: a unidade transacional é um diário limitado; prévias válidas são retomadas pelo histórico.

`npm ci` também informou **20 avisos de vulnerabilidade** nas dependências existentes (16 moderados, 3 altos e 1 crítico), antes da inclusão de PGlite. A consulta extra `npm audit --json` não concluiu no ambiente e foi interrompida; não foram aplicadas atualizações automáticas ou breaking changes. As auditorias internas aprovadas não substituem essa análise de dependências. Reavaliar os advisories com o registry acessível antes de um piloto de produção.

O runtime Node foi instalado em pasta de ferramentas do usuário com checksum SHA-256 do distribuidor; não houve mudança permanente de PATH. Para repetir comandos em outra sessão, disponibilizar Node 24 no PATH. Não foram apagados documentos do usuário; a recuperação de espaço usou caches npm/npx inativos e o arquivo de download criado nesta tarefa.

Consulte [liberações e configuração](integracoes-ifmt.md), [roteiro docente/formato](importacao-academica.md) e [fontes/editoria de editais](central-editais.md). Todas as restrições acima são limites efetivos da execução, não integrações simuladas como sucesso.
