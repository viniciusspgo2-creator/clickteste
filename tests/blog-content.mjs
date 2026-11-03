import fs from 'node:fs';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
const seo = {
  siteName: 'Ateliê de teste', siteUrl: 'https://atelie.example.test/',
  ogImage: '/og/og-default.png',
};
// Route tests supply a configured canonical domain without a network/database dependency.
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
Module._load = function (request, ...rest) {
  if (request === '@/lib/site-config') return { getSeoConfig: async () => seo };
  return originalLoad.call(this, request, ...rest);
};
for (const extension of ['.ts', '.tsx']) {
  Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, file);
}

const blog = require('../src/data/blog/index.ts');
const { ARTICLES_A } = require('../src/data/blog/articles-a.ts');
const { ARTICLES_B } = require('../src/data/blog/articles-b.ts');
const articleRoute = require('../src/app/blog/[slug]/page.tsx');
const indexRoute = require('../src/app/blog/page.tsx');
const sitemapRoute = require('../src/app/sitemap.ts');
const { ALL_ARTICLES, NEW_SUBLIMATION_ARTICLES, articleWordCount, getArticle, relatedArticles, headingId } = blog;

function walk(node, visit) {
  if (Array.isArray(node)) return node.forEach(child => walk(child, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  walk(node.props?.children, visit);
}
function find(tree, predicate) {
  const found = [];
  walk(tree, node => { if (predicate(node)) found.push(node); });
  return found;
}

test('15 substantial new articles preserve every legacy article and have unique editorial metadata', () => {
  assert.equal(NEW_SUBLIMATION_ARTICLES.length, 15);
  assert.equal(ALL_ARTICLES.length, 31);
  for (const legacy of [...ARTICLES_A, ...ARTICLES_B]) assert.equal(getArticle(legacy.slug), legacy);
  assert.equal(new Set(ALL_ARTICLES.map(article => article.slug)).size, ALL_ARTICLES.length);
  assert.equal(new Set(ALL_ARTICLES.map(article => article.title)).size, ALL_ARTICLES.length);
  assert.equal(new Set(NEW_SUBLIMATION_ARTICLES.map(article => article.description)).size, 15);
  for (const article of NEW_SUBLIMATION_ARTICLES) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(article.title.length >= 35 && article.title.length <= 105, article.slug);
    assert.ok(article.description.length >= 100 && article.description.length <= 200, article.slug);
    assert.equal(article.date, '2026-10-28');
    assert.ok(articleWordCount(article) >= 500 && articleWordCount(article) <= 900, article.slug);
    assert.ok(article.content.filter(block => block.type === 'h2').length >= 3, article.slug);
    assert.ok(article.content.some(block => block.type === 'ol' || block.type === 'ul'), article.slug);
    assert.ok(article.faq.length >= 2, article.slug);
    const paragraphs = article.content.filter(block => block.type === 'p').map(block => block.text);
    assert.equal(new Set(paragraphs).size, paragraphs.length, `Repeated paragraph: ${article.slug}`);
    for (const block of article.content) {
      if (block.type !== 'cta') continue;
      assert.ok(block.href.startsWith('/') || new URL(block.href).protocol === 'https:', article.slug);
      assert.ok(!/12[,.]90|24 horas|gratuito/.test(`${block.title} ${block.text}`), article.slug);
    }
    const headings = article.content.flatMap((block, index) => block.type === 'h2' || block.type === 'h3' ? [headingId(block.text, index)] : []);
    assert.equal(new Set(headings).size, headings.length, article.slug);
    const related = relatedArticles(article);
    assert.equal(related.length, 3);
    assert.ok(related.every(other => other.slug !== article.slug && getArticle(other.slug)));
  }
});

test('article route generates every slug, configured-domain metadata, structured data and matching contents links', async () => {
  assert.deepEqual(articleRoute.generateStaticParams().map(params => params.slug).sort(), ALL_ARTICLES.map(article => article.slug).sort());
  for (const article of NEW_SUBLIMATION_ARTICLES) {
    const params = Promise.resolve({ slug: article.slug });
    const metadata = await articleRoute.generateMetadata({ params });
    assert.equal(metadata.alternates.canonical, `/blog/${article.slug}`);
    assert.equal(metadata.openGraph.url, `https://atelie.example.test/blog/${article.slug}`);
    assert.equal(metadata.description, article.description);
    const tree = await articleRoute.default({ params });
    const scripts = find(tree, node => node.type === 'script').map(node => JSON.parse(node.props.dangerouslySetInnerHTML.__html));
    const posting = scripts.find(item => item['@type'] === 'BlogPosting');
    assert.equal(posting.headline, article.title);
    assert.equal(posting.mainEntityOfPage['@id'], metadata.openGraph.url);
    assert.equal(posting.image[0], 'https://atelie.example.test/og/og-default.png');
    assert.equal(posting.wordCount, articleWordCount(article));
    assert.equal(posting.author.name, seo.siteName);
    const crumbs = scripts.find(item => item['@type'] === 'BreadcrumbList');
    assert.equal(crumbs.itemListElement.at(-1).item, metadata.openGraph.url);
    const faq = scripts.find(item => item['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, article.faq.length);
    const tocLinks = find(tree, node => node.type === 'a' && node.props.href?.startsWith('#secao-')).map(node => node.props.href.slice(1));
    assert.deepEqual(tocLinks, article.content.flatMap((block, index) => block.type === 'h2' ? [headingId(block.text, index)] : []));
  }
  await assert.rejects(articleRoute.default({ params: Promise.resolve({ slug: 'artigo-inexistente' }) }), /404/);
});

test('blog collection supports accent-insensitive search and sitemap includes every article once', async () => {
  const tree = await indexRoute.default({ searchParams: Promise.resolve({ q: 'RESOLUCAO', cat: 'Sublimação' }) });
  const collection = JSON.parse(find(tree, node => node.type === 'script')[0].props.dangerouslySetInnerHTML.__html);
  const items = collection.mainEntity.itemListElement;
  assert.ok(items.length > 0);
  assert.ok(items.some(item => item.url.endsWith('/resolucao-arte-caneca-pixels-300-dpi')));
  for (const item of items) {
    const article = getArticle(item.url.split('/').at(-1));
    assert.equal(article.category, 'Sublimação');
  }
  const map = await sitemapRoute.default();
  for (const article of ALL_ARTICLES) {
    const entries = map.filter(entry => entry.url === `https://atelie.example.test/blog/${article.slug}`);
    assert.equal(entries.length, 1, article.slug);
    assert.ok(Number.isFinite(entries[0].lastModified.getTime()));
  }
});
