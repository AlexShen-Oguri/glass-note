import type {DesktopRuntime} from './desktop-contract';

/** Native builds never load the browser or Tauri runtime. */
export const desktopRuntime: DesktopRuntime = {
  isDesktop: () => false,
  invoke: async () => {
    throw new Error('desktop-runtime-unavailable');
  },
};
