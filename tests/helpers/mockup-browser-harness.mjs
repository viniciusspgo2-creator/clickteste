/** Real Studio components, isolated from Next hosting, auth and production data.
 * Tooling may live outside the project: STUDIO_TEST_TOOLS=/tmp/studio-tools.
 */
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export const root = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(path.join(root, "package.json"));
export const toolRequire = process.env.STUDIO_TEST_TOOLS
  ? createRequire(path.resolve(process.env.STUDIO_TEST_TOOLS, "package.json")) : require;

export async function startStudioHarness({ noticesOnly = false, withEditor = false } = {}) {
  const output = process.env.STUDIO_TEST_OUTPUT || await fs.mkdtemp(path.join(os.tmpdir(), "clicktools-preview-"));
  await fs.mkdir(output, { recursive: true });
  const { build } = toolRequire("esbuild");
  // These handles exist only in this test bundle, never in application source.
  const entry = `
    import React from ${JSON.stringify(path.join(root, "node_modules/react/index.js"))};
    import {createRoot} from ${JSON.stringify(path.join(root, "node_modules/react-dom/client.js"))};
    import {MockupStudio} from ${JSON.stringify(path.join(root, "src/components/tools/mockup/mockup-studio.tsx"))};
    import {useMockupStore as store} from ${JSON.stringify(path.join(root, "src/components/tools/mockup/state/store.ts"))};
    import {studioRefs as refs} from ${JSON.stringify(path.join(root, "src/components/tools/mockup/scene/studio-refs.ts"))};
    import * as art from ${JSON.stringify(path.join(root, "src/components/tools/mockup/lib/art-registry.ts"))};
    import * as backgrounds from ${JSON.stringify(path.join(root, "src/components/tools/mockup/lib/background-registry.ts"))};
    import * as frames from ${JSON.stringify(path.join(root, "src/components/tools/mockup/exporters/frame-capture.ts"))};
    import * as video from ${JSON.stringify(path.join(root, "src/components/tools/mockup/exporters/video-exporter.ts"))};
    import * as images from ${JSON.stringify(path.join(root, "src/components/tools/mockup/exporters/image-exporter.ts"))};
    import * as projects from ${JSON.stringify(path.join(root, "src/components/tools/mockup/ui/projects-dialog.tsx"))};
    import * as portable from ${JSON.stringify(path.join(root, "src/components/tools/mockup/lib/portable-project.ts"))};
    import {StudioAnnouncements} from ${JSON.stringify(path.join(root, "src/components/tools/mockup/ui/studio-announcements.tsx"))};
    import {AnnouncementsPanel} from ${JSON.stringify(path.join(root, "src/components/admin/announcements-panel.tsx"))};
    import * as handoff from ${JSON.stringify(path.join(root, "src/lib/creative/handoff.ts"))};
    ${withEditor ? `import {CreativeEditor} from ${JSON.stringify(path.join(root, "src/components/creative/creative-editor.tsx"))};import {prepareMockupHandoff} from ${JSON.stringify(path.join(root, "src/lib/creative/mockup-handoff-document.ts"))};import * as creativeProjects from ${JSON.stringify(path.join(root, "src/lib/creative/browser-projects.ts"))};` : ""}
    let exporting=refs.exporting, captures=0;
    Object.defineProperty(refs,'exporting',{get:()=>exporting,set:v=>{if(v&&!exporting)captures++;exporting=v;},configurable:true});
    const urls=new Map(), created=URL.createObjectURL.bind(URL), revoked=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=b=>{const u=created(b);urls.set(u,b);return u;};
    URL.revokeObjectURL=u=>{urls.delete(u);revoked(u);};
    window.studioTest={store,refs,art,images,video,backgrounds,frames,projects,portable,urls,handoff,${withEditor ? "prepareMockupHandoff,creativeProjects," : ""}get captures(){return captures;}};
    createRoot(document.getElementById('root')).render(${noticesOnly ? "<><StudioAnnouncements/><AnnouncementsPanel refreshKey={0} onUnauthorized={()=>{window.noticeUnauthorized=true;}}/></>" : withEditor ? "window.location.pathname.startsWith('/editor-artes')?<CreativeEditor/>:<MockupStudio/>" : "<MockupStudio/>"});
  `;
  await build({ stdin: { contents: entry, resolveDir: root, loader: "tsx" }, absWorkingDir: root,
    tsconfig: path.join(root, "tsconfig.json"), nodePaths: [path.join(root, "node_modules")], bundle: true,
    outfile: path.join(output, "bundle.js"), platform: "browser", format: "esm", external: ['/cg-editor/*'],
    define: { "process.env.NODE_ENV": '"development"' }, logLevel: "warning",
    plugins: [{name:"isolated-next-boundaries",setup(builder){
      builder.onResolve({filter:/^next\/(dynamic|navigation|link)$/},args=>({path:args.path,namespace:"isolated-next"}));
      builder.onLoad({filter:/.*/,namespace:"isolated-next"},args=>({resolveDir:root,contents:args.path==='next/dynamic'
        ? "import React from 'react';export default function dynamic(load,options={}){const Lazy=React.lazy(()=>load().then(module=>({default:module.default||module})));return function Dynamic(props){return React.createElement(React.Suspense,{fallback:options.loading?React.createElement(options.loading):null},React.createElement(Lazy,props));};}"
        : args.path==='next/link'
          ? "import React from 'react';export default function Link({href,...props}){return React.createElement('a',{href,...props});}"
          : "export function useRouter(){return {push(url){window.__studioNavigation=url;window.history.pushState(null,'',url);},replace(url){window.history.replaceState(null,'',url);},refresh(){}};}export function usePathname(){return window.location.pathname;}export function useSearchParams(){return new URLSearchParams(window.location.search);}"}));
    }}] });
  const postcss = require("postcss"), tailwind = require("@tailwindcss/postcss");
  const from = path.join(root, "src/app/globals.css");
  const css = await postcss([tailwind({ base: root })]).process(await fs.readFile(from, "utf8"), { from });
  await fs.writeFile(path.join(output, "global.css"), css.css);
  await fs.writeFile(path.join(output, "index.html"), `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/bundle.css"><style>body{margin:0;font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>`);
  const server = http.createServer(async (req, res) => {
    try {
      const name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (name.startsWith('/api/')) {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,items:[],total:0}));return;}
      const fixtures = path.join(root, "tests/fixtures/mockup-preview");
      const base = name.startsWith("/fixtures/") ? fixtures : /^\/(mockup|cg-editor|creative-library|fonts)\//.test(name) ? path.join(root, "public") : output;
      const relative = name.startsWith("/fixtures/") ? name.slice("/fixtures".length) : name === "/" || withEditor && name.startsWith('/editor-artes') ? "/index.html" : name;
      const file = path.resolve(base, "." + relative);
      if (!file.startsWith(base + path.sep)) { res.writeHead(403); res.end(); return; }
      const data = await fs.readFile(file);
      res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" })[path.extname(file)] || "application/octet-stream");
      res.end(data);
    } catch { res.writeHead(404); res.end("not found"); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { output, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}
