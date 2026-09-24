import {CocktailOriginalName} from '../names/OriginalName';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Link, router, useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {catalogue} from '../../content/catalogue';
import {contextEvidence} from '../../content/context-evidence';
import {bottles} from '../../content/bottles';
import {mergeOwnedPantry,type OwnedVersionMatch} from '../../domain/ingredients/presence';
import {rankForPantry,diversifyPantryResults} from '../../domain/guided/pantry-ranking';
import {pantryAccess,needsPantryPrompt,type PantryAccess} from '../../domain/guided/mode';
import {usePantry} from '../../platform/PantryProvider';
import {useBottles} from '../../platform/BottleProvider';
import {g175} from '../../i18n/round17-5-guided';
import {MotionTransition,useMotionEnabled} from '../motion';
import type {
  Approachability,
  Exclusion,
  Flavour,
  Locale,
  SearchQuery,
  Strength,
  Taste,
} from '../../domain/contracts';
import type {GuidedAction, GuidedField, GuidedSession} from '../../domain/guided/types';
import {diversifyContextResults, rankForContext} from '../../domain/context';
import type {ContextResult, ContextSelection} from '../../domain/context/types';
import {emptyTasteState} from '../../domain/taste/types';
import {cardGrid} from '../../domain/discovery/card-grid';
import {useTaste} from '../../platform/TasteProvider';
import {tm} from '../../i18n/taste';
import {contextText, occasionLabel, seasonLabel} from '../../i18n/context';
import {TasteReasons} from './TasteReasons';
import {gr, type GuidedRefinementKey} from '../../i18n/guidedRefinement';
import type {UiKey} from '../../i18n/keys';
import {lib} from '../../i18n/library';
import {t} from '../../i18n/ui';
import {media} from '../../media';
import {useApp} from '../../platform/AppProvider';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, PhotoFrame, serif, useReduceMotion, useViewport} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {ContextReasons, ContextSelector} from '../context';
import Waterfall from './Waterfall';
import {GuidedReveal} from './GuidedReveal';

type GuidedAppState = ReturnType<typeof useApp> & {
  guided: GuidedSession;
  dispatchGuided: React.Dispatch<GuidedAction>;
};

const stableWebScrollGutter=Platform.OS==='web'
  ? ({scrollbarGutter:'stable'} as unknown as React.ComponentProps<typeof ScrollView>['style'])
  : undefined;

interface StepOption {
  value: string;
  labelKey: UiKey;
  noteKey?: UiKey;
  exampleKey?: GuidedRefinementKey;
}

interface StepDefinition {
  field: Exclude<GuidedField, 'excluded'>;
  nameKey: GuidedRefinementKey;
  titleKey: UiKey;
  hintKey: UiKey;
  multi: boolean;
  options: StepOption[];
}

const STEPS: StepDefinition[] = [
  {
    field: 'flavours',
    nameKey: 'stepAromas',
    titleKey: 'guidedFlavoursTitle',
    hintKey: 'guidedFlavoursHint',
    multi: true,
    options: (['citrus', 'fruit', 'floral', 'herbal', 'spice', 'coffee'] satisfies Flavour[]).map((value) => ({value, labelKey: `flavour.${value}` as UiKey, exampleKey: `${value}Example` as GuidedRefinementKey})),
  },
  {
    field: 'tastes',
    nameKey: 'stepPalate',
    titleKey: 'guidedTastesTitle',
    hintKey: 'guidedTastesHint',
    multi: true,
    options: (['sour', 'sweet', 'bitter', 'dry', 'creamy', 'refreshing'] satisfies Taste[]).map((value) => ({value, labelKey: `taste.${value}` as UiKey, exampleKey: `${value}Example` as GuidedRefinementKey})),
  },
  {
    field: 'strengths',
    nameKey: 'stepStrength',
    titleKey: 'guidedStrengthTitle',
    hintKey: 'guidedStrengthHint',
    multi: false,
    options: (['none', 'low', 'medium', 'strong'] satisfies Strength[]).map((value) => ({value, labelKey: `strength.${value}` as UiKey})),
  },
  {
    field: 'approachability',
    nameKey: 'stepFirstSip',
    titleKey: 'guidedApproachTitle',
    hintKey: 'guidedApproachHint',
    multi: false,
    options: [
      {value: 'gentle' satisfies Approachability, labelKey: 'approach.gentle', noteKey: 'guidedGentleNote'},
      {value: 'balanced' satisfies Approachability, labelKey: 'approach.balanced', noteKey: 'guidedBalancedNote'},
      {value: 'bold' satisfies Approachability, labelKey: 'approach.bold', noteKey: 'guidedBoldNote'},
    ],
  },
];

const EXCLUSIONS: Array<{value: Exclusion; labelKey: UiKey}> = [
  {value: 'egg', labelKey: 'exclude.egg'},
  {value: 'dairy', labelKey: 'exclude.dairy'},
  {value: 'gin', labelKey: 'base.gin'},
  {value: 'rum', labelKey: 'base.rum'},
  {value: 'tequila', labelKey: 'base.tequila'},
  {value: 'whiskey', labelKey: 'base.whiskey'},
  {value: 'vodka', labelKey: 'base.vodka'},
  {value: 'brandy', labelKey: 'base.brandy'},
  {value: 'mezcal', labelKey: 'base.mezcal'},
  {value: 'cachaca', labelKey: 'base.cachaca'},
  {value: 'grappa', labelKey: 'base.grappa'},
];

function selectedValues(query: SearchQuery, field: StepDefinition['field']): string[] {
  return (query[field] ?? []) as string[];
}

function exclusionLabel(value: Exclusion, locale: Locale): string {
  return t(locale, value === 'egg' || value === 'dairy' ? `exclude.${value}` as UiKey : `base.${value}` as UiKey);
}

