# Coleção Aero

Em **Personalização → Coleção Aero**, a conta pode escolher entre 100 artes locais: 20 cenários, 30 avatares, 20 faixas, 10 molduras, 10 botões e 10 adesivos. As escolhas são salvas por conta no navegador, junto às preferências existentes. Fotos enviadas prevalecem sobre avatares; escolher outro avatar remove a foto local.

As dez folhas PNG fornecidas pelo usuário em 06/11/2026 foram copiadas sem alterações para `public/assets/aero/`. O navegador exibe cada região por SVG `viewBox` ou coordenadas de fundo CSS. Os recortes e caminhos permitidos ficam em `lib/aero-assets.ts`; URLs e IDs fora do catálogo são recusados ao importar preferências. A galeria monta somente a categoria aberta.

| Arquivo local | Folha original |
| --- | --- |
| aero-landscapes.png | Dez paisagens Frutiger Aero em grade-3.png |
| y2k-wallpapers.png | Dez papéis de parede Y2K vibrantes-2.png |
| glass-avatars.png | Dez avatares de vidro em mosaico-4.png |
| translucent-avatars.png | Grade Y2K com 10 avatares translúcidos-6.png |
| neon-avatars.png | Dez avatares Y2K neon em grade-7.png |
| aero-banners.png | Painel de dez banners Frutiger Aero-1.png |
| y2k-banners.png | Coleção de dez banners retrô Y2K-5.png |
| aero-frames.png | Painel Frutiger Aero de 10 molduras Y2K-8.png |
| glossy-buttons.png | Grade de botões brilhantes Y2K-9.png |
| aero-stickers.png | Grade decorativa Frutiger Aero Y2K-10.png |

O IFOS usa o cenário e o adesivo escolhidos; o perfil usa avatar, faixa e moldura. Os botões principais recebem a textura opcional. As imagens de fundo mantêm a proporção e os painéis sobrepostos preservam a legibilidade. Nenhuma preferência altera permissões ou registros acadêmicos.

## Validação em 06/11/2026

- Três auditorias internas aprovadas: interface, rotas e qualidade.
- 12 testes de catálogo/preferências aprovados, incluindo caminhos, limites dos recortes, separação de categorias, importação e compatibilidade com preferências antigas.
- Três cenários Playwright adicionados em `tests/academic-browser/aero-assets.spec.ts`; execução de navegador ainda pendente.
- Build, ESLint e TypeScript ainda precisam ser executados em uma instalação completa. A instalação local das dependências terminou com arquivos ausentes após erros de extração/download; não foi considerada válida.

A versão foi preparada em uma cópia recuperada do repositório, `SIFCAS-assets`, pois a pasta local anterior estava incompleta. O build de prévia deve ser aprovado antes da atualização da produção.
