"use client";
import { useMockupStore } from "../state/store";
import { EXPORT_RATIOS } from "../lib/config";
export function OutputFormatControl() {
  const st=useMockupStore(), es=st.exportSettings;
  const ids=["sq","portrait","story","wide"];
  return <label title="Formato do arquivo final; não altera a câmera do editor" className="text-xs flex items-center gap-1">Saída <select aria-label="Formato do arquivo final" value={ids.includes(es.ratioId)?es.ratioId:"custom"} onChange={e=>{const id=e.target.value;if(id==="custom"){st.setExportOpen(true);return;}st.setExport({ratioId:id,scale:1});}} className="max-w-40 rounded border bg-background text-foreground p-1">{EXPORT_RATIOS.filter(r=>ids.includes(r.id)).map(r=><option key={r.id} value={r.id}>{r.id==="sq"?"1:1":r.id==="portrait"?"4:5":r.id==="story"?"9:16":"16:9"} · {r.w}×{r.h}</option>)}<option value="custom">Personalizado / mais</option></select></label>;
}
