import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Animated,AppState,Easing,Pressable,StyleSheet,Text,View} from 'react-native';

import type {Cocktail,Locale,MediaAsset} from '../../domain/contracts';
import {revealLayout} from '../../domain/guided/reveal-layout';
import {t} from '../../i18n/ui';
import {colors,radii} from '../../theme/tokens';
import {nativeDriver,PhotoFrame,serif,useViewport} from '../discovery/components';
import {Heading} from '../navigation/Heading';

export interface GuidedRevealCandidate extends Pick<Cocktail,'id'|'name'|'accent'> {
  asset?:MediaAsset;
}

interface GuidedRevealProps {
  revealing:boolean;
  motionAllowed:boolean;
  activeWindow:boolean;
  locale:Locale;
  candidates:GuidedRevealCandidate[];
  resultPhotoRefs:React.MutableRefObject<Map<string,View>>;
  onFinish:()=>void;
  children:(resultPhotoOpacity:Animated.Value)=>React.ReactNode;
}

const SCATTER_MS=250;
const GATHER_MS=650;
const HOLD_MS=250;
const HANDOFF_MS=500;
const PHOTO_CROSSFADE_MS=160;
const MIN_ANIMATED_STAGE_HEIGHT=340;

interface TargetFrame {x:number;y:number;width:number;height:number}

