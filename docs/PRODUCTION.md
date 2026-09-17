# SIFCAS — checklist de produção pré-MAISA

Este documento cobre a base do SIFCAS antes da integração da MAISA. A MAISA será implementada somente na etapa final, usando Dify.

## O que já é responsabilidade do código

- RLS nas tabelas expostas pelo Supabase.
- Papéis institucionais separados do perfil editável.
- Administrador Geral protegido contra rebaixamento pela aplicação e por trigger no banco.
- Contas podem ser suspensas pelo ADM e são bloqueadas no login/rotas internas.
- Trilha de auditoria para alterações acadêmicas, administrativas e institucionais críticas.
- Storage institucional privado, com anexos limitados a 15 MB e download por URL assinada.
- Central de solicitações com status, responsável e notificações.
- Auditor de botões/formulários e auditor de rotas antes de cada `next build`.
- Headers HTTP de segurança básicos.
- Navegação mobile dedicada.

## Configurações que exigem o Dashboard do Supabase

Antes de abrir o SIFCAS para uso institucional amplo:

1. Authentication > URL Configuration
   - Site URL: `https://sifcas.vercel.app`
   - Redirect URLs: `https://sifcas.vercel.app/**`
2. Authentication > Security
   - Ativar Leaked Password Protection.
3. Authentication > Bot and Abuse Protection
   - Configurar CAPTCHA para login/cadastro/recuperação quando o portal for aberto ao público.
4. Authentication > Emails / SMTP
   - Usar SMTP próprio para maior entregabilidade e controle institucional.
5. Revisar periodicamente Security Advisor e Performance Advisor.
6. Proteger a conta/organização Supabase com MFA.

## Backup

Projetos Supabase Free não oferecem download de backups automáticos. Faça exportações lógicas regulares e guarde cópias fora do Supabase e da Vercel.

No Windows/PowerShell:

```powershell
$env:SUPABASE_DB_URL="postgresql://..."
./scripts/backup-supabase.ps1
```

O script usa `pg_dump` em formato custom. A pasta `backups/` é ignorada pelo Git e nunca deve receber commits.

Storage não é restaurado por um backup lógico do Postgres. Arquivos importantes do bucket também devem ter cópia externa independente.

## Auditorias do projeto

```bash
npm run audit:ui
npm run audit:routes
npm run audit
npm run build
```

O build de produção executa as auditorias antes do Next.js.

## Monitoramento

- `/api/health` — saúde básica aplicação + banco.
- `/monitoramento` — painel interno para Gestor/ADM.
- `/auditoria` — alterações críticas registradas.
- `/solicitacoes` — fila operacional de atendimento.
- Vercel Runtime Logs — erros da aplicação.
- Supabase Security/Performance Advisors — banco/RLS/performance.

## MAISA

A MAISA não faz parte desta etapa. A integração final será construída com **Dify**, usando o SIFCAS já estabilizado como fonte de contexto e ferramentas. Chaves do Dify deverão existir somente em variáveis de ambiente do servidor e nunca no navegador ou repositório.
