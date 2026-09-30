import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMusicApi } from '../themes/aiovtue/assets/js/music-api.js';
import { createMusicController } from '../themes/aiovtue/assets/js/music-controller.js';

const track = id => ({ id, playId: id, title: `Song ${id}`, artist: 'Artist', source: 'netease', picId: '' });
class AudioStub extends EventTarget {
  paused = true; currentTime = 0; duration = 120; volume = 0.7; src = ''; calls = 0;
  async play() { this.calls++; this.paused = false; this.dispatchEvent(new Event('playing')); }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  load() {}
  removeAttribute() { this.src = ''; }
}
function make(options = {}) {
  const audio = new AudioStub();
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const api = { search: async () => [], resolveUrl: async t => `https://audio.example/${t.id}.mp3` };
  return { audio, storage, controller: createMusicController({ audio, storage, api, source: 'netease', ...options }) };
}

test('API encodes queries, validates results and never falls back from empty config', async () => {
  let calls = 0;
  const fetcher = async url => { calls++; assert.equal(url.searchParams.get('name'), 'a & b'); return { ok: true, json: async () => [{ id: 1, name: '<Song>', artist: ['A', 'B'], pic_id: 'pic' }, {}] }; };
  const api = createMusicApi({ endpoint: 'https://music.example/api.php', source: 'netease', fetcher });
  const results = await api.search('a & b');
  assert.equal(results.length, 1); assert.equal(results[0].title, '<Song>'); assert.equal(results[0].artist, 'A / B');
  await assert.rejects(createMusicApi({ endpoint: '', source: 'netease', fetcher }).search('test'), /尚未配置/);
  assert.equal(calls, 1);
});

test('API rejects malformed search and unsafe media URLs', async () => {
  const api = createMusicApi({ endpoint: 'https://music.example/api.php', source: 'netease', fetcher: async () => ({ ok: true, json: async () => ({ url: 'javascript:alert(1)' }) }) });
  await assert.rejects(api.search('song'), /格式/);
  await assert.rejects(api.resolveUrl(track('a')), /播放地址/);
});

test('network failures have an actionable message', async () => {
  const api = createMusicApi({ endpoint: 'https://music.example/api.php', source: 'netease', fetcher: async () => { throw new TypeError('Failed to fetch') } });
  await assert.rejects(api.search('song'), /无法连接音乐服务/);
});

test('empty initialization sends no request and queues deduplicate', async () => {
  let calls = 0;
  const { controller, audio } = make({ api: { search: async () => { calls++; }, resolveUrl: async () => { calls++; } } });
  assert.equal(calls, 0); assert.equal(audio.calls, 0);
  controller.add(track('a')); controller.add(track('a')); controller.add(track('b'));
  assert.equal(controller.state.queue.length, 2);
  controller.remove('netease:a'); assert.equal(controller.state.queue.length, 1);
  controller.clear(); assert.equal(controller.state.queue.length, 0);
});

test('restore metadata and settings, never restore URL or autoplay', async () => {
  const { controller, storage } = make();
  controller.add(track('a')); controller.setVolume(0.3); controller.setMode('shuffle'); await controller.play('netease:a');
  const restored = make({ storage });
  assert.equal(restored.controller.state.queue.length, 1); assert.equal(restored.audio.calls, 0); assert.equal(restored.audio.src, '');
  assert.equal(restored.audio.volume, 0.3); assert.equal(restored.controller.state.mode, 'shuffle');
  assert.ok(!storage.getItem('shadowsky-music-v1').includes('audio.example'));
});

test('late search response cannot overwrite newer query; clearing cancels', async () => {
  const pending = [];
  const { controller } = make({ api: { search: (q, signal) => new Promise(resolve => pending.push({ q, signal, resolve })) } });
  const first = controller.search('one'); const second = controller.search('two');
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve([track('b')]); await second;
  pending[0].resolve([track('a')]); await first;
  assert.equal(controller.state.results[0].id, 'b');
  await controller.search(''); assert.equal(controller.state.results.length, 0);
});

test('switching tracks pauses previous audio and ignores stale URL responses', async () => {
  const pending = [];
  const { controller, audio } = make({ api: { resolveUrl: (t, signal) => new Promise(resolve => pending.push({ t, signal, resolve })) } });
  controller.add(track('a')); controller.add(track('b'));
  const first = controller.play('netease:a'); const second = controller.play('netease:b');
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve('https://audio.example/b.mp3'); await second;
  pending[0].resolve('https://audio.example/a.mp3'); await first;
  assert.equal(audio.src, 'https://audio.example/b.mp3'); assert.equal(audio.calls, 1);
  controller.clear(); assert.equal(audio.paused, true); assert.equal(audio.src, '');
});

test('play failure stops without retry loop and allows explicit retry', async () => {
  let calls = 0;
  const { controller } = make({ api: { resolveUrl: async () => { calls++; throw Error('No source'); } } });
  controller.add(track('a')); controller.add(track('b')); await controller.play('netease:a');
  assert.equal(calls, 1); assert.equal(controller.state.buffering, false); assert.ok(controller.state.error);
  await controller.toggle(); assert.equal(calls, 2);
});

test('ending in order stops at end; loop mode resolves a fresh URL', async () => {
  const { controller, audio } = make(); controller.add(track('a')); await controller.play('netease:a');
  audio.dispatchEvent(new Event('ended')); assert.equal(controller.state.playing, false);
  controller.setMode('single'); audio.dispatchEvent(new Event('ended'));
  await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(audio.calls, 2);
  controller.clear();
});

test('manual shuffle and automatic shuffle choose a different track; single mode allows manual navigation', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const { controller, audio } = make();
  ['a', 'b', 'c'].forEach(id => controller.add(track(id)));
  controller.setMode('shuffle'); await controller.play('netease:a');
  controller.step(1);
  assert.equal(controller.state.currentKey, 'netease:c');
  await new Promise(resolve => setTimeout(resolve, 0));
  audio.dispatchEvent(new Event('ended'));
  assert.equal(controller.state.currentKey, 'netease:b');
  await new Promise(resolve => setTimeout(resolve, 0));
  controller.step(-1);
  assert.equal(controller.state.currentKey, 'netease:a');
  await new Promise(resolve => setTimeout(resolve, 0));
  controller.setMode('single'); controller.step(1);
  assert.equal(controller.state.currentKey, 'netease:b');
  controller.clear();
});

test('clear during URL resolution cancels playback and malformed storage is ignored', async () => {
  let resolve;
  const { controller, audio } = make({ storage: { getItem: () => '{invalid', setItem() { throw Error('blocked') } }, api: { resolveUrl: () => new Promise(done => { resolve = done }) } });
  controller.add(track('a')); const pending = controller.play('netease:a'); controller.clear();
  resolve('https://audio.example/late.mp3'); await pending;
  assert.equal(audio.calls, 0); assert.equal(controller.state.queue.length, 0);
});

test('browser playback rejection is recoverable without automatic retry', async () => {
  const { controller, audio } = make();
  audio.play = async () => { throw new DOMException('blocked', 'NotAllowedError') };
  controller.add(track('a')); await controller.play('netease:a');
  assert.match(controller.state.error, /再次点击播放/); assert.equal(controller.state.buffering, false);
  audio.play = AudioStub.prototype.play; await controller.toggle(); assert.equal(controller.state.playing, true);
  controller.clear();
});
