import { PageHeader } from "@/components/UI";

const days = [
  { day:"SEG",date:"21 SET",items:[['08:00','Programação II','Vetores e revisão prática','2º Ano A'],['13:30','Matemática','Matrizes: operações','2º Ano A']]},
  { day:"TER",date:"22 SET",items:[['08:00','Banco de Dados','Normalização — 2FN e 3FN','2º Ano A']]},
  { day:"QUA",date:"23 SET",items:[['09:45','Inglês','Reading comprehension','2º Ano A'],['14:20','Física','Refração da luz','2º Ano A']]},
  { day:"QUI",date:"24 SET",items:[['08:00','Programação II','Atividade avaliativa','2º Ano A']]},
  { day:"SEX",date:"25 SET",items:[['10:00','Projeto Integrador','Orientação dos grupos','2º Ano A']]},
];

export default function AgendaAluno() {
  return <>
    <PageHeader title="Agenda do Aluno e da Turma" description="Professores publicam antecipadamente o que será realizado em cada dia para uma turma específica: conteúdos, aulas, provas, trabalhos, atividades, materiais e observações." action={<button className="button soft">Modo professor</button>}/>
    <div className="agendaGrid">
      <section className="card calendarCard">
        <div className="calendarHead"><div><h2>Semana da turma</h2><span className="mutedLabel">2º Ano A • Campus Cáceres</span></div><span className="badge">21–25 setembro</span></div>
        <div className="weekGrid">{days.map(d=><article className="dayColumn" key={d.day}><header><b>{d.day}</b><span>{d.date}</span></header>{d.items.map(i=><div className="agendaItem" key={i[0]+i[1]}><strong>{i[0]} • {i[1]}</strong><small>{i[2]}</small><small>{i[3]}</small></div>)}</article>)}</div>
      </section>
      <aside className="card sidePanel">
        <div className="sectionTitle" style={{marginTop:0}}><div><h2>Publicação do professor</h2><p>Protótipo do fluxo de planejamento por turma.</p></div></div>
        <div className="infoBox">Na versão funcional, somente professores vinculados à turma e gestores autorizados poderão publicar ou alterar itens da agenda.</div>
        <form className="formStack" style={{marginTop:14}}>
          <label>Turma<select defaultValue="2a"><option value="2a">2º Ano A</option><option>2º Ano B</option></select></label>
          <label>Disciplina<select><option>Programação II</option><option>Matemática</option><option>Inglês</option></select></label>
          <label>Data<input type="date" defaultValue="2026-09-21"/></label>
          <label>Tipo<select><option>Aula</option><option>Prova</option><option>Trabalho</option><option>Atividade</option><option>Aviso</option></select></label>
          <label>Conteúdo / atividade<textarea defaultValue="Conteúdo planejado para a turma..."/></label>
          <button type="button" className="button soft">Publicar na agenda</button>
        </form>
      </aside>
    </div>
  </>;
}
