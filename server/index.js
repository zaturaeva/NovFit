import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { WebSocketServer } from 'ws'
import { createServer } from 'node:http'
import { db } from './db.js'
import './seed.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ noServer: true })
const PORT = process.env.PORT || 3001
const SECRET = process.env.JWT_SECRET || 'novfit-development-secret-change-me'
app.use(cors({ origin: true }))
app.use(express.json())

// Root endpoint: открытие http://localhost:3001/ должно показывать статус API, а не 404.
app.get('/', (_req,res) => res.json({ name: 'NovFit API', status: 'ok', endpoints: ['/api/auth/login', '/api/dashboard', '/ws'] }))
app.get('/health', (_req,res) => res.json({ status: 'ok' }))

const tokenFor = user => jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' })
const publicUser = u => ({ id: u.id, name: u.name, nickname: u.nickname, email: u.email })
function auth(req,res,next) {
 const token = (req.headers.authorization || '').replace(/^Bearer\s+/i,'')
 try { req.user = jwt.verify(token,SECRET); next() } catch { res.status(401).json({error:'Требуется авторизация'}) }
}
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

app.post('/api/auth/register',(req,res)=>{
 const {name,nickname,email,password} = req.body || {}
 if (!name?.trim() || !nickname?.trim() || !email?.trim() || !password || password.length < 6)
  return res.status(400).json({error:'Укажите имя, уникальный никнейм, почту и пароль от 6 символов'})
 try {
  const result = db.prepare('INSERT INTO users(name,nickname,email,password_hash) VALUES(?,?,?,?)')
   .run(name.trim(),nickname.trim().replace(/^@/,''),email.trim().toLowerCase(),bcrypt.hashSync(password,10))
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid)
  return res.status(201).json({token:tokenFor(user),user:publicUser(user)})
 } catch(e) { return res.status(409).json({error:e.message.includes('nickname')?'Этот никнейм уже занят':'Пользователь с такой почтой уже существует'}) }
})
app.post('/api/auth/login',(req,res)=>{
 const {email,password} = req.body || {}
 const user = db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').get(email || '')
 if (!user || !bcrypt.compareSync(password || '',user.password_hash)) return res.status(401).json({error:'Неверная почта или пароль'})
 res.json({token:tokenFor(user),user:publicUser(user)})
})
app.get('/api/me',auth,(req,res)=>{
 const user=db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)
 if(!user) return res.status(404).json({error:'Пользователь не найден'})
 res.json(publicUser(user))
})
// Каталог статей отдаётся постранично: клиент загружает следующую порцию по мере прокрутки.
app.get('/api/media/:id',(req,res)=>{
 const asset=db.prepare('SELECT source_url,image_data,content_type FROM media_assets WHERE id=?').get(Number(req.params.id))
 if(!asset) return res.status(404).end()
 if(!asset.image_data) return res.redirect(302,asset.source_url)
 res.set('Content-Type',asset.content_type || 'image/jpeg')
 res.set('Cache-Control','public, max-age=86400')
 res.send(asset.image_data)
})
app.get('/api/articles',(req,res)=>{
 const limit=Math.min(12,Math.max(1,Number(req.query.limit)||4))
 const offset=Math.max(0,Number(req.query.offset)||0)
 const rows=db.prepare(`SELECT id,slug,title,category,read_minutes,excerpt,author,CASE WHEN image_asset_id IS NOT NULL THEN '/api/media/'||image_asset_id ELSE image_url END AS image_url FROM articles ORDER BY id LIMIT ? OFFSET ?`).all(limit,offset)
 const total=db.prepare('SELECT COUNT(*) AS count FROM articles').get().count
 res.json({items:rows,total,hasMore:offset+rows.length<total,nextOffset:offset+rows.length})
})
app.post('/api/articles',auth,(req,res)=>{
 const {title,category,excerpt,body,image_url}=req.body||{}
 if(!title?.trim()||!category?.trim()||!excerpt?.trim()||!body?.trim()) return res.status(400).json({error:'Заполните название, категорию, описание и текст статьи'})
 const base=title.trim().toLowerCase().replace(/[^a-z0-9а-яё]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'article'
 let slug=base,n=2; while(db.prepare('SELECT id FROM articles WHERE slug=?').get(slug)) slug=`${base}-${n++}`
 const author=db.prepare('SELECT name FROM users WHERE id=?').get(req.user.id)?.name||'Автор NovFit'
 const result=db.prepare('INSERT INTO articles(slug,title,category,read_minutes,excerpt,author,body,image_url) VALUES(?,?,?,?,?,?,?,?)').run(slug,title.trim(),category.trim(),Math.max(1,Math.ceil(body.length/900)),excerpt.trim(),author,body.trim(),image_url?.trim()||'https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTAxL3Jhd3BpeGVsX29mZmljZV80Nl9jbG9zZV91cF9zaG90X3Bob3RvX29mX2d5bV9lcXVpcG1lbnRfZm9yX3dvcl8zNzRlNTZiZi0yZWJlLTRjMDUtYWY3OS1iNzNhZWQxY2Y4YzBfMS5qcGc.jpg')
 res.status(201).json({id:result.lastInsertRowid,slug})
})
app.get('/api/articles/:slug',auth,(req,res)=>{
 const article=db.prepare("SELECT articles.*,CASE WHEN image_asset_id IS NOT NULL THEN '/api/media/'||image_asset_id ELSE image_url END AS image_url FROM articles WHERE slug=?").get(req.params.slug)
 if(!article) return res.status(404).json({error:'Статья не найдена'})
 const liked=!!db.prepare('SELECT id FROM article_likes WHERE article_id=? AND user_id=?').get(article.id,req.user.id)
 const likes=db.prepare('SELECT COUNT(*) AS count FROM article_likes WHERE article_id=?').get(article.id).count
 res.json({...article,liked,likes})
})
app.get('/api/articles/:slug/comments',auth,(req,res)=>{
 const a=db.prepare('SELECT id FROM articles WHERE slug=?').get(req.params.slug); if(!a)return res.status(404).json({error:'Статья не найдена'})
 res.json(db.prepare('SELECT c.id,c.body,c.created_at,u.name,u.nickname FROM article_comments c JOIN users u ON u.id=c.user_id WHERE c.article_id=? ORDER BY c.id DESC LIMIT 100').all(a.id))
})
app.post('/api/articles/:slug/comments',auth,(req,res)=>{
 const a=db.prepare('SELECT id FROM articles WHERE slug=?').get(req.params.slug), body=String(req.body?.body||'').trim()
 if(!a)return res.status(404).json({error:'Статья не найдена'}); if(!body||body.length>2000)return res.status(400).json({error:'Комментарий должен содержать от 1 до 2000 символов'})
 const r=db.prepare('INSERT INTO article_comments(article_id,user_id,body) VALUES(?,?,?)').run(a.id,req.user.id,body)
 res.status(201).json(db.prepare('SELECT c.id,c.body,c.created_at,u.name,u.nickname FROM article_comments c JOIN users u ON u.id=c.user_id WHERE c.id=?').get(r.lastInsertRowid))
})
app.post('/api/articles/:slug/like',auth,(req,res)=>{
 const a=db.prepare('SELECT id FROM articles WHERE slug=?').get(req.params.slug); if(!a)return res.status(404).json({error:'Статья не найдена'})
 const old=db.prepare('SELECT id FROM article_likes WHERE article_id=? AND user_id=?').get(a.id,req.user.id)
 if(old)db.prepare('DELETE FROM article_likes WHERE id=?').run(old.id);else db.prepare('INSERT INTO article_likes(article_id,user_id) VALUES(?,?)').run(a.id,req.user.id)
 res.json({liked:!old,likes:db.prepare('SELECT COUNT(*) AS count FROM article_likes WHERE article_id=?').get(a.id).count})
})
app.get('/api/videos',(_req,res)=>{
 res.json(db.prepare(`SELECT id,slug,title,description,duration,author,CASE WHEN image_asset_id IS NOT NULL THEN '/api/media/'||image_asset_id ELSE cover_url END AS cover_url,youtube_id FROM videos ORDER BY id`).all())
})

app.get('/api/dashboard',auth,(req,res)=>{
 const date=String(req.query.date || today())
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({error:'Некорректная дата'})
 const logs=db.prepare('SELECT * FROM daily_logs WHERE user_id=? AND date=? ORDER BY id').all(req.user.id,date)
 const sum=(type)=>logs.filter(x=>x.type===type).reduce((a,x)=>a+x.amount,0)
 res.json({date,logs,water:sum('water'),waterGoal:[...logs].reverse().find(x=>x.type==='water'&&x.goal)?.goal || 2,
 sleep:sum('sleep'),sleepGoal:[...logs].reverse().find(x=>x.type==='sleep'&&x.goal)?.goal || 8,
 calories:logs.filter(x=>x.type==='meal').reduce((a,x)=>a+(x.calories ?? x.amount),0),
 protein:logs.filter(x=>x.type==='meal').reduce((a,x)=>a+(x.protein||0),0),
 fat:logs.filter(x=>x.type==='meal').reduce((a,x)=>a+(x.fat||0),0),
 carbs:logs.filter(x=>x.type==='meal').reduce((a,x)=>a+(x.carbs||0),0),
 burned:logs.filter(x=>x.type==='activity').reduce((a,x)=>a+(x.calories ?? x.amount),0),
 activityMinutes:logs.filter(x=>x.type==='activity').reduce((a,x)=>a+(x.duration || 0),0),
 meals:logs.filter(x=>x.type==='meal').map(x=>({id:x.id,title:x.title || 'Приём пищи',calories:x.calories ?? x.amount})),
 activities:logs.filter(x=>x.type==='activity').map(x=>({id:x.id,title:x.title || 'Активность',calories:x.calories ?? x.amount,duration:x.duration || 0}))})
})
app.post('/api/logs',auth,(req,res)=>{
 const {type,amount,goal,title,calories,duration,date,protein,fat,carbs}=req.body || {}
 if(!['water','sleep','meal','activity'].includes(type) || !Number.isFinite(Number(amount)) || Number(amount)<=0)
  return res.status(400).json({error:'Некорректные данные'})
 const logDate=String(date || today())
 if(!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) return res.status(400).json({error:'Некорректная дата'})
 const result=db.prepare('INSERT INTO daily_logs(user_id,type,amount,goal,title,calories,duration,date,protein,fat,carbs) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
  .run(req.user.id,type,Number(amount),goal?Number(goal):null,title || null,calories==null?null:Number(calories),duration==null?null:Number(duration),logDate,Number(protein)||0,Number(fat)||0,Number(carbs)||0)
 res.status(201).json(db.prepare('SELECT * FROM daily_logs WHERE id=?').get(result.lastInsertRowid))
})
app.patch('/api/goals',auth,(req,res)=>{
 const {waterGoal,sleepGoal}=req.body || {}
 for(const [type,goal] of [['water',waterGoal],['sleep',sleepGoal]]) if(goal!==undefined) {
  if(!Number.isFinite(Number(goal)) || Number(goal)<=0) return res.status(400).json({error:'Цель должна быть больше нуля'})
  const d=String(req.body.date || today())
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return res.status(400).json({error:'Некорректная дата'})
  db.prepare('INSERT INTO daily_logs(user_id,type,amount,goal,title,date) VALUES(?,?,0,?,?,?)').run(req.user.id,type,Number(goal),type==='water'?'Вода':'Сон',d)
 }
 res.json({ok:true})
})
app.get('/api/tasks',auth,(req,res)=>{
 res.json(db.prepare('SELECT id,text,1 AS points FROM user_tasks WHERE user_id=? ORDER BY id').all(req.user.id))
})
app.post('/api/tasks',auth,(req,res)=>{
 const text=String(req.body?.text||'').trim()
 if(!text||text.length>180) return res.status(400).json({error:'Название задачи должно содержать от 1 до 180 символов'})
 const result=db.prepare('INSERT INTO user_tasks(user_id,text,points) VALUES(?,?,1)').run(req.user.id,text)
 res.status(201).json({id:result.lastInsertRowid,text,points:1})
})
app.delete('/api/tasks/:id',auth,(req,res)=>{
 const result=db.prepare('DELETE FROM user_tasks WHERE id=? AND user_id=?').run(Number(req.params.id),req.user.id)
 if(!result.changes)return res.status(404).json({error:'Задача не найдена'})
 res.json({ok:true})
})
app.post('/api/tasks/:id/complete',auth,(req,res)=>{
 const complete=db.transaction(()=>{
  const task=db.prepare('SELECT id FROM user_tasks WHERE id=? AND user_id=?').get(Number(req.params.id),req.user.id)
  if(!task)return false
  db.prepare('UPDATE users SET points=points+1 WHERE id=?').run(req.user.id)
  db.prepare('DELETE FROM user_tasks WHERE id=? AND user_id=?').run(task.id,req.user.id)
  return true
 })
 if(!complete())return res.status(404).json({error:'Задача не найдена'})
 res.json({ok:true,awarded:1,points:db.prepare('SELECT points FROM users WHERE id=?').get(req.user.id).points})
})

app.get('/api/rating',auth,(req,res)=>{
 // Место всегда вычисляется по баллам: ручные ranking_position не влияют на порядок.
 const all=db.prepare('SELECT id,name,nickname,points FROM users ORDER BY points DESC, id ASC').all()
 const leaderboard=all.map((u,i)=>({rank:i+1,name:u.name,nickname:u.nickname,points:u.points||0,isMe:u.id===req.user.id}))
 const me=leaderboard.find(u=>u.isMe)
 res.json({rank:me?.rank||0,points:me?.points||0,leaderboard})
})
app.get('/api/friends',auth,(req,res)=>{
 const rows=db.prepare(`SELECT u.id,u.name,u.nickname,u.points, f.status, f.requester_id
 FROM friendships f JOIN users u ON u.id=CASE WHEN f.requester_id=? THEN f.addressee_id ELSE f.requester_id END
 WHERE (f.requester_id=? OR f.addressee_id=?) AND f.status='accepted'`).all(req.user.id,req.user.id,req.user.id)
 res.json(rows)
})
app.get('/api/friends/requests',auth,(req,res)=>{
 res.json(db.prepare(`SELECT f.id,f.requester_id,u.name,u.nickname,f.created_at FROM friendships f JOIN users u ON u.id=f.requester_id
 WHERE f.addressee_id=? AND f.status='pending' ORDER BY f.created_at DESC`).all(req.user.id))
})
app.get('/api/users/search',auth,(req,res)=>{
 const q=String(req.query.nickname||'').replace(/^@/,'').trim()
 if(q.length<2) return res.json([])
 res.json(db.prepare(`SELECT id,name,nickname FROM users WHERE id<>? AND nickname LIKE ? COLLATE NOCASE LIMIT 10`).all(req.user.id,`%${q}%`))
})
app.post('/api/friends/requests',auth,(req,res)=>{
 const target=Number(req.body.userId)
 if(!target || target===req.user.id || !db.prepare('SELECT id FROM users WHERE id=?').get(target)) return res.status(400).json({error:'Пользователь не найден'})
 const exists=db.prepare(`SELECT * FROM friendships WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)`).get(req.user.id,target,target,req.user.id)
 if(exists) return res.status(409).json({error:'Заявка или дружба уже существует'})
 db.prepare("INSERT INTO friendships(requester_id,addressee_id,status) VALUES(?,?,'pending')").run(req.user.id,target)
 res.status(201).json({ok:true})
})
app.patch('/api/friends/requests/:id',auth,(req,res)=>{
 const status=req.body.status
 if(!['accepted','rejected'].includes(status)) return res.status(400).json({error:'Некорректное действие'})
 const result=db.prepare('UPDATE friendships SET status=? WHERE id=? AND addressee_id=? AND status=?').run(status,Number(req.params.id),req.user.id,'pending')
 if(!result.changes) return res.status(404).json({error:'Заявка не найдена'})
 res.json({ok:true})
})
app.get('/api/chats/:userId',auth,(req,res)=>{
 const other=Number(req.params.userId)
 const friend=db.prepare(`SELECT id FROM friendships WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))`).get(req.user.id,other,other,req.user.id)
 if(!friend) return res.status(403).json({error:'Чат доступен только друзьям'})
 const rows=db.prepare(`SELECT m.id,m.sender_id,m.receiver_id,m.body,m.created_at,u.name AS sender_name FROM messages m JOIN users u ON u.id=m.sender_id WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY m.id LIMIT 200`).all(req.user.id,other,other,req.user.id)
 res.json(rows.map(m=>({...m,reactions:db.prepare('SELECT emoji,COUNT(*) AS count,GROUP_CONCAT(user_id) AS users FROM message_reactions WHERE message_id=? GROUP BY emoji').all(m.id).map(r=>{const users=r.users.split(',').map(Number);return {emoji:r.emoji,count:r.count,users,mine:users.includes(req.user.id)}})})))
})

app.post('/api/messages/:id/reactions',auth,(req,res)=>{
 const m=db.prepare('SELECT * FROM messages WHERE id=? AND (sender_id=? OR receiver_id=?)').get(Number(req.params.id),req.user.id,req.user.id)
 if(!m)return res.status(404).json({error:'Сообщение не найдено'})
 const emoji=String(req.body?.emoji||'').trim(); if(!['👍','❤️','😂','🔥','👏','😮','😢','💪'].includes(emoji))return res.status(400).json({error:'Недопустимая реакция'})
 const old=db.prepare('SELECT id FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=?').get(m.id,req.user.id,emoji)
 if(old)db.prepare('DELETE FROM message_reactions WHERE id=?').run(old.id);else db.prepare('INSERT INTO message_reactions(message_id,user_id,emoji) VALUES(?,?,?)').run(m.id,req.user.id,emoji)
 const reactions=db.prepare('SELECT emoji,COUNT(*) AS count,GROUP_CONCAT(user_id) AS users FROM message_reactions WHERE message_id=? GROUP BY emoji').all(m.id).map(r=>{const users=r.users.split(',').map(Number);return {emoji:r.emoji,count:r.count,users,mine:users.includes(req.user.id)}})
 res.json({reactions})
 const payload=JSON.stringify({type:'reaction',messageId:m.id,reactions})
 for(const uid of [m.sender_id,m.receiver_id]) for(const client of clients.get(uid)||[]) if(client.readyState===1) client.send(payload)
})

const clients=new Map()
const articleComment = id => db.prepare('SELECT c.id,c.body,c.created_at,u.name,u.nickname FROM article_comments c JOIN users u ON u.id=c.user_id WHERE c.id=?').get(id)
const articleState = (articleId,userId) => ({type:'article:state',articleId,liked:!!db.prepare('SELECT id FROM article_likes WHERE article_id=? AND user_id=?').get(articleId,userId),likes:db.prepare('SELECT COUNT(*) AS count FROM article_likes WHERE article_id=?').get(articleId).count,comments:db.prepare('SELECT c.id,c.body,c.created_at,u.name,u.nickname FROM article_comments c JOIN users u ON u.id=c.user_id WHERE c.article_id=? ORDER BY c.id DESC LIMIT 100').all(articleId)})
const broadcastArticle = (articleId,payload) => { const msg=JSON.stringify(payload); for(const set of clients.values()) for(const client of set) if(client.readyState===1 && client.articleId===articleId) client.send(msg) }
server.on('upgrade',(req,socket,head)=>{
 const url=new URL(req.url,'http://localhost')
 if(url.pathname!=='/ws'){socket.destroy();return}
 try { const user=jwt.verify(url.searchParams.get('token')||'',SECRET); wss.handleUpgrade(req,socket,head,ws=>{ws.userId=user.id;wss.emit('connection',ws,req)}) }
 catch { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');socket.destroy() }
})
wss.on('connection',ws=>{
 const id=ws.userId
 if(!clients.has(id)) clients.set(id,new Set())
 clients.get(id).add(ws)
 ws.on('message',raw=>{
  try {
   const data=JSON.parse(raw.toString())
   if(data.type==='article:subscribe') {
    const slug=String(data.slug||''); const article=db.prepare('SELECT id FROM articles WHERE slug=?').get(slug)
    if(!article)return
    ws.articleId=article.id
    ws.send(JSON.stringify(articleState(article.id,id)))
    return
   }
   if(data.type==='article:like') {
    const article=db.prepare('SELECT id FROM articles WHERE slug=?').get(String(data.slug||'')); if(!article)return
    const old=db.prepare('SELECT id FROM article_likes WHERE article_id=? AND user_id=?').get(article.id,id)
    if(old)db.prepare('DELETE FROM article_likes WHERE id=?').run(old.id);else db.prepare('INSERT INTO article_likes(article_id,user_id) VALUES(?,?)').run(article.id,id)
    const state=articleState(article.id,id)
    broadcastArticle(article.id,{type:'article:like',articleId:article.id,userId:id,liked:state.liked,likes:state.likes})
    return
   }
   if(data.type==='article:comment') {
    const article=db.prepare('SELECT id FROM articles WHERE slug=?').get(String(data.slug||'')), body=String(data.body||'').trim()
    if(!article||!body||body.length>2000)return
    const result=db.prepare('INSERT INTO article_comments(article_id,user_id,body) VALUES(?,?,?)').run(article.id,id,body)
    broadcastArticle(article.id,{type:'article:comment',articleId:article.id,comment:articleComment(result.lastInsertRowid)})
    return
   }
   const receiver=Number(data.receiverId), body=String(data.body||'').trim()
   if(!receiver||!body||body.length>2000)return
   const friend=db.prepare(`SELECT id FROM friendships WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))`).get(id,receiver,receiver,id)
   if(!friend)return
   const result=db.prepare('INSERT INTO messages(sender_id,receiver_id,body) VALUES(?,?,?)').run(id,receiver,body)
   const msg={...db.prepare('SELECT id,sender_id,receiver_id,body,created_at FROM messages WHERE id=?').get(result.lastInsertRowid),reactions:[]}
   for(const uid of [id,receiver]) for(const client of clients.get(uid)||[]) if(client.readyState===1) client.send(JSON.stringify({type:'message',message:msg}))
  } catch {}
 })
 ws.on('close',()=>{clients.get(id)?.delete(ws);if(!clients.get(id)?.size)clients.delete(id)})
})
server.listen(PORT,()=>console.log(`NovFit API + WebSocket: http://localhost:${PORT}`))
