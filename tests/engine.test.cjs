const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { TelexEngine } = require('../.test-build/engine/TelexEngine.js');
const { InputMode, EngineOptions } = require('../.test-build/engine/VietnameseInputEngine.js');
const legacy = () => { const o = new EngineOptions(); o.englishDetection = false; return o; };
// Telex tables alone: the English word list (is, us, or, os...) is tested separately.
const noList = () => { const o = new EngineOptions(); o.englishWords = []; return o; };
const { parseSyllable } = require('../.test-build/engine/Syllable.js');
let total = 0;
let failures = 0;
function check(name, test) {
  total++;
  try { test(); } catch (err) { failures++; console.error(name + ': ' + err.message); }
}
function type(input, options = new EngineOptions(), mode = InputMode.Vietnamese) {
  const engine = new TelexEngine(options); engine.setMode(mode);
  let committed = '';
  for (const key of input) { committed += engine.processKey(key).commit; }
  return committed + engine.finish();
}
// Expected values are independent literal Unicode tables, not engine-derived strings.
const rows = [
  ['a','áàảãạ'], ['aw','ắằẳẵặ'], ['aa','ấầẩẫậ'], ['e','éèẻẽẹ'], ['ee','ếềểễệ'],
  ['i','íìỉĩị'], ['o','óòỏõọ'], ['oo','ốồổỗộ'], ['ow','ớờởỡợ'],
  ['u','úùủũụ'], ['uw','ứừửữự'], ['y','ýỳỷỹỵ']
];
for (const [input, tones] of rows) {
  [...'sfrxj'].forEach((key, index) => {
    check('tone ' + input + key, () => assert.equal(type(input + key, noList()), tones[index]));
    check('uppercase ' + input + key, () => assert.equal(type((input + key).toUpperCase(), noList()), tones[index].toUpperCase()));
    check('remove repeated tone (detection off) ' + input + key + key, () => {
      const engine = new TelexEngine(legacy()); for (const c of input + key + key) engine.processKey(c);
      const bases = ['a','ă','â','e','ê','i','o','ô','ơ','u','ư','y'];
      assert.equal(engine.getComposition(), bases[rows.findIndex(r => r[0] === input)]);
    });
  });
}
const fixtures = [
 ['tieengs','tiếng'],['Vieetj','Việt'],['ddieenj','điện'],['thoaij','thoại'],['nguowif','người'],
 ['truowngf','trường'],['phuowng','phương'],['dduwowngf','đường'],['DDaij','Đại'],['DDieenj','Điện'],
 ['DD','Đ'],['Vieetj Nam','Việt Nam'],['hoa','hoa'],['hoas','hóa'],['thuy','thuy'],['thuys','thúy'],
 ['quyen','quyen'],['quyeens','quyến'],['quyeenf','quyền'],['Nguyeenx','Nguyễn'],['cuoocj','cuộc'],
 ['luowngj','lượng'],['chuyeern','chuyển'],['gias','giá'],['gif','gì'],['gins','gín'],['gieengs','giếng'],
 ['quas','quá'],['quys','quý'],['qus','qus'],['quaws','quắ'],['thuees','thuế'],['muaf','mùa'],
 ['muwaf','mừa'],['chuaw','chưa'],['khuyar','khuỷa'],['khoer','khỏe'],['hoanf','hoàn'],
 ['hoaf','hòa'],['ngoaif','ngoài'],['ngoaij','ngoại'],['yeeus','yếu'],['hieeur','hiểu'],
 ['dd','đ'],['aw','ă'],['aa','â'],['ee','ê'],['oo','ô'],['ow','ơ'],['uw','ư'],['aaa','aa'],
 ['eee','ee'],['ooo','oo'],['ddd','dd'],['asf','à'],['asz','a'],['as','á'],['ass','as'],['af','à'],['aff','af'],
 ['Vieetj, Nam!','Việt, Nam!'],['too i','tô i'],['ddawng','đăng'],['tieesng','tiếng'],['thoaijs','thoái'],
 ['TRUOWNGF','TRƯỜNG'],['NGUYEENX','NGUYỄN'],['VieeTj','ViệT'],['Đ','Đ'],
 ['https://www.example.com/as?x=1','https://www.example.com/as?x=1'],
 ['user@example.com','user@example.com'],['192.168.1.1','192.168.1.1'],
 ['C:\\Users\\test','C:\\Users\\test'],['x=class','x=class'],
 ['hello world','hello world'],['javascript','javascript'],['windows','windows'],['linux','linux'],
 ['strengths','strengths'],['rhythm','rhythm'],['function','function'],['printf','printf']
];
for (const [input, expected] of fixtures) check(input, () => assert.equal(type(input), expected));
// 1.0.8: stop codas (c ch p t) only take sắc/nặng; more built-in English words.
for (const [input, expected] of [['port','port'],['sort','sort'],['part','part'],['chart','chart'],['texts','texts'],['wrap','wrap'],
  ['is','is'],['or','or'],['if','if'],['how','how'],['now','now'],['data','data'],['more','more'],['OS','OS'],['AWS','AWS'],['does','does'],
  ['hocj','học'],['toots','tốt'],['vieetj','việt'],['cacs','các'],['thichs','thích'],['ddepj','đẹp'],['max','mã'],['six','sĩ'],['this','thí'],['its','ít']])
  check('english v2 ' + input, () => assert.equal(type(input), expected));
