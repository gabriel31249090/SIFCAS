# Changelog visual — Frutiger Aero e Coleção Aero

## Consolidado nesta cópia local

- Auditoria dos viewports móveis, intermediários e desktop; medições e limites registrados em [UI_AUDIT_FRUTIGER.md](./UI_AUDIT_FRUTIGER.md).
- Catálogo local com 100 artes em seis categorias; nomes, fontes e limitações registrados em [ASSET_CATALOG.md](./ASSET_CATALOG.md).
- Cópias RGBA de molduras e adesivos geradas para eliminar o fundo opaco; as folhas originais foram preservadas. O manifesto da coleção passou a usar as cópias transparentes.
- Teste de regressão acrescentado para confirmar que molduras e adesivos são PNG RGBA.
- Persistência, validação de importação, comportamento do IFOS e limites das preferências documentados em [CUSTOMIZATION_SYSTEM.md](./CUSTOMIZATION_SYSTEM.md).
- QA e dependências ausentes registrados em [QA_REPORT.md](./QA_REPORT.md).

## Verificação

Auditorias internas passaram e os 13 testes direcionados de catálogo/preferências passaram. A suíte completa, lint, typecheck, E2E e build permanecem pendentes pela instalação incompleta de dependências. Esta cópia não foi publicada; nenhum banco ou dado institucional foi alterado.
