# Coleção Aero

Em **Personalização → Coleção Aero**, a conta pode escolher entre 100 artes locais: 20 cenários, 30 avatares, 20 faixas, 10 molduras, 10 botões e 10 adesivos. As escolhas são salvas por conta no navegador, junto às preferências existentes. Fotos enviadas prevalecem sobre avatares; escolher outro avatar remove a foto local.

As dez folhas PNG originais fornecidas para a coleção foram preservadas em `public/assets/aero/`. As folhas originais são RGB, sem transparência. Para que molduras e adesivos não cubram o perfil ou a área de trabalho com um retângulo branco, foram geradas cópias RGBA `aero-frames-alpha.png` e `aero-stickers-alpha.png`; o catálogo usa essas cópias somente nessas duas categorias. As folhas originais continuam disponíveis e inalteradas.

O navegador exibe cada recorte por SVG `viewBox` ou coordenadas de fundo CSS. Os recortes e caminhos permitidos ficam em `lib/aero-assets.ts`; IDs e categorias fora do catálogo são recusados ao importar preferências. A galeria monta somente a categoria aberta. Cada recorte ainda referencia a folha completa; miniaturas independentes e otimização adicional de transferência permanecem como oportunidade de desempenho.

| Folha original preservada | Dimensões | Tamanho |
| --- | ---: | ---: |
| `aero-landscapes.png` | 1983 × 793 | 2.831.175 bytes |
| `y2k-wallpapers.png` | 1983 × 793 | 2.901.222 bytes |
| `glass-avatars.png` | 1774 × 887 | 2.036.009 bytes |
| `translucent-avatars.png` | 1774 × 887 | 1.998.468 bytes |
| `neon-avatars.png` | 1983 × 793 | 2.320.914 bytes |
| `aero-banners.png` | 2172 × 724 | 2.271.511 bytes |
| `y2k-banners.png` | 2172 × 724 | 1.966.451 bytes |
| `aero-frames.png` | 1983 × 793 | 2.127.701 bytes |
| `glossy-buttons.png` | 1983 × 793 | 1.497.573 bytes |
| `aero-stickers.png` | 1983 × 793 | 1.945.781 bytes |

As cópias transparentes medem 1983 × 793: `aero-frames-alpha.png` (2.921.204 bytes) e `aero-stickers-alpha.png` (2.834.027 bytes). Elas têm canal RGBA e pixels transparentes; a folha de molduras também mantém o centro vazado dos dez recortes.

O IFOS usa o cenário e o adesivo escolhidos; o perfil usa avatar, faixa e moldura. Os botões principais recebem a textura opcional. As imagens de fundo mantêm a proporção e os painéis sobrepostos preservam a legibilidade. Nenhuma preferência altera permissões ou registros acadêmicos. O catálogo nominal completo está em [ASSET_CATALOG.md](./ASSET_CATALOG.md).

## Validação

- Auditorias internas de interação, rotas e qualidade passaram: 95 arquivos TSX/JSX; 69 rotas de app e 169 fontes.
- 13 testes direcionados de catálogo e preferências passaram, incluindo a verificação de formato RGBA das folhas de moldura e adesivos.
- A suíte completa não iniciou: falta `@electric-sql/pglite` em `node_modules`.
- ESLint e TypeScript não puderam ser executados: os executáveis `eslint` e `tsc` não estão instalados na cópia local.
- Playwright/E2E e build permanecem pendentes até restaurar as dependências. Nenhum deploy foi feito.

O trabalho foi preparado na cópia recuperada do repositório, `SIFCAS-assets`, pois a pasta local anterior estava incompleta. A coleção e o restante das alterações locais precisam passar por build e E2E antes de qualquer publicação.
