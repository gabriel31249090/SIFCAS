/** Public editorial catalogue. Never contains student records or authenticated exports. */
export const campusReviewedAt = "2026-10-16";
export const campusReviewLabel = "16/10/2026";

export const campusCategories = ["Sistemas", "Cursos", "Vida acadêmica", "Atendimento", "Documentos", "Docentes"] as const;
export type CampusCategory = typeof campusCategories[number];
export type CampusEntry = {
  slug: string;
  title: string;
  category: CampusCategory;
  summary: string;
  body: string[];
  source: string;
  sourceLabel: string;
  facts?: Array<[string, string]>;
  steps?: string[];
  links?: Array<{ label: string; href: string }>;
  email?: string;
  phone?: string;
  note?: string;
  keywords?: string;
};

const cas = "https://cas.ifmt.edu.br";
const wiki = "https://wiki.ifmt.edu.br";
const suap = "https://suap.ifmt.edu.br";
const teaching = `${cas}/ensino/`;
const campus = `${cas}/o-campus/`;
const moodleBook = `${wiki}/books/uso-do-ava-moodle-guia-doa-professora`;
const studentGuide = `${wiki}/books/ensino/page/edu-aluno`;
const courseSource = (path: string) => ({ source: `${cas}/${path}/`, sourceLabel: "IFMT Cáceres · página do curso" });
const teachingSource = { source: teaching, sourceLabel: "IFMT Cáceres · Ensino" };
const campusSource = { source: campus, sourceLabel: "IFMT Cáceres · O Campus" };

