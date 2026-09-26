// Uses the TypeScript compiler bundled with the audited SDK; no downloaded dependencies.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sdk = process.env.VIETIME_STUDIO || 'C:/Program Files/Huawei/DevEco Studio';
const ts = require(path.join(sdk, 'sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript'));
const out = path.join(root, '.test-build');
fs.mkdirSync(out, { recursive: true });
for (const folder of ['engine', 'ime', 'settings']) {
const source = path.join(root, 'entry/src/main/ets', folder);
fs.mkdirSync(path.join(out, folder), { recursive: true });
for (const name of fs.readdirSync(source).filter(n => n.endsWith('.ts'))) {
  const text = fs.readFileSync(path.join(source, name), 'utf8');
  const result = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });
  fs.writeFileSync(path.join(out, folder, name.replace(/\.ts$/, '.js')), result.outputText);
}
}
const engineResults = require('../tests/engine.test.cjs');
const sessionResults = require('../tests/session.test.cjs');
fs.writeFileSync(path.join(root, 'docs/test-results.json'), JSON.stringify({
  checked: new Date().toISOString(), engine: engineResults, session: sessionResults,
  total: engineResults.tests + sessionResults.tests,
  failed: engineResults.failed + sessionResults.failed,
  scope: 'Host unit tests, not HarmonyOS device or app compatibility tests'
}, null, 2) + '\n');
