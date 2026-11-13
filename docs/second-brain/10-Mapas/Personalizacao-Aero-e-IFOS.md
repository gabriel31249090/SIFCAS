---
tipo: mapa-dominio
verificado_em: 2026-11-12
metodo: leitura-estatica-local
---

# Personalização, Aero e IFOS

Preferências pessoais são dados locais do navegador, separados dos dados acadêmicos/institucionais. [student-experience](../../../lib/student-experience.ts) define o contrato e validação; [StudentExperienceProvider](../../../components/StudentExperienceProvider.tsx) aplica e persiste; [StudentExperienceSettings](../../../components/StudentExperienceSettings.tsx) fornece a interface em `/personalizacao`.

O contrato inclui tema claro/escuro/sistema, paleta, texto/densidade, papel de parede, avatar/foto/banner/moldura, pele de botão/sticker, ícones, widgets, ordem/ocultação da navegação, favoritos, cores de disciplina, calendário, lembretes/resumo, saudação/nome, meta/foco, som e animação. A chave atual observada é `sifcas:student-experience:v2`; existe migração da `v1`. Importação JSON passa por parser restritivo, limites e listas permitidas. Foto fica como data URL local limitada; não é upload para perfil acadêmico.

Assets: [aero-assets](../../../lib/aero-assets.ts), [AeroAssetCollection](../../../components/AeroAssetCollection.tsx), [AeroArtwork](../../../components/AeroArtwork.tsx), [AeroIcon](../../../components/AeroIcon.tsx), imagens em `public/assets/aero/` e estilos `app/aero*.css`. O inventário registra hashes dos binários e símbolos do catálogo. [colecao-aero](../../../docs/colecao-aero.md) descreve a coleção; o catálogo do código determina IDs e coordenadas válidos.

IFOS: [página servidor](../../../app/ifos/page.tsx) exige conta ativa, obtém módulos por papel, filtra itens Hoje pelos caminhos acessíveis e limita o resumo. [IFOSDesktop](../../../app/ifos/IFOSDesktop.tsx) implementa a experiência de desktop; [ifos-desktop.css](../../../app/ifos-desktop.css) define aparência. É uma superfície alternativa sobre capacidades do SIFCAS. Reutilizar os mesmos contratos de permissão e dados, sem criar poderes paralelos.

**Entrega de 12/11/2026:** [ifos-workspace](../../../lib/ifos-workspace.ts) valida e serializa apenas o layout, em chave por conta. Janelas lembram ordem/geometria/estados e podem ser redimensionadas por alça ou teclado; visitas móveis não sobrescrevem o layout desktop e cronômetros não são retomados. O servidor continua determinando os módulos permitidos.

[optimize-aero-assets](../../../scripts/optimize-aero-assets.mjs) gera os 100 recortes WebP e 100 miniaturas a partir das folhas preservadas. `AeroArtwork` usa os recortes, com lazy loading nas miniaturas; o helper de avatar e botões também usa as imagens individuais. `assets:check` verifica conteúdo, dimensões e alpha. Não aumentar resolução artificialmente nem trocar IDs, para preservar escolhas salvas.

A revisão de legibilidade/teclado/zoom é delimitada em [legibilidade-aero-2026-11-12](../../../docs/legibilidade-aero-2026-11-12.md). Ver [[30-Historico/2026-11-12-Entrega-IFOS-Aero-e-memoria]] para testes e limites; a validação local não confirma acesso ou dados de produção.

Acessibilidade envolve teclado, foco, semântica, contraste, texto, movimento reduzido, navegação móvel e controles do desktop. `animations: false` e preferência do sistema são caminhos diferentes a conferir. Verificar também formulários, abas/diálogos, atalhos e janelas na implementação final; não alegar conformidade só porque há uma preferência visual.

Em 13/11, a correção de [perfil](../../../app/perfil/profile.css) passou a delimitar as superfícies claras/escuras, centralizar o retrato e substituir a faixa antiga quando há arte. [Registro da correção](../../../docs/perfil-2026-11-13.md) e [cenários do navegador](../../../tests/academic-browser/profile.spec.ts) descrevem o escopo; a fixture não confirma gravação no banco remoto.

Outras fontes: [personalizacao-estudante](../../../docs/personalizacao-estudante.md), [CUSTOMIZATION_SYSTEM](../../../docs/CUSTOMIZATION_SYSTEM.md), [FocusTimer](../../../components/FocusTimer.tsx), [PixelBurst](../../../components/PixelBurst.tsx). PixelFX tem aviso/licença próprios em `lib/pixelfx/`.

[[10-Mapas/Arquitetura-e-navegacao]] · [[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[20-Catalogo/Indice]]
