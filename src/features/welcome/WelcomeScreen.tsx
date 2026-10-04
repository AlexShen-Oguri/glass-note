import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Link, router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../../platform/AppProvider';
import {catalogue} from '../../content/catalogue';
import {media} from '../../media';
import {t} from '../../i18n/ui';
import {editorialText as e} from '../../i18n/editorial';
import {colors, editorialType, spacing} from '../../theme/tokens';
import {BrandToolbar, PhotoFrame, serif, useViewport} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {appNavigationText} from '../../i18n/app-navigation';
import {recipeCategoryText} from '../../i18n/recipe-categories';
import {CocktailOriginalName} from '../names/OriginalName';

export default function WelcomeScreen() {
  const app = useApp();
  const {locale, dispatchGuided} = app;
  const {width, height} = useViewport();
  const compact = width < 820;
  const cocktail = catalogue.cocktails.find(item => item.id === 'daiquiri')!;
  const customize = () => {
    dispatchGuided({type: 'restart'});
    router.push('/customize' as never);
  };
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={[styles.page, !compact && {paddingHorizontal:spacing.xl}]}>
      <View style={styles.shell}>
        <BrandToolbar {...app} showUnits={false}/>
        <View style={[styles.hero, compact && styles.heroCompact, !compact && {minHeight:Math.max(620,height-180)}]}>
          <View style={[styles.copy,compact && styles.copyCompact]}>
            <Text style={styles.eyebrow}>{e(locale,'journey')}</Text>
            <Heading style={[styles.title,compact && styles.titleCompact]}>{e(locale,'tonight')}</Heading>
            <Text style={styles.intro}>{e(locale,'homeIntro')}</Text>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel={t(locale,'customizeMode')} onPress={customize} style={({pressed})=>[styles.primary,pressed && styles.pressed]}>
                <Text style={styles.primaryText}>{t(locale,'customizeMode')}</Text><Text style={styles.arrow}>↗</Text>
              </Pressable>
              <Link href="/discover" asChild><Pressable accessibilityRole="link" style={styles.secondary}><Text style={styles.secondaryText}>{t(locale,'browseMode')} →</Text></Pressable></Link>
            </View>
          </View>
          <View style={[styles.visual,compact && styles.visualCompact]}>
            <View style={styles.figureHeader}><Text style={styles.eyebrow}>01 / {e(locale,'inFocus')}</Text><View style={styles.rule}/></View>
            <Link href={{pathname:'/cocktails/[id]',params:{id:cocktail.id,version:cocktail.defaultVersionId,from:'welcome'}}} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`${cocktail.name[locale]}. ${t(locale,'viewRecipe')}`} style={styles.photoEdge}>
                <PhotoFrame asset={media[cocktail.id]} accent={cocktail.accent} locale={locale} height={520} preserveAspect borderRadius={10}/>
              </Pressable>
            </Link>
            <View style={styles.captionRow}>
              <View><Text style={styles.drinkName}>{cocktail.name[locale]}</Text><CocktailOriginalName cocktail={cocktail} locale={locale}/></View>
              <Text style={styles.caption}>{t(locale,'aiImage')}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.footer,compact && styles.footerCompact]}>
          <Link href="/topics" asChild><Pressable accessibilityRole="link" style={styles.editorialLink}><Text style={styles.eyebrow}>{e(locale,'editorial')}</Text><Text style={styles.editorialTitle}>{recipeCategoryText(locale,'topics')} ↗</Text></Pressable></Link>
          <View style={styles.destinations}>{([['/pantry','cabinet'],['/professional','professional'],['/my','my']] as const).map(([href,label])=><Link key={href} href={href} asChild><Pressable accessibilityRole="link" style={styles.destination}><Text style={styles.secondaryText}>{appNavigationText(locale,label)}</Text></Pressable></Link>)}</View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'transparent'},page:{flexGrow:1,paddingHorizontal:spacing.lg,paddingBottom:spacing.xl},
  shell:{width:'100%',maxWidth:1280,alignSelf:'center'},
  hero:{flexDirection:'row',alignItems:'center',gap:spacing.spread,paddingVertical:spacing.section},
  heroCompact:{flexDirection:'column',alignItems:'stretch',gap:spacing.xl,paddingTop:spacing.lg,paddingBottom:spacing.xl},
  copy:{flex:1},copyCompact:{flex:undefined},
  eyebrow:{color:colors.accent,...editorialType.caption,letterSpacing:0.8},
  title:{fontFamily:serif,color:colors.text,...editorialType.display,letterSpacing:-1.5,marginTop:spacing.lg},
  titleCompact:{...editorialType.displayPhone,letterSpacing:-0.5,marginTop:spacing.md},
  intro:{color:colors.secondary,...editorialType.body,marginTop:spacing.lg,maxWidth:420},
  actions:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:spacing.md,marginTop:spacing.xl},
  primary:{minHeight:56,minWidth:172,paddingHorizontal:spacing.lg,borderRadius:10,backgroundColor:colors.accent,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.lg},
  primaryText:{color:colors.background,fontSize:16,fontWeight:'700'},arrow:{color:colors.background,fontSize:23},
  secondary:{minHeight:48,paddingHorizontal:spacing.xs,justifyContent:'center'},secondaryText:{color:colors.secondary,fontSize:15,lineHeight:24},
  pressed:{opacity:0.76},visual:{width:'49%',maxWidth:620},visualCompact:{width:'100%',maxWidth:undefined},
  figureHeader:{flexDirection:'row',alignItems:'center',gap:spacing.md,marginBottom:spacing.md},rule:{height:1,flex:1,backgroundColor:colors.border},
  photoEdge:{padding:4,borderWidth:1,borderColor:colors.border,borderRadius:14,backgroundColor:colors.panel},
  captionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:spacing.md,marginTop:spacing.md},
  drinkName:{color:colors.text,fontFamily:serif,fontSize:22,lineHeight:30},caption:{color:colors.muted,...editorialType.caption,flexShrink:1},
  footer:{borderTopWidth:1,borderTopColor:colors.border,paddingTop:spacing.lg,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:spacing.lg},
  footerCompact:{flexDirection:'column',alignItems:'stretch'},editorialLink:{minHeight:64,gap:spacing.xs},
  editorialTitle:{color:colors.text,fontFamily:serif,fontSize:20,lineHeight:28},
  destinations:{flexDirection:'row',flexWrap:'wrap',gap:spacing.lg},destination:{minHeight:48,justifyContent:'center'},
});
