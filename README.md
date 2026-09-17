# SIFCAS

**Sistema Integrado Federal de Campus, Administração e Serviços**

Base funcional em Next.js 16 + React 19 + TypeScript, integrada ao Supabase e preparada para deploy na Vercel.

## Estado atual

O SIFCAS já possui autenticação SSR, perfis e papéis institucionais, núcleo acadêmico, agenda por turma, diário do professor, notas, frequência, boletim, documentos acadêmicos verificáveis e a camada institucional de notícias, editais, eventos, agenda e notificações.

### Módulos reais já conectados

- Auth + RBAC/RLS
- Perfil institucional
- Gestão acadêmica
- Agenda do aluno/turma
- Diário do professor
- Notas e frequência
- Boletim
- Documentos acadêmicos e verificação pública
- Notícias e comunicados
- Editais
- Agenda institucional
- Painel institucional de publicação
- Notificações
- Busca global
- Central de aplicativos

## Segurança

- RLS nas tabelas sensíveis
- Papéis institucionais separados do perfil pessoal
- Administrador Geral protegido contra rebaixamento acidental pelo painel
- Credenciais privilegiadas não são expostas no frontend
- Publicações institucionais respeitam visibilidade e público-alvo

## Qualidade de interface

O build executa `npm run audit:ui` antes de `next build`. O auditor impede que novos botões sem ação, links sem `href` ou formulários sem destino sejam publicados por engano.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para validar interações estáticas:

```bash
npm run audit:ui
```

Para build de produção:

```bash
npm run build
```

## MAISA

A MAISA será implementada somente na etapa final, depois de consolidar a base funcional do SIFCAS.
