/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import {catalogue} from '../../content/catalogue';
import {matchVersion, searchCocktails} from '../search';
import {createGuidedSession, guidedReducer} from './session';
import type {GuidedAction, GuidedSession} from './types';

function dispatch(state: GuidedSession, ...actions: GuidedAction[]): GuidedSession {
  return actions.reduce(guidedReducer, state);
}

test('mode switches retain choices and submitted source query, but clear empty-pantry consent', () => {
  const chosen = dispatch(createGuidedSession(), {type:'set-mode',mode:'make'},
    {type:'allow-pantry-fallback'}, {type:'toggle',field:'flavours',value:'floral'},
    {type:'set-context',selection:{season:'summer'}}, {type:'next'}, {type:'next'}, {type:'next'}, {type:'begin'});
  assert.equal(chosen.pantryFallback,true);
  const switched=guidedReducer(chosen,{type:'set-mode',mode:'drink'});
  assert.equal(switched.phase,'results');
  assert.equal(switched.pantryFallback,false);
  assert.deepEqual(switched.submitted,{flavours:['floral']});
  assert.deepEqual(switched.contextSubmitted,{season:'summer'});
  assert.deepEqual(switched.draft,chosen.draft);
  const back=guidedReducer(switched,{type:'set-mode',mode:null});
  assert.equal(back.step,3);
  assert.deepEqual(back.draft,chosen.draft);
  assert.deepEqual(guidedReducer(back,{type:'restart'}),createGuidedSession());
});

test('empty-pantry exception requires make mode and legacy sessions remain usable', () => {
  const initial=createGuidedSession();
  assert.strictEqual(guidedReducer(initial,{type:'allow-pantry-fallback'}),initial);
  const {mode,pantryFallback,...legacy}=initial;
  assert.equal(guidedReducer(legacy,{type:'next'}).step,1);
  assert.equal(guidedReducer(legacy,{type:'set-mode',mode:'make'}).mode,'make');
});

test('creates an empty choosing session and restart resets every phase field', () => {
  assert.deepEqual(createGuidedSession(), {
    mode: null,
    pantryFallback: false,
    step: 0,
    phase: 'choosing',
    draft: {},
    submitted: null,
    contextDraft: {},
    contextSubmitted: null,
  });

  const changed = dispatch(
    createGuidedSession(),
    {type: 'toggle', field: 'flavours', value: 'citrus'},
    {type: 'next'},
  );
  assert.deepEqual(guidedReducer(changed, {type: 'restart'}), createGuidedSession());
});

test('context selection is normalized only while choosing and survives ordinary field skips', () => {
  let state = dispatch(
    createGuidedSession(),
    {type: 'set-context', selection: {occasion: 'meal', season: 'summer'}},
    {type: 'skip'},
  );
  assert.equal(state.step, 1);
  assert.deepEqual(state.contextDraft, {occasion: 'meal', season: 'summer'});
  assert.equal(state.contextSubmitted, null);

  state = guidedReducer(state, {
    type: 'set-context',
    selection: {occasion: 'invalid' as never, season: 'winter'},
  });
  assert.deepEqual(state.contextDraft, {season: 'winter'});

  const revealing = dispatch(state, {type: 'next'}, {type: 'next'}, {type: 'begin'});
  assert.strictEqual(
    guidedReducer(revealing, {type: 'set-context', selection: {occasion: 'aperitif'}}),
    revealing,
  );
});

test('begin and final skip snapshot context, edit keeps its draft, and restart clears both', () => {
  let state = dispatch(
    createGuidedSession(),
    {type: 'set-context', selection: {occasion: 'slow-sip', season: 'winter'}},
    {type: 'next'},
    {type: 'next'},
    {type: 'next'},
    {type: 'begin'},
  );
  assert.deepEqual(state.contextSubmitted, {occasion: 'slow-sip', season: 'winter'});
  assert.notStrictEqual(state.contextSubmitted, state.contextDraft);
  state = dispatch(
    state,
    {type: 'finish'},
    {type: 'edit', step: 0},
    {type: 'set-context', selection: {occasion: 'celebration', season: 'summer'}},
  );
  assert.deepEqual(state.contextDraft, {occasion: 'celebration', season: 'summer'});
  assert.deepEqual(state.contextSubmitted, {occasion: 'slow-sip', season: 'winter'});

  state = dispatch(state, {type: 'next'}, {type: 'next'}, {type: 'next'}, {type: 'skip'});
  assert.equal(state.phase, 'revealing');
  assert.deepEqual(state.contextSubmitted, {occasion: 'celebration', season: 'summer'});
  assert.notStrictEqual(state.contextSubmitted, state.contextDraft);
  assert.deepEqual(guidedReducer(state, {type: 'restart'}), createGuidedSession());
});

