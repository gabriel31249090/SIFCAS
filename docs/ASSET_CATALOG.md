# Catálogo de mídias e artes

## Coleção Aero

O catálogo contém 100 seleções locais, sem URLs externas:

| Categoria | Quantidade | Nomes |
| --- | ---: | --- |
| Cenários / papéis de parede | 20 | Cidade nas nuvens; Aquário de vidro; Paraíso tropical; Céu cromado; Cidade jardim; Lago de lírios; Pequeno planeta; Mar de bolhas; Cascata cristalina; Arco-íris de vidro; Laranja elétrico; Estrelas cromadas; Lima urbana; Pink e ciano; Energia azul; Órbita violeta; Ondas turquesa; Estrela rubi; Céu pop; Ritmo laranja |
| Avatares | 30 | Céu azul; Água viva; Folhas verdes; Pôr do sol; Espaço violeta; Flor de cerejeira; Prata urbana; Estrelas lima; Sonho lavanda; Golfinho azul; Mar transparente; Verde orvalho; Estrela dourada; Sol de vidro; Órbita lilás; Corações rosa; Água turquesa; Blocos azuis; Globo de prata; Rubi brilhante; Pop laranja; Prata e azul; Pink orbital; Lima neon; Violeta pop; Rubi pop; Ciano pop; Azul elétrico; Prata e lima; Laranja e azul |
| Faixas de perfil | 20 | Lago azul; Janela no jardim; Nosso planeta; Cidade na água; Cristais do mar; Árvore ao sol; Ondas e bolhas; Cidade serena; Janelas no campo; Horizonte do planeta; Som laranja; Estrelas ciano; Som lima; Fones pink; Cromo azul; Batida violeta; Estrelas douradas; Cidade pink; Rede turquesa; Vinil preto |
| Molduras | 10 | Bolhas tropicais; Estrelas de prata; Vidro lima; Pop laranja; Corações pink; Flores violetas; Cromo holográfico; Mundo digital; Água cristalina; Jardim de lírios |
| Botões | 10 | Aqua brilhante; Cromo azul; Lima brilhante; Holográfico; Estrela laranja; Pink brilhante; Violeta brilhante; Turquesa brilhante; Folha verde; Órbita azul |
| Adesivos | 10 | Bolhas de céu; Nota musical; Estrela de cristal; Planeta verde; Alto-falante; Gota de água; Borboleta holográfica; Janela de vidro; Folha com orvalho; Estrela orbital |

## Folhas e recortes

Cada escolha é um recorte de uma folha de sprites, não um arquivo individual. O caminho, a categoria, o identificador, as dimensões da folha e o retângulo do recorte estão declarados em [`lib/aero-assets.ts`](../lib/aero-assets.ts). As folhas originais têm as dimensões e tamanhos registrados em [`colecao-aero.md`](./colecao-aero.md). Os PNGs de molduras e adesivos sem fundo são cópias derivadas RGBA; as folhas originais RGB foram preservadas.

Os IDs usam os prefixos `asset-landscape-*`, `asset-neon-*`, `asset-glass-*`, `asset-translucent-*`, `asset-pop-*`, `asset-banner-*`, `asset-retro-*`, `asset-frame-*`, `asset-button-*` e `asset-sticker-*`. A importação de preferências aceita apenas IDs listados na categoria correspondente.

## Outros recursos de interface

- A paisagem vetorial da marca fica em `public/brand/aero-landscape.svg`.
- A biblioteca de ícones existente é Lucide; os ícones Aero reutilizam seus vetores.
- O efeito PixelBurst usa a adaptação documentada em `lib/pixelfx/NOTICE.md`, com licença em `lib/pixelfx/LICENSE`.
- A pasta `music_backgrounds` contém 840 imagens JPG de capas musicais. Não foram incorporadas à galeria Aero.
- Os papéis de parede externos da Unsplash são opcionais; a escolha remota faz o navegador contatar `images.unsplash.com`. As artes da coleção são locais.

## Observação de desempenho

A galeria só monta a categoria aberta, mas cada recorte ainda referencia a folha completa. Não existem miniaturas independentes por opção; medir a transferência no navegador e gerar prévias menores é uma melhoria futura possível.
