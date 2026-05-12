import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

const routes = [
  {
    path: 'wedding',
    title: '高雄婚紗攝影｜婚禮紀錄、訂婚攝影｜Harry Heng Studio',
    description:
      'Harry Heng Studio 謝典恆提供高雄婚紗攝影、婚禮紀錄與訂婚攝影服務。以自然引導、乾淨光影與紀實感，留下新人與親友最珍貴的畫面。',
    keywords: '高雄婚紗攝影,高雄婚禮紀錄,婚紗照,婚禮攝影,訂婚攝影,高雄婚攝,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/wedding',
    image: 'https://harryheng.studio/images/wedding/01.jpg',
  },
  {
    path: 'intimacy',
    title: '高雄閨密寫真｜全家福、寵物攝影｜Harry Heng Studio',
    description:
      'Harry Heng Studio 提供高雄閨密寫真、全家福與寵物攝影服務。以輕鬆自然的拍攝氛圍，留下朋友、家人與重要陪伴的溫暖畫面。',
    keywords: '高雄閨密寫真,高雄全家福,寵物攝影,家庭攝影,朋友寫真,親密寫真,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/intimacy',
    image: 'https://harryheng.studio/images/intimacy/family/02.jpg',
  },
  {
    path: 'kunqu',
    title: '崑曲藝術攝影｜戲曲攝影、舞台劇照｜Harry Heng Studio 高雄',
    description:
      'Harry Heng Studio 提供崑曲藝術攝影、戲曲攝影、舞台劇照與表演藝術紀錄。擅長在舞台光與動態之中捕捉身段、眼神與角色氣韻。',
    keywords: '崑曲攝影,戲曲攝影,舞台攝影,劇照攝影,表演藝術攝影,高雄藝術照,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/kunqu',
    image: 'https://harryheng.studio/images/kunqu/01.jpg',
  },
];

function escapeAttr(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
}

function replaceMeta(html, selector, content) {
  const escaped = escapeAttr(content);
  const pattern = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*("\\s*/?>)`, 'i');
  return html.replace(pattern, `$1${escaped}$2`);
}

function replaceCanonical(html, href) {
  const escaped = escapeAttr(href);
  return html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/i, `$1${escaped}$2`);
}

function pageHtml(baseHtml, route) {
  let html = replaceTitle(baseHtml, route.title);
  html = replaceMeta(html, 'name="description"', route.description);
  html = replaceMeta(html, 'name="keywords"', route.keywords);
  html = replaceMeta(html, 'property="og:title"', route.title);
  html = replaceMeta(html, 'property="og:description"', route.description);
  html = replaceMeta(html, 'property="og:url"', route.canonical);
  html = replaceMeta(html, 'property="og:image"', route.image);
  html = replaceMeta(html, 'name="twitter:title"', route.title);
  html = replaceMeta(html, 'name="twitter:description"', route.description);
  html = replaceMeta(html, 'name="twitter:image"', route.image);
  html = replaceCanonical(html, route.canonical);
  return html;
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing ${indexPath}. Run vite build before generating route HTML.`);
}

const baseHtml = fs.readFileSync(indexPath, 'utf8');

for (const route of routes) {
  const outDir = path.join(distDir, route.path);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml(baseHtml, route), 'utf8');
  console.log(`[route-html] wrote dist/${route.path}/index.html`);
}
