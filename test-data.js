const fs=require("fs"),vm=require("vm"),context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync("data.js","utf8"),context);
const sets=context.window.DAILY_SETS;
if(sets.length!==4)throw new Error("需要 4 套每日练习");
for(const set of sets){
  const groups=[set.grammar,set.reading.questions,set.listening.questions];
  if(groups.map(x=>x.length).join()!=="10,5,8")throw new Error(`${set.id} 题量错误`);
  const questions=groups.flat(),ids=questions.map(q=>q.id);
  if(new Set(ids).size!==23)throw new Error(`${set.id} 题号重复`);
  for(const q of questions){
    if(Array.isArray(q.answer)){if(q.answer.length!==q.words.length||new Set(q.answer).size!==q.words.length)throw new Error(`${set.id}/${q.id} 排序答案错误`)}
    else if(q.answer<0||q.answer>=q.options.length)throw new Error(`${set.id}/${q.id} 答案越界`);
  }
  if(set.listening.script.split(/\n\n+/).length<9)throw new Error(`${set.id} 听力不足 8 题`);
}
const done=new Set(sets.slice(0,3).map(s=>s.id));
if(sets.find(s=>!done.has(s.id))?.id!=="set-04")throw new Error("完成前三套后没有进入新题");
console.log("4 套原创练习检查通过：完成前三套后进入新题，不循环。");

