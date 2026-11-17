import {fileURLToPath} from 'node:url';
import {runValidation} from './validation-runner.mjs';
const steps=[['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],['test',['--import','tsx','--test',...['src/domain/search','src/domain/discovery','src/domain/bottles','src/domain/guided','src/domain/context','src/domain/ingredients','src/domain/private-recipes','src/domain/backup','src/domain/making','src/domain/shopping','src/domain/taste','src/domain/order','src/i18n','src/content','src/content/localization','src/platform'].map(path=>`${path}/*.test.ts`),'scripts/*.test.mjs']],['web',['scripts/expo.mjs','export','--platform','web']],['browser',['scripts/browser.mjs','test']]];
const controller = new AbortController();
const interrupt = () => controller.abort();
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
 const report = await runValidation({root: fileURLToPath(new URL('../', import.meta.url)), steps, signal: controller.signal});
 console.log(`Validation: ${report.status}; report: artifacts/validation-latest.json`);
 if (report.error) console.error(report.error);
 process.exitCode = report.passed ? 0 : 1;
} catch (error) {console.error(error.message); process.exitCode = 1;}
finally {process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);}
