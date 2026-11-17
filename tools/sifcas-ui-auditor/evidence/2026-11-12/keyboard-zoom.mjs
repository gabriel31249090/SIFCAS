import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const baseURL='http://127.0.0.1:3100';
const routes=['/noticias','/editais','/agenda-institucional','/campus','/transparencia','/verificar-documento'];
const results=[];
const extension=path.resolve('test-results/aero-zoom-extension');
await fs.mkdir(extension,{recursive:true});
await fs.writeFile(path.join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local zoom audit',version:'1.0',permissions:['tabs'],background:{service_worker:'background.js'}}));
await fs.writeFile(path.join(extension,'background.js'),'chrome.runtime.onInstalled.addListener(() => {});');

async function inspect(page,route,profile,zoom){
  await page.goto(baseURL+route,{waitUntil:'networkidle'});
  if(zoom) await zoom();
  await page.evaluate(()=>document.fonts.ready);
  const geometry=await page.evaluate(()=>({innerWidth,innerHeight,outerWidth,devicePixelRatio,scrollWidth:document.documentElement.scrollWidth}));
  await page.evaluate(()=>{window.__aeroKeyboardAudit={seen:new WeakMap(),next:0};document.activeElement?.blur();scrollTo(0,0)});
  const seen=new Set(),issues=[];let count=0;
  for(let index=0;index<180;index++){
    await page.keyboard.press('Tab');
    const state=await page.evaluate(()=>{
      const element=document.activeElement;if(!element||element===document.body)return null;
      const audit=window.__aeroKeyboardAudit;if(!audit.seen.has(element))audit.seen.set(element,audit.next++);
      const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
      let focusIndicator=false;for(let item=element;item&&item!==document.body;item=item.parentElement){const s=getComputedStyle(item);if(s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2)focusIndicator=true;}
      const visible=rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
      const left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right),top=Math.max(0,rect.top),bottom=Math.min(innerHeight,rect.bottom);
      const unobscured=visible&&[.2,.5,.8].some(dy=>[.2,.5,.8].some(dx=>{const hit=document.elementFromPoint(left+(right-left)*dx,top+(bottom-top)*dy);return hit&&element.contains(hit)}));
      return {id:audit.seen.get(element),tag:element.tagName,label:(element.getAttribute('aria-label')||element.textContent||element.name||'').trim().slice(0,90),focusIndicator,visible,unobscured,focusVisible:element.matches(':focus-visible'),outline:style.outline};
    });
    if(!state)continue;if(seen.has(state.id))break;seen.add(state.id);count++;
    if(!state.focusIndicator||!state.visible||!state.unobscured)issues.push(state);
  }
  let interaction=null;
  if(route==='/editais'){
    const summary=page.locator('details summary').first();await summary.focus();await page.keyboard.press('Enter');const open=await summary.evaluate(element=>element.parentElement.open);await page.keyboard.press('Enter');interaction={detailsOpenedWithEnter:open,detailsClosedWithEnter:await summary.evaluate(element=>!element.parentElement.open)};
  }
  if(route==='/verificar-documento'){
    const input=page.locator('input[name="codigo"]');if(await input.count()){await input.focus();await page.keyboard.type('SIF-0123456789ABCDEF');interaction={inputAcceptsKeyboard:await input.inputValue()==='SIF-0123456789ABCDEF'};await input.fill('');}
  }
  if(profile==='zoom200'&&route==='/editais'){
    await page.evaluate(()=>scrollTo(0,0));
    const cdp=await page.context().newCDPSession(page);
    const screenshot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    await fs.writeFile(path.join(directory,'editais-zoom200.png'),Buffer.from(screenshot.data,'base64'));
  }
  results.push({route,profile,browserZoom:profile==='zoom200'?2:1,geometry,keyboardTargets:count,issues,interaction});
  console.log(profile,route,'targets',count,'issues',issues.length);
}

const browser=await chromium.launch({headless:true});
try{
  for(const width of[375,1440]){
    const context=await browser.newContext({viewport:{width,height:width===375?812:1000},reducedMotion:'reduce'});const page=await context.newPage();
    for(const route of routes)await inspect(page,route,String(width));
    if(width===375){const menu=page.getByRole('button',{name:'Abrir menu de navegação',exact:true});await menu.focus();await page.keyboard.press('Enter');const opened=await page.locator('.mobileDrawer').isVisible();await page.keyboard.press('Escape');results.push({profile:'375',route:'/verificar-documento',menu:{openedWithEnter:opened,closedWithEscape:!await page.locator('.mobileDrawer').isVisible(),focusReturned:await menu.evaluate(element=>document.activeElement===element)}});}
    await context.close();
  }
}finally{await browser.close()}
const zoomContext=await chromium.launchPersistentContext(path.resolve('test-results/aero-zoom-extension-profile'),{channel:'chromium',headless:true,viewport:null,reducedMotion:'reduce',args:['--window-size=1440,1000','--disable-extensions-except='+extension,'--load-extension='+extension]});
try{
  const worker=zoomContext.serviceWorkers()[0]||await zoomContext.waitForEvent('serviceworker');const page=zoomContext.pages()[0];
  const zoom=()=>worker.evaluate(async()=>{const [tab]=await chrome.tabs.query({active:true});await chrome.tabs.setZoom(tab.id,2);if(await chrome.tabs.getZoom(tab.id)!==2)throw new Error('Browser zoom was not applied');});
  for(const route of routes)await inspect(page,route,'zoom200',zoom);
}finally{await zoomContext.close()}
await fs.writeFile(path.join(directory,'keyboard-zoom.json'),JSON.stringify({date:new Date().toISOString(),baseURL,scope:'Six public routes, unauthed synthetic fixture. Actual Chromium browser zoom via chrome.tabs.setZoom(2). Tab traversal plus native disclosure and mobile drawer interactions. No forms submitted.',results},null,2)+'\n');
