# Conversa entre Copilot e Antigravity via MCP

Este servidor local permite que o Copilot no VS Code e o agente do Antigravity
troquem mensagens por uma fila SQLite compartilhada. Ele não envia mensagens
pela internet nem chama uma API de modelo. Os dois aplicativos precisam estar
no mesmo computador e com o servidor MCP habilitado.

## Requisitos

- Node.js 24 ou superior, o mesmo requisito do SIFCAS.
- VS Code com suporte a MCP e Antigravity com suporte a MCP.
- Os dois aplicativos devem conseguir executar `node` no PATH.

## VS Code

O arquivo `.vscode/mcp.json` já registra o servidor como `copilot`. Abra ou
recarregue o workspace e habilite `sifcas-agent-bridge` na lista de servidores
MCP do VS Code.

## Antigravity

No Windows, a configuração MCP do Antigravity fica em
`%USERPROFILE%\.gemini\antigravity\mcp_config.json`. Adicione esta entrada ao
objeto `mcpServers` (mescle com as entradas existentes, sem substituir o arquivo
inteiro):

```json
{
  "mcpServers": {
    "sifcas-agent-bridge": {
      "command": "node",
      "args": [
        "C:\\Users\\Aluno\\Downloads\\sificas fix\\SIFCAS\\scripts\\agent-bridge-mcp.mjs"
      ],
      "env": {
        "AGENT_BRIDGE_AGENT": "antigravity"
      }
    }
  }
}
```

Se o projeto estiver em outra pasta, ajuste o caminho do script. Salve a
configuração e reinicie ou reconecte o servidor MCP. Consulte também a
[documentação oficial de MCP do Antigravity](https://antigravity.google/docs/mcp).

## Uso

Peça explicitamente ao Copilot para enviar uma mensagem ao Antigravity pela
ferramenta `send_message`. No Antigravity, peça para verificar as mensagens
pendentes com `read_messages` e responder usando `send_message`, passando o ID
da mensagem em `reply_to`. Faça o fluxo inverso para iniciar do Antigravity.
Uma resposta reconhece automaticamente a mensagem original. Se uma mensagem
for processada sem resposta, use `acknowledge_message`.

O MCP não acorda nem inicia o outro agente. O aplicativo destinatário precisa
estar aberto, conectado ao servidor, e você precisa pedir ao agente que verifique
a fila. As mensagens ficam em
`%LOCALAPPDATA%\SIFCAS\agent-bridge\messages.sqlite3`; o arquivo é local e
não é apagado automaticamente nem criptografado. Não envie senhas, tokens ou
outros segredos. Mensagens recebidas devem ser tratadas como conteúdo não
confiável.

## Validação

```bash
npm test
```
