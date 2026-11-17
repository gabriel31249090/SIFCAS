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

## Política de robots

```
User-Agent: *
Allow: /noticias
Allow: /editais
Allow: /agenda-institucional
Allow: /campus
Allow: /transparencia
Allow: /verificar-documento
Allow: /publicacoes/
Disallow: /api/
Disallow: /auth/
Disallow: /login
Disallow: /recuperar-senha
Disallow: /nova-senha
Disallow: /buscar
Disallow: /gestao-academica
Disallow: /painel-institucional
Disallow: /usuarios
Disallow: /auditoria
Disallow: /monitoramento
Disallow: /importar-dados-academicos
Disallow: /importar-calendario
Disallow: /diario-professor
Disallow: /boletim
Disallow: /agenda-aluno
Disallow: /minhas-turmas

Host: https://sifcas.vercel.app
Sitemap: https://sifcas.vercel.app/sitemap.xml
```

## Requisições de recursos bloqueados

- https://va.vercel-scripts.com/v1/script.debug.js
- https://va.vercel-scripts.com/v1/speed-insights/script.debug.js
- http://127.0.0.1:3100/__nextjs_original-stack-frames

Recursos externos são bloqueados pela política de mesma origem da ferramenta. Isso não significa que o robots.txt desses hosts foi consultado.

## Referências

{
  "json": "not-provided",
  "csv": "not-provided",
  "note": "Supplied files were not promoted to live measurements."
}

## Consistência e escopo

As medidas refletem apenas documentos válidos e os recursos carregados nesta execução. Não foram inferidos breakpoints, dados ausentes ou falhas visuais a partir de referências externas.

## Lighthouse local

- Página: http://127.0.0.1:3100/noticias
- Modo: Instância local de desenvolvimento com banco PGlite sintético; sem dados, sessão ou serviços institucionais de produção.; não representa benchmark de produção.
- Categorias: {"performance":{"score":0.72,"title":"Performance"},"accessibility":{"score":1,"title":"Accessibility"},"best-practices":{"score":1,"title":"Best Practices"},"seo":{"score":1,"title":"SEO"}}
- Métricas: {
  "first-contentful-paint": {
    "value": 1386.9279999999999,
    "display": "1.4 s",
    "score": 0.97,
    "error": null
  },
  "largest-contentful-paint": {
    "value": 1986.9279999999999,
    "display": "2.0 s",
    "score": 0.97,
    "error": null
  },
  "speed-index": {
    "value": 1881.005368016195,
    "display": "1.9 s",
    "score": 1,
    "error": null
  },
  "total-blocking-time": {
    "value": 1014,
    "display": "1,010 ms",
    "score": 0.27,
    "error": null
  },
  "cumulative-layout-shift": {
    "value": 0.1336573511543135,
    "display": "0.134",
    "score": 0.8,
    "error": null
  },
  "interactive": {
    "value": 7813.692000000001,
    "display": "7.8 s",
    "score": 0.44,
    "error": null
  },
  "server-response-time": {
    "value": 288,
    "display": "Root document took 290 ms",
    "score": 1,
    "error": null
  }
}
- Recursos/paths bloqueados: ["http://127.0.0.1:3100/api/*","http://127.0.0.1:3100/auth/*","http://127.0.0.1:3100/login*","http://127.0.0.1:3100/recuperar-senha*","http://127.0.0.1:3100/nova-senha*","http://127.0.0.1:3100/buscar*","http://127.0.0.1:3100/gestao-academica*","http://127.0.0.1:3100/painel-institucional*","http://127.0.0.1:3100/usuarios*","http://127.0.0.1:3100/auditoria*","http://127.0.0.1:3100/monitoramento*","http://127.0.0.1:3100/importar-dados-academicos*","http://127.0.0.1:3100/importar-calendario*","http://127.0.0.1:3100/diario-professor*","http://127.0.0.1:3100/boletim*","http://127.0.0.1:3100/agenda-aluno*","http://127.0.0.1:3100/minhas-turmas*","https://va.vercel-scripts.com/*"]
- INP: N/D, sem interações representativas.
- Avisos: []
