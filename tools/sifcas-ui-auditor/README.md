# SIFCAS UI Auditor

Auditor independente para medir o SIFCAS em uma instância local/autorizada. Não modifica os arquivos do app. Lê `robots.txt` antes de navegar, limita a descoberta à mesma origem e às rotas permitidas e não realiza cliques, envios ou alterações. Rotas autenticadas só podem ser incluídas com uma sessão legitimamente autorizada; nenhuma credencial é solicitada ou armazenada pelo crawler.

## Executar

Requer Node.js 24.

```powershell
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

Na raiz do repositório, inicie o SIFCAS localmente em outro terminal, usando apenas configuração local/de teste (não use chaves ou serviços de produção):

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Depois, em `tools/sifcas-ui-auditor`:

```powershell
npm run audit
npm run audit:lighthouse
```

Variáveis opcionais:

- `SIFCAS_AUDIT_ORIGIN`: instância autorizada; padrão `http://127.0.0.1:3000`. Endereços remotos exigem `SIFCAS_AUDIT_ALLOW_REMOTE=1`.
- `SIFCAS_AUDIT_MAX_ROUTES`: limite de rotas por execução; padrão `30`.
- `SIFCAS_AUDIT_CONTEXT`: descrição factual do ambiente, incluída nos relatórios. A ferramenta não presume que o banco esteja conectado ou desconectado.
- `SIFCAS_AUDIT_REFERENCE_JSON` / `SIFCAS_AUDIT_REFERENCE_CSV`: referências opcionais, sempre identificadas como não verificadas.

O auditor não acessa SUAP. Referências antigas não são convertidas em medições. Medições sem acesso ao DOM permanecem `N/D`. Se o `robots.txt` restringir uma página, ela é registrada como bloqueada e não é aberta.

As seis rotas iniciais são `/noticias`, `/editais`, `/agenda-institucional`, `/campus`, `/transparencia` e `/verificar-documento`. Outras páginas são descobertas por links reais. Uma permissão de prefixo em robots não é tratada como página existente. `/` e `/publicacoes/` não são sementes públicas: a primeira exige sessão e a segunda não é um índice implementado.

Antes de navegar, o auditor consulta os redirecionamentos HTTP manualmente e valida cada destino. Só documentos 2xx permitidos entram nas medições. Durante a coleta, redirecionamentos inesperados e métodos diferentes de GET/HEAD são bloqueados. Cada registro distingue URL solicitada, URL final e motivo de exclusão. O navegador usa contexto descartável sem sessão; esta implementação não carrega credenciais ou arquivos de autenticação.

Para repetir somente a cobertura pública principal, com dados sintéticos locais:

```powershell
# Na raiz do app, em outro terminal:
npm run dev:academic

# Nesta pasta:
$env:SIFCAS_AUDIT_ORIGIN='http://127.0.0.1:3100'
$env:SIFCAS_AUDIT_MAX_ROUTES='6'
$env:SIFCAS_AUDIT_CONTEXT='Desenvolvimento local com banco PGlite sintético, sem sessão autorizada.'
npm run audit
npm run audit:lighthouse
```

O máximo de seis candidatas limita esta execução a seis páginas × oito viewports (48 combinações). A descoberta padrão pode cobrir mais páginas. Nenhum dado sintético é apresentado como registro oficial.

## Saídas

`reports/` recebe inventário de rotas/componentes, geometria, assets, recomendações de encaixe, responsividade, axe-core, tokens e inconsistências. `screenshots/` recebe capturas por rota e viewport auditadas. Tokens observados, documentados e sugeridos ficam explicitamente separados.

Essas saídas e `node_modules/` são ignoradas pelo Git. Evidências compactas revisadas ficam em `evidence/`, com data e limites da coleta. A pasta externa original do auditor foi preservada; a cópia versionada e mantida é esta. A ferramenta tem TypeScript e testes próprios e está excluída dos checks do aplicativo.

Viewports configurados: 320×640, 375×812, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080 e 2560×1440.

Sem sessão autorizada, páginas autenticadas são intencionalmente ignoradas. Os testes de estados usam apenas hover/foco, nunca ativam controles. O Lighthouse roda apenas em localhost e bloqueia os caminhos negados no `robots.txt` e os hosts de terceiros já observados. Os resultados do servidor de desenvolvimento são diagnósticos locais, não benchmarks de produção.