// UniKey habit: ww after the ư shorthand, ss after an unwanted tone. The escape keys are not echoed back.
for (const [input, expected] of [['windows','windows'],['wwindows','windows'],['wwindowss','windowss'],['Wwindows','Windows'],
  ['WWINDOWS','WINDOWS'],['wword','word'],['wweb','web'],['ww','w'],['nhww','nhw'],['aaa','aa'],['ddd','dd'],['nhw','như'],['uwng','ưng']])
  check('escaped english ' + input, () => assert.equal(type(input), expected));
// UniKey/OpenKey: a tone key pressed twice in a row removes the tone and keeps one key; letters after it mean English.
for (const [input, expected] of [['os','os'],['oss','os'],['Oss','Os'],['OSS','OS'],['osss','oss'],['ass','as'],['aff','af'],['orr','or'],['ajj','aj'],
  ['boss','boss'],['bosss','boss'],['less','less'],['off','off'],['office','office'],['offfice','office'],['error','error'],['message','message'],
  ['current','current'],['coffee','coffee'],['tests','tests'],['posts','posts'],['tieengss','tiêngs'],['hoaff','hoaf'],['tieengs','tiếng']])
  check('double tone key ' + input, () => assert.equal(type(input), expected));
for (const [input, expected] of [['tesst','test'],['Tesst','Test'],['texxt','text'],['cosst','cost'],['posst','post'],['tesst tests test','test tests test'],
  ['offline','offline'],['offfline','offline'],['password','password'],['office','office'],['error','error'],['lesson','lesson']])
  check('undo tone mid-word ' + input, () => assert.equal(type(input), expected));
check('backspace after double tone key resumes Telex', () => { const e = new TelexEngine(); for (const k of ['a','s','s','Backspace','s']) e.processKey(k); assert.equal(e.finish(), 'á'); });
check('tone that cannot close a stop coda restores raw without detection', () => {
  const o = legacy(); assert.equal(type('port', o), 'port'); assert.equal(type('hocf', o), 'hocf');
});
// Settings audit (1.0.7): every engine option has a visible effect and none breaks plain Telex.
const opt = (patch) => Object.assign(new EngineOptions(), patch);
for (const [input, expected] of [['toasz','toa'],['toansz','toan'],['Vieetjz','Viêt'],['asz','a']])
  check('z removes tone ' + input, () => assert.equal(type(input), expected));
for (const [input, expected] of [['toasz','toasz'],['asz','asz'],['zoo','zoo']])
  check('z is a letter when off ' + input, () => assert.equal(type(input, opt({ zRemovesTone: false })), expected));
for (const [input, expected] of [['tieengs','tiếng'],['tieesng','tiếng'],['vieetj','việt'],['vieejt','việt'],['ddieenj','điện'],
  ['nguowif','người'],['truowngf','trường'],['quyeenf','quyền'],['chuyeenr','chuyển'],['nghieeng','nghiêng'],['hoas','hóa'],
  ['dinhd','dinhd'],['ddinh','đinh'],['viejet','viejet'],['tiesneg','tiesneg']])
  check('free typing off ' + input, () => assert.equal(type(input, opt({ freeTyping: false })), expected));
for (const [input, expected] of [['viejet','việt'],['tiesneg','tiếng'],['dinhd','đinh']])
  check('free typing on ' + input, () => assert.equal(type(input), expected));
