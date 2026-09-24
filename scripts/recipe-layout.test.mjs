import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = ts.createSourceFile('RecipeScreen.tsx', fs.readFileSync(
  new URL('../src/features/recipe/RecipeScreen.tsx', import.meta.url), 'utf8',
), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const nodes = [];
function visit(node) { nodes.push(node); ts.forEachChild(node, visit); }
visit(source);
const styles = nodes.find(node => ts.isVariableDeclaration(node) && node.name.getText(source) === 'styles').initializer.arguments[0];
const style = name => Object.fromEntries(styles.properties
  .find(node => node.name.getText(source) === name).initializer.properties
  .map(node => [node.name.getText(source), node.initializer.getText(source)]));

// Structural guards complement the real Chromium/WebKit geometry checks.
test('recipe sections divide width on desktop but keep natural height when stacked', () => {
  assert.equal(style('section').flexBasis, '0');
  assert.equal(style('section').flexGrow, '1');
  assert.equal(style('section').flex, undefined, 'avoid a shorthand overriding compact longhands');
  assert.deepEqual(style('sectionCompact'), {flexGrow: '0', flexShrink: '0', flexBasis: "'auto'"});
  assert.equal(style('recipeGridCompact').alignItems, "'stretch'");
  assert.equal(style('recipeGridCompact').flexDirection, "'column'");
});

test('both recipe sections receive the same responsive mode as their grid', () => {
  const sections = nodes.filter(node => ts.isJsxOpeningElement(node) && node.tagName.getText(source) === 'DetailSection');
  assert.equal(sections.length, 2);
  for (const section of sections) {
    const compact = section.attributes.properties.find(node => node.name?.getText(source) === 'compact');
    assert.equal(compact?.initializer?.expression?.getText(source), 'compact');
  }
  const component = nodes.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'DetailSection');
  assert.match(component.getText(source), /styles\.section, compact && styles\.sectionCompact/);
});
