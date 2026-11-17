import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue, Localized, RecipeVersion} from '../contracts';
import {recipeSnapshot} from '../making';
import {searchCocktails} from '../search';
import * as taste from '.';

const L = (value: string): Localized => ({en: value, zh: value, fr: value, de: value, es: value, ko: value, ja: value, it: value});
const NOW = '2026-10-17T12:00:00Z';
const LATER = '2026-10-17T13:00:00Z';
const neutral: taste.TasteFeedbackInput = {experience: 'drank', sentiment: 'neutral', tooSweet: false, tooStrong: false, likedFlavours: [], notes: ''};

function version(id: string, options: Partial<RecipeVersion> = {}): RecipeVersion {
  return {
    id, cocktailId: id, label: L(id), sourceId: 'source', servings: 1,
    ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml'}],
    steps: {en: ['Mix'], zh: ['Mix'], fr: ['Mix'], de: ['Mix'], es: ['Mix'], ko: ['Mix'], ja: ['Mix'], it: ['Mix']},
    originalLanguage: 'en', glass: L('Glass'), garnish: L('None'), flavours: [], tastes: [],
    strength: null, approachability: null, profileBasis: 'source', profileNote: L('Source facts'),
    sourceChecked: true, translationStatus: 'draft', ...options,
  };
}

function catalogue(versions: RecipeVersion[]): Catalogue {
  return {
    versions, ingredients: [{id: 'gin', name: L('Gin'), exclusionTags: [], compositionKnown: true}], brands: [],
    sources: [{id: 'source', title: 'Source', url: 'https://example.com/recipe', checkedAt: '2026-10-17'}],
    cocktails: versions.map(item => ({id: item.cocktailId, name: L(item.cocktailId), aliases: [], category: 'classic', description: L('Drink'), versionIds: [item.id], defaultVersionId: item.id, accent: '#fff'})),
  };
}

function feedback(id: string, input: Partial<taste.TasteFeedbackInput> = {}, recipe = recipeSnapshot(catalogue([version(`memory-${id}`)]), `memory-${id}`)!, now = NOW): taste.TasteFeedback {
  return taste.createFeedback(recipe, id, now, {...neutral, ...input});
}

function state(entries: taste.TasteFeedback[] = []): taste.TasteState {
  return {...taste.emptyTasteState(), entries};
}

test('independent explicit flavour observations strengthen ordering beyond one observation', () => {
  const data = catalogue([version('alpha', {flavours: ['citrus']}), version('beta', {flavours: ['herbal']})]);
  const entries = [feedback('citrus', {likedFlavours: ['citrus']}), ...['a', 'b', 'c'].map(id => feedback(id, {likedFlavours: ['herbal']}))];
  assert.equal(searchCocktails(data, {})[0]!.cocktailId, 'alpha');
  assert.equal(taste.rankWithTaste(data, {}, state(entries))[0]!.cocktailId, 'beta');
});

test('empty, experience-only and note-only records do not become profile evidence', () => {
  const empty = {ratedRecipeCount: 0, featureRecipeCount: 0, flavours: [], sweetness: null, strength: null};
  assert.deepEqual(taste.deriveTasteProfile(state()), empty);
  const entries = [
    feedback('drank'), feedback('made', {experience: 'made'}),
    feedback('notes', {experience: 'both', notes: 'I love herbal drinks, dislike sweetness and want less alcohol'}),
  ];
  assert.deepEqual(taste.deriveTasteProfile(state(entries)), empty);
  const data = catalogue([version('alpha'), version('beta')]);
  assert.deepEqual(taste.rankWithTaste(data, {}, state(entries)), searchCocktails(data, {}).map(result => ({...result, memoryReasons: []})));
});

