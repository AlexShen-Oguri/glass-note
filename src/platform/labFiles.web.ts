import {desktopRuntime} from './desktopRuntime';
import {createDesktopLabFiles} from './desktopLabFiles';

const desktopFiles = createDesktopLabFiles(desktopRuntime);

export async function saveLabFile(content: string, extension: 'json' | 'md'): Promise<boolean> {
  if (desktopRuntime.isDesktop()) return desktopFiles.save(content, extension);
  const blob = new Blob([content], {type: extension === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `glass-notes-lab-${new Date().toISOString().slice(0,10)}.${extension}`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}
export function readLabFile(): Promise<string | null> {
  if (desktopRuntime.isDesktop()) return desktopFiles.read();
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    let settled=false;let reading=false;let timer:ReturnType<typeof setTimeout>|undefined;
    const clean=()=>{settled=true;input.remove();window.removeEventListener('focus',focus);if(timer)clearTimeout(timer);};
    const done = (value: string | null) => {if(settled)return;clean();resolve(value);};
    const fail=(error:unknown)=>{if(settled)return;clean();reject(error);};
    const focus=()=>{timer=setTimeout(()=>{if(!settled&&!reading&&!input.files?.length)done(null);},1000);};
    input.oncancel = () => done(null);
    input.onchange = async () => {
      reading=true;
      const file = input.files?.[0];
      if (!file) return done(null);
      if (file.size > 5_000_000) {fail(new Error('file-too-large'));return;}
      try {done(await file.text());} catch (error) {fail(error);}
    };
    window.addEventListener('focus',focus);
    input.style.display = 'none'; document.body.appendChild(input); input.click();
  });
}
