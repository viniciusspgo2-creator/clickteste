// Optional asset authoring tool. Runtime uses the committed PNGs, never WebGL.
// Requires local Chromium and Playwright; run from the repository root.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import Module, { createRequire } from "node:module";

const require = createRequire(import.meta.url),
  ts = require("typescript"),
  { chromium } = require("playwright");
Module._extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const {
  buildModel,
} = require("../src/components/tools/mockup/scene/model-geometry.ts");
const out = path.resolve("public/mockup-scenes/models");
fs.mkdirSync(out, { recursive: true });
const sharp = require("sharp");
const previews = path.resolve("public/mockup-scenes/previews");
const thumbs = path.resolve("public/mockup-scenes/thumbs");
fs.mkdirSync(previews, { recursive: true });
fs.mkdirSync(thumbs, { recursive: true });
const geometry = buildModel();
const THREE = require("three");
const data = {
  body: new THREE.BufferGeometry().copy(geometry.body).toJSON(),
  handle: new THREE.BufferGeometry().copy(geometry.handle).toJSON(),
};
const server = http.createServer((req, res) => {
  if (req.url === "/data") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
    return;
  }
  if (req.url.startsWith("/three/")) {
    const f = path.resolve("node_modules/three/build", req.url.slice(7));
    res.setHeader("Content-Type", "text/javascript");
    res.end(fs.readFileSync(f));
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end(`<script type="module">
 import * as T from '/three/three.module.js';
 const g=await (await fetch('/data')).json(),parse=new T.BufferGeometryLoader();
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(4096,4096);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.setClearColor(0x000000,0);document.body.append(renderer.domElement);
 const scene=new T.Scene();const cam=new T.PerspectiveCamera(24,1,.1,200);
 const group=new T.Group();scene.add(group);
 const mat=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.16,metalness:0,clearcoat:1,clearcoatRoughness:.09,envMapIntensity:.55,side:T.FrontSide});
 const body=new T.Mesh(parse.parse(g.body),mat),handle=new T.Mesh(parse.parse(g.handle),mat);group.add(body,handle);body.castShadow=true;body.receiveShadow=true;handle.castShadow=true;handle.receiveShadow=true;
 const ambient=new T.HemisphereLight(0xffffff,0xbbb2a2,.7);scene.add(ambient);
 const key=new T.DirectionalLight(0xffffff,2.8);key.position.set(-15,22,20);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=15;key.shadow.camera.bottom=-12;key.shadow.camera.far=70;key.shadow.bias=-.0001;key.shadow.normalBias=.02;scene.add(key);
 const fill=new T.DirectionalLight(0xdce9ff,.5);fill.position.set(15,10,-10);scene.add(fill);
 // A procedural photographic light tent provides broad specular reflections.
 const env=new T.Scene();env.background=new T.Color(.18,.18,.18);
 for(const [x,y,z,w,h,power] of [[-9,7,4,7,18,6],[8,8,5,5,16,3],[0,20,0,15,15,4]]){
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(power,power,power),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,5,0);env.add(m);
 }
 const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.08).texture;
 const uvMaterial=new T.ShaderMaterial({vertexShader:'varying vec2 uvp;void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 uvp;void main(){if(uvp.y < .061) discard;float u=floor(fract(uvp.x)*4095.+.5);float v=floor(clamp((uvp.y-.0625)*10.24/9.55,0.,1.)*4095.+.5);gl_FragColor=vec4(floor(u/16.)/255.,floor(v/16.)/255.,(mod(u,16.)*16.+mod(v,16.))/255.,1.);}',side:T.DoubleSide});
 const uvRenderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});uvRenderer.setSize(4096,4096);uvRenderer.outputColorSpace=T.LinearSRGBColorSpace;uvRenderer.toneMapping=T.NoToneMapping;uvRenderer.setClearColor(0,0);
 window.bake=(yaw)=>{
  group.rotation.y=yaw;cam.position.set(0,12,33);cam.lookAt(0,4.7,0);group.position.x=yaw<0?-1.1:1.1;
  body.material=mat;handle.visible=true;renderer.render(scene,cam);const base=renderer.domElement.toDataURL('image/png');mat.color.set('#000000');renderer.render(scene,cam);const gloss=renderer.domElement.toDataURL('image/png');mat.color.set('#ffffff');
  body.material=uvMaterial;handle.visible=false;uvRenderer.render(scene,cam);const uv=uvRenderer.domElement.toDataURL('image/png');
  body.material=mat;handle.visible=true;return{base,uv,gloss};
 };window.ready=true;
 </script>`);
});
await new Promise((r) => server.listen(3147, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error(e));
  await page.goto("http://127.0.0.1:3147");
  await page.waitForFunction(() => window.ready);
  for (const [id, yaw] of [
    ["right", -Math.PI / 2],
    ["left", Math.PI / 2],
    ["three-quarter", -Math.PI * 0.32],
  ]) {
    const imgs = await page.evaluate((y) => window.bake(y), yaw);
    for (const [part, url] of Object.entries(imgs)) {
      const buffer = Buffer.from(url.split(",")[1], "base64");
      fs.writeFileSync(path.join(out, id + "-" + part + ".png"), buffer);
      await sharp(buffer)
        .resize(1024, 1024, { kernel: part === "uv" ? "nearest" : "lanczos3" })
        .png()
        .toFile(path.join(previews, id + "-" + part + ".png"));
      if (part === "base")
        await sharp(buffer)
          .resize(400, 400)
          .png()
          .toFile(path.join(thumbs, id + ".png"));
    }
    console.log("Baked", id);
  }
} finally {
  await browser.close();
  server.close();
}
