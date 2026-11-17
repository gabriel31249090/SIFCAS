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

## Requisições de recursos bloqueadas

- https://va.vercel-scripts.com/v1/script.debug.js
- https://va.vercel-scripts.com/v1/speed-insights/script.debug.js

## Inventário de referência

{
  "json": "not-provided",
  "csv": "not-provided",
  "note": "Supplied files were not promoted to live measurements."
}

## Consistência e escopo

As medições DOM e capturas só são representativas do conteúdo e dos recursos que a política de coleta autorizou. Recursos bloqueados por robots podem limitar estilo e imagens; consulte `routes.json` e `responsive.json` antes de interpretar screenshots. Não foram inferidos breakpoints nem valores de layout ausentes.

## Lighthouse local

- Página: http://127.0.0.1:3000/noticias
- Modo: desenvolvimento local com configuração Supabase fictícia; não representa benchmark de produção.
- Categorias: {"performance":{"score":null,"title":"Performance"},"accessibility":{"score":0.96,"title":"Accessibility"},"best-practices":{"score":1,"title":"Best Practices"},"seo":{"score":1,"title":"SEO"}}
- Métricas: {
  "first-contentful-paint": {
    "value": null,
    "display": null,
    "score": null
  },
  "largest-contentful-paint": {
    "value": null,
    "display": null,
    "score": null
  },
  "speed-index": {
    "value": null,
    "display": null,
    "score": null
  },
  "total-blocking-time": {
    "value": null,
    "display": null,
    "score": null
  },
  "cumulative-layout-shift": {
    "value": null,
    "display": null,
    "score": null
  },
  "interactive": {
    "value": null,
    "display": null,
    "score": null
  },
  "server-response-time": {
    "value": null,
    "display": null,
    "score": null
  }
}
- Recursos/paths bloqueados: ["http://127.0.0.1:3000/api/","http://127.0.0.1:3000/auth/","http://127.0.0.1:3000/login","http://127.0.0.1:3000/recuperar-senha","http://127.0.0.1:3000/nova-senha","http://127.0.0.1:3000/buscar","http://127.0.0.1:3000/gestao-academica","http://127.0.0.1:3000/painel-institucional","http://127.0.0.1:3000/usuarios","http://127.0.0.1:3000/auditoria","http://127.0.0.1:3000/monitoramento","http://127.0.0.1:3000/importar-dados-academicos","http://127.0.0.1:3000/importar-calendario","http://127.0.0.1:3000/diario-professor","http://127.0.0.1:3000/boletim","http://127.0.0.1:3000/agenda-aluno","http://127.0.0.1:3000/minhas-turmas"]
- INP: N/D, sem interações representativas.
- Avisos: []
