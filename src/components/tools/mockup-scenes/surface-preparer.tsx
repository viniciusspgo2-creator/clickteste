"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Eye, Grid3X3, Loader2 } from "lucide-react";
import {
  DEFAULT_PLACEMENT,
  type Artwork,
  type Point,
  type Surface,
} from "@/lib/mockup-scenes/types";
import { renderPiece, surfacePoint } from "@/lib/mockup-scenes/render";

const CORNERS = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;
const NAMES = {
  topLeft: "Topo esquerdo",
  topRight: "Topo direito",
  bottomLeft: "Base esquerda",
  bottomRight: "Base direita",
};
function calibrationArt(): Artwork {
  const c = document.createElement("canvas");
  c.width = 1000;
  c.height = 1200;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f9f5eb";
  ctx.fillRect(0, 0, 1000, 1200);
  for (let x = 0; x <= 10; x++) {
    ctx.strokeStyle = x % 2 ? "#e4b571" : "#2d786c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x * 100, 0);
    ctx.lineTo(x * 100, 1200);
    ctx.stroke();
  }
  for (let y = 0; y <= 12; y++) {
    ctx.strokeStyle = y % 2 ? "#e4b571" : "#2d786c";
    ctx.beginPath();
    ctx.moveTo(0, y * 100);
    ctx.lineTo(1000, y * 100);
    ctx.stroke();
  }
  ctx.fillStyle = "#f9f5eb";
  ctx.fillRect(160, 450, 680, 300);
  ctx.fillStyle = "#234e44";
  ctx.textAlign = "center";
  ctx.font = "bold 70px sans-serif";
  ctx.fillText("SUA ARTE", 500, 570);
  ctx.font = "30px sans-serif";
  ctx.fillText("Confira proporção e curvatura", 500, 640);
  return {
    src: c.toDataURL(),
    width: 1000,
    height: 1200,
    name: "Grade de calibração",
  };
}
export function SurfacePreparer({
  src,
  width,
  height,
  value,
  onChange,
  onReviewed,
}: {
  src: string;
  width: number;
  height: number;
  value: Surface;
  onChange: (s: Surface) => void;
  onReviewed: () => void;
}) {
  const [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [art] = useState(calibrationArt),
    canvas = useRef<HTMLCanvasElement>(null),
    area = useRef<HTMLDivElement>(null),
    drag = useRef<(typeof CORNERS)[number] | null>(null);
  useEffect(() => {
    if (!preview) return;
    let cancelled = false;
    setBusy(true);
    setError("");
    const timer = setTimeout(
      () =>
        renderPiece(
          {
            id: "calibrate",
            modelId: "calibration",
            x: 0.5,
            y: 0.5,
            width: 1,
            art,
            placement: { ...DEFAULT_PLACEMENT },
            shadow: 0,
            hidden: false,
            locked: false,
          },
          {
            id: "calibration",
            name: "Calibração",
            category: "",
            imageUrl: src,
            width,
            height,
            mapping: { kind: "cylinder", surface: value },
          },
          900,
        )
          .then((c) => {
            if (cancelled) return;
            if (canvas.current) {
              canvas.current.width = c.width;
              canvas.current.height = c.height;
              canvas.current.getContext("2d")?.drawImage(c, 0, 0);
            }
            onReviewed();
          })
          .catch((e) => {
            if (!cancelled) setError(e.message);
          })
          .finally(() => {
            if (!cancelled) setBusy(false);
          }),
      100,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [src, width, height, value, preview, art, onReviewed]);
  function move(e: PointerEvent<HTMLDivElement>) {
    const key = drag.current,
      rect = area.current?.getBoundingClientRect();
    if (!key || !rect) return;
    onChange({
      ...value,
      [key]: [
        Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      ],
    });
  }
  const lines = Array.from({ length: 9 }, (_, i) => i / 8);
  return (
    <div className="sc-preparer">
      <div className="sc-preparer-tools">
        <button
          type="button"
          className={preview ? "sc-secondary" : "sc-primary"}
          onClick={() => setPreview(false)}
        >
          <Grid3X3 size={14} />
          Marcar a impressão
        </button>
        <button
          type="button"
          className={preview ? "sc-primary" : "sc-secondary"}
          onClick={() => setPreview(true)}
        >
          <Eye size={14} />
          Conferir estampa
        </button>
      </div>
      <p className="sc-muted">
        Arraste os quatro pontos até os limites da área imprimível. Deixe a
        alça, a borda e o interior fora dela.
      </p>
      <div
        ref={area}
        className="sc-preparer-image sc-checker"
        style={{ aspectRatio: `${width}/${height}` }}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {preview ? (
          <canvas ref={canvas} />
        ) : (
          <>
            <img src={src} alt="Caneca sem estampa para preparação do modelo" />
            <svg
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {lines.map((u) => (
                <path
                  key={`u${u}`}
                  d={lines
                    .map((v, i) => {
                      const [x, y] = surfacePoint(value, u, v);
                      return `${i ? "L" : "M"}${x * 1000} ${y * 1000}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#51b18d"
                  strokeWidth="2"
                />
              ))}
              {lines.map((v) => (
                <path
                  key={`v${v}`}
                  d={Array.from({ length: 41 }, (_, j) => j / 40)
                    .map((u, i) => {
                      const [x, y] = surfacePoint(value, u, v);
                      return `${i ? "L" : "M"}${x * 1000} ${y * 1000}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#51b18d"
                  strokeWidth="2"
                />
              ))}
            </svg>
            {CORNERS.map((k) => (
              <button
                type="button"
                key={k}
                className="sc-surface-point"
                aria-label={`Mover ${NAMES[k]}`}
                style={{
                  left: `${value[k][0] * 100}%`,
                  top: `${value[k][1] * 100}%`,
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  drag.current = k;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onKeyDown={(e) => {
                  const delta: Record<string, Point> = {
                    ArrowLeft: [-0.002, 0],
                    ArrowRight: [0.002, 0],
                    ArrowUp: [0, -0.002],
                    ArrowDown: [0, 0.002],
                  };
                  if (delta[e.key]) {
                    e.preventDefault();
                    onChange({
                      ...value,
                      [k]: value[k].map((v, i) =>
                        Math.max(0, Math.min(1, v + delta[e.key][i])),
                      ) as Point,
                    });
                  }
                }}
              />
            ))}
          </>
        )}
        {busy && (
          <span className="sc-preparer-loading">
            <Loader2 className="sc-spin" size={16} />
            Preparando estampa…
          </span>
        )}
      </div>
      {error && (
        <p className="sc-catalog-error" role="alert">
          {error}
        </p>
      )}
      <label className="sc-range">
        <span>
          Curvatura vertical
          <output>{Math.round(value.curvature * 100)}%</output>
        </span>
        <input
          aria-label="Curvatura vertical da impressão"
          type="range"
          min="-15"
          max="25"
          step=".5"
          value={value.curvature * 100}
          onChange={(e) =>
            onChange({ ...value, curvature: Number(e.target.value) / 100 })
          }
        />
      </label>
      <p className="sc-muted">
        O modelo deve ser uma caneca branca, recortada, sem estampa, com
        iluminação neutra. Fotos criadas por IA também precisam desta
        preparação. Modelos com mãos ou objetos na frente da impressão precisam
        de máscaras adicionais antes do cadastro.
      </p>
    </div>
  );
}
