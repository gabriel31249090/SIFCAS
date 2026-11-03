import type { PublicNotice } from "@/lib/public-notices";

/** Reviewed source registry. No automated collection is enabled or claimed. */
export const publicNoticeSources = [
  { id: "ifmt-editais", title: "Painel de Editais do IFMT", url: "https://ifmt.edu.br/painel-de-editais/", mode: "Revisão editorial de páginas públicas", automated: false, verifiedOn: "2026-11-03", pending: "Validar permissão de coleta, contrato de metadados e limites com o responsável pela fonte." },
  { id: "campus-caceres", title: "Notícias do Campus Cáceres", url: "https://cas.ifmt.edu.br/categoria/noticias/", mode: "Link oficial; coleta aguardando validação", automated: false, verifiedOn: null, pending: "Validar feed/API, campos e revisão editorial antes de coletar." },
  { id: "ifmt-ingresso", title: "Portal de Ingresso e Concursos", url: "https://seletivo.ifmt.edu.br/", mode: "Link oficial; integração aguardando configuração", automated: false, verifiedOn: null, pending: "Confirmar disponibilidade, formato e permissão de coleta." },
] as const;

/** Metadata checked on the linked official pages; documents are links, never copied PDFs. */
export const reviewedPublicNotices: PublicNotice[] = [
  {
    id: "ifmt-caceres-39-2026", sourceId: "ifmt-editais", sourceRecordId: "edital-no-39-2026-selecao-de-bolsistas-para-projeto-de-extensao-ifmt-campus-caceres-prof-olegario-baldo",
    number: "39", year: 2026, issuer: "IFMT Campus Cáceres – Prof. Olegário Baldo", campus: "Cáceres", category: "Extensão", audience: "Estudantes; requisitos no edital original",
    title: "Edital 39/2026 · Bolsistas em projetos de extensão", summary: "Seleção do Campus Cáceres para atuação estudantil em extensão. Consulte requisitos e documentos no edital original.", sourceSummary: "Seletivo Simplificado com o objetivo de selecionar estudantes para atuarem como bolsistas em projetos de extensão",
    canonicalUrl: "https://ifmt.edu.br/blog/edital/edital-no-39-2026-selecao-de-bolsistas-para-projeto-de-extensao-ifmt-campus-caceres-prof-olegario-baldo/",
    publishedOn: "2026-10-29", opens: { date: "2026-11-01", time: "07:00" }, closes: { date: "2026-11-08", time: "23:59" }, declaredStatus: "open", registrationUrl: null,
    verifiedOn: "2026-11-03", revision: "2026-11-03.1", reviewReasons: [],
    documents: [{ kind: "original", title: "Edital 39/2026 (documento indicado na fonte)", url: "https://drive.google.com/file/d/1_p5tuC06nvm7EmIbCzZnNZcKM1gQ8S5k/view?usp=sharing", verifiedOn: "2026-11-03" }],
  },
  {
    id: "ifmt-caceres-14-2026", sourceId: "ifmt-editais", sourceRecordId: "edital-no-14-2026-cas-gab-cas-dg-ccac-rtr-ifmt-vagas-remanescentes-dos-cursos-tecnicos-integrados-ao-ensino-medio",
    number: "14", year: 2026, issuer: "IFMT Campus Cáceres – Prof. Olegário Baldo", campus: "Cáceres", category: "Ensino", audience: "Candidatos ao ensino técnico integrado; requisitos na origem",
    title: "Edital 14/2026 · Vagas remanescentes do ensino técnico integrado", summary: "Processo encerrado. A página oficial reúne o edital, retificação do cronograma e chamadas posteriores.", sourceSummary: "Vagas Remanescentes dos Cursos Técnicos Integrados ao Ensino Médio",
    canonicalUrl: "https://ifmt.edu.br/blog/edital/edital-no-14-2026-cas-gab-cas-dg-ccac-rtr-ifmt-vagas-remanescentes-dos-cursos-tecnicos-integrados-ao-ensino-medio/",
    publishedOn: "2026-02-25", opens: null, closes: { date: "2026-03-08", time: "23:59" }, declaredStatus: "closed", registrationUrl: null,
    verifiedOn: "2026-11-03", revision: "2026-11-03.2", reviewReasons: ["Abertura indicada em 25/02 no cabeçalho e inscrições a partir de 27/02 no texto. Consulte a retificação; o catálogo não redefine o cronograma."],
    documents: [
      { kind: "original", title: "Edital 14/2026", url: "https://drive.google.com/file/d/1jHJQwZQQfa5nK7t8eZ_eQeHmAZ523ZWS/view?usp=sharing", verifiedOn: "2026-11-03" },
      { kind: "correction", title: "Retificação do cronograma", url: "https://drive.google.com/file/d/118Vpg0YTRZNhI0jtFp_DFKUPM6E6TYHA/view?usp=drive_link", verifiedOn: "2026-11-03" },
      { kind: "call", title: "Segunda chamada (consulta na origem)", url: "https://drive.google.com/file/d/1swPZEO4YfYfaeI18v0ej95wpHZgTG7aH/view?usp=sharing", verifiedOn: "2026-11-03", personalData: true },
      { kind: "extension", title: "Edital complementar (ver condições na origem)", url: "https://drive.google.com/file/d/10F4NxjObyA0o8n14t8l2A0mY2ssgYp5Y/view?usp=drive_link", verifiedOn: "2026-11-03" },
    ],
  },
  {
    id: "ifmt-varzea-grande-34-2026", sourceId: "ifmt-editais", sourceRecordId: "edital-34-2026-de-selecao-de-bolsistas",
    number: "34", year: 2026, issuer: "IFMT Campus Várzea Grande", campus: "Várzea Grande", category: "Extensão", audience: "Elegibilidade a confirmar no documento original",
    title: "Edital 34/2026 · Seleção de bolsistas", summary: "Processo de extensão encerrado, com divergências na página de divulgação. Quantidade de vagas, requisitos e horários exigem revisão do documento original.", sourceSummary: "Serão ofertadas 10 bolsas mensais no valor de r$400,00 para cada bolsista",
    canonicalUrl: "https://ifmt.edu.br/blog/edital/edital-34-2026-de-selecao-de-bolsistas/", publishedOn: "2026-10-28", opens: { date: "2026-10-08", time: "07:00" }, closes: { date: "2026-10-16" }, declaredStatus: "closed", registrationUrl: null,
    verifiedOn: "2026-11-03", revision: "2026-11-03.1", reviewReasons: ["O horário de fechamento diverge entre o cabeçalho (19h) e o texto (23h59).", "Resumo e detalhe divergem na quantidade de bolsas. Nenhuma quantidade ou elegibilidade foi inferida.", "A data exibida como publicação é posterior ao prazo informado; cronograma a confirmar no documento original."],
    documents: [{ kind: "original", title: "Documento original indicado na fonte", url: "https://drive.google.com/file/d/1G2ihcG4MzeZe4ZcP_FQLnsfXo4aaLFak/view?usp=sharing", verifiedOn: "2026-11-03" }],
  },
];
