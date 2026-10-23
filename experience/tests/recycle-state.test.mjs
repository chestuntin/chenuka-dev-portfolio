import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyRecycle,parseRecycle,recycleAction} from '../app/recycle-state.ts';
test('delete is recoverable, idempotent, and does not mutate existing state',()=>{
 const s=recycleAction(emptyRecycle,'delete','browser');assert.deepEqual(emptyRecycle,{trashed:[],removed:[]});assert.deepEqual(s,{trashed:['browser'],removed:[]});assert.deepEqual(recycleAction(s,'delete','browser'),s);assert.deepEqual(recycleAction(s,'restore','browser'),emptyRecycle);
});
test('empty bin keeps shortcuts off desktop, and New shortcut can re-create them',()=>{
 let s=recycleAction(emptyRecycle,'delete','spotify');s=recycleAction(s,'empty');assert.deepEqual(s,{trashed:[],removed:['spotify']});assert.deepEqual(recycleAction(s,'restore','spotify'),emptyRecycle);
});
test('storage round trip, malformed input, and untrusted values',()=>{
 const s={trashed:['welcome','browser'],removed:['spotify']};assert.deepEqual(parseRecycle(JSON.stringify(s)),s);assert.deepEqual(parseRecycle('bad json'),emptyRecycle);assert.deepEqual(parseRecycle('{"trashed":["browser","browser","invalid","spotify"],"removed":["spotify"]}'),{trashed:['browser'],removed:['spotify']});
});
