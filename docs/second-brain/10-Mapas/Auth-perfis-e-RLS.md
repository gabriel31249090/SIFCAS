---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# Autenticação, perfis e RLS

[lib/auth.ts](../../../lib/auth.ts) obtém claims validadas do Supabase e consulta `profiles` e `user_roles`. Se não há cookie da sessão, retorna sem consultar Auth. Erros na consulta de autorização falham com erro; estado ausente assume `pending`. `requireAccount()` redireciona visitantes ao login e contas pendentes/suspensas a acesso negado.

`CurrentAccount` separa dados pessoais do papel institucional. Papéis: `student`, `teacher`, `staff`, `manager`, `admin`; `isGeneralAdmin` é um indicador adicional. Estados: `active`, `pending`, `suspended`. Não derivar papel administrativo de campos editáveis do perfil nem de importação CSV.

Regras de prefixo presentes no [proxy Supabase](../../../lib/supabase/proxy.ts), verificadas por leitura em 12/11/2026:

| Rotas | Papéis exigidos no proxy |
| --- | --- |
| `/administracao`, `/pessoas`, `/painel-institucional` | staff, manager, admin |
| `/gestao-academica`, `/auditoria`, `/monitoramento` | manager, admin |
| `/usuarios`, `/vinculos-institucionais`, `/modelo-vinculos-institucionais` | admin |
| `/diario-professor`, `/minhas-turmas` | teacher, manager, admin |
| Demais rotas privadas | sessão e conta ativa; restrições adicionais nas páginas/ações/RLS |

Prefixos públicos incluem login/auth, saúde, anexos, arquivos de metadados, recuperação, notícias, editais, agenda institucional, transparência, campus, acesso negado, verificação de documento, busca, aplicativos e publicações. **A raiz `/` não está na lista pública do proxy.** A classificação de uma ficha pela presença de guard não substitui essas regras.

Fluxos de conta: [login/actions](../../../app/login/actions.ts), [auth callback](../../../app/auth/callback/route.ts), [auth confirm](../../../app/auth/confirm/route.ts), [signout](../../../app/auth/signout/route.ts), [recuperação](../../../app/recuperar-senha/actions.ts), [nova senha](../../../app/nova-senha/actions.ts), [safe-path](../../../lib/safe-path.ts), [password-policy](../../../lib/password-policy.ts). Templates SSR usam hash do token; validar destino de redirecionamento e não registrar tokens.

Vínculos institucionais: [importador](../../../lib/institutional-import.ts), [ações de vínculos](../../../app/vinculos-institucionais/actions.ts), [ações de usuários](../../../app/usuarios/actions.ts). CSV passa por validação e revisão/aplicação explícita. Papéis importáveis não incluem `admin`; conflitos acadêmicos não devem ser resolvidos por sobrescrita automática.

`admin_set_account_status` tem patch SQL separado: [patch](../../../supabase/patches/admin-account-status.sql). O contrato documentado exige admin ativo, impede auto-suspensão e protege Administrador Geral. Não confundir existência do arquivo com instalação da função remota. Há testes de domínio e banco isolado para o comportamento previsto.

**RLS remota permanece não auditada nesta tarefa.** [supabase/README](../../../supabase/README.md) declara ausência de baseline verificada. [[20-Catalogo/Banco-e-RPCs]] distingue consultas do código e declarações SQL locais. SQL em `isolated/`, fixtures e patches serve a propósitos diferentes; não reconstruir produção a partir dele. Provar isolamento exige staging com todos os papéis, usuário anônimo, conta pendente/suspensa e tentativas de acesso cruzado.

[[10-Mapas/Integracoes-e-limites]] · [[10-Mapas/Academico-e-importacoes]] · [[40-Decisoes-e-pendencias/Pendencias]] · [[20-Catalogo/Rotas]]
