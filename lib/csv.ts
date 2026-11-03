export const CSV_MAX_BYTES = 750 * 1024;
export const CSV_MAX_ROWS = 10_000;

/** Only UTF-8 is supported. Reject invalid bytes instead of silently losing IDs. */
export function decodeCsvBytes(bytes: Uint8Array): string {
  if (!bytes.length || bytes.length > CSV_MAX_BYTES) throw new Error("O arquivo deve ter entre 1 byte e 750 KB.");
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.includes("\0")) throw new Error("binary");
    return text.replace(/^\uFEFF/, "");
  } catch {
    throw new Error("Codificação inválida. Exporte o arquivo em UTF-8 (com ou sem BOM).");
  }
}

export function parseCsv(text: string, options: { maxRows?: number; maxBytes?: number } = {}) {
  if (new TextEncoder().encode(text).length > (options.maxBytes ?? CSV_MAX_BYTES)) throw new Error("O CSV ultrapassa o limite de tamanho.");
  if (/[\0\uFFFD]/.test(text)) throw new Error("CSV inválido; use texto UTF-8.");
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  // Count separators outside quotes in the first logical record only.
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (inQuotes && source[i + 1] === '"') i++;
      else inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === "\n") break;
      if (char === ",") commas++;
      if (char === ";") semicolons++;
    }
  }
  const delimiter = semicolons >= commas ? ";" : ",";
  const records: Array<{ values: string[]; sourceRow: number }> = [];
  let values: string[] = [];
  let value = "";
  let quoted = false;
  let closed = false;
  let line = 1;
  let startLine = 1;
  const finishField = () => { values.push(value.trim()); value = ""; closed = false; };
  const finishRecord = () => {
    finishField();
    if (values.some((item) => item !== "")) records.push({ values, sourceRow: startLine });
    values = [];
    if (records.length > (options.maxRows ?? CSV_MAX_ROWS) + 1) throw new Error("O limite é de 10.000 registros por lote.");
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { value += '"'; i++; }
        else { quoted = false; closed = true; }
      } else { value += char; if (char === "\n") line++; }
    } else if (char === delimiter) {
      finishField();
    } else if (char === "\n") {
      finishRecord(); line++; startLine = line;
    } else if (char === '"') {
      if (closed || value.trim()) throw new Error(`Aspas inválidas na linha ${line}.`);
      value = ""; quoted = true;
    } else {
      if (closed && char.trim()) throw new Error(`Conteúdo após aspas na linha ${line}.`);
      if (!closed) value += char;
    }
  }
  if (quoted) throw new Error(`Campo entre aspas não foi fechado (linha ${startLine}).`);
  if (value || values.length || closed) finishRecord();
  if (records.length < 2) throw new Error("O arquivo precisa ter cabeçalho e pelo menos uma linha de dados.");
  const headers = records[0].values;
  if (headers.some((header) => !header)) throw new Error("O cabeçalho contém uma coluna vazia.");
  const normalized = headers.map((header) => header.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  if (new Set(normalized).size !== normalized.length) throw new Error("O cabeçalho contém colunas duplicadas.");
  const rows = records.slice(1);
  for (const record of rows) {
    if (record.values.length !== headers.length) throw new Error(`Quantidade de colunas inválida na linha ${record.sourceRow}.`);
  }
  return { headers, rows, delimiter };
}

/** Quote every cell and neutralize spreadsheet formulas in downloadable reports. */
export function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