export function GuidedReveal({revealing,motionAllowed,activeWindow,locale,candidates,resultPhotoRefs,children,onFinish}:GuidedRevealProps){
  const viewport=useViewport();
  const containerRef=useRef<View>(null);
  const [containerWidth,setContainerWidth]=useState<number|null>(null);
  const [containerTop,setContainerTop]=useState(140);
  const [foreground,setForeground]=useState(AppState.currentState==='active'&&(typeof document==='undefined'||!document.hidden));
  const [targetFrames,setTargetFrames]=useState<Record<string,TargetFrame>>({});
  const [measurementKey,setMeasurementKey]=useState<string|null>(null);
  const [locallyComplete,setLocallyComplete]=useState(!revealing);
  const gather=useRef(new Animated.Value(revealing&&motionAllowed?0:1)).current;
  const handoff=useRef(new Animated.Value(revealing&&motionAllowed?0:1)).current;
  const revealOpacity=useRef(new Animated.Value(revealing&&motionAllowed?1:0)).current;
  const sharedOpacity=useRef(new Animated.Value(revealing&&motionAllowed?1:0)).current;
  const resultsOpacity=useRef(new Animated.Value(revealing&&motionAllowed?0:1)).current;
  const resultPhotoOpacity=useRef(new Animated.Value(revealing&&motionAllowed?0:1)).current;
  const animationRef=useRef<Animated.CompositeAnimation|null>(null);
  const measurementGeneration=useRef(0);
  const finishIssuedRef=useRef(!revealing);
  const onFinishRef=useRef(onFinish);
  onFinishRef.current=onFinish;

  const selected=candidates.slice(0,6);
  const selectedKey=selected.map(candidate=>candidate.id).join('|');
  const stageHeight=Math.max(64,Math.floor(viewport.height-Math.max(0,containerTop)));
  const measuredWidth=containerWidth??Math.max(288,viewport.width-36);
  const compact=measuredWidth<440;
  const layout=useMemo(
    ()=>revealLayout(measuredWidth,stageHeight,selected.length),
    [measuredWidth,selected.length,stageHeight],
  );

  useEffect(()=>{
    const update=()=>setForeground(AppState.currentState==='active'&&(typeof document==='undefined'||!document.hidden));
    update();
    const subscription=AppState.addEventListener('change',update);
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',update);
    return ()=>{
      subscription.remove();
      if(typeof document!=='undefined')document.removeEventListener('visibilitychange',update);
    };
  },[]);

  useEffect(()=>{
    if(!revealing||!activeWindow||!foreground)return;
    const generation=++measurementGeneration.current;
    setMeasurementKey(null);
    setTargetFrames({});
    let innerFrame:number|undefined;
    let fallback:ReturnType<typeof setTimeout>|undefined;
    const complete=(frames:Record<string,TargetFrame>)=>{
      if(measurementGeneration.current!==generation)return;
      if(fallback!==undefined)clearTimeout(fallback);
      setTargetFrames(frames);
      setMeasurementKey(selectedKey);
    };
    const outerFrame=requestAnimationFrame(()=>{
      innerFrame=requestAnimationFrame(()=>{
        containerRef.current?.measureInWindow((containerX,y,width)=>{
          if(measurementGeneration.current!==generation)return;
          if(Number.isFinite(y))setContainerTop(current=>Math.abs(current-y)<1?current:y);
          if(Number.isFinite(width)&&width>0)setContainerWidth(current=>current!==null&&Math.abs(current-width)<1?current:width);
          const targets=selected.flatMap(candidate=>{
            const ref=resultPhotoRefs.current.get(candidate.id);
            return ref?[{candidate,ref}]:[];
          });
          if(targets.length===0){complete({});return;}
          const frames:Record<string,TargetFrame>={};
          let pending=targets.length;
          targets.forEach(({candidate,ref})=>ref.measureInWindow((x,targetY,targetWidth,targetHeight)=>{
            if(measurementGeneration.current!==generation)return;
            const visibleTop=Math.max(targetY,Math.max(0,y));
            const visibleBottom=Math.min(targetY+targetHeight,viewport.height);
            const visibleHeight=Math.max(0,visibleBottom-visibleTop);
            const meaningfulVerticalIntersection=visibleHeight>=Math.min(targetHeight,Math.max(56,targetHeight*0.4));
            const fullyVisibleHorizontally=x>=0&&x+targetWidth<=viewport.width;
            if(meaningfulVerticalIntersection&&fullyVisibleHorizontally&&targetWidth>0&&targetHeight>0)frames[candidate.id]={x:x-containerX,y:targetY-y,width:targetWidth,height:targetHeight};
            pending-=1;
            if(pending===0)complete(frames);
          }));
        });
      });
    });
    fallback=setTimeout(()=>{
      if(measurementGeneration.current!==generation)return;
      measurementGeneration.current+=1;
      setTargetFrames({});
      setMeasurementKey(selectedKey);
    },160);
    return ()=>{
      if(measurementGeneration.current===generation)measurementGeneration.current+=1;
      cancelAnimationFrame(outerFrame);
      if(innerFrame!==undefined)cancelAnimationFrame(innerFrame);
      if(fallback!==undefined)clearTimeout(fallback);
    };
  },[activeWindow,containerWidth,foreground,resultPhotoRefs,revealing,selectedKey,viewport.height,viewport.width]);

  useEffect(()=>{
    finishIssuedRef.current=!revealing;
  },[revealing]);

  const issueFinish=()=>{
    if(finishIssuedRef.current)return;
    finishIssuedRef.current=true;
    onFinishRef.current();
  };

  useEffect(()=>{
    animationRef.current?.stop();
    animationRef.current=null;

    if(!revealing){
      setLocallyComplete(true);
      gather.setValue(1);
      handoff.setValue(1);
      revealOpacity.setValue(0);
      sharedOpacity.setValue(0);
      resultsOpacity.setValue(1);
      resultPhotoOpacity.setValue(1);
      return;
    }

    setLocallyComplete(false);
    if(!activeWindow||!foreground)return;
    if(selected.length===0||!motionAllowed||stageHeight<MIN_ANIMATED_STAGE_HEIGHT){
      gather.setValue(1);
      handoff.setValue(1);
      revealOpacity.setValue(0);
      sharedOpacity.setValue(0);
      resultsOpacity.setValue(1);
      resultPhotoOpacity.setValue(1);
      setLocallyComplete(true);
      issueFinish();
      return;
    }

    if(measurementKey!==selectedKey)return;

    gather.setValue(0);
    handoff.setValue(0);
    revealOpacity.setValue(1);
    sharedOpacity.setValue(1);
    resultsOpacity.setValue(0);
    resultPhotoOpacity.setValue(0);
    const animation=Animated.sequence([
      Animated.timing(gather,{toValue:0.16,duration:SCATTER_MS,easing:Easing.out(Easing.quad),useNativeDriver:nativeDriver}),
      Animated.timing(gather,{toValue:1,duration:GATHER_MS,easing:Easing.out(Easing.cubic),useNativeDriver:nativeDriver}),
      Animated.delay(HOLD_MS),
      Animated.parallel([
        Animated.timing(handoff,{toValue:1,duration:HANDOFF_MS-PHOTO_CROSSFADE_MS,easing:Easing.inOut(Easing.cubic),useNativeDriver:nativeDriver}),
        Animated.timing(revealOpacity,{toValue:0,duration:250,easing:Easing.out(Easing.cubic),useNativeDriver:nativeDriver}),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(resultsOpacity,{toValue:1,duration:300,easing:Easing.out(Easing.cubic),useNativeDriver:nativeDriver}),
        ]),
        Animated.sequence([
          Animated.delay(HANDOFF_MS-PHOTO_CROSSFADE_MS),
          Animated.parallel([
            Animated.timing(sharedOpacity,{toValue:0,duration:PHOTO_CROSSFADE_MS,easing:Easing.inOut(Easing.cubic),useNativeDriver:nativeDriver}),
            Animated.timing(resultPhotoOpacity,{toValue:1,duration:PHOTO_CROSSFADE_MS,easing:Easing.inOut(Easing.cubic),useNativeDriver:nativeDriver}),
          ]),
        ]),
      ]),
    ]);
    animationRef.current=animation;
    animation.start(({finished})=>{
      if(!finished)return;
      animationRef.current=null;
      setLocallyComplete(true);
      issueFinish();
    });
    return ()=>{
      animation.stop();
      if(animationRef.current===animation)animationRef.current=null;
    };
  },[activeWindow,foreground,gather,handoff,measurementKey,motionAllowed,resultPhotoOpacity,resultsOpacity,revealOpacity,revealing,selected.length,selectedKey,sharedOpacity,stageHeight]);

  const finishNow=()=>{
    animationRef.current?.stop();
    animationRef.current=null;
    gather.setValue(1);
    handoff.setValue(1);
    revealOpacity.setValue(0);
    sharedOpacity.setValue(0);
    resultsOpacity.setValue(1);
    resultPhotoOpacity.setValue(1);
    setLocallyComplete(true);
    issueFinish();
  };
  const resultsReady=!revealing||locallyComplete;

  return <View
    ref={containerRef}
    collapsable={false}
    onLayout={event=>setContainerWidth(event.nativeEvent.layout.width)}
    style={[styles.container,{minHeight:stageHeight}]}
  >
    <Animated.View
      testID="guided-results-layer"
      accessibilityElementsHidden={!resultsReady}
      importantForAccessibility={resultsReady?'auto':'no-hide-descendants'}
      pointerEvents={resultsReady?'auto':'none'}
      style={{opacity:resultsOpacity}}
    >
      {children(resultPhotoOpacity)}
    </Animated.View>
    {revealing&&!locallyComplete?<Animated.View
      testID="guided-reveal-stage"
      accessibilityElementsHidden={resultsReady}
      importantForAccessibility={resultsReady?'no-hide-descendants':'auto'}
      pointerEvents={resultsReady?'none':'auto'}
      style={[styles.stage,{height:layout.height}]}
    >
      <Animated.View style={[styles.message,compact&&styles.messageCompact,{opacity:revealOpacity}]}>
        <Heading level={1} accessibilityLiveRegion="polite" style={[styles.title,compact&&styles.titleCompact]}>{t(locale,'guidedRevealing')}</Heading>
        {!compact?<Text style={styles.hint}>{t(locale,'guidedRevealHint')}</Text>:null}
        <Pressable accessibilityRole="button" onPress={finishNow} style={({pressed})=>[styles.skip,pressed&&styles.pressed]}>
          <Text style={styles.skipText}>{t(locale,'guidedSkipAnimation')}</Text>
        </Pressable>
      </Animated.View>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        {selected.map((candidate,index)=>{
          const slot=layout.slots[index];
          if(!slot)return null;
          const target=targetFrames[candidate.id];
          const targetTranslateX=target?target.x+target.width/2-(slot.x+layout.cardWidth/2):0;
          const targetTranslateY=target?target.y+target.height/2-(slot.y+layout.cardHeight/2):0;
          const arrivalOpacity=target?sharedOpacity:revealOpacity;
          return <Animated.View key={candidate.id} testID={`guided-reveal-card-${candidate.id}`} style={[
            styles.candidate,
            {
              left:slot.x,
              top:slot.y,
              width:layout.cardWidth,
              height:layout.cardHeight,
              opacity:Animated.multiply(gather.interpolate({inputRange:[0,0.16,1],outputRange:[0.42,1,1]}),arrivalOpacity),
              transform:[
                {translateX:Animated.add(gather.interpolate({inputRange:[0,1],outputRange:[slot.fromX-slot.x,0]}),handoff.interpolate({inputRange:[0,1],outputRange:[0,targetTranslateX]}))},
                {translateY:Animated.add(gather.interpolate({inputRange:[0,1],outputRange:[slot.fromY-slot.y,0]}),handoff.interpolate({inputRange:[0,1],outputRange:[0,targetTranslateY]}))},
                {scaleX:handoff.interpolate({inputRange:[0,1],outputRange:[1,target?target.width/layout.cardWidth:1]})},
                {scaleY:handoff.interpolate({inputRange:[0,1],outputRange:[1,target?target.height/layout.cardHeight:1]})},
              ],
            },
          ]}>
            <PhotoFrame asset={candidate.asset} accent={candidate.accent} locale={locale} height={layout.cardHeight} preserveAspect borderRadius={radii.medium}/>
            {layout.cardHeight>=52?<Animated.View style={[styles.caption,{opacity:handoff.interpolate({inputRange:[0,0.35,1],outputRange:[1,0,0]})}]}><Text numberOfLines={1} style={styles.captionText}>{candidate.name[locale]}</Text></Animated.View>:null}
          </Animated.View>;
        })}
      </View>
    </Animated.View>:null}
  </View>;
}

