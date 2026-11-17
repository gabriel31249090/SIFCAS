# Auditoria da interface — Frutiger Aero

## Escopo e método

Auditoria da cópia local `SIFCAS-assets`, com inspeção visual das telas públicas e da experiência autenticada com sessão sintética local. O site publicado encaminha a página inicial para o login; nenhuma autenticação foi contornada e nenhuma área protegida de produção foi acessada.

Foram inspecionados os viewports 360 × 800, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 800, 1440 × 900 e 1920 × 1080. Não foi observado overflow horizontal nesses tamanhos. O zoom de 200%, navegação autenticada no deploy e tecnologias assistivas não foram validados nesta rodada.

## Medições observadas

| Elemento | Medição |
| --- | ---: |
| Cabeçalho em telas móveis | 76 px |
| Cabeçalho em desktop | 84 px |
| Barra lateral quando visível | 228–258 px |
| Largura máxima do conteúdo | 1536 px |
| Botões principais da página inicial | 213 × 42 px |
| Avatares da navegação | 32–39 px |
| Navegação móvel fixa | 70 px |
| Campos e botão de envio do login | 52 px de altura |

## Inventário visual e de conteúdo

- **Direção visual:** azul-céu, verde, superfícies translúcidas e vidro, brilhos localizados e blocos organizados; detalhes Aero/Y2K opcionais. A navegação e os controles mantêm foco visível, rótulos e suporte a movimento reduzido.
- **Página de login:** campos de autenticação e botão de envio; altura medida de 52 px. A tela pública não dá acesso às rotas protegidas.
- **Página inicial:** blocos “Hoje”, próximos sete dias, acessos por perfil, oportunidades e atenção; os estados das fontes indicam indisponibilidade em vez de sugerir ausência de pendências.
- **Personalização:** abas “Aparência”, “Seu perfil”, “Início e atalhos”, “Rotina e foco” e “Seus dados”; inclui tema/paleta, tipografia, densidade, cenário, avatar, faixa, moldura, foto, cartões, módulos, favoritos, metas, sessões de foco e importação/exportação.
- **IFOS:** interface experimental de área de trabalho para telas a partir de 900 px; janelas, barra de tarefas, menu de aplicativos, agenda, foco e atalhos autorizados. Não é um sistema operacional e não incorpora páginas por iframe.
- **Mídia:** 100 artes da Coleção Aero; 10 folhas originais e duas cópias RGBA derivadas. As 840 capas JPG encontradas em `music_backgrounds` são outro acervo e não foram incluídas na coleção.

## Observações e limites

Não houve overflow horizontal nos viewports medidos. A interface pública redireciona para login e não havia credenciais de produção para validar o percurso autenticado no deploy. A auditoria não cobre zoom 200%, contraste automatizado, leitor de tela, dispositivos reais ou todos os estados de erro. Os recortes da coleção carregam folhas completas; miniaturas específicas ainda podem reduzir transferência e decodificação.

Consulte [ASSET_CATALOG.md](./ASSET_CATALOG.md), [CUSTOMIZATION_SYSTEM.md](./CUSTOMIZATION_SYSTEM.md) e [QA_REPORT.md](./QA_REPORT.md) para catálogo, persistência e resultados de validação.
