import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {Link} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../../platform/AppProvider';
import {HELP_SECTIONS,helpText} from '../../i18n/help';
import {appNavigationText} from '../../i18n/app-navigation';
import {backupText} from '../../i18n/backup';
import {BrandToolbar,serif} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {Fold} from '../workspace/ui';
import {colors} from '../../theme/tokens';

export default function HelpScreen(){
  const app=useApp(),{locale}=app;
  return <SafeAreaView edges={['top']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.page}><View style={styles.shell}>
      <BrandToolbar {...app} showUnits={false}/>
      <Link href="/my" asChild><Pressable accessibilityRole="link" style={styles.link}><Text style={styles.linkText}>{appNavigationText(locale,'myTitle')}</Text></Pressable></Link>
      <Heading style={styles.title}>{helpText(locale,'title')}</Heading>
      <Text style={styles.body}>{helpText(locale,'intro')}</Text>
      <View style={styles.sections}>{HELP_SECTIONS.map(key=><Fold key={key} title={helpText(locale,key)}>
        <Text style={styles.body}>{helpText(locale,`${key}Body`)}</Text>
        {key==='restore'&&<Link href="/backup" asChild><Pressable accessibilityRole="link" style={styles.link}><Text style={styles.linkText}>{backupText(locale,'title')}</Text></Pressable></Link>}
      </Fold>)}</View>
      <Text style={styles.review}>{helpText(locale,'review')}</Text>
    </View></ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'transparent'},page:{paddingHorizontal:20,paddingBottom:48},
  shell:{width:'100%',maxWidth:760,alignSelf:'center',gap:18},
  title:{color:colors.text,fontFamily:serif,fontSize:32,lineHeight:42},
  body:{color:colors.secondary,fontSize:15,lineHeight:25},sections:{marginTop:8},
  link:{minHeight:44,justifyContent:'center',alignSelf:'flex-start',paddingVertical:10},
  linkText:{color:colors.accent,fontSize:14,lineHeight:22,textDecorationLine:'underline'},
  review:{color:colors.secondary,fontSize:12,lineHeight:20},
});
