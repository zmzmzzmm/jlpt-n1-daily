const fs=require("fs"),vm=require("vm"),context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync("data.js","utf8"),context);
const sets=context.window.DAILY_SETS;
if(sets.length!==21)throw new Error("需要 21 套每日练习");
for(const set of sets){
  const groups=[set.grammar,set.reading.questions,set.listening.questions];
  if(groups.map(x=>x.length).join()!=="10,5,8")throw new Error(`${set.id} 题量错误`);
  if(set.grammar.filter(q=>q.type==="choice").length!==8||set.grammar.filter(q=>q.type==="order").length!==2)throw new Error(`${set.id} 文法题型数量错误`);
  const questions=groups.flat(),ids=questions.map(q=>q.id);
  if(new Set(ids).size!==23)throw new Error(`${set.id} 题号重复`);
  for(const q of questions){
    if(Array.isArray(q.answer)){if(q.answer.length!==q.words.length||new Set(q.answer).size!==q.words.length)throw new Error(`${set.id}/${q.id} 排序答案错误`)}
    else if(q.answer<0||q.answer>=q.options.length)throw new Error(`${set.id}/${q.id} 答案越界`);
  }
  if(set.listening.script.split(/\n\n+/).length!==9||!/一番[。．]/.test(set.listening.script)||!/八番[。．]/.test(set.listening.script))throw new Error(`${set.id} 听力段落错误`);
}
const done=new Set(sets.slice(0,20).map(s=>s.id));
if(sets.find(s=>!done.has(s.id))?.id!=="set-21")throw new Error("完成前二十套后没有进入新题");
if(sets.filter(s=>s.date==="2026-10-22").length!==1)throw new Error("明日练习日期缺失或重复");
const newStems=[...sets.at(-1).grammar,...sets.at(-1).reading.questions,...sets.at(-1).listening.questions].map(q=>q.text);
const oldStems=new Set(sets.slice(0,-1).flatMap(s=>[...s.grammar,...s.reading.questions,...s.listening.questions].map(q=>q.text)));
if(newStems.some(text=>oldStems.has(text)))throw new Error("新题与既有题目重复");
console.log("21 套原创练习检查通过：题型、题量、题号、答案、听力分段和目标日期均有效。");

