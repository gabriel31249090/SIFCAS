# Contexto desta coleta

Aplicativo no commit `ef7a8f5`, com dados sintéticos locais e sem sessão. Capturas de seis páginas públicas em oito viewports: 48 combinações válidas. Axe-core 4.10.3 rodou em 375×812 nas seis páginas, sem violações confirmadas; oito grupos de regra/rota requerem revisão manual, envolvendo múltiplos elementos.

O Lighthouse foi executado separadamente em `/noticias`, depois da coleta. A execução final terminou em 09/11/2026 às 16:48:28 UTC, sem erro de runtime ou avisos. Pontuações: performance 72, acessibilidade 100, boas práticas 100 e SEO 100. São medições de desenvolvimento local, não de produção. INP e métricas de campo não foram medidos.

O auditor foi corrigido para não transformar uma requisição local bloqueada em um bloqueio de todos os assets da própria origem. Os arquivos Lighthouse nesta pasta correspondem à execução posterior à correção. As saídas extensas e capturas podem ser regeneradas seguindo o README do auditor.