const styles=StyleSheet.create({
  container:{position:'relative',width:'100%',backgroundColor:colors.background},
  stage:{position:'absolute',left:0,right:0,top:0,overflow:'hidden',borderRadius:radii.large,backgroundColor:'transparent'},
  message:{position:'absolute',zIndex:2,left:16,right:16,top:14,height:118,alignItems:'center',justifyContent:'center'},
  messageCompact:{top:7,height:126},
  title:{color:colors.text,fontFamily:serif,fontSize:34,lineHeight:40,textAlign:'center'},
  titleCompact:{fontSize:27,lineHeight:32},
  hint:{color:colors.secondary,fontSize:14,lineHeight:20,textAlign:'center',marginTop:4},
  skip:{minWidth:96,minHeight:44,alignItems:'center',justifyContent:'center',paddingHorizontal:14,marginTop:4},
  skipText:{color:colors.accent,fontSize:14,fontWeight:'700'},
  candidate:{position:'absolute',zIndex:1,overflow:'hidden',borderRadius:radii.medium,backgroundColor:colors.panel,shadowColor:colors.amber,shadowOpacity:0.12,shadowRadius:18,shadowOffset:{width:0,height:8}},
  caption:{position:'absolute',left:0,right:0,bottom:0,minHeight:24,justifyContent:'center',paddingHorizontal:7,backgroundColor:'rgba(16,23,20,0.78)'},
  captionText:{color:colors.text,fontFamily:serif,fontSize:11,lineHeight:15},
  pressed:{opacity:0.72},
});
