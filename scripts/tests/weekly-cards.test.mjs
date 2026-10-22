import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const code = readFileSync(new URL('../../themes/aiovtue/assets/js/weekly-cards.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replaceAll('export function ', 'function ')
function environment() {
  const cleanups = [], frames = new Map(); let frame = 0
  const fine = Object.assign(new EventTarget(), { matches: true }), reduced = Object.assign(new EventTarget(), { matches: false })
  const root = new EventTarget(); root.contains = c => c?.root === root
  const window = new EventTarget(); window.matchMedia = query => query.includes('reduced') ? reduced : fine
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible', getElementById: () => root })
  const api = new Function('document','window','requestAnimationFrame','cancelAnimationFrame','registerPageCleanup', code+';return {initWeeklyCards,weeklyCardMotion}')(document,window,fn => { frames.set(++frame,fn); return frame },id => frames.delete(id),fn => cleanups.push(fn))
  const card = () => { const styles = new Map(), classes = new Set(); return { root, style: {setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)}, classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}, getBoundingClientRect:()=>({left:10,top:20,width:100,height:80}), styles, classes } }
  const move = (card,type='mouse') => { const e = new Event('pointermove');Object.assign(e,{clientX:100,clientY:30,pointerType:type,buttons:0});Object.defineProperty(e,'target',{value:{closest:()=>card}});root.dispatchEvent(e) }
  const flush = () => {for(const fn of frames.values())fn();frames.clear()}
  return {api,root,fine,reduced,cleanups,card,move,flush,frames,window,document}
}
test('tilt and highlight stay bounded even when pointer leaves the measured rectangle',()=>{
 const {api}=environment();const centered=api.weeklyCardMotion(50,40,100,80);assert.equal(centered.rx,0);assert.equal(centered.ry,0)
 const corner=api.weeklyCardMotion(999,-999,100,80);assert.equal(corner.rx,3);assert.equal(corner.ry,3);assert.equal(corner.x,100);assert.equal(corner.y,0)
})
test('delegated interaction supports newly appended cards and initialization is idempotent',()=>{
 const h=environment();h.api.initWeeklyCards();h.api.initWeeklyCards();assert.equal(h.cleanups.length,1)
 const card=h.card();h.move(card);h.move(card);assert.equal(h.frames.size,1);h.flush();assert(card.classes.has('is-interacting'));assert(card.styles.has('--weekly-rotate-x'))
 const appended=h.card();h.move(appended);h.flush();assert.equal(card.styles.size,0);assert(appended.classes.has('is-interacting'))
})
test('touch and runtime reduced-motion changes never keep a tilted card',()=>{
 const h=environment(),card=h.card();h.api.initWeeklyCards();h.move(card,'touch');h.flush();assert.equal(card.styles.size,0)
 h.move(card);h.flush();h.reduced.matches=true;h.reduced.dispatchEvent(new Event('change'));assert.equal(card.styles.size,0)
 h.move(card);h.flush();assert.equal(card.styles.size,0)
})
test('scroll/leave/PJAX cleanup cancel pending work and release listeners',()=>{
 const h=environment(),card=h.card();h.api.initWeeklyCards();h.move(card);h.flush();h.window.dispatchEvent(new Event('scroll'));assert.equal(card.styles.size,0)
 h.move(card);h.root.dispatchEvent(new Event('pointerleave'));assert.equal(h.frames.size,0)
 h.move(card);h.cleanups[0]();h.flush();assert.equal(card.styles.size,0);h.move(card);assert.equal(h.frames.size,0)
 h.api.initWeeklyCards();h.move(card);h.flush();assert(card.classes.has('is-interacting'))
})
