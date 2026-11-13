# Entrega — IFOS, Aero e memória local

Em 12/11/2026 foram implementados o layout persistente/redimensionável do IFOS, a revisão de legibilidade e a otimização das 100 artes. O catálogo do projeto foi organizado em um vault Obsidian versionado, com recuperação e detecção de desatualização por arquivos locais. Commits de implementação: `f341b35` e `02d4183`, na branch `codex/aero-asset-collection`.

## IFOS

O desktop salva ordem, posição, tamanho, minimização, maximização e estado “mostrar desktop” por conta. A restauração aceita apenas os módulos atualmente autorizados, JSON versionado com até 32 KB e no máximo 64 janelas. O layout respeita a área visível e pode ser redimensionado pela alça ou pelas setas, com Shift para passos maiores. O navegador informa se não consegue salvar. Visitas móveis preservam o layout de computador. Dados acadêmicos e cronômetros em andamento não são retomados pelo layout.

Os cinco novos testes de navegador passaram, incluindo restauração, resize/clamp, isolamento entre contas, JSON inválido/hrefs não autorizados, indisponibilidade de storage e foco sem retomada de timer. Nove regressões existentes de papéis, acesso negado, mobile, favoritos, janelas e busca também passaram.

## Imagens e legibilidade

Os recortes são gerados previamente com Sharp, sem usar o serviço de otimização de imagens da Vercel. Os originais foram preservados.

| Artefatos | Bytes |
| --- | ---: |
| Dez folhas de origem usadas no catálogo | 23.578.554 |
| 100 recortes principais WebP | 3.204.140 |
| 100 miniaturas WebP | 1.171.892 |

A soma dos recortes principais é cerca de 86,4% menor que a das folhas. Isso não significa que cada página ficou 86,4% mais rápida. Um teste de navegação pelas seis categorias e recarregamento confirmou uso dos recortes/miniaturas, persistência da escolha e ausência de requisições às folhas originais: 105 imagens únicas e 1.371.158 bytes de corpos HTTP de imagens Aero nesse percurso. O teste desconsidera respostas 304 sem corpo.

`npm run assets:optimize` regenera as imagens; `npm run assets:check` confere hashes, dimensões e transparência. O [relatório de legibilidade](legibilidade-aero-2026-11-12.md) registra a revisão de contraste, links em texto, foco e zoom real de 200%. Cinco regras axe passaram nas 14 combinações verificadas; os resultados incomplete de gradientes e os limites de temas/estados permanecem explícitos.

## Segundo cérebro

Abra `docs/second-brain` como pasta/cofre no Obsidian e comece por [00-INICIO](second-brain/00-INICIO.md). Não depende de conta, Sync pago, plugin comunitário ou Obsidian aberto. O [repositório oficial de releases](https://github.com/obsidianmd/obsidian-releases) foi clonado em `../references/obsidian-releases`, fora do app, no commit `598dc9bbbb5f82017843b0739509b85d93f019a4`; não contém o código-fonte do editor.

O vault tem estado atual, método de retomada, oito mapas de domínio, catálogo de rotas/fontes, relações de dados, decisões, pendências e histórico com evidências. `AGENTS.md` exige consultar a memória ao retomar e atualizá-la ao encerrar. A fonte de verdade continua sendo o código e a validação datada.

```sh
npm run memory:recall -- "IFOS janelas" --limit 5
npm run memory:catalog
npm run memory:check
```

A checagem detecta arquivos novos, alterados ou removidos, fichas inconsistentes e links quebrados. Textos usam hash canônico com LF; binários preservam os bytes originais. Atualizar hashes não valida automaticamente as notas humanas. Builds, dependências, `.env`, credenciais, dados reais e evidências extensas ficam fora do inventário. As verificações de memória e assets passaram a integrar `npm run check`.

## Build de produção local

`npm run preview:production:local` compilou o app e gerou 106 páginas estáticas, usando PGlite sintético. `npm run audit:production`, dentro do auditor, mediu `/noticias` em `127.0.0.1:3102`:

| Categoria | Pontuação |
| --- | ---: |
| Performance | 100 |
| Acessibilidade | 100 |
| Boas práticas | 96 |
| SEO | 100 |

FCP/LCP: cerca de 1,2 s; TBT: 90 ms; CLS: 0. A primeira tentativa falhou ao registrar o trace (`NO_NAVSTART`); a repetição concluiu sem erro de runtime ou avisos. Boas práticas registra erros dos recursos locais de observabilidade `/_vercel`, preservados no [JSON final](../tools/sifcas-ui-auditor/evidence/2026-11-12/production-performance.json). É uma execução diagnóstica local com configuração mobile padrão do Lighthouse, sem métricas de campo/INP. Não representa a velocidade ou a acessibilidade integral do domínio publicado.

Validação realizada: 170 testes do app, 15 do auditor, 15 cenários Playwright selecionados, auditorias internas, assets e geração/checagem da memória. O resultado consolidado de `npm run check` é registrado no checkpoint final após a regeneração do catálogo.

## Publicação e plano gratuito

A conexão Vercel disponível não acessa a conta do projeto SIFCAS. Isso é uma limitação de acesso observada; não é evidência de falta do plano pago. Vercel oferece Hobby gratuito e usa escopos de conta/equipe; Supabase também tem plano Free. Nenhuma assinatura foi contratada ou configuração paga ativada. [Planos Vercel](https://vercel.com/docs/plans), [planos Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase).

Com a própria conta do projeto, o responsável pode abrir SIFCAS → Deployments, selecionar o commit final da branch `codex/aero-asset-collection` e usar **Promote to Production**. Esse caminho reconstrói a versão com as variáveis de Production. Depois, conferir `sifcas.vercel.app`, login, `/ifos`, personalização e acesso por papel. A publicação exige confirmar o deploy correto e a configuração do projeto; não foi executada por esta conexão. [Procedimento oficial da Vercel](https://vercel.com/docs/deployments/promoting-a-deployment).

Persistem as dependências institucionais de SUAP/AVA, validação do schema/RLS remoto e medições autenticadas de produção. As novas verificações usaram dados sintéticos, sem sessões ou credenciais institucionais.

### Atualização de 13/11/2026

O commit de reserva `c1fe354` foi preservado. Na consulta GitHub, o último deployment marcado Production foi `f341b35`/success, de 12/11 às 15:05 em Cuiabá, e o último Preview foi `02d4183`/success, de 12/11 às 12:50. Assim, já existe registro de produção para o IFOS; a publicação posterior das imagens, revisão visual e memória ainda precisa ser confirmada. Registros de deployment não identificam por si só o alias que o domínio está servindo. O fechamento da documentação e da checagem está em [checkpoint final](second-brain/30-Historico/2026-11-13-Fechamento.md).
