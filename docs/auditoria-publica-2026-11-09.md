# Auditoria pública do SIFCAS — 09/11/2026

O link de entrada no Topbar móvel recebeu um nome acessível. Também foram corrigidos os nomes da marca lateral e do botão de entrada no computador, incluindo o texto visível e a separação entre seus rótulos. O nome do perfil passou a incluir as iniciais, o nome e o papel ou estado da conta. O auditor independente foi incorporado ao repositório em `tools/sifcas-ui-auditor`, com verificações de redirecionamentos, testes e evidências revisadas.

A coleta extensa e o Lighthouse abaixo correspondem à base `ef7a8f5`, na branch `codex/aero-asset-collection`. As correções seguintes dos nomes acessíveis foram verificadas separadamente no computador e no celular, conforme evidência complementar.

## Cobertura e resultados

A execução usou uma instância local de desenvolvimento, com banco PGlite sintético, sem sessão e sem serviços institucionais de produção. Nenhum formulário foi enviado. As seis páginas verificadas foram `/noticias`, `/editais`, `/agenda-institucional`, `/campus`, `/transparencia` e `/verificar-documento`.

| Medição | Coleta anterior, revisada | Nova coleta |
| --- | --- | --- |
| Páginas públicas válidas | 6 | 6, todas HTTP 200 |
| Combinações de página e viewport válidas | 48 das 64 registradas | 48 de 48 |
| Ocorrências confirmadas de `link-name` | 7, do mesmo componente; uma em página 404 | 0 |
| Violações confirmadas pelo axe-core 4.10.3 | 7 | 0 |
| Grupos de regra/rota para revisão manual | 10 | 8 |
| Overflow horizontal observado | 0 | 0 |

As capturas e a geometria cobrem oito tamanhos de tela, de 320×640 a 2560×1440. O axe-core foi executado uma vez por página, em 375×812; não são 48 execuções de acessibilidade. Os oito grupos pendentes representam contraste nas seis páginas e distinção de links em duas páginas, com múltiplos elementos envolvidos. São resultados incompletos da ferramenta, que exigem inspeção manual.

As 64 combinações antigas incluíam oito capturas da tela de login após redirecionamento de `/` e oito capturas do 404 de `/publicacoes/`. O primeiro destino estava fora da política de coleta; o segundo era uma semente incorreta do próprio auditor. Isso não demonstra um link quebrado publicado pelo aplicativo. A [interpretação da evidência original](../tools/sifcas-ui-auditor/evidence/2026-11-06/INTERPRETATION.md) preserva essa distinção.

## Lighthouse local

A medição final de `/noticias` terminou sem erro de execução e sem avisos:

| Categoria | Pontuação |
| --- | --- |
| Performance | 72 |
| Acessibilidade | 100 |
| Boas práticas | 100 |
| SEO | 100 |

Esses números são diagnósticos do servidor de desenvolvimento, com recursos externos conhecidos bloqueados. Não são resultados de produção, métricas de campo ou validação completa de acessibilidade. INP permanece N/D. A etapa Lighthouse passou a registrar erros por métrica, URL final e detalhes dos achados. Um recurso local bloqueado por método HTTP não é mais interpretado como motivo para bloquear toda a origem do aplicativo; esse caso tem teste de regressão.

## Validação

- Aplicativo: `npm run check` passou, incluindo ESLint, TypeScript, 163 testes e as três auditorias internas.
- Build Next.js concluiu e gerou 106 páginas estáticas.
- Auditor independente: TypeScript e 15 testes passaram.
- Verificação focada no navegador: nenhuma ocorrência de `link-name` nas sete rotas antes afetadas, incluindo a página 404; esta não entra na cobertura pública válida.
- Verificação complementar com axe-core 4.14.0: 12 combinações das seis páginas públicas em 375 e 1440 px, sem violações de `link-name`, `label-content-name-mismatch` e `target-size`. Esta checagem de três regras não substitui a revisão manual dos oito grupos restantes. O [JSON complementar](../tools/sifcas-ui-auditor/evidence/2026-11-09/desktop-mobile-name-check.json) registra o escopo e os resultados.
- O link de perfil também passou em quatro verificações focadas: duas contas sintéticas, estudante ativo e conta suspensa, em 375 e 1440 px. Isso verifica os rótulos locais, sem representar auditoria dos fluxos autenticados de produção.

Os [resultados executivos](../tools/sifcas-ui-auditor/evidence/2026-11-09/executive-summary.md), o [relatório completo](../tools/sifcas-ui-auditor/evidence/2026-11-09/full-audit.md) e o [Lighthouse em JSON](../tools/sifcas-ui-auditor/evidence/2026-11-09/lighthouse.json) estão versionados. Arquivos extensos regeneráveis e capturas continuam nas saídas locais ignoradas pelo Git. A pasta externa original do auditor foi preservada.

## Deploy verificado

Consulta inicial somente de leitura em 09/11/2026, antes do envio dos commits finais deste relatório, aos registros de deployments e statuses do GitHub:

| Registro | Commit / branch | Estado | Horário de Cuiabá |
| --- | --- | --- | --- |
| Último deploy registrado | `eb5a77a` / `feat/sifcas-mail-gmail-oauth` | Preview, success | 09/11/2026, 10:42:06 |
| Preview das correções desta auditoria | `ef7a8f5` / `codex/aero-asset-collection` | Preview, success | 09/11/2026, 07:12:00 |
| Último deploy registrado como Production | `43cad21` | success | 06/11/2026, 10:50:42 |

A [última Preview](https://sifcas-c3t823004-gabriel31249090s-projects.vercel.app) redirecionou para autenticação da Vercel; seu aplicativo privado não foi auditado. O [registro no painel da Vercel](https://vercel.com/gabriel31249090s-projects/sifcas/3vJ4wngbwdgkw4Q9ozXijgmUf8i5) corresponde à branch de e-mail, cujo PR #2 estava aberto. A [Preview das correções](https://sifcas-97fwqzcev-gabriel31249090s-projects.vercel.app) corresponde ao deployment GitHub `7653158688`, status `21758343127`. O [Production registrado](https://vercel.com/gabriel31249090s-projects/sifcas/2nyuSQvySHAqXmjSciMKyHh1yuYR) corresponde ao deployment `7602979455`, status `21587414368`. As mudanças desta auditoria não foram confundidas com a branch de e-mail nem enviadas à `main`.

O domínio público respondeu HTTP 200 em `/login` e `/api/health`, com saúde do banco reportada como `ok`. Esses endpoints não identificam o commit servido. A conexão Vercel disponível não tem acesso ao projeto; por isso, não foi possível confirmar diretamente o alias de produção, a configuração da branch ou os logs internos. O último registro Production no GitHub não prova sozinho qual commit o domínio serve após eventuais promoções manuais.

## Pendências

Continuam pendentes a revisão manual dos oito grupos de acessibilidade, a medição de performance em build de produção e os fluxos autenticados. A publicação das correções em produção requer acesso à equipe Vercel correta ou confirmação de sua configuração de implantação. A integração institucional com SUAP/AVA depende do acesso solicitado à TI; dados sintéticos não substituem essa integração.
