# Frutiger Aero e percurso acadêmico local

Continuação da entrega em 03/11/2026. O acesso ao projeto Supabase correto voltou a ser consultado e foi negado nas duas conexões disponíveis. Nenhum banco remoto, migration, conta institucional ou deploy foi alterado.

## O que mudou no produto

A homepage agora organiza “Hoje”, próximos sete dias, acessos por perfil, oportunidades, atenção e estado de cada fonte. O roadmap continua em `/portal-evolucao`, acessível por um link discreto. As alterações locais anteriores nesse módulo e em `workspace.css` foram preservadas.

O agregador reúne planejamento/avaliações/horários locais, cópias de diários, calendário privado e metadados de editais. IDs são separados por fonte; nomes semelhantes não provocam junção automática. Datas UTC do calendário são convertidas para America/Cuiaba antes de agrupar; data sem hora continua sem hora; horários sem fuso confirmado são identificados como horários na origem. Um evento genérico não vira automaticamente uma tarefa pendente. Fonte indisponível ou não configurada não significa ausência de obrigações. O resumo de atenção também mostra “—” quando a consulta falha, em vez de inventar zero.

`/minhas-turmas` lista somente turmas autorizadas, permite filtrar período/termo, separa contagens locais e cópias, distingue nota zero/ausente/dispensada/não informada e apresenta conflitos de prévias privadas válidas. Esses estados não comprovam fila de correção ou fechamento oficial na origem. O aluno não pode abrir a rota docente.

## Direção visual e referências

O tema usa azul-céu, verde, vidro claro, brilho nos controles e organização em blocos simples. A família `AeroIcon` reutiliza os vetores Lucide existentes em tons sky/leaf/amber/coral/violet. Navegação, cabeçalhos, estatísticas, botões, formulários, login e rodapé compartilham o mesmo tema. O CSS global fica em `app/aero.css`; a homepage usa CSS Module próprio. Não houve inclusão de GSAP, Three.js ou outro pacote gráfico. Movimento reduzido desativa transições; foco e rótulos permanecem visíveis.

Referências consultadas: [CARI — Frutiger Aero](https://cari.institute/aesthetics/frutiger-aero) e [recursos visuais da comunidade](https://frutigeraero.org/resources). Servem como referências de direção, não como banco de imagens redistribuídas. A paisagem `public/brand/aero-landscape.svg` é uma ilustração vetorial criada para o SIFCAS, sem representar uma fotografia do campus. Os ícones continuam sujeitos à licença da biblioteca Lucide já usada no projeto.

Capturas do navegador com **pessoas e registros sintéticos**:

- [Homepage desktop](previews/home-aero-desktop.png)
- [Homepage celular](previews/home-aero-mobile.png)
- [Prévia de importação](previews/import-aero-preview.png)
- [Minhas turmas](previews/teacher-aero-desktop.png)

## Caminho viável sem credenciais institucionais

```powershell
npm.cmd run dev:academic
```

O comando cria um PostgreSQL em memória, carrega as fixtures e contratos isolados e sobe o Next em `http://127.0.0.1:3100`. Abra **http://127.0.0.1:54331/** para escolher professor, estudante, gestor ou outro docente sintético. A tela inicial informa que todos os dados são fictícios. O serviço fica vinculado exclusivamente ao loopback; não disponibilizar esse cenário na internet.

O serviço de testes gera uma chave ES256 efêmera, assina sessões sintéticas e expõe JWKS. O cliente Supabase normal verifica essas sessões; o código de autenticação do aplicativo não recebeu bypass, parâmetro de papel ou rota de login especial. O ponto de seleção de ator pertence exclusivamente ao serviço de fixtures em `tests/fixtures`, não ao aplicativo. A chave publicável de teste é aleatória e vale apenas para esse processo. Não há credenciais institucionais inventadas, persistidas ou usadas no remoto.

O adaptador implementa **somente o subconjunto de HTTP necessário ao teste**; não é uma implementação completa de Supabase/PostgREST. SELECTs usam parâmetros e colunas/tabelas permitidas. RPCs permitidas executam as funções SQL reais da extensão isolada sob `authenticated`/`anon`, com sujeito derivado da assinatura. Cada transação tem sessão isolada; as consultas são serializadas por se tratar de uma instância PGlite. Escritas diretas são recusadas pelo adaptador e pelas permissões do contrato.

O cenário usa `.next-academic`, separado do build comum, com cache de disco do dev desativado para evitar consumo excessivo de espaço. O processo encerra os filhos e descarta o banco ao terminar. O `--serve` é a opção usada por `dev:academic`; Ctrl+C encerra o cenário. Nenhum `.env.local` é criado ou sobrescrito e nenhum dado persiste após encerrar.

## Teste de navegador privado

```powershell
npm.cmd run test:e2e:academic
```

Exige Chromium instalado para o Playwright. Opcionalmente, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` seleciona um executável local. Os testes fazem:

1. Professor envia CSV, revisa, confirma, abre turma e reenvia sem duplicação; outro docente não abre o recibo; aluno lê somente sua matrícula.
2. Gestor cria conflito, confirmação fica bloqueada e cancelamento descarta a prévia.
3. Seleção explícita de sessão sintética pelo serviço local; painel docente respeita o escopo; aluno é negado; adulterar o `max` de uma nota no DOM não permite exceder a escala persistida no servidor.
4. Importação `.ics` privada permanece com o dono; Hoje mantém indicação de fontes não conectadas; capturas desktop/celular sem rolagem horizontal.

Os cenários acima estão agrupados em três testes E2E, além dos testes SQL/unitários existentes. A suíte unitária usa concorrência 1 para reduzir pressão de memória no ambiente Windows. As primeiras execuções revelaram o formato DATE do adaptador, um seletor de teste incorreto e falta de espaço para o cache; esses problemas foram corrigidos antes dos resultados finais.

## Limite que permanece

Esta alternativa permite demonstrar e verificar o percurso completo **com fixtures e sessões assinadas locais**. Não homologa o schema, grants/RLS e login de um Supabase hospedado, concorrência entre múltiplas conexões PostgreSQL, exportação oficial do SUAP, API Moodle ou regras institucionais de retenção. Essas pendências continuam em [integrações IFMT](integracoes-ifmt.md). A produção mantém as flags desativadas por padrão; SUAP/AVA direto continuam aguardando autorização. Nenhuma sincronização privada real foi anunciada.