check('english list applies with detection off', () => assert.equal(type('test', legacy()), 'test'));
check('restore invalid off keeps composed text', () => assert.equal(type('quyefn', opt({ restoreInvalid: false })), 'quyèn'));
check('old tone placement off: hoá khoẻ thuý', () => assert.equal(type('hoas khoer thuys', opt({ modernTone: false })), 'hoá khoẻ thuý'));
const corpus = [
 ['Tooi ddang vieets tieengs Vieetj treen HarmonyOS.', 'Tôi đang viết tiếng Việt trên HarmonyOS.'],
 ['Truowngf DDaij hojc Bachs khoa Haf Nooij.', 'Trường Đại học Bách khoa Hà Nội.'],
 ['Heej thoongs quarn lys nawng luowngj.', 'Hệ thống quản lý năng lượng.'],
 ['Pin lithium-ion cho xe mays ddieenj.', 'Pin lithium-ion cho xe máy điện.'],
 ['Nguyeenx Vawn An.', 'Nguyễn Văn An.'],
 ['DDuowngf Nguyeenx Traix.', 'Đường Nguyễn Trãi.'],
 ['Quyeenf truy caapj.', 'Quyền truy cập.'],
 ['Chuyeern ddooir nawng luowngj.', 'Chuyển đổi năng lượng.'],
 ['Hieeuj suaats heej thoongs.', 'Hiệu suất hệ thống.'],
 ['Phuowng ans thuwr nghieemj.', 'Phương án thử nghiệm.']
];
for (const [input, expected] of corpus) check('corpus ' + input, () => assert.equal(type(input), expected));
for (const input of ['as','hello world','https://class.com','user@example.com','192.168.1.1','const x = 1;','Ctrl+Shift','DDaij','Telex','Vieetj Nam']) {
 check('English ' + input, () => assert.equal(type(input, new EngineOptions(), InputMode.English), input));
}
check('backspace graphemes', () => {
 const engine = new TelexEngine(); for (const c of 'tieengs') engine.processKey(c);
 for (const expected of ['tiến','tiế','tí','t','']) assert.equal(engine.processKey('Backspace').composition, expected);
 assert.equal(engine.processKey('Backspace').handled, false);
});
check('reset', () => { const e = new TelexEngine(); e.processKey('a'); e.reset(); assert.equal(e.getRaw(), ''); assert.equal(e.getComposition(), ''); });
check('escape restores raw', () => { const e = new TelexEngine(); for(const c of 'tieengs') e.processKey(c); assert.equal(e.processKey('Escape').commit, 'tieengs'); });
check('mode reset', () => { const e = new TelexEngine(); e.processKey('a'); e.setMode(InputMode.English); assert.equal(e.getComposition(), ''); });
check('alternate tone placement', () => { const o = new EngineOptions(); o.modernTone = false; assert.equal(type('hoas thuys', o), 'hoá thuý'); });
check('syllable parse', () => { const s = parseSyllable([...'quyên']); assert.deepEqual([s.onset,s.nucleus,s.coda,s.valid], ['qu','yê','n',true]); });
check('invalid onset', () => assert.equal(parseSyllable([...'stra']).valid, false));
check('invalid coda', () => assert.equal(parseSyllable([...'abc']).valid, false));
check('free typing off', () => { const o = new EngineOptions(); o.freeTyping = false; assert.equal(type('stras',o), 'stras'); });
check('restore off', () => { const o = legacy(); o.restoreInvalid = false; assert.equal(type('stras',o),'strá'); });
check('bounded long token', () => { const e = new TelexEngine(); let text=''; for(const c of 'b'.repeat(1024)) text+=e.processKey(c).commit; text+=e.finish(); assert.equal(text,'b'.repeat(1024)); assert.equal(e.getRaw(),''); });
check('technical bypass ends at whitespace', () => assert.equal(type('https://example.com tieengs'), 'https://example.com tiếng'));
check('colon after Vietnamese word', () => assert.equal(type('Ghi chus: tieengs Vieetj'), 'Ghi chú: tiếng Việt'));
check('colon after scheme stays technical', () => assert.equal(type('https://vieetj.vn'), 'https://vieetj.vn'));
check('drive letter colon', () => assert.equal(type('C:\\tieengs'), 'C:\\tieengs'));
check('double tone key undoes like UniKey, later repeat gives raw keys', () => assert.equal(type('ass oss boss tests'), 'as os boss tests'));
for (const w of 'project process search address windows office free week users course teams class boss access zoom fix offer error default browser review system verify Facebook design test email admin meeting server cost deadline report online'.split(' ')) {
  check('English kept ' + w, () => assert.equal(type(w + ' '), w + ' '));
}
check('English kept while typing', () => { const e = new TelexEngine(); let c = ''; const seen = []; for (const k of 'project') { const r = e.processKey(k); c += r.commit; seen.push(c + r.composition); } assert.deepEqual(seen.slice(3), ['proj', 'proje', 'projec', 'project']); });
check('dictionary only at word end: meetj', () => assert.equal(type('meet meetj teen'), 'meet mệt tên'));
check('w shorthand', () => assert.equal(type('ngwx nhw tw ww'), 'ngữ như tư w'));
check('Vietnamese unaffected by detection', () => assert.equal(type('Tieengs Vieetj laf ngoon ngwx cuar chusng ta, trowif rets lits max Mix'), 'Tiếng Việt là ngôn ngữ của chúng ta, trời rét lít mã Mĩ'));
check('user English words', () => { const o = new EngineOptions(); o.englishWords = o.englishWords.concat(['caf']); assert.equal(type('caf ', o), 'caf '); });
check('detection off keeps legacy', () => assert.equal(type('ass', legacy()), 'a'));
check('UniKey: d anywhere', () => assert.equal(type('dinhd dieend Dungd ddi didd '), 'đinh điên Đung đi did '));
check('UniKey: d does not touch English', () => assert.equal(type('add odd dead '), 'add odd dead '));
check('UniKey undo option', () => { const o = new EngineOptions(); o.uniKeyUndo = true; assert.equal(type('ass tieengss ', o), 'as tiêngs '); });
check('email bypass ends at whitespace', () => assert.equal(type('as@example.com Vieetj'), 'as@example.com Việt'));
check('Caps Lock plus Shift casing supplied by caller', () => assert.equal(type('nGUYEENX'), 'nGUYỄN'));
check('backspace then continue', () => { const e=new TelexEngine(); for(const c of 'tieengs')e.processKey(c); e.processKey('Backspace'); e.processKey('g'); assert.equal(e.finish(),'tiếng'); });
check('third tone press after restore is swallowed: offfice', () => assert.equal(type('offfice office asss ass testss '), 'office office ass as tests '));
check('swallow only right after the restore', () => assert.equal(type('offif '), 'offif '));
check('swallowed key writes nothing', () => { const e = new TelexEngine(); for (const c of 'test') e.processKey(c); assert.equal(e.processKey('s').commit, 'tests'); const r = e.processKey('s'); assert.deepEqual([r.handled, r.commit, r.composition], [true, '', '']); });
check('UniKey undo option unaffected by swallow', () => { const o = new EngineOptions(); o.uniKeyUndo = true; assert.equal(type('offf ', o), 'off '); });
check('symbols and digits flagged for pass-through', () => {
  const e = new TelexEngine(); for (const c of 'tieengs') e.processKey(c);
  const r = e.processKey('='); assert.deepEqual([r.commit, r.passKey], ['tieengs=', true]);
  const d = new TelexEngine(); for (const c of 'as') d.processKey(c);
  const dot = d.processKey('.'); assert.deepEqual([dot.commit, dot.passKey], ['á.', true]);
  assert.equal(new TelexEngine().processKey('5').passKey, true);
  assert.equal(new TelexEngine().processKey(' ').passKey, false);
  const l = new TelexEngine(); for (const c of 'project') l.processKey(c); assert.equal(l.processKey('(').passKey, true);
  assert.equal(new TelexEngine().processKey('a').passKey, false);
});
const macroOptions = () => { const o = new EngineOptions(); o.macros = new Map([['vn', 'Việt Nam'], ['ko', 'không'], ['nx', 'nhận xét'], ['dc', 'được']]); return o; };
check('macro expands at word end', () => assert.equal(type('vn ko nx, dc.', macroOptions()), 'Việt Nam không nhận xét, được.'));
check('macro follows typed case', () => assert.equal(type('Ko KO Nx ', macroOptions()), 'Không KHÔNG Nhận xét '));
check('macro prefix is not switched to English', () => { const e = new TelexEngine(macroOptions()); e.processKey('n'); assert.equal(e.processKey('x').composition, 'nx'); });
check('longer words are not macros', () => assert.equal(type('vnn kos ', macroOptions()), 'vnn kó '));
check('macros off by default', () => assert.equal(type('vn '), 'vn '));
check('macro not applied to technical tokens', () => assert.equal(type('vn/ko', macroOptions()), 'vn/ko'));
const timings = [];
for(let i=0;i<10000;i++) { const start = performance.now(); type('tieengs Vieetj'); timings.push(performance.now()-start); }
timings.sort((a,b)=>a-b);
module.exports = { tests: total, passed: total-failures, failed: failures, benchmark: { host: process.platform, scope:'pure engine, 13-key phrase, not HarmonyOS IPC', p50_ms: timings[5000], p95_ms: timings[9500], p99_ms: timings[9900] } };
console.log(JSON.stringify(module.exports, null, 2));
if (failures) process.exitCode = 1;
