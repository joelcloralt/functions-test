const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const script = readFileSync(require.resolve('../public/app.js'), 'utf8');

function setup(fetch) {
  let submit;
  const button = { disabled: false };
  const result = { textContent: '' };
  const form = { querySelector: () => button, addEventListener: (_, handler) => { submit = handler; } };
  const document = { getElementById: id => ({ greeting: form, result, name: { value: '<img src=x onerror=alert(1)>' } })[id] };
  runInNewContext(script, { document, fetch });
  return { button, result, submit: () => submit({ preventDefault() {} }) };
}

test('greeting sends only the name and renders returned content as text', async () => {
  let request;
  const ui = setup(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ title: 'Fixture', name: '<img src=x onerror=alert(1)>' }) };
  });
  await ui.submit();
  assert.equal(request.url, '/.netlify/functions/oscar');
  assert.deepEqual(JSON.parse(request.options.body), { name: '<img src=x onerror=alert(1)>' });
  assert.equal(ui.result.textContent, 'Fixture: <img src=x onerror=alert(1)>');
  assert.equal(ui.button.disabled, false);
});

test('HTTP, network and malformed responses allow retry without exposing error details', async () => {
  for (const fail of [
    async () => ({ ok: false }),
    async () => { throw new Error('private network detail'); },
    async () => ({ ok: true, json: async () => { throw new Error('private malformed detail'); } }),
  ]) {
    let failed = true;
    const ui = setup(async (...args) => failed ? fail(...args) : ({ ok: true, json: async () => ({ title: 'Fixture', name: 'Retry' }) }));
    await ui.submit();
    assert.equal(ui.button.disabled, false);
    assert.equal(ui.result.textContent, 'Could not load the greeting. Please try again.');
    failed = false;
    await ui.submit();
    assert.equal(ui.result.textContent, 'Fixture: Retry');
  }
});
