/** Lightweight prebuild gate: parse project sources and resolve all local imports.
 * Runs before prisma generate / Next build. No network or database required.
 */
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname,join,relative,resolve,extname} from 'node:path';
import {readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=join(root,'src');
const candidates=p=>[p,...['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.css','.scss','.svg','.png','.webp','.woff','.woff2'].map(ext=>p+ext),...['index.ts','index.tsx','index.js','index.jsx','index.mjs'].map(file=>join(p,file))];
let count=0,imports=0;
const errors=[];
function scan(dir){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(entry.isDirectory()){scan(join(dir,entry.name));continue;}
  if(!/\.[mc]?[jt]sx?$/.test(entry.name))continue;
  const file=join(dir,entry.name),text=readFileSync(file,'utf8');count++;
  const kind=/\.tsx$/.test(file)?ts.ScriptKind.TSX:/\.jsx$/.test(file)?ts.ScriptKind.JSX:ts.ScriptKind.TS;
  const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,kind);
  for(const diag of ast.parseDiagnostics)errors.push(`Sintaxe: ${relative(root,file)}: ${ts.flattenDiagnosticMessageText(diag.messageText,' ')}`);
  const visit=node=>{
   let spec;
   if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))spec=node.moduleSpecifier?.text;
   else if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||node.expression.getText(ast)==='require')&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))spec=node.arguments[0].text;
   if(typeof spec==='string'&&(spec.startsWith('@/')||spec.startsWith('.'))){
    imports++;
    const path=spec.startsWith('@/')?join(src,spec.slice(2)):resolve(dirname(file),spec);
    if(!candidates(path).some(candidate=>existsSync(candidate)&&statSync(candidate).isFile()))errors.push(`Import não encontrado: ${relative(root,file)} → ${spec}`);
   }
   ts.forEachChild(node,visit);
  };
  visit(ast);
 }
}
scan(src);
// Where a Git checkout exists, verify that internal sources are tracked/trackable.
if(existsSync(join(root,'.git'))){
 const result=spawnSync('git',['ls-files','--others','--ignored','--exclude-standard','src'],{cwd:root,encoding:'utf8'});
 if(result.status===0&&result.stdout.trim())errors.push(`Arquivos src/ ignorados pelo Git: ${result.stdout.trim().slice(0,900)}`);
}
console.log(`[verificação de fontes] ${count} arquivos, ${imports} imports locais, ${errors.length} problemas.`);
for(const e of errors.slice(0,60))console.error('✘ '+e);
if(errors.length)process.exitCode=1;
