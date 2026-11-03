/** Shared validation for individual and atomic batch creation. Never accepts credential values. */
export function parseCodeCreation(body: Record<string, unknown>, now = new Date()) {
  const clean = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
  if (!["library", "standalone"].includes(String(body.clientType))) throw new Error("Selecione o tipo de acesso.");
  const clientType = body.clientType as "library" | "standalone";
  let names: string[];
  if (body.clientNames !== undefined) {
    if (!Array.isArray(body.clientNames) || !body.clientNames.length || body.clientNames.length > 100)
      throw new Error("Informe de 1 a 100 clientes por lote.");
    names = body.clientNames.map(value => {
      if (typeof value !== "string" || !value.trim() || value.trim().length > 120)
        throw new Error("Cada cliente precisa de um nome de até 120 caracteres.");
      return value.trim();
    });
  } else {
    const count = body.count ?? 1;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 100)
      throw new Error("A quantidade deve ser um número inteiro de 1 a 100.");
    const name = clean(body.clientName);
    if (!name) throw new Error("Informe o nome do cliente ou do lote.");
    names = Array.from({ length: count }, (_, index) => count === 1 ? name : `${name.slice(0, 114)} · ${String(index + 1).padStart(3, "0")}`);
  }
  let expiresAt: Date | null = clientType === "standalone" ? new Date(now.getTime() + 86400000) : null;
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null && clientType === "library") expiresAt = null;
    else {
      const date = new Date(String(body.expiresAt));
      if (!Number.isFinite(date.getTime()) || date <= now) throw new Error("Escolha uma validade futura.");
      expiresAt = date;
    }
  }
  return { names, clientType, expiresAt, note: clean(body.note),
    prefix: clean(body.prefix, 8).toUpperCase().replace(/[^A-Z0-9]/g, "") || "CG" };
}
