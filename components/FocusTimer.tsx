"use client";

import { useEffect, useRef, useState } from "react";
import { Flower2, Leaf, Pause, Play, RotateCcw, Sprout, Sun, Timer } from "lucide-react";
import { useStudentExperience } from "./StudentExperienceProvider";

export function FocusTools({ compact = false }: { compact?: boolean }) {
  const { preferences, update } = useStudentExperience();
  const [seconds, setSeconds] = useState(preferences.focusDuration * 60);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const deadline = useRef(0);
  const [sessionMinutes, setSessionMinutes] = useState(preferences.focusDuration);
  const configuredMinutes = useRef(preferences.focusDuration);
  const completed = useRef(false);
  const todayKey = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Cuiaba" });
  const todayMinutes = preferences.focusDate === todayKey ? preferences.focusMinutes : 0;

  useEffect(() => {
    if (running || configuredMinutes.current === preferences.focusDuration) return;
    const frame = window.requestAnimationFrame(() => {
      configuredMinutes.current = preferences.focusDuration;
      setSessionMinutes(preferences.focusDuration);
      completed.current = false;
      setSeconds(preferences.focusDuration * 60);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [preferences.focusDuration, running]);

  useEffect(() => {
    if (!running) return;
    function tick() {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining !== 0 || completed.current) return;
      completed.current = true;
      setRunning(false);
      const date = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Cuiaba" });
      update((current) => ({ ...current, focusDate: date, focusMinutes: (current.focusDate === date ? current.focusMinutes : 0) + sessionMinutes, focusSessions: current.focusSessions + 1 }));
      setNotice(`Sessão concluída! Mais ${sessionMinutes} minutos para sua meta.`);
      if (preferences.soundEffects) {
        try {
          const audio = new AudioContext();
          const oscillator = audio.createOscillator(), gain = audio.createGain();
          oscillator.frequency.value = 740;
          gain.gain.setValueAtTime(0.08, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
          oscillator.connect(gain).connect(audio.destination);
          oscillator.start(); oscillator.stop(audio.currentTime + 0.35);
          oscillator.onended = () => { void audio.close(); };
        } catch { setNotice("Sessão concluída! O aviso sonoro não está disponível neste navegador."); }
      }
    }
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [running, update, preferences.soundEffects, sessionMinutes]);

  function start() {
    const remaining = seconds > 0 ? seconds : preferences.focusDuration * 60;
    if (seconds <= 0 || seconds === preferences.focusDuration * 60) setSessionMinutes(preferences.focusDuration);
    completed.current = false;
    deadline.current = Date.now() + remaining * 1000;
    setSeconds(remaining); setRunning(true); setNotice("Foco iniciado. Uma coisa de cada vez.");
  }
  function pause() { setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))); setRunning(false); setNotice("Sessão pausada. Retome quando quiser."); }
  function reset() { setRunning(false); completed.current = false; setSeconds(preferences.focusDuration * 60); setSessionMinutes(preferences.focusDuration); setNotice("Temporizador reiniciado."); }
  const progress = Math.min(100, Math.round(todayMinutes / preferences.studyGoalMinutes * 100));
  const clock = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return <section className={`studioSection studioFocusSection${compact ? " studioFocusCompact" : ""}`}><div className="studioSectionHeading"><span><Timer size={20}/></span><div><h2>Um tempo só para focar</h2><p>Escolha sua meta, respire fundo e comece. Mantenha esta página aberta durante a sessão.</p></div></div>
    <div className="studioFocusLayout"><div className="studioFocusClock" data-running={running}><div className="studioFocusRing"><Leaf size={20}/><strong aria-label={`${Math.floor(seconds / 60)} minutos e ${seconds % 60} segundos`}>{clock}</strong><span>{running ? "Você está indo bem" : seconds === 0 ? "Boa! Mais uma conquista" : "Seu próximo pequeno passo"}</span></div><div className="studioFocusActions"><button className="button primary" type="button" onClick={running ? pause : start}>{running ? <Pause size={15}/> : <Play size={15}/>} {running ? "Pausar" : seconds < sessionMinutes * 60 && seconds > 0 ? "Continuar foco" : "Iniciar foco"}</button><button className="button soft" type="button" aria-label="Reiniciar temporizador" onClick={reset}><RotateCcw size={16}/></button></div></div><div className="studioFocusSettings"><label>Meta diária de estudo (minutos)<input type="number" min="10" max="1440" step="10" value={preferences.studyGoalMinutes} onChange={(event) => update({ studyGoalMinutes: Number(event.target.value) })}/></label><label>Duração do foco (minutos)<input type="number" min="1" max="120" value={preferences.focusDuration} disabled={running || (seconds > 0 && seconds < sessionMinutes * 60)} onChange={(event) => { const minutes = Math.max(1, Math.min(120, Number(event.target.value))); update({ focusDuration: minutes }); setSeconds(minutes * 60); setSessionMinutes(minutes); }}/></label><div className="studioGoal"><div><strong>{todayMinutes} <small>/ {preferences.studyGoalMinutes} min</small></strong><span>{progress}% da meta</span></div><progress value={todayMinutes} max={preferences.studyGoalMinutes} aria-label="Progresso da meta diária"/><p>{progress >= 100 ? "Meta alcançada. Seu esforço faz a diferença!" : `Mais ${preferences.studyGoalMinutes - todayMinutes} minutos para sua meta de hoje.`}</p></div></div></div>
    <p className="studioStatus" role="status">{notice}</p>
    {!compact && <div className="studioAchievements"><div data-locked={preferences.focusSessions === 0}><span><Sprout size={22}/></span><strong>Primeiro passo</strong><small>Conclua uma sessão</small></div><div data-locked={preferences.focusSessions < 5}><span><Flower2 size={22}/></span><strong>Criando raízes</strong><small>Conclua cinco sessões</small></div><div data-locked={progress < 100}><span><Sun size={22}/></span><strong>Dia produtivo</strong><small>Alcance sua meta diária</small></div></div>}
    <p className="studioFinePrint">{preferences.focusSessions} sessões concluídas neste navegador. Metas e conquistas são pessoais.</p>
  </section>;
}

