export type InstitutionalImportRow = {
  external_id: string;
  full_name: string;
  institutional_email: string;
  proposed_role: "student" | "teacher" | "staff" | "manager" | "admin" | "";
  campus: string;
  course_code: string;
  class_code: string;
  situation: "active" | "inactive" | "";
  source_row: number;
};

const headerAliases: Record<string, string[]> = {
  external_id: ["identificador","id_institucional","matricula","matrícula","siape","registro"],
  full_name: ["nome","nome_completo","full_name"],
  institutional_email: ["email","e-mail","email_institucional","institutional_email"],
  proposed_role: ["tipo_vinculo","tipo_de_vinculo","vinculo","vínculo","papel","perfil","tipo"],
  campus: ["campus","unidade"],
  course_code: ["curso","codigo_curso","código_curso","course_code"],
  class_code: ["turma","codigo_turma","código_turma","class_code"],
  situation: ["situacao","situação","status","status_vinculo"],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function detectDelimiter(header: string) {
  const semicolons = (header.match(/;/g) ?? []).length;
  const commas = (header.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

function mapRole(raw: string): InstitutionalImportRow["proposed_role"] {
  const value = normalize(raw).replace(/_/g, " ");
  if (["aluno","estudante","discente","student"].includes(value)) return "student";
  if (["professor","professora","docente","teacher"].includes(value)) return "teacher";
  if (["servidor","servidora","staff","tae","tecnico administrativo","tecnico-administrativo"].includes(value)) return "staff";
  if (["gestor","gestora","manager"].includes(value)) return "manager";
  if (["admin","administrador","administradora"].includes(value)) return "admin";
  return "";
}

function mapSituation(raw: string): InstitutionalImportRow["situation"] {
  const value = normalize(raw).replace(/_/g, " ");
  if (!value) return "active";
  if (["ativo","ativa","active","matriculado","matriculada","em exercicio","em_atividade"].includes(value)) return "active";
  if (["inativo","inativa","inactive","desligado","desligada","concluido","concluida","afastado","afastada"].includes(value)) return "inactive";
  return "";
}

export function parseInstitutionalCsv(text: string): InstitutionalImportRow[] {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = source.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("O arquivo precisa ter cabeçalho e pelo menos uma linha de dados.");

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCsvLine(lines[0], delimiter);
  const normalizedHeaders = rawHeaders.map(normalize);
  const indexByField = new Map<string, number>();

  for (const [field, aliases] of Object.entries(headerAliases)) {
    const accepted = new Set([field, ...aliases].map(normalize));
    const index = normalizedHeaders.findIndex((header) => accepted.has(header));
    if (index >= 0) indexByField.set(field, index);
  }

  for (const required of ["external_id","full_name","institutional_email","proposed_role"]) {
    if (!indexByField.has(required)) {
      throw new Error("Cabeçalho obrigatório ausente: " + required + ".");
    }
  }

  const pick = (values: string[], field: string) => {
    const index = indexByField.get(field);
    return index === undefined ? "" : (values[index] ?? "").trim();
  };

  return lines.slice(1).map((line, offset) => {
    const values = parseCsvLine(line, delimiter);
    return {
      external_id: pick(values, "external_id"),
      full_name: pick(values, "full_name"),
      institutional_email: pick(values, "institutional_email").toLowerCase(),
      proposed_role: mapRole(pick(values, "proposed_role")),
      campus: pick(values, "campus") || "Campus Cáceres",
      course_code: pick(values, "course_code").toUpperCase(),
      class_code: pick(values, "class_code").toUpperCase(),
      situation: mapSituation(pick(values, "situation")),
      source_row: offset + 2,
    };
  });
}
