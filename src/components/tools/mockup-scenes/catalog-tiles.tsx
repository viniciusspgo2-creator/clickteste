"use client";
import { Plus } from "lucide-react";
import type { SceneBackground, SceneModel } from "@/lib/mockup-scenes/types";
export function BackgroundTiles({
  items,
  selected,
  onSelect,
}: {
  items: SceneBackground[];
  selected: string | null;
  onSelect: (src: string) => void;
}) {
  return (
    <div className="sc-catalog-grid">
      {items.map((m) => (
        <button
          key={m.id}
          aria-label={m.name}
          aria-pressed={selected === m.imageUrl}
          onClick={() => onSelect(m.imageUrl)}
        >
          <img
            loading="lazy"
            src={
              m.thumbnailUrl ??
              (m.imageUrl.startsWith("/api/")
                ? `${m.imageUrl}?thumb=1`
                : m.imageUrl)
            }
            alt={m.name}
          />
          <span>{m.name}</span>
        </button>
      ))}
    </div>
  );
}
export function ModelTiles({
  items,
  onSelect,
}: {
  items: SceneModel[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sc-catalog-grid">
      {items.map((m) => (
        <button key={m.id} aria-label={m.name} onClick={() => onSelect(m.id)}>
          <img
            loading="lazy"
            src={
              m.thumbnailUrl ??
              (m.imageUrl.startsWith("/api/")
                ? `${m.imageUrl}?thumb=1`
                : m.imageUrl)
            }
            alt={m.name}
          />
          <span>
            {m.name}
            <Plus size={13} />
          </span>
        </button>
      ))}
    </div>
  );
}
