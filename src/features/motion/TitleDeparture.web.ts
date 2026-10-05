import {gsap} from './gsap.web';
import {livePart,type RelayKind} from './choreography.web';
let departure:{canvas:HTMLCanvasElement;tween:gsap.core.Tween}|null=null;
export function settleTitleDeparture(){departure?.tween.kill();departure?.canvas.remove();departure=null;}

/** Preserve outgoing title pixels without moving React-owned DOM or cloning a page. */
export function captureTitleDeparture(kind:RelayKind,direction:1|-1){
  settleTitleDeparture();
  const heading=Array.from(document.querySelectorAll<HTMLElement>('[role="heading"][aria-level="1"]')).find(livePart);
  if(!heading)return;
  const box=heading.getBoundingClientRect();if(!box.width||!box.height)return;
  const canvas=document.createElement('canvas'),density=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.ceil(box.width*density);canvas.height=Math.ceil(box.height*density);
  const context=canvas.getContext('2d');if(!context)return;
  context.scale(density,density);context.textBaseline='alphabetic';
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
  const glyphs:{text:string;x:number;y:number;font:string;color:string;alpha:number}[]=[];
  let text:Node|null;
  while((text=walker.nextNode())){
    const parent=text.parentElement;if(!parent)continue;
    const style=getComputedStyle(parent),font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    let alpha=1,ancestor:HTMLElement|null=parent;
    while(ancestor){alpha*=Number(getComputedStyle(ancestor).opacity);if(ancestor===heading)break;ancestor=ancestor.parentElement;}
    let offset=0;
    for(const character of text.textContent??''){
      const range=document.createRange();range.setStart(text,offset);offset+=character.length;range.setEnd(text,offset);
      const rect=range.getBoundingClientRect();if(!character.trim()||!rect.height)continue;
      context.font=font;const metric=context.measureText(character);
      const ascent=metric.fontBoundingBoxAscent??metric.actualBoundingBoxAscent;
      const descent=metric.fontBoundingBoxDescent??metric.actualBoundingBoxDescent;
      glyphs.push({text:character,x:rect.left-box.left,y:rect.top-box.top+(rect.height+ascent-descent)/2,font,color:style.color,alpha});
    }
  }
  for(const glyph of glyphs){context.font=glyph.font;context.fillStyle=glyph.color;context.globalAlpha=glyph.alpha;context.fillText(glyph.text,glyph.x,glyph.y);}
  Object.assign(canvas.style,{position:'fixed',left:`${box.left}px`,top:`${box.top}px`,width:`${box.width}px`,height:`${box.height}px`,zIndex:'6',pointerEvents:'none',willChange:'transform,opacity'});
  canvas.dataset.motionTitleDeparture='';canvas.setAttribute('aria-hidden','true');document.body.appendChild(canvas);
  const tween=gsap.to(canvas,{y:(kind==='step'?-18:-28)*direction,opacity:0,duration:.24,ease:'power2.in',onComplete:()=>{canvas.remove();if(departure?.canvas===canvas)departure=null;}});
  departure={canvas,tween};
}
