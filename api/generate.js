const choice={type:"object",additionalProperties:false,properties:{skill:{type:"string"},text:{type:"string"},options:{type:"array",minItems:4,maxItems:4,items:{type:"string"}},answerIndex:{type:"integer",minimum:0,maximum:3},explanation:{type:"string"}},required:["skill","text","options","answerIndex","explanation"]};
const grammar={type:"object",additionalProperties:false,properties:{type:{type:"string",enum:["choice","order"]},skill:{type:"string"},text:{type:"string"},options:{type:"array",maxItems:4,items:{type:"string"}},words:{type:"array",maxItems:6,items:{type:"string"}},answerIndex:{type:"integer",minimum:0,maximum:3},answerOrder:{type:"array",maxItems:6,items:{type:"integer",minimum:0,maximum:5}},explanation:{type:"string"}},required:["type","skill","text","options","words","answerIndex","answerOrder","explanation"]};
const schema={type:"object",additionalProperties:false,properties:{title:{type:"string"},intro:{type:"string"},grammar:{type:"array",minItems:10,maxItems:10,items:grammar},reading:{type:"object",additionalProperties:false,properties:{title:{type:"string"},passage:{type:"string"},questions:{type:"array",minItems:5,maxItems:5,items:choice}},required:["title","passage","questions"]},listening:{type:"object",additionalProperties:false,properties:{script:{type:"string"},questions:{type:"array",minItems:8,maxItems:8,items:choice}},required:["script","questions"]}},required:["title","intro","grammar","reading","listening"]};

const prompt=`你是严谨的 JLPT N1 原创练习命题人。生成一套全新、不得照抄真题的练习。
要求：
1. 文法恰好10题，其中8道四选一、2道语序排序。选择题 options 为4项、words 与 answerOrder 为空；排序题 words 为4到6个词块、answerOrder是0开始的完整排列，options为空、answerIndex填0。
2. 阅读包含一篇或两篇合计900到1400日文字符的原创材料，以及5道四选一题。
3. 听力包含连续播放用的完整日语脚本：开场说明后依次八题，每题之间空一行；再给8道四选一题。脚本不能提前说答案。
4. 题干、选项和文章使用自然日语；skill和explanation使用简洁中文；所有答案必须唯一、解析必须能由题干或材料推出。
5. title简短，intro说明“约50分钟 · 文法10题 / 阅读5题 / 听力8题 · AI原创”。避免与用户列出的旧题主题、句子和情境重复。`;

function normalize(raw){
  const id=`ai-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const grammarQuestions=raw.grammar.map((q,i)=>q.type==="order"?{id:`g${i+1}`,type:"order",skill:q.skill,text:q.text,words:q.words,answer:q.answerOrder,explanation:q.explanation}:{id:`g${i+1}`,type:"choice",skill:q.skill,text:q.text,options:q.options,answer:q.answerIndex,explanation:q.explanation});
  const choices=(items,prefix)=>items.map((q,i)=>({id:`${prefix}${i+1}`,type:"choice",skill:q.skill,text:q.text,options:q.options,answer:q.answerIndex,explanation:q.explanation}));
  return{id,title:raw.title,intro:raw.intro,grammar:grammarQuestions,reading:{title:raw.reading.title,passage:raw.reading.passage,questions:choices(raw.reading.questions,"r")},listening:{script:raw.listening.script,questions:choices(raw.listening.questions,"l")}};
}

function validate(set){
  if(set.grammar.length!==10||set.reading.questions.length!==5||set.listening.questions.length!==8)throw new Error("AI 返回的题量不正确");
  if(set.grammar.filter(q=>q.type==="order").length!==2)throw new Error("AI 返回的语序题数量不正确");
  for(const q of [...set.grammar,...set.reading.questions,...set.listening.questions]){
    if(!q.text||!q.explanation)throw new Error("AI 返回了空题目");
    if(q.type==="order"){
      if(q.words.length<4||q.words.length>6||q.answer.length!==q.words.length||new Set(q.answer).size!==q.words.length||q.answer.some(i=>i<0||i>=q.words.length))throw new Error("AI 返回的语序答案无效");
    }else if(q.options.length!==4||q.answer<0||q.answer>3)throw new Error("AI 返回的选择题无效");
  }
  if(set.listening.script.split(/\n\n+/).length<9)throw new Error("AI 返回的听力脚本不足8题");
  return set;
}

module.exports=async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"仅支持 POST"});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"尚未配置 OPENAI_API_KEY"});
  if(process.env.PRACTICE_ACCESS_CODE&&req.headers["x-practice-code"]!==process.env.PRACTICE_ACCESS_CODE)return res.status(401).json({error:"访问码错误"});
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{},avoid=Array.isArray(body.avoid)?body.avoid.slice(-80).map(String):[];
    const api=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,reasoning:{effort:"low"},max_output_tokens:16000,input:[{role:"developer",content:prompt},{role:"user",content:`需要避开的旧题内容：\n${avoid.join("\n")||"无"}`}],text:{format:{type:"json_schema",name:"jlpt_n1_set",strict:true,schema}}})});
    const data=await api.json();if(!api.ok)throw new Error(data.error?.message||`OpenAI API 返回 ${api.status}`);
    const text=data.output?.flatMap(item=>item.content||[]).find(item=>item.type==="output_text")?.text;if(!text)throw new Error("OpenAI API 未返回题目");
    return res.status(200).json({set:validate(normalize(JSON.parse(text)))});
  }catch(error){return res.status(502).json({error:error.message||"生成失败"})}
};

module.exports._test={normalize,validate,schema};