test('liking or disliking a source version counts as a rating without inventing feature preferences', () => {
  const original = catalogue([version('original', {flavours: ['herbal'], tastes: ['sweet'], strength: 'strong'})]);
  const recipe = recipeSnapshot(original, 'original')!;
  const entries = [feedback('liked', {sentiment: 'like'}, recipe), feedback('disliked', {sentiment: 'dislike'})];
  assert.deepEqual(taste.deriveTasteProfile(state(entries)), {ratedRecipeCount: 2, featureRecipeCount: 0, flavours: [], sweetness: null, strength: null});
  const current = catalogue([version('alpha'), version('beta', {flavours: ['herbal'], tastes: ['sweet'], strength: 'strong'})]);
  assert.deepEqual(taste.rankWithTaste(current, {}, state(entries)), taste.rankWithTaste(current, {}, state()));
});

test('one hundred duplicate observations of a frozen recipe retain one latest sample', () => {
  const recipe = recipeSnapshot(catalogue([version('same')]), 'same')!;
  const entries = Array.from({length: 100}, (_, index) => feedback(`repeat-${String(index).padStart(3, '0')}`, {likedFlavours: ['herbal'], tooSweet: true, tooStrong: true}, recipe));
  const profile = taste.deriveTasteProfile(state(entries));
  assert.equal(profile.ratedRecipeCount, 1);
  assert.equal(profile.featureRecipeCount, 1);
  assert.deepEqual(profile.flavours, [{flavour: 'herbal', supportCount: 1, weight: 2 / 3, feedbackIds: ['repeat-099']}]);
  assert.deepEqual(profile.sweetness, {supportCount: 1, weight: 2 / 3, feedbackIds: ['repeat-099']});
  assert.deepEqual(profile.strength, {supportCount: 1, weight: 2 / 3, feedbackIds: ['repeat-099']});
});

test('independent feature signals grow conservatively without using unrelated ratings as negative evidence', () => {
  const entries = ['a', 'b', 'c'].map(id => feedback(id, {likedFlavours: ['herbal'], tooSweet: true, tooStrong: true}));
  for (const [count, expected] of [[1, 2 / 3], [2, 1], [3, 1.2]] as const) {
    const profile = taste.deriveTasteProfile(state(entries.slice(0, count)));
    assert.equal(profile.flavours[0]!.weight, expected);
    assert.equal(profile.sweetness!.weight, expected);
    assert.equal(profile.strength!.weight, expected);
  }
  const many = taste.deriveTasteProfile(state(Array.from({length: 100}, (_, index) => feedback(`independent-${index}`, {likedFlavours: ['herbal']}))));
  assert.equal(many.flavours[0]!.supportCount, 100);
  assert(many.flavours[0]!.weight > 1.2 && many.flavours[0]!.weight < 2);
  const withUnrelated = taste.deriveTasteProfile(state([...entries, feedback('neutral'), feedback('exact-only', {sentiment: 'dislike'})]));
  assert.equal(withUnrelated.ratedRecipeCount, 4);
  assert.equal(withUnrelated.featureRecipeCount, 3);
  assert.equal(withUnrelated.flavours[0]!.weight, 1.2);
});

test('editing and deleting a latest observation recompute every signal from remaining snapshots', () => {
  const recipe = recipeSnapshot(catalogue([version('same')]), 'same')!;
  const old = feedback('old', {likedFlavours: ['citrus'], tooSweet: true}, recipe);
  const latest = feedback('latest', {likedFlavours: ['herbal'], tooStrong: true}, recipe, LATER);
  const other = feedback('other', {likedFlavours: ['coffee']});
  const edited = taste.editFeedback(latest, '2026-10-17T14:00:00Z', neutral);
  assert.deepEqual(taste.deriveTasteProfile(state([old, edited, other])), {
    ratedRecipeCount: 1, featureRecipeCount: 1,
    flavours: [{flavour: 'coffee', supportCount: 1, weight: 2 / 3, feedbackIds: ['other']}], sweetness: null, strength: null,
  });
  const deleted = taste.deriveTasteProfile(state([old, other]));
  assert.equal(deleted.ratedRecipeCount, 2);
  assert.deepEqual(deleted.flavours.map(signal => signal.flavour), ['citrus', 'coffee']);
  assert.deepEqual(deleted.sweetness, {supportCount: 1, weight: 2 / 3, feedbackIds: ['old']});
  assert.equal(deleted.strength, null);
});

