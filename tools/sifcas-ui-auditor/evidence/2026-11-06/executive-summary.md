# SIFCAS — resumo da auditoria

Gerado em 2026-11-06T15:40:25.685Z.

## Limites de coleta

A leitura de `robots.txt` precedeu qualquer navegação. Nenhum acesso autenticado foi tentado, nenhum formulário foi enviado e nenhuma alteração foi realizada. Entradas de relatórios externos são contexto, não medidas.

## Rotas permitidas e verificadas

- http://127.0.0.1:3000/ — HTTP 200 — Entrar | SIFCAS
- http://127.0.0.1:3000/noticias — HTTP 200 — Notícias e eventos | SIFCAS
- http://127.0.0.1:3000/editais — HTTP 200 — Central de editais | SIFCAS
- http://127.0.0.1:3000/agenda-institucional — HTTP 200 — Agenda institucional | SIFCAS
- http://127.0.0.1:3000/campus — HTTP 200 — Campus Cáceres | SIFCAS
- http://127.0.0.1:3000/transparencia — HTTP 200 — Transparência | SIFCAS
- http://127.0.0.1:3000/verificar-documento — HTTP 200 — Verificar documento | SIFCAS
- http://127.0.0.1:3000/publicacoes/ — HTTP 404 — SIFCAS — Campus Cáceres

## Rotas iniciais não navegadas

- Nenhuma rota inicial bloqueada.

## Resultados

- Viewports configurados: 320×640, 375×812, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080, 2560×1440.
- Capturas/medições realizadas: 64 combinações de rota e viewport.
- Verificações axe-core: 8; violações automatizadas: 7; itens que exigem revisão manual: 10.
- Overflow horizontal observado: 0.
- Performance: Lighthouse local/dev scores — performance N/D, accessibility 96, best-practices 100, seo 100; métricas de campo não coletadas; INP N/D.
- Rotas autenticadas: não testadas; nenhuma sessão autorizada fornecida.

Consulte [full-audit.md](./full-audit.md) e os JSON nesta pasta. Valores indisponíveis permanecem N/D.
