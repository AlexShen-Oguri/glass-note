import {CocktailOriginalName} from '../names/OriginalName';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Link, router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {catalogue} from '../../content/catalogue';
import type {Locale, MeasureUnit, RecipeVersion} from '../../domain/contracts';
import {recipeReturnPath, type RecipeNavigationSource} from '../../domain/discovery/navigation-state';
import {formatAmount, matchVersion} from '../../domain/search';
import type {UiKey} from '../../i18n/keys';
import {t} from '../../i18n/ui';
import {recipeCategoryText} from '../../i18n/recipe-categories';
import {media} from '../../media';
import {useApp} from '../../platform/AppProvider';
import {tm} from '../../i18n/taste';
import {makingText} from '../../i18n/making';
import {p02RecipeText} from '../../i18n/p02-recipe';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, isAiMedia, PhotoFrame, SelectionChip, serif, useViewport} from '../discovery/components';
import {FavoriteButton} from '../favorites/FavoriteButton';
import {AddToListButton} from '../favorites/AddToListButton';
import {ListBrowseAddButton, ListBrowseSelection} from '../favorites/ListBrowseSelection';
import {BrandMark} from '../brand/BrandIdentity';
import {PreparationPanel} from './PreparationPanel';
import {RecipeLabAction} from '../workspace/RecipeLabAction';
import {MyRecipeAction} from './MyRecipeAction';
import {Heading} from '../navigation/Heading';
import {recipeSnapshot} from '../../domain/making';
import {RecipeExperience} from '../taste/RecipeExperience';
import {RecipeAbv} from '../making/RecipeAbv';

function localize<T extends Record<Locale, string>>(value: T, locale: Locale) {
  return value[locale] || value.en;
}

function goBack(from: RecipeNavigationSource, listId?: string) {
  if (router.canGoBack()) router.back();
  else router.replace((listId ? {pathname: '/discover', params: {listId}} : recipeReturnPath(from)) as never);
}

function unitLabel(locale: Locale, unit: MeasureUnit) {
  return t(locale, `unit_${unit}` as UiKey);
}

function DetailSection({title, aside, compact, children}: {title: string; aside?: React.ReactNode; compact: boolean; children: React.ReactNode}) {
  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      <View style={styles.sectionTitleRow}>
        <Heading level={2} style={styles.sectionTitle}>{title}</Heading>
        {aside}
      </View>
      {children}
    </View>
  );
}

