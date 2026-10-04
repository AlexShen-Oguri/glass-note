import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {usePathname} from 'expo-router';
import {useApp} from '../../platform/AppProvider';
import {motionData} from '../motion/attributes';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import {useViewport} from './components';
import type {AmbientLightProps} from './AmbientLight';
import type {GlassScene, GlassStage} from './sculpture.web';

/** One continuous, non-interactive space; route changes never remount the coupe. */
export function AmbientLight({paused, reduceMotion = false}: AmbientLightProps) {
  const host = useRef<View>(null), rig = useRef<View>(null), glass = useRef<View>(null);
  const stage = useRef<GlassStage | null>(null);
  const tween = useRef<gsap.core.Timeline | null>(null);
  const {width, height} = useViewport();
  const pathname = usePathname();
  const {guided} = useApp();
  const compact = width < 760;
  const scene: GlassScene = pathname === '/' ? 'home'
    : pathname.startsWith('/cocktails/') ? 'recipe'
    : pathname === '/customize' ? guided.mode === null ? 'mode' : guided.phase === 'choosing' ? 'guided' : 'results'
    : 'discover';
  const sculptureVisible = scene === 'home' || scene === 'mode' || scene === 'guided';
  const running = useVisibleMotion(host, paused || reduceMotion || !sculptureVisible);
  const latest = useRef({scene, running, reduceMotion});
  latest.current = {scene, running, reduceMotion};

  useEffect(() => {
    let disposed = false;
    // Defer the GPU dependency until after hydration. Native never imports this adapter.
    void import('./sculpture.web').then(({createGlassStage}) => {
      const node = element(glass);
      if (disposed || !node) return;
      const current = latest.current;
      stage.current = createGlassStage(node, {paused:!current.running, reduced:current.reduceMotion});
      stage.current.setScene(current.scene, {duration:0});
    }).catch(() => {
      // The orbital composition remains usable if WebGL/module loading is unavailable.
      const node = element(glass);
      if (node) node.dataset.glassError = 'unavailable';
    });
    return () => {disposed = true; stage.current?.dispose(); stage.current = null;};
  }, []);

  useEffect(() => {
    stage.current?.setReduced(reduceMotion);
    stage.current?.setPaused(!running);
    stage.current?.setScene(scene, {duration:running ? .86 : 0});
  }, [scene, running, reduceMotion]);

  useGSAP(() => {
    const node = element(rig), cup = element(glass);
    if (!node || !cup) return;
    const w = compact ? 380 : 640, h = compact ? 440 : 700;
    const centerX = scene === 'home' ? width * (compact ? .54 : .75)
      : scene === 'mode' ? width * (compact ? .50 : .79)
      : scene === 'guided' ? width * (compact ? .97 : .81) : width * .86;
    const centerY = compact ? scene === 'home' ? 490 : scene === 'mode' ? 460 : height * .45
      : height * (scene === 'home' ? .50 : .49);
    const scale = compact ? 1 : Math.min(1.08, Math.max(.78, height / 820));
    const alpha = sculptureVisible ? scene === 'guided' ? compact ? .16 : .63 : 1 : .24;
    tween.current?.kill();
    const timeline = gsap.timeline({defaults:{duration:paused || reduceMotion ? 0 : .85, ease:'power3.inOut'}});
    tween.current = timeline;
    timeline.to(node, {x:centerX-w/2, y:centerY-h/2, scale, opacity:alpha}, 0)
      .to(cup, {opacity:sculptureVisible ? 1 : 0}, 0);
    return () => {timeline.kill();};
  }, {scope:host, dependencies:[scene, width, height, compact, sculptureVisible, paused, reduceMotion]});

  useEffect(() => {
    if (paused || reduceMotion) tween.current?.progress(1);
  }, [paused, reduceMotion]);

  return <View ref={host} {...motionData({motionLoop:'night-space', nightScene:scene})}
    pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.root}>
    <View style={styles.light} />
    <View ref={rig} style={[styles.rig, compact && styles.compactRig]}>
      <View style={[styles.portal, compact && styles.compactPortal]}>
        <View style={styles.inner} /><View style={styles.orbit} /><View style={styles.secondOrbit} />
      </View>
      <View ref={glass} style={styles.glass} />
    </View>
  </View>;
}
export default AmbientLight;

const styles = StyleSheet.create({
  root:{position:'absolute',top:0,right:0,bottom:0,left:0,overflow:'hidden',zIndex:0} as never,
  light:{position:'absolute',right:'-15%',top:'-5%',width:'85%',height:'100%',backgroundImage:'radial-gradient(ellipse at center,rgba(181,198,169,.12),transparent 68%)'} as never,
  rig:{position:'absolute',left:0,top:0,width:640,height:700,opacity:0},
  compactRig:{width:380,height:440},
  portal:{position:'absolute',left:65,top:100,width:510,height:510,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.3)',backgroundImage:'radial-gradient(circle at 30% 20%,rgba(174,194,159,.15),rgba(68,88,65,.1) 45%,rgba(10,17,12,.35) 78%)'} as never,
  compactPortal:{left:45,top:75,width:290,height:290},
  inner:{position:'absolute',top:14,left:14,right:14,bottom:14,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.075)'},
  orbit:{position:'absolute',top:-31,left:-31,right:-31,bottom:-31,borderRadius:999,borderWidth:1,borderColor:'rgba(212,173,115,.13)',transform:[{rotate:'-17deg'},{scaleY:.87}]},
  secondOrbit:{position:'absolute',top:-54,left:-54,right:-54,bottom:-54,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.065)',transform:[{rotate:'22deg'},{scaleX:.93}]},
  glass:{position:'absolute',top:0,left:0,right:0,bottom:0},
});
