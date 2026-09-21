import Link from "next/link";
import { MapPinOff } from "lucide-react";
export default function NotFound() {
  return <section className="card centerState"><span className="stateIcon"><MapPinOff size={28} /></span><p className="sectionEyebrow">PÁGINA NÃO ENCONTRADA</p><h1>Este caminho não está disponível.</h1><p>O endereço pode ter mudado. Use a busca ou explore os aplicativos do campus.</p><div className="stateActions"><Link className="button primary" href="/aplicativos">Explorar aplicativos</Link><Link className="button soft" href="/buscar">Buscar no SIFCAS</Link></div></section>;
}
