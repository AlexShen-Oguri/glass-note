/** Give input time between costly JS renders and deferred GPU/paint work. */
export function createGlassFrameBudget(pixelRatio) {
  const floor=Math.min(.5,pixelRatio);
  let ratio=pixelRatio,slowFrames=0,slowPaints=0,nextFrameAt=0;
  return {
    get pixelRatio(){return ratio;},
    canRender(time){return time>=nextFrameAt;},
    // Observe only the first rAF after an actual draw. Cheap frames deliberately
    // left for input must neither reset this streak nor count as slow renders.
    recordPaintInterval(duration,observedAt){
      slowPaints=duration>100?slowPaints+1:0;
      if(slowPaints===2){ratio=Math.max(floor,ratio*.5);slowPaints=0;}
      if(duration>100)nextFrameAt=Math.max(nextFrameAt,observedAt+100);
      return ratio;
    },
    recordRender(duration,finishedAt){
      // Ignore an isolated compile/GC spike; two expensive renders establish a
      // sustained problem. DPR 1 displays must also be able to downsample.
      slowFrames=duration>40?slowFrames+1:0;
      if(slowFrames===2){ratio=Math.max(floor,ratio*.5);slowFrames=0;}
      // rAF alone can continuously monopolize the main thread on SwiftShader.
      // Leave several cheap frames for controls even at the resolution floor.
      nextFrameAt=finishedAt+(duration>40?Math.min(100,duration):0);
      return ratio;
    },
  };
}
