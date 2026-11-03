import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Mail, Phone, BookOpenCheck } from "lucide-react";
import { CampusResources } from "@/components/CampusResources";
import { campusEntries, campusReviewedAt, campusReviewLabel, getCampusEntry } from "@/lib/campus-content";
import styles from "../campus.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return campusEntries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getCampusEntry((await params).slug);
  return entry ? { title: entry.title, description: entry.summary, alternates: { canonical: `/campus/${entry.slug}` } } : { title: "Conteúdo não encontrado", robots: { index: false } };
}

export default async function CampusDetailPage({ params }: Props) {
  const entry = getCampusEntry((await params).slug);
  if (!entry) notFound();
  const related = campusEntries.filter((item) => item.category === entry.category && item.slug !== entry.slug).slice(0, 3);

  return <div className={styles.detailPage}>
    <Link className={styles.back} href={`/campus?categoria=${encodeURIComponent(entry.category)}#conteudos`}><ArrowLeft size={16} aria-hidden="true"/> {entry.category} no campus</Link>
    <header className={styles.detailHeader}><span className={styles.eyebrow}>{entry.category} · IFMT Cáceres</span><h1>{entry.title}</h1><p>{entry.summary}</p></header>
    <div className={styles.detailGrid}>
      <article className={styles.article}>
        <h2>O que você precisa saber</h2>
        {entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {entry.facts?.length ? <dl className={styles.facts}>{entry.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}
        {entry.steps?.length ? <section className={styles.steps}><h2>Como acessar</h2><ol>{entry.steps.map((step) => <li key={step}>{step}</li>)}</ol></section> : null}
        {entry.note ? <aside className={styles.note}><BookOpenCheck size={20} aria-hidden="true"/><p>{entry.note}</p></aside> : null}
        {entry.category === "Cursos" ? <aside className={styles.note}><p>A oferta, o turno e a matriz podem variar entre turmas. Confira o PPC da sua turma e o edital de ingresso na página oficial.</p></aside> : null}
      </article>
      <aside className={styles.source} aria-label="Fonte e contatos oficiais">
        <h2>Acesse na fonte</h2><p>{entry.sourceLabel}</p>
        <a className={styles.primaryLink} href={entry.source} target="_blank" rel="noopener noreferrer">Ver fonte oficial <ArrowUpRight size={16} aria-hidden="true"/></a>
        {entry.links?.filter((link) => link.href !== entry.source).map((link) => <a className={styles.secondaryLink} key={link.href} href={link.href} target={link.href.startsWith("https:") ? "_blank" : undefined} rel="noopener noreferrer">{link.label} <ArrowUpRight size={16} aria-hidden="true"/></a>)}
        {entry.email || entry.phone ? <div className={styles.contacts}><h3>Contato institucional</h3>{entry.email ? <a href={`mailto:${entry.email}`}><Mail size={17} aria-hidden="true"/><span>{entry.email}</span></a> : null}{entry.phone ? <a href={`tel:+55${entry.phone.replace(/\D/g, "")}`}><Phone size={17} aria-hidden="true"/>{entry.phone}</a> : null}</div> : null}
        <div className={styles.review}><span>Revisado no SIFCAS</span><time dateTime={campusReviewedAt}>{campusReviewLabel}</time><p>Resumo de conteúdo público. Confirme alterações e prazos na fonte.</p></div>
      </aside>
    </div>
    <CampusResources title="Continue explorando" slugs={related.map((item) => item.slug)}/>
  </div>;
}
