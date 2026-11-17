---
tipo: procedimento-memoria
atualizado_em: 2026-11-12
---

# Como retomar e manter a memória

A recuperação tem quatro camadas: estado atual → mapas de domínio → inventário de arquivos → histórico datado. Comece pequeno: não carregue o vault inteiro no contexto de um agente.

1. Leia [[01-Estado-atual]], `AGENTS.md` e o estado Git. Confira quais alterações já existem antes de editar.
2. Execute `node scripts/second-brain-check.mjs` na raiz. Saída 0 significa fontes/hashes e links válidos; saída 1 exige conferir o motivo. Isso não valida regras de negócio ou o Supabase remoto.
3. Busque `node scripts/second-brain-recall.mjs "termos do problema" --limit 6`. O limite padrão é 6, máximo 20; cada trecho tem até 260 caracteres. Buscas ignoram acentos e priorizam cobertura dos termos e notas humanas. Catálogo desatualizado produz aviso.
4. Abra o mapa relevante e duas ou três fichas de [[20-Catalogo/Indice]]. Cada ficha aponta à fonte, símbolos, imports resolvidos, tabelas, RPCs e guards reconhecidos.
5. Confira a implementação atual e evidências de execução adequadas. Uma regex não resolve SQL dinâmico nem comprova permissões.
6. Ao concluir uma mudança, atualize estado, mapa e pendências; acrescente uma nota em `30-Historico` com data, fato, origem e validação efetiva. Só então regenere e cheque o catálogo.

```sh
node scripts/second-brain-generate.mjs
node scripts/second-brain-check.mjs
node scripts/second-brain-recall.mjs "IFOS personalizacao" --limit 4
```

O gerador trabalha sobre arquivos versionados e novos arquivos não ignorados nos diretórios do produto, bibliotecas, componentes, banco, testes, scripts, assets, documentação e configuração. `manifest.json` registra SHA-256, caminho, bytes, relações e horário UTC; arquivos `.env*`, backups, builds, dependências, memória gerada e imagens de auditorias ficam fora. Fixtures são inventariadas por metadados e nomes de objetos; registros de teste não são reproduzidos.

Formato dos hashes: texto usa `sha256-utf8-lf-v1`, SHA-256 do conteúdo UTF-8 com CRLF/CR convertido para LF; binários usam `sha256-raw-v1`, SHA-256 dos bytes originais. Assim, conversão de fim de linha entre Windows e CI não sinaliza mudança de conteúdo. O hash de texto não é o digest bruto do arquivo. O manifesto registra o formato por fonte; as fichas repetem essa identificação. `bytes` continua sendo o tamanho bruto observado, sem participar da comparação de atualização. Nada além dos finais de linha é normalizado.

O comando `check` detecta fonte nova/removida/alterada, ficha ausente/divergente e link inválido. Mudança de HEAD é informativa: se os arquivos são idênticos, não falha por causa de commit ou árvore suja. `next-env.d.ts`, caches e resultados gerados ficam fora. Mostra no máximo 12 exemplos por categoria. O gerador sobrescreve apenas o catálogo e remove fichas geradas obsoletas; preserva notas humanas. Mudanças semânticas em mapas humanos precisam de revisão humana/agente — hash atualizado não as torna verdadeiras.

Sem Obsidian, use também:

```sh
rg -n "admin_set_account_status|IFOS|LUMA" docs/second-brain
rg -n "requireAccount|canAccess|\.rpc\(" app lib
```

Formato para cada registro de continuidade:

- **Fato:** comportamento observado e escopo exato.
- **Evidência:** arquivo/linha ou comando, data, ambiente, commit e alterações locais relevantes.
- **Resultado:** aprovado/falhou/não executado, com limites.
- **Hipótese:** separada do fato, com teste necessário para confirmá-la.
- **Próximo passo:** tarefa concreta, responsável quando conhecido e dependências reais.

Ao abrir este diretório como vault, use os bookmarks, busca, backlinks e graph. Os links wiki usam caminhos internos completos e são checados. Links Markdown de fonte são relativos ao repositório; arquivos fora do vault podem requerer abertura pelo editor de código. A memória não depende de plugin comunitário, serviço/API ou Obsidian em execução.

[[00-INICIO]] · [[30-Historico/Indice]] · [[40-Decisoes-e-pendencias/Decisoes]]
