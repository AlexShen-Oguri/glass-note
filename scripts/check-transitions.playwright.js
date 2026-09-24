// Run with playwright-cli run-code (Get-Content -Raw scripts/check-transitions.playwright.js).
// Use an isolated browser on the local preview or the unpacked release. No existing user profile.
async page => {
  const base = page.url().split('#')[0].replace(/\/customize$/, '/');
  const results = [];
  const begin = async () => page.evaluate(() => {
    const visible = n => {const r=n.getBoundingClientRect();return r.width>0&&r.height>0;};
    const headings = root => [...root.querySelectorAll('h1,[role=heading]')].filter(visible).map(n=>n.textContent);
    const oldHeadings = headings(document.querySelector('[role=main],main'));
    const evidence = {oldHeadings,layers:[],directions:[],maxLayers:0};
    window.__transitionCheck=evidence;
    const seen=new WeakSet();
    const sample=()=>{
      const layers=[...document.body.children].filter(n=>n.getAttribute('aria-hidden')==='true'&&n.style.position==='fixed');
      evidence.maxLayers=Math.max(evidence.maxLayers,layers.length);
      for(const layer of layers)if(!seen.has(layer)){
        seen.add(layer);
        const animated=[...layer.querySelectorAll('*')].filter(n=>getComputedStyle(n).animationName!=='none');
        evidence.layers.push({headings:headings(layer),runningCssAnimations:animated.length});
      }
      const main=document.querySelector('[role=main],main');
      const choice=[...main.querySelectorAll('[role=button],button')].find(n=>visible(n)&&n.textContent.startsWith('喝一杯 →'));
      if(choice){const d=getComputedStyle(choice.parentElement).flexDirection;if(!evidence.directions.includes(d))evidence.directions.push(d);}
    };
    const observer=new MutationObserver(sample);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true});
    sample();
    window.__stopTransitionCheck=()=>{sample();observer.disconnect();};
  });
  const finish = async (name, expectedDirection, animated=true) => {
    await page.waitForTimeout(950);
    const evidence=await page.evaluate(()=>{window.__stopTransitionCheck();return window.__transitionCheck;});
    if(animated){
      if(!evidence.layers.length)throw Error(name+': missing outgoing frame');
      if(JSON.stringify(evidence.layers[0].headings)!==JSON.stringify(evidence.oldHeadings))throw Error(name+': captured wrong page '+JSON.stringify(evidence));
      if(evidence.layers.some(l=>l.runningCssAnimations))throw Error(name+': cloned animation restarted');
    }else if(evidence.layers.length)throw Error(name+': motion preference ignored');
    if(expectedDirection&&evidence.directions.some(d=>d!==expectedDirection))throw Error(name+': transient wrong layout');
    const residual=await page.evaluate(()=>[...document.body.children].filter(n=>n.getAttribute('aria-hidden')==='true'&&n.style.position==='fixed').length);
    if(residual)throw Error(name+': stale visual layer');
    results.push({name,...evidence,residual});
  };
  for(const width of [1280,390,402]){
    await page.setViewportSize({width,height:width===1280?800:874});
    await page.goto(base);
    await page.getByRole('button',{name:'为我定制',exact:true}).waitFor();
    await page.waitForTimeout(1200);
    await begin();
    await page.getByRole('button',{name:'为我定制',exact:true}).click();
    await finish('home-to-mode-'+width,width===1280?'row':'column');
    await page.screenshot({path:'output/playwright/transition-fix/mode-'+width+'.png'});
    await begin();
    await page.getByRole('button',{name:'喝一杯 → 按口味找一杯喜欢的酒',exact:true}).click();
    await finish('mode-to-flavour-'+width);
    await page.getByRole('button',{name:'柑橘 柠檬皮 · 葡萄柚',exact:true}).click();
    await begin();
    await page.getByRole('button',{name:'继续 →',exact:true}).click();
    await finish('flavour-to-taste-'+width);
    await begin();
    await page.goBack();
    await finish('history-back-'+width);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base);
  await page.waitForTimeout(1000);
  await begin();
  await page.getByRole('button',{name:'为我定制',exact:true}).click();
  await finish('reduced-motion',null,false);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(base);
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:'暂停动效',exact:true}).click();
  await begin();
  await page.getByRole('button',{name:'为我定制',exact:true}).click();
  await finish('user-paused',null,false);
  await page.getByRole('button',{name:'继续动效',exact:true}).click();
  await page.goto(base);
  await page.waitForTimeout(800);
  await page.getByRole('button',{name:'为我定制',exact:true}).click();
  await page.waitForTimeout(80);
  await page.goBack();
  await page.waitForTimeout(1000);
  const remaining=await page.evaluate(()=>[...document.body.children].filter(n=>n.getAttribute('aria-hidden')==='true'&&n.style.position==='fixed').length);
  if(remaining)throw Error('rapid navigation retained a layer');
  await page.getByRole('heading',{name:'今天你想喝点什么',exact:true}).waitFor();
  results.push({name:'rapid-navigation',residual:remaining});
  return {base,checks:results.length,passed:true,results};
}
