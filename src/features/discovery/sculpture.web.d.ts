export type GlassScene = 'home' | 'mode' | 'guided' | 'results' | 'recipe' | 'discover';
export interface GlassStage {
  setScene(scene: GlassScene, options?: {duration?: number}): void;
  setPaused(value: boolean): void;
  setReduced(value: boolean): void;
  dispose(): void;
}
/** Original procedural coupe; no remote models or textures. */
export function createGlassStage(container: HTMLElement, options?: {reduced?: boolean; paused?: boolean}): GlassStage;
