const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { TelexEngine } = require('../.test-build/engine/TelexEngine.js');
const { InputMode, EngineOptions } = require('../.test-build/engine/VietnameseInputEngine.js');
const legacy = () => { const o = new EngineOptions(); o.englishDetection = false; return o; };
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
    check('tone ' + input + key, () => assert.equal(type(input + key), tones[index]));
    check('uppercase ' + input + key, () => assert.equal(type((input + key).toUpperCase()), tones[index].toUpperCase()));
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
 ['eee','ee'],['ooo','oo'],['ddd','dd'],['asf','à'],['asz','a'],['as','á'],['ass','ass'],['af','à'],['aff','aff'],
 ['Vieetj, Nam!','Việt, Nam!'],['too i','tô i'],['ddawng','đăng'],['tieesng','tiếng'],['thoaijs','thoái'],
 ['TRUOWNGF','TRƯỜNG'],['NGUYEENX','NGUYỄN'],['VieeTj','ViệT'],['Đ','Đ'],
 ['https://www.example.com/as?x=1','https://www.example.com/as?x=1'],
 ['user@example.com','user@example.com'],['192.168.1.1','192.168.1.1'],
 ['C:\\Users\\test','C:\\Users\\test'],['x=class','x=class'],
 ['hello world','hello world'],['javascript','javascript'],['windows','windows'],['linux','linux'],
 ['strengths','strengths'],['rhythm','rhythm'],['function','function'],['printf','printf']
];
for (const [input, expected] of fixtures) check(input, () => assert.equal(type(input), expected));
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
check('repeated tone gives raw keys', () => assert.equal(type('ass boss tests'), 'ass boss tests'));
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
const timings = [];
for(let i=0;i<10000;i++) { const start = performance.now(); type('tieengs Vieetj'); timings.push(performance.now()-start); }
timings.sort((a,b)=>a-b);
module.exports = { tests: total, passed: total-failures, failed: failures, benchmark: { host: process.platform, scope:'pure engine, 13-key phrase, not HarmonyOS IPC', p50_ms: timings[5000], p95_ms: timings[9500], p99_ms: timings[9900] } };
console.log(JSON.stringify(module.exports, null, 2));
if (failures) process.exitCode = 1;
