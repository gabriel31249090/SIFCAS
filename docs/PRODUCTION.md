# SIFCAS — checklist de produção

Este documento cobre a base de produção do SIFCAS, os vínculos institucionais e a MAISA Local.

## Responsabilidade do código

- RLS nas tabelas expostas pelo Supabase.
- Papéis institucionais separados do perfil editável.
- Administrador Geral protegido contra rebaixamento.
- Admin nunca é concedido por importação institucional.
- Novos cadastros sem vínculo oficial podem permanecer como `pending`.
- Importação institucional exige revisão e aplicação explícita do ADM.
- Estudantes podem ter matrícula sincronizada por código de curso + turma.
- Conflitos acadêmicos são sinalizados em vez de sobrescrever matrículas.
- Contas suspensas são bloqueadas nas rotas internas.
- Auditoria de alterações críticas.
- Storage institucional privado e anexos por URL assinada.
- Central de solicitações, processos e notificações.
- Auditores de interface, rotas e qualidade antes do build.
- Headers HTTP de segurança.
- Navegação mobile.
- MAISA Local em `/maisa`.

## MAISA Local

A MAISA executa dentro do SIFCAS e não depende de chave de API de Dify, OpenAI ou outro provedor.

O fluxo é:

```text
Pergunta
  ↓
classificação de intenção
  ↓
ferramentas SIFCAS/RLS
  ↓
Base de Conhecimento / rotas
  ↓
resposta estruturada
```

A rota `/api/maisa/chat` exige autenticação e conta ativa. Dados acadêmicos continuam sujeitos às permissões e ao RLS.

Ações de escrita são separadas das respostas e exigem confirmação do usuário.

## Vínculos institucionais

A área `/vinculos-institucionais` é exclusiva do ADM.

Fluxo:

```text
CSV oficial
→ validar
→ revisar lote
→ aprovar/aplicar
→ casar e-mail confirmado
→ papel institucional
→ matrícula acadêmica do estudante, quando curso/turma forem válidos
```

Papéis importáveis:

- student
- teacher
- staff
- manager

`admin` é recusado pelo importador e continua manual.

## Configurações externas do Supabase

Antes de abertura institucional ampla:

1. Authentication > URL Configuration
   - Site URL: `https://sifcas.vercel.app`
   - Redirect URLs: `https://sifcas.vercel.app/**`
2. Authentication > Security
   - Confirmar mínimo de 12 caracteres.
   - Ativar Leaked Password Protection somente se o plano contratado oferecer o recurso.
3. Authentication > Bot and Abuse Protection
   - Configurar CAPTCHA.
4. Authentication > Emails / SMTP
   - Manter o fluxo padrão enquanto não houver um provedor institucional aprovado.
   - Antes de uma abertura ampla, configurar SMTP institucional para destinatários externos.
5. Revisar Security Advisor e Performance Advisor.
6. Proteger a organização Supabase com MFA.

## Backup

Use exportações lógicas regulares e mantenha cópias fora do Supabase e da Vercel.

Fluxo multiplataforma recomendado:

```bash
npm run db:backup
```

O comando valida o arquivo e gera seu SHA-256. Faça mensalmente um ensaio com `npm run db:restore-test` em um banco vazio e descartável; o script recusa o projeto de produção.

No Windows/PowerShell:

```powershell
$env:SUPABASE_DB_URL="postgresql://..."
./scripts/backup-supabase.ps1
```

Storage precisa de cópia externa independente do backup lógico do Postgres.

## Auditorias

```bash
npm run audit:ui
npm run audit:routes
npm run audit:quality
npm run audit
npm run build
```

## Monitoramento

- `/api/health` — banco e MAISA Local.
- `/monitoramento` — painel interno para Gestor/ADM.
- `/auditoria` — alterações críticas.
- `/solicitacoes` — fila operacional.
- `/vinculos-institucionais` — validação de identidade e matrícula.
- Vercel Runtime Logs — erros da aplicação.
- Vercel Web Analytics e Speed Insights — navegação e Core Web Vitals reais.
- Supabase Security/Performance Advisors — banco, RLS e performance.
