"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Bell, CalendarClock, ExternalLink, Star } from "lucide-react";
import { effectiveNoticeStatus, formatNoticeDate, isOfficialNoticeUrl, noticeDocumentLabels, noticeIsStale, noticeStatusLabels, type PublicNotice } from "@/lib/public-notices";
import styles from "./editais.module.css";

const preferenceKey = "sifcas-public-notice-favorites-v1";
const eventName = "sifcas-public-notice-favorites";
type Preferences = Record<string, { revision: string }>;
function snapshot() { try { return window.localStorage.getItem(preferenceKey) ?? "{}"; } catch { return "{}"; } }
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener); window.addEventListener(eventName, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(eventName, listener); };
}
function decodePreferences(raw: string): Preferences {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const preferences: Preferences = {};
    for (const [key, item] of Object.entries(value)) {
      if (/^[a-zA-Z0-9_-]{1,120}$/.test(key) && !!item && typeof item === "object" && "revision" in item && typeof item.revision === "string") preferences[key] = { revision: item.revision };
    }
    return preferences;
  } catch { return {}; }
}

export function NoticeCards({ notices, now }: { notices: PublicNotice[]; now: string }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const preferences = decodePreferences(raw);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [feedback, setFeedback] = useState("");
  const visible = favoritesOnly ? notices.filter((notice) => !!preferences[notice.id]) : notices;
  const currentTime = new Date(now);

  function updateFavorite(notice: PublicNotice, acknowledge = false) {
    const next = { ...decodePreferences(snapshot()) };
    if (acknowledge || !next[notice.id]) next[notice.id] = { revision: notice.revision };
    else delete next[notice.id];
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify(next));
      window.dispatchEvent(new Event(eventName));
      setFeedback(acknowledge ? "Atualização marcada como lida." : next[notice.id] ? "Favorito salvo neste navegador." : "Favorito removido.");
    } catch { setFeedback("O navegador bloqueou o armazenamento. Favoritos não foram salvos."); }
  }

  return <>
    <div className={styles.actions}><button className="button soft" type="button" onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly}><Star size={16}/> {favoritesOnly ? "Mostrar todos os resultados" : "Mostrar só favoritos"}</button><span className={styles.muted}>Favoritos ficam neste navegador. Alertas de retificação aparecem ao voltar à central.</span></div>
    <p role="status" aria-live="polite" className={styles.feedback}>{feedback}</p>
    {!visible.length && <div className="infoBox">Você ainda não tem favoritos entre os resultados destes filtros.</div>}
    <div className={styles.noticeGrid}>{visible.map((notice) => {
      const status = effectiveNoticeStatus(notice, currentTime);
      const favorite = !!preferences[notice.id];
      const changed = favorite && preferences[notice.id].revision !== notice.revision;
      const corrections = notice.documents.filter((document) => document.kind === "correction" || document.kind === "extension" || document.kind === "cancellation");
      return <article className={`card ${styles.notice}`} id={notice.id} key={notice.id}>
        <div className={styles.cardHead}><span className="badge">{notice.number}/{notice.year} · {notice.campus}</span><span className={`badge ${styles[status]}`}>{noticeStatusLabels[status]}</span></div>
        <h2>{notice.title}</h2><p>{notice.summary}</p>
        <dl className={styles.facts}><div><dt>Tema e público</dt><dd>{notice.category} · {notice.audience}</dd></div><div><dt>Órgão emissor</dt><dd>{notice.issuer}</dd></div><div><dt>Publicação na fonte</dt><dd>{notice.publishedOn ? notice.publishedOn.split("-").reverse().join("/") : "A confirmar"}</dd></div><div><dt>Abertura das inscrições</dt><dd>{formatNoticeDate(notice.opens)}</dd></div><div><dt>Fechamento informado</dt><dd>{formatNoticeDate(notice.closes)}</dd></div></dl>
        {notice.closes && !notice.closes.timeZone && <p className={styles.muted}>A fonte não confirma o fuso. Horários são reproduzidos como informados; o lembrete usa apenas a data.</p>}
        {noticeIsStale(notice, currentTime) && <div className="infoBox">Revisão desatualizada. Confira prorrogações, novas chamadas e cancelamentos na fonte.</div>}
        {notice.reviewReasons.length > 0 && <div className="infoBox"><strong>Informações a confirmar</strong><ul>{notice.reviewReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}
        {corrections.length > 0 && <p className={styles.correction}><Bell size={16}/> Este edital tem {corrections.length} atualização(ões) relacionada(s). Confira os documentos abaixo.</p>}
        {changed && <div className="infoBox" role="status"><strong>Há uma atualização desde a sua última leitura.</strong><button className="button soft" type="button" onClick={() => updateFavorite(notice, true)}>Marcar atualização como lida</button></div>}
        <details className={styles.documents}><summary>Documentos e histórico ({notice.documents.length})</summary>{notice.sourceSummary && <p><strong>Resumo preservado da origem:</strong> {notice.sourceSummary}. Este trecho não determina vagas ou elegibilidade.</p>}<ul>{notice.documents.map((document) => <li key={document.url}><span>{noticeDocumentLabels[document.kind]} · </span><a href={document.url} target="_blank" rel="noopener noreferrer">{document.title} ↗</a>{document.personalData && <small>Consulta apenas na origem. Nomes e classificações não são copiados.</small>}</li>)}</ul>{!notice.documents.length && <p>Consulte os documentos no link oficial.</p>}{notice.previousVersions?.map((version) => <p key={version.revision}>Versão anterior {version.revision} · {version.summary}</p>)}</details>
        <div className={styles.actions}>
          <a className="button primary" href={notice.canonicalUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Ver edital oficial</a>
          {notice.registrationUrl && isOfficialNoticeUrl(notice.registrationUrl, "registration") && status === "open" && <a className="button soft" href={notice.registrationUrl} target="_blank" rel="noopener noreferrer">Inscrever-se</a>}
          <button className="button soft" type="button" aria-pressed={favorite} onClick={() => updateFavorite(notice)}><Star size={15} fill={favorite ? "currentColor" : "none"}/>{favorite ? "Remover favorito" : "Favoritar"}</button>
          {status === "open" && notice.closes && <a className="button soft" href={`/editais/agenda?id=${encodeURIComponent(notice.id)}&lembrar=1`}><CalendarClock size={15}/> Lembrete 1 dia antes (.ics)</a>}
          {notice.internalPublicationId && <Link className="button soft" href={`/publicacoes/${notice.internalPublicationId}`}>Publicação no SIFCAS</Link>}
        </div>
        <small className={styles.muted}>Revisado em <time dateTime={notice.verifiedOn}>{notice.verifiedOn.split("-").reverse().join("/")}</time> · versão {notice.revision}. O calendário só recebe atualizações quando você importar novamente o arquivo.</small>
      </article>;
    })}</div>
  </>;
}
