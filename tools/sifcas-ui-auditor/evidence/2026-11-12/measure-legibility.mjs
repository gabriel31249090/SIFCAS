import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const outputDirectory = decodeURIComponent(directory);
const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3100';
const routes = process.env.AUDIT_ROUTES ? JSON.parse(process.env.AUDIT_ROUTES) : ['/noticias', '/editais', '/agenda-institucional', '/campus', '/transparencia', '/verificar-documento'];
const axeSource = await fs.readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 1000 }, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await context.newPage();
    if (process.env.AUDIT_ACTOR) await page.goto('http://127.0.0.1:54331/__fixture/open?actor='+encodeURIComponent(process.env.AUDIT_ACTOR), {waitUntil:'networkidle'});
    for (const route of routes) {
      const response = await page.goto(baseURL + route, { waitUntil: 'networkidle' });
      if(process.env.AUDIT_TAB) await page.getByRole('tab', { name:process.env.AUDIT_TAB, exact:true }).click();
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ content: axeSource });
      const axe = await page.evaluate(async () => {
        const result = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast', 'link-in-text-block', 'link-name', 'label-content-name-mismatch', 'target-size'] } });
        return Object.fromEntries(['violations', 'incomplete'].map(key => [key, result[key].map(rule => ({ id: rule.id, nodes: rule.nodes.map(node => ({ target: node.target, summary: node.failureSummary, html: node.html })) }))]));
      });
      const texts = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const output = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          if (!node.textContent.trim() || !parent || parent.closest('script,style,svg,nextjs-portal')) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          const rects = [...range.getClientRects()].map(rect => {
            let left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right),top=rect.top,bottom=rect.bottom;
            for(let ancestor=parent;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement){const style=getComputedStyle(ancestor),bounds=ancestor.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(style.overflowX)){left=Math.max(left,bounds.left);right=Math.min(right,bounds.right)}if(/auto|scroll|hidden|clip/.test(style.overflowY)){top=Math.max(top,bounds.top);bottom=Math.min(bottom,bounds.bottom)}}
            return {x:left,y:top,width:right-left,height:bottom-top};
          }).filter(r => r.width > 0 && r.height > 0);
          const style = getComputedStyle(parent);
          if (!rects.length || !parent.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}) || style.color==='rgba(0, 0, 0, 0)') continue;
          const identify = element => element.tagName.toLowerCase() + (element.className ? '.' + String(element.className).trim().replaceAll(' ', '.') : '');
          output.push({ selector: identify(parent.parentElement)+' > '+identify(parent), text: node.textContent.trim().slice(0,90), color: style.color, size: style.fontSize, weight: style.fontWeight, fixedShell:!!parent.closest('.mobileNav,.mobileMenuButton'), rects: rects.map(r => ({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height})), decoration: style.textDecorationLine });
        }
        return output;
      });
      const transparentText = '* { color:transparent!important; text-shadow:none!important; -webkit-text-fill-color:transparent!important; }';
      const fixedScreenshot = width===375 ? await page.screenshot({ animations:'disabled', style:transparentText }) : null;
      const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled', style: transparentText+' .mobileNav,.mobileMenuButton { visibility:hidden!important }' });
      const samples = await page.evaluate(async ({ texts, image, fixedImage }) => {
        const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(image), character => character.charCodeAt(0))], {type:'image/png'}));
        const canvas = document.createElement('canvas'); canvas.width=bitmap.width; canvas.height=bitmap.height;
        const ctx = canvas.getContext('2d', { willReadFrequently:true }); ctx.drawImage(bitmap,0,0);
        let fixedCtx = ctx;
        if(fixedImage) { const fixedBitmap=await createImageBitmap(new Blob([Uint8Array.from(atob(fixedImage),character=>character.charCodeAt(0))],{type:'image/png'})); const fixedCanvas=document.createElement('canvas'); fixedCanvas.width=fixedBitmap.width; fixedCanvas.height=fixedBitmap.height; fixedCtx=fixedCanvas.getContext('2d',{willReadFrequently:true}); fixedCtx.drawImage(fixedBitmap,0,0); }
        const linear = value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value+.055)/1.055)**2.4; };
        const luminance = rgb => .2126*linear(rgb[0])+.7152*linear(rgb[1])+.0722*linear(rgb[2]);
        const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
        return texts.map(text => {
          const foreground = text.color.match(/[\d.]+/g).map(Number);
          let minimum = Infinity, background = null;
          for (const rect of text.rects) for (const dx of [.1,.5,.9]) for (const dy of [.2,.5,.8]) {
            const x=Math.min(canvas.width-1,Math.max(0,Math.floor(rect.x+rect.width*dx))),y=Math.min(canvas.height-1,Math.max(0,Math.floor(rect.y+rect.height*dy)));
            const rgb = [...(text.fixedShell ? fixedCtx : ctx).getImageData(x,y,1,1).data].slice(0,3);
            const ratio = contrast(foreground,rgb); if(ratio < minimum) { minimum=ratio; background=rgb; }
          }
          const threshold = parseFloat(text.size)>=24 || (parseFloat(text.size)>=18.66 && Number(text.weight)>=700) ? 3 : 4.5;
          return {...text, rects:undefined, minimumContrast:Number(minimum.toFixed(2)), sampledBackground:background, threshold};
        });
      }, { texts, image: screenshot.toString('base64'), fixedImage:fixedScreenshot?.toString('base64') });
      const geometry = await page.evaluate(() => ({ innerWidth, scrollWidth:document.documentElement.scrollWidth, mainWidth:document.querySelector('main')?.getBoundingClientRect().width }));
      results.push({ route, width, status:response.status(), finalURL:page.url(), geometry, axe, texts:samples });
      if (process.env.AUDIT_SCREENSHOTS === '1' && ['/editais','/verificar-documento'].includes(route)) await page.screenshot({ path:path.join(outputDirectory, route.slice(1)+'-'+width+'.png'), fullPage:true, animations:'disabled' });
      console.log(route,width,'sampled',samples.length,'below threshold',samples.filter(t=>t.minimumContrast<t.threshold).length);
    }
    await context.close();
  }
  const compact=results.map(({texts,axe,...result})=>{
    const groups=new Map();
    for(const text of texts){const key=[text.selector,text.color,text.size,text.weight].join('|');const previous=groups.get(key);if(!previous||previous.minimumContrast>text.minimumContrast)groups.set(key,text)}
    return {...result,axe:Object.fromEntries(Object.entries(axe).map(([status,rules])=>[status,rules.map(({id,nodes})=>({id,nodes:nodes.length,sampleTargets:nodes.slice(0,8).map(node=>node.target)}))])),contrast:{sampledTextNodes:texts.length,groups:[...groups.values()]}};
  });
  await fs.writeFile(path.join(outputDirectory, process.env.AUDIT_OUTPUT || 'legibility.json'), JSON.stringify({ date:new Date().toISOString(), baseURL, note:'Rendered backgrounds sampled at nine points per direct text-node rectangle with text temporarily transparent; minimum retained per selector/color/size/weight group. Clipped content and transparent text excluded. Does not replace review of overlaps, images, states, opacity, or screen readers.', axeVersion:require('axe-core/package.json').version, results:compact }, null,2)+'\n');
} finally { await browser.close(); }