function VersionPicker({versions, selectedId, locale, onSelect}: {versions: RecipeVersion[]; selectedId: string; locale: Locale; onSelect: (id: string) => void}) {
  return (
    <View style={styles.versionBlock}>
      <Text style={styles.sectionEyebrow}>{t(locale, 'version')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.versionList}>
        {versions.map((version) => (
          <SelectionChip key={version.id} label={localize(version.label, locale)} selected={version.id === selectedId} onPress={() => onSelect(version.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function MoreActions({version, locale}: {version: RecipeVersion; locale: Locale}) {
  const [open, setOpen] = useState(false);
  const label = p02RecipeText(locale, open ? 'hideMoreActions' : 'moreActions');
  return (
    <View style={styles.moreActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        accessibilityLabel={label}
        onPress={() => setOpen((value) => !value)}
        style={({pressed}) => [styles.moreActionsToggle, pressed && styles.pressed]}
      >
        <Text style={styles.moreActionsText}>{label}</Text>
        <Text style={styles.moreActionsGlyph}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.moreActionsBody}>
          <AddToListButton key={version.id} versionId={version.id} locale={locale} />
          <MyRecipeAction versionId={version.id} locale={locale} />
          <RecipeLabAction version={version} locale={locale} />
        </View>
      ) : null}
    </View>
  );
}

export default function RecipeScreen({cocktailId, versionId, from = 'discover', listId}: {cocktailId: string; versionId?: string; from?: RecipeNavigationSource; listId?: string}) {
  const {locale, setLocale, unit, setUnit, query, motionPaused, setMotionPaused, guided} = useApp();
  const {width} = useViewport();
  const cocktail = catalogue.cocktails.find((item) => item.id === cocktailId);
  const versions = useMemo(
    () => catalogue.versions.filter((version) => cocktail?.versionIds.includes(version.id) && version.cocktailId === cocktail?.id),
    [cocktail],
  );
  const requestedVersion = versions.find((version) => version.id === versionId);
  const fallbackVersion = versions.find((version) => version.id === cocktail?.defaultVersionId) ?? versions[0];
  const [showOriginal, setShowOriginal] = useState(false);
  const version = requestedVersion ?? fallbackVersion;

  useEffect(() => {
    setShowOriginal(false);
  }, [cocktailId, fallbackVersion?.id, requestedVersion?.id, versionId]);

  if (!cocktail || !version) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>{t(locale, 'noResults')}</Text>
          <Pressable accessibilityRole="button" onPress={() => goBack(from, listId)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{t(locale, 'back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const source = catalogue.sources.find((item) => item.id === version.sourceId);
  const asset = media[cocktail.id];
  const aiAsset = isAiMedia(asset);
  const sourceQuery = from === 'customize' ? guided.submitted ?? {} : from === 'discover' || from === 'find' ? query : {};
  const matching = matchVersion(catalogue, version, {...sourceQuery, locale});
  const compact = width < 820;
  const instructions = showOriginal && version.originalSteps ? version.originalSteps : version.steps[locale] || version.steps.en;
  const hasOriginal = Boolean(version.originalSteps?.length);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.shell}>
          <BrandToolbar {...{locale, setLocale, unit, setUnit, motionPaused, setMotionPaused}} />
          <Pressable accessibilityRole="button" accessibilityLabel={t(locale, 'back')} onPress={() => goBack(from, listId)} style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>{t(locale, 'back')}</Text>
          </Pressable>

          <View style={[styles.lead, compact && styles.leadCompact]}>
            <View style={[styles.photoColumn, compact && styles.photoColumnCompact]}>
              <PhotoFrame asset={asset} accent={cocktail.accent} locale={locale} height={compact ? Math.min(width * 0.94, 520) : 590} />
            </View>

            <View style={styles.leadCopy}>
              {listId ? <ListBrowseSelection listId={listId} locale={locale} /> : null}
              <Text style={styles.category}>{version.origin ? recipeCategoryText(locale, version.origin.kind) : t(locale, cocktail.category as UiKey)}</Text>
              <Heading level={1} style={[styles.title, compact && styles.titleCompact]}>{localize(cocktail.name, locale)}</Heading><CocktailOriginalName cocktail={cocktail} locale={locale} />
              <Text style={styles.description}>{localize(cocktail.description, locale)}</Text>

              <View style={styles.divider} />
              <VersionPicker versions={versions} selectedId={version.id} locale={locale} onSelect={(id) => {
                setShowOriginal(false);
                router.setParams({version: id});
              }} />
              <View style={styles.sourceIdentity}>
                <View style={styles.sourceIdentityCopy}>
                  <Text style={styles.sourceIdentityLabel}>{p02RecipeText(locale, 'exactSource')}</Text>
                  <Text style={styles.sourceIdentityTitle}>{source?.title ?? t(locale, 'unknown')}</Text>
                  <Text style={styles.sourceIdentityMeta}>{localize(version.label, locale)}</Text>
                </View>
                {source?.url ? (
                  <Pressable accessibilityRole="link" onPress={() => Linking.openURL(source.url)} style={styles.sourceIdentityLink}>
                    <Text style={styles.sourceIdentityLinkText}>{t(locale, 'sourceLink')} ↗</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.primaryActions}>
                {listId ? <ListBrowseAddButton key={`list-add-${version.id}`} listId={listId} versionId={version.id} locale={locale} /> : null}
                <Link href={{pathname: '/make', params: {version: version.id}} as never} asChild>
                  <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.primaryButton])}>
                    <Text style={styles.primaryButtonText}>{makingText(locale, 'startMaking')} →</Text>
                  </Pressable>
                </Link>
                <Link href={{pathname: '/order', params: {version: version.id}} as never} asChild>
                  <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.orderButton])}>
                    <Text style={styles.orderButtonText}>{tm(locale, 'orderCard')} ↗</Text>
                  </Pressable>
                </Link>
                <View style={styles.favoriteRow}>
                  <FavoriteButton versionId={version.id} locale={locale} compact />
                </View>
                <RecipeExperience key={`experience-${version.id}`} recipe={recipeSnapshot(catalogue,version.id)!} locale={locale}/>
                <MoreActions key={version.id} version={version} locale={locale} />
              </View>
              {!matching ? (
                <View style={styles.mismatch}>
                  <Text style={styles.mismatchGlyph}>!</Text>
                  <Text style={styles.mismatchText}>{t(locale, 'versionMismatch')}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.recipeGrid, compact && styles.recipeGridCompact]}>
            <DetailSection compact={compact} title={t(locale, 'ingredients')} aside={<Text style={styles.servings}>{t(locale, 'servings')} · {version.servings}</Text>}>
              <View style={styles.ingredientsList}>
                {version.ingredients.map((recipeIngredient, index) => {
                  const ingredient = catalogue.ingredients.find((item) => item.id === recipeIngredient.ingredientId);
                  const brand = recipeIngredient.brandId ? catalogue.brands.find((item) => item.id === recipeIngredient.brandId) : undefined;
                  const displayed = formatAmount(recipeIngredient.amount, recipeIngredient.unit, unit);
                  const amount = displayed.amount
                    ? `${displayed.amount} ${unitLabel(locale, displayed.unit)}`
                    : unitLabel(locale, displayed.unit);
                  return (
                    <View key={`${recipeIngredient.ingredientId}-${index}`} style={styles.ingredientRow}>
                      <Text style={styles.amount}>{amount}</Text>
                      <View style={styles.ingredientCopy}>
                        <Link href={{pathname: '/ingredients/[id]', params: {id: recipeIngredient.ingredientId}} as never} asChild>
                          <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.ingredientLink])}>
                            <Text style={styles.ingredientName}>{ingredient ? localize(ingredient.name, locale) : recipeIngredient.ingredientId} ↗</Text>
                          </Pressable>
                        </Link>
                        {brand ? <Text style={styles.ingredientBrand}>{t(locale, 'brand')}: {brand.name}</Text> : null}
                        {recipeIngredient.note ? <Text style={styles.ingredientNote}>{localize(recipeIngredient.note, locale)}</Text> : null}
                        {recipeIngredient.optional ? <Text style={styles.optional}>{t(locale, 'optional')}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </DetailSection>

            <DetailSection compact={compact} title={t(locale, 'method')}>
              <View style={styles.methodHeadingRow}>
                <Text style={styles.methodMode}>{showOriginal ? t(locale, 'originalParaphrase') : t(locale, 'translated')}</Text>
                {hasOriginal ? (
                  <Pressable accessibilityRole="button" accessibilityState={{selected: showOriginal}} accessibilityLabel={t(locale, showOriginal ? 'translated' : 'original')} onPress={() => setShowOriginal(!showOriginal)} style={styles.originalButton}>
                    <Text style={styles.originalButtonText}>{t(locale, showOriginal ? 'translated' : 'original')}</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.steps}>
                {instructions.map((instruction, index) => (
                  <View key={index} style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                    <Text style={styles.stepText}>{instruction}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.serveGrid}>
                <View style={styles.serveItem}><Text style={styles.serveLabel}>{t(locale, 'glass')}</Text><Text style={styles.serveValue}>{localize(version.glass, locale)}</Text></View>
                <View style={styles.serveItem}><Text style={styles.serveLabel}>{t(locale, 'garnish')}</Text><Text style={styles.serveValue}>{localize(version.garnish, locale)}</Text></View>
              </View>
            </DetailSection>
          </View>

          <View style={styles.profilePanel}>
            <Heading level={2} style={styles.profileTitle}>{t(locale, 'profile')}</Heading>
            <Text style={styles.profileText}>{localize(version.profileNote, locale)}</Text>
            <View style={styles.profileTags}>
              {version.flavours.map((flavour) => <View key={flavour} style={styles.profileTag}><Text style={styles.profileTagText}>{t(locale, `flavour.${flavour}` as UiKey)}</Text></View>)}
              {version.tastes.map((taste) => <View key={taste} style={styles.profileTag}><Text style={styles.profileTagText}>{t(locale, `taste.${taste}` as UiKey)}</Text></View>)}
              {version.strength ? <View style={styles.profileTag}><Text style={styles.profileTagText}>{t(locale, `strength.${version.strength}` as UiKey)}</Text></View> : null}
            </View>
            <Text style={styles.editorialNote}>{t(locale, 'editorial')} {t(locale, 'strengthNote')}</Text>
          </View>

          <PreparationPanel key={version.id} versionId={version.id} locale={locale} showSources/>
          <RecipeAbv version={version} locale={locale} showSources/>
          <View style={[styles.sourcePanel, compact && styles.sourcePanelCompact]}>
            <View style={styles.sourceCopy}>
              <Text style={styles.sectionEyebrow}>{t(locale, 'source')}</Text>
              <Text style={styles.sourceTitle}>{source?.title ?? t(locale, 'unknown')}</Text>
              {source?.author ? <Text style={styles.sourceMeta}>{source.author}</Text> : null}
              {source?.book ? <Text style={styles.sourceMeta}>{source.book}</Text> : null}
              {asset ? (
                <View style={styles.photoSourceBlock}>
                  <Text style={styles.photoSourceLabel}>{t(locale, aiAsset ? 'aiImage' as UiKey : 'photograph')}</Text>
                  {aiAsset ? (
                    <>
                      <Text style={styles.sourceMeta}>{t(locale, 'imageInfo' as UiKey)}</Text>
                      {asset.referenceUrl ? (
                        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(asset.referenceUrl!)} style={styles.referenceLink}>
                          <Text style={styles.creditText}>{t(locale, 'referenceImage' as UiKey)} ↗</Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.creditLine}>
                      <Text style={styles.creditLabel}>{t(locale, 'credits')}:</Text>
                      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(asset.sourceUrl)} style={styles.creditLink}>
                        <Text style={styles.creditText}>{asset.author} ↗</Text>
                      </Pressable>
                      {asset.license && asset.licenseUrl ? (
                        <>
                          <Text style={styles.creditDivider}>·</Text>
                          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(asset.licenseUrl!)} style={styles.creditLink}>
                            <Text style={styles.creditText}>{asset.license} ↗</Text>
                          </Pressable>
                        </>
                      ) : null}
                    </View>
                  )}
                </View>
              ) : null}
              {version.bar ? (
                <View style={styles.barBlock}>
                  <Text style={styles.barLabel}>{t(locale, 'bar')}</Text>
                  {version.bar.url ? <Pressable accessibilityRole="link" onPress={() => Linking.openURL(version.bar!.url!)} style={styles.creditLink}>
                    <Text style={styles.barName}>{version.bar.name} ↗</Text>
                  </Pressable> : <Text style={styles.barName}>{version.bar.name}</Text>}
                  <Text style={styles.sourceMeta}>{version.bar.address}</Text>
                </View>
              ) : null}
            </View>
            {source?.url ? (
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(source.url)} style={({pressed}) => [styles.sourceButton, pressed && styles.pressed]}>
                <Text style={styles.sourceButtonText}>{t(locale, 'sourceLink')}</Text>
                <Text style={styles.sourceButtonArrow}>↗</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.endMark}><View style={styles.endRule} /><View style={styles.endLogo}><BrandMark size={20} decorative /></View><View style={styles.endRule} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  page: {minHeight: '100%', paddingHorizontal: 18, paddingBottom: 56},
  shell: {width: '100%', maxWidth: 1400, alignSelf: 'center'},
  backButton: {alignSelf: 'flex-start', minHeight: 46, marginTop: 16, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 9, paddingRight: 14},
  backArrow: {color: colors.accent, fontSize: 22},
  backText: {color: colors.secondary, fontSize: 14, fontWeight: '700'},
  lead: {flexDirection: 'row', gap: 56, alignItems: 'flex-start'},
  leadCompact: {flexDirection: 'column', gap: 30, alignItems: 'stretch'},
  photoColumn: {width: '51%', maxWidth: 720},
  photoColumnCompact: {width: '100%', maxWidth: undefined},
  creditLine: {minHeight: 40, paddingHorizontal: 5, paddingTop: 9, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6},
  creditLabel: {color: colors.muted, fontSize: 12, lineHeight: 20},
  creditLink: {minHeight: 32, justifyContent: 'flex-start'},
  creditText: {color: colors.accent, fontSize: 12, lineHeight: 20},
  creditDivider: {color: colors.muted, fontSize: 12, lineHeight: 20},
  referenceLink: {minHeight: 32, justifyContent: 'center', marginTop: 4},
  leadCopy: {flex: 1, paddingVertical: 8},
  category: {color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase'},
  title: {color: colors.text, fontFamily: serif, fontSize: 56, lineHeight: 62, letterSpacing: -1.5, marginTop: 13},
  titleCompact: {fontSize: 42, lineHeight: 48},
  description: {color: colors.secondary, fontSize: 16, lineHeight: 25, marginTop: 16, maxWidth: 560},
  divider: {height: 1, backgroundColor: colors.border, marginVertical: 28},
  versionBlock: {gap: 10},
  versionList: {gap: 8, paddingRight: 12},
  sourceIdentity: {marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14},
  sourceIdentityCopy: {flex: 1, minWidth: 0},
  sourceIdentityLabel: {color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase'},
  sourceIdentityTitle: {color: colors.text, fontFamily: serif, fontSize: 17, lineHeight: 22, marginTop: 4},
  sourceIdentityMeta: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3},
  sourceIdentityLink: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 6},
  sourceIdentityLinkText: {color: colors.accent, fontSize: 12, fontWeight: '700'},
  primaryActions: {marginTop: 16, gap: 9},
  orderButton: {minHeight: 48, paddingHorizontal: 20, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'},
  orderButtonText: {color: colors.accent, fontSize: 14, fontWeight: '800'},
  favoriteRow: {alignSelf: 'flex-start'},
  moreActions: {borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4},
  moreActionsToggle: {minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  moreActionsText: {color: colors.secondary, fontSize: 14, fontWeight: '700'},
  moreActionsGlyph: {color: colors.accent, fontFamily: serif, fontSize: 23, lineHeight: 24},
  moreActionsBody: {paddingBottom: 6, gap: 8},
  moreActionLink: {minHeight: 46, paddingHorizontal: 14, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'},
  moreActionLinkText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  mismatch: {marginTop: 14, borderRadius: radii.small, borderWidth: 1, borderColor: colors.amber, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10},
  mismatchGlyph: {width: 22, height: 22, textAlign: 'center', color: colors.background, backgroundColor: colors.amber, borderRadius: 11, overflow: 'hidden', fontWeight: '900', lineHeight: 22},
  mismatchText: {flex: 1, color: colors.text, fontSize: 14, lineHeight: 20},
  profilePanel: {marginTop: 30, backgroundColor: colors.panel, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, padding: 18},
  profileTitle: {color: colors.text, fontFamily: serif, fontSize: 24, lineHeight: 30},
  profileText: {color: colors.text, fontFamily: serif, fontSize: 19, lineHeight: 27, marginTop: 10},
  profileTags: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15},
  profileTag: {borderRadius: radii.pill, backgroundColor: colors.accentDark, paddingHorizontal: 10, paddingVertical: 7},
  profileTagText: {color: colors.accent, fontSize: 12, fontWeight: '700'},
  editorialNote: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 15},
  recipeGrid: {marginTop: 34, flexDirection: 'row', gap: 64, alignItems: 'flex-start'},
  recipeGridCompact: {marginTop: 28, flexDirection: 'column', alignItems: 'stretch', gap: 38},
  section: {flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0},
  // Stacked sections must keep their content height, not share the column's height.
  sectionCompact: {flexGrow: 0, flexShrink: 0, flexBasis: 'auto'},
  sectionEyebrow: {color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase'},
  sectionTitleRow: {minHeight: 50, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16},
  sectionTitle: {color: colors.text, fontFamily: serif, fontSize: 32, lineHeight: 38, flexShrink: 1},
  servings: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  ingredientsList: {borderTopWidth: 1, borderTopColor: colors.border},
  ingredientRow: {minHeight: 66, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', gap: 18},
  amount: {width: 88, color: colors.accent, fontSize: 14, lineHeight: 21, fontWeight: '700'},
  ingredientCopy: {flex: 1},
  ingredientLink: {minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start'},
  ingredientName: {color: colors.text, fontSize: 15, lineHeight: 21},
  ingredientBrand: {color: colors.accent, fontSize: 13, lineHeight: 18, marginTop: 3},
  ingredientNote: {color: colors.secondary, fontSize: 13, lineHeight: 18, marginTop: 3},
  optional: {color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4},
  methodHeadingRow: {minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: colors.border},
  methodMode: {color: colors.muted, fontSize: 12},
  originalButton: {minHeight: 42, justifyContent: 'center', paddingHorizontal: 8},
  originalButtonText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  steps: {gap: 18, marginTop: 18},
  step: {flexDirection: 'row', gap: 14},
  stepNumber: {width: 27, height: 27, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'},
  stepNumberText: {color: colors.accent, fontFamily: serif, fontSize: 12},
  stepText: {flex: 1, color: colors.text, fontSize: 14, lineHeight: 22, paddingTop: 2},
  serveGrid: {flexDirection: 'row', gap: 12, marginTop: 28},
  serveItem: {flex: 1, borderRadius: radii.medium, backgroundColor: colors.panel, padding: 15, borderWidth: 1, borderColor: colors.border},
  serveLabel: {color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase'},
  serveValue: {color: colors.text, fontFamily: serif, fontSize: 16, marginTop: 6},
  sourcePanel: {marginTop: 72, paddingVertical: 30, paddingHorizontal: 26, borderRadius: radii.large, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 28},
  sourcePanelCompact: {marginTop: 52, flexDirection: 'column', alignItems: 'stretch'},
  sourceCopy: {flex: 1},
  sourceTitle: {color: colors.text, fontFamily: serif, fontSize: 22, marginTop: 8},
  sourceMeta: {color: colors.secondary, fontSize: 13, lineHeight: 19, marginTop: 4},
  photoSourceBlock: {marginTop: 16},
  photoSourceLabel: {color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase'},
  barBlock: {marginTop: 14},
  barLabel: {color: colors.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase'},
  barName: {color: colors.text, fontSize: 14, marginTop: 4},
  sourceButton: {minHeight: 50, paddingHorizontal: 20, borderRadius: radii.pill, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', gap: 10},
  sourceButtonText: {color: colors.background, fontSize: 14, fontWeight: '800'},
  sourceButtonArrow: {color: colors.background, fontSize: 16},
  endMark: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 56},
  endRule: {height: 1, width: 36, backgroundColor: colors.border},
  endLogo: {opacity: 0.55},
  notFound: {flex: 1, minHeight: 500, alignItems: 'center', justifyContent: 'center', padding: 24},
  notFoundTitle: {color: colors.text, fontFamily: serif, fontSize: 30, textAlign: 'center'},
  primaryButton: {minHeight: 48, paddingHorizontal: 22, borderRadius: radii.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 20},
  primaryButtonText: {color: colors.background, fontWeight: '800'},
  pressed: {opacity: 0.7},
});
