import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = name => readFileSync(new URL(`../../themes/aiovtue/assets/js/${name}.js`, import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replaceAll('export function ', 'function ').replaceAll('export const ', 'const ')
const { distanceKm, visitorPlace, welcomeCopy, greeting, mountHomeWelcome } = new Function(read('home-welcome-data') + read('home-welcome') + ';return {distanceKm,visitorPlace,welcomeCopy,greeting,mountHomeWelcome}')()
test('distance uses Wuhan reference and gives finite antipodal results', () => {
  assert.equal(distanceKm(30.58,114.27,30.58,114.27),0)
  assert(distanceKm(30.58,114.27,39.90,116.41)>1000)
  assert(distanceKm(30.58,114.27,39.90,116.41)<1100)
  assert(Number.isFinite(distanceKm(0,0,0,180)))
})
test('mounted welcome changes with the hour and stops rendering after cleanup', () => {
  const fields=new Map(),card={querySelector(selector){if(!fields.has(selector))fields.set(selector,{textContent:''});return fields.get(selector)}}
  const welcome=mountHomeWelcome(card)
  welcome.updateLocation({latitude:30.66,longitude:104.07})
  welcome.updateTime(new Date(2026,9,7,8));assert.match(fields.get('[data-welcome-copy]').textContent,/早上好.*成都/)
  welcome.updateTime(new Date(2026,9,7,12));assert.match(fields.get('[data-welcome-copy]').textContent,/中午好/)
  assert.match(fields.get('[data-welcome-distance]').textContent,/距武汉约/)
  const last=fields.get('[data-welcome-copy]').textContent;welcome.cleanup();welcome.updateTime(new Date(2026,9,7,23));assert.equal(fields.get('[data-welcome-copy]').textContent,last)
})
test('local city matching is nearby-only and refuses invalid or coarse positions', () => {
  assert.equal(visitorPlace({latitude:30.58,longitude:114.27,accuracy:100}).city.name,'武汉')
  assert.equal(visitorPlace({latitude:30.66,longitude:104.07,accuracy:100}).city.name,'成都')
  assert.equal(visitorPlace({latitude:0,longitude:0,accuracy:100}).city,null)
  for(const p of [null,{latitude:NaN,longitude:10},{latitude:91,longitude:0},{latitude:30,longitude:114,accuracy:60000}])assert.equal(visitorPlace(p),null)
})
test('greetings and food copy handle same-city, known city and unknown place', () => {
  assert.equal(greeting(8),'早上好');assert.equal(greeting(23),'夜深了')
  const wuhan=visitorPlace({latitude:30.58,longitude:114.27})
  assert.match(welcomeCopy(wuhan,8),/热干面/)
  const chengdu=visitorPlace({latitude:30.66,longitude:104.07})
  assert.match(welcomeCopy(chengdu,8),/早上好.*成都/)
  assert.match(welcomeCopy(chengdu,12),/中午好/)
  assert.match(welcomeCopy(chengdu,15),/下午好/)
  assert.match(welcomeCopy(chengdu,20),/晚上好/)
  assert.match(welcomeCopy(chengdu,23),/夜深了/)
  assert.notEqual(welcomeCopy(chengdu,8),welcomeCopy(chengdu,23))
  assert.doesNotMatch(welcomeCopy(null,0),/undefined|NaN/)
})
