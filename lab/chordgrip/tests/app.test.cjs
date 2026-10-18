const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function app(audio){
 class Element {
  constructor(){this.children=[];this.style={};this.value='';this.textContent='';this.classList={add(){}};}
  set innerHTML(v){this.children=[];this._html=v;} get innerHTML(){return this._html;}
  setAttribute(k,v){this[k]=v;}
  appendChild(e){this.children.push(e);if(!this.value&&e.value)this.value=e.value;}
 }
 const elements=Object.fromEntries(['stage','chord','mode','title','message','riff','play','reset'].map(k=>[k,new Element()]));
 elements.mode.value='chord';let next=0;const timers=new Map();
 const context=vm.createContext({document:{getElementById:k=>elements[k],createElement:()=>new Element(),addEventListener(){}},window:audio||{},setTimeout:f=>{timers.set(++next,f);return next;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 return {elements,timers,run:s=>vm.runInContext(s,context),tick(){const jobs=[...timers.values()];timers.clear();jobs.forEach(f=>f());}};
}
test('all five chords render the right number of fretted targets',()=>{const a=app();for(const [name,count] of [['Em',2],['Am',3],['C',3],['G',3],['D',3]]){a.elements.chord.value=name;a.elements.chord.onchange();assert.equal(a.elements.title.textContent,name);assert.equal(a.elements.stage.children.filter(e=>e.className==='tapzone').length,count);}});
test('chord success requires every target and resets on selection',()=>{const a=app();const targets=a.elements.stage.children.filter(e=>e.className==='tapzone');targets[0].onclick();assert.ok(!a.elements.message.textContent.includes('完成'));targets[1].onclick();assert.ok(a.elements.message.textContent.includes('完成'));a.elements.chord.onchange();assert.equal(a.run('hits.size'),0);});
function riff(a){a.elements.mode.value='riff';a.elements.mode.onchange();}
function complete(a){a.run("hits.add('6-0');hits.add('5-3');checkSuccess();");}
test('repeated completion schedules only one advance',()=>{const a=app();riff(a);complete(a);a.run('checkSuccess();checkSuccess()');assert.equal(a.timers.size,1);a.tick();assert.equal(a.run('riffIndex'),1);});
test('mode switch cancels stale riff advance',()=>{const a=app();riff(a);complete(a);a.elements.mode.value='chord';a.elements.mode.onchange();a.tick();assert.equal(a.elements.title.textContent,'Em');assert.equal(a.run('riffIndex'),0);});
test('reset cancels playback and advance',()=>{const a=app();riff(a);complete(a);a.elements.reset.onclick();assert.equal(a.timers.size,0);assert.equal(a.run('riffIndex'),0);});
test('repeated play replaces pending notes',()=>{const a=app();a.elements.play.onclick();assert.equal(a.timers.size,6);a.elements.play.onclick();assert.equal(a.timers.size,6);a.elements.reset.onclick();assert.equal(a.timers.size,0);});
test('unavailable audio does not prevent practice',()=>{const a=app();assert.doesNotThrow(()=>{a.elements.play.onclick();a.tick();});});
test('suspended audio resumes and chord frequencies are correct',()=>{let resumed=0;class Audio{constructor(){this.state='suspended';}resume(){resumed++;return Promise.resolve();}}const a=app({AudioContext:Audio});a.run('ensureAudio()');assert.equal(resumed,1);assert.ok(Math.abs(a.run('freq(5,2)')-123.47)<0.02);assert.ok(Math.abs(a.run('freq(1,12)')-659.26)<0.02);});
