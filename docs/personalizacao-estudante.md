# Personalização do estudante e IFOS

Em `/personalizacao`, estudantes podem escolher tema/paleta, tipografia, densidade, papel de parede, moldura e faixa do perfil; adicionar uma foto local; organizar cartões, módulos e favoritos; colorir disciplinas; escolher a visualização de agenda; definir preferências de lembretes/resumo; e registrar metas e sessões de foco pessoais. Há presets, efeitos opcionais e importação/exportação de preferências.

Essas preferências são armazenadas no `localStorage` do navegador, em uma chave associada ao ID da conta. Não são enviadas ao Supabase nem sincronizadas entre dispositivos. A foto é convertida em uma imagem local, limitada a 512 KB. O JSON de configuração não inclui dados acadêmicos. Redefinir a configuração apaga somente a chave de preferências do SIFCAS neste navegador.

Lembretes e resumo diário são opções de planejamento; não enviam push, e-mail ou resumo automático. O temporizador e seus totais também são locais e não são registros de atividade acadêmica.

O IFOS em `/ifos` é uma área desktop experimental do SIFCAS, com atalhos para módulos autorizados e janelas de navegação. Não é um sistema operacional e não incorpora as páginas em iframes. A tela cheia é opcional e pode ser encerrada pelo botão ou pela tecla Escape. Em telas pequenas, a navegação usual permanece disponível.

Os papéis de parede remotos são opcionais e só carregam imagens da Unsplash quando escolhidos; essa escolha faz o navegador contatar `images.unsplash.com`. Os demais fundos são locais. A linguagem visual combina glassmorphism/Frutiger Aero com detalhes de pixel art.

O efeito de celebração `PixelBurst` usa uma adaptação real do efeito `pickups/collect-burst` do [pixelfx](https://github.com/patch-gg/pixelfx), com licença MIT de Patch e Hugo Duprez preservada em `lib/pixelfx/LICENSE` e procedência em `lib/pixelfx/NOTICE.md`. O efeito tem duração limitada a 1,35 segundo, não captura cliques, respeita a preferência de animação e `prefers-reduced-motion`, e cancela ao ocultar a aba. O runtime completo e a fonte proprietária da galeria não são incluídos.

Outras referências visuais: [AeroWave](https://github.com/Zakintaliban/frutiger-aero), [Frutiger Aero desktop](https://github.com/AamirrH/FrutigerAero), [Frutiger Aero OS portfolio](https://github.com/Fuheshka/portfolio), [Atlas](https://ui.codeatlas.com.br/atlas/frutiger-aero/) e os exemplos de interfaces Aero enviados pelo usuário.

Preferências e arquivos locais não alteram papéis, contas, matrículas, notas, presença ou demais dados oficiais.