test('profile features, evidence links and equal-time duplicate choice are stable after import reordering', () => {
  const recipe = recipeSnapshot(catalogue([version('same')]), 'same')!;
  const entries = [
    feedback('same-a', {likedFlavours: ['coffee']}, recipe),
    feedback('same-z', {likedFlavours: ['coffee', 'spice', 'herbal', 'floral', 'fruit', 'citrus'], tooSweet: true, tooStrong: true}, recipe),
    ...['d', 'b', 'a', 'c'].map(id => feedback(id, {likedFlavours: ['herbal']})),
  ];
  const profile = taste.deriveTasteProfile(state(entries));
  assert.deepEqual(profile, taste.deriveTasteProfile(state([...entries].reverse())));
  assert.deepEqual(profile.flavours.map(signal => signal.flavour), ['citrus', 'fruit', 'floral', 'herbal', 'spice', 'coffee']);
  assert.deepEqual(profile.flavours.find(signal => signal.flavour === 'herbal'), {flavour: 'herbal', supportCount: 5, weight: 10 / 7, feedbackIds: ['a', 'b', 'c']});
  const data = catalogue([version('alpha'), version('beta', {flavours: ['coffee', 'herbal']})]);
  const ranked = taste.rankWithTaste(data, {}, state(entries));
  assert.deepEqual(ranked, taste.rankWithTaste(data, {}, state([...entries].reverse())));
  assert.deepEqual(ranked[0]!.memoryReasons.map(reason => ({flavours: reason.flavours, count: reason.supportCount})), [{flavours: ['herbal'], count: 5}, {flavours: ['coffee'], count: 1}]);
});

test('sweet and strong caution weights reflect their own independent support without guessing unknown profiles', () => {
  const data = catalogue([version('alpha', {tastes: ['sweet']}), version('beta', {strength: 'strong'}), version('gamma')]);
  const entries = [...['a', 'b', 'c'].map(id => feedback(id, {tooSweet: true})), feedback('strong', {tooStrong: true})];
  const ranked = taste.rankWithTaste(data, {}, state(entries));
  assert.deepEqual(ranked.map(result => result.cocktailId), ['gamma', 'beta', 'alpha']);
  assert.deepEqual(ranked[0]!.memoryReasons, []);
  assert.deepEqual(ranked[1]!.memoryReasons, [{kind: 'strong-caution', supportCount: 1, feedbackIds: ['strong']}]);
  assert.deepEqual(ranked[2]!.memoryReasons, [{kind: 'sweet-caution', supportCount: 3, feedbackIds: ['a', 'b', 'c']}]);
});

test('changed frozen versions retain independent feature evidence while exact sentiment stays isolated', () => {
  const oldData = catalogue([version('reused')]);
  const changed = catalogue([version('reused', {ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml'}], flavours: ['herbal']})]);
  const liked = feedback('old', {sentiment: 'like', likedFlavours: ['herbal']}, recipeSnapshot(oldData, 'reused')!);
  const disliked = feedback('changed', {sentiment: 'dislike', likedFlavours: ['herbal']}, recipeSnapshot(changed, 'reused')!, LATER);
  const memories = state([liked, disliked]);
  assert.equal(taste.deriveTasteProfile(memories).ratedRecipeCount, 2);
  assert.equal(taste.deriveTasteProfile(memories).flavours[0]!.supportCount, 2);
  const originalResult = taste.rankWithTaste(oldData, {}, memories)[0]!;
  assert.deepEqual(originalResult.memoryReasons, [{kind: 'liked-version', feedbackIds: ['old']}]);
  const changedResult = taste.rankWithTaste(changed, {}, state([liked]))[0]!;
  assert.deepEqual(changedResult.memoryReasons, [{kind: 'liked-flavour', flavours: ['herbal'], supportCount: 1, feedbackIds: ['old']}]);
});
