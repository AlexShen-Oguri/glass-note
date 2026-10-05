import {CocktailOriginalName} from '../names/OriginalName';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Link, router, useIsFocused} from 'expo-router';
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
import {motionData} from '../motion/attributes';
import {ProgressOrbit} from '../motion/ProgressOrbit';
import {useSceneTransition} from '../motion/SceneTransition';
import {MotionResults} from '../motion/Results';
import {MotionSelection,MotionSelectionRule,MotionSelectionSummary} from '../motion/Selection';
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
import {resultsLayout} from '../../domain/guided/results-layout';
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
import {BrandToolbar, PhotoFrame, isCompactViewport, serif, useReduceMotion, useViewport} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {ContextReasons, ContextSelector} from '../context';
import {GuidedReveal} from './GuidedReveal';
import type {Animated} from 'react-native';
import {MotionPhoto} from '../motion/primitives';

type GuidedAppState = ReturnType<typeof useApp> & {
  guided: GuidedSession;
  dispatchGuided: React.Dispatch<GuidedAction>;
};

const emptySubmittedQuery: SearchQuery = {};

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

function SelectionSummary({query, context, locale, compact = false, inline=false, onEditContext}: {query: SearchQuery; context: ContextSelection; locale: Locale; compact?: boolean;inline?:boolean; onEditContext?: () => void}) {
  const groups = preferenceGroups(query, context, locale);
  return (
    <View {...motionData({motionSummary: ''})} style={[styles.summary, compact && styles.summaryCompact,inline&&styles.summaryInline]}>
      <Text style={styles.summaryLabel}>{gr(locale, 'preferenceProfile')}</Text>
      {groups.length ? <MotionSelectionSummary changeKey={JSON.stringify(groups.map(group=>[group.key,group.labels]))} style={[styles.summaryGroups,inline&&styles.summaryGroupsInline]}>{groups.map((group, index) => (
        <View key={group.key} style={styles.summaryGroup}>
          <Text style={styles.summaryGroupName}>{String(index + 1).padStart(2, '0')} / {group.name}</Text>
          <View style={styles.summaryItems}>{group.labels.map((label) => <Text key={`${group.key}-${label}`} style={styles.summaryItem}>{label}</Text>)}</View>
          {group.key === 'context' && onEditContext ? <Pressable accessibilityRole="button" onPress={onEditContext} style={({pressed}) => [styles.summaryEdit, pressed && styles.pressed]}><Text style={styles.summaryEditText}>{contextText(locale, 'change')}</Text></Pressable> : null}
        </View>
      ))}</MotionSelectionSummary> : <Text style={styles.summaryOpen}>{t(locale, 'guidedOpen')}</Text>}
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

function OptionCard({label, note, selected, compact, short=false, selectedText, onPress,feedbackKey}: {feedbackKey?:string;label: string; note?: string; selected: boolean; compact: boolean;short?:boolean; selectedText: string; onPress: () => void}) {
  const [hovered,setHovered]=useState(false);
  return (
    <Pressable {...motionData({motionPart:'option'})}
      accessibilityRole="button"
      accessibilityState={{selected}}
      aria-pressed={selected}
      onPress={onPress}
      onHoverIn={()=>setHovered(true)}
      onHoverOut={()=>setHovered(false)}
      style={({pressed}) => [styles.option, compact && styles.optionCompact, short&&styles.optionShort, selected && styles.optionSelected, pressed && styles.pressed]}
    >
      <MotionSelectionRule selected={selected} feedbackKey={feedbackKey} pointerEvents="none" style={styles.optionSelectedRule}/>
      {selected?<View pointerEvents="none" style={[styles.optionAccentRule,compact&&styles.optionAccentRuleCompact]}/>:null}
      <View style={styles.optionCopy}>
        <View style={styles.optionTitleLine}>
          <Text style={[styles.optionLabel,(compact||short)&&styles.optionLabelSmall, hovered&&!selected&&{color:colors.accent}, selected && styles.optionLabelSelected]}>{label}</Text>
          {selected ? <Text style={styles.selectedBadge}>{selectedText}</Text> : null}
        </View>
        {note ? <Text style={[styles.optionNote,(compact||short)&&styles.optionNoteSmall, selected && styles.optionNoteSelected]}>{note}</Text> : null}
      </View>
      <MotionSelection selected={selected} feedbackKey={feedbackKey} style={[styles.optionIndicator, compact && styles.optionIndicatorCompact, selected && styles.optionIndicatorSelected]}><Text style={[styles.optionCheck, selected && styles.optionCheckSelected]}>{selected ? '✓' : ''}</Text></MotionSelection>
    </Pressable>
  );
}

function Progress({guided, locale, dispatch}: {guided: GuidedSession; locale: Locale; dispatch: React.Dispatch<GuidedAction>}) {
  const goBackTo = (target: number) => {
    dispatch({type: 'review', step: target});
  };
  return (
    <View {...motionData({motionPart:'progress'})} style={styles.progressLine}>
      <Text style={styles.stepNumber}>{String(guided.step + 1).padStart(2, '0')}<Text style={styles.stepTotal}> / 04</Text></Text>
    <View style={styles.progress}>
      <ProgressOrbit step={guided.step} />
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
              <Text numberOfLines={1} style={[styles.progressLabel, (completed || current) && styles.progressTextReached]}>{gr(locale, item.nameKey)}</Text>
              {completed ? <Text style={styles.progressEdit}>↙</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
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
function ResultCard({result, locale, query, contextActive, onHide, cardWidth, photoHeight, hero, mobile, index,onPhotoRef,photoOpacity}: {result: GuidedResult; locale: Locale; query: SearchQuery; contextActive: boolean; onHide: () => void; cardWidth: number;photoHeight:number;hero:boolean;mobile:boolean;index:number;onPhotoRef?:(cocktailId:string,node:View|null)=>void;photoOpacity?:Animated.Value}) {
  const cocktail = catalogue.cocktails.find((item) => item.id === result.cocktailId);
  if (!cocktail) return null;
  const asset = media[cocktail.id];
  const version = catalogue.versions.find((item) => item.id === result.selectedVersionId);
  const matches = version ? matchedLabels(query, version, locale) : [];
  const avoided = query.excluded?.map((value) => exclusionLabel(value, locale)) ?? [];
  return (
    <View {...motionData({motionItem: cocktail.id})} style={[styles.resultWrap, {width: cardWidth}]}>
      <Link
        href={{pathname: '/cocktails/[id]', params: {id: cocktail.id, version: result.selectedVersionId, from: 'customize'}} as never}
        asChild
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`}
          style={StyleSheet.flatten([styles.resultCard, hero && !mobile && styles.resultCardHero])}
        >
          <View {...motionData({motionPhoto: cocktail.id})} ref={node=>onPhotoRef?.(cocktail.id,node)} collapsable={false} style={[styles.resultPhoto,hero && !mobile && styles.resultPhotoHero]}>
            <MotionPhoto opacity={photoOpacity}>
              <PhotoFrame asset={asset} accent={cocktail.accent} locale={locale} height={photoHeight} borderRadius={0} />
            </MotionPhoto>
            <Text accessible={false} pointerEvents="none" style={styles.resultNumber}>{String(index+1).padStart(2,'0')}</Text>
          </View>
          <View style={[styles.resultCopy,hero && !mobile && styles.resultCopyHero]}>
            <Text style={styles.resultMeta}>{t(locale, cocktail.category as UiKey)} · {t(locale, 'guidedMatchReason')}</Text>
            <Heading level={2} style={[styles.resultName,mobile&&styles.resultNameMobile,hero&&styles.resultNameHero]}>{cocktail.name[locale]}</Heading><CocktailOriginalName cocktail={cocktail} locale={locale} />
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

function StepActions({guided, dispatch, locale, compact = false,short=false}: {guided: GuidedSession; dispatch: React.Dispatch<GuidedAction>; locale: Locale; compact?: boolean;short?:boolean}) {
  return (
    <View {...motionData({motionActions: ''})} style={[styles.stepActions, compact && styles.stepActionsCompact,short&&styles.stepActionsShort]}>
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
  const {width}=useViewport();
  const {run}=useSceneTransition();
  return <View style={[styles.modeIntro,compact&&styles.modeIntroCompact]}>
    <Text {...motionData({motionPart:'kicker'})} style={styles.sceneKicker}>YOUR WAY / YOUR GLASS</Text>
    <View {...motionData({motionPart: 'title'})}><Heading level={1} style={[styles.modeTitle,{fontSize:compact?53:Math.min(98,Math.max(65,width*.062)),lineHeight:compact?61:Math.min(112,Math.max(75,width*.071))}]}>{g175(locale,'modeTitle')}</Heading></View>
    <View {...motionData({motionPart: 'copy'})}><Text style={styles.questionHint}>{g175(locale,'modeHint')}</Text></View>
    {compact && Platform.OS==='web' && <View {...motionData({nightGlassAnchor: ''})} pointerEvents="none" style={styles.glassCompact}/>}
    <View {...motionData({motionPart: 'options'})} style={[styles.modeChoices,compact&&styles.modeChoicesCompact]}>
      {(['drink','make'] as const).map(mode=><Pressable {...motionData({motionPart:'entry'})} key={mode} accessibilityRole="button" onPress={()=>dispatch({type:'set-mode',mode})} style={({pressed})=>[styles.modeChoice,pressed&&styles.pressed]}>
        <View {...motionData({nightRule:''})} pointerEvents="none" style={styles.modeRule}/>
        <View style={styles.modeEntryLine}><Text style={styles.modeIndex}>{mode==='drink'?'01':'02'}</Text><Text style={styles.modeName}>{g175(locale,mode)}</Text><View {...motionData({nightArrow:''})} style={styles.modeArrowTrack}><Text style={styles.modeArrow}>↗</Text></View></View>
        <Text style={styles.modeHint}>{g175(locale,mode==='drink'?'drinkHint':'makeHint')}</Text>
      </Pressable>)}
    </View>
    <Pressable accessibilityRole="button" onPress={()=>run(()=>router.replace('/'),{label:'此刻',direction:-1})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t(locale,'back')}</Text></Pressable>
  </View>;
}

function PantryGate({locale,access,onRetry,onContinue,onDrink}:{locale:Locale;access:PantryAccess;onRetry:()=>void;onContinue:()=>void;onDrink:()=>void}) {
  const compact=isCompactViewport(useViewport());
  return <View style={[styles.modeIntro,compact&&styles.modeIntroCompact]}>
    <Heading level={1} style={styles.questionTitle}>{g175(locale,access==='empty'?'emptyTitle':access==='error'?'pantryError':'pantryLoading')}</Heading>
    {compact && Platform.OS==='web' && <View {...motionData({nightGlassAnchor: ''})} pointerEvents="none" style={styles.glassCompact}/>}
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
  const viewport=useViewport(), short=!compact&&viewport.height<=800;
  const selected = selectedValues(guided.draft, step.field);
  const [exclusionsOpen, setExclusionsOpen] = useState(false);
  return (
    <View style={[styles.chooseLayout, compact && styles.chooseLayoutCompact,short&&styles.chooseLayoutShort]}>
      <View style={[styles.questionPane, compact && styles.questionPaneCompact,short&&styles.questionPaneShort]}>
        <View style={compact ? styles.progressCompact : undefined}><Progress guided={guided} locale={locale} dispatch={dispatch} /></View>
        <View {...motionData({motionPart: 'title'})}><Heading level={1} accessibilityLiveRegion="polite" style={[styles.questionTitle,{fontSize:Math.min(74,Math.max(47,viewport.width*.045)),lineHeight:Math.min(90,Math.max(57,viewport.width*.055))}, compact && styles.questionTitleCompact,short&&styles.questionTitleShort]}>{t(locale, step.titleKey)}</Heading></View>
        <View {...motionData({motionPart: 'copy'})}>
          <Text style={[styles.questionHint,short&&styles.questionHintShort,compact&&styles.questionHintCompact]}>{t(locale, step.hintKey)}</Text>
          <Text style={[styles.selectionHint,short&&styles.selectionHintShort]}>{t(locale, step.multi ? 'guidedMultiHint' : 'guidedSingleHint')}</Text>
        </View>
        {compact && Platform.OS==='web' && <View {...motionData({nightGlassAnchor: ''})} pointerEvents="none" style={styles.glassCompact}/>}
        {guided.step === 0 ? <ContextSelector editorial compact={compact||short} locale={locale} value={guided.contextDraft ?? {}} onApply={(selection) => dispatch({type: 'set-context', selection})} /> : null}
        <View {...motionData({motionPart: 'options'})} style={[styles.options, compact && styles.optionsCompact,short&&styles.optionsShort]}>
          {step.options.map((option) => (
            <OptionCard
              key={option.value}
              label={t(locale, option.labelKey)}
              note={option.exampleKey ? gr(locale, option.exampleKey) : option.noteKey ? t(locale, option.noteKey) : undefined}
              selected={selected.includes(option.value)}
              feedbackKey={selected.join('|')}
              compact={compact}
              short={short}
              selectedText={gr(locale, 'selected')}
              onPress={() => dispatch({type: 'toggle', field: step.field, value: option.value})}
            />
          ))}
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.selectionFeedback}>{selected.length ? `${selected.length} · ${gr(locale, 'selected')}` : ' '}</Text>
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
        <SelectionSummary query={guided.draft} context={guided.contextDraft ?? {}} locale={locale} compact={compact} inline />
        {memorySettings}
        <StepActions guided={guided} dispatch={dispatch} locale={locale} compact={compact} short={short}/>
      </View>
      {!compact ? <View accessible={false} pointerEvents="none" style={styles.atmosphereSpace} /> : null}
    </View>
  );
}

function ResultsView({guided, locale, results, baseResultCount, allResultsHidden, compact, dispatch, onHide, onRestore, memorySettings,pantryFiltered,onPhotoRef,photoOpacity,skipAction}: {skipAction?:React.ReactNode;guided: GuidedSession; locale: Locale; results: GuidedResult[]; baseResultCount: number; allResultsHidden: boolean; compact: boolean; dispatch: React.Dispatch<GuidedAction>; onHide: (cocktailId: string) => void; onRestore: () => void; memorySettings?: React.ReactNode;pantryFiltered:boolean;onPhotoRef?:(cocktailId:string,node:View|null)=>void;photoOpacity?:Animated.Value}) {
  const [showAll, setShowAll] = useState(false);
  const [replayKey,setReplayKey]=useState(0);
  const viewport = useViewport();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const shown = showAll ? results : results.slice(0, 6);
  const layout=resultsLayout(containerWidth??Math.max(1,viewport.width*.86),shown.length);
  const contextActive = Boolean(guided.contextSubmitted?.occasion || guided.contextSubmitted?.season);
  useEffect(() => setShowAll(false), [guided.submitted,guided.mode,pantryFiltered]);
  return (
    <MotionResults replayKey={replayKey} changeKey={shown.map(item=>item.cocktailId).join('|')} style={styles.resultsView} onLayout={event=>{const next=event.nativeEvent.layout.width;if(next>0)setContainerWidth(next);}}>
      <View {...motionData({motionResultsLead: ''})} style={styles.resultsLead}>
        <Text {...motionData({motionPart:'kicker'})} style={styles.sceneKicker}>YOUR TASTE / IN {shown.length} {shown.length===1?'GLASS':'GLASSES'}</Text>
        <Heading level={1} style={[styles.resultsTitle,{fontSize:layout.mobile?51:Math.min(97,Math.max(58,viewport.width*.061)),lineHeight:layout.mobile?63:Math.min(116,Math.max(70,viewport.width*.073))}]}>{t(locale, 'guidedResultsTitle')}</Heading>
        <Text {...motionData({motionPart:'detail'})} style={styles.resultsHint}>{pantryFiltered?g175(locale,'makeResultHint'):t(locale, 'guidedResultsHint')}</Text>
        <Text style={styles.resultsVersionNote}>{gr(locale, 'resultIntro')}</Text>
        <SelectionSummary inline query={guided.submitted ?? {}} context={guided.contextSubmitted ?? {}} locale={locale} onEditContext={() => dispatch({type: 'edit', step: 0})} />
        {memorySettings}
        <View style={styles.resultControls}>
          <Text accessibilityLiveRegion="polite" style={styles.resultCount}>{contextActive&&!pantryFiltered ? `${contextText(locale, 'baseResultCount')} · ${baseResultCount}. ${contextText(locale, 'contextPriorityNote')}` : `${t(locale, 'results')} · ${results.length}`}</Text>
          {skipAction}
          <Pressable accessibilityRole="button" onPress={() => dispatch({type: 'edit'})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t(locale, 'guidedEdit')}</Text></Pressable>
        </View>
      </View>
      {results.length ? (
        <>
          <View style={[styles.resultColumns,{rowGap:layout.rowGap}]}>
            {layout.rows.map((row,rowIndex)=><View key={rowIndex} style={[styles.resultRow,{columnGap:layout.gap}]}>{row.map(({index,top})=>{
              const result=shown[index]!;
              return <View key={result.cocktailId} style={{paddingTop:top}}><ResultCard result={result} locale={locale} query={guided.submitted ?? {}} contextActive={contextActive} onHide={() => onHide(result.cocktailId)} cardWidth={layout.cardWidth} photoHeight={layout.photoHeight} hero={layout.hero} mobile={layout.mobile} index={index} onPhotoRef={onPhotoRef} photoOpacity={photoOpacity}/></View>;
            })}</View>)}
          </View>
          {results.length > 6 ? (
            <Pressable accessibilityRole="button" onPress={() => {setReplayKey(value=>value+1);setShowAll(!showAll);}} style={styles.showAll}>
              <Text style={styles.showAllText}>{t(locale, showAll ? 'less' : 'allResults')}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <View {...motionData({revealEmpty:''})} style={styles.empty}>
          <Text style={styles.emptyTitle}>{allResultsHidden ? contextText(locale, 'hiddenAllTitle') : pantryFiltered?g175(locale,'noMakeTitle'):t(locale, 'noResults')}</Text>
          <Text style={styles.emptyHint}>{allResultsHidden ? contextText(locale, 'hiddenAllHint') : pantryFiltered?g175(locale,'noMakeBody'):t(locale, 'guidedEmptyHint')}</Text>
          {pantryFiltered&&!allResultsHidden?<View style={styles.gateActions}>
            <Pressable accessibilityRole="link" onPress={()=>router.push('/pantry')} style={styles.primaryAction}><Text style={styles.primaryActionText}>{g175(locale,'openPantry')}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={()=>dispatch({type:'set-mode',mode:'drink'})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{g175(locale,'switchDrink')}</Text></Pressable>
          </View>:null}
          {allResultsHidden ? <Pressable accessibilityRole="button" onPress={()=>{setReplayKey(value=>value+1);onRestore();}} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{contextText(locale, 'restoreHidden')}</Text></Pressable> : null}
        </View>
      )}
      <View {...motionData({revealActions:''})} style={styles.resultActions}>
        <Pressable accessibilityRole="button" onPress={() => dispatch({type: 'restart'})} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t(locale, 'guidedRestart')}</Text></Pressable>
        <Link href="/ingredients" asChild>
          <Pressable accessibilityRole="link" style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{lib(locale, 'library')} ↗</Text></Pressable>
        </Link>
        <Link href="/discover" asChild>
          <Pressable accessibilityRole="link" style={styles.primaryAction}><Text style={styles.primaryActionText}>{t(locale, 'browseMode')}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
        </Link>
      </View>
    </MotionResults>
  );
}

export default function GuidedScreen() {
  const app = useApp() as GuidedAppState;
  const {run}=useSceneTransition();
  const taste=useTaste();
  const pantry=usePantry();
  const owned=useBottles();
  const canAnimate=useMotionEnabled();
  const [useMemory,setUseMemory]=useState(true);
  const [hiddenResults, setHiddenResults] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const resultPhotoRefs=useRef(new Map<string,View>());
  const {locale, setLocale, unit, setUnit, motionPaused, setMotionPaused, guided, dispatchGuided:commitGuided} = app;
  const dispatchGuided=useCallback<React.Dispatch<GuidedAction>>((action)=>{
    const names=['香气','口感','酒感','第一口'];
    let label:string|undefined,direction:1|-1=1;
    switch(action.type){
      case 'next':case 'skip':label=guided.step===3?'遇见':names[guided.step+1];break;
      case 'begin':label='遇见';break;
      case 'back':label=names[Math.max(0,guided.step-1)];direction=-1;break;
      case 'review':label=names[action.step];direction=-1;break;
      case 'edit':label=names[action.step??guided.step];direction=-1;break;
      case 'restart':label='一杯';direction=-1;break;
      case 'set-mode':label=action.mode===null?'一杯':'香气';direction=action.mode===null?-1:1;break;
      case 'allow-pantry-fallback':label='香气';break;
    }
    if(label){
      const inQuestion=guided.phase==='choosing'&&guided.mode!==null;
      const kind=label==='遇见'?'results':inQuestion&&['next','skip','back','review'].includes(action.type)?'step':direction<0?'back':'page';
      if(kind==='results')commitGuided(action);else run(()=>commitGuided(action),{label,direction,kind});
    }else commitGuided(action);
  },[commitGuided,guided.step,guided.phase,guided.mode,run]);
  const previousPhaseRef=useRef(guided.phase);
  const registerResultPhoto=useCallback((cocktailId:string,node:View|null)=>{
    if(node)resultPhotoRefs.current.set(cocktailId,node);
    else resultPhotoRefs.current.delete(cocktailId);
  },[]);
  const {width, height} = useViewport();
  const reduceMotion = useReduceMotion();
  const focused = useIsFocused();
  const compact = isCompactViewport({width, height});
  const screenPaused = !canAnimate || !focused;
  const mode=guided.mode===undefined?'drink':guided.mode;
  const ownedPantry=useMemo(()=>mergeOwnedPantry(pantry.pantry,bottles.filter(bottle=>owned.ids.includes(bottle.id))),[pantry.pantry,owned.ids]);
  const access=pantryAccess(pantry,owned,ownedPantry.ingredientIds.length);
  const gate=mode==='make'&&needsPantryPrompt(access,Boolean(guided.pantryFallback));
  const pantryFiltered=mode==='make'&&access==='ready';
  const fallbackActive=mode==='make'&&access==='empty'&&guided.pantryFallback;
  const submitted = guided.submitted ?? emptySubmittedQuery;
  const resultsReady = guided.phase !== 'choosing';
  const contextActive = Boolean(guided.contextSubmitted?.occasion || guided.contextSubmitted?.season);
  const rankedResults:GuidedResult[] = useMemo(() => {
    // Draft choices never need a catalogue search. Compute the real submitted
    // recipe versions once, and retain that result through revealing/results.
    if (!resultsReady) return [];
    const tasteState=useMemory&&taste.hydrated?taste.savedState:emptyTasteState();
    return pantryFiltered
      ? rankForPantry(catalogue,{...submitted,locale},tasteState,guided.contextSubmitted??{},contextEvidence,ownedPantry)
      : rankForContext(catalogue,{...submitted,locale},tasteState,guided.contextSubmitted??{},contextEvidence);
  }, [resultsReady,guided.contextSubmitted, locale, submitted, taste.hydrated, taste.savedState, useMemory,pantryFiltered,ownedPantry]);
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView {...motionData({nightScroll: ''})} ref={scrollRef} style={stableWebScrollGutter} contentContainerStyle={[styles.page,{paddingHorizontal:width*(compact ? 0.07 : 0.065)}]} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <BrandToolbar {...{locale, setLocale, unit, setUnit, motionPaused, setMotionPaused}} showUnits={false} />
          <MotionTransition changeKey={`${mode}:${gate}:${guided.phase==='choosing'?`choosing:${guided.step}`:'reveal-results'}`} kind="step" disabled={!focused}>
          {mode!==null?<View {...motionData({motionPart:'detail',motionModeBar:''})} style={styles.modeBar}>
            <Text style={styles.modeBarName}>{g175(locale,mode)}</Text>
            <Pressable accessibilityRole="button" onPress={()=>dispatchGuided({type:'set-mode',mode:null})} style={styles.modeChange}><Text style={styles.secondaryActionText}>{g175(locale,'changeMode')}</Text></Pressable>
          </View>:null}
          {fallbackActive?<Text accessibilityLiveRegion="polite" style={styles.fallbackNote}>{g175(locale,'fallbackNote')}</Text>:null}
          {mode===null?<ModeChoice locale={locale} dispatch={dispatchGuided} compact={compact}/>:gate?
            <PantryGate locale={locale} access={access} onContinue={()=>dispatchGuided({type:'allow-pantry-fallback'})} onDrink={()=>dispatchGuided({type:'set-mode',mode:'drink'})} onRetry={()=>{void pantry.retry();void (owned.error==='write'?owned.retrySave():owned.load());}}/>:
          (
            <GuidedReveal choosing={guided.phase==='choosing'} revealing={guided.phase==='revealing'} motionAllowed={revealMotionAllowed} activeWindow={focused} locale={locale} candidates={revealCandidates} resultPhotoRefs={resultPhotoRefs} onFinish={()=>dispatchGuided({type:'finish'})} departure={<ChoosingView guided={guided} dispatch={dispatchGuided} locale={locale} compact={compact} motionPaused={screenPaused} reduceMotion={reduceMotion} memorySettings={memorySettings}/>}>
              {(photoOpacity,skipAction)=><ResultsView skipAction={skipAction} guided={guided} locale={locale} results={results} baseResultCount={rankedResults.length} allResultsHidden={rankedResults.length > 0 && results.length === 0} compact={compact} dispatch={dispatchGuided} onHide={(cocktailId) => setHiddenResults((current) => current.includes(cocktailId) ? current : [...current, cocktailId])} onRestore={() => setHiddenResults([])} memorySettings={memorySettings} pantryFiltered={pantryFiltered} onPhotoRef={registerResultPhoto} photoOpacity={photoOpacity}/>}
            </GuidedReveal>
          )}
          </MotionTransition>
          {guided.phase === 'revealing' ? <TasteStorageNotice taste={taste} locale={locale} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modeIntro:{width:'100%',maxWidth:1000,alignSelf:'flex-start',paddingTop:70,paddingBottom:40},
  modeIntroCompact:{paddingTop:30},
  sceneKicker:{color:colors.muted,fontSize:9,lineHeight:15,letterSpacing:2.2},
  modeTitle:{color:colors.text,fontFamily:serif,fontWeight:'400',maxWidth:810,marginTop:28,marginBottom:16,letterSpacing:-2},
  modeChoices:{width:'100%',maxWidth:560,marginTop:48,marginBottom:24},
  modeChoicesCompact:{marginTop:40},
  modeChoice:{position:'relative',paddingVertical:20,minHeight:100,borderBottomWidth:1,borderBottomColor:colors.border},
  modeEntryLine:{flexDirection:'row',alignItems:'center',gap:18},
  modeIndex:{color:colors.amber,fontSize:12,fontFamily:serif,width:28},
  modeArrow:{color:colors.accent,fontSize:23},
  modeArrowTrack:{width:38,height:38,marginLeft:'auto',borderRadius:19,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  modeRule:{position:'absolute',left:0,right:0,bottom:-1,height:1,backgroundColor:colors.accent,transform:[{scaleX:0}],transformOrigin:'left center'} as never,
  modeHint:{color:colors.muted,fontSize:12,lineHeight:19,marginTop:9,marginLeft:46},
  modeName:{fontFamily:serif,fontSize:31,lineHeight:40,color:colors.text},
  modeBar:{flexDirection:'row',alignItems:'center',gap:25,marginTop:4,minHeight:28},
  modeBarName:{color:colors.accent,fontSize:11},
  modeChange:{minHeight:28,justifyContent:'center',paddingHorizontal:0},
  gateActions:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:12},
  fallbackNote:{color:colors.amber,fontSize:13,lineHeight:21,paddingVertical:12},
  ownedSummary:{gap:6,paddingVertical:12,borderTopWidth:1,borderTopColor:colors.border,marginTop:14},
  ownedHeading:{color:colors.accent,fontSize:13,fontWeight:'700'},
  ownedText:{color:colors.text,fontSize:13,lineHeight:21},
  ownedNote:{color:colors.muted,fontSize:12,lineHeight:19},
  resultControls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 30, paddingBottom:16,borderBottomWidth:1,borderBottomColor:colors.border,width: '100%'},
  resultCount: {color: colors.secondary, fontSize: 11,lineHeight:18},
  memorySettings: {width: '100%', marginTop: 18, paddingVertical:16, gap: 10, borderTopWidth:1,borderTopColor:colors.border},
  memorySettingsCompact: {marginTop: 14, paddingVertical:12, gap: 8},
  memorySettingsHeading: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  memorySettingsTitle: {color: colors.text, fontSize: 14, fontWeight: '800'},
  memorySettingsGlyph: {color: colors.accent, fontFamily: serif, fontSize: 22, lineHeight: 24},
  memoryControls: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10},
  memoryToggle: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius:2},
  memoryToggleActive: {borderColor: colors.accent, backgroundColor: 'rgba(181,198,169,0.07)'},
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
  screen: {flex: 1, backgroundColor: 'transparent'},
  page: {minHeight: '100%', paddingHorizontal: 24, paddingBottom: 56},
  shell: {width: '100%', maxWidth: 1500, alignSelf: 'center'},
  chooseLayout: {flexDirection: 'row', gap: 28, alignItems: 'stretch', paddingTop: 20},
  chooseLayoutShort:{paddingTop:0},
  chooseLayoutCompact: {flexDirection: 'column', gap: 12, paddingTop: 8},
  glassCompact: {height: 280, marginBottom: 16},
  questionPane: {flex: 1, maxWidth:920,minWidth: 0},
  questionPaneShort:{paddingVertical:0},
  questionPaneCompact: {paddingVertical: 0, paddingBottom: 20},
  atmosphereSpace: {width:'34%',maxWidth:500},
  stepLine: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12},
  progressLine:{width:'100%',maxWidth:860,flexDirection:'row',alignItems:'flex-start',gap:24},
  stepNumber: {color: colors.accent, fontFamily:Platform.OS==='web'?'Georgia, serif':Platform.OS==='ios'?'Georgia':'serif',fontStyle:'italic',fontSize:27,lineHeight:35},
  stepTotal:{color:colors.muted,fontSize:11,fontStyle:'normal'},
  progress: {position:'relative',flex:1,flexDirection: 'row', gap: 16},
  progressStep: {flex: 1, minWidth: 0, minHeight: 35, justifyContent: 'flex-start', opacity: 0.7},
  progressStepReached: {opacity: 1},
  progressSegment: {height: 1, width: '100%', backgroundColor: colors.border},
  progressSegmentActive: {backgroundColor: colors.accent},
  progressSegmentCurrent: {height: 1, backgroundColor: colors.amber},
  progressLabelLine: {flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 34, paddingTop: 3},
  progressIndex: {color: colors.muted, fontFamily: serif, fontSize: 11},
  progressLabel: {flexShrink: 1, color: colors.muted, fontSize: 10},
  progressTextReached: {color: colors.secondary},
  progressEdit: {color: colors.amber, fontSize: 11},
  progressCompact: {marginBottom: 0},
  questionTitle: {color: colors.text, fontFamily: serif, fontSize: 56, lineHeight: 70, letterSpacing: -1.8,fontWeight:'400',marginTop:24,marginBottom:11},
  questionTitleShort:{fontSize:45,lineHeight:55,marginTop:14,marginBottom:8},
  questionTitleCompact: {fontSize: 38, lineHeight: 46, letterSpacing: -1.2,marginTop:16,marginBottom:8},
  questionHint: {color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: 710},
  questionHintShort:{fontSize:11,lineHeight:18},
  questionHintCompact:{fontSize:11,lineHeight:20},
  selectionHint: {color: colors.muted, fontSize: 12, lineHeight: 20,marginBottom:23},
  selectionHintShort:{fontSize:11,lineHeight:18,marginBottom:12},
  options: {width:'100%',maxWidth:820,flexDirection: 'row', flexWrap: 'wrap', columnGap:'4%',rowGap:0,minHeight:276,alignContent:'flex-start'},
  optionsShort:{minHeight:228},
  optionsCompact: {minHeight:240},
  option: {position:'relative',width: '48%', minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,paddingLeft:0,paddingRight:10,borderBottomWidth: 1, borderBottomColor: colors.border},
  optionShort:{minHeight:76,paddingVertical:10},
  optionCompact: {minHeight: 80, gap: 5, paddingVertical: 14, paddingHorizontal: 0},
  optionSelected: {backgroundColor: 'transparent',borderBottomColor:colors.accent},
  optionAccentRule:{position:'absolute',left:-11,top:29,width:2,height:24,backgroundColor:colors.accent},
  optionAccentRuleCompact:{left:-7,top:24,height:22},
  optionSelectedRule: {position:'absolute',bottom:-1,left:0,right:0,height:2,backgroundColor:colors.accent},
  optionIndicator: {width: 25, height: 25,flexShrink:0, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'},
  optionIndicatorCompact:{width:20,height:20,borderRadius:10},
  optionIndicatorSelected: {borderColor: colors.accent,backgroundColor:colors.accent},
  optionCheck: {color: colors.accent, fontSize: 12, fontWeight: '600'},
  optionCheckSelected:{color:colors.background},
  optionCopy: {flex: 1},
  optionTitleLine: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 7, rowGap: 2},
  optionLabel: {color: colors.text,fontFamily:serif, fontSize: 29,lineHeight:38,fontWeight:'400',flexShrink: 1, maxWidth: '100%'},
  optionLabelSmall:{fontSize:25,lineHeight:33},
  optionLabelSelected: {color: colors.text},
  selectedBadge: {display:'none'},
  optionNote: {color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5},
  optionNoteSmall:{fontSize:10,lineHeight:16,marginTop:3},
  optionNoteSelected: {color: colors.secondary},
  selectionFeedback: {position:'absolute',width:1,height:1,overflow:'hidden',opacity:0},
  exclusions: {marginTop: 26, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border},
  exclusionsCompact: {marginTop: 17, paddingTop: 14},
  exclusionHeading: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12},
  exclusionTitle: {color: colors.text, fontSize: 15, fontWeight: '700'},
  optional: {color: colors.muted, fontSize: 12},
  exclusionChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  exclusionChip: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderBottomWidth:1,borderBottomColor:colors.border},
  exclusionChipActive: {backgroundColor:'rgba(181,198,169,0.08)',borderBottomColor:colors.accent},
  exclusionChipText: {color: colors.secondary, fontSize: 13, fontWeight: '600'},
  exclusionChipTextActive: {color: colors.accent},
  summary: {width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14,minHeight:74},
  summaryCompact: {marginTop: 14, paddingTop: 0},
  summaryInline:{maxWidth:820,flexDirection:'row',alignItems:'flex-start',gap:18,marginTop:14,minHeight:36,borderTopWidth:0,paddingTop:0},
  summaryGroupsInline:{flex:1,paddingTop:0,columnGap:13,rowGap:4},
  summaryLabel: {color: colors.muted, fontSize: 10,textTransform: 'uppercase', letterSpacing: 1.8},
  summaryGroups: {flexDirection: 'row', flexWrap: 'wrap', columnGap:22,rowGap:12,paddingTop: 11},
  summaryGroup: {minWidth: 90,paddingRight:18,borderRightWidth:1,borderRightColor:colors.border},
  summaryGroupName: {color: colors.muted, fontSize: 9,letterSpacing: 1, textTransform: 'uppercase'},
  summaryItems: {flexDirection: 'row', flexWrap: 'wrap',gap:6,paddingTop:5},
  summaryItem: {color: colors.accent, fontSize: 12,lineHeight:20},
  summaryEdit: {minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 2, marginTop: 3},
  summaryEditText: {color: colors.amber, fontSize: 12, lineHeight: 18, fontWeight: '700', textDecorationLine: 'underline'},
  summaryOpen: {color: colors.secondary, fontSize: 13, paddingVertical: 7},
  stepActions: {width:'100%',maxWidth:820,flexDirection: 'row', alignItems: 'center', gap: 25, marginTop: 18,paddingTop:21,borderTopWidth:1,borderTopColor:colors.border},
  stepActionsShort:{marginTop:8,paddingTop:14},
  stepActionsCompact: {flexWrap: 'wrap',gap:14,marginTop:12,paddingTop:14},
  fixedActions: {paddingHorizontal: 24, paddingTop: 0, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(16,23,20,0.96)'},
  secondaryAction: {minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12,borderBottomWidth:1,borderBottomColor:colors.border},
  secondaryActionCompact: {minWidth:44,paddingHorizontal:0},
  secondaryActionText: {color: colors.secondary, fontSize: 14, fontWeight: '700'},
  skipAction: {minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10},
  skipActionCompact: {paddingHorizontal:0},
  skipActionText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  primaryAction: {minWidth: 180, minHeight: 48,marginLeft:'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 30, paddingHorizontal: 26,borderRadius:2, backgroundColor: colors.accent},
  primaryActionCompact: {minWidth:128,minHeight:48,paddingHorizontal:16,gap:14},
  primaryActionText: {color: colors.background, fontSize: 14, fontWeight: '800'},
  primaryArrow: {color: colors.background, fontSize: 19},
  pressed: {opacity: 0.72},
  resultsView: {width:'100%',maxWidth:1260,alignSelf:'center',paddingTop:35},
  resultsLead: {width:'100%',marginBottom:22},
  resultsTitle: {color: colors.text, fontFamily: serif, fontSize: 97, lineHeight: 116, marginTop: 14,marginBottom:10,letterSpacing:-2,fontWeight:'400'},
  resultsHint: {color: colors.muted, fontSize: 12, lineHeight: 20},
  resultsVersionNote: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7},
  resultColumns: {width:'100%'},
  resultRow:{width:'100%',flexDirection:'row',justifyContent:'center',alignItems:'flex-start'},
  resultColumnsCompact: {gap: 12},
  resultWrap: {minWidth: 0, flexGrow: 0, flexShrink: 0},
  resultCard: {overflow: 'hidden',borderBottomWidth:1,borderBottomColor:colors.border},
  resultCopy: {minWidth:0,paddingTop:15,paddingBottom:22},
  resultCardHero:{flexDirection:'row',alignItems:'center',gap:42,paddingBottom:24},
  resultPhoto:{position:'relative'},
  resultPhotoHero:{width:'48%',flexShrink:0},
  resultCopyHero:{flex:1,paddingTop:0,paddingBottom:0},
  resultNumber:{position:'absolute',top:10,left:15,color:colors.text,fontFamily:Platform.OS==='web'?'Georgia, serif':Platform.OS==='ios'?'Georgia':'serif',fontStyle:'italic',fontSize:19,lineHeight:25,textShadowColor:colors.background,textShadowRadius:9},
  resultMeta: {color: colors.muted, fontSize: 10, lineHeight:16,letterSpacing:1},
  resultName: {color: colors.text, fontFamily: serif, fontSize: 27, lineHeight: 36, marginTop: 5,fontWeight:'400'},
  resultNameMobile:{fontSize:21,lineHeight:28},
  resultNameHero:{fontSize:48,lineHeight:59,marginTop:10,marginBottom:6},
  resultDescription: {color: colors.secondary, fontSize: 12, lineHeight: 20, marginTop: 7},
  matchPanel: {marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border},
  matchTitle: {color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase'},
  matchChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8},
  matchChip: {color: colors.accent, fontSize: 12, lineHeight: 17, paddingVertical: 4, paddingRight:8},
  matchOpen: {color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 7},
  avoidedText: {color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8},
  resultLink: {color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 15},
  resultCredit: {color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 6, marginHorizontal: 4},
  resultCredits: {minHeight: 38, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, paddingHorizontal: 4},
  resultCreditDivider: {color: colors.muted, fontSize: 12},
  recipeSource: {alignSelf: 'flex-start', minHeight: 34, justifyContent: 'center', paddingHorizontal: 4},
  hideResult: {alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, marginTop: 2},
  hideResultText: {color: colors.secondary, fontSize: 12, lineHeight: 18, textDecorationLine: 'underline'},
  showAll: {alignSelf: 'center', minHeight: 48, justifyContent: 'center', paddingHorizontal: 22, marginTop: 28, borderBottomWidth: 1, borderBottomColor: colors.border},
  showAllText: {color: colors.text, fontSize: 14, fontWeight: '700'},
  empty: {minHeight: 270, alignItems: 'center', justifyContent: 'center', padding: 30, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large},
  emptyTitle: {color: colors.text, fontFamily: serif, fontSize: 28, textAlign: 'center'},
  emptyHint: {color: colors.secondary, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 440, marginVertical: 12},
  resultActions: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 34},
});
