# Limites da coleta original

Estes arquivos preservam a coleta de 06/11/2026, sem alterar retroativamente seus números.

Revisão em 09/11/2026 encontrou duas classificações incorretas: as oito capturas de `/` pertencem à tela de login após redirecionamento, apesar de `/login` estar desautorizado pelo robots. As oito de `/publicacoes/` pertencem a uma página 404; esse prefixo foi incluído pelo próprio auditor, não descoberto como um link quebrado no app.

Assim, as 64 combinações registradas contêm 48 combinações de seis páginas públicas válidas. As sete ocorrências `link-name` correspondem ao mesmo link de acesso sem nome acessível no Topbar móvel. Incluem uma ocorrência na página 404. Não são sete componentes independentes.

Os resultados Lighthouse são locais, em desenvolvimento: acessibilidade 96, boas práticas 100, SEO 100; performance e métricas N/D. Não há dados de campo ou medição autenticada nesta evidência. Os JSONs extensos e as capturas originais continuam na pasta externa original; são saídas regeneráveis e não foram incorporados ao Git.
