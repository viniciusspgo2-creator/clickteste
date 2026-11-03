/** Safe transition from a smart scene to an ordinary, flat background/template.
 * Existing user artwork (including the mug) remains intact. Scene-only layers
 * and their automatic masks must not leak into the replacement background.
 */
import type {DesignDocument,DesignNode} from './design';

export function detachAutomaticSmartMask(doc:DesignDocument):DesignNode[]{
 const oldAutomatic=doc.smartTemplate?.maskSrc;
 if(!oldAutomatic)return doc.nodes;
 return doc.nodes.map(node=>{
  if(node.role!=='mockup'||node.maskSrc!==oldAutomatic)return node;
  const {maskSrc,maskMode,maskInvert,maskSpace,...unmasked}=node;
  return unmasked;
 });
}

export function replaceFlatScene(doc:DesignDocument,sceneNode:DesignNode):DesignDocument{
 if(sceneNode.role!=='background'&&sceneNode.role!=='template')
  throw new Error('A camada de cenário precisa ser um fundo ou template.');
 const keep=detachAutomaticSmartMask(doc).filter(n=>
  n.role!=='background'&&n.role!=='template'&&n.role!=='foreground');
 return {...doc,smartTemplate:undefined,nodes:[sceneNode,...keep]};
}

/** Async imports must never overwrite work done while a large file was loading. */
export function isStillCurrentDocument(captured:DesignDocument,current:DesignDocument):boolean{
 return captured===current;
}

/** An older async template must never replace a newer choice or intervening edits.
 * A change of selection/panel alone does not invalidate a document import.
 */
export function canCommitAsyncTemplate(
 requestId:number,latestRequestId:number,captured:DesignDocument,current:DesignDocument,
):boolean{
 return requestId===latestRequestId&&isStillCurrentDocument(captured,current);
}
