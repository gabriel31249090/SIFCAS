# SIFCAS Mail — integração Gmail/Google Workspace (R$ 0)

Status: **implementação versionada, ainda não liberada em produção**. Nenhum e-mail é enviado até configurar o OAuth, a conta de envio, o segredo de criptografia e as tabelas. A automação de avaliações é *opt-in*.

## Arquitetura existente

- UI e formulários em `/sifcas-mail`, acessíveis apenas a professor, gestor e administrador ativos.
- O servidor checa os vínculos `class_subjects` + `teaching_assignments` com as mesmas regras do diário. Nunca recebe uma lista arbitrária de e-mails do navegador.
- Os destinatários são matrículas ativas, com endereço institucional do `profiles.institutional_email` ou e-mail de autenticação confirmado. Sem endereço confiável, o aluno é omitido e contabilizado.
- O Gmail é autorizado pelo professor via OAuth 2.0 e escopo limitado `gmail.send` + `openid email`. O refresh token fica **criptografado com AES-256-GCM** em tabela inacessível a `anon` e `authenticated`.
- Uma chave `service_role` atua somente em módulos `server-only`; **nunca** em `NEXT_PUBLIC_*`.
- A fila processa 15 entregas por execução manual e até 50 no cron diário, até um limite preventivo de 70 mensagens confirmadas por remetente em 24 horas. Não há compra automática de cota. O Gmail aplica seus próprios limites.
- O cron Vercel executa às **12h UTC / 08h America/Cuiaba**, uma vez por dia; o professor pode antecipar a fila na interface. Agendamentos posteriores ao cron podem aguardar até o dia seguinte.
- A criação de avaliação pode gerar um aviso automático quando o administrador habilita explicitamente a flag e conecta a conta de envio do sistema.
- A aplicação pode tentar reenviar após falha (até três tentativas); se a API enviar e a função cair antes do registro da confirmação, existe pequeno risco de e-mail duplicado. Não use para comunicados cujo duplicado tenha consequências financeiras ou legais.

## Bloqueio de banco de dados

O Supabase do SIFCAS usa o projeto `xqhilujzacwebeexljaf`. O conector administrativo disponível durante esta implementação **não tem acesso** a esse projeto e o repositório não contém uma baseline remota validada.

Por isso `supabase/isolated/sifcas-mail.sql` é um **contrato de homologação**, não uma migração aplicada em produção. Ele cria três tabelas com RLS e revoga privilégios de cliente. Foi validado com PGlite e papéis sintéticos, mas antes de aplicar em staging/produção um responsável técnico deve comparar com o schema real, conferir FKs, grants, extensões, políticas existentes, backups e os advisors. Não executar diretamente em produção sem essa revisão.

## Configuração Google Cloud

1. Com uma conta autorizada, crie um projeto em [Google Cloud Console](https://console.cloud.google.com/) e habilite **Gmail API**.
2. Configure a tela OAuth para contas Google Workspace internas, se for um aplicativo institucional gerenciado pelo IFMT, ou use Externo se necessário. Para o modo externo e escopo sensível `gmail.send`, planeje a **verificação do aplicativo pelo Google** e a possível aprovação dos administradores Workspace. O modo de teste tem limitações e expiração de refresh token; não é implantação definitiva.
3. Crie um cliente OAuth de tipo **Web application**. Cadastre a URI de redirecionamento **exatamente** `https://sifcas.vercel.app/api/sifcas-mail/google/callback` (ou o domínio de produção definido em `SIFCAS_MAIL_PUBLIC_URL`). Para testar localmente, inclua o callback de localhost separadamente.
4. Não compartilhe o client secret publicamente nem no GitHub. A conta Google só concede permissão de envio; não há leitura da caixa postal.

## Variáveis de ambiente privadas na Vercel

No projeto SIFCAS em Production, configure:

```ini
SUPABASE_SERVICE_ROLE_KEY=<somente a chave service_role do projeto SIFCAS>
SIFCAS_MAIL_PUBLIC_URL=https://sifcas.vercel.app
SIFCAS_MAIL_GOOGLE_CLIENT_ID=<client-id do Google>
SIFCAS_MAIL_GOOGLE_CLIENT_SECRET=<segredo do Google>
SIFCAS_MAIL_TOKEN_KEY=<32 bytes aleatórios codificados em base64/base64url>
CRON_SECRET=<valor aleatório forte e exclusivo>
SIFCAS_MAIL_AUTOMATIC_ASSESSMENTS=false
SIFCAS_MAIL_SYSTEM_SENDER_USER_ID=
```

Gere o token key com `openssl rand -base64 32`. Para `CRON_SECRET`, use `openssl rand -hex 32`.

**Não** reutilize a chave de autenticação pública do Supabase no lugar da `service_role`, não exponha segredos no cliente e não registre tokens nos logs.

## Testes e liberação

1. Reconciliar a baseline remota SIFCAS e testar o contrato SQL em um banco descartável/staging.
2. Rodar `npm run check` e `npm run build` após instalar com `npm ci` (Node 24).
3. Confirmar que usuários estudante, anônimo, pendente e suspenso não enviam e-mails nem leem as tabelas.
4. Criar uma turma **sintética** com endereços de teste que você controla. Conectar um Gmail autorizado, enfileirar um comunicado e conferir o recebimento individual e a contagem.
5. Confirmar a autorização institucional do IFMT, especialmente se o remetente é uma conta Google Workspace gerenciada.
6. Para avisos automáticos, criar uma conta de envio dedicada autorizada, conectá-la pelo fluxo OAuth e informar o UUID do usuário SIFCAS em `SIFCAS_MAIL_SYSTEM_SENDER_USER_ID`. Só então definir `SIFCAS_MAIL_AUTOMATIC_ASSESSMENTS=true` e testar uma avaliação sintética. O aluno recebe apenas os dados mínimos do aviso, não notas ou outros dados sensíveis.

## Regras de segurança e LGPD

- Usar só para comunicações acadêmicas legítimas e autorizadas, alinhadas à política institucional e à LGPD.
- Nunca enviar notas, faltas detalhadas, dados pessoais sensíveis ou credenciais no corpo do e-mail.
- O histórico inclui conteúdo e endereços: definir prazo de retenção institucional e procedimento de exclusão antes de habilitar produção.
- Desconectar a conta remove o token local, mas não cancela mensagens já enviadas; a revogação pelo painel Google também é recomendada.
- Se a conta Google for bloqueada, expirar ou mudar permissões, o envio para; reconecte após resolver a autorização. O backend não utiliza SMTP próprio.

## Referências oficiais

- [Gmail API — enviar mensagens](https://developers.google.com/workspace/gmail/api/guides/sending)
- [Google OAuth web-server](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Escopos e verificação OAuth](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Supabase — proteção da Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase — Send Email Hook para Auth](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Vercel — Cron Jobs](https://vercel.com/docs/cron-jobs)

**Nota:** este módulo envia comunicados escolares. Não substitui automaticamente os e-mails do **Supabase Auth** (confirmação, recuperação, mudança de senha). Para esses fluxos, configurar e testar separadamente o Send Email Hook com um provedor devidamente autorizado.
