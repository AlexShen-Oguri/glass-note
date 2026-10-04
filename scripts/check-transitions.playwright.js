// Run with playwright-cli run-code on a local preview in an isolated zh-CN browser.
// Exercises user-visible behaviour; no GSAP internals or application test hooks required.
async page => {
  const base = new URL('/', page.url()).href;
  const checks = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const settle = () => page.waitForTimeout(850);
  const begin = () => page.evaluate(() => {
    const evidence = {animated: false, maxPromotedCards: 0, clonedPages: 0};
    const sample = () => {
      const transitions = [...document.querySelectorAll('[data-motion-transition]')];
      evidence.animated ||= transitions.some(node => node.style.willChange.includes('transform'))
        || [...document.querySelectorAll('[data-motion-part]')].some(node => node.style.willChange.includes('transform'));
      evidence.maxPromotedCards = Math.max(evidence.maxPromotedCards,
        document.querySelectorAll('[data-motion-item][style*="will-change"]').length);
      evidence.animated ||= evidence.maxPromotedCards > 0;
      evidence.clonedPages = Math.max(evidence.clonedPages,
        [...document.body.children].filter(node => node.getAttribute('aria-hidden') === 'true' && node.style.position === 'fixed' && !node.hasAttribute('data-motion-photo-relay')).length);
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['style']});
    sample();
    window.__finishMotionCheck = () => {sample(); observer.disconnect(); return evidence;};
  });
  const finish = async (name, animated = true) => {
    await settle();
    const evidence = await page.evaluate(() => window.__finishMotionCheck());
    if (evidence.clonedPages) throw Error(name + ': retained a duplicate page');
    if (animated !== evidence.animated) throw Error(name + ': wrong motion preference ' + JSON.stringify(evidence));
    const residual = await page.locator('[data-motion-transition][style*="will-change"]').count();
    if (residual || await page.locator('[data-motion-item][style*="will-change"]').count() || await page.locator('[data-motion-part][style*="will-change"]').count()) throw Error(name + ': transition did not release its layer');
    if (evidence.maxPromotedCards > 8) throw Error(name + ': animated too many cards');
    checks.push({name, ...evidence});
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
      await page.waitForTimeout(400);
    }
    await page.getByRole('button', {name: '找一杯适合我的 →', exact: true}).click();
  };
  for (const width of [1280, 390, 402]) {
    await page.setViewportSize({width, height: width === 1280 ? 800 : 874});
    await page.goto(base);
    await settle();
    await begin();
    await page.getByRole('button', {name: '为我定制', exact: true}).click();
    await finish('home-to-mode-' + width);
    const direction = await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true})
      .evaluate(node => getComputedStyle(node.parentElement).flexDirection);
    if (direction !== 'column') throw Error('incorrect editorial mode layout');
    await begin();
    await page.getByRole('button', {name: '喝一杯 → 按口味找一杯喜欢的酒', exact: true}).click();
    await finish('mode-to-flavour-' + width);
    await page.getByRole('button', {name: /柑橘.*柠檬皮/}).click();
    const progress = await page.locator('[data-motion-progress]').elementHandle();
    const actions = await page.locator('[data-motion-actions]').elementHandle();
    const summary = await page.locator('[data-motion-summary]').elementHandle();
    await begin();
    await page.getByRole('button', {name: '继续 →', exact: true}).click();
    await finish('flavour-to-taste-' + width);
    if (!await progress.evaluate(node => node.isConnected) || !await actions.evaluate(node => node.isConnected) || !await summary.evaluate(node => node.isConnected)) throw Error('question relay remounted its persistent frame');
    if (await page.locator('[data-motion-transition][inert]').count()) throw Error('question relay locked its live UI');
    await page.getByRole('button', {name: '返回', exact: true}).click();
    await settle();
    const selected = await page.getByRole('button', {name: /柑橘.*柠檬皮/}).textContent();
    if (!selected?.includes('已选')) throw Error('step transition reset flavour selection');
    checks.push({name: 'step-selection-preserved-' + width});
    await begin();
    await page.goBack();
    await finish('history-back-' + width);

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
  await page.goto(base); await settle();
  await page.getByRole('button', {name: '继续动效', exact: true}).click();
  await page.waitForTimeout(300);
  const resumed = await sculpture.getAttribute('data-glass-motion');
  await page.waitForTimeout(300);
  const moving = await sculpture.getAttribute('data-glass-motion');
  if (canvas && (resumed !== 'running' || moving !== 'running')) throw Error('sculpture did not resume');
  checks.push({name: 'loop-pause-resume', webglAvailable: Boolean(canvas), paused, still, resumed, moving});

  await page.goto(base); await settle(); await begin();
  await page.getByRole('button', {name: '为我定制', exact: true}).click();
  await page.waitForTimeout(50); await page.goBack();
  await finish('rapid-navigation');
  await page.getByRole('heading', {name: '今天你想喝点什么', exact: true}).waitFor();

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
    await finish('visible-card-stagger-' + width);

  }

  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 874});
    await startGuided(); await submitGuided();
    const ready = await page.locator('[data-reveal-results]').evaluate(node => node.getAttribute('aria-hidden') !== 'true' && !node.closest('[inert]') && getComputedStyle(node).pointerEvents !== 'none');
    if (!ready) throw Error('live results waited for the presentation tail');
    const recipe = page.locator('[data-reveal-results] [data-motion-item] a[href*="/cocktails/"]').first();
    const href = await recipe.getAttribute('href');
    await recipe.click();
    await page.waitForURL('**/cocktails/**');
    if (!page.url().includes(new URL(href, base).pathname) || !page.url().includes('version=')) throw Error('photo relay lost the selected source version');
    await settle();
    if (await page.locator('canvas[data-motion-photo-relay]').count()) throw Error('photo relay retained its presentation layer');
    const imageReady = await page.locator('[data-motion-photo-target]').evaluate(node => getComputedStyle(node).opacity !== '0');
    if (!imageReady) throw Error('photo relay left the live recipe photo hidden');
    await page.locator('[data-motion-photo-return]').click();
    await page.waitForURL('**/customize');
    await settle();
    if (await page.getByTestId('guided-reveal-stage').count()) throw Error('returning replayed an unfinished business reveal');
    const invisiblePhotos = await page.locator('[data-reveal-results]').evaluate(root => [...root.querySelectorAll('img')]
      .some(image => {const parent = image.closest('[style*="visibility: hidden"]'); return Boolean(parent);}));
    if (invisiblePhotos) throw Error('photo handoff left a hidden result');
    checks.push({name: 'live-results-photo-relay-' + width});
    await startGuided(); await submitGuided();
    const skip = page.getByTestId('guided-reveal-stage');
    if (await skip.count()) await skip.click();
    await page.getByTestId('guided-reveal-stage').waitFor({state: 'detached'});
    checks.push({name: 'reveal-skip-' + width});
  }

  // Interrupt an active reveal with the system preference rather than a reload.
  await startGuided(); await submitGuided();
  await page.getByTestId('guided-reveal-stage').waitFor();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.getByTestId('guided-reveal-stage').waitFor({state: 'detached'});
  if (await page.locator('[data-reveal-results]').getAttribute('aria-hidden') === 'true') throw Error('interrupted reveal kept results hidden');
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

  if (errors.length) throw Error('browser errors: ' + errors.join('; '));
  return {base, passed: true, count: checks.length, checks};
}
