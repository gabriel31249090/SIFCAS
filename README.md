# SIFCAS

**Sistema Integrado Federal de Campus, Administração e Serviços**

Plataforma em Next.js 16 + React 19 + TypeScript, integrada ao Supabase e publicada na Vercel.

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

O build executa:

```bash
npm run audit:ui
npm run audit:routes
npm run audit:quality
```

antes de `next build`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para build de produção:

```bash
npm run build
```
