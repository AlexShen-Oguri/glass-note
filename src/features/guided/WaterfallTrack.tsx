import type React from 'react';
export interface WaterfallTrackProps {
  children: React.ReactNode;
  columnIndex: number;
  distance: number;
  paused: boolean;
  reduceMotion: boolean;
}

export * from './WaterfallTrack.web';
