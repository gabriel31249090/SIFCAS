export const dynamic = "force-static";

const template = [
  "nome;email;identificador;tipo_vinculo;campus;curso;turma;situacao",
  "Maria da Silva;maria@estudante.ifmt.edu.br;202600001;estudante;Campus Cáceres;INFO;2A;ativo",
  "João Pereira;joao@ifmt.edu.br;1234567;professor;Campus Cáceres;;;ativo",
  "Ana Souza;ana@ifmt.edu.br;7654321;servidor;Campus Cáceres;;;ativo",
].join("\n");

export async function GET() {
  return new Response("\uFEFF" + template + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modelo-vinculos-institucionais.csv"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
