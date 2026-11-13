import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import seed from "@/data/institutional-demo.seed.json";
import { GraduationCap, Users, BookOpen, FileText } from "lucide-react";

export const metadata = { title: "Diretório acadêmico" };
type Tab = "students" | "teachers" | "classes" | "notices";
export default async function DirectoryPage({searchParams}:{searchParams:Promise<{tab?:string;q?:string}>}) {
  const account = await requireAccount();
  if (!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const tab:Tab = (["students","teachers","classes","notices"].includes(params.tab || "") ? params.tab : "students") as Tab;
  const q = (params.q || "").slice(0,80).toLocaleLowerCase("pt-BR");
  const rows = tab === "students" ? seed.students.map(x=>({id:x.id,name:x.name,detail:x.registration,extra:x.course}))
    : tab === "teachers" ? seed.teachers.map(x=>({id:x.id,name:x.name,detail:x.subject,extra:"Docente"}))
    : tab === "classes" ? seed.classes.map(x=>({id:x.id,name:x.name,detail:String(x.year),extra:"Técnico em Informática"}))
    : seed.notices.map(x=>({id:x.id,name:x.title,detail:x.category,extra:x.publishedOn}));
  const filtered = rows.filter(x=>[x.name,x.detail,x.extra].some(v=>v.toLocaleLowerCase("pt-BR").includes(q)));
  return <>
    <PageHeader title="Diretório acadêmico" description="Consulte estudantes, docentes, turmas e oportunidades cadastradas no ambiente de desenvolvimento." />
    <div className="infoBox" role="note">Registros de demonstração, sem vínculo acadêmico ou validade institucional. Não são contas de acesso, matrículas oficiais nem editais abertos para inscrição.</div>
    <div className="statGrid">
      <StatCard label="Estudantes" value={String(seed.students.length)} foot="No diretório" icon={GraduationCap}/>
      <StatCard label="Professores" value={String(seed.teachers.length)} foot="No diretório" icon={Users}/>
      <StatCard label="Turmas" value={String(seed.classes.length)} foot="No diretório" icon={BookOpen}/>
      <StatCard label="Oportunidades" value={String(seed.notices.length)} foot="Rascunhos internos" icon={FileText}/>
    </div>
    <nav className="quickGrid" aria-label="Categorias do diretório" style={{marginTop:18}}>
      <Link href="/diretorio-academico?tab=students">Estudantes</Link>
      <Link href="/diretorio-academico?tab=teachers">Professores</Link>
      <Link href="/diretorio-academico?tab=classes">Turmas</Link>
      <Link href="/diretorio-academico?tab=notices">Oportunidades</Link>
    </nav>
    <SectionTitle title={{students:"Estudantes",teachers:"Professores",classes:"Turmas",notices:"Oportunidades"}[tab]} description={filtered.length+" registro(s) encontrado(s)"}/>
    <section className="card panel">
      <form method="get" action="/diretorio-academico" className="formRow2">
        <input type="hidden" name="tab" value={tab}/>
        <label>Pesquisar<input type="search" name="q" defaultValue={params.q || ""} maxLength={80} placeholder="Nome, disciplina ou curso"/></label>
        <button type="submit" className="button primary">Pesquisar</button>
      </form>
      <div className="tableScroll" style={{marginTop:16}}>
        <table className="dataTable"><thead><tr><th>Nome / título</th><th>Referência</th><th>Informação</th></tr></thead><tbody>
          {filtered.map(x=><tr key={x.id}><td><strong>{x.name}</strong></td><td>{x.detail}</td><td>{x.extra}</td></tr>)}
        </tbody></table>
        {!filtered.length && <p>Nenhum registro encontrado.</p>}
      </div>
    </section>
  </>;
}
