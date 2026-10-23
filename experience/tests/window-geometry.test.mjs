import test from 'node:test';
import assert from 'node:assert/strict';
import { edges, fitWindow, resizeWindow } from '../app/window-geometry.ts';
const b = {x:100,y:80,w:600,h:400};
test('each resize edge moves the selected sides and anchors the opposite sides',()=>{
 for(const edge of edges){
  const r=resizeWindow(b,edge,20,30,1200,800);
  assert.equal(r.x,edge.includes('w')?120:100);
  assert.equal(r.y,edge.includes('n')?110:80);
  assert.equal(r.x+r.w,edge.includes('e')?720:700);
  assert.equal(r.y+r.h,edge.includes('s')?510:480);
 }
});
test('all edges respect minimum sizes and the desktop bounds under extreme drags',()=>{
 for(const edge of edges)for(const dx of [-5000,0,5000])for(const dy of [-5000,0,5000]){
  const r=resizeWindow(b,edge,dx,dy,1200,800);
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1200&&r.y+r.h<=800,JSON.stringify({edge,dx,dy,r}));
  assert.ok(r.w>=340&&r.h>=260);
 }
});
test('viewport changes fit oversized and off-screen windows',()=>{
 assert.deepEqual(fitWindow({x:900,y:900,w:880,h:620},375,500),{x:0,y:0,w:375,h:500});
 assert.deepEqual(fitWindow({x:-50,y:-60,w:300,h:200},800,600),{x:0,y:0,w:300,h:200});
});
test('small-screen restore and resize cannot escape the screen or jump in size',()=>{
 const small=fitWindow(b,320,220);
 for(const edge of edges){
  const r=resizeWindow(small,edge,1000,1000,320,220);
  assert.deepEqual(r,small);
 }
 const narrow={x:20,y:20,w:300,h:200};
 assert.deepEqual(resizeWindow(narrow,'se',0,0,340,240),narrow);
 assert.deepEqual(resizeWindow(narrow,'se',1000,1000,340,240),{x:20,y:20,w:320,h:220});
});
