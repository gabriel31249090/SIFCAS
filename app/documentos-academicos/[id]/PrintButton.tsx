"use client";

export default function PrintButton() {
  return <button className="button primary" type="button" onClick={() => window.print()}>
    Imprimir / salvar PDF
  </button>;
}
