import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createAgentBridge } from "../scripts/agent-bridge-mcp.mjs";

test("agents can exchange and acknowledge messages through the shared database", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "sifcas-agent-bridge-"));
  const databasePath = path.join(directory, "messages.sqlite3");
  const copilot = createAgentBridge("copilot", databasePath);
  const antigravity = createAgentBridge("antigravity", databasePath);

  try {
    const sent = copilot.callTool("send_message", {
      recipient: "antigravity",
      message: "Pode revisar esta alteração?",
    });
    assert.equal(sent.sender, "copilot");

    const inbox = antigravity.callTool("read_messages");
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0].id, sent.id);
    assert.equal(inbox[0].message, "Pode revisar esta alteração?");

    antigravity.callTool("send_message", {
      recipient: "copilot",
      message: "Claro, vou revisar.",
      reply_to: sent.id,
    });
    assert.deepEqual(antigravity.callTool("read_messages"), []);

    const reply = copilot.callTool("read_messages");
    assert.equal(reply.length, 1);
    assert.equal(reply[0].reply_to, sent.id);
  } finally {
    copilot.close();
    antigravity.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("agents cannot message themselves or acknowledge another agent's inbox", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "sifcas-agent-bridge-"));
  const databasePath = path.join(directory, "messages.sqlite3");
  const copilot = createAgentBridge("copilot", databasePath);
  const antigravity = createAgentBridge("antigravity", databasePath);

  try {
    assert.throws(
      () =>
        copilot.callTool("send_message", {
          recipient: "copilot",
          message: "Self-message",
        }),
      /other configured agent/,
    );

    const incoming = copilot.callTool("send_message", {
      recipient: "antigravity",
      message: "Mensagem para o Antigravity",
    });
    assert.throws(
      () =>
        copilot.callTool("acknowledge_message", {
          message_id: incoming.id,
        }),
      /addressed to this agent/,
    );
  } finally {
    copilot.close();
    antigravity.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
