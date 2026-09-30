import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initStatistics, cleanupStatistics } from '../themes/aiovtue/assets/js/statistics.js';

function setup({ enabled = '1', host = 'blog.example', endpoint = 'https://cdn.busuanzi.cc/api.php' } = {}) {
  const nodes = ['today_uv', 'today_pv', 'site_uv', 'site_pv'].map(key => ({ id: `busuanzi_${key}`, textContent: 'old' }));
  globalThis.document = {
    referrer: '',
    querySelector: () => ({ content: enabled, dataset: { endpoint } }),
    querySelectorAll: () => nodes,
  };
  globalThis.location = { hostname: host, href: `https://${host}/one/` };
  return nodes;
}

test('disabled, localhost and missing endpoint never send statistics', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; };
  for (const options of [{ enabled: '0' }, { host: 'localhost' }, { host: '127.0.0.1' }, { host: '[::1]' }, { endpoint: '' }]) {
    const nodes = setup(options);
    await initStatistics();
    assert.ok(nodes.every(node => node.textContent === '—'));
  }
  assert.equal(calls, 0);
});

test('only nonnegative safe integer counts are displayed', async () => {
  const nodes = setup();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://cdn.busuanzi.cc/api.php');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { url: location.href, referrer: '' });
    return { ok: true, json: async () => ({ busuanzi_today_uv: 0, busuanzi_today_pv: '12', busuanzi_site_uv: '域名/IP已被禁用', busuanzi_site_pv: -2 }) };
  };
  await initStatistics();
  assert.deepEqual(nodes.map(n => n.textContent), ['0', '12', '—', '—']);
});

test('HTTP, network and malformed data failures keep placeholders', async () => {
  for (const response of [async () => { throw Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => null })]) {
    const nodes = setup(); globalThis.fetch = response;
    await initStatistics();
    assert.ok(nodes.every(n => n.textContent === '—'));
  }
});

test('navigation cancels old request and stale responses cannot overwrite new counts', async () => {
  const nodes = setup(); const requests = [];
  globalThis.fetch = (url, options) => new Promise(resolve => requests.push({ options, resolve }));
  const first = initStatistics();
  location.href = 'https://blog.example/two/';
  const second = initStatistics();
  assert.equal(requests[0].options.signal.aborted, true);
  assert.equal(JSON.parse(requests[1].options.body).url, location.href);
  requests[1].resolve({ ok: true, json: async () => ({ busuanzi_site_pv: 20 }) });
  await second;
  requests[0].resolve({ ok: true, json: async () => ({ busuanzi_site_pv: 10 }) });
  await first;
  assert.equal(nodes[3].textContent, '20');
  cleanupStatistics();
});
