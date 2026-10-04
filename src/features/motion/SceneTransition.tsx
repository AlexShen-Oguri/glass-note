import React from 'react';
export type SceneOptions={label?:string;direction?:1|-1;history?:boolean;automatic?:boolean;kind?:'page'|'step'|'results'|'photo'|'back'|'intro'|'replay'|'filter'};
export function SceneTransitionProvider({children}:{children:React.ReactNode}){return <>{children}</>;}
export function useSceneTransition(){return {run:(commit:()=>void,_options?:SceneOptions)=>commit()};}
