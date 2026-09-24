import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {processStorageFixture} from './personalStorage.process.fixture';

const worker=fileURLToPath(new URL('./personalStorage.process.worker.ts',import.meta.url));

function run(args:string[]){
  return spawnSync(process.execPath,['--import','tsx',worker,...args],{cwd:process.cwd(),encoding:'utf8',timeout:20_000,windowsHide:true});
}

test('durable journal recovers whole data across real process exits at prepare, data, and commit boundaries',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'glass-notes-recovery-process-'));
  try{
    for(const boundary of ['prepared','middle','committed'] as const){
      const fixture=processStorageFixture(),stateFile=path.join(directory,`${boundary}.json`);
      await writeFile(stateFile,JSON.stringify(fixture.disk),'utf8');
      const interrupted=run(['restore',stateFile,boundary]);
      assert.equal(interrupted.status,91,`${boundary} did not exit at the requested persisted boundary: ${interrupted.stderr}`);
      const recovered=run(['recover',stateFile]);
      assert.equal(recovered.status,0,`${boundary} recovery failed: ${recovered.stderr}`);
      const result=JSON.parse(recovered.stdout) as {state:{phase:string};data:unknown;journal:string|null;generation:string|null};
      assert.equal(result.state.phase,'ready');
      assert.deepEqual(result.data,boundary==='committed'?fixture.after:fixture.before);
      assert.equal(result.journal,null);
      assert.equal(boundary==='committed',result.generation!==null);
    }
  }finally{
    const relative=path.relative(tmpdir(),directory);
    assert(relative.length>0&&!relative.startsWith('..')&&!path.isAbsolute(relative));
    await rm(directory,{recursive:true,force:true});
  }
});
