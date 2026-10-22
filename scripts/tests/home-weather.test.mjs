import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source = readFileSync(new URL('../../themes/aiovtue/assets/js/home-weather.js', import.meta.url), 'utf8').replaceAll('export function ', 'function ')
const { parseWeather } = new Function(source + ';return {parseWeather}')()
const payload = (code, is_day = 1) => ({ current: { weather_code: code, is_day, temperature_2m: 21.6, time: Math.floor(Date.now()/1000) } })
test('WMO codes select weather scenes and provider day/night', () => {
  for (const [code, scene] of [[0,'clear'],[1,'clear'],[2,'cloud'],[3,'cloud'],[45,'fog'],[48,'fog'],[51,'rain'],[67,'rain'],[82,'rain'],[71,'snow'],[77,'snow'],[86,'snow'],[95,'storm'],[99,'storm']]) assert.equal(parseWeather(payload(code)).scene, scene)
  assert.equal(parseWeather(payload(0, 0)).day, 'night');assert.equal(parseWeather(payload(0)).temperature, '22°C')
})
test('missing, stale and unknown weather never masquerades as sunny', () => {
  for (const bad of [{}, payload(123), payload(null), payload(0, 3), {current:{...payload(0).current,temperature_2m:null}}, {current:{...payload(0).current,time:1}}]) assert.throws(() => parseWeather(bad))
})
function harness({failNetwork=false, hidden=false}={}) {
  const elements=new Map(['status','temperature'].map(k=>[k,{textContent:''}]))
  const attributes=new Map(),timers=new Map(),locations=[];let seq=0,geo,geoCount=0,fetched=0,signal
  const card={querySelector:s=>elements.get(s.match(/weather-(\w+)/)[1]),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)}
  const document=Object.assign(new EventTarget(),{hidden})
  const fetch=async(url,options)=>{fetched++;signal=options.signal;assert.match(url,/latitude=12.35&longitude=45.68/);if(failNetwork)throw Error('offline');return{ok:true,json:async()=>payload(63,0)}}
  const {mountHomeWeather}=new Function('document','navigator','window','fetch','setTimeout','clearTimeout',source+';return {mountHomeWeather}')(
    document,{geolocation:{getCurrentPosition:(success,error)=>{geoCount++;geo={success,error}}}},{isSecureContext:true},fetch,
    (fn,ms)=>{timers.set(++seq,{fn,ms});return seq},id=>timers.delete(id))
  const cleanup=mountHomeWeather(card,p=>locations.push(p))
  const runTimer=ms=>{const entry=[...timers].find(([,t])=>t.ms===ms);assert(entry,`missing timer ${ms}`);timers.delete(entry[0]);entry[1].fn()}
  return {elements,attributes,timers,document,locations,cleanup,runTimer,remount:()=>mountHomeWeather(card,p=>locations.push(p)),get geo(){return geo},get geoCount(){return geoCount},get fetched(){return fetched},get signal(){return signal}}
}
const coords={latitude:12.3456,longitude:45.6789,accuracy:100},refresh=15*60*1000

test('starts with no controls, displays weather and temperature separately, refreshes automatically',async()=>{
  const h=harness();assert.equal(h.geoCount,1);await h.geo.success({coords})
  assert.equal(h.elements.get('status').textContent,'雨');assert.equal(h.elements.get('temperature').textContent,'22°C')
  assert.equal(h.attributes.get('data-weather'),'rain');assert.equal(h.attributes.get('data-weather-day'),'night')
  h.runTimer(refresh);assert.equal(h.geoCount,2);h.cleanup()
})
test('denial displays a quiet fallback, never calls weather, and retains scheduled retry',()=>{
  const h=harness();h.geo.error({code:1});assert.equal(h.fetched,0);assert.equal(h.elements.get('temperature').textContent,'')
  assert.equal(h.elements.get('status').textContent,'定位未授权');h.runTimer(refresh);assert.equal(h.geoCount,2);h.cleanup()
})
test('hidden first load waits, active hidden tabs pause and resume refresh',async()=>{
  const h=harness({hidden:true});assert.equal(h.geoCount,0);h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));assert.equal(h.geoCount,1)
  await h.geo.success({coords});h.document.hidden=true;h.document.dispatchEvent(new Event('visibilitychange'));assert.equal(h.timers.size,0)
  h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));assert.equal(h.timers.size,1);h.cleanup();assert.equal(h.timers.size,0)
})
test('timeout ignores late geolocation but schedules a fresh retry',async()=>{
  const h=harness();const old=h.geo;h.runTimer(25000);await old.success({coords});assert.equal(h.fetched,0)
  h.runTimer(refresh);await h.geo.success({coords});assert.equal(h.fetched,1);h.cleanup()
})
test('network failure automatically retries and still supplies shared location',async()=>{
  const h=harness({failNetwork:true});await h.geo.success({coords});assert.deepEqual(h.locations,[coords]);assert.equal(h.elements.get('status').textContent,'天气暂时不可用')
  assert.equal(h.attributes.has('data-weather'),false);h.runTimer(refresh);assert.equal(h.geoCount,2);h.cleanup()
})
test('cleanup aborts requests and ignores late responses; remount is always enabled',async()=>{
  const h=harness();const pending=h.geo.success({coords});h.cleanup();await pending
  assert.equal(h.signal.aborted,true);assert.equal(h.attributes.has('data-weather'),false);assert.equal(h.timers.size,0)
  const cleanup=h.remount();assert.equal(h.geoCount,2);cleanup()
})
