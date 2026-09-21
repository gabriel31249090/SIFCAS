export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function matchesSearch(text: string, query: string): boolean {
  const haystack = normalizeSearch(text);
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

/** Keep PostgREST filter punctuation and wildcard operators out of user input. */
export function publicationSearchTerm(value: string): string {
  return value.trim().slice(0, 100).replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();
}
