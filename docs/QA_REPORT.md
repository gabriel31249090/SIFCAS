# Relatório de QA

## Aprovado

- `npm run audit`: aprovado. Auditoria de interação verificou 95 arquivos TSX/JSX; auditoria de rotas verificou 69 rotas de app e 169 fontes; auditoria de qualidade passou nos 169 arquivos.
- `node --experimental-strip-types --test tests/aero-assets.test.mjs tests/student-experience.test.mjs`: 13 testes passaram, 0 falharam.
- A verificação de PNG confirmou canal de cor RGBA nas novas folhas de molduras e adesivos. Os dez centros das molduras estão vazados/transparentes.
- Os sete viewports listados em [UI_AUDIT_FRUTIGER.md](./UI_AUDIT_FRUTIGER.md) não apresentaram overflow horizontal.

## Bloqueado pelo ambiente

- `npm test`: não iniciou a suíte completa porque falta `@electric-sql/pglite` em `node_modules`.
- `npm run lint`: indisponível; `eslint` não está instalado na cópia local.
- `npm run typecheck`: indisponível; `tsc` não está instalado.
- Playwright/E2E e `next build`: não foram concluídos, pois a instalação local de dependências está incompleta. Instalações anteriores falharam durante alterações concorrentes em `node_modules`; não foi feita nova reinstalação nesta etapa.

## Não verificado

Não foram testados o deploy autenticado, zoom 200%, leitor de tela, dispositivos físicos, comportamento real do Supabase ou dados institucionais. O cenário local de navegador usa fixtures sintéticas e não autentica contra o banco institucional. Nenhum deploy foi feito.

## Próximos passos de validação

1. Restaurar dependências em uma janela sem outro processo alterando `node_modules`.
2. Executar `npm run check`, `npm run test:e2e:academic` e `npm run build`.
3. Rever as capturas de tela do Playwright nos modos claro, escuro e móvel e medir as imagens efetivamente transferidas.
4. Validar o fluxo autenticado e integrações somente em ambiente autorizado.
