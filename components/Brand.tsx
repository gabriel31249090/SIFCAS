import Image from "next/image";
export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brandIdentity">
    <span className="brandSymbol"><Image src="/brand/sifcas-mark.webp" alt="" width={44} height={44} priority /></span>
    {!compact && <span className="brandWordmark"><strong>SIFCAS<span className="brandPeriod">.</span></strong><small>Campus, pessoas e serviços</small></span>}
  </span>;
}
