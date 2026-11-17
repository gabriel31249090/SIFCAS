---
tipo: mapa-inicial
atualizado_em: 2026-11-12
---

# SIFCAS — segundo cérebro

Memória versionada para pessoas e agentes. **Código e evidência datada são a fonte de verdade.** Abra esta pasta como vault no Obsidian ou leia os Markdown diretamente; a recuperação funciona também no terminal, sem API.

Leia nesta ordem:

1. [[01-Estado-atual]] — o que existe, o que está em andamento e o que ainda não foi comprovado.
2. [[02-Como-retomar]] — encontrar contexto, conferir hashes e registrar continuidade.
3. O mapa do domínio abaixo; depois [[20-Catalogo/Indice]] para chegar a qualquer arquivo.
4. [[30-Historico/Indice]] para saber quando e como uma conclusão foi obtida.

| Área | Mapa |
| --- | --- |
| Estrutura, rotas e navegação | [[10-Mapas/Arquitetura-e-navegacao]] |
| Sessão, perfis, permissões e banco | [[10-Mapas/Auth-perfis-e-RLS]] |
| Turmas, diário, boletim e importação | [[10-Mapas/Academico-e-importacoes]] |
| Publicações, oportunidades e processos | [[10-Mapas/Institucional-e-servicos]] |
| Temas, assets Aero e desktop IFOS | [[10-Mapas/Personalizacao-Aero-e-IFOS]] |
| Assistente LUMA Local | [[10-Mapas/LUMA]] |
| Supabase, IFMT, notícias e calendários | [[10-Mapas/Integracoes-e-limites]] |
| Testes, deploy, backup e monitoramento | [[10-Mapas/Testes-deploy-e-operacoes]] |

[[40-Decisoes-e-pendencias/Decisoes]] · [[40-Decisoes-e-pendencias/Pendencias]] · [[20-Catalogo/Rotas]] · [[20-Catalogo/Banco-e-RPCs]]

Na raiz do repositório:

```sh
node scripts/second-brain-check.mjs
node scripts/second-brain-recall.mjs "RLS professor" --limit 6
```

Não guardar credenciais, `.env`, respostas privadas de APIs nem dados de alunos neste vault. O catálogo contém caminhos, hashes e relações estáticas, sem copiar corpos de documentos ou registros acadêmicos.
