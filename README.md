# N1 每日冲刺

可长期使用的 JLPT N1 每日练习网站。内置 4 套原创题；全部完成后，网站通过服务端 OpenAI Responses API 立即生成下一套，不循环旧题。

## 功能

- 文法：8 道单选题、2 道语序排序题
- 阅读：原创文章与 5 道选择题
- 听力：8 题连续播放，最后统一作答
- 提交前隐藏答案；提交后显示解析、错题和听力原文
- 浏览器本地保存完成记录、正确率、错题和 AI 新题
- 生成下一套时把最近 3 套题目摘要发给 AI，要求避开旧主题、句子和情境
- 手机和电脑自适应

## 本地检查

```powershell
node --check app.js
node --check api/generate.js
node test-data.js
node test-api.js
```

直接用静态服务器打开时可以完成内置题；AI 自动出题需要通过 Vercel 的服务端函数运行。

## 部署到 Vercel

1. 把本目录提交到 GitHub 仓库。
2. 在 Vercel 导入该仓库，框架选择 `Other`，其余保持默认。
3. 在 Vercel 项目的 **Settings → Environment Variables** 添加：
   - `OPENAI_API_KEY`：你的 OpenAI API Key。
   - `PRACTICE_ACCESS_CODE`：自定义访问码，防止陌生人消耗你的 API 额度。
   - `OPENAI_MODEL`：可选；默认 `gpt-5.6-luna`。
4. 重新部署。前四套完成后会自动生成新题；首次生成时网页会要求输入访问码。

不要把真实密钥写入 `.env.example`、网页代码或 Git 仓库。生产环境的密钥只保存在 Vercel 环境变量中。

## 文件说明

- `data.js`：4 套内置原创练习
- `app.js`：答题、记录、连续播放、生成与本地缓存
- `api/generate.js`：服务端 AI 生成接口和题目结构校验
- `test-data.js`：内置题库检查
- `test-api.js`：服务端接口的无密钥、访问码和模拟生成检查

网站没有复制开源项目代码或受版权保护的 JLPT 真题内容。

