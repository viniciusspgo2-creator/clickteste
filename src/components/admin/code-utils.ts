export type AccessRow = { code:string; clientName:string; clientType:string; active:boolean; bound:boolean; accessMode:"individual"|"universal"; maxUses:number; uses:number; expiresAt:string|null; note:string; lastUsedAt:string|null; createdAt?:string };
export function codeStatus(code: AccessRow, now = Date.now()) {
  if (!code.active) return 'revoked' as const;
  if (code.expiresAt && new Date(code.expiresAt).getTime() <= now) return 'expired' as const;
  return code.bound ? 'active' as const : 'pending' as const;
}
export const STATUS_LABELS = { active:'Ativado', pending:'Aguardando', expired:'Expirado', revoked:'Revogado' };
export function codesCsv(rows: Pick<AccessRow,'code'|'clientName'|'clientType'|'expiresAt'>[]) {
  const cell = (value:string) => '"' + (/^[=+\-@\t\r]/.test(value) ? "'" + value : value).replace(/"/g,'""') + '"';
  return '\uFEFF' + [['Cliente','Código','Tipo','Validade'],...rows.map(row=>[row.clientName,row.code,row.clientType==='library'?'Biblioteca':'Temporário',row.expiresAt??'Sem prazo'])].map(row=>row.map(cell).join(';')).join('\r\n');
}
