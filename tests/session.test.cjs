const assert = require('node:assert/strict');
const { CompositionSession } = require('../.test-build/ime/CompositionSession.js');
const { ShortcutTracker, ShiftTapTracker } = require('../.test-build/ime/ShortcutTracker.js');
const { InputMode } = require('../.test-build/engine/VietnameseInputEngine.js');
class Editor {
  constructor(prefix='') { this.text=prefix; this.start=prefix.length; this.end=this.start; this.calls=[]; this.pos=this.start; this.active=false; this.reject=false; }
  preview(text) {
    this.calls.push(['preview', text]);
    if(this.reject) throw Error('12800011');
    if(!this.active) { this.start=this.pos; this.end=this.pos; this.active=true; }
    this.text=this.text.slice(0,this.start)+text+this.text.slice(this.end);
    this.end=this.start+text.length; this.pos=this.end;
  }
  finishPreview() { this.calls.push(['finish']); this.active=false; this.start=this.pos; this.end=this.pos; }
  insert(text) { this.calls.push(['insert',text]); this.text=this.text.slice(0,this.pos)+text+this.text.slice(this.pos); this.pos+=text.length; }
  cursor() { if(this.noCursor) throw Error('801'); if(this.lag) { const r=this.lagged ?? this.pos; this.lagged=this.pos; return r; } return this.pos; }
  deleteBefore(n) { this.calls.push(['delete',n]); this.text=this.text.slice(0,this.pos-n)+this.text.slice(this.pos); this.pos-=n; }
}
let tests=0, failures=0;
function check(name, fn) { tests++; try { fn(); } catch(e) { failures++; console.error(name,e.message); } }
function setup(prefix='', support=true, bypass=false) { const s=new CompositionSession(), e=new Editor(prefix); s.attach(e,support,bypass); return [s,e]; }
check('pre-edit does not overwrite prefix',()=>{ const [s,e]=setup('prefix '); for(const c of 'tieengs') assert.equal(s.process(c),true); assert.equal(e.text,'prefix tiếng'); s.process(' '); assert.equal(e.text,'prefix tiếng '); assert.equal(e.active,false); });
check('commit does not duplicate',()=>{ const [s,e]=setup(); for(const c of 'Vieetj')s.process(c); s.commit(); assert.equal(e.text,'Việt'); assert.equal(e.calls.filter(c=>c[0]==='insert').length,0); });
check('invalid restore at boundary',()=>{ const [s,e]=setup(); for(const c of 'javascript ')s.process(c); assert.equal(e.text,'javascript '); });
check('backspace within pre-edit',()=>{ const [s,e]=setup('old '); for(const c of 'as')s.process(c); assert.equal(s.process('Backspace'),true); assert.equal(e.text,'old '); assert.equal(s.process('Backspace'),false); });
check('committed backspace passes through',()=>{const [s,e]=setup(); for(const c of 'as ')s.process(c); assert.equal(s.process('Backspace'),false); assert.equal(e.text,'á ');});
check('detached session writes nothing',()=>{const [s,e]=setup(); s.detach(); assert.equal(s.process('a'),false); assert.equal(e.calls.length,0);});
check('new focus never receives old token',()=>{const [s,e]=setup(); for(const c of 'as')s.process(c); const next=new Editor('next '); s.attach(next,true,false); s.process('b'); assert.equal(e.text,'á'); assert.equal(next.text,'next b');});
check('password bypass creates no engine state',()=>{const [s,e]=setup('',true,true); for(const c of 'Secret123')assert.equal(s.process(c),false); assert.equal(s.engine.getRaw(),''); assert.equal(e.calls.length,0);});
check('unsupported editor passes through without fallback',()=>{const [s,e]=setup('',false); s.setDirectFallback(false); assert.equal(s.process('a'),false); assert.equal(e.calls.length,0);});
check('English physical pass through',()=>{const [s,e]=setup(); s.setMode(InputMode.English); assert.equal(s.process('a'),false); assert.equal(e.calls.length,0);});
check('mode toggle commits composition',()=>{const [s,e]=setup(); for(const c of 'as')s.process(c); s.setMode(InputMode.English); assert.equal(e.text,'á'); assert.equal(e.active,false);});
check('Escape restores raw',()=>{const [s,e]=setup(); for(const c of 'as')s.process(c); s.process('Escape'); assert.equal(e.text,'as'); assert.equal(e.active,false);});
check('selection movement never replaces chosen text',()=>{const [s,e]=setup('old '); for(const c of 'as')s.process(c); const previews=e.calls.filter(c=>c[0]==='preview').length; e.pos=0; s.selectionChanged(0,3); assert.equal(s.hasPreview(),false); assert.equal(e.calls.filter(c=>c[0]==='preview').length,previews); assert.equal(e.text,'old á');});
check('self-induced selection keeps composition',()=>{const [s,e]=setup(); s.process('a'); s.selectionChanged(e.pos,e.pos); assert.equal(s.hasPreview(),true);});
check('cursor movement before key finalizes old preview',()=>{const [s,e]=setup('old '); s.process('a'); e.pos=0; s.process('b'); assert.equal(e.text,'bold a');});
check('preview failure disables session without retry',()=>{const [s,e]=setup(); e.reject=true; assert.throws(()=>s.process('a')); assert.equal(s.isFailed(),true); assert.equal(s.process('s'),false); assert.equal(e.calls.length,1);});
check('attach resets failure',()=>{const [s,e]=setup(); e.reject=true; assert.throws(()=>s.process('a')); const next=new Editor(); s.attach(next,true,false); assert.equal(s.process('a'),true);});
check('setting bypass commits then passes through',()=>{const [s,e]=setup(); s.process('a'); s.setBypass(true); assert.equal(e.active,false); assert.equal(s.process('s'),false);});
check('editor capability changes within session',()=>{const [s,e]=setup(); s.setDirectFallback(false); s.process('a'); s.setPolicy(false,false); assert.equal(s.process('s'),false); assert.equal(e.text,'a'); s.setPolicy(true,false); assert.equal(s.process('b'),true);});
function direct(input, prefix='', noCursor=false) { const [s,e]=setup(prefix,false); e.noCursor=noCursor; for(const c of input) s.process(c); return [s,e]; }
check('direct: sentence without pre-edit',()=>{const [s,e]=direct('tieengs Vieetj Nam '); assert.equal(e.text,'tiếng Việt Nam '); assert.equal(e.calls.filter(c=>c[0]==='preview').length,0);});
check('direct: keeps prefix',()=>{const [s,e]=direct('dduowngf','nhà '); assert.equal(e.text,'nhà đường');});
check('direct: minimal rewrite',()=>{const [s,e]=direct('ass'); assert.equal(e.text,'ass'); assert.deepEqual(e.calls,[['insert','a'],['delete',1],['insert','á'],['delete',1],['insert','ass']]);});
check('direct: English word never garbled',()=>{const [s,e]=direct('project '); assert.equal(e.text,'project '); assert.equal(e.calls.filter(c=>c[0]==='delete').length,0);});
check('direct: restore invalid word at boundary',()=>{const [s,e]=direct('javascript '); assert.equal(e.text,'javascript ');});
check('direct: backspace inside word',()=>{const [s,e]=direct('tieengs'); assert.equal(s.process('Backspace'),true); assert.equal(e.text,'tiến');});
check('direct: backspace after word passes through',()=>{const [s,e]=direct('as '); assert.equal(s.process('Backspace'),false); assert.equal(e.text,'á ');});
check('direct: escape restores raw',()=>{const [s,e]=direct('as'); s.process('Escape'); assert.equal(e.text,'as');});
check('direct: commit on Enter keeps text once',()=>{const [s,e]=direct('Vieetj'); s.commit(); assert.equal(e.text,'Việt'); s.process('a'); assert.equal(e.text,'Việta');});
check('direct: caret moved by click never deletes there',()=>{const [s,e]=direct('as','xyz '); const t0=Date.now(); s.now=()=>t0+2000; e.pos=1; s.process('s'); assert.equal(e.text,'xsyz á');});
check('direct: works when caret is unavailable',()=>{const [s,e]=direct('Tieengs Vieetj',"",true); assert.equal(e.text,'Tiếng Việt');});
check('direct: English mode passes through',()=>{const [s,e]=setup('',false); s.setMode(InputMode.English); assert.equal(s.process('a'),false); assert.equal(e.calls.length,0);});
check('direct: password bypass',()=>{const [s,e]=setup('',false,true); assert.equal(s.process('a'),false); assert.equal(e.calls.length,0);});
check('direct: mode toggle finalizes word',()=>{const [s,e]=direct('hoaf'); s.setMode(InputMode.English); assert.equal(e.text,'hòa'); s.process('s'); assert.equal(e.text,'hòa');});
check('direct: detach writes nothing',()=>{const [s,e]=direct('as'); const n=e.calls.length; s.detach(); s.commit(); assert.equal(e.calls.length,n);});
function lagged(input, prefix='') { const [s,e]=setup(prefix,false); e.lag=true; for(const c of input) s.process(c); return [s,e]; }
check('direct: caret reported one edit late (EasyAbroad)',()=>{const [s,e]=lagged('tieengs Vieetj Nam '); assert.equal(e.text,'tiếng Việt Nam ');});
check('direct: lagging caret with prefix',()=>{const [s,e]=lagged('dduowngf phoos','Hà Nội '); s.commit(); assert.equal(e.text,'Hà Nội đường phố');});
check('direct: lagging caret still detects click',()=>{const [s,e]=lagged('as','xyzxyzxyz '); const t0=Date.now(); s.now=()=>t0+2000; e.pos=1; e.lagged=1; s.process('s'); assert.equal(e.text,'xsyzxyzxyz á');});
check('direct: backspace after word then new word',()=>{const [s,e]=lagged('as '); s.process('Backspace'); e.text=e.text.slice(0,-1); e.pos--; for(const c of 's') s.process(c); assert.equal(e.text,'ás');});
check('preview rejected at word start falls back to direct',()=>{const [s,e]=setup(''); e.preview=function(t){ this.calls.push(['preview',t]); const err=Error('x'); err.code=12800011; throw err; }; for(const c of 'tieengs ') assert.equal(s.process(c),true); assert.equal(e.text,'tiếng '); assert.equal(s.isFailed(),false);});
// Fast typing: the bridged editor reports the caret up to N edits late.
class LagEditor extends Editor { constructor(p,n){ super(p); this.hist=[]; this.n=n; this.reads=0; } insert(t){ super.insert(t); this.hist.push(this.pos); } deleteBefore(k){ super.deleteBefore(k); this.hist.push(this.pos); } cursor(){ this.reads++; const h=this.hist; return h.length>this.n ? h[h.length-1-this.n] : (h.length? this.start0 : this.pos); } }
function fast(input, n, prefix='') { const s=new CompositionSession(); const e=new LagEditor(prefix,n); e.start0=prefix.length; s.attach(e,false,false); let t=0; s.now=()=>t; for(const c of input){ t+=40; s.process(c); } return [s,e]; }
check('direct: fast typing with 3-edit caret lag',()=>{const [s,e]=fast('tieengs Vieetj Nam dduowngf ',3); assert.equal(e.text,'tiếng Việt Nam đường ');});
check('direct: fast typing lag with prefix',()=>{const [s,e]=fast('nguowif ddepj ',4,'Xin chào '); assert.equal(e.text,'Xin chào người đẹp ');});
check('direct: old stale read after pause is a click',()=>{const [s,e]=setup('abcdefghij ',false); let t=0; s.now=()=>t; s.process('a'); t+=5000; e.pos=2; s.process('s'); assert.equal(e.text,'abscdefghij a');});
check('preview: caret computed, one read per key',()=>{const [s,e]=setup(); let reads=0; const c=e.cursor.bind(e); e.cursor=()=>{reads++; return c();}; for(const ch of 'tieengs') s.process(ch); assert.equal(e.text,'tiếng'); assert.ok(reads<=8, 'reads='+reads);});
check('preview: editor with different caret falls back to read-back',()=>{const [s,e]=setup('ab '); const p=e.preview.bind(e); e.preview=(t)=>{p(t); e.pos=e.start;}; for(const ch of 'tieengs') s.process(ch); s.commit(); assert.equal(e.text,'ab tiếng');});
check('Shift tap toggles',()=>{const t=new ShiftTapTracker(); assert.equal(t.update(true,true,false,false,false),false); assert.equal(t.update(false,true,false,false,false),true);});
check('Shift+letter (capitals) does not toggle',()=>{const t=new ShiftTapTracker(); t.update(true,true,false,false,false); t.update(true,false,false,false,false); t.update(false,false,false,false,false); assert.equal(t.update(false,true,false,false,false),false);});
check('Ctrl+Shift does not trigger Shift tap',()=>{const t=new ShiftTapTracker(); t.update(true,false,true,false,false); t.update(true,true,true,false,false); assert.equal(t.update(false,true,true,false,false),false);});
check('Shift tap after capitals still works',()=>{const t=new ShiftTapTracker(); t.update(true,true,false,false,false); t.update(true,false,false,false,false); t.update(false,true,false,false,false); t.update(true,true,false,false,false); assert.equal(t.update(false,true,false,false,false),true);});
check('CtrlShift release toggles once',()=>{const s=new ShortcutTracker(); assert.equal(s.update(true,true,true,false,false,false),false); assert.equal(s.update(true,true,true,true,false,false),false); assert.equal(s.update(false,true,true,false,false,false),true); assert.equal(s.update(false,true,false,false,false,false),false);});
check('CtrlShiftLeft does not toggle',()=>{const s=new ShortcutTracker(); s.update(true,true,true,false,false,false); s.update(true,true,true,true,false,false); s.update(true,false,true,true,false,false); assert.equal(s.update(false,true,true,false,false,false),false);});
check('typing before chord does not poison later chord',()=>{const s=new ShortcutTracker(); s.update(true,false,false,false,false,false); s.update(false,false,false,false,false,false); s.update(true,true,true,true,false,false); assert.equal(s.update(false,true,false,true,false,false),true);});
check('Alt CtrlShift does not toggle',()=>{const s=new ShortcutTracker(); s.update(true,true,true,true,true,false); assert.equal(s.update(false,true,true,false,true,false),false);});
module.exports = {tests:tests,passed:tests-failures,failed:failures};
console.log('Session: ' + JSON.stringify(module.exports));
if(failures) process.exitCode=1;
