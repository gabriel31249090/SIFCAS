import assert from "node:assert/strict";
import test from "node:test";
import { prepareServiceRequestDescription } from "../lib/service-request.ts";

test("infrastructure requests require and preserve a specific campus location", () => {
  assert.deepEqual(prepareServiceRequestDescription("infrastructure", "", "Bebedouro com defeito"), {
    ok: false,
    reason: "location_required",
  });
  assert.deepEqual(prepareServiceRequestDescription("infrastructure", "Campus Cáceres, bloco A", "Bebedouro com defeito"), {
    ok: true,
    description: "Local informado: Campus Cáceres, bloco A\n\nBebedouro com defeito",
  });
});

test("location and combined description stay within storage limits", () => {
  assert.equal(prepareServiceRequestDescription("other", "x".repeat(241), "Pedido").reason, "description_too_long");
  assert.equal(prepareServiceRequestDescription("other", "Campus", "x".repeat(7990)).reason, "description_too_long");
  assert.deepEqual(prepareServiceRequestDescription("other", "", "Pedido"), { ok: true, description: "Pedido" });
});
