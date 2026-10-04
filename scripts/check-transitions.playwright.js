// Run with playwright-cli run-code on a local preview in an isolated zh-CN browser.
// The accepted reference is the uninterrupted 4188 orbital relay. Inspect
// intermediate painted poses, immediate content exchange and cleanup, rather
// than accepting the final screen or merely checking for will-change.
async page => {
  const base = new URL('/', page.url()).href;
  const checks = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const settle = async () => {
    await page.waitForFunction(() => !document.querySelector('[data-scene-busy="true"]'), undefined, {timeout: 6500});
    await page.waitForFunction(() => ![...document.querySelectorAll('[data-motion-part],[data-motion-item],[data-motion-transition],[data-motion-space-portal],[data-motion-space-glass]')]
      .some(node => node.style.willChange.includes('transform')), undefined, {timeout: 6500});
    await page.locator('[data-motion-title-departure]').waitFor({state: 'detached'});
    await page.waitForTimeout(100);
  };
  const begin = () => page.evaluate(() => {
    window.__finishMotionCheck?.();
    const start = performance.now(), frames = [], longTasks = [];
    let running = true, raf;
    const visible = node => node.isConnected && !node.closest('[aria-hidden="true"]') && node.getBoundingClientRect().width > 0;
    const active = selector => [...document.querySelectorAll(selector)].find(visible);
    const sourcePhotos=new WeakSet([...document.querySelectorAll('[data-motion-photo]')].filter(visible));
    const firstPhotos=[],seenPhotos=new WeakSet();
    const flights=()=>[...document.querySelectorAll('canvas[data-motion-photo-relay]')].map(canvas=>{
      const id=canvas.getAttribute('data-motion-photo-relay');
      return {id,gate:[...document.querySelectorAll('[data-motion-photo-gate]')].some(node=>node.getAttribute('data-motion-photo-gate')===id),
        targets:[...document.querySelectorAll('[data-motion-photo]')].filter(node=>node.getAttribute('data-motion-photo')===id&&visible(node)&&!sourcePhotos.has(node))
          .map(node=>{
            const image=node.querySelector('img'),opacity=Number(getComputedStyle(node).opacity);
            if(!seenPhotos.has(node)){seenPhotos.add(node);firstPhotos.push({id,opacity,t:performance.now()-start});}
            return {opacity,complete:Boolean(image?.complete),naturalWidth:image?.naturalWidth||0};
          })};
    });
    // Read newly mounted/unhidden destinations before their first painted frame.
    const photoObserver=new MutationObserver(flights);
    photoObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-hidden','inert']});
    const pose = node => {
      if (!node) return null;
      const style = getComputedStyle(node), matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
      let parent = node.parentElement, masked = false;
      for (let depth = 0; parent && depth < 4; depth++, parent = parent.parentElement) {
        const overflow = getComputedStyle(parent).overflowY;
        masked ||= overflow === 'hidden' || overflow === 'clip';
      }
      return {text: node.textContent.replace(/\s+/g, ''), opacity: Number(style.opacity), x: matrix.m41, y: matrix.m42,
        scaleY: matrix.m22, height: node.getBoundingClientRect().height, masked};
    };
    const sample = () => {
      const content = active('[data-scene-content]');
      const root = content || active('[data-motion-transition]') || document.body;
      const heading = [...root.querySelectorAll('[role="heading"][aria-level="1"],h1')].find(visible);
      const lines = [...root.querySelectorAll('[data-motion-part="title-line"],[data-motion-title-line]')].filter(visible);
      const titles = lines.length ? lines : heading ? [heading] : [];
      const menus = [...new Set(root.querySelectorAll('[data-motion-part="entry"],[data-motion-item]'))].filter(visible).slice(0, 12);
      const grid = [...root.querySelectorAll('[data-motion-part="options"]')].find(visible);
      const photoDetails = [...root.querySelectorAll('[data-motion-part="menu"],[data-motion-part="photo-detail"]')].filter(visible);
      const veil = active('[data-scene-veil]');
      const departure = document.querySelector('[data-motion-title-departure]');
      const portal = document.querySelector('[data-motion-space-portal]');
      frames.push({t: performance.now() - start, busy: Boolean(document.querySelector('[data-scene-busy="true"]')),
        heading: heading?.textContent.replace(/\s+/g, '') || '', content: pose(content), veil: pose(veil),
        titles: titles.map(pose), menus: menus.map(pose), grid: pose(grid), departure: pose(departure),
        photoDetails: photoDetails.map(pose), portal: pose(portal), flights:flights(),
        promotedCards: document.querySelectorAll('[data-motion-item][style*="will-change"]').length,
        clones: [...document.body.children].filter(node => node.getAttribute('aria-hidden') === 'true'
          && node.style.position === 'fixed' && !node.hasAttribute('data-motion-photo-relay')
          && !node.hasAttribute('data-motion-title-departure') && !node.querySelector('[data-motion-title-departure]')).length});
      if (running && frames.length < 480) raf = requestAnimationFrame(sample);
    };
    const observer = typeof PerformanceObserver !== 'undefined' ? new PerformanceObserver(list => {
      longTasks.push(...list.getEntries().map(entry => ({t: entry.startTime - start, duration: entry.duration})));
    }) : null;
    try {observer?.observe({type: 'longtask', buffered: false});} catch {}
    sample();
    window.__finishMotionCheck = () => {running = false; cancelAnimationFrame(raf); observer?.disconnect();photoObserver.disconnect(); return {frames, longTasks,firstPhotos};};
  });
  const finish = async (name, animated = true, {direction = 1, menus = true, kind = 'page', departure = true, photoDetails = true, space = false} = {}) => {
    await settle();
    if(kind==='photo')await page.waitForFunction(()=>!document.querySelector('canvas[data-motion-photo-relay],[data-motion-photo-gate]'),undefined,{timeout:6500});
    const {frames, longTasks,firstPhotos} = await page.evaluate(() => window.__finishMotionCheck());
    const assert = (condition, message) => {if (!condition) throw Error(name + ': ' + message);};
    assert(!frames.some(frame => frame.clones), 'retained a duplicate page');
    assert(Math.max(...frames.map(frame => frame.promotedCards)) <= 8, 'promoted more than eight visible cards');
    const moving = frames.some(frame => frame.veil && frame.veil.scaleY > .03);
    assert(!moving, 'reintroduced a curtain instead of the uninterrupted orbital relay');
    if(animated&&kind==='photo'){
      const photoFrames=frames.flatMap(frame=>frame.flights),ids=[...new Set(photoFrames.map(flight=>flight.id))];
      assert(photoFrames.length>1,'missing the continuous shared-photo texture');
      assert(firstPhotos.length>0,'never observed the incoming shared-photo destination');
      assert(firstPhotos.every(photo=>photo.opacity<.001),'destination appeared before its first-paint photo gate');
      assert(photoFrames.every(flight=>flight.gate&&flight.targets.every(target=>target.opacity<.001)),'live destination flashed while its photo texture was flying');
      const landed=await page.evaluate(ids=>ids.map(id=>[...document.querySelectorAll('[data-motion-photo]')]
        .filter(node=>node.getAttribute('data-motion-photo')===id&&!node.closest('[aria-hidden="true"]')&&node.getBoundingClientRect().width>0)
        .map(node=>{const image=node.querySelector('img');return {opacity:Number(getComputedStyle(node).opacity),complete:Boolean(image?.complete),naturalWidth:image?.naturalWidth||0};})),ids);
      assert(landed.every(targets=>targets.length>0&&targets.every(target=>target.opacity>.98&&target.complete&&target.naturalWidth>0)),'photo texture landed before the live image could paint');
      assert(!await page.locator('canvas[data-motion-photo-relay],[data-motion-photo-gate]').count(),'photo landing retained its texture or CSS gate');
    }
    if (!animated) {
      assert(!frames.some(frame => frame.departure), 'played an outgoing title while motion was disabled');
      assert(!frames.some(frame => frame.titles.some(title => Math.abs(title.y) > 1)
        || frame.menus.some(menu => Math.abs(menu.y) > 1) || frame.grid && Math.abs(frame.grid.x) > 1), 'played a foreground entrance while motion was disabled');
    } else if (kind !== 'card') {
      const oldHeading = frames[0].heading;
      const swap = frames.find(frame => frame.heading && frame.heading !== oldHeading);
      assert(swap, 'did not exchange the old scene');
      assert(swap.t <= 500, 'content waited for an outgoing scene instead of committing immediately (' + swap.t.toFixed(0) + 'ms)');
      if (departure) {
        const outgoing = frames.filter(frame => frame.departure);
        assert(outgoing.length > 1, 'missing the live outgoing title presentation');
        const first = outgoing[0], last = outgoing[outgoing.length - 1];
        assert(first.departure.opacity > .55, 'outgoing title began as an invisible placeholder');
        assert(outgoing.some(frame => frame.departure.y * direction < (kind === 'step' ? -8 : -13)
          && frame.departure.opacity < .6), 'outgoing title did not lift and fade in the correct direction');
        assert(last.t - first.t >= 100 && last.t - first.t <= 400, 'outgoing title did not use its short .24s departure');
        assert(!frames[frames.length - 1].departure, 'outgoing title presentation was retained');
      }
      const incoming = frames.filter(frame => frame.t >= swap.t && frame.heading === swap.heading);
      const initialY = kind === 'step' ? 18 : 28;
      const titleStart = incoming.find(frame => frame.titles.some(title => title.y * direction > initialY * .35
        && title.y * direction <= initialY + 2 && title.opacity < .5));
      assert(titleStart, 'missing the ' + initialY + 'px low-opacity incoming title');
      const titleEnd = incoming.find(frame => frame.t > titleStart.t + 100 && frame.titles.every(title => Math.abs(title.y) < .7 && title.opacity > .98));
      // power3.out reaches the near-zero threshold before the declared end;
      // compare the visible landing with the commit, not a delayed first sample.
      assert(titleEnd && titleEnd.t - swap.t >= (kind === 'step' ? 220 : 330)
        && titleEnd.t - swap.t <= 1000, 'title entrance did not retain the reference cadence');
      if (kind === 'step') {
        const gridStart = incoming.find(frame => frame.grid && frame.grid.x * direction > 8
          && frame.grid.x * direction <= 24 && frame.grid.opacity < .7);
        assert(gridStart, 'missing the directional 22px question-grid relay');
        const gridEnd = incoming.find(frame => frame.t > gridStart.t + 100 && frame.grid
          && Math.abs(frame.grid.x) < .7 && frame.grid.opacity > .98);
        assert(gridEnd && gridEnd.t - gridStart.t >= 180 && gridEnd.t - swap.t <= 800, 'question grid snapped or kept its previous long timing');
        assert(incoming.every(frame => !frame.grid || Math.abs(frame.grid.y) < 1), 'question grid also played a vertical card entrance');
      } else if (menus) {
        const y = kind === 'results' ? 24 : kind === 'photo' ? 18 : 16, opacity = kind === 'results' || kind === 'photo' ? .38 : .34;
        const initialMenus = incoming.find(frame => frame.menus.some(menu => menu.y * direction > y * .35
          && menu.y * direction <= y + 2 && menu.opacity < opacity + .3));
        assert(initialMenus, 'missing the reference ' + y + 'px entry/card relay');
        const menuEnd = incoming.find(frame => frame.t > initialMenus.t + 100 && frame.menus[0]
          && Math.abs(frame.menus[0].y) < .7 && frame.menus[0].opacity > .98);
        assert(menuEnd && menuEnd.t - swap.t >= 250 && menuEnd.t - swap.t <= 1000, 'entry/card entrance cadence changed');
        if (kind === 'results' && initialMenus.menus.length > 1) {
          assert(incoming.some(frame => frame.menus[0] && frame.menus[1]
            && frame.menus[1].y * direction - frame.menus[0].y * direction > .7), 'result cards lost their .035s stagger');
        }
      }
      if (kind === 'photo' && photoDetails) {
        assert(incoming.some(frame => frame.photoDetails.some(detail => detail.y * direction > 4
          && detail.y * direction <= 16 && detail.opacity < .8)), 'missing the 14px photo-detail relay');
      }
      if (space) {
        const old = frames[0].portal, last = frames[frames.length - 1].portal;
        assert(old && last, 'missing the live portal measurement');
        const bridge = incoming.find(frame => frame.portal && (Math.abs(frame.portal.x) > 1 || Math.abs(frame.portal.y) > 1
          || Math.abs(frame.portal.scaleY - 1) > .01 || Math.abs(frame.portal.opacity - old.opacity) > .02 && Math.abs(frame.portal.opacity - last.opacity) > .02));
        assert(bridge, 'background jumped between endpoints instead of bridging the composition');
        const landed = incoming.find(frame => frame.t > swap.t + 300 && frame.portal && Math.abs(frame.portal.x) < .5
          && Math.abs(frame.portal.y) < .5 && Math.abs(frame.portal.scaleY - 1) < .002 && Math.abs(frame.portal.opacity - last.opacity) < .01);
        assert(landed && landed.t - swap.t >= 550 && landed.t - swap.t <= 1150, 'background lost its .85s spatial relay');
      }
    } else {
      assert(frames.some(frame => frame.menus.some(menu => Math.abs(menu.y) > 1 && menu.opacity < .9)), 'missing the local card entrance');
    }
    const residual = await page.locator('[data-motion-transition][style*="will-change"]').count();
    if (residual || await page.locator('[data-motion-item][style*="will-change"]').count() || await page.locator('[data-motion-part][style*="will-change"]').count()) throw Error(name + ': transition did not release its layer');
    const gaps = frames.slice(1).map((frame, index) => frame.t - frames[index].t).sort((a, b) => a - b);
    checks.push({name, animated, kind, frameP95Ms: Number(gaps[Math.floor(gaps.length * .95)]?.toFixed(1)),
      framesOver50ms: gaps.filter(gap => gap > 50).length, longTasks: longTasks.length});
  };
  const startGuided = async () => {
    await page.goto(base);
    await settle();
    await page.getByRole('button', {name: '为我定制', exact: true}).click();
    await settle();
    await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true}).click();
    await settle();
  };
  const submitGuided = async () => {
    for (let index = 0; index < 3; index++) {
      await page.getByRole('button', {name: '继续 →', exact: true}).click();
      await settle();
    }
    await page.getByRole('button', {name: '找一杯适合我的 →', exact: true}).click();
  };
  const lastQuestion = async count => {
    await startGuided();
    if (count === 0) await page.getByRole('button', {name: /^咖啡/}).click();
    for (let index = 0; index < 2; index++) {
      await page.getByRole('button', {name: '继续 →', exact: true}).click(); await settle();
    }
    if (count < 6) await page.getByRole('button', {name: /^无酒精/}).click();
    await page.getByRole('button', {name: '继续 →', exact: true}).click(); await settle();
    if (count === 1) {
      const exclusion = page.getByRole('button', {name: /有什么想排除的吗/});
      if (await exclusion.count()) await exclusion.click();
      await page.getByRole('button', {name: '蛋', exact: true}).click();
    }
  };
  for (const width of [1280, 390, 402]) {
    await page.setViewportSize({width, height: width === 1280 ? 800 : 874});
    await page.goto(base);
    await settle();
    await begin();
    await page.getByRole('button', {name: '为我定制', exact: true}).click();
    await finish('home-to-mode-' + width, true, {space: true});
    const direction = await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true})
      .evaluate(node => getComputedStyle(node.parentElement).flexDirection);
    if (direction !== 'column') throw Error('incorrect editorial mode layout');
    await begin();
    await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true}).click();
    await finish('mode-to-flavour-' + width, true, {menus: false, space: true});
    await page.getByRole('button', {name: /柑橘.*柠檬皮/}).click();
    const progress = await page.locator('[data-motion-progress]').elementHandle();
    const actions = await page.locator('[data-motion-actions]').elementHandle();
    const summary = await page.locator('[data-motion-summary]').elementHandle();
    const canvas = await page.locator('[data-glass-scene] canvas').elementHandle();
    await begin();
    await page.getByRole('button', {name: '继续 →', exact: true}).click();
    await finish('flavour-to-taste-' + width, true, {kind: 'step'});
    if (!progress || !actions || !summary) throw Error('question relay is missing its persistent frame');
    if (!await progress.evaluate(node => node.isConnected) || !await actions.evaluate(node => node.isConnected)
      || !await summary.evaluate(node => node.isConnected)) throw Error('question relay remounted its persistent frame');
    if (canvas && !await canvas.evaluate(node => node.isConnected)) throw Error('question relay remounted the WebGL canvas');
    if (await page.locator('[data-motion-transition][inert]').count()) throw Error('question relay kept its live UI locked');
    await begin();
    await page.getByRole('button', {name: '返回', exact: true}).click();
    await finish('taste-to-flavour-' + width, true, {kind: 'step', direction: -1});
    if (await page.getByRole('button', {name: /柑橘.*柠檬皮/}).getAttribute('aria-pressed') !== 'true') throw Error('step transition reset flavour selection');
    checks.push({name: 'step-selection-preserved-' + width});
    await begin();
    await page.goBack();
    await finish('history-back-' + width, true, {direction: 1, departure: false});

  }

  // Catalogue outcomes, obtained exclusively through the actual controls:
  // unrestricted -> six shown; alcohol-free without egg -> one Mojito
  // mocktail; coffee plus alcohol-free -> no matches. No injected app state.
  for (const width of [1280, 390]) for (const count of [0, 1, 6]) {
    await page.setViewportSize({width, height: width === 1280 ? 800 : 874});
    await lastQuestion(count); await begin();
    await page.getByRole('button', {name: '找一杯适合我的 →', exact: true}).click();
    await finish('question-to-results-' + count + '-' + width, true, {kind: 'results', menus: count > 0, space: true});
    await page.getByRole('heading', {name: '为你找到的酒', exact: true}).waitFor();
    const cards = page.locator('[data-reveal-results] [data-motion-item]');
    if (await cards.count() !== count) throw Error('unexpected visible result count for ' + count + ' at ' + width);
    const ready = await page.locator('[data-reveal-results]').evaluate(node => node.getAttribute('aria-hidden') !== 'true'
      && !node.closest('[inert]') && getComputedStyle(node).pointerEvents !== 'none');
    if (!ready) throw Error('completed reveal kept results inaccessible');
    if (count === 0) await page.getByText('暂时没有配方同时满足所有选择。调整一个偏好再试试。', {exact: true}).waitFor();
    if (count === 1 && await cards.first().getAttribute('data-motion-item') !== 'mojito-mocktail') throw Error('single-result source selection changed');
    if (count === 6) {
      const columns = await cards.evaluateAll(nodes => new Set(nodes.map(node => Math.round(node.getBoundingClientRect().left))).size);
      if (columns !== (width < 700 ? 2 : 3)) throw Error('six results did not use the intended two/three-column layout');
    }
    checks.push({name: 'results-data-layout-' + count + '-' + width});
  }

  await page.setViewportSize({width: 1280, height: 800});
  await page.goto(base); await settle();
  const sculpture = page.locator('[data-glass-scene],[data-glass-error]').first();
  await sculpture.waitFor();
  const canvas = await sculpture.locator('canvas').elementHandle();
  await page.getByRole('button', {name: '暂停动效', exact: true}).click();
  await page.waitForTimeout(100);
  const paused = await sculpture.getAttribute('data-glass-motion');
  await page.waitForTimeout(350);
  const still = await sculpture.getAttribute('data-glass-motion');
  if (canvas && (paused !== 'paused' || still !== 'paused' || !await canvas.evaluate(node => node.isConnected))) throw Error('pause restarted or kept the sculpture running');
  await begin();
  await page.getByRole('button', {name: '为我定制', exact: true}).click();
  await finish('user-paused', false);
  await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true}).click(); await settle();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', {name: '继续 →', exact: true}).click(); await settle();
  }
  await begin(); await page.getByRole('button', {name: '找一杯适合我的 →', exact: true}).click();
  await finish('user-paused-results', false);
  if (await page.locator('[data-reveal-results] [data-motion-item]').count() !== 6) throw Error('paused reveal lost live results');
  await page.goto(base); await settle();
  await page.getByRole('button', {name: '继续动效', exact: true}).click();
  await page.waitForTimeout(300);
  const resumed = await sculpture.getAttribute('data-glass-motion');
  await page.waitForTimeout(300);
  const moving = await sculpture.getAttribute('data-glass-motion');
  if (canvas && (resumed !== 'running' || moving !== 'running')) throw Error('sculpture did not resume');
  checks.push({name: 'loop-pause-resume', webglAvailable: Boolean(canvas), paused, still, resumed, moving});

  await startGuided(); await begin();
  await page.getByRole('button', {name: '继续 →', exact: true}).dblclick({delay: 40});
  await finish('rapid-double-next', true, {kind: 'step'});
  await page.getByRole('heading', {name: '你偏爱怎样的口感？', exact: true}).waitFor();
  await page.goto(base); await settle();
  await page.getByRole('button', {name: '为我定制', exact: true}).click();
  await page.waitForURL('**/customize'); await page.goBack(); await settle();
  await page.getByRole('heading', {name: '今天你想喝点什么', exact: true}).waitFor();
  if (await page.locator('[data-scene-busy="true"]').count()) throw Error('navigation interruption retained the scene lock');
  if (await page.locator('[data-scene-veil]').count()) throw Error('navigation interruption retained the old curtain');
  if (await page.locator('[data-motion-title-departure]').count()) throw Error('navigation interruption retained an outgoing title');
  checks.push({name: 'navigation-interruption-unlocks'});

  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 874});
    await page.goto(base + 'discover'); await settle();
    const search = page.getByRole('textbox').first();
    await search.fill('gin');
    await page.getByRole('button', {name: '筛选', exact: true}).click();
    const modal = page.locator('[data-motion-modal]');
    await modal.waitFor(); await page.waitForTimeout(500);
    const focusInside = await modal.evaluate(node => node.contains(document.activeElement));
    if (!focusInside) throw Error('filter opening lost keyboard focus');
    await page.keyboard.press('Tab');
    if (!await modal.evaluate(node => node.contains(document.activeElement))) throw Error('modal focus escaped');
    await page.keyboard.press('Escape');
    await modal.waitFor({state: 'detached'});
    if (await search.inputValue() !== 'gin') throw Error('modal transition reset the search');
    await page.getByRole('button', {name: '筛选', exact: true}).click();
    await modal.waitFor(); await page.waitForTimeout(450);
    await modal.getByRole('checkbox', {name: '金酒', exact: true}).click();
    await begin();
    await modal.getByRole('button', {name: '找一杯适合我的 →', exact: true}).click();
    await modal.waitFor({state: 'detached'});
    await finish('filter-with-search-' + width, false);
    await search.fill(''); await settle();
    if (!await page.locator('[data-motion-item]').count()) throw Error('filter removed all cards unexpectedly');
    checks.push({name: 'modal-focus-input-filter-' + width});
    await page.getByRole('button', {name: '筛选', exact: true}).click();
    await modal.waitFor(); await page.waitForTimeout(450);
    await modal.getByRole('checkbox', {name: '朗姆', exact: true}).click();
    await begin();
    await modal.getByRole('button', {name: '找一杯适合我的 →', exact: true}).click();
    await finish('visible-card-stagger-' + width, true, {kind: 'card', departure: false});

  }

  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 874});
    await startGuided(); await submitGuided();
    await settle();
    const recipe = page.locator('[data-reveal-results] [data-motion-item] a[href*="/cocktails/"]').first();
    const href = await recipe.getAttribute('href');
    await page.waitForFunction(href=>{const link=[...document.querySelectorAll('a[href]')].find(node=>node.getAttribute('href')===href&&!node.closest('[aria-hidden="true"]'));const image=link?.querySelector('img');return image?.complete&&image.naturalWidth>0;},href);
    await begin(); await recipe.click();
    await page.waitForURL('**/cocktails/**');
    if (!page.url().includes(new URL(href, base).pathname) || !page.url().includes('version=')) throw Error('photo relay lost the selected source version');
    await finish('results-to-recipe-' + width, true, {kind: 'photo', menus: false});
    if (await page.locator('canvas[data-motion-photo-relay]').count()) throw Error('photo relay retained its presentation layer');
    const imageReady = await page.locator('[data-motion-photo-target]').evaluate(node => getComputedStyle(node).opacity !== '0');
    if (!imageReady) throw Error('photo relay left the live recipe photo hidden');
    await begin(); await page.locator('[data-motion-photo-return]').click();
    await page.waitForURL('**/customize');
    await finish('recipe-to-results-' + width, true, {kind: 'photo', direction: -1, photoDetails: false});
    if (await page.getByTestId('guided-reveal-stage').count()) throw Error('returning replayed an unfinished business reveal');
    const invisiblePhotos = await page.locator('[data-reveal-results]').evaluate(root => [...root.querySelectorAll('img')]
      .some(image => {const parent = image.closest('[style*="visibility: hidden"]'); return Boolean(parent);}));
    if (invisiblePhotos) throw Error('photo handoff left a hidden result');
    checks.push({name: 'live-results-photo-relay-' + width});
    await startGuided(); await submitGuided();
    const skip = page.getByTestId('guided-reveal-stage');
    await skip.waitFor({state: 'visible'}); await skip.click();
    await page.getByTestId('guided-reveal-stage').waitFor({state: 'detached'});
    await settle();
    if (await page.locator('[data-reveal-results] [data-motion-item]').count() !== 6) throw Error('skip lost live results');
    if (await page.locator('[data-reveal-results]').evaluate(node => Boolean(node.closest('[inert]')))) throw Error('skip kept results locked');
    checks.push({name: 'reveal-skip-' + width});
  }

  // Interrupt an active reveal with the system preference rather than a reload.
  await startGuided(); await submitGuided();
  await page.getByTestId('guided-reveal-stage').waitFor();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.getByTestId('guided-reveal-stage').waitFor({state: 'detached'});
  await settle();
  if (await page.locator('[data-reveal-results]').getAttribute('aria-hidden') === 'true') throw Error('interrupted reveal kept results hidden');
  if (await page.locator('[data-reveal-results] [data-motion-item]').count() !== 6) throw Error('reduced-motion interruption lost results');
  checks.push({name: 'reduced-motion-during-reveal'});
  await page.emulateMedia({reducedMotion: 'no-preference'});

  await page.goto(base); await settle();
  await page.getByRole('button', {name: '语言', exact: true}).click();
  const languageModal = page.locator('[data-motion-modal]');
  await languageModal.waitFor(); await page.waitForTimeout(500);
  if (!await languageModal.evaluate(node => node.contains(document.activeElement))) throw Error('language modal did not take focus');
  await page.keyboard.press('Escape'); await languageModal.waitFor({state: 'detached'});
  checks.push({name: 'language-modal-focus-escape'});

  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(base); await settle(); await begin();
  await page.getByRole('button', {name: '为我定制', exact: true}).click();
  await finish('reduced-motion', false);
  await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true}).click();
  await submitGuided(); await settle();
  if (await page.getByTestId('guided-reveal-stage').count()) throw Error('reduced motion played a reveal');
  checks.push({name: 'reduced-motion-reveal'});
  await page.emulateMedia({reducedMotion: 'no-preference'});

  for(const [width,height] of [[1470,840],[1280,800],[1024,700],[900,560]]){
    await page.setViewportSize({width,height});await page.goto(base);
    await page.getByRole('link',{name:'专题研究',exact:true}).waitFor();await settle();
    const layout=await page.evaluate(()=>{
      const live=node=>!node.closest('[aria-hidden="true"]')&&node.getBoundingClientRect().width>0;
      const entry=[...document.querySelectorAll('[data-night-home] [data-night-entry="03"]')].find(live);
      const navigation=[...document.querySelectorAll('[data-night-home] [role="navigation"]')].find(live);
      if(!entry||!navigation)return null;
      const rect=node=>{const {left,top,right,bottom,width,height}=node.getBoundingClientRect();return {left,top,right,bottom,width,height};};
      return {gap:navigation.getBoundingClientRect().top-entry.getBoundingClientRect().bottom,
        links:[...navigation.querySelectorAll('a[href]')].filter(live).map(rect)};
    });
    if(!layout||layout.gap<24)throw Error('home footer overlaps the third entry at '+width+'x'+height);
    if(layout.links.length!==4||layout.links.some(link=>link.width<44||link.height<44))throw Error('home footer lost its four 44px click targets at '+width+'x'+height);
    if(layout.links.some((link,index)=>layout.links.slice(index+1).some(other=>Math.min(link.right,other.right)>Math.max(link.left,other.left)
      &&Math.min(link.bottom,other.bottom)>Math.max(link.top,other.top))))throw Error('home footer click targets intersect at '+width+'x'+height);
    checks.push({name:'home-footer-spacing-'+width+'x'+height,gap:layout.gap});
  }

  const archiveRows=async()=>{
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-night-home] [data-motion-part="archive"] a[href*="/cocktails/"]')]
      .filter(node=>!node.closest('[aria-hidden="true"]')&&node.getBoundingClientRect().width>0).length===3);
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-night-home] [data-motion-part="archive"] img')]
      .filter(node=>!node.closest('[aria-hidden="true"]')&&node.getBoundingClientRect().width>0)
      .every(image=>image.complete&&image.naturalWidth>0));
    const rows=await page.evaluate(()=>[...document.querySelectorAll('[data-night-home] [data-motion-part="archive"] a[href*="/cocktails/"]')]
      .filter(node=>!node.closest('[aria-hidden="true"]')&&node.getBoundingClientRect().width>0)
      .map(link=>({id:link.querySelector('[data-motion-photo]').getAttribute('data-motion-photo'),href:link.getAttribute('href'),label:link.getAttribute('aria-label')})));
    if(rows.length!==3||new Set(rows.map(row=>row.id)).size!==3)throw Error('home archive did not show three different drinks');
    for(const row of rows){const url=new URL(row.href,base);if(!row.id||!row.label||url.pathname!==`/cocktails/${row.id}`||!url.searchParams.get('version')||url.searchParams.get('from')!=='welcome')throw Error('home archive lost a real recipe/version route');}
    return rows;
  };
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:874});await page.goto(base);await settle();
    const first=await archiveRows(),identity=rows=>JSON.stringify(rows.map(row=>[row.id,row.href]));
    await page.setViewportSize({width:width+12,height:874});await settle();
    if(identity(await archiveRows())!==identity(first))throw Error('resizing resampled the home archive');
    await page.setViewportSize({width,height:874});await settle();
    await page.getByRole('link',{name:first[0].label,exact:true}).click();await page.waitForURL('**/cocktails/**');await settle();
    if(new URL(page.url()).searchParams.get('version')!==new URL(first[0].href,base).searchParams.get('version'))throw Error('home archive changed the chosen recipe version');
    await page.locator('[data-motion-photo-return]').click();await page.waitForURL(url=>url.pathname==='/');await settle();
    if(identity(await archiveRows())!==identity(first))throw Error('recipe return resampled the shared home photo destination');
    const observed=new Set([identity(first)]);
    for(let visit=0;visit<4;visit++){
      await page.getByRole('link',{name:'随便逛逛',exact:true}).click();await page.waitForURL('**/discover');await settle();
      await page.getByRole('link',{name:'首页',exact:true}).click();await page.waitForURL(url=>url.pathname==='/');await settle();
      observed.add(identity(await archiveRows()));
    }
    if(observed.size===1)throw Error('five fresh home visits kept the permanently fixed archive');
    checks.push({name:'home-random-trio-and-recipe-return-'+width,distinctVisits:observed.size});
  }

  if (errors.length) throw Error('browser errors: ' + errors.join('; '));
  return {base, passed: true, count: checks.length, checks};
}
