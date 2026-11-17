# Sistema de personalização

## Superfícies

O estúdio está em `/personalizacao` e organiza as opções em cinco áreas: Aparência, Seu perfil, Início e atalhos, Rotina e foco e Seus dados. A página inicial e o IFOS aplicam as preferências visuais quando disponíveis. O IFOS é uma interface experimental para telas a partir de 900 px, não um sistema operacional.

As opções visuais incluem temas e paletas, tipografia, densidade, papéis de parede locais ou remotos, arte de avatar, foto local, faixa e moldura de perfil, adesivo da área de trabalho e texturas para botões. A Coleção Aero disponibiliza 100 artes locais; ver [ASSET_CATALOG.md](./ASSET_CATALOG.md).

## Persistência e fronteiras de segurança

- As preferências ficam no `localStorage`, em uma chave associada ao ID da conta.
- Abas abertas da mesma conta recebem atualizações locais. Preferências não são enviadas ao Supabase nem sincronizadas entre dispositivos.
- Se o armazenamento local for recusado, a tela informa que a mudança vale somente naquela aba.
- Importações JSON são validadas: campos desconhecidos, duplicatas, URLs/caminhos não permitidos e valores fora da categoria não são preservados. Exportações não incluem dados acadêmicos.
- Restaurar o padrão pede confirmação e altera apenas preferências locais.
- Fotos aceitas são JPG, PNG ou WebP, decodificadas e limitadas a 512 KB. Fotos enviadas prevalecem sobre avatares; selecionar outro avatar remove a foto local.
- Preferências não alteram permissões, papéis, contas, matrículas, notas, presença ou registros acadêmicos.

## Foco e IFOS

Metas, lembretes e resumo diário são opções locais de planejamento; não enviam push, e-mail ou resumos automáticos. O cronômetro compensa atrasos de abas ocultas pelo horário de término e credita a conclusão uma única vez, no dia de Cuiabá. O tempo e totais não são registros acadêmicos; fechar ou navegar para fora da janela encerra a sessão em andamento, enquanto minimizar o IFOS a mantém.

O IFOS usa os cenários e adesivos selecionados, e preserva as verificações de sessão e permissão do servidor para os módulos. A tela cheia é opcional; em telas pequenas, a página oferece retorno à navegação habitual. Nenhum módulo é incorporado por iframe.

## Referência de implementação

- Preferências e integrações: `lib/student-experience.ts`, `components/StudentExperienceProvider.tsx` e `components/StudentExperienceSettings.tsx`.
- Catálogo e arte: `lib/aero-assets.ts` e `components/AeroArtwork.tsx`.
- A documentação funcional anterior está em [personalizacao-estudante.md](./personalizacao-estudante.md).