function preferenceGroups(query: SearchQuery, context: ContextSelection, locale: Locale) {
  const groups = [
    {key: 'flavours', name: gr(locale, 'stepAromas'), labels: query.flavours?.map((value) => t(locale, `flavour.${value}` as UiKey)) ?? []},
    {key: 'tastes', name: gr(locale, 'stepPalate'), labels: query.tastes?.map((value) => t(locale, `taste.${value}` as UiKey)) ?? []},
    {key: 'strengths', name: gr(locale, 'stepStrength'), labels: query.strengths?.map((value) => t(locale, `strength.${value}` as UiKey)) ?? []},
    {key: 'approachability', name: gr(locale, 'stepFirstSip'), labels: query.approachability?.map((value) => t(locale, `approach.${value}` as UiKey)) ?? []},
    {key: 'excluded', name: t(locale, 'exclude'), labels: query.excluded?.map((value) => exclusionLabel(value, locale)) ?? []},
  ];
  const contextLabels = [
    context.occasion ? occasionLabel(locale, context.occasion) : null,
    context.season ? seasonLabel(locale, context.season) : null,
  ].filter((label): label is string => Boolean(label));
  groups.push({key: 'context', name: contextText(locale, 'disclosureTitle'), labels: contextLabels});
  return groups.filter(({labels}) => labels.length > 0);
}

function SelectionSummary({query, context, locale, compact = false, onEditContext}: {query: SearchQuery; context: ContextSelection; locale: Locale; compact?: boolean; onEditContext?: () => void}) {
  const groups = preferenceGroups(query, context, locale);
  return (
    <View style={[styles.summary, compact && styles.summaryCompact]}>
      <Text style={styles.summaryLabel}>{gr(locale, 'preferenceProfile')}</Text>
      {groups.length ? <View style={styles.summaryGroups}>{groups.map((group) => (
        <View key={group.key} style={styles.summaryGroup}>
          <Text style={styles.summaryGroupName}>{group.name}</Text>
          <View style={styles.summaryItems}>{group.labels.map((label) => <Text key={`${group.key}-${label}`} style={styles.summaryItem}>{label}</Text>)}</View>
          {group.key === 'context' && onEditContext ? <Pressable accessibilityRole="button" onPress={onEditContext} style={({pressed}) => [styles.summaryEdit, pressed && styles.pressed]}><Text style={styles.summaryEditText}>{contextText(locale, 'change')}</Text></Pressable> : null}
        </View>
      ))}</View> : <Text style={styles.summaryOpen}>{t(locale, 'guidedOpen')}</Text>}
    </View>
  );
}

function TasteMemorySettings({
  taste,
  locale,
  useMemory,
  onToggle,
  compact,
}: {
  taste: ReturnType<typeof useTaste>;
  locale: Locale;
  useMemory: boolean;
  onToggle: () => void;
  compact: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(!compact);
  if (!taste.hydrated || taste.savedState.entries.length === 0) return null;
  const title = tm(locale, 'memoryTitle');
  return (
    <View style={[styles.memorySettings, compact && styles.memorySettingsCompact]}>
      {compact ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{expanded: detailsOpen}}
          onPress={() => setDetailsOpen((open) => !open)}
          style={({pressed}) => [styles.memorySettingsHeading, pressed && styles.pressed]}
        >
          <Text style={styles.memorySettingsTitle}>{title}</Text>
          <Text style={styles.memorySettingsGlyph}>{detailsOpen ? '−' : '+'}</Text>
        </Pressable>
      ) : <Text style={styles.memorySettingsTitle}>{title}</Text>}
      <View style={styles.memoryControls}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{checked: useMemory}}
          onPress={onToggle}
          style={({pressed}) => [styles.memoryToggle, useMemory && styles.memoryToggleActive, pressed && styles.pressed]}
        >
          <Text style={[styles.memoryToggleText, useMemory && styles.memoryToggleTextActive]}>{useMemory ? '✓ ' : ''}{tm(locale, 'useMemory')}</Text>
        </Pressable>
        {(!compact || detailsOpen) ? (
          <Link href="/taste" asChild>
            <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.memoryManage])}>
              <Text style={styles.memoryManageText}>{tm(locale, 'manageMemory')} ↗</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
      {(!compact || detailsOpen) ? (
        <>
          <Text style={styles.memoryHint}>{tm(locale, 'memoryHint')}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.memoryStatus}>{tm(locale, useMemory ? 'memoryApplied' : 'memoryOff')}</Text>
        </>
      ) : null}
    </View>
  );
}

function TasteStorageNotice({taste, locale}: {taste: ReturnType<typeof useTaste>; locale: Locale}) {
  if (!taste.error && taste.hydrated) return null;
  if (!taste.hydrated && !taste.error) {
    return <Text accessibilityLiveRegion="polite" style={styles.memoryLoading}>{tm(locale, 'loading')}</Text>;
  }
  return (
    <View style={styles.memoryNotice}>
      <Text accessibilityRole="alert" style={styles.memoryNoticeText}>{tm(locale, taste.error === 'read' ? 'storageReadError' : 'storageWriteError')}</Text>
      <Pressable accessibilityRole="button" disabled={taste.saving} onPress={() => void taste.retry()} style={({pressed}) => [styles.memoryRetry, pressed && styles.pressed]}>
        <Text style={styles.memoryRetryText}>{tm(locale, taste.saving ? 'retrying' : 'retry')}</Text>
      </Pressable>
    </View>
  );
}

