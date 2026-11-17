# Manutenção SIFCAS em Node.js

Implementação executável inspirada em `ManutencaoSistemaV6_Completo`, fornecido pelo usuário. Usa Node 24 e as ferramentas já instaladas no projeto. Os números fixos e o `shell()` simulado do Portugol foram substituídos por execução e estados observáveis. Não há contagem inventada de bugs, testes ou métricas Lighthouse.

Execute na raiz do repositório:

```powershell
# Planejar todos os adapters sem executar comandos
npm run maintain -- --mode dry_run --profile complete

# Auditoria local padrão (quick)
npm run maintain

# Apenas as regras estáticas de segurança e o catálogo
npm run maintain -- --only security,memory

# Suíte completa; browser inicia sua própria fixture sintética
npm run maintain -- --mode full

# Acrescentar a consulta npm audit das dependências de execução
npm run maintain -- --mode full --network

# Regenerar um catálogo desatualizado com checkpoint e validação
npm run maintain -- --mode safe --only memory,unit --fix memory-catalog
```

Feche as fixtures locais existentes antes do adapter `browser`: ele usa as portas 3100 e 54331. Requer Chromium instalado para o Playwright. O limite por comando é de três minutos no perfil quick e quinze no complete; `--timeout-ms` substitui esse limite. Timeouts e interrupções encerram a árvore de processos iniciada e são falhas. A verificação do navegador restaura os imports gerados de `next-env.d.ts`; diferenças adicionais são preservadas e sinalizadas para revisão. Uma atualização de `AGENTS.md` pelo Next é preservada e reportada como aviso, exigindo revisão das instruções e nova catalogação. Encerramento forçado do próprio processo pode impedir a restauração; nesse caso, confira o diff antes de continuar.

`reports/maintenance/<execução>/report.json` contém plano, stack observada, comandos/resultados, duração, tentativas, ciclos, validação e correções. `report.md` resume a execução. Essa pasta fica fora de `test-results`, que o Playwright limpa ao iniciar. Logs têm captura limitada e redação de credenciais comuns; variáveis de ambiente não são gravadas. Relatórios e checkpoints são locais, ignorados pelo Git. Não os use para guardar segredos.

| Estado/código | Significado |
| --- | --- |
| `passed` / 0 | Checagens selecionadas aprovadas; em `dry_run`, plano criado sem comprovação de comportamento |
| `warning` ou `unavailable` / 1 | Há mudanças locais para revisão ou verificações não executadas |
| `failed` / 2 | Comando/teste falhou, ocorreu timeout, interrupção ou falha de correção/rollback |
| Configuração / 3 | Opção inválida ou política de ambiente impediu iniciar |

O quick inclui `remote-db`, portanto a falta de acesso homologado produz código **1**, mesmo com os checks locais aprovados. Não remova essa ressalva para apresentar a execução como produção validada. O perfil complete inclui também `manual-review` e consulta de dependências, que fica indisponível sem `--network`.

## Modos e extensão

`dry_run` cria apenas o plano e relatórios. `audit_only` executa verificações e gera seus artefatos locais, sem aplicar correções. `safe` permite a correção explicitamente selecionada. `full` seleciona mais verificações por padrão e mantém a mesma lista de correções permitidas. Nenhum modo executa comandos do anexo como texto de shell.

`adapters.mjs` é o registro de estratégias; cada adapter declara ID, categoria, descrição e uma função que devolve estado e evidência. `engine.mjs` executa o pipeline e pode ser importado para registrar novos adapters em código revisado. `config.json` contém dados, não comandos arbitrários. A stack é lida de arquivos reais; não se presume Jest, Prisma ou um banco conectado. Retries são limitados e só se aplicam a adapters explicitamente marcados `retryable`; os adapters atuais não repetem falhas determinísticas.

A única correção registrada é `memory-catalog`. Exige branch de trabalho, catálogo sem alterações locais e baseline de testes aprovada. Faz checkpoint apenas de `docs/second-brain/20-Catalogo`, regenera e reexecuta memória/testes. Se a geração ou validação falhar, restaura o catálogo. A validação que falhou permanece no relatório, identificada como anterior ao rollback. Alterações humanas nas outras pastas e o gráfico do Obsidian não entram no checkpoint. Não cria branch, commit ou push automaticamente.

Há no máximo três ciclos configuráveis; um segundo ciclo só ocorre após correção real, para validar seu resultado. Não repete auditorias inalteradas até declarar uma convergência artificial. Convergência significa que **todas as checagens selecionadas** passaram, sem aviso/indisponibilidade. Contadores são de checks e ações, não um suposto total de defeitos.

## Correspondência com o algoritmo

| Área do Portugol | Implementação/evidência |
| --- | --- |
| Configuração, log, detecção, Adapter/Registry/Strategy/Pipeline | CLI, JSON de configuração, registro de adapters, saídas por etapa e relatórios |
| Shell, retries, parada e ambiente | `spawn` com argumentos e sem shell, timeout/abort, tentativas limitadas, trava fora de produção |
| Preparação, baseline, backup, validação e ciclos | Git somente leitura, testes reais, checkpoint/rollback limitado ao catálogo, nova validação após correção |
| Código, rotas, interações e segredos | ESLint, TypeScript e três auditorias existentes; são regras delimitadas, não certificação SAST completa |
| Dependências | `npm audit --omit=dev --json` opcional, com os avisos e URLs fornecidos pelo registro |
| Banco | Testes SQL/RLS em PGlite; `remote-db` explicitamente indisponível |
| Visual, responsividade, temas e interação | Suíte Playwright real na fixture; inclui geometria/contraste do perfil e regressões de IFOS/assets/importação |
| Revisão visual/performance global | Leitor de tela real, baseline visual aprovado e métricas de campo permanecem revisão específica; nenhum score é inferido de relatórios antigos |
| Correções genéricas, migrations, backup remoto, commit/push/deploy | Não registrados como ações automáticas. Exigem implementação e revisão concretas, além de acesso homologado no caso remoto |

Não instala ferramentas, aplica SQL, suspende usuários, redefine senhas, atualiza dependências, conta CVEs inexistentes nem afirma que um commit por si só corrige código. Essas ações simuladas do anexo não foram transformadas em operações cegas.

Testes da ferramenta: `node --test tests/maintenance.test.mjs`. Eles também entram em `npm test`.
