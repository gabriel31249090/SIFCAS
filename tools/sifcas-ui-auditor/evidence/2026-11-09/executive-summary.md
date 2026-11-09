# SIFCAS — resumo da auditoria

Gerado em 2026-11-09T11:12:14.288Z.

## Limites de coleta

Instância local de desenvolvimento com banco PGlite sintético; sem dados, sessão ou serviços institucionais de produção. A leitura de robots.txt precedeu a navegação. Redirecionamentos HTTP foram verificados antes de visitar cada destino; falhas e páginas fora do escopo não foram medidas. Nenhum formulário foi enviado. Referências externas são contexto, não medições.

## Rotas permitidas e verificadas

- http://127.0.0.1:3100/noticias — HTTP 200 — Notícias e eventos | SIFCAS
- http://127.0.0.1:3100/editais — HTTP 200 — Central de editais | SIFCAS
- http://127.0.0.1:3100/agenda-institucional — HTTP 200 — Agenda institucional | SIFCAS
- http://127.0.0.1:3100/campus — HTTP 200 — Campus Cáceres | SIFCAS
- http://127.0.0.1:3100/transparencia — HTTP 200 — Transparência | SIFCAS
- http://127.0.0.1:3100/verificar-documento — HTTP 200 — Verificar documento | SIFCAS

## Candidatas excluídas

- Nenhuma rota inicial bloqueada.

## Resultados

- Viewports configurados: 320×640, 375×812, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080, 2560×1440.
- Capturas/medições realizadas: 48 combinações de rota e viewport.
- Tentativas descartadas durante a medição: 0.
- Verificações axe-core: 6; violações automatizadas por elemento: 0; itens para revisão manual: 8.
- Overflow horizontal observado: 0.
- Performance: Lighthouse local/dev scores — performance 72, accessibility 100, best-practices 100, seo 100; métricas de campo não coletadas; INP N/D.
- Rotas autenticadas: não testadas; nenhuma sessão autorizada fornecida.

## Achados prioritários

1. SERIOUS — color-contrast (http://127.0.0.1:3100/noticias): Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds Revisão manual; não é uma violação confirmada.
2. SERIOUS — color-contrast (http://127.0.0.1:3100/editais): Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds Revisão manual; não é uma violação confirmada.
3. SERIOUS — link-in-text-block (http://127.0.0.1:3100/editais): Ensure links are distinguished from surrounding text in a way that does not rely on color Revisão manual; não é uma violação confirmada.
4. SERIOUS — color-contrast (http://127.0.0.1:3100/agenda-institucional): Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds Revisão manual; não é uma violação confirmada.
5. SERIOUS — link-in-text-block (http://127.0.0.1:3100/agenda-institucional): Ensure links are distinguished from surrounding text in a way that does not rely on color Revisão manual; não é uma violação confirmada.
6. SERIOUS — color-contrast (http://127.0.0.1:3100/campus): Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds Revisão manual; não é uma violação confirmada.
7. SERIOUS — color-contrast (http://127.0.0.1:3100/transparencia): Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds Revisão manual; não é uma violação confirmada.
8. SERIOUS — color-contrast (http://127.0.0.1:3100/verificar-documento): Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds Revisão manual; não é uma violação confirmada.

Consulte [full-audit.md](./full-audit.md) e os JSON. Valores indisponíveis permanecem N/D.
