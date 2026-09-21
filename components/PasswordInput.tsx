"use client";
import { useId, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
export function PasswordInput({ label = "Senha", autoComplete = "current-password" }: { label?: string; autoComplete?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  return <div className="passwordField"><label htmlFor={id}>{label}</label><div className="authInputWrap"><LockKeyhole size={18} aria-hidden="true" /><input id={id} name="password" type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={8} required placeholder="Pelo menos 8 caracteres" aria-describedby={capsLock ? id + "-caps" : undefined} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} /><button type="button" className="passwordToggle" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{capsLock && <small id={id + "-caps"} className="capsLockHint" role="status">Caps Lock está ativado.</small>}</div>;
}
