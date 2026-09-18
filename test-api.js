const handler=require("./api/generate.js"),originalFetch=global.fetch;
const response=()=>({statusCode:0,body:null,status(code){this.statusCode=code;return this},json(body){this.body=body;return this}});
const choice=i=>({skill:"测试",text:`选择题${i}`,options:["一","二","三","四"],answerIndex:0,explanation:"测试解析"});
const raw={title:"全新主题",intro:"约50分钟 · 文法10题 / 阅读5题 / 听力8题 · AI原创",grammar:[...Array.from({length:8},(_,i)=>({type:"choice",...choice(i),words:[],answerOrder:[]})),...Array.from({length:2},(_,i)=>({type:"order",skill:"文法・语序",text:`排序题${i}`,options:[],words:["a","b","c","d"],answerIndex:0,answerOrder:[0,1,2,3],explanation:"测试解析"}))],reading:{title:"阅读",passage:"原创文章",questions:Array.from({length:5},(_,i)=>choice(i))},listening:{script:["说明",...Array.from({length:8},(_,i)=>`第${i+1}题`)].join("\n\n"),questions:Array.from({length:8},(_,i)=>choice(i))}};

(async()=>{
  delete process.env.OPENAI_API_KEY;let res=response();await handler({method:"POST",headers:{},body:{}},res);if(res.statusCode!==503)throw new Error("缺少密钥时应返回503");
  process.env.OPENAI_API_KEY="test-key";process.env.PRACTICE_ACCESS_CODE="test-code";res=response();await handler({method:"POST",headers:{},body:{}},res);if(res.statusCode!==401)throw new Error("访问码错误时应返回401");
  global.fetch=async()=>({ok:true,json:async()=>({output:[{content:[{type:"output_text",text:JSON.stringify(raw)}]}]})});res=response();await handler({method:"POST",headers:{"x-practice-code":"test-code"},body:{avoid:["旧题"]}},res);if(res.statusCode!==200||res.body.set.grammar.length!==10||res.body.set.reading.questions.length!==5||res.body.set.listening.questions.length!==8)throw new Error("模拟生成失败");
  console.log("AI 生成接口检查通过：密钥、访问码和 10/5/8 题量均正常。")
})().finally(()=>{global.fetch=originalFetch;delete process.env.OPENAI_API_KEY;delete process.env.PRACTICE_ACCESS_CODE});