export const campusEntries: CampusEntry[] = [
  {
    slug: "suap", title: "SUAP: acesso de estudantes e servidores", category: "Sistemas",
    summary: "Entre no sistema acadêmico oficial com o usuário correspondente ao seu vínculo.",
    body: ["No SUAP, estudantes usam a matrícula do curso; servidores e estagiários usam a matrícula SIAPE. Quem possui mais de um vínculo deve conferir o perfil utilizado."],
    steps: ["Abra o SUAP pelo endereço institucional.", "Informe o usuário do seu vínculo e a senha institucional.", "Para o primeiro acesso ou recuperação, use a opção de alteração de senha na tela de entrada."],
    source: `${wiki}/books/introducao-suap/page/tela-de-login`, sourceLabel: "Wiki IFMT · Tela de login",
    links: [{ label: "Entrar no SUAP", href: `${suap}/accounts/login/` }],
    note: "A conta do SIFCAS é independente. Seu papel no SIFCAS não altera permissões no SUAP.", keywords: "login matrícula siape aluno professor servidor autenticação",
  },
  {
    slug: "recuperar-senha-suap", title: "Primeiro acesso e senha do SUAP", category: "Sistemas",
    summary: "Acesse o formulário oficial para criar ou recuperar sua senha.",
    body: ["O formulário solicita o usuário e o CPF ou passaporte. Para aluno ou servidor, o campo de usuário recebe a matrícula. Siga as instruções apresentadas pelo próprio SUAP."],
    source: `${suap}/comum/solicitar_trocar_senha/`, sourceLabel: "SUAP IFMT · Alteração de senha",
    links: [{ label: "Abrir recuperação no SUAP", href: `${suap}/comum/solicitar_trocar_senha/` }],
    note: "Preencha seus dados somente no formulário oficial. Em caso de divergência cadastral, procure a Secretaria do campus.", keywords: "esqueci acesso bloqueado senha login",
  },
  {
    slug: "ava-moodle", title: "AVA Moodle: materiais e atividades", category: "Sistemas",
    summary: "Saiba como acessar o Moodle integrado ao SUAP e localizar sua sala virtual.",
    body: ["O manual do IFMT de 2026 indica online.ifmt.edu.br para o Moodle integrado. O docente pode abrir a sala pelo link disponível no diário do SUAP, utilizando as credenciais institucionais.", "Materiais de acesso anteriores também citam ava.ifmt.edu.br. Use o ambiente informado pelo professor ou pela coordenação da sua turma."],
    steps: ["Confirme com o docente qual ambiente atende à sua disciplina.", "No Moodle integrado, utilize o acesso institucional.", "Se a sala não aparecer, confirme o vínculo e a liberação com o professor."],
    source: `${moodleBook}/page/capitulo-6-acesso-ao-ava-moodle`, sourceLabel: "Wiki IFMT · Acesso ao AVA Moodle (2026)",
    links: [{ label: "Abrir Moodle integrado", href: "https://online.ifmt.edu.br/" }, { label: "Consultar manual do AVA", href: moodleBook }],
    note: "O acesso interno às disciplinas exige vínculo institucional. O SIFCAS reúne orientações públicas e não sincroniza tarefas ou notas desses ambientes.", keywords: "ava moodle ambiente virtual ensino distância ead atividade tarefa aula online",
  },
  {
    slug: "email-institucional", title: "E-mail institucional", category: "Sistemas",
    summary: "Tutoriais para criar, localizar e recuperar o acesso ao e-mail acadêmico.",
    body: ["A Wiki do IFMT reúne os tutoriais de criação e consulta do e-mail institucional pelo SUAP. A orientação publicada informa que a senha acompanha a do SUAP; quando solicitado um código de funcionário na confirmação de identidade, utiliza-se a matrícula."],
    source: `${wiki}/books/acessos/page/suap-e-e-mail-institucional`, sourceLabel: "Wiki IFMT · SUAP e e-mail institucional",
    links: [{ label: "Ver tutoriais de e-mail", href: `${wiki}/books/acessos/page/suap-e-e-mail-institucional` }], keywords: "gmail google conta estudante correio eletrônico",
  },
  {
    slug: "eventos-sige", title: "SIGE: eventos do IFMT", category: "Sistemas",
    summary: "Consulte eventos e acesse as inscrições no sistema institucional.",
    body: ["O SIGE permite que estudantes e servidores do IFMT utilizem matrícula e senha do SUAP. A página de cada evento apresenta programação e condições de participação."],
    source: "https://eventos.ifmt.edu.br/cadastro/", sourceLabel: "SIGE IFMT · Cadastro e acesso",
    links: [{ label: "Explorar eventos no SIGE", href: "https://eventos.ifmt.edu.br/" }], keywords: "evento inscrição oficina palestra seminário certificado",
  },
  {
    slug: "agropecuaria-integrado", title: "Técnico em Agropecuária · integrado", category: "Cursos",
    summary: "Ensino médio com formação técnica em produção agropecuária.",
    body: ["Combina a formação geral com estudos de agricultura, pecuária e área florestal. Desenvolve competências para projetos agropecuários, manejo e gestão de propriedades."],
    facts: [["Modalidade", "Integrado ao ensino médio · presencial"], ["Duração", "3 anos"], ["Turno", "Integral / diurno"], ["Carga horária publicada", "3.560 horas, incluindo estágio"]],
    ...courseSource("tecnico-em-agropecuaria-integrado-ao-ensino-medio"), keywords: "agro agricultura animais técnico",
  },
  {
    slug: "informatica", title: "Informática / Informática para Internet", category: "Cursos",
    summary: "Formação técnica integrada ao ensino médio na área de tecnologia.",
    body: ["O ingresso pressupõe a conclusão do ensino fundamental. A página reúne o PPC de Informática de 2015 e o de Informática para Internet de 2025; consulte o projeto correspondente à sua turma."],
    facts: [["Modalidade", "Integrado ao ensino médio"], ["Duração publicada", "3 anos"], ["Turno publicado", "Integral"]],
    email: "tecinfo.cas@ifmt.edu.br", ...courseSource("curso-tecnico-em-informatica-integrado-ao-ensino-medio"), keywords: "programação computadores informática internet ppc",
  },
  {
    slug: "florestas", title: "Técnico em Florestas · integrado", category: "Cursos",
    summary: "Educação técnica nas áreas ambiental e florestal.",
    body: ["O curso presencial integra o ensino médio e a formação profissional em recursos naturais, com foco em produção, conservação e tecnologias sustentáveis."],
    facts: [["Carga horária publicada", "3.560 horas"], ["Estágio obrigatório publicado", "160 horas"], ["Oferta", "Presencial · integrada"]],
    email: "tecflorestas.cas@ifmt.edu.br", ...courseSource("tecnico-em-florestas-integrado-ao-ensino-medio"), keywords: "floresta ambiente técnico recursos naturais",
  },
  {
    slug: "agroindustria-eja", title: "Agroindústria · EJA/EPT", category: "Cursos",
    summary: "Educação de jovens e adultos integrada à formação em produção alimentícia.",
    body: ["A proposta combina ensino médio e educação profissional para jovens e adultos. A página oficial disponibiliza o projeto pedagógico e a autorização de funcionamento de 2024."],
    facts: [["Modalidade", "EJA integrada à educação profissional"], ["Oferta descrita", "Presencial com carga horária a distância"]],
    ...courseSource("tecnico-em-agroindustria-integrado-ao-nivel-medio-eja-ept"), keywords: "eja proeja adultos alimentos agroindústria",
  },
  {
    slug: "agropecuaria-subsequente", title: "Técnico em Agropecuária · subsequente", category: "Cursos",
    summary: "Formação profissional para quem já concluiu o ensino médio.",
    body: ["A formação aborda planejamento e acompanhamento da produção animal e vegetal. A página reúne projetos pedagógicos de 2014 e de 2025, incluindo a proposta noturna."],
    facts: [["Modalidade", "Técnico subsequente · presencial"]], email: "subagropecuaria.cas@ifmt.edu.br",
    ...courseSource("tecnico-em-agropecuaria-subsequente-ao-nivel-medio"), keywords: "sub agro noturno técnico",
  },
  {
    slug: "engenharia-florestal", title: "Bacharelado em Engenharia Florestal", category: "Cursos",
    summary: "Graduação em manejo, conservação e tecnologias florestais.",
    body: ["A formação contempla silvicultura, produtos florestais, ecologia, geotecnologias e gestão sustentável. Há PPCs de diferentes anos, inclusive o projeto noturno de 2025."],
    facts: [["Nível", "Graduação · bacharelado"], ["Oferta", "Presencial"]], email: "gradengenhariaflorestal.cas@ifmt.edu.br",
    ...courseSource("bacharelado-em-engenharia-florestal"), keywords: "superior engenharia faculdade floresta graduação ppc",
  },
  {
    slug: "quimica", title: "Licenciatura em Química", category: "Cursos",
    summary: "Graduação voltada à formação de professores de Química.",
    body: ["Reúne formação científica e pedagógica. O ingresso exige ensino médio concluído; a página do curso oferece o PPC noturno de 2024."],
    facts: [["Duração publicada", "4 anos"], ["Turno publicado", "Noturno"], ["Carga horária publicada", "3.200 horas"]], email: "gradquimica.cas@ifmt.edu.br",
    ...courseSource("curso-superior-de-licenciatura-em-quimica"), keywords: "licenciatura química graduação professor faculdade",
  },
  {
    slug: "aquicultura", title: "FIC em Aquicultura", category: "Cursos",
    summary: "Qualificação em produção e manejo sustentável de organismos aquáticos.",
    body: ["Inclui qualidade da água, nutrição, sanidade e processamento do pescado, com atividades práticas. O ingresso depende de edital específico."],
    facts: [["Carga horária publicada", "160 horas"], ["Duração publicada", "10 semanas"], ["Oferta", "Presencial · formação inicial e continuada"]],
    ...courseSource("curso-de-formacao-inicial-e-continuada-fic-em-aquicultura"), keywords: "fic peixes pesca piscicultura qualificação",
  },
  {
    slug: "calendario-academico", title: "Calendário acadêmico de 2026", category: "Vida acadêmica",
    summary: "Encontre períodos letivos, avaliações, reuniões e recessos na publicação do campus.",
    body: ["A página mantém o acesso ao calendário de 2026 e aos arquivos de anos anteriores. Consulte a versão da sua oferta de ensino e eventuais revisões antes de planejar compromissos."],
    source: `${cas}/ensino/calendario-academico/`, sourceLabel: "IFMT Cáceres · Calendário acadêmico",
    links: [{ label: "Abrir arquivos de 2026", href: "https://drive.google.com/drive/folders/1XZaTRXO2SBcUoIQaORlbT27Sw7Gz1Wck" }],
    note: "As datas não são sincronizadas automaticamente com a agenda do SIFCAS.", keywords: "calendário feriado férias recesso bimestre sábado letivo datas",
  },
  {
    slug: "horarios-oficiais", title: "Horários oficiais das aulas", category: "Vida acadêmica",
    summary: "Grade de 2026 disponibilizada pela Direção de Ensino.",
    body: ["Escolha o arquivo da sua turma e confira sua versão."], ...teachingSource,
    links: [{ label: "Consultar horários de 2026", href: "https://drive.google.com/drive/folders/1MHpnfKvxaElcs07IiipCiMEPtLPJsE8f" }], keywords: "grade horário aula sala turma",
  },
  {
    slug: "boletim-suap", title: "Notas e faltas no SUAP", category: "Vida acadêmica",
    summary: "Consulte o boletim oficial pelo perfil do estudante.",
    body: ["A aba de boletins apresenta notas, faltas e situação dos diários conforme o período selecionado. O detalhamento mostra atividades e pesos; também há opção de impressão."],
    steps: ["Entre no SUAP e abra Meus dados, pelo atalho inicial ou pelo perfil.", "Acesse Boletins e selecione o período.", "Use o detalhamento do diário para conferir as atividades."],
    source: studentGuide, sourceLabel: "Wiki IFMT · Orientações ao aluno", links: [{ label: "Entrar para consultar", href: `${suap}/accounts/login/` }],
    note: "Os lançamentos do SUAP não são importados para o boletim do SIFCAS.", keywords: "boletim nota notas falta frequência média resultado",
  },
  {
    slug: "historico-suap", title: "Histórico e progresso no curso", category: "Vida acadêmica",
    summary: "Onde localizar disciplinas, carga horária e requisitos de conclusão.",
    body: ["Em Meus dados, o Histórico reúne os componentes curriculares e seus resultados. Requisitos de Conclusão e Atividades Complementares ajudam a conferir horas cumpridas e pendentes."],
    source: studentGuide, sourceLabel: "Wiki IFMT · Orientações ao aluno", links: [{ label: "Abrir SUAP", href: `${suap}/accounts/login/` }], keywords: "histórico horas atividades complementares conclusão documentos diploma",
  },
  {
    slug: "estagio", title: "Estágio: orientação e documentação", category: "Vida acadêmica",
    summary: "Contato do setor e orientações para formalizar o estágio.",
    body: ["O Setor de Estágios orienta a solicitação, a documentação e o termo de compromisso. A página informa que o termo é assinado eletronicamente no SUAP, portanto o estudante precisa manter seu acesso disponível."],
    facts: [["Atendimento publicado", "7h–11h e 13h–17h"]], email: "estagios.cas@ifmt.edu.br",
    source: `${cas}/extensao/estagio/`, sourceLabel: "IFMT Cáceres · Setor de Estágios",
    note: "A página contém chamadas anteriores. Confirme o cronograma da sua turma com o setor; não presuma que inscrições antigas estão abertas.", keywords: "estágios estágio termo compromisso tce defesa orientador",
  },
  {
    slug: "assistencia-estudantil", title: "Assistência estudantil e inclusão", category: "Atendimento",
    summary: "Orientação sobre permanência, acolhimento e políticas de apoio ao estudante.",
    body: ["A coordenação atua nas condições de permanência e conclusão dos cursos. A página reúne contatos, cartilha de acolhimento e as políticas institucionais de assistência."],
    facts: [["Atendimento publicado", "7h30–11h30 e 13h–17h"]], email: "assistenciaestudantil.cas@ifmt.edu.br", phone: "(65) 3221-2614",
    source: `${cas}/assistencia-estudantil/`, sourceLabel: "IFMT Cáceres · Assistência estudantil",
    note: "Benefícios, documentos e prazos dependem do edital aplicável. O contato do setor ajuda a identificar a seleção correta.", keywords: "auxílio auxílio bolsa alimentação inclusão acessibilidade apoio assistência",
  },
  {
    slug: "biblioteca", title: "Biblioteca Monteiro Lobato", category: "Atendimento",
    summary: "Consulta, empréstimo, renovação e apoio à pesquisa.",
    body: ["O acervo pode ser pesquisado no Gnuteca. A biblioteca também orienta pesquisas e fichas catalográficas."],
    facts: [["Atendimento publicado", "Segunda a sexta, 7h–20h30"]], email: "biblioteca@cas.ifmt.edu.br", phone: "(65) 3221-2619", ...teachingSource,
    links: [{ label: "Pesquisar acervo no Gnuteca", href: "https://biblioteca.ifmt.edu.br/" }], keywords: "livro livros biblioteca gnuteca empréstimo tcc leitura renovar",
  },
  {
    slug: "documentos-estudantis", title: "Atestados, RED, PEI e seguro estudantil", category: "Documentos",
    summary: "Orientações e formulários reunidos pela área de Ensino.",
    body: ["A página de Ensino reúne orientações para atestados, Regime de Exercícios Domiciliares, Plano Educacional Individualizado e seguro estudantil."],
    ...teachingSource, keywords: "atestado médico saúde red pei seguro acidente atendimento especial exercício domiciliar",
  },
  {
    slug: "laboratorios", title: "Laboratórios e regras de utilização", category: "Vida acadêmica",
    summary: "Consulte os regulamentos antes das atividades práticas.",
    body: ["Ensino disponibiliza normas para os laboratórios de Bromatologia, Química e Química Industrial."],
    ...teachingSource, keywords: "laboratório laboratório bromatologia química industrial infraestrutura estrutura mapa",
  },
  {
    slug: "direcao-ensino", title: "Direção de Ensino", category: "Atendimento",
    summary: "Canal institucional para assuntos de ensino.", body: ["Atendimento publicado: 7h30–11h30 e 13h30–17h30."],
    email: "ensino.cas@ifmt.edu.br", ...teachingSource, keywords: "ensino direção coordenação",
  },
  {
    slug: "apoio-pedagogico", title: "Coordenação Geral de Ensino", category: "Atendimento",
    summary: "Contato da coordenação pedagógica.", body: ["Atendimento publicado: 7h–11h e 13h30–17h30."],
    email: "pedagogico.cas@ifmt.edu.br", phone: "(65) 3221-2629", ...teachingSource, keywords: "pedagógico pedagogia apoio aprendizagem coordenação",
  },
  {
    slug: "secretaria", title: "Secretaria e registros escolares", category: "Atendimento",
    summary: "Contato da Coordenação de Registros Escolares.", body: ["Atendimento publicado: 7h–11h e 13h30–17h30."],
    email: "secretaria.cas@ifmt.edu.br", phone: "(65) 3221-2610", ...campusSource, keywords: "secretaria matrícula documento registro escolar cadastro histórico",
  },
  {
    slug: "atendimento-educando", title: "Atendimento ao Educando", category: "Atendimento",
    summary: "Canal de atendimento aos estudantes do campus.", body: ["Atendimento publicado: 8h–12h e 14h–18h."],
    email: "dae.cas@ifmt.edu.br", ...campusSource, keywords: "dae aluno estudante apoio alojamento",
  },
  {
    slug: "alimentacao", title: "Alimentação e nutrição", category: "Atendimento",
    summary: "Contato publicado do setor responsável pela alimentação.", body: ["Atendimento publicado: 7h–11h e 13h30–17h30."],
    phone: "(65) 3221-2616", ...campusSource,
    note: "Cardápio do dia e horários das refeições precisam ser confirmados com o setor.", keywords: "refeitório cardápio almoço jantar comida nutrição alimentação",
  },
  {
    slug: "gabinete", title: "Gabinete da Direção-Geral", category: "Atendimento",
    summary: "Canal de contato com o gabinete do campus.", body: ["Atendimento publicado: 7h–11h e 13h–17h."],
    email: "gabinete.cas@ifmt.edu.br", phone: "(65) 3221-2628", ...campusSource, keywords: "direção geral diretor gabinete contato telefone",
  },
  {
    slug: "pesquisa-extensao", title: "Pesquisa e extensão", category: "Atendimento",
    summary: "Contatos das coordenações de pesquisa e de extensão.", body: ["Pesquisa: pesquisa.cas@ifmt.edu.br. Extensão: extensao.cas@ifmt.edu.br."],
    ...campusSource,
    links: [{ label: "E-mail da pesquisa", href: "mailto:pesquisa.cas@ifmt.edu.br" }, { label: "E-mail da extensão", href: "mailto:extensao.cas@ifmt.edu.br" }], keywords: "pesquisa inovação extensão projeto científico iniciação científica",
  },
  {
    slug: "sobre-campus", title: "Conheça o Campus Cáceres", category: "Vida acadêmica",
    summary: "Formação profissional e tecnológica na região do Pantanal.",
    body: ["O Campus Cáceres – Prof. Olegário Baldo tem origem na Escola Agrotécnica Federal e reúne ensino técnico, graduação e atividades de pesquisa e extensão. Sua atuação inclui formação agrícola, ambiental e tecnológica."],
    ...campusSource, keywords: "campus história olegário baldo pantanal instituição",
  },
  {
    slug: "responsaveis-suap", title: "SUAP: acesso do responsável", category: "Sistemas",
    summary: "Entrada específica para acompanhamento pelo responsável.",
    body: ["A tela oficial solicita a matrícula do estudante e a chave de acesso do aluno. Procure o estudante ou a Secretaria caso precise de orientação para obter os dados corretos."],
    source: `${suap}/edu/acesso_responsavel/`, sourceLabel: "SUAP IFMT · Acesso do responsável",
    links: [{ label: "Abrir acesso do responsável", href: `${suap}/edu/acesso_responsavel/` }], keywords: "pais pai mãe família responsável chave boletim",
  },
  {
    slug: "documentos-publicos-suap", title: "Documentos eletrônicos públicos", category: "Documentos",
    summary: "Consulte documentos no sistema oficial do IFMT.",
    body: ["A consulta oferece filtros por identificador ou assunto, tipo de documento e setor. Use as informações do documento para restringir a busca."],
    source: `${suap}/documento_eletronico/consulta_publica/`, sourceLabel: "SUAP IFMT · Consulta pública de documentos",
    links: [{ label: "Consultar documentos no SUAP", href: `${suap}/documento_eletronico/consulta_publica/` }], keywords: "portaria documento público eletrônico resolução",
  },
  {
    slug: "autenticar-documento-suap", title: "Autenticidade de documentos do SUAP", category: "Documentos",
    summary: "Confira um documento emitido pelo sistema institucional.",
    body: ["Abra o verificador do SUAP e siga as informações de autenticação impressas no documento. Para um documento emitido pelo SIFCAS, utilize a verificação própria indicada nele."],
    source: `${suap}/comum/autenticar_documento/`, sourceLabel: "SUAP IFMT · Verificação de autenticação",
    links: [{ label: "Verificar no SUAP", href: `${suap}/comum/autenticar_documento/` }], keywords: "validar documento autenticidade código assinatura autenticar",
  },
  {
    slug: "diplomas-suap", title: "Consulta pública de diplomas", category: "Documentos",
    summary: "Localize registros pelo serviço oficial do SUAP.",
    body: ["A página de registros permite filtrar por campus e modalidade, além dos campos de identificação. Preencha os filtros diretamente no ambiente institucional."],
    source: `${suap}/edu/registroemissaodiploma_public/`, sourceLabel: "SUAP IFMT · Registro de diplomas",
    links: [{ label: "Consultar registro de diploma", href: `${suap}/edu/registroemissaodiploma_public/` }], keywords: "diploma registro formação conclusão autenticidade",
  },
  {
    slug: "editais-oficiais", title: "Editais e seleções do IFMT", category: "Vida acadêmica",
    summary: "Acompanhe chamadas e resultados no painel institucional.",
    body: ["O painel reúne processos de várias unidades. Confira o campus, a edição, o público atendido, os anexos e as retificações do edital que você pretende utilizar."],
    source: "https://ifmt.edu.br/painel-de-editais/", sourceLabel: "IFMT · Painel de Editais",
    links: [{ label: "Abrir painel oficial de editais", href: "https://ifmt.edu.br/painel-de-editais/" }],
    note: "Um edital publicado pode ter inscrições encerradas. Vale o prazo da publicação e de suas retificações.", keywords: "edital seleção seletivo ingresso vagas bolsa inscrição concurso resultado",
  },
  {
    slug: "noticias-campus", title: "Notícias do Campus Cáceres", category: "Vida acadêmica",
    summary: "Acompanhe as publicações diretamente no portal do campus.",
    body: ["A página inicial destaca notícias locais e publicações do IFMT. Confira a data de cada matéria, especialmente quando ela anunciar inscrições ou eventos."],
    source: `${cas}/`, sourceLabel: "IFMT Cáceres · Portal institucional",
    links: [{ label: "Ler notícias na fonte", href: `${cas}/` }], keywords: "notícia novidades comunicado evento avisos",
  },
  {
    slug: "ouvidoria", title: "Ouvidoria do IFMT", category: "Atendimento",
    summary: "Canal para manifestações sobre serviços institucionais.",
    body: ["A Ouvidoria atende à comunidade interna e externa e orienta o registro de manifestações pela plataforma Fala.BR. A página institucional explica os canais e o acompanhamento."],
    source: "https://ifmt.edu.br/participacao-social/ouvidoria/", sourceLabel: "IFMT · Ouvidoria",
    links: [{ label: "Consultar canais da Ouvidoria", href: "https://ifmt.edu.br/participacao-social/ouvidoria/" }], keywords: "ouvidoria denúncia reclamação elogio sugestão fala br informação transparência",
  },
  {
    slug: "guia-docente-ava", title: "Guia do professor no AVA", category: "Docentes",
    summary: "Manual com organização da sala, recursos, atividades e avaliação no Moodle.",
    body: ["O guia do CREaD organiza o uso do Moodle em capítulos: criação da sala, estrutura, recursos didáticos, atividades, livro de notas, acompanhamento e integrações."],
    source: moodleBook, sourceLabel: "Wiki IFMT · Guia do professor no Moodle",
    links: [{ label: "Abrir manual completo", href: moodleBook }], keywords: "docente professor moodle tarefa fórum questionário avaliação aula tutorial",
  },
  {
    slug: "sala-moodle", title: "Criação da sala Moodle pelo SUAP", category: "Docentes",
    summary: "Orientação oficial para a criação automatizada da sala virtual.",
    body: ["O capítulo específico do manual explica a criação da sala Moodle pela integração institucional. Consulte o procedimento e os requisitos antes de preparar uma nova disciplina."],
    source: `${moodleBook}/page/capitulo-5-criacao-automatizada-da-sala-moodle`, sourceLabel: "Wiki IFMT · Criação automatizada da sala",
    links: [{ label: "Ver procedimento de criação", href: `${moodleBook}/page/capitulo-5-criacao-automatizada-da-sala-moodle` }], keywords: "professor docente criar sala diário integração ava suap",
  },
  {
    slug: "visibilidade-moodle", title: "Visibilidade da sala no Moodle", category: "Docentes",
    summary: "Orientação para preparar a apresentação e a disponibilização da disciplina.",
    body: ["O manual possui um capítulo sobre visibilidade e capa da sala virtual. Se o estudante não localizar uma disciplina, o professor pode conferir suas configurações seguindo essa orientação."],
    source: `${moodleBook}/page/capitulo-9-visibilidade-e-capa-da-sala-virtual`, sourceLabel: "Wiki IFMT · Visibilidade e capa da sala",
    links: [{ label: "Consultar orientação de visibilidade", href: `${moodleBook}/page/capitulo-9-visibilidade-e-capa-da-sala-virtual` }], keywords: "oculta visível sala não aparece docente ava moodle disciplina",
  },
];

export function normalizeCampusText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function findCampusEntries(query = "", category?: string) {
  const tokens = normalizeCampusText(query).split(/\s+/).filter(Boolean);
  return campusEntries.filter((entry) => {
    if (category && entry.category !== category) return false;
    const text = normalizeCampusText([entry.title, entry.summary, ...entry.body, entry.keywords, entry.email, entry.phone, ...(entry.facts ?? []).flat()].join(" "));
    return tokens.every((token) => text.includes(token));
  });
}

export function getCampusEntry(slug: string) {
  return campusEntries.find((entry) => entry.slug === slug);
}