test('moves within step bounds and skip clears only the current field', () => {
  let state = dispatch(
    createGuidedSession(),
    {type: 'back'},
    {type: 'toggle', field: 'flavours', value: 'citrus'},
    {type: 'toggle', field: 'tastes', value: 'sweet'},
    {type: 'toggle', field: 'excluded', value: 'egg'},
    {type: 'next'},
    {type: 'skip'},
  );

  assert.equal(state.step, 2);
  assert.deepEqual(state.draft, {flavours: ['citrus'], excluded: ['egg']});

  state = dispatch(
    state,
    {type: 'next'},
    {type: 'toggle', field: 'approachability', value: 'gentle'},
    {type: 'next'},
  );
  assert.equal(state.step, 3);
  assert.equal(state.phase, 'choosing');

  state = guidedReducer(state, {type: 'skip'});
  assert.equal(state.phase, 'revealing');
  assert.deepEqual(state.draft, {flavours: ['citrus'], excluded: ['egg']});
  assert.deepEqual(state.submitted, state.draft);
  assert.notStrictEqual(state.submitted, state.draft);
});

test('revisiting a completed stage is idempotent and cannot skip forward', () => {
  const last = dispatch(createGuidedSession(),
    {type:'toggle', field:'flavours', value:'citrus'},
    {type:'next'}, {type:'next'}, {type:'next'});
  const reviewed = dispatch(last, {type:'review', step:1}, {type:'review', step:1});
  assert.equal(reviewed.step, 1);
  assert.deepEqual(reviewed.draft, last.draft);
  for (const step of [-1, 1.5, 2, 4]) {
    assert.strictEqual(guidedReducer(reviewed, {type:'review', step}), reviewed);
  }
  const revealing = guidedReducer(last, {type:'begin'});
  assert.strictEqual(guidedReducer(revealing, {type:'review', step:0}), revealing);
});

test('supports multi-select flavours, tastes, and exclusions plus cancellable single selects', () => {
  let state = dispatch(
    createGuidedSession(),
    {type: 'toggle', field: 'flavours', value: 'citrus'},
    {type: 'toggle', field: 'flavours', value: 'fruit'},
    {type: 'toggle', field: 'tastes', value: 'sour'},
    {type: 'toggle', field: 'tastes', value: 'sweet'},
    {type: 'toggle', field: 'excluded', value: 'egg'},
    {type: 'toggle', field: 'excluded', value: 'gin'},
    {type: 'toggle', field: 'excluded', value: 'none'},
    {type: 'toggle', field: 'strengths', value: 'low'},
    {type: 'toggle', field: 'strengths', value: 'strong'},
    {type: 'toggle', field: 'approachability', value: 'bold'},
  );

  assert.deepEqual(state.draft, {
    flavours: ['citrus', 'fruit'],
    tastes: ['sour', 'sweet'],
    strengths: ['strong'],
    approachability: ['bold'],
    excluded: ['egg', 'gin', 'none'],
  });

  state = dispatch(
    state,
    {type: 'toggle', field: 'strengths', value: 'strong'},
    {type: 'toggle', field: 'approachability', value: 'bold'},
    {type: 'toggle', field: 'flavours', value: 'citrus'},
  );
  assert.deepEqual(state.draft.flavours, ['fruit']);
  assert.equal(state.draft.strengths, undefined);
  assert.equal(state.draft.approachability, undefined);
});

test('new spirit exclusions survive the guided submission', () => {
  const state = dispatch(createGuidedSession(),
    {type: 'toggle', field: 'excluded', value: 'mezcal'},
    {type: 'toggle', field: 'excluded', value: 'cachaca'},
    {type: 'toggle', field: 'excluded', value: 'grappa'},
    {type: 'next'}, {type: 'next'}, {type: 'next'}, {type: 'begin'},
  );
  assert.deepEqual(state.submitted?.excluded, ['mezcal', 'cachaca', 'grappa']);
  const ids = searchCocktails(catalogue, state.submitted!).map(result => result.cocktailId);
  for (const excludedDrink of ['naked-and-famous', 'caipirinha', 've-n-to']) {
    assert.equal(ids.includes(excludedDrink), false, excludedDrink);
  }
});

