import type {DesignNode} from './design';

export type LayerMove='front'|'forward'|'backward'|'back';
/** A ordem dos nós corresponde à ordem de pintura: índice maior fica mais à frente. */
export function reorderNodes(nodes:readonly DesignNode[],id:string,mode:LayerMove):DesignNode[]{
 const from=nodes.findIndex(node=>node.id===id);
 if(from<0)return [...nodes];
 const max=nodes.length-1;
 const target=mode==='front'?max:mode==='back'?0:Math.max(0,Math.min(max,from+(mode==='forward'?1:-1)));
 if(from===target)return [...nodes];
 const reordered=[...nodes];
 const [moved]=reordered.splice(from,1);
 reordered.splice(target,0,moved);
 return reordered;
}
/** Espelha sem modificar pixels nem arquivos externos; funciona com texto, imagens e formas. */
export function mirrorNode(node:DesignNode,axis:'horizontal'|'vertical'):DesignNode{
 return axis==='horizontal'?{...node,flipX:!node.flipX}:{...node,flipY:!node.flipY};
}
