---
tipo: checkpoint-de-entrega
data: 2026-11-12
fuso: America/Cuiaba
commit_base: 02d4183618b3ee6b09f7b0f66e8aa90c99cccb94
ambiente: local-com-dados-sinteticos
---

# IFOS, Aero e memória — entrega local

- **Fatos:** layout do IFOS persistido por conta, redimensionamento com ponteiro/setas/Shift e restauração de módulos autorizados. Limites de 64 janelas e 32 KB de JSON. Não persistir dados acadêmicos ou estado de execução do foco.
- **Imagens:** 100 recortes e 100 miniaturas WebP. Fontes originais: 23.578.554 bytes; recortes principais: 3.204.140 bytes; miniaturas: 1.171.892 bytes. Navegação de seis categorias e recarregamento solicitou 105 imagens únicas/1.371.158 bytes de corpos de imagens Aero, sem solicitar folhas originais. Não converter essa redução em uma afirmação de ganho percentual na velocidade de produção.
- **Acessibilidade:** cinco regras axe, 14 combinações públicas/coleção sem violações; 558 alvos de teclado em 18 combinações, incluindo zoom real 200%, sem problemas finais de foco/overflow observados. Gradientes permanecem como incomplete, com inspeção manual delimitada.
- **Memória:** vault, fontes/relações estáticas, mapas humanos e recuperação por CLI. Testes negativos confirmaram detecção de mudanças reais, sem falso stale por CRLF/LF. Hash não comprova semântica ou aplicação de SQL remoto.
- **Testes:** 170 testes do app, 15 do auditor e 15 cenários de navegador passaram. Build local de produção gerou 106 páginas estáticas. A checagem consolidada final será registrada pelo coordenador após atualização do catálogo.
- **Lighthouse final:** build local, `/noticias`, performance 100/acessibilidade 100/boas práticas 96/SEO 100, sem erro de runtime. FCP/LCP cerca de 1,2 s, TBT 90 ms, CLS 0. Primeira tentativa falhou com NO_NAVSTART e foi repetida. Erros de recursos `/_vercel` no ambiente local continuam expostos no JSON. Não é resultado de produção remota nem de campo.
- **Publicação:** branch de trabalho enviada, mas domínio de produção ainda não confirmado. A conexão Vercel disponível acessa outro escopo; não foi comprovada necessidade de plano pago. SUAP/AVA e baseline remota continuam dependentes de acesso autorizado.

Evidências: [relatório de entrega](../../entrega-ifos-memoria-2026-11-12.md), [revisão visual](../../legibilidade-aero-2026-11-12.md), [Lighthouse](../../../tools/sifcas-ui-auditor/evidence/2026-11-12/production-performance.json), [transferência de imagens](../../../tools/sifcas-ui-auditor/evidence/2026-11-12/aero-image-network.json). Comandos e escopo no relatório; não guardar sessões sintéticas ou reais no vault.

[[01-Estado-atual]] · [[10-Mapas/Personalizacao-Aero-e-IFOS]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[40-Decisoes-e-pendencias/Pendencias]]
