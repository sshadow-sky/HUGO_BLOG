import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLyrics, lyricIndex, createLyricsLoader } from '../themes/aiovtue/assets/js/music-lyrics.js';
import { createMusicApi } from '../themes/aiovtue/assets/js/music-api.js';

test('LRC supports repeated timestamps, fractions, offset and seek backwards', () => {
  const data = parseLyrics('[ar:artist]\n[offset:500]\n[00:03.25][00:08.250]repeated\n[00:01]first\n[00:05.00]\n[99:99]invalid');
  assert.deepEqual(data.lines.map(l => [l.time, l.text]), [[0.5, 'first'], [2.75, 'repeated'], [4.5, ''], [7.75, 'repeated']]);
  assert.equal(lyricIndex(data.lines, 0), -1);
  assert.equal(lyricIndex(data.lines, 8.9), 3);
  assert.equal(lyricIndex(data.lines, 2), 0);
});
test('plain lyrics and empty lyrics are distinct and markup stays text', () => {
  assert.equal(parseLyrics('hello\n<img src=x>').plain, 'hello\n<img src=x>');
  assert.deepEqual(parseLyrics(''), { lines: [], plain: '' });
});
test('lyric API uses lyricId and validates response', async () => {
  let seen;
  const api = createMusicApi({ endpoint: 'https://music.example/api.php', source: 'netease', fetcher: async url => { seen = url; return { ok: true, json: async () => ({ lyric: '[00:01]hello' }) } } });
  assert.equal(await api.resolveLyrics({ id: 'song', lyricId: 'lyrics' }), '[00:01]hello');
  assert.equal(seen.searchParams.get('types'), 'lyric'); assert.equal(seen.searchParams.get('id'), 'lyrics');
});
test('lyrics load only when visible, cancel old song, and ignore stale responses', async () => {
  const pending = [];
  const loader = createLyricsLoader({ api: { resolveLyrics: (track, signal) => new Promise(resolve => pending.push({ track, signal, resolve })) } });
  const a = { id: 'a', source: 'netease' }, b = { id: 'b', source: 'netease' };
  loader.update(a, false); assert.equal(pending.length, 0);
  loader.update(a, true); assert.equal(pending.length, 1);
  loader.update(b, true); assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve('[00:01]B'); await new Promise(r => setTimeout(r, 0));
  pending[0].resolve('[00:01]A'); await new Promise(r => setTimeout(r, 0));
  assert.equal(loader.state.lines[0].text, 'B');
  loader.update(b, false); loader.update(b, true); assert.equal(pending.length, 2);
});
test('lyric failure needs explicit retry and clearing the track resets state', async () => {
  let calls = 0;
  const loader = createLyricsLoader({ api: { resolveLyrics: async () => { calls++; if (calls === 1) throw Error('offline'); return ''; } } });
  const track = { id: 'a', source: 'netease' };
  loader.update(track, true); await new Promise(r => setTimeout(r, 0));
  assert.equal(loader.state.status, 'error'); loader.update(track, true); assert.equal(calls, 1);
  loader.retry(); await new Promise(r => setTimeout(r, 0)); assert.equal(loader.state.status, 'empty');
  loader.update(null, false); assert.equal(loader.state.status, 'idle');
});

test('closing lyrics cancels loading and reopening starts a fresh request', async () => {
  const pending = [];
  const loader = createLyricsLoader({ api: { resolveLyrics: (track, signal) => new Promise(resolve => pending.push({ signal, resolve })) } });
  const track = { id: 'a', source: 'netease' };
  loader.update(track, true); loader.update(track, false);
  assert.equal(pending[0].signal.aborted, true); assert.equal(loader.state.status, 'idle');
  loader.update(track, true); assert.equal(pending.length, 2);
  pending[0].resolve('[00:01]stale'); await new Promise(r => setTimeout(r, 0));
  assert.equal(loader.state.status, 'loading');
  pending[1].resolve('[00:01]fresh'); await new Promise(r => setTimeout(r, 0));
  assert.equal(loader.state.lines[0].text, 'fresh');
});