function OptionCard({label, note, selected, compact, selectedText, onPress}: {label: string; note?: string; selected: boolean; compact: boolean; selectedText: string; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [styles.option, compact && styles.optionCompact, selected && styles.optionSelected, pressed && styles.pressed]}
    >
      <View style={[styles.optionIndicator, selected && styles.optionIndicatorSelected]}><Text style={styles.optionCheck}>{selected ? '✓' : ''}</Text></View>
      <View style={styles.optionCopy}>
        <View style={styles.optionTitleLine}>
          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
          {selected ? <Text style={styles.selectedBadge}>{selectedText}</Text> : null}
        </View>
        {note ? <Text style={[styles.optionNote, selected && styles.optionNoteSelected]}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

function Progress({guided, locale, dispatch}: {guided: GuidedSession; locale: Locale; dispatch: React.Dispatch<GuidedAction>}) {
  const goBackTo = (target: number) => {
    dispatch({type: 'review', step: target});
  };
  return (
    <View style={styles.progress}>
      {STEPS.map((item, index) => {
        const completed = index < guided.step;
        const current = index === guided.step;
        return (
          <Pressable
            key={item.field}
            accessibilityRole={completed ? 'button' : undefined}
            accessibilityLabel={completed ? `${gr(locale, 'reviewStep')}: ${gr(locale, item.nameKey)}` : gr(locale, item.nameKey)}
            accessibilityState={{disabled: index > guided.step, selected: current}}
            disabled={!completed}
            onPress={() => goBackTo(index)}
            style={[styles.progressStep, (completed || current) && styles.progressStepReached]}
          >
            <View style={[styles.progressSegment, (completed || current) && styles.progressSegmentActive, current && styles.progressSegmentCurrent]} />
            <View style={styles.progressLabelLine}>
              <Text style={[styles.progressIndex, (completed || current) && styles.progressTextReached]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text numberOfLines={1} style={[styles.progressLabel, (completed || current) && styles.progressTextReached]}>{gr(locale, item.nameKey)}</Text>
              {completed ? <Text style={styles.progressEdit}>↙</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function matchedLabels(query: SearchQuery, version: NonNullable<(typeof catalogue.versions)[number]>, locale: Locale): string[] {
  const labels: string[] = [];
  query.flavours?.filter((value) => version.flavours.includes(value)).forEach((value) => labels.push(t(locale, `flavour.${value}` as UiKey)));
  query.tastes?.filter((value) => version.tastes.includes(value)).forEach((value) => labels.push(t(locale, `taste.${value}` as UiKey)));
  if (version.strength && query.strengths?.includes(version.strength)) labels.push(t(locale, `strength.${version.strength}` as UiKey));
  if (version.approachability && query.approachability?.includes(version.approachability)) labels.push(t(locale, `approach.${version.approachability}` as UiKey));
  return labels;
}

type GuidedResult = ContextResult & {pantryMatch?:OwnedVersionMatch};
function ResultCard({result, locale, query, contextActive, onHide, cardWidth,onPhotoRef,photoOpacity}: {result: GuidedResult; locale: Locale; query: SearchQuery; contextActive: boolean; onHide: () => void; cardWidth: number;onPhotoRef?:(cocktailId:string,node:View|null)=>void;photoOpacity?:Animated.Value}) {
  const cocktail = catalogue.cocktails.find((item) => item.id === result.cocktailId);
  if (!cocktail) return null;
  const asset = media[cocktail.id];
  const version = catalogue.versions.find((item) => item.id === result.selectedVersionId);
  const matches = version ? matchedLabels(query, version, locale) : [];
  const avoided = query.excluded?.map((value) => exclusionLabel(value, locale)) ?? [];
  return (
    <View style={[styles.resultWrap, {width: cardWidth}]}>
      <Link
        href={{pathname: '/cocktails/[id]', params: {id: cocktail.id, version: result.selectedVersionId, from: 'customize'}} as never}
        asChild
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`}
          style={StyleSheet.flatten([styles.resultCard])}
        >
          <View ref={node=>onPhotoRef?.(cocktail.id,node)} collapsable={false}>
            <Animated.View style={photoOpacity?{opacity:photoOpacity}:undefined}>
              <PhotoFrame asset={asset} accent={cocktail.accent} locale={locale} height={240} preserveAspect borderRadius={radii.medium} />
            </Animated.View>
          </View>
          <View style={styles.resultCopy}>
            <Text style={styles.resultMeta}>{t(locale, cocktail.category as UiKey)} · {t(locale, 'guidedMatchReason')}</Text>
            <Heading level={2} style={styles.resultName}>{cocktail.name[locale]}</Heading><CocktailOriginalName cocktail={cocktail} locale={locale} />
            <Text style={styles.resultDescription}>{cocktail.description[locale]}</Text>
            {result.pantryMatch ? <View style={styles.ownedSummary}>
              <Text style={styles.ownedHeading}>{g175(locale,result.pantryMatch.baseReady?'baseReady':'baseMissing')}</Text>
              <Text style={styles.ownedText}>{result.pantryMatch.missingIngredientIds.length
                ? g175(locale,'missing',{count:result.pantryMatch.missingIngredientIds.length,ingredients:result.pantryMatch.missingIngredientIds.map(id=>catalogue.ingredients.find(item=>item.id===id)?.name[locale]??id).join(' · ')})
                : g175(locale,'ready')}</Text>
              {(result.pantryMatch.unconfirmedBrands.length>0||result.pantryMatch.preparationNeedsReview) ? <Text style={styles.ownedNote}>{g175(locale,'reviewDetails')}</Text> : null}
            </View> : null}
            <View style={styles.matchPanel}>
              <Text style={styles.matchTitle}>{gr(locale, 'matchesThese')}</Text>
              {matches.length ? <View style={styles.matchChips}>{matches.map((label) => <Text key={label} style={styles.matchChip}>✓ {label}</Text>)}</View> : <Text style={styles.matchOpen}>{contextActive ? contextText(locale, result.contextScore > 0 ? 'contextRankedMatch' : 'contextBaseMatch') : gr(locale, 'openMatch')}</Text>}
              {avoided.length ? <Text style={styles.avoidedText}>{gr(locale, 'keepsOut')}: {avoided.join(' · ')}</Text> : null}
            </View>
            <Text style={styles.resultLink}>{t(locale, 'viewRecipe')} ↗</Text>
          </View>
        </Pressable>
      </Link>
      <TasteReasons result={result} locale={locale} />
      {contextActive ? <ContextReasons locale={locale} reasons={result.contextReasons} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`${contextText(locale, 'notThisOne')}: ${cocktail.name[locale]}`} onPress={onHide} style={({pressed}) => [styles.hideResult, pressed && styles.pressed]}>
        <Text style={styles.hideResultText}>{contextText(locale, 'notThisOne')}</Text>
      </Pressable>
    </View>
  );
}

function StepActions({guided, dispatch, locale, compact = false}: {guided: GuidedSession; dispatch: React.Dispatch<GuidedAction>; locale: Locale; compact?: boolean}) {
  return (
    <View style={[styles.stepActions, compact && styles.stepActionsCompact]}>
      <Pressable accessibilityRole="button" onPress={() => guided.step === 0 ? dispatch({type:'set-mode',mode:null}) : dispatch({type: 'back'})} style={[styles.secondaryAction, compact && styles.secondaryActionCompact]}>
        <Text style={styles.secondaryActionText}>{t(locale, 'back')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => dispatch({type: 'skip'})} style={[styles.skipAction, compact && styles.skipActionCompact]}>
        <Text style={styles.skipActionText}>{t(locale, 'guidedSkip')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => dispatch({type: guided.step === 3 ? 'begin' : 'next'})} style={[styles.primaryAction, compact && styles.primaryActionCompact]}>
        <Text style={styles.primaryActionText}>{t(locale, guided.step === 3 ? 'guidedReveal' : 'guidedNext')}</Text>
        <Text style={styles.primaryArrow}>→</Text>
      </Pressable>
    </View>
  );
}

function ModeChoice({locale,dispatch,compact}:{locale:Locale;dispatch:React.Dispatch<GuidedAction>;compact:boolean}) {
  return <View style={styles.modeIntro}>
    <Heading level={1} style={[styles.questionTitle,compact&&styles.questionTitleCompact]}>{g175(locale,'modeTitle')}</Heading>
    <Text style={styles.questionHint}>{g175(locale,'modeHint')}</Text>
    <View style={[styles.modeChoices,compact&&styles.modeChoicesCompact]}>
      {(['drink','make'] as const).map(mode=><Pressable key={mode} accessibilityRole="button" onPress={()=>dispatch({type:'set-mode',mode})} style={({pressed})=>[styles.modeChoice,pressed&&styles.pressed]}>
        <Text style={styles.modeName}>{g175(locale,mode)} <Text style={styles.primaryArrow}>→</Text></Text>
        <Text style={styles.questionHint}>{g175(locale,mode==='drink'?'drinkHint':'makeHint')}</Text>
      </Pressable>)}
    </View>
    <Pressable accessibilityRole="button" onPress={()=>router.replace('/')} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t(locale,'back')}</Text></Pressable>
  </View>;
}

function PantryGate({locale,access,onRetry,onContinue,onDrink}:{locale:Locale;access:PantryAccess;onRetry:()=>void;onContinue:()=>void;onDrink:()=>void}) {
  return <View style={styles.modeIntro}>
    <Heading level={1} style={styles.questionTitle}>{g175(locale,access==='empty'?'emptyTitle':access==='error'?'pantryError':'pantryLoading')}</Heading>
    {access==='empty'?<>
      <Text style={styles.questionHint}>{g175(locale,'emptyBody')}</Text>
      <View style={styles.gateActions}>
        <Pressable accessibilityRole="link" onPress={()=>router.push('/pantry')} style={styles.primaryAction}><Text style={styles.primaryActionText}>{g175(locale,'addIngredients')}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onContinue} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{g175(locale,'chooseFirst')}</Text></Pressable>
      </View>
    </>:access==='error'?<View style={styles.gateActions}><Pressable accessibilityRole="button" onPress={onRetry} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{g175(locale,'retry')}</Text></Pressable><Pressable accessibilityRole="button" onPress={onDrink} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{g175(locale,'switchDrink')}</Text></Pressable></View>:null}
  </View>;
}

function ChoosingView({
  guided,
  dispatch,
  locale,
  compact,
  motionPaused,
  reduceMotion,
  memorySettings,
}: {
  guided: GuidedSession;
  dispatch: React.Dispatch<GuidedAction>;
  locale: Locale;
  compact: boolean;
  motionPaused: boolean;
  reduceMotion: boolean;
  memorySettings?: React.ReactNode;
}) {
  const step = STEPS[guided.step] ?? STEPS[0]!;
  const selected = selectedValues(guided.draft, step.field);
  const [exclusionsOpen, setExclusionsOpen] = useState(false);
  return (
    <View style={[styles.chooseLayout, compact && styles.chooseLayoutCompact]}>
      {compact ? <Waterfall locale={locale} paused={motionPaused} reduceMotion={reduceMotion} decorative height={104} /> : null}
      <View style={[styles.questionPane, compact && styles.questionPaneCompact]}>
        <View style={styles.stepLine}>
          <Text style={styles.stepNumber}>{String(guided.step + 1).padStart(2, '0')} / 04</Text>
        </View>
        <View style={compact ? styles.progressCompact : undefined}><Progress guided={guided} locale={locale} dispatch={dispatch} /></View>
        <Heading level={1} accessibilityLiveRegion="polite" style={[styles.questionTitle, compact && styles.questionTitleCompact]}>{t(locale, step.titleKey)}</Heading>
        <Text style={styles.questionHint}>{t(locale, step.hintKey)}</Text>
        <Text style={styles.selectionHint}>{t(locale, step.multi ? 'guidedMultiHint' : 'guidedSingleHint')}</Text>
        {guided.step === 0 ? <ContextSelector locale={locale} value={guided.contextDraft ?? {}} onApply={(selection) => dispatch({type: 'set-context', selection})} /> : null}
        <View style={[styles.options, compact && styles.optionsCompact]}>
          {step.options.map((option) => (
            <OptionCard
              key={option.value}
              label={t(locale, option.labelKey)}
              note={option.exampleKey ? gr(locale, option.exampleKey) : option.noteKey ? t(locale, option.noteKey) : undefined}
              selected={selected.includes(option.value)}
              compact={compact}
              selectedText={gr(locale, 'selected')}
              onPress={() => dispatch({type: 'toggle', field: step.field, value: option.value})}
            />
          ))}
        </View>
        {selected.length ? <Text accessibilityLiveRegion="polite" style={styles.selectionFeedback}>{selected.length} · {gr(locale, 'selected')}</Text> : null}
        {guided.step === 3 ? (
          <View style={[styles.exclusions, compact && styles.exclusionsCompact]}>
            {compact ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{expanded: exclusionsOpen}}
                onPress={() => setExclusionsOpen((open) => !open)}
                style={({pressed}) => [styles.exclusionHeading, pressed && styles.pressed]}
              >
                <Text style={styles.exclusionTitle}>{t(locale, 'guidedExclusions')}</Text>
                <Text style={styles.optional}>{t(locale, 'guidedOptional')} {exclusionsOpen ? '−' : '+'}</Text>
              </Pressable>
            ) : (
              <View style={styles.exclusionHeading}>
                <Heading level={2} style={styles.exclusionTitle}>{t(locale, 'guidedExclusions')}</Heading>
                <Text style={styles.optional}>{t(locale, 'guidedOptional')}</Text>
              </View>
            )}
            {!compact || exclusionsOpen ? <View style={styles.exclusionChips}>
              {EXCLUSIONS.map((option) => {
                const active = guided.draft.excluded?.includes(option.value) ?? false;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{selected: active}}
                    onPress={() => dispatch({type: 'toggle', field: 'excluded', value: option.value})}
                    style={[styles.exclusionChip, active && styles.exclusionChipActive]}
                  >
                    <Text style={[styles.exclusionChipText, active && styles.exclusionChipTextActive]}>{t(locale, option.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View> : null}
          </View>
        ) : null}
        <SelectionSummary query={guided.draft} context={guided.contextDraft ?? {}} locale={locale} compact={compact} />
        {memorySettings}
        {!compact ? <StepActions guided={guided} dispatch={dispatch} locale={locale} /> : null}
      </View>
      {!compact ? <View style={styles.waterfallPane}><Waterfall locale={locale} paused={motionPaused} reduceMotion={reduceMotion} decorative height={660} /></View> : null}
    </View>
  );
}

function ResultsView({guided, locale, results, baseResultCount, allResultsHidden, compact, dispatch, onHide, onRestore, memorySettings,pantryFiltered,onPhotoRef,photoOpacity}: {guided: GuidedSession; locale: Locale; results: GuidedResult[]; baseResultCount: number; allResultsHidden: boolean; compact: boolean; dispatch: React.Dispatch<GuidedAction>; onHide: (cocktailId: string) => void; onRestore: () => void; memorySettings?: React.ReactNode;pantryFiltered:boolean;onPhotoRef?:(cocktailId:string,node:View|null)=>void;photoOpacity?:Animated.Value}) {
  const [showAll, setShowAll] = useState(false);
  const viewport = useViewport();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const grid = cardGrid(containerWidth ?? Math.max(0, Math.min(1400, viewport.width - 36)), 250, compact ? 12 : 16);
  const shown = showAll ? results : results.slice(0, 6);
  const contextActive = Boolean(guided.contextSubmitted?.occasion || guided.contextSubmitted?.season);
  useEffect(() => setShowAll(false), [guided.submitted,guided.mode,pantryFiltered]);
  return (
    <View style={styles.resultsView}>
      <View style={styles.resultsLead}>
        <Heading level={1} style={styles.resultsTitle}>{t(locale, 'guidedResultsTitle')}</Heading>
        <Text style={styles.resultsHint}>{pantryFiltered?g175(locale,'makeResultHint'):t(locale, 'guidedResultsHint')}</Text>
        <Text style={styles.resultsVersionNote}>{gr(locale, 'resultIntro')}</Text>
        <SelectionSummary query={guided.submitted ?? {}} context={guided.contextSubmitted ?? {}} locale={locale} onEditContext={() => dispatch({type: 'edit', step: 0})} />
        {memorySettings}
        <View style={styles.resultControls}>
          <Text accessibilityLiveRegion="polite" style={styles.resultCount}>{contextActive&&!pantryFiltered ? `${contextText(locale, 'baseResultCount')} · ${baseResultCount}. ${contextText(locale, 'contextPriorityNote')}` : `${t(locale, 'results')} · ${results.length}`}</Text>
          <Pressable accessibilityRole="button" onPress={() => dispatch({type: 'edit'})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t(locale, 'guidedEdit')}</Text></Pressable>
        </View>
      </View>
      {results.length ? (
        <>
          <View onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)} style={[styles.resultColumns, compact && styles.resultColumnsCompact]}>
            {shown.map((result) => <ResultCard key={result.cocktailId} result={result} locale={locale} query={guided.submitted ?? {}} contextActive={Boolean(guided.contextSubmitted?.occasion || guided.contextSubmitted?.season)} onHide={() => onHide(result.cocktailId)} cardWidth={grid.cardWidth} onPhotoRef={onPhotoRef} photoOpacity={photoOpacity}/>)}
          </View>
          {results.length > 6 ? (
            <Pressable accessibilityRole="button" onPress={() => setShowAll(!showAll)} style={styles.showAll}>
              <Text style={styles.showAllText}>{t(locale, showAll ? 'less' : 'allResults')}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{allResultsHidden ? contextText(locale, 'hiddenAllTitle') : pantryFiltered?g175(locale,'noMakeTitle'):t(locale, 'noResults')}</Text>
          <Text style={styles.emptyHint}>{allResultsHidden ? contextText(locale, 'hiddenAllHint') : pantryFiltered?g175(locale,'noMakeBody'):t(locale, 'guidedEmptyHint')}</Text>
          {pantryFiltered&&!allResultsHidden?<View style={styles.gateActions}>
            <Pressable accessibilityRole="link" onPress={()=>router.push('/pantry')} style={styles.primaryAction}><Text style={styles.primaryActionText}>{g175(locale,'openPantry')}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={()=>dispatch({type:'set-mode',mode:'drink'})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{g175(locale,'switchDrink')}</Text></Pressable>
          </View>:null}
          {allResultsHidden ? <Pressable accessibilityRole="button" onPress={onRestore} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{contextText(locale, 'restoreHidden')}</Text></Pressable> : null}
        </View>
      )}
      <View style={styles.resultActions}>
        <Pressable accessibilityRole="button" onPress={() => dispatch({type: 'restart'})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t(locale, 'guidedRestart')}</Text></Pressable>
        <Link href="/ingredients" asChild>
          <Pressable accessibilityRole="link" style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{lib(locale, 'library')} ↗</Text></Pressable>
        </Link>
        <Link href="/discover" asChild>
          <Pressable accessibilityRole="link" style={styles.primaryAction}><Text style={styles.primaryActionText}>{t(locale, 'browseMode')}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
        </Link>
      </View>
    </View>
  );
}

export default function GuidedScreen() {
  const app = useApp() as GuidedAppState;
  const taste=useTaste();
  const pantry=usePantry();
  const owned=useBottles();
  const canAnimate=useMotionEnabled();
  const [useMemory,setUseMemory]=useState(true);
  const [hiddenResults, setHiddenResults] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const resultPhotoRefs=useRef(new Map<string,View>());
  const {locale, setLocale, unit, setUnit, motionPaused, setMotionPaused, guided, dispatchGuided} = app;
  const previousPhaseRef=useRef(guided.phase);
  const registerResultPhoto=useCallback((cocktailId:string,node:View|null)=>{
    if(node)resultPhotoRefs.current.set(cocktailId,node);
    else resultPhotoRefs.current.delete(cocktailId);
  },[]);
  const {width} = useViewport();
  const reduceMotion = useReduceMotion();
  const [focused, setFocused] = useState(true);
  const compact = width < 820;
  const screenPaused = !canAnimate || !focused;
  const mode=guided.mode===undefined?'drink':guided.mode;
  const ownedPantry=useMemo(()=>mergeOwnedPantry(pantry.pantry,bottles.filter(bottle=>owned.ids.includes(bottle.id))),[pantry.pantry,owned.ids]);
  const access=pantryAccess(pantry,owned,ownedPantry.ingredientIds.length);
  const gate=mode==='make'&&needsPantryPrompt(access,Boolean(guided.pantryFallback));
  const pantryFiltered=mode==='make'&&access==='ready';
  const fallbackActive=mode==='make'&&access==='empty'&&guided.pantryFallback;
  const submitted = guided.submitted ?? {};
  const contextActive = Boolean(guided.contextSubmitted?.occasion || guided.contextSubmitted?.season);
  const rankedResults:GuidedResult[] = useMemo(() => {
    const tasteState=useMemory&&taste.hydrated?taste.savedState:emptyTasteState();
    return pantryFiltered
      ? rankForPantry(catalogue,{...submitted,locale},tasteState,guided.contextSubmitted??{},contextEvidence,ownedPantry)
      : rankForContext(catalogue,{...submitted,locale},tasteState,guided.contextSubmitted??{},contextEvidence);
  }, [guided.contextSubmitted, locale, submitted, taste.hydrated, taste.savedState, useMemory,pantryFiltered,ownedPantry]);
  const orderedResults = useMemo(
    () => pantryFiltered ? diversifyPantryResults(catalogue,rankedResults as ReturnType<typeof rankForPantry>,6) : contextActive ? diversifyContextResults(catalogue, rankedResults, 6) : rankedResults,
    [contextActive, rankedResults,pantryFiltered],
  );
  const results = useMemo(
    () => orderedResults.filter((result) => !hiddenResults.includes(result.cocktailId)),
    [hiddenResults, orderedResults],
  );
  const resultIds = useMemo(() => results.slice(0, 6).map((result) => result.cocktailId), [results]);
  const revealCandidates=useMemo(()=>resultIds.flatMap(id=>{
    const cocktail=catalogue.cocktails.find(item=>item.id===id);
    return cocktail?[{...cocktail,asset:media[cocktail.id]}]:[];
  }),[resultIds]);
  const revealMotionAllowed=app.preferencesHydrated&&app.preferenceStorageAvailable&&!motionPaused&&!reduceMotion;
  const memorySettings = (
    <>
      <TasteMemorySettings
        taste={taste}
        locale={locale}
        useMemory={useMemory}
        onToggle={() => setUseMemory((value) => !value)}
        compact={guided.phase === 'choosing' && compact}
      />
      <TasteStorageNotice taste={taste} locale={locale} />
    </>
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, [guided.step,mode,gate]);

  useEffect(()=>{
    const previous=previousPhaseRef.current;
    previousPhaseRef.current=guided.phase;
    if(previous!==guided.phase&&guided.phase!=='results')scrollRef.current?.scrollTo({y:0,animated:false});
  },[guided.phase]);

  useEffect(() => {
    if (guided.phase === 'choosing') setHiddenResults([]);
  }, [guided.phase,mode]);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView ref={scrollRef} style={stableWebScrollGutter} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <BrandToolbar {...{locale, setLocale, unit, setUnit, motionPaused, setMotionPaused}} showUnits={false} />
          {mode!==null?<View style={styles.modeBar}>
            <Text style={styles.modeBarName}>{g175(locale,mode)}</Text>
            <Pressable accessibilityRole="button" onPress={()=>dispatchGuided({type:'set-mode',mode:null})} style={styles.modeChange}><Text style={styles.secondaryActionText}>{g175(locale,'changeMode')}</Text></Pressable>
          </View>:null}
          {fallbackActive?<Text accessibilityLiveRegion="polite" style={styles.fallbackNote}>{g175(locale,'fallbackNote')}</Text>:null}
          <MotionTransition changeKey={`${mode}:${gate}:${guided.phase==='choosing'?`choosing:${guided.step}`:'reveal-results'}`} kind="step">
          {mode===null?<ModeChoice locale={locale} dispatch={dispatchGuided} compact={compact}/>:gate?
            <PantryGate locale={locale} access={access} onContinue={()=>dispatchGuided({type:'allow-pantry-fallback'})} onDrink={()=>dispatchGuided({type:'set-mode',mode:'drink'})} onRetry={()=>{void pantry.retry();void (owned.error==='write'?owned.retrySave():owned.load());}}/>:
          guided.phase === 'choosing' ? (
            <ChoosingView guided={guided} dispatch={dispatchGuided} locale={locale} compact={compact} motionPaused={screenPaused} reduceMotion={reduceMotion} memorySettings={memorySettings} />
          ) : (
            <GuidedReveal revealing={guided.phase==='revealing'} motionAllowed={revealMotionAllowed} activeWindow={focused} locale={locale} candidates={revealCandidates} resultPhotoRefs={resultPhotoRefs} onFinish={()=>dispatchGuided({type:'finish'})}>
              {photoOpacity=><ResultsView guided={guided} locale={locale} results={results} baseResultCount={rankedResults.length} allResultsHidden={rankedResults.length > 0 && results.length === 0} compact={compact} dispatch={dispatchGuided} onHide={(cocktailId) => setHiddenResults((current) => current.includes(cocktailId) ? current : [...current, cocktailId])} onRestore={() => setHiddenResults([])} memorySettings={memorySettings} pantryFiltered={pantryFiltered} onPhotoRef={registerResultPhoto} photoOpacity={photoOpacity}/>}
            </GuidedReveal>
          )}
          </MotionTransition>
          {guided.phase === 'revealing' ? <TasteStorageNotice taste={taste} locale={locale} /> : null}
        </View>
      </ScrollView>
      {mode!==null&&!gate&&guided.phase === 'choosing' && compact ? (
        <View style={styles.fixedActions}><StepActions guided={guided} dispatch={dispatchGuided} locale={locale} compact /></View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modeIntro:{width:'100%',maxWidth:850,alignSelf:'center',paddingVertical:56,gap:20},
  modeChoices:{flexDirection:'row',gap:16,marginVertical:16},
  modeChoicesCompact:{flexDirection:'column'},
  modeChoice:{flex:1,padding:24,minHeight:150,borderRadius:radii.medium,borderWidth:1,borderColor:colors.border,backgroundColor:colors.panel},
  modeName:{fontFamily:serif,fontSize:28,color:colors.text},
  modeBar:{flexDirection:'row',alignItems:'center',gap:16,marginTop:8},
  modeBarName:{color:colors.accent,fontSize:14,fontWeight:'700'},
  modeChange:{minHeight:44,justifyContent:'center',paddingHorizontal:8},
  gateActions:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:12},
  fallbackNote:{color:colors.amber,fontSize:13,lineHeight:21,paddingVertical:12},
  ownedSummary:{gap:6,paddingVertical:12,borderTopWidth:1,borderTopColor:colors.border,marginTop:14},
  ownedHeading:{color:colors.accent,fontSize:13,fontWeight:'700'},
  ownedText:{color:colors.text,fontSize:13,lineHeight:21},
  ownedNote:{color:colors.muted,fontSize:12,lineHeight:19},
  resultControls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 20, width: '100%'},
  resultCount: {color: colors.secondary, fontSize: 13},
  memorySettings: {width: '100%', marginTop: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.panel},
  memorySettingsCompact: {marginTop: 14, padding: 12, gap: 8},
  memorySettingsHeading: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  memorySettingsTitle: {color: colors.text, fontSize: 14, fontWeight: '800'},
  memorySettingsGlyph: {color: colors.accent, fontFamily: serif, fontSize: 22, lineHeight: 24},
  memoryControls: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10},
  memoryToggle: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small},
  memoryToggleActive: {borderColor: colors.accent, backgroundColor: colors.accentDark},
  memoryToggleText: {color: colors.secondary, fontSize: 13, fontWeight: '700'},
  memoryToggleTextActive: {color: colors.text},
  memoryManage: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 4},
  memoryManageText: {color: colors.accent, fontSize: 13, fontWeight: '700'},
  memoryHint: {color: colors.secondary, fontSize: 13, lineHeight: 20},
  memoryStatus: {color: colors.muted, fontSize: 12, lineHeight: 18},
  memoryLoading: {alignSelf: 'center', color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12},
  memoryNotice: {width: '100%', marginTop: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.amber, borderRadius: radii.medium, backgroundColor: colors.panel},
  memoryNoticeText: {color: colors.text, fontSize: 13, lineHeight: 20},
  memoryRetry: {alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: colors.amber, borderRadius: radii.pill},
  memoryRetryText: {color: colors.amber, fontSize: 13, fontWeight: '800'},
  screen: {flex: 1, backgroundColor: colors.background},
  page: {minHeight: '100%', paddingHorizontal: 18, paddingBottom: 56},
  shell: {width: '100%', maxWidth: 1400, alignSelf: 'center'},
  chooseLayout: {flexDirection: 'row', gap: 42, alignItems: 'stretch', paddingTop: 28},
  chooseLayoutCompact: {flexDirection: 'column', gap: 12, paddingTop: 8},
  questionPane: {flex: 1.1, minWidth: 0, justifyContent: 'center', paddingVertical: 26},
  questionPaneCompact: {paddingVertical: 10, paddingBottom: 20},
  waterfallPane: {flex: 0.9, maxWidth: 560, overflow: 'hidden', borderRadius: radii.large, borderWidth: 1, borderColor: colors.border},
  stepLine: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12},
  stepNumber: {color: colors.accent, fontFamily: serif, fontSize: 14},
  progress: {flexDirection: 'row', gap: 7, marginTop: 13, marginBottom: 32},
  progressStep: {flex: 1, minWidth: 0, minHeight: 46, justifyContent: 'flex-start', opacity: 0.52},
  progressStepReached: {opacity: 1},
  progressSegment: {height: 3, width: '100%', borderRadius: 2, backgroundColor: colors.border},
  progressSegmentActive: {backgroundColor: colors.accent},
  progressSegmentCurrent: {height: 4, backgroundColor: colors.amber},
  progressLabelLine: {flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 38, paddingTop: 7},
  progressIndex: {color: colors.muted, fontFamily: serif, fontSize: 11},
  progressLabel: {flexShrink: 1, color: colors.muted, fontSize: 11, fontWeight: '700'},
  progressTextReached: {color: colors.secondary},
  progressEdit: {color: colors.amber, fontSize: 11},
  progressCompact: {marginBottom: -10},
  questionTitle: {color: colors.text, fontFamily: serif, fontSize: 40, lineHeight: 47, letterSpacing: -0.7},
  questionTitleCompact: {fontSize: 29, lineHeight: 36, letterSpacing: -0.3},
  questionHint: {color: colors.secondary, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 650},
  selectionHint: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7},
  options: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24},
  optionsCompact: {marginTop: 16, gap: 8},
  option: {width: '48%', minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.panel},
  optionCompact: {minHeight: 72, gap: 9, paddingVertical: 11, paddingHorizontal: 11},
  optionSelected: {borderColor: colors.amber, backgroundColor: colors.accentDark, shadowColor: colors.amber, shadowOpacity: 0.13, shadowRadius: 14, shadowOffset: {width: 0, height: 4}},
  optionIndicator: {width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'},
  optionIndicatorSelected: {borderColor: colors.accent, backgroundColor: colors.accent},
  optionCheck: {color: colors.background, fontSize: 13, fontWeight: '800'},
  optionCopy: {flex: 1},
  optionTitleLine: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 7, rowGap: 2},
  optionLabel: {color: colors.text, fontSize: 15, fontWeight: '700', flexShrink: 1, maxWidth: '100%'},
  optionLabelSelected: {color: colors.text},
  selectedBadge: {color: colors.amber, fontSize: 9, lineHeight: 14, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase'},
  optionNote: {color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4},
  optionNoteSelected: {color: colors.secondary},
  selectionFeedback: {alignSelf: 'flex-end', color: colors.amber, fontSize: 12, fontWeight: '700', marginTop: 10},
  exclusions: {marginTop: 26, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border},
  exclusionsCompact: {marginTop: 17, paddingTop: 14},
  exclusionHeading: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12},
  exclusionTitle: {color: colors.text, fontSize: 15, fontWeight: '700'},
  optional: {color: colors.muted, fontSize: 12},
  exclusionChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  exclusionChip: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill},
  exclusionChipActive: {backgroundColor: colors.accent, borderColor: colors.accent},
  exclusionChipText: {color: colors.secondary, fontSize: 13, fontWeight: '600'},
  exclusionChipTextActive: {color: colors.background},
  summary: {width: '100%', marginTop: 26, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16},
  summaryCompact: {marginTop: 16, paddingTop: 12},
  summaryLabel: {color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  summaryGroups: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingTop: 11},
  summaryGroup: {minWidth: 128, flexGrow: 1, padding: 10, borderRadius: radii.small, backgroundColor: 'rgba(34,48,40,0.72)', borderWidth: 1, borderColor: colors.border},
  summaryGroupName: {color: colors.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase'},
  summaryItems: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 7},
  summaryItem: {color: colors.accent, fontSize: 12, paddingVertical: 5, paddingHorizontal: 8, borderRadius: radii.pill, backgroundColor: colors.accentDark},
  summaryEdit: {minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 2, marginTop: 3},
  summaryEditText: {color: colors.amber, fontSize: 12, lineHeight: 18, fontWeight: '700', textDecorationLine: 'underline'},
  summaryOpen: {color: colors.secondary, fontSize: 13, paddingVertical: 7},
  stepActions: {flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 26},
  stepActionsCompact: {flexWrap: 'wrap', marginTop: 0},
  fixedActions: {paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(16,23,20,0.98)'},
  secondaryAction: {minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 17, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill},
  secondaryActionCompact: {flexGrow: 1, minWidth: 92},
  secondaryActionText: {color: colors.secondary, fontSize: 14, fontWeight: '700'},
  skipAction: {minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10},
  skipActionCompact: {flexGrow: 1, minWidth: 120},
  skipActionText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  primaryAction: {minWidth: 150, minHeight: 50, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, borderRadius: radii.pill, backgroundColor: colors.accent},
  primaryActionCompact: {flexBasis: '100%', minHeight: 54},
  primaryActionText: {color: colors.background, fontSize: 14, fontWeight: '800'},
  primaryArrow: {color: colors.background, fontSize: 19},
  pressed: {opacity: 0.72},
  resultsView: {paddingTop: 40},
  resultsLead: {alignItems: 'center', maxWidth: 700, alignSelf: 'center', marginBottom: 30},
  resultsTitle: {color: colors.text, fontFamily: serif, fontSize: 40, lineHeight: 47, textAlign: 'center', marginTop: 8},
  resultsHint: {color: colors.secondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10},
  resultsVersionNote: {color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7},
  resultColumns: {flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 28},
  resultColumnsCompact: {gap: 12},
  resultWrap: {minWidth: 0, flexGrow: 0, flexShrink: 0},
  resultCard: {overflow: 'hidden', borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, shadowColor: colors.amber, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: {width: 0, height: 7}},
  resultCopy: {padding: 16},
  resultMeta: {color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase'},
  resultName: {color: colors.text, fontFamily: serif, fontSize: 24, lineHeight: 29, marginTop: 8},
  resultDescription: {color: colors.secondary, fontSize: 14, lineHeight: 21, marginTop: 7},
  matchPanel: {marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border},
  matchTitle: {color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase'},
  matchChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8},
  matchChip: {color: colors.accent, fontSize: 12, lineHeight: 17, paddingVertical: 5, paddingHorizontal: 8, borderRadius: radii.pill, backgroundColor: colors.accentDark},
  matchOpen: {color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 7},
  avoidedText: {color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8},
  resultLink: {color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 15},
  resultCredit: {color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 6, marginHorizontal: 4},
  resultCredits: {minHeight: 38, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, paddingHorizontal: 4},
  resultCreditDivider: {color: colors.muted, fontSize: 12},
  recipeSource: {alignSelf: 'flex-start', minHeight: 34, justifyContent: 'center', paddingHorizontal: 4},
  hideResult: {alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, marginTop: 2},
  hideResultText: {color: colors.secondary, fontSize: 12, lineHeight: 18, textDecorationLine: 'underline'},
  showAll: {alignSelf: 'center', minHeight: 48, justifyContent: 'center', paddingHorizontal: 22, marginTop: 28, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill},
  showAllText: {color: colors.text, fontSize: 14, fontWeight: '700'},
  empty: {minHeight: 270, alignItems: 'center', justifyContent: 'center', padding: 30, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large},
  emptyTitle: {color: colors.text, fontFamily: serif, fontSize: 28, textAlign: 'center'},
  emptyHint: {color: colors.secondary, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 440, marginVertical: 12},
  resultActions: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 34},
});
