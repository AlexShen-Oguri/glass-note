import {invoke, isTauri} from '@tauri-apps/api/core';
import type {DesktopRuntime} from './desktop-contract';

export const desktopRuntime: DesktopRuntime = {
  isDesktop: isTauri,
  invoke: (command, args) => invoke(command, args),
};
