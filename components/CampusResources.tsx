import Link from "next/link";
import { ArrowRight, BookOpen, FileText, GraduationCap, Monitor, School, Users } from "lucide-react";
import { getCampusEntry, type CampusCategory, type CampusEntry } from "@/lib/campus-content";
import styles from "@/app/campus/campus.module.css";

const categoryIcons = { Sistemas: Monitor, Cursos: GraduationCap, "Vida acadêmica": BookOpen, Atendimento: Users, Documentos: FileText, Docentes: School } satisfies Record<CampusCategory, typeof Monitor>;

export function CampusCard({ entry }: { entry: CampusEntry }) {
  const Icon = categoryIcons[entry.category];
  return <Link href={`/campus/${entry.slug}`} className={styles.card}>
    <div className={styles.cardTop}><span className={styles.cardIcon}><Icon size={20} aria-hidden="true"/></span><span>{entry.category}</span></div>
    <h3>{entry.title}</h3><p>{entry.summary}</p>
    <span className={styles.cardLink}>Ver orientação <ArrowRight size={16} aria-hidden="true"/></span>
  </Link>;
}

export function CampusResources({ title = "Guias e serviços do IFMT", description = "Informações públicas organizadas com links para as fontes oficiais.", slugs }: { title?: string; description?: string; slugs: string[] }) {
  const entries = slugs.map(getCampusEntry).filter((entry): entry is CampusEntry => Boolean(entry));
  if (!entries.length) return null;
  return <section className={styles.resources} aria-label={title}>
    <div className={styles.sectionHead}><div><h2>{title}</h2><p>{description}</p></div><Link href="/campus">Explorar campus <ArrowRight size={15} aria-hidden="true"/></Link></div>
    <div className={styles.grid}>{entries.map((entry) => <CampusCard key={entry.slug} entry={entry}/>)}</div>
  </section>;
}
