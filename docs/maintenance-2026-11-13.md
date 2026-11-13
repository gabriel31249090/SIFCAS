# SIFCAS — Relatório de manutenção real (13/11/2026)

> **Escopo:** verificações com ferramentas conectadas ao Supabase de produção `xqhilujzacwebeexljaf` e ao repositório `gabriel31249090/SIFCAS`. As verificações usam dados reais de integridade; os números **não** são constantes simuladas do algoritmo em Portugol.

## Resultado da auditoria

- Contas em `auth.users`: **78**; e-mails normalizados distintos: **78**.
- Cadastros de demonstração vinculados: **69** (50 estudantes, 11 professores e 8 servidores).
- Perfis sem Auth: **0**; papéis sem Auth: **0**.
- Usuários Auth sem perfil: **0**; usuários Auth sem papel: **0**.
- Grupos de e-mails duplicados: **0**.
- Identidades DEMO sem conta Auth correspondente: **0**.
- Estudantes DEMO sem matrícula: **0**.
- Professores DEMO sem disciplina, **após a correção**: **0**.
- Tabelas públicas sem RLS: **0**.

### Correção de dados efetuada

O registro de demonstração `teacher-1` (Português) estava com **0** atribuições de disciplinas. Foram incluídos **4 vínculos de ensino não primários** nas turmas DEMO, sem remover os docentes anteriormente designados. A consulta de conferência mostrou 4 atribuições para o registro e nenhum docente DEMO desprovido de atribuição.

Nenhuma conta foi excluída, pois a auditoria não identificou e-mails duplicados nem vínculos órfãos que justificassem exclusão. **Não** houve exclusão de dados reais, alteração de senha ou revogação de sessão.

## Três ciclos de validação

Os ciclos foram executados em sequência após a correção, com a mesma matriz de **7 verificações de integridade** e checagem do último estado de publicação no GitHub:

| Ciclo | Anomalias encontradas pelos 7 indicadores | Estado do commit no GitHub |
|---|---:|---|
| 1 | 0 | success |
| 2 | 0 | success |
| 3 | 0 | success |

**Importante:** essa repetição não corresponde a três novas execuções do build e da suíte de testes. Cada ciclo consultou novamente o banco e o status existente do CI.

## Verificação de código

A execução [SIFCAS Quality #45](https://github.com/gabriel31249090/SIFCAS/actions/runs/43450127204) do commit `4d8ec3f19239f6bd9d7840411bb505d81f17c767` foi concluída com **success**. As etapas registradas como aprovadas foram:

- `npm ci` com dependências do lockfile;
- `npm run lint`;
- `npm run build` (inclui auditorias e testes unitários/regressão);
- testes públicos de navegador em Chromium (`npm run test:e2e`).

Não houve alteração de código-fonte nesta rodada de manutenção, portanto não foram inventadas correções de código ou novos resultados de execução da suíte.

## Pendências reais de segurança

As recomendações automáticas do Supabase ainda indicam:

1. **`authenticated_security_definer_function_executable`:** `public.admin_set_account_status(uuid,text)` tem `SECURITY DEFINER` e pode ser chamada pela role `authenticated`. A função foi inspecionada e verifica internamente papel de administrador ativo; isso não prova uma exploração, mas precisa de revisão de escopo/permissões e teste com usuário não administrativo antes de modificar os `GRANTs`. [Recomendação](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
2. **`auth_leaked_password_protection`:** proteção contra senhas comprometidas está desativada. [Instruções oficiais](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Não se deve promover ajustes disruptivos de autorização sem validar os fluxos de cadastro e administração.

## Próximos trabalhos prioritários

1. Implantar e testar **limpeza seletiva DEMO** (prévia de impacto, identificação forte dos 69 usuários e tabelas relacionadas, confirmação por administrador geral, expurgo no Auth Admin API, backup e prova de que não elimina dados de produção). **Ainda não implementado**.
2. Corrigir os dois avisos de segurança com testes de RBAC e autenticação antes/depois.
3. Revalidar com usuários reais autorizados o fluxo completo de perfil, professor, estudante e servidor em desktop e celular.
4. Realizar ensaio de recuperação de backup em ambiente isolado.
5. Obter autorização e contratos para qualquer integração real com SUAP/AVA; atualmente o suporte documentado é por arquivo, não sincronização institucional.

**Conclusão:** uma falha de vínculo docente DEMO foi corrigida. Os sete indicadores de integridade estão zerados após três verificações. A última pipeline CI do código tem sucesso. As duas recomendações do Supabase e a limpeza DEMO permanecem pendentes; não é correto afirmar que todos os bugs e riscos de produção foram eliminados.
