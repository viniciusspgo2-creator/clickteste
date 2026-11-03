/** Stable IDs are saved in .cgstudio projects. Never rename an existing ID. */
export const HANDLE_STYLES = [
  {
    id: "classic",
    label: "Original",
    description: "Clássica e compacta",
    path: "M22 18C32 18 31 13 40 17C58 24 59 48 43 54C34 59 31 55 22 55",
    color: "#ffffff",
  },
  {
    id: "livesub",
    label: "Referência 325 ml",
    description: "Perfil D 325 ml · inspirado na foto",
    path: "M22 16C38 16 56 19 59 33C63 49 52 59 37 59C30 59 26 57 22 57",
    color: "#ffffff",
  },
  {
    id: "rounded",
    label: "Arredondada",
    description: "Formato D · alongada",
    path: "M22 13C40 11 58 12 59 35C60 58 43 62 22 59",
    color: "#ffffff",
  },
  {
    id: "spoon",
    label: "Com colher",
    description: "Alça D + colher encaixada",
    path: "M22 16C43 15 62 24 62 36C62 49 42 57 22 58",
    color: "#17191b",
  },
  {
    id: "heart-asymmetric",
    label: "Coração assimétrico",
    description: "Recorte superior · azul",
    path: "M22 15C32 14 32 30 37 27C71 12 76 41 54 52L22 64",
    color: "#18a6ca",
  },
  {
    id: "heart",
    label: "Coração",
    description: "Dois arcos · rosa",
    path: "M22 24C19 5 35 5 44 22C65 9 80 25 65 43L38 61C27 55 21 36 22 24",
    color: "#f67587",
  },
  {
    id: "oval-gold",
    label: "Oval",
    description: "Perfil oval · cerâmica",
    path: "M22 11C71 7 75 65 22 60",
    color: "#ffffff",
  },
] as const;

export type HandleStyle = (typeof HANDLE_STYLES)[number]["id"];
export function normalizeHandleStyle(value: unknown): HandleStyle {
  return HANDLE_STYLES.some((s) => s.id === value)
    ? (value as HandleStyle)
    : "classic";
}
