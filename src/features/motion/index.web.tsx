import React from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import {transitionDuration} from '../../domain/discovery/motion';
import {useMotionEnabled} from './useMotionEnabled';
export {useMotionEnabled} from './useMotionEnabled';

type Props={children:React.ReactNode;changeKey:string|number;kind?:keyof typeof transitionDuration;style?:StyleProp<ViewStyle>;disabled?:boolean};
type Snapshot={layer:HTMLElement;scroll:Array<[HTMLElement,number,number]>};

/** Capture before React mutates the DOM. The inert visual copy has no React state or listeners. */
class Crossfade extends React.Component<Props & {enabled:boolean}, {}, Snapshot|null> {
  private host=React.createRef<View>();
  private layer:HTMLElement|null=null;
  private animation:Animation|null=null;
  private entrance:Animation|null=null;
  private clear=()=>{this.animation?.cancel();this.entrance?.cancel();this.animation=null;this.entrance=null;this.layer?.remove();this.layer=null;};

  getSnapshotBeforeUpdate(previous:Readonly<Props & {enabled:boolean}>):Snapshot|null {
    if(!this.props.enabled||previous.changeKey===this.props.changeKey)return null;
    const host=this.host.current as unknown as HTMLElement|null;
    if(!host?.cloneNode||typeof host.animate!=='function')return null;
    const rect=host.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return null;
    this.clear();
    const layer=host.cloneNode(true) as HTMLElement;
    const originals=[host,...host.querySelectorAll<HTMLElement>('*')];
    const copies=[layer,...layer.querySelectorAll<HTMLElement>('*')];
    const scroll:Snapshot['scroll']=[];
    copies.forEach((node,index)=>{
      node.removeAttribute('id');node.removeAttribute('name');node.removeAttribute('data-testid');
      const original=originals[index];
      if(original&&(original.scrollTop||original.scrollLeft))scroll.push([node,original.scrollTop,original.scrollLeft]);
      // A cloned CSS animation starts at time zero. Freeze the outgoing waterfall at its visible frame.
      if(original&&node.style){
        const computed=getComputedStyle(original);
        if(computed.animationName!=='none'){
          node.style.transform=computed.transform;
          node.style.opacity=computed.opacity;
          node.style.animation='none';
          node.style.transition='none';
        }
      }
    });
    layer.querySelectorAll('script,iframe').forEach(node=>node.remove());
    layer.inert=true;layer.setAttribute('aria-hidden','true');
    layer.querySelectorAll('a,button,input,textarea,select,[tabindex]').forEach(node=>node.setAttribute('tabindex','-1'));
    // One temporary visual plane above page content, below native/modal portals; never intercept input.
    Object.assign(layer.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,maxWidth:'none',maxHeight:'none',margin:'0',overflow:'hidden',pointerEvents:'none',zIndex:'2',transform:'none'});
    return {layer,scroll};
  }

  componentDidUpdate(_previous:Readonly<Props>,_state:{},snapshot:Snapshot|null) {
    if(!this.props.enabled){this.clear();return;}
    if(!snapshot)return;
    this.layer=snapshot.layer;document.body.appendChild(snapshot.layer);
    snapshot.scroll.forEach(([node,top,left])=>{node.scrollTop=top;node.scrollLeft=left;});
    const options:KeyframeAnimationOptions={duration:transitionDuration[this.props.kind??'page'],easing:'cubic-bezier(0.4, 0, 0.2, 1)',fill:'forwards'};
    const animation=snapshot.layer.animate([{opacity:1},{opacity:0}],options);
    const host=this.host.current as unknown as HTMLElement|null;
    this.entrance=host?.animate([{opacity:0},{opacity:1}],options)??null;
    this.animation=animation;
    const done=()=>{if(this.animation===animation)this.clear();};
    if(animation.finished&&typeof animation.finished.then==='function')animation.finished.then(done,()=>{});
    else animation.onfinish=done;
  }
  componentWillUnmount(){this.clear();}
  render(){return <View ref={this.host} style={this.props.style}>{this.props.children}</View>;}
}

export function MotionTransition(props:Props){
  const enabled=useMotionEnabled()&&!props.disabled;
  return <Crossfade {...props} enabled={enabled}/>;
}