test('ignores invalid toggles and phase-inappropriate or boundary actions', () => {
  const initial = createGuidedSession();
  assert.strictEqual(
    guidedReducer(initial, {type: 'toggle', field: 'flavours', value: 'umami'}),
    initial,
  );
  assert.strictEqual(guidedReducer(initial, {type: 'back'}), initial);
  assert.strictEqual(guidedReducer(initial, {type: 'begin'}), initial);
  assert.strictEqual(guidedReducer(initial, {type: 'finish'}), initial);
  assert.strictEqual(guidedReducer(initial, {type: 'edit', step: 1}), initial);

  const revealing = dispatch(
    initial,
    {type: 'next'},
    {type: 'next'},
    {type: 'next'},
    {type: 'begin'},
  );
  assert.strictEqual(guidedReducer(revealing, {type: 'begin'}), revealing);
  assert.strictEqual(
    guidedReducer(revealing, {type: 'toggle', field: 'tastes', value: 'dry'}),
    revealing,
  );

  const results = guidedReducer(revealing, {type: 'finish'});
  assert.equal(results.phase, 'results');
  assert.strictEqual(guidedReducer(results, {type: 'finish'}), results);
});

test('isolates submitted values and replaces them only after editing and beginning again', () => {
  let state = dispatch(
    createGuidedSession(),
    {type: 'toggle', field: 'flavours', value: 'citrus'},
    {type: 'next'},
    {type: 'next'},
    {type: 'toggle', field: 'strengths', value: 'none'},
    {type: 'next'},
    {type: 'begin'},
    {type: 'finish'},
  );
  const firstSubmission = state.submitted;
  assert.ok(firstSubmission);
  assert.notStrictEqual(firstSubmission.flavours, state.draft.flavours);

  state = dispatch(
    state,
    {type: 'edit', step: 2},
    {type: 'toggle', field: 'strengths', value: 'none'},
    {type: 'toggle', field: 'strengths', value: 'strong'},
    {type: 'next'},
  );
  assert.deepEqual(firstSubmission, {flavours: ['citrus'], strengths: ['none']});
  assert.strictEqual(state.submitted, firstSubmission);

  state = guidedReducer(state, {type: 'begin'});
  assert.deepEqual(state.submitted, {flavours: ['citrus'], strengths: ['strong']});
  assert.notStrictEqual(state.submitted, firstSubmission);
});

test('keeps guided drafts free of browse-only query fields', () => {
  const polluted: GuidedSession = {
    ...createGuidedSession(),
    draft: {
      text: 'martini',
      bases: ['gin'],
      brandIds: ['brand-plymouth'],
      locale: 'fr',
      flavours: ['herbal'],
    },
  };

  const state = guidedReducer(polluted, {type: 'next'});
  assert.deepEqual(state.draft, {flavours: ['herbal']});
});

test('submitted guided queries use real version-level search, including exclusions and empty results', () => {
  let state = dispatch(
    createGuidedSession(),
    {type: 'toggle', field: 'excluded', value: 'egg'},
    {type: 'next'},
    {type: 'next'},
    {type: 'toggle', field: 'strengths', value: 'none'},
    {type: 'next'},
    {type: 'begin'},
  );
  assert.ok(state.submitted);

  const alcoholFreeWithoutEgg = searchCocktails(catalogue, state.submitted);
  assert.deepEqual(alcoholFreeWithoutEgg.map(({cocktailId}) => cocktailId), ['mojito-mocktail']);
  for (const result of alcoholFreeWithoutEgg) {
    for (const versionId of result.versionIds) {
      const version = catalogue.versions.find(({id}) => id === versionId);
      assert.ok(version);
      assert.equal(matchVersion(catalogue, version, state.submitted), true);
    }
  }

  state = dispatch(
    state,
    {type: 'finish'},
    {type: 'edit', step: 0},
    {type: 'toggle', field: 'flavours', value: 'fruit'},
    {type: 'next'},
    {type: 'next'},
    {type: 'next'},
    {type: 'begin'},
  );
  assert.ok(state.submitted);
  assert.deepEqual(searchCocktails(catalogue, state.submitted), []);
});
