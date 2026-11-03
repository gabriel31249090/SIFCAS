# SIFCAS: continuidade funcional e visual Frutiger

Pedido autorizado: buscar uma forma viável de concluir o que funciona sem acesso institucional e renovar homepage e componentes do site com referências Frutiger Aero/Metro. Preservar trabalho local, não aplicar migrations nem publicar produção.

## Direção

- Azul-céu, branco, verde e natureza; vidro, brilho moderado e ícones coloridos com organização Metro.
- Componentes de ícone, cabeçalho, botões, formulários e rodapé consistentes. Sem animação pesada ou dependências gráficas desnecessárias; respeitar movimento reduzido.
- Homepage centrada em Hoje, pendências, turmas e ações, sem transformar um roadmap em conteúdo principal.

## Entregas

1. Inspecionar estado atual, fontes/referências e limites reais de acesso.
2. Tema compartilhado e ícones vetoriais reutilizáveis.
3. Agenda Hoje com fontes locais/importadas/editais, autorização e estados de indisponibilidade explícitos.
4. Percurso de testes de navegador usando sessão sintética e banco isolado, sem bypass de autenticação no aplicativo ou confusão com sincronização real.
5. Prévia local da interface se necessário, check/build/E2E proporcionais e documentação do que ainda exige TI.

## Divisão de arquivos

- Agente visual: CSS novo de tema, componente de ícone e componentes compartilhados; homepage fica com root.
- Agente de homologação: infraestrutura de testes isolados e E2E privados; nenhum banco remoto ou mudança em auth da aplicação sem coordenação.
- Root: homepage, agregador Hoje, fontes, revisão visual e integração/validação.

## Critérios

Sem sucesso falso, nomes pessoais ou dados institucionais reais em fixtures. Rotas privadas continuam exigindo sessão verificada. Dados importados continuam identificados como cópias; falha de fonte não se transforma em ausência de pendências. Preservar teclado, foco, contraste e layout móvel.
