import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {catalogue} from '../../content/catalogue';
import type {Ingredient, Locale} from '../../domain/contracts';
import {
  activePrivateRecipeRevision,
  catalogueRecipeOrigin,
  clonePrivateRecipeContent,
  labRecipeOrigin,
  searchPrivateRecipes,
} from '../../domain/private-recipes';
import type {PrivateIngredient, PrivateRecipe, PrivateRecipeContent, PrivateRecipeOrigin, PrivateRecipeRevision} from '../../domain/private-recipes/types';
import {useApp} from '../../platform/AppProvider';
import {useLab} from '../../platform/LabProvider';
import {usePrivateRecipes} from '../../platform/PrivateRecipesProvider';
import {PrivateRecipeMutationError, PrivateRecipePersistenceError} from '../../platform/privateRecipeStore';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, serif, useViewport} from '../discovery/components';
import {Action, Fold, Panel, ws} from '../workspace/ui';
import {privateRecipeText as text} from './copy';
import {IngredientPicker} from './IngredientPicker';
import {chooseRecipePhoto} from '../../platform/recipePhoto';
import {refinementText} from '../../i18n/experience-refinement';

type RouteParams = {id?: string; fromVersion?: string; create?: string; fromLab?: string; labVersion?: string};
const rowId = () => `ingredient-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const blankContent = (): PrivateRecipeContent => ({title: '', description: '', servings: 1,
  ingredients: [{id: rowId(), name: '', amount: '', unit: 'ml'}], steps: [], method: '', glass: '', garnish: '', notes: ''});

export default function PrivateRecipesScreen() {
  const app = useApp();
  const {locale} = app;
  const store = usePrivateRecipes();
  const lab = useLab();
  const liveParams = useLocalSearchParams<RouteParams>();
  const [params, setParams] = useState<RouteParams>({});
  const cache = useRef(new Map<string, PrivateRecipe>());
  useEffect(() => setParams({id: liveParams.id, fromVersion: liveParams.fromVersion, create: liveParams.create,
    fromLab: liveParams.fromLab, labVersion: liveParams.labVersion}),
  [liveParams.create, liveParams.fromLab, liveParams.fromVersion, liveParams.id, liveParams.labVersion]);

  const liveRecipe = params.id ? store.recipes.find(item => item.id === params.id) : undefined;
  if (liveRecipe) cache.current.set(liveRecipe.id, liveRecipe);
  const selectedRecipe = params.id ? liveRecipe ?? cache.current.get(params.id) : undefined;

  const creation = useMemo((): {origin: PrivateRecipeOrigin; content: PrivateRecipeContent; error?: never} | {error: string} | null => {
    const capturedAt = new Date().toISOString();
    if (params.create === 'original') return {origin: {kind: 'original'}, content: blankContent()};
    if (params.fromVersion) {
      try {
        const origin = catalogueRecipeOrigin(catalogue, params.fromVersion, locale, capturedAt);
        return {origin, content: clonePrivateRecipeContent(origin.kind === 'catalogue-version' ? origin.snapshot : blankContent())};
      } catch { return {error: text(locale, 'fromVersionUnavailable')}; }
    }
    if (params.fromLab && params.labVersion) {
      const project = lab.projects.find(item => item.id === params.fromLab);
      if (!project) return lab.hydrated || lab.error ? {error: text(locale, 'fromLabUnavailable')} : null;
      try {
        const origin = labRecipeOrigin(project, params.labVersion, capturedAt);
        return {origin, content: clonePrivateRecipeContent(origin.kind === 'lab-version' ? origin.snapshot : blankContent())};
      } catch { return {error: text(locale, 'fromLabUnavailable')}; }
    }
    return null;
  }, [lab.hydrated, lab.projects, locale, params.create, params.fromLab, params.fromVersion, params.labVersion]);

  const goList = () => router.replace('/my-recipes' as never);
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.shell}>
          <BrandToolbar {...app} />
          <View style={styles.backRow}><Action quiet label={`← ${text(locale, 'back')}`} onPress={() => params.id || creation ? goList() : router.replace('/my' as never)} /></View>
          {!store.hydrated && !store.error ? <Text style={styles.status}>{text(locale, 'loading')}</Text> : null}
          {!store.hydrated && store.error ? <StatusPanel locale={locale} message={text(locale, 'unavailable')} retry={store.retry} /> : null}
          {store.hydrated && store.error === 'write' ? <StatusPanel locale={locale} message={text(locale, 'sessionOnly')} retry={store.retry} /> : null}
          {store.saving ? <Text accessibilityLiveRegion="polite" style={styles.status}>{text(locale, 'saving')}</Text> : null}
          {store.hydrated ? creation ? 'error' in creation
            ? <Panel><Text accessibilityRole="alert" style={styles.error}>{creation.error}</Text><Action label={text(locale, 'back')} onPress={goList} /></Panel>
            : <CreationEditor key={`${params.create ?? ''}-${params.fromVersion ?? ''}-${params.fromLab ?? ''}-${params.labVersion ?? ''}`} locale={locale} initial={creation.content} origin={creation.origin} onCancel={goList} />
            : params.fromLab && params.labVersion ? <Text style={styles.status}>{text(locale, 'loading')}</Text>
            : params.id ? selectedRecipe
              ? <RecipeDetails key={selectedRecipe.id} recipe={selectedRecipe} locale={locale} onBack={goList} />
              : <Panel><Text style={styles.body}>{text(locale, 'notFound')}</Text><Action label={text(locale, 'back')} onPress={goList} /></Panel>
              : <RecipeList locale={locale} recipes={store.recipes} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPanel({locale, message, retry}: {locale: Locale; message: string; retry: () => Promise<boolean>}) {
  const [busy, setBusy] = useState(false);
  return <Panel><Text accessibilityRole="alert" style={styles.warning}>{message}</Text><Action disabled={busy} label={text(locale, busy ? 'retrying' : 'retry')} onPress={() => { setBusy(true); void retry().finally(() => setBusy(false)); }} /></Panel>;
}

function CreationEditor({locale, initial, origin, onCancel}: {locale: Locale; initial: PrivateRecipeContent; origin: PrivateRecipeOrigin; onCancel: () => void}) {
  const store = usePrivateRecipes();
  const pendingRecipeId = useRef<string | undefined>(undefined);
  const save = async (content: PrivateRecipeContent, capturedOrigin: PrivateRecipeOrigin) => {
    let wrote = false;
    let recipeId = pendingRecipeId.current;
    if (!recipeId) {
      recipeId = store.create({origin: capturedOrigin, content});
      pendingRecipeId.current = recipeId;
      wrote = true;
    } else {
      const pending = store.getSnapshot().recipes.find(recipe => recipe.id === recipeId);
      if (!pending) throw new PrivateRecipeMutationError('not-found', 'Pending private recipe was not found.');
      const active = activePrivateRecipeRevision(pending);
      if (JSON.stringify(active.content) !== JSON.stringify(content)) {
        store.saveRevision(recipeId, content, active.id);
        wrote = true;
      }
    }
    let saved = await store.whenSaved();
    if (!saved && !wrote) saved = await store.retry();
    if (!saved) throw new PrivateRecipePersistenceError();
    pendingRecipeId.current = undefined;
    router.replace({pathname: '/my-recipes' as never, params: {id: recipeId}});
  };
  return <RecipeEditor locale={locale} initial={initial} origin={origin} saving={store.saving} onCancel={onCancel} onSave={save} />;
}

function RecipeList({locale, recipes}: {locale: Locale; recipes: PrivateRecipe[]}) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => searchPrivateRecipes(recipes, query), [query, recipes]);
  return <>
    <View style={styles.hero}><Text style={styles.kicker}>{text(locale, 'privateLabel')}</Text><Text accessibilityRole="header" style={styles.title}>{text(locale, 'title')}</Text><Text style={styles.body}>{text(locale, 'intro')}</Text></View>
    <View style={styles.actionRow}>
      <Action selected label={`＋ ${text(locale, 'newOriginal')}`} onPress={() => router.push({pathname: '/my-recipes' as never, params: {create: 'original'}})} />
      <Action label={text(locale, 'adaptFromLibrary')} onPress={() => router.push('/discover' as never)} />
    </View>
    {recipes.length ? <TextInput accessibilityLabel={text(locale, 'search')} value={query} onChangeText={setQuery} placeholder={text(locale, 'search')} placeholderTextColor={colors.muted} style={styles.search} /> : null}
    {!recipes.length ? <Panel><Text style={styles.body}>{text(locale, 'empty')}</Text></Panel> : null}
    <View style={styles.cards}>{shown.map(recipe => {
      const revision = activePrivateRecipeRevision(recipe);
      return <Pressable key={recipe.id} accessibilityRole="link" accessibilityLabel={revision.content.title} onPress={() => router.push({pathname: '/my-recipes' as never, params: {id: recipe.id}})} style={({pressed}) => [styles.card, pressed && styles.pressed]}>
        {revision.content.photo?<Image source={{uri:revision.content.photo}} accessibilityLabel={revision.content.title} style={{width:72,height:72,borderRadius:12}}/>:null}<View style={styles.cardCopy}><Text style={styles.cardTitle}>{revision.content.title}</Text>{revision.content.description ? <Text numberOfLines={2} style={styles.cardDescription}>{revision.content.description}</Text> : null}<Text style={styles.cardMeta}>{originLabel(locale, recipe.origin)} · {recipe.revisions.length} {text(locale, 'revisions')}</Text></View><Text style={styles.arrow}>↗</Text>
      </Pressable>;
    })}</View>
  </>;
}

function RecipeDetails({recipe, locale, onBack}: {recipe: PrivateRecipe; locale: Locale; onBack: () => void}) {
  const store = usePrivateRecipes();
  const [editing, setEditing] = useState<{content: PrivateRecipeContent; basedOnRevisionId: string} | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const pendingRevisionId = useRef<string | undefined>(undefined);
  const pendingDelete = useRef(false);
  const revision = activePrivateRecipeRevision(recipe);
  if (editing) return <RecipeEditor locale={locale} initial={editing.content} origin={recipe.origin} saving={store.saving} onCancel={() => setEditing(null)} onSave={async content => {
    let wrote = false;
    const current = store.getSnapshot().recipes.find(item => item.id === recipe.id);
    if (!current) throw new PrivateRecipeMutationError('not-found', 'Private recipe was not found.');
    const active = activePrivateRecipeRevision(current);
    if (!pendingRevisionId.current || JSON.stringify(active.content) !== JSON.stringify(content)) {
      pendingRevisionId.current = store.saveRevision(recipe.id, content, pendingRevisionId.current ? active.id : editing.basedOnRevisionId);
      wrote = true;
    }
    let saved = await store.whenSaved();
    if (!saved && !wrote) saved = await store.retry();
    if (!saved) throw new PrivateRecipePersistenceError();
    pendingRevisionId.current = undefined;
    setEditing(null);
  }} />;
  const remove = async () => {
    setDeleting(true); setError('');
    try {
      let wrote = false;
      if (!pendingDelete.current) { store.delete(recipe.id); pendingDelete.current = true; wrote = true; }
      let saved = await store.whenSaved();
      if (!saved && !wrote) saved = await store.retry();
      if (!saved) throw new PrivateRecipePersistenceError();
      pendingDelete.current = false;
      onBack();
    }
    catch { setError(text(locale, 'failed')); setDeleting(false); }
  };
  return <>
    <View style={styles.hero}><Text style={styles.kicker}>{text(locale, 'privateLabel')}</Text><Text accessibilityRole="header" style={styles.title}>{revision.content.title}</Text>{revision.content.description ? <Text style={styles.body}>{revision.content.description}</Text> : null}</View>
    <View style={styles.actionRow}><Action selected label={text(locale, 'edit')} onPress={() => setEditing({content: revision.content, basedOnRevisionId: revision.id})} /><Action quiet danger label={text(locale, 'delete')} onPress={() => setConfirming(true)} /><Action quiet label={text(locale, 'back')} onPress={onBack} /></View>
    {confirming ? <Panel title={text(locale, 'confirmDelete')}><Text style={styles.body}>{revision.content.title} · {recipe.revisions.length} {text(locale, 'revisions')}</Text><Text style={styles.error}>{text(locale, 'deleteImpact')}</Text><View style={styles.actionRow}><Action danger disabled={deleting} label={deleting ? text(locale, 'saving') : text(locale, pendingDelete.current ? 'retry' : 'delete')} onPress={() => void remove()} /><Action quiet disabled={deleting} label={text(locale, 'cancel')} onPress={() => setConfirming(false)} /></View></Panel> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Panel title={text(locale, 'details')}><RecipeContentView locale={locale} revision={revision} /></Panel>
    <Fold title={`${text(locale, 'history')} · ${recipe.revisions.length}`}>
      {recipe.revisions.map((item, index) => ({item, number: index + 1})).reverse().map(({item, number}) => <Fold key={item.id} title={`${text(locale, 'revision')} ${number} · ${formatDateTime(item.createdAt, locale)}${item.id === recipe.activeRevisionId ? ` · ${text(locale, 'current')}` : ''}`}><RecipeContentView locale={locale} revision={item} /><Action label={text(locale, 'editFromRevision')} onPress={() => setEditing({content: item.content, basedOnRevisionId: item.id})} /></Fold>)}
    </Fold>
    <Text style={styles.meta}>{text(locale, 'created')} {formatDate(recipe.createdAt, locale)} · {text(locale, 'updated')} {formatDate(recipe.updatedAt, locale)}</Text>
  </>;
}

function RecipeContentView({locale, revision}: {locale: Locale; revision: PrivateRecipeRevision}) {
  const content = revision.content;
  const steps = content.steps.length ? content.steps : content.method ? content.method.split(/\r?\n/).filter(Boolean) : [];
  return <View style={styles.read}>
    {content.photo?<Image source={{uri:content.photo}} accessibilityLabel={content.title} resizeMode="contain" style={{width:'100%',height:280,borderRadius:16,backgroundColor:colors.background}}/>:null}
    <Text style={styles.sectionLabel}>{text(locale, 'servings')}</Text><Text style={styles.body}>{content.servings}</Text>
    <Text style={styles.sectionLabel}>{text(locale, 'ingredients')}</Text>
    {content.ingredients.map(item => <Text key={item.id} style={styles.body}>{[item.amount, item.unit, item.name, item.brandName, item.bottleName, item.optional ? text(locale, 'optional') : '', item.note].filter(Boolean).join(' · ')}</Text>)}
    {steps.length ? <><Text style={styles.sectionLabel}>{text(locale, 'method')}</Text>{steps.map((step, index) => <Text key={index} style={styles.body}>{index + 1}. {step}</Text>)}</> : null}
    {content.glass ? <><Text style={styles.sectionLabel}>{text(locale, 'glass')}</Text><Text style={styles.body}>{content.glass}</Text></> : null}
    {content.garnish ? <><Text style={styles.sectionLabel}>{text(locale, 'garnish')}</Text><Text style={styles.body}>{content.garnish}</Text></> : null}
    {content.notes ? <><Text style={styles.sectionLabel}>{text(locale, 'notes')}</Text><Text style={styles.body}>{content.notes}</Text></> : null}
  </View>;
}

function RecipeEditor({locale, initial, origin, saving, onSave, onCancel}: {locale: Locale; initial: PrivateRecipeContent; origin: PrivateRecipeOrigin; saving: boolean; onSave: (content: PrivateRecipeContent, origin: PrivateRecipeOrigin) => Promise<void>; onCancel: () => void}) {
  const {width} = useViewport();
  const [capturedOrigin] = useState(() => origin);
  const [content, setContent] = useState(() => clonePrivateRecipeContent(initial));
  const [pickerRow, setPickerRow] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [persistenceFailed, setPersistenceFailed] = useState(false);
  const [photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState(false);
  const selectPhoto=async()=>{if(photoBusy)return;setPhotoBusy(true);setPhotoError(false);try{const photo=await chooseRecipePhoto();if(photo)setContent(current=>({...current,photo}));}catch{setPhotoError(true);}finally{setPhotoBusy(false);}};
  const compact = width < 620;
  const updateIngredient = (id: string, patch: Partial<PrivateIngredient>) => setContent(current => ({...current, ingredients: current.ingredients.map(item => item.id === id ? {...item, ...patch} : item)}));
  const submit = async () => {
    const normalized: PrivateRecipeContent = {...content, title: content.title.trim(), ingredients: content.ingredients.map(item => ({...item, name: item.name.trim(), amount: item.amount.trim(), unit: item.unit.trim()}))};
    if (!normalized.title || !normalized.ingredients.length || normalized.ingredients.some(item => !item.name)) { setError(text(locale, 'required')); return; }
    setBusy(true); setError(''); setPersistenceFailed(false);
    try { await onSave(normalized, capturedOrigin); }
    catch (caught) {
      setPersistenceFailed(caught instanceof PrivateRecipePersistenceError);
      setError(caught instanceof PrivateRecipeMutationError && caught.code === 'no-change' ? text(locale, 'noChanges') : text(locale, 'failed'));
    }
    finally { setBusy(false); }
  };
  const choose = (ingredient: Ingredient) => {
    if (!pickerRow) return;
    updateIngredient(pickerRow, {name: ingredient.name[locale], ingredientId: ingredient.id, brandId: undefined, brandName: undefined, bottleId: undefined, bottleName: undefined});
  };
  const method = content.steps.length ? content.steps.join('\n') : content.method;
  return <>
    <View style={styles.hero}><Text style={styles.kicker}>{originLabel(locale, capturedOrigin)}</Text><Text accessibilityRole="header" style={styles.title}>{content.title || text(locale, 'newOriginal')}</Text></View>
    <Panel>
      <EditorField label={text(locale, 'name')} value={content.title} onChange={title => setContent(current => ({...current, title}))} />
      <EditorField label={text(locale, 'description')} value={content.description} multiline onChange={description => setContent(current => ({...current, description}))} />
      <View style={{gap:10}}><Text style={styles.fieldLabel}>{refinementText(locale,'photo')}</Text>{content.photo?<Image source={{uri:content.photo}} accessibilityLabel={content.title||refinementText(locale,'photo')} resizeMode="contain" style={{width:'100%',height:220,borderRadius:12}}/>:null}<View style={styles.actionRow}><Action label={refinementText(locale,photoBusy?'processingPhoto':'choosePhoto')} disabled={photoBusy||busy||saving} onPress={()=>void selectPhoto()}/>{content.photo?<Action quiet label={refinementText(locale,'removePhoto')} disabled={photoBusy||busy||saving} onPress={()=>setContent(current=>{const {photo,...rest}=current;return rest;})}/>:null}</View><Text style={styles.meta}>{refinementText(locale,'photoHint')}</Text>{photoError?<Text accessibilityRole="alert" style={styles.error}>{refinementText(locale,'photoError')}</Text>:null}</View>
      <EditorField label={text(locale, 'servings')} value={String(content.servings)} keyboard="number-pad" onChange={value => { if (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1000) setContent(current => ({...current, servings: Number(value)})); }} />
    </Panel>
    <Text style={styles.sectionTitle}>{text(locale, 'ingredients')}</Text>
    {content.ingredients.map((item, index) => <Panel key={item.id} title={`${index + 1}. ${item.name || text(locale, 'ingredient')}`}>
      <EditorField label={text(locale, 'ingredient')} value={item.name} onChange={name => updateIngredient(item.id, {name, ingredientId: undefined, brandId: undefined, brandName: undefined, bottleId: undefined, bottleName: undefined})} />
      <Action label={item.ingredientId ? `${text(locale, 'chooseIngredient')} · ✓` : text(locale, 'chooseIngredient')} onPress={() => setPickerRow(item.id)} />
      <View style={styles.fieldRow}><View style={styles.fieldHalf}><EditorField label={text(locale, 'amount')} value={item.amount} onChange={amount => updateIngredient(item.id, {amount})} /></View><View style={styles.fieldHalf}><EditorField label={text(locale, 'unit')} value={item.unit} onChange={unit => updateIngredient(item.id, {unit})} /></View></View>
      <Fold title={`${text(locale, 'note')} · ${text(locale, 'optional')}`}>
        <EditorField label={text(locale, 'note')} value={item.note ?? ''} onChange={note => updateIngredient(item.id, {note})} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{checked: Boolean(item.optional)}} onPress={() => updateIngredient(item.id, {optional: !item.optional})} style={({pressed}) => [styles.toggle, item.optional && styles.toggleActive, pressed && styles.pressed]}><Text style={styles.toggleText}>{item.optional ? '✓ ' : ''}{text(locale, 'optional')}</Text></Pressable>
      </Fold>
      <View style={styles.actionRow}><Action quiet danger label={text(locale, 'remove')} onPress={() => setContent(current => ({...current, ingredients: current.ingredients.filter(entry => entry.id !== item.id)}))} /></View>
    </Panel>)}
    <Action label={`＋ ${text(locale, 'addIngredient')}`} onPress={() => setContent(current => ({...current, ingredients: [...current.ingredients, {id: rowId(), name: '', amount: '', unit: 'ml'}]}))} />
    <Panel>
      <EditorField label={text(locale, 'method')} value={method} multiline onChange={value => setContent(current => ({...current, steps: value.split(/\r?\n/).map(step => step.trim()).filter(Boolean), method: ''}))} />
      <View style={[styles.fieldRow, compact && styles.fieldRowCompact]}><View style={styles.fieldHalf}><EditorField label={text(locale, 'glass')} value={content.glass} onChange={glass => setContent(current => ({...current, glass}))} /></View><View style={styles.fieldHalf}><EditorField label={text(locale, 'garnish')} value={content.garnish} onChange={garnish => setContent(current => ({...current, garnish}))} /></View></View>
      <EditorField label={text(locale, 'notes')} value={content.notes} multiline onChange={notes => setContent(current => ({...current, notes}))} />
    </Panel>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.actionRow}><Action selected disabled={busy || saving || photoBusy} label={busy || saving ? text(locale, 'saving') : text(locale, persistenceFailed ? 'retry' : 'save')} onPress={() => void submit()} /><Action quiet disabled={busy || photoBusy} label={text(locale, 'cancel')} onPress={onCancel} /></View>
    <IngredientPicker locale={locale} visible={Boolean(pickerRow)} onSelect={choose} onClose={() => setPickerRow(undefined)} />
  </>;
}

function EditorField({label, value, onChange, multiline = false, keyboard}: {label: string; value: string; onChange: (value: string) => void; multiline?: boolean; keyboard?: 'number-pad'}) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} multiline={multiline} keyboardType={keyboard} placeholderTextColor={colors.muted} style={[styles.input, multiline && styles.multiline]} /></View>;
}

function originLabel(locale: Locale, origin: PrivateRecipeOrigin) {
  return text(locale, origin.kind === 'original' ? 'original' : origin.kind === 'catalogue-version' ? 'catalogueOrigin' : 'labOrigin');
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleDateString(locale, {year: 'numeric', month: 'short', day: 'numeric'});
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale, {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  page: {minHeight: '100%', paddingHorizontal: 18, paddingBottom: 100},
  shell: {width: '100%', maxWidth: 960, alignSelf: 'center', gap: 16},
  backRow: {alignItems: 'flex-start'},
  hero: {paddingVertical: 20, gap: 8, maxWidth: 720},
  kicker: {color: colors.accent, fontSize: 10, lineHeight: 15, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase'},
  title: {color: colors.text, fontFamily: serif, fontSize: 38, lineHeight: 47},
  body: {color: colors.secondary, fontSize: 14, lineHeight: 22},
  meta: {color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 4},
  status: {color: colors.muted, fontSize: 13, lineHeight: 20},
  warning: {color: colors.amber, fontSize: 13, lineHeight: 21},
  error: {color: colors.danger, fontSize: 13, lineHeight: 21},
  actionRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10},
  search: {minHeight: 50, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, backgroundColor: colors.panel, color: colors.text, fontSize: 15},
  cards: {gap: 10},
  card: {minHeight: 108, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.panel, flexDirection: 'row', alignItems: 'center', gap: 16},
  cardCopy: {flex: 1, minWidth: 0},
  cardTitle: {color: colors.text, fontFamily: serif, fontSize: 23, lineHeight: 29},
  cardDescription: {color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 4},
  cardMeta: {color: colors.accent, fontSize: 11, lineHeight: 17, marginTop: 8},
  arrow: {color: colors.accent, fontSize: 20},
  originTitle: {color: colors.text, fontFamily: serif, fontSize: 19, lineHeight: 26},
  read: {gap: 8},
  sectionLabel: {color: colors.accent, fontSize: 11, lineHeight: 17, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 8},
  sectionTitle: {color: colors.text, fontFamily: serif, fontSize: 26, lineHeight: 34, marginTop: 8},
  field: {gap: 6, flex: 1},
  fieldLabel: {color: colors.secondary, fontSize: 12, lineHeight: 18, fontWeight: '600'},
  input: {minHeight: 46, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, backgroundColor: colors.background, color: colors.text, fontSize: 15, lineHeight: 22},
  multiline: {minHeight: 100, textAlignVertical: 'top'},
  fieldRow: {flexDirection: 'row', gap: 12},
  fieldRowCompact: {flexDirection: 'column'},
  fieldHalf: {flex: 1, minWidth: 0},
  toggle: {minHeight: 44, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, justifyContent: 'center'},
  toggleActive: {borderColor: colors.accent, backgroundColor: colors.accentDark},
  toggleText: {color: colors.accent, fontSize: 13, lineHeight: 18, fontWeight: '600'},
  pressed: {opacity: 0.7},
});
