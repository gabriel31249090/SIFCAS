# SIFCAS

**Sistema Integrado Federal de Campus, Administração e Serviços**

Projeto para unificar, em uma única experiência, as funções hoje distribuídas entre os portais institucionais do IFMT, o portal do Campus Cáceres e o ecossistema acadêmico/administrativo inspirado no SUAP.

## Objetivo

Construir uma plataforma única, responsiva e modular para estudantes, professores, servidores, gestores e público externo.

## Estado atual

Fase inicial de arquitetura e interface. O projeto já possui rotas conceituais para:

- Início / dashboard
- Área do estudante
- Ensino
- Pesquisa
- Extensão
- Campus Cáceres
- Central de serviços
- Documentos e processos
- Administração
- Pessoas
- Editais
- Notícias e eventos
- Transparência
- Perfil
- Agenda Institucional
- Agenda do Aluno/Turma

## Agendas

### Agenda Institucional
Calendário oficial com eventos, prazos, reuniões, feriados, solenidades, comunicados e atividades do IFMT e dos campi.

### Agenda do Aluno/Turma
Professores poderão publicar, para uma turma específica e em uma data específica, o planejamento de aula, conteúdos previstos, provas, trabalhos, atividades, materiais e observações.

## MAISA

A **MAISA — Módulo de Assistência Inteligente em Serviços Acadêmicos e Administrativos** está planejada, mas será implementada apenas na etapa final, depois que os módulos principais estiverem estáveis e integrados.

## Stack inicial

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS próprio
- Lucide Icons

A camada de integração com Supabase já está preparada no código (browser/server/SSR), mas o projeto Supabase exclusivo do SIFCAS ainda precisa ser criado antes de configurar as variáveis da Vercel.

## Executar localmente

```bash
npm install
npm run dev
```

Depois acesse `http://localhost:3000`.

## Roadmap inicial

1. Validar design e estrutura de navegação
2. Definir modelo de dados e perfis/permissões
3. Implementar autenticação
4. Implementar módulos acadêmicos
5. Implementar documentos/processos e serviços administrativos
6. Implementar agendas com publicação por permissões
7. Integrar notícias, editais, campus e transparência
8. Testes, acessibilidade e responsividade
9. Implementar MAISA

> Os dados exibidos na interface inicial são demonstrativos e não representam dados reais de estudantes ou do IFMT.
