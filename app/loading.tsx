export default function Loading() {
  return <div className="loadingWorkspace" role="status" aria-label="Carregando conteúdo"><span className="srOnly">Carregando conteúdo do SIFCAS…</span><div className="skeleton skeletonTitle" /><div className="skeleton skeletonSubtitle" /><div className="loadingGrid">{[1, 2, 3].map((item) => <div className="skeleton skeletonCard" key={item} />)}</div><div className="skeleton skeletonPanel" /></div>;
}
