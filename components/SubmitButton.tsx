"use client";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
export function SubmitButton({ children, pendingLabel = "Aguarde…", className = "authPrimary" }: { children: React.ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending}>{pending ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}{pending ? pendingLabel : children}{!pending && <ArrowRight size={18} aria-hidden="true" />}</button>;
}
