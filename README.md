# SIFCAS

**Sistema Integrado Federal de Campus, Administração e Serviços**

Plataforma em Next.js 16 + React 19 + TypeScript, integrada ao Supabase e publicada na Vercel.

Requer Node.js 24. A instalação e os deploys usam o `package-lock.json` com `npm ci` para manter builds reproduzíveis.

## Estado atual

O SIFCAS possui autenticação SSR, perfis e papéis institucionais, validação de vínculos, núcleo acadêmico, agenda por turma, diário do professor, notas, frequência, boletim, documentos acadêmicos verificáveis, processos, oportunidades e uma camada institucional de notícias, editais, eventos e notificações.

### Módulos reais já conectados

- Auth + RBAC/RLS
- Perfil e vínculos institucionais
- Importação segura de estudantes, professores, servidores e gestores
- Sincronização de matrícula de estudantes por curso/turma
- Gestão acadêmica
- Agenda do aluno/turma
- Diário do professor
- Notas e frequência
- Boletim
- Documentos acadêmicos e verificação pública
- Processos eletrônicos
- Estágios, auxílios e projetos
- Agenda de TCC
- Notícias, comunicados e editais
- Agenda institucional
- Painel institucional
- Notificações e Central de Pendências
- Busca global
- Transparência agregada
- Central de aplicativos
- MAISA Local

## MAISA Local

A MAISA não depende de Dify ou de outro provedor externo de IA.

O motor local usa:

1. classificação simples de intenção;
2. ferramentas autenticadas do SIFCAS;
3. consulta à Base de Conhecimento;
4. busca de rotas/módulos;
5. respostas estruturadas e determinísticas.

Operações que alteram dados, como abertura de solicitação, continuam exigindo confirmação explícita do usuário.

## Segurança

- RLS nas tabelas sensíveis
- Papéis institucionais separados do perfil pessoal
- Conta sem vínculo oficial pode permanecer pendente
- Administrador Geral protegido contra rebaixamento acidental
- Admin nunca é concedido por importação institucional
- Credenciais privilegiadas não são expostas no frontend
- Publicações institucionais respeitam visibilidade e público-alvo

## Qualidade

Para validar lint, tipos, testes de regressão e auditorias internas:

```bash
npm run check
```

O build de produção repete as auditorias e os testes antes do `next build`. A suíte cobre, entre outros pontos, destinos de redirecionamento, visibilidade por papel, catálogo de módulos e busca tolerante a acentos.

Os fluxos públicos também possuem testes E2E em Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

No GitHub Actions, o navegador é instalado depois do build e valida login, política de senha, placeholders do Campus, `robots.txt`, sitemap e manifesto.

## Interface

- Identidade visual e marca próprias do SIFCAS
- Catálogo único de módulos e ícones Lucide consistentes
- Navegação responsiva com menu lateral e barra móvel
- Busca e filtros mais claros
- Estados de carregamento, erro, vazio e página não encontrada
- Foco visível, link de salto, alvos de toque e redução de movimento

## Produção e observabilidade

- Vercel Web Analytics e Speed Insights montados no layout raiz
- endpoint `/api/health` sem cache e com validação estrita da RPC do banco
- CSP, bloqueio de iframe, política de permissões e cabeçalhos defensivos
- metadados por página pública, Open Graph próprio, manifesto, robots e sitemap
- páginas públicas anônimas evitam consultar o Supabase Auth quando não existe cookie de sessão

As métricas aparecem depois que Web Analytics e Speed Insights estiverem habilitados no projeto correto da Vercel e esta versão for implantada.

## Supabase versionado

O CLI está fixado nas dependências de desenvolvimento e `supabase/config.toml` mantém a configuração local. O repositório ainda não contém uma baseline SQL porque ela precisa vir do banco real, nunca de inferências do código.

Com acesso ao projeto correto:

```bash
npm run supabase:link
npm run supabase:pull
npm run supabase:types
npm run supabase:lint
```

Revise integralmente a migração criada pelo `db pull`, gere os tipos apenas após confirmar o projeto e teste a baseline em um projeto Supabase separado antes de qualquer aplicação em produção. Detalhes e bloqueios atuais estão em `supabase/README.md`.

## Backup e ensaio de restauração

O backup lógico exige `pg_dump`, `pg_restore` e `SUPABASE_DB_URL`:

```bash
npm run db:backup
```

O comando valida o arquivo com `pg_restore --list` e gera um SHA-256. O ensaio completo só aceita um destino explicitamente confirmado e recusa o projeto de produção:

```bash
SIFCAS_RESTORE_TEST_DB_URL=postgresql://... \
SIFCAS_CONFIRM_RESTORE_TEST=RESTORE_SIFCAS_TEST_ONLY \
npm run db:restore-test -- backups/sifcas-AAAA.dump
```

Use apenas um banco vazio e descartável. Arquivos do Supabase Storage precisam de uma cópia separada.

## Desenvolvimento

```bash
npm ci
npm run dev
```

Para build de produção:

```bash
npm run build
```

## Dados institucionais

A carga de contatos, setores, horários, infraestrutura, cardápio, transporte, biblioteca e demais dados oficiais fica por último. Até a validação das fontes, a página Campus identifica essas áreas como planejadas e não apresenta cartões sem destino como serviços ativos.
