const { test } = require('node:test');
const assert = require('node:assert/strict');
const christian = require('../functions/christian');
const oscar = require('../functions/oscar');

function call(handler, event) {
  return new Promise((resolve, reject) => handler(event, {}, (error, result) => error ? reject(error) : resolve(result)));
}

test('demo endpoints preserve responses without logging request credentials or bodies', async (t) => {
  const log = t.mock.method(console, 'log', () => {});
  const event = { headers: { authorization: 'Bearer synthetic-private-fixture' }, body: JSON.stringify({ name: 'Fixture' }) };
  assert.deepEqual(await call(christian.handler, event), { statusCode: 200, body: 'hello world' });
  const result = await call(oscar.handler, event);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { title: 'Assistant to the regional manager', name: 'Fixture' });
  assert.equal(log.mock.callCount(), 0);
});

test('Oscar retains the no-body default', async () => {
  assert.equal(JSON.parse((await call(oscar.handler, { body: null })).body).name, 'Oscar');
});

test('Oscar rejects malformed and non-object input without an uncaught exception', async () => {
  for (const body of ['{', 'null', '[]', '"value"']) {
    assert.equal((await call(oscar.handler, { body })).statusCode, 400);
  }
});

test('Unsplash rejects invalid input and reports missing configuration without provider calls', async () => {
  const unsplash = require('../functions/unsplash');
  for (const body of ['{', 'null', '{}', '{"query":42}', '{"query":""}']) {
    assert.equal((await unsplash.handler({ body })).statusCode, 400);
  }
  const saved = process.env.UNSPLASH_API_KEY;
  try {
    delete process.env.UNSPLASH_API_KEY;
    const result = await unsplash.handler({ body: JSON.stringify({ query: 'fixture' }) });
    assert.equal(result.statusCode, 503);
    assert.equal(result.headers['Cache-Control'], 'no-store');
  } finally {
    if (saved === undefined) delete process.env.UNSPLASH_API_KEY;
    else process.env.UNSPLASH_API_KEY = saved;
  }
});

test('Unsplash encodes queries, bounds requests and hides provider errors', async (t) => {
  const fetchPath = require.resolve('node-fetch');
  const handlerPath = require.resolve('../functions/unsplash');
  const originalHandler = require.cache[handlerPath];
  const saved = process.env.UNSPLASH_API_KEY;
  let response = { ok: true, json: async () => ({ results: [{ id: 'fixture' }] }) };
  const request = t.mock.method(require.cache[fetchPath], 'exports', async () => response);
  delete require.cache[handlerPath];
  const handler = require('../functions/unsplash').handler;
  try {
    process.env.UNSPLASH_API_KEY = 'synthetic-test-key';
    const event = { body: JSON.stringify({ query: 'flowers&client_id=other' }) };
    const result = await handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), [{ id: 'fixture' }]);
    const [url, options] = request.mock.calls[0].arguments;
    const target = new URL(url);
    assert.equal(target.origin, 'https://api.unsplash.com');
    assert.deepEqual([...target.searchParams], [['query', 'flowers&client_id=other']]);
    assert.equal(options.redirect, 'error');
    assert.equal(options.timeout, 10000);
    assert.equal(options.headers.Authorization, 'Client-ID synthetic-test-key');
    response = { ok: false };
    assert.equal((await handler(event)).statusCode, 502);
    request.mock.mockImplementation(async () => { throw new Error('synthetic sensitive provider detail'); });
    const failed = await handler(event);
    assert.equal(failed.statusCode, 502);
    assert.equal(failed.body.includes('sensitive'), false);
  } finally {
    if (saved === undefined) delete process.env.UNSPLASH_API_KEY;
    else process.env.UNSPLASH_API_KEY = saved;
    if (originalHandler) require.cache[handlerPath] = originalHandler;
    else delete require.cache[handlerPath];
  }
});
