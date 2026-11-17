# Legibilidade Aero — 12/11/2026

A revisão dos oito grupos manuais registrados em 09/11 encontrou problemas reais de contraste em textos secundários e botões. Os resultados `incomplete` do axe foram usados como pontos de inspeção, sem convertê-los automaticamente em falhas.

Foram escurecidos textos secundários, navegação, rodapé, etiquetas, placeholders e o gradiente dos botões primários. Os fundos translúcidos, reflexos, cores e ícones Aero foram preservados. Links inseridos em parágrafos, listas e descrições agora têm sublinhado permanente, incluindo os links antes pendentes em `/editais` e `/agenda-institucional`. O foco dos campos ganhou contorno mais escuro. O espaço de rolagem inferior passou a reservar 100 px: a verificação por teclado confirmou que a barra móvel podia encobrir controles focados, principalmente em 200%.

| Exemplo observado em `/editais`, 375 px | Antes | Depois |
| --- | ---: | ---: |
| Descrição do cabeçalho | 3,24:1 | 4,70:1 |
| Texto do botão “Aplicar filtros” | 2,50:1 | 5,44:1 |
| Texto secundário da identidade no rodapé | 2,54:1 | 4,96:1 |

A coleção Aero e sua prévia em `/personalizacao` receberam a mesma revisão dos textos observados. Os nomes acessíveis da marca e dos cartões da coleção foram corrigidos na mesma entrega, incluindo os textos visíveis e seus espaços.

## Verificação executada

- Seis rotas públicas: `/noticias`, `/editais`, `/agenda-institucional`, `/campus`, `/transparencia` e `/verificar-documento`, em 375×812 e 1440×1000. Todas responderam HTTP 200 e não apresentaram overflow horizontal.
- Axe-core 4.14.0: nenhuma violação nas regras `color-contrast`, `link-in-text-block`, `link-name`, `label-content-name-mismatch` e `target-size`, nas 12 combinações públicas e nas duas combinações da coleção com conta sintética de estudante. Isso é uma checagem de cinco regras, não uma auditoria integral.
- Contraste: amostragem de nove pontos por retângulo de texto sobre captura do fundo renderizado, com o texto temporariamente transparente. Conteúdo cortado por contêineres, detalhes fechados e textos transparentes foram excluídos na coleta final. Nenhum texto informativo amostrado ficou abaixo do limiar correspondente. Os pontos decorativos das marcas e a estrela decorativa da personalização foram mantidos; são elementos decorativos/logotipos.
- Teclado: 558 alvos percorridos em 18 combinações das seis rotas. Nenhum foco sem indicador, fora da tela ou totalmente encoberto na rodada final. Menu móvel abriu com Enter, fechou com Escape e devolveu o foco; detalhes abriram/fecharam com Enter; o campo de código aceitou digitação. Nenhum formulário foi enviado.
- Zoom: Chromium em janela de 1440×1000, zoom real de navegador 200% aplicado e confirmado com `chrome.tabs.setZoom/getZoom`. O viewport resultante foi 712×452 CSS px, DPR 2; as seis páginas mantiveram `scrollWidth === innerWidth`. Foi usada preferência de movimento reduzido durante as verificações de foco.

As capturas de celular, computador e zoom foram inspecionadas visualmente. A [captura móvel](../tools/sifcas-ui-auditor/evidence/2026-11-12/verificar-documento-375.png) e a [captura em zoom real](../tools/sifcas-ui-auditor/evidence/2026-11-12/editais-zoom200.png) preservam duas amostras representativas.

O axe continua marcando contraste como `incomplete` em superfícies com gradientes. Isso permanece explicitamente registrado; o resultado manual cobre os textos, páginas e estados descritos, em tema claro padrão, com dados locais sintéticos. Não comprova todos os temas/papéis, estados de erro, documentos externos, leitores de tela ou integração institucional.

Os JSON compactos e os scripts reproduzíveis ficam em [`evidence/2026-11-12`](../tools/sifcas-ui-auditor/evidence/2026-11-12/). `measure-legibility.mjs` registra as amostras e o axe; `keyboard-zoom.mjs` percorre os controles e confirma o zoom com uma extensão local de teste. Ambos usam a instância sintética de `npm run dev:academic`; não dependem de credenciais institucionais. A medição em build de produção é registrada separadamente.
