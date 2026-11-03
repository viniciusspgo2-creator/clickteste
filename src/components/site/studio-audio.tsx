"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Headphones, Pause, Play, RotateCcw } from "lucide-react";

const AUDIO_DURATION_SECONDS = 36.73;

function timeLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

/** Audio is never played automatically. The only starting action is the user's click. */
export function StudioAudioIntroduction() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(AUDIO_DURATION_SECONDS);
  const [error, setError] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setError(false);
    setLoading(true);
    if (audio.ended) audio.currentTime = 0;
    // play() is invoked directly from the button click (required on iOS/mobile browsers).
    audio.play().catch(() => {
      setLoading(false);
      setPlaying(false);
      setError(true);
    });
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setElapsed(0);
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = seconds;
    setElapsed(seconds);
  };

  return (
    <div className="cg-audio-intro" role="group" aria-label="Apresentação em áudio do Studio Mockup 3D">
      <audio
        ref={audioRef}
        src="/audio/apresentacao-click-studio-3d.mp3"
        preload="none"
        onLoadedMetadata={(event) => {
          const seconds = event.currentTarget.duration;
          if (Number.isFinite(seconds) && seconds > 0) setDuration(seconds);
        }}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onPlaying={() => { setPlaying(true); setLoading(false); }}
        onPause={() => { setPlaying(false); setLoading(false); }}
        onWaiting={() => setLoading(true)}
        onEnded={() => { setPlaying(false); setLoading(false); setElapsed(0); }}
        onError={() => { setPlaying(false); setLoading(false); setError(true); }}
      />
      <button className="cg-audio-play" type="button" onClick={toggle} aria-label={playing ? "Pausar apresentação em áudio" : "Reproduzir apresentação em áudio"} aria-pressed={playing}>
        {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
      </button>
      <div className="cg-audio-info">
        <div className="cg-audio-heading"><Headphones size={14} aria-hidden="true" /><strong>Conheça o Studio em 37 segundos</strong></div>
        <div className="cg-audio-progress-row">
          <label className="sr-only" htmlFor="cg-audio-seek">Posição do áudio</label>
          <input
            id="cg-audio-seek"
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={Math.min(elapsed, duration)}
            aria-valuetext={`${timeLabel(elapsed)} de ${timeLabel(duration)}`}
            onChange={(event) => seek(Number(event.target.value))}
            style={{ "--cg-audio-progress": `${Math.min(100, (elapsed / duration) * 100)}%` } as CSSProperties}
          />
          <span className="cg-audio-clock" aria-label="Tempo do áudio">{timeLabel(elapsed)} / {timeLabel(duration)}</span>
        </div>
        {error && <p className="cg-audio-error" role="status">Não foi possível carregar o áudio. Tente novamente.</p>}
        {!playing && !loading && !error && elapsed === 0 && <span className="cg-audio-hint">Só começa quando você clicar em reproduzir.</span>}
      </div>
      {elapsed > 0 && <button className="cg-audio-restart" type="button" onClick={restart} aria-label="Voltar ao início do áudio" title="Voltar ao início"><RotateCcw size={15} /></button>}
      {loading && <span className="cg-audio-loading" role="status" aria-live="polite">Carregando…</span>}
    </div>
  );
}
