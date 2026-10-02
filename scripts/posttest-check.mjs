import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { passedPosttest, posttestOutcome } from '../src/game/posttestOutcome.js'

// Bundle the actual reducer: JSX and Vite's import.meta.env are the only
// transformations needed to exercise game state in Node without a browser.
const result = await build({
  entryPoints: ['src/game/GameContext.jsx'], bundle: true, write: false,
  platform: 'node', format: 'esm', define: { 'import.meta.env': '{}' },
})
const { reducer, initialState } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
const fresh = () => ({ ...initialState, screen: 'room', running: true, timeLeft: 30, timedOut: false, progress: Object.fromEntries(Object.keys(initialState.progress).map(id=>[id,'available'])) })
assert.equal(passedPosttest([true, true, true], 3), true)
assert.equal(passedPosttest([true, false, true], 3), false)
assert.equal(passedPosttest([true], 3), false)

let state = fresh()
for (const id of Object.keys(state.progress)) state = reducer(state, { type: 'COMPLETE_NODE', id })
assert.equal(state.screen, 'posttest')
assert.equal(state.running, true)
assert.equal(state.timedOut, false)
assert.equal(state.postDecision, true)
assert.deepEqual(posttestOutcome({...state, passed: true}), { outcome: 'win' })
assert.deepEqual(posttestOutcome({...state, passed: false}), { outcome: 'retry' })
// Starting/retrying never replenishes time.
state = reducer(reducer(state, { type: 'TICK' }), { type: 'START_POSTTEST_DECISION' })
assert.equal(state.timeLeft,29)
assert.equal(reducer(state,{type:'FINISH',outcome:'win'}).screen,'win')
assert.equal(reducer(state,{type:'FINISH',outcome:'lose',reason:'choseBuy'}).loseReason,'choseBuy')

const expired = reducer({...state,timeLeft:1},{type:'TICK'})
assert.equal(expired.screen,'lose')
assert.equal(expired.loseReason,'timeUp')
assert.equal(reducer(expired,{type:'FINISH',outcome:'win'}),expired)
assert.equal(reducer(expired,{type:'START_POSTTEST_DECISION'}),expired)

const late = reducer({...fresh(),timeLeft:1},{type:'TICK'})
assert.equal(late.screen,'posttest')
assert.equal(late.timedOut,true)
assert.equal(late.running,false)
assert.equal(reducer(late,{type:'START_POSTTEST_DECISION'}).running,false)
assert.equal(reducer(late,{type:'TICK'}),late)
assert.equal(reducer(late,{type:'GO_MAP'}),late)
assert.equal(reducer(late,{type:'OPEN_NODE',id:Object.keys(late.progress)[0]}),late)
assert.equal(reducer(late,{type:'COMPLETE_NODE',id:Object.keys(late.progress)[0]}),late)
for (const passed of [true,false]) {
  const result = posttestOutcome({...late,passed})
  assert.equal(result.outcome,'lose')
  assert.equal(result.reason,passed?'notEnoughEvidenceConvincing':'notEnoughEvidenceUnconvincing')
  assert.equal(reducer(late,{type:'FINISH',...result}).loseReason,result.reason)
}
// Debug shortcuts must set the entire scenario and reset local assessment state.
const debugBuild = await build({
  entryPoints: ['src/game/GameContext.jsx'], bundle: true, write: false,
  platform: 'node', format: 'esm', define: { 'import.meta.env': '{"VITE_DEBUG":"true"}' },
})
const debugUrl = 'data:text/javascript;base64,' + Buffer.from(debugBuild.outputFiles[0].text).toString('base64')
const debug = await import(debugUrl)
let preview = debug.reducer({...debug.initialState, loseReason: 'choseBuy', activeNodeId: 'algorithm-room'}, {
  type: 'GOTO_SCREEN', screen: 'posttest', scenario: 'inTime',
})
assert.equal(preview.timeLeft, 300)
assert.equal(preview.running, true)
assert.equal(preview.timedOut, false)
assert.ok(Object.values(preview.progress).every(status => status === 'done'))
assert.equal(preview.loseReason, null)
assert.equal(preview.activeNodeId, null)
const firstSession = preview.posttestSession
preview = debug.reducer(preview, {type: 'GOTO_SCREEN', screen: 'posttest', scenario: 'timeout'})
assert.equal(preview.timeLeft, 0)
assert.equal(preview.running, false)
assert.equal(preview.timedOut, true)
assert.ok(Object.values(preview.progress).some(status => status !== 'done'))
assert.equal(preview.posttestSession, firstSession + 1)
preview = debug.reducer(preview, {type: 'GOTO_SCREEN', screen: 'posttest', scenario: 'inTime'})
assert.equal(preview.timedOut, false)
assert.equal(preview.timeLeft, 300)
assert.equal(preview.posttestSession, firstSession + 2)
for (const scenario of ['inTime', 'timeout']) {
  globalThis.window = { location: { search: '?screen=posttest&scenario=' + scenario } }
  const entry = await import(debugUrl + '#' + scenario)
  const timedOut = scenario === 'timeout'
  assert.equal(entry.initialState.screen, 'posttest')
  assert.equal(entry.initialState.timedOut, timedOut)
  assert.equal(entry.initialState.timeLeft, timedOut ? 0 : 300)
  assert.equal(entry.initialState.running, !timedOut)
  const reset = entry.reducer({...entry.initialState, screen: 'lose'}, {type: 'RESET'})
  assert.deepEqual(reset.progress, entry.initialState.progress)
  assert.equal(reset.timedOut, timedOut)
}
delete globalThis.window
console.log('Post-test checks passed: assessment, both entry routes, retries, timeout, late-event guards and debug scenarios.')
