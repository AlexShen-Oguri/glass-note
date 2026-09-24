import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../contracts';
import {appNavigationText, type AppNavigationKey} from '../../i18n/app-navigation';
import {collectionCountState, parseRecipeRouteParams, primarySectionForPath, recipeReturnPath, shouldShowPrimaryNavigation} from './navigation-state';

test('maps primary destinations and their nested routes to one selected section', () => {
  assert.equal(primarySectionForPath('/discover'), 'explore');
  assert.equal(primarySectionForPath('/cocktails/negroni?version=iba'), 'explore');
  assert.equal(primarySectionForPath('/cocktails/negroni', 'favorites'), 'my');
  assert.equal(primarySectionForPath('/cocktails/negroni', 'ingredients'), 'cabinet');
  assert.equal(primarySectionForPath('/cocktails/negroni', 'professional'), 'professional');
  assert.equal(primarySectionForPath('/ingredients/campari/'), 'cabinet');
  assert.equal(primarySectionForPath('/pantry'), 'cabinet');
  assert.equal(primarySectionForPath('/professional'), 'professional');
  assert.equal(primarySectionForPath('/lab?project=one'), 'professional');
  assert.equal(primarySectionForPath('/topics/competition'), 'professional');
  assert.equal(primarySectionForPath('/bottles'), 'professional');
  assert.equal(primarySectionForPath('/my'), 'my');
  assert.equal(primarySectionForPath('/help'), 'my');
  assert.equal(primarySectionForPath('/favorites'), 'my');
});

test('keeps the welcome and immersive customization routes free of primary navigation', () => {
  assert.equal(shouldShowPrimaryNavigation('/'), false);
  assert.equal(shouldShowPrimaryNavigation('/customize'), false);
  assert.equal(shouldShowPrimaryNavigation('/customize/'), false);
  assert.equal(shouldShowPrimaryNavigation('/discover'), true);
  assert.equal(shouldShowPrimaryNavigation('/cocktails/negroni'), true);
});

test('does not select a tab for unrelated routes', () => {
  assert.equal(primarySectionForPath('/unknown'), null);
});

test('provides readable primary labels and hub copy in all eight locales', () => {
  const keys: AppNavigationKey[] = [
    'explore', 'cabinet', 'professional', 'my', 'professionalIntro', 'myIntro',
    'preferencesDescription', 'preferencesStorageWarning', 'localDataDescription',
    'countLoading', 'countUnavailable',
  ];
  assert.equal(LOCALES.length, 8);
  for (const locale of LOCALES) {
    for (const key of keys) assert.ok(appNavigationText(locale, key).trim().length > 0, `${locale}.${key}`);
  }
});

test('does not present an unread personal collection as an empty collection', () => {
  assert.equal(collectionCountState(false, true), 'loading');
  assert.equal(collectionCountState(false, false), 'unavailable');
  assert.equal(collectionCountState(true, false), 'value');
});

test('normalizes recipe deep-link parameters without dropping their source context', () => {
  assert.deepEqual(parseRecipeRouteParams({id: 'martini', version: 'iba', from: 'professional'}), {
    id: 'martini', version: 'iba', from: 'professional',
  });
  assert.deepEqual(parseRecipeRouteParams({id: ['martini'], version: ['iba', 'old'], from: ['favorites', 'discover']}), {
    id: 'martini', version: 'iba', from: 'favorites',
  });
  assert.deepEqual(parseRecipeRouteParams({id: 'martini', from: 'unknown'}), {
    id: 'martini', version: undefined, from: 'discover',
  });
});

test('uses the source area as the no-history recipe return destination', () => {
  assert.equal(recipeReturnPath('find'), '/discover');
  assert.equal(primarySectionForPath('/find'), 'explore');
  assert.deepEqual(parseRecipeRouteParams({id:'dry-martini',version:'dry-martini-ideal-gin',from:['find']}), {
    id: 'dry-martini', version: 'dry-martini-ideal-gin', from: 'discover',
  });
  assert.equal(recipeReturnPath('pantry'), '/pantry');
  assert.equal(primarySectionForPath('/cocktails/negroni','pantry'),'cabinet');
  assert.equal(primarySectionForPath('/make?session=current'),'cabinet');
  assert.equal(recipeReturnPath('professional'), '/professional');
  assert.equal(recipeReturnPath('favorites'), '/favorites');
  assert.equal(recipeReturnPath('ingredients'), '/ingredients');
  assert.equal(recipeReturnPath('discover'), '/discover');
  assert.equal(recipeReturnPath('customize'), '/customize');
});
