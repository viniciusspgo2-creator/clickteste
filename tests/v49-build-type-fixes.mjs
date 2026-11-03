/** V4.9 regression: errors found during Vercel's TypeScript step.
 * This focused check uses the real source and minimal external dependency
 * declarations, so it does not depend on the full Next.js install.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('TS2304: checkBeforeExport is actually imported in the Editor',()=>{
 const src=read('src/components/creative/creative-editor.tsx');
 const ast=ts.createSourceFile('editor.tsx',src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const imported=ast.statements.some(stmt=>ts.isImportDeclaration(stmt)
  &&stmt.moduleSpecifier.text==='@/lib/creative/print-check'
  &&stmt.importClause?.namedBindings&&ts.isNamedImports(stmt.importClause.namedBindings)
  &&stmt.importClause.namedBindings.elements.some(spec=>spec.name.text==='checkBeforeExport'));
 assert.ok(imported,'checkBeforeExport must be a runtime named import, not just a type');
 assert.match(src,/useMemo\(\(\)=>checkBeforeExport\(doc\)/);
});

test('TS18048: MP4 exporter type-checks with optional document.video',()=>{
 const file='src/lib/creative/video-templates.ts';
 const original=read(file);
 const importLines="import {Muxer,ArrayBufferTarget} from 'mp4-muxer';\nimport {assertDesignAssetsReady,drawDesign,type DesignDocument,type DesignNode} from './design';";
 assert.ok(original.includes(importLines),'Expected known upstream imports');
 const stub=`
 type DesignNode={x:number;y:number;w:number;h:number;size?:number;shadow?:number;shadowX?:number;shadowY?:number;blur?:number;strokeWidth?:number;curve?:number;wave?:number;tracking?:number;depth?:number;keyframes?:Array<{x:number;y:number;w:number;h:number}>;visible?:boolean;[key:string]:unknown};
 type DesignDocument={width:number;height:number;background:string;nodes:DesignNode[];video?:{src:string;start?:number;end?:number;fit?:'cover'|'contain'}};
 declare class ArrayBufferTarget{buffer:ArrayBuffer;}
 declare class Muxer{constructor(opts:unknown);addVideoChunk(chunk:EncodedVideoChunk,meta?:EncodedVideoChunkMetadata):void;finalize():void;}
 declare function assertDesignAssetsReady(doc:DesignDocument):Promise<void>;
 declare function drawDesign(canvas:HTMLCanvasElement,doc:DesignDocument,time?:number,opts?:{strict:boolean}):Promise<void>;
 `;
 const virtual=path.resolve(root,'tests/__v49_typecheck_virtual.ts');
 const content=original.replace(importLines,stub).replace("import {inspectRenderedMp4} from './mp4-integrity';","declare function inspectRenderedMp4(buffer:ArrayBuffer,expected:{width:number;height:number;frames:number}):unknown;");
 const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,lib:['lib.es2022.d.ts','lib.dom.d.ts'],strict:true,skipLibCheck:true,noEmit:true};
 const host=ts.createCompilerHost(options);
 const readFile=host.readFile.bind(host),fileExists=host.fileExists.bind(host);
 host.readFile=file=>file===virtual?content:readFile(file);
 host.fileExists=file=>file===virtual||fileExists(file);
 const program=ts.createProgram([virtual],options,host);
 const errors=ts.getPreEmitDiagnostics(program).filter(diag=>diag.category===ts.DiagnosticCategory.Error);
 assert.deepEqual(errors.map(diag=>ts.flattenDiagnosticMessageText(diag.messageText,' ')),[]);
});
