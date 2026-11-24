import bcrypt from 'bcryptjs'
import { db } from './db.js'

// Демонстрационные пользователи создаются один раз.
let users = db.prepare('SELECT id,nickname FROM users ORDER BY id').all()
if (!users.length) {
 const hash = bcrypt.hashSync('password123', 10)
 const insert = db.prepare('INSERT INTO users(name,nickname,email,password_hash) VALUES(?,?,?,?)')
 const ids = [
  insert.run('Анна Смирнова','anna_fit','anna@novfit.demo',hash).lastInsertRowid,
  insert.run('Иван Петров','ivan_run','ivan@novfit.demo',hash).lastInsertRowid,
  insert.run('Мария Ким','maria_yoga','maria@novfit.demo',hash).lastInsertRowid,
  insert.run('Алексей Волков','alex_gym','alex@novfit.demo',hash).lastInsertRowid
 ]
 db.prepare("INSERT INTO friendships(requester_id,addressee_id,status) VALUES(?,?, 'accepted')").run(ids[0],ids[1])
 db.prepare("INSERT INTO friendships(requester_id,addressee_id,status) VALUES(?,?, 'pending')").run(ids[2],ids[0])
 db.prepare("INSERT INTO messages(sender_id,receiver_id,body) VALUES(?,?,?)").run(ids[1],ids[0],'Привет! Пойдём тренироваться?')
 users = db.prepare('SELECT id,nickname FROM users ORDER BY id').all()
}

// Фиксируем демонстрационное место Анны в рейтинге.
db.prepare("UPDATE users SET points=51, ranking_position=NULL WHERE nickname='anna_fit'").run()

// Наполняем демо-аккаунт разными значениями на каждый день текущей и предыдущей недели.
// Проверка по title+date делает сидер безопасным при каждом перезапуске сервера.
const demo = users.find(u => u.nickname === 'anna_fit') || users[0]
if (demo) {
 // Для уже существующих демо-записей предыдущих версий добавляем макронутриенты.
 db.prepare("UPDATE daily_logs SET protein=65+(id%5)*7, fat=48+(id%4)*6, carbs=150+(id%6)*12 WHERE user_id=? AND type='meal' AND protein=0 AND fat=0 AND carbs=0").run(demo.id)
 const insertLog = db.prepare(`INSERT INTO daily_logs(user_id,type,amount,goal,title,calories,duration,date,protein,fat,carbs)
 VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
 const exists = db.prepare('SELECT 1 FROM daily_logs WHERE user_id=? AND date=? LIMIT 1')
 const today = new Date()
 const monday = new Date(today)
 const day = (today.getDay() + 6) % 7
 monday.setDate(today.getDate() - day - 7) // две недели, включая текущую
 monday.setHours(12,0,0,0)
 const water = [1.4,1.8,2.1,1.2,1.7,2.3,1.9,1.6,2.0,1.5,2.2,1.8,2.4,1.7]
 const sleep = [6.5,7.2,8,6.8,7.5,8.4,7.8,7.1,8.2,6.9,7.7,8.5,7.3,8]
 const calories = [1450,1680,1520,1390,1810,1950,1600,1490,1720,1580,1880,1650,2010,1540]
 const burn = [180,240,310,120,260,420,190,210,280,150,350,290,460,220]
 for (let i=0;i<14;i++) {
  const d=new Date(monday); d.setDate(monday.getDate()+i)
  const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  if (exists.get(demo.id,date)) continue
  const suffix=`Демо: ${i+1}`
  insertLog.run(demo.id,'water',water[i],2,'Вода',null,null,date,0,0,0)
  insertLog.run(demo.id,'sleep',sleep[i],8,'Сон',null,null,date,0,0,0)
  insertLog.run(demo.id,'meal',calories[i],null,['Завтрак','Обед','Ужин','Другое'][i%4],calories[i],null,date,65+(i%5)*7,48+(i%4)*6,150+(i%6)*12)
  insertLog.run(demo.id,'activity',burn[i],null,`${suffix} тренировка`,burn[i],20+(i%4)*10,date,0,0,0)
 }
}


// Библиотека материалов: тексты, метаданные и URL обложек хранятся в SQLite.
const articles = [
 {slug:'sport-health',title:'Спорт — ключ к здоровью и энергии',category:'Здоровье',read_minutes:5,excerpt:'Регулярная физическая активность помогает поддерживать хорошее самочувствие, укрепляет организм и положительно влияет на настроение.',author:'Анна Петрова',image_url:'https://mytimefitness.ru/storage/app/media/TrainingAerobics/Functional.jpg',body:'Регулярное движение помогает поддерживать здоровье сердца, выносливость и эмоциональное равновесие. Не обязательно начинать с интенсивных тренировок: прогулка, велосипед или короткая зарядка уже помогают сформировать полезную привычку.\n\nВыбирайте нагрузку по самочувствию, увеличивайте её постепенно и оставляйте время на восстановление. Последовательность важнее разовых рекордов.\n\nНачните с небольшого шага: 15–20 минут активности сегодня — хорошая основа для устойчивого результата.'},
 {slug:'balanced-nutrition',title:'Сбалансированное питание без строгих диет',category:'Питание',read_minutes:6,excerpt:'Как собрать разнообразный рацион, поддерживать энергию и не превращать питание в бесконечный подсчёт запретов.',author:'Мария Ким',image_url:'https://avatars.mds.yandex.net/i?id=113eb81792bc9c281aebe3bf6f25a64e_l-5911686-images-thumbs&n=13',body:'Сбалансированный рацион строится на разнообразии. Старайтесь включать в основные приёмы пищи источник белка, овощи или фрукты, сложные углеводы и полезные жиры.\n\nНе существует единственного идеального меню для всех. Учитывайте привычки, доступность продуктов, активность и индивидуальные потребности. Регулярность и удобство помогают придерживаться выбранного подхода дольше.'},
 {slug:'sleep-recovery',title:'Сон и восстановление: часть тренировочного плана',category:'Восстановление',read_minutes:4,excerpt:'Почему отдых важен не меньше нагрузки и какие вечерние привычки помогают наладить режим.',author:'Дмитрий Соколов',image_url:'https://i.pinimg.com/originals/48/09/5f/48095f13ec2a415f1feb7b792870c4f8.jpg',body:'Во время отдыха организм восстанавливается после повседневных нагрузок и тренировок. Старайтесь ложиться и вставать примерно в одно время, проветривать спальню и уменьшать яркость экранов перед сном.\n\nЕсли тренировки стали даваться тяжелее, а усталость накапливается, пересмотрите объём нагрузки и уделите внимание восстановлению.'},
 {slug:'strength-basics',title:'Силовые тренировки: с чего начать новичку',category:'Тренировки',read_minutes:7,excerpt:'Базовые принципы безопасного старта: техника, постепенность и разумный график.',author:'Алексей Волков',image_url:'https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTAxL3Jhd3BpeGVsX29mZmljZV80Nl9jbG9zZV91cF9zaG90X3Bob3RvX29mX2d5bV9lcXVpcG1lbnRfZm9yX3dvcl8zNzRlNTZiZi0yZWJlLTRjMDUtYWY3OS1iNzNhZWQxY2Y4YzBfMS5qcGc.jpg',body:'Начните с движений, которые легко контролировать: приседаний к опоре, отжиманий от стены, ягодичного моста и тяг с лёгким сопротивлением. Освойте технику до увеличения веса.\n\nОставляйте между тяжёлыми тренировками время на восстановление. Если упражнение вызывает боль, остановитесь и подберите более комфортный вариант.'},
 {slug:'water-habit',title:'Вода и активность: как не забывать пить',category:'Здоровье',read_minutes:3,excerpt:'Простые способы отслеживать питьевой режим и учитывать индивидуальные потребности.',author:'Анна Петрова',image_url:'https://avatars.mds.yandex.net/i?id=a47b6320906005f95f828172ad013d89_l-10952687-images-thumbs&n=13',body:'Потребность в жидкости зависит от активности, температуры, питания и индивидуальных особенностей. Держите воду под рукой и делайте небольшие перерывы на питьё в течение дня.\n\nВо время продолжительной активности и в жару потребность может меняться. Ориентируйтесь на самочувствие и рекомендации специалиста, если у вас есть ограничения по жидкости.'},
 {slug:'stretching',title:'Растяжка после тренировки: мягкое завершение',category:'Мобильность',read_minutes:5,excerpt:'Небольшая спокойная последовательность движений для завершения занятия.',author:'Мария Ким',image_url:'https://static.tildacdn.com/tild3433-6231-4465-a561-356337353565/cover_1.jpg',body:'После занятия можно уделить несколько минут спокойным движениям с комфортной амплитудой. Дышите ровно, не пружиньте и не пытайтесь через силу увеличить диапазон.\n\nРастяжка должна ощущаться как мягкое натяжение, а не боль. Подберите движения для тех групп мышц, которые работали во время тренировки.'},
 {slug:'walking-benefits',title:'Ежедневная ходьба — простой способ быть активнее',category:'Активность',read_minutes:4,excerpt:'Как добавить больше движения в обычный день без сложного оборудования и расписания.',author:'Дмитрий Соколов',image_url:'https://mytimefitness.ru/storage/app/media/TrainingAerobics/Functional.jpg',body:'Ходьба легко встраивается в повседневность: пройдите одну остановку пешком, выберите лестницу или устройте короткую прогулку после обеда.\n\nНачните с привычного объёма и постепенно добавляйте несколько минут. Удобная обувь и комфортный темп помогут сделать прогулки регулярными.'},
 {slug:'training-plan',title:'Как составить реалистичный план тренировок',category:'Планирование',read_minutes:6,excerpt:'План, который учитывает ваш график, уровень подготовки и дни восстановления.',author:'Алексей Волков',image_url:'https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTAxL3Jhd3BpeGVsX29mZmljZV80Nl9jbG9zZV91cF9zaG90X3Bob3RvX29mX2d5bV9lcXVpcG1lbnRfZm9yX3dvcl8zNzRlNTZiZi0yZWJlLTRjMDUtYWY3OS1iNzNhZWQxY2Y4YzBfMS5qcGc.jpg',body:'Хороший план — тот, которому реально следовать. Запланируйте несколько коротких занятий, чередуйте типы нагрузки и заранее определите дни отдыха.\n\nОценивайте не только интенсивность, но и общее самочувствие. Если неделя оказалась загруженной, сократите тренировку, а не отказывайтесь от движения совсем.'},
 {slug:'protein-basics',title:'Белки, жиры и углеводы: роль макронутриентов',category:'Питание',read_minutes:6,excerpt:'Коротко о том, зачем организму нужны основные макронутриенты и почему важен баланс.',author:'Мария Ким',image_url:'https://avatars.mds.yandex.net/i?id=113eb81792bc9c281aebe3bf6f25a64e_l-5911686-images-thumbs&n=13',body:'Белки участвуют в построении и восстановлении тканей, жиры нужны для нормальной работы организма, а углеводы служат важным источником энергии.\n\nСоотношение макронутриентов зависит от целей, активности и индивидуальных особенностей. Не стоит исключать целые группы продуктов без медицинских показаний.'},
 {slug:'warmup',title:'Разминка перед занятием: подготовьте тело',category:'Тренировки',read_minutes:4,excerpt:'Несколько минут постепенного движения помогут плавно перейти к основной части занятия.',author:'Дмитрий Соколов',image_url:'https://mytimefitness.ru/storage/app/media/TrainingAerobics/Functional.jpg',body:'Начинайте тренировку с лёгкого движения: ходьбы на месте, вращений плечами и суставной разминки. Затем добавьте простые варианты движений, которые будут в основной части занятия.\n\nРазминка должна постепенно повышать интенсивность, но не утомлять. Подбирайте её под предстоящую нагрузку.'}
]
const upsertArticle = db.prepare(`INSERT INTO articles(slug,title,category,read_minutes,excerpt,author,body,image_url)
 VALUES(@slug,@title,@category,@read_minutes,@excerpt,@author,@body,@image_url)
 ON CONFLICT(slug) DO UPDATE SET title=excluded.title,category=excluded.category,read_minutes=excluded.read_minutes,
 excerpt=excluded.excerpt,author=excluded.author,body=excluded.body,image_url=excluded.image_url`)
const seedArticles = db.transaction(rows => rows.forEach(row => upsertArticle.run(row)))
seedArticles(articles)

const videos = [
 {slug:'home-cardio-30',title:'Кардио дома за 30 минут',description:'Тренировка без оборудования: кардио-комплекс для дома.',duration:'30:00',author:'Improved Health',cover_url:'https://static.tildacdn.com/tild3433-6231-4465-a561-356337353565/cover_1.jpg',youtube_id:'pjn8OOC1b0Q'},
 {slug:'full-body-cardio',title:'Интенсивное кардио на всё тело',description:'Полноценная кардио-тренировка без дополнительного оборудования.',duration:'30:00',author:'Caroline Girvan',cover_url:'https://avatars.mds.yandex.net/i?id=021636132306ddc5af89ba001507da21_l-9220607-images-thumbs&n=13',youtube_id:'kZDvg92tTMc'},
 {slug:'functional-training',title:'Функциональная тренировка',description:'Динамичные упражнения для всего тела и общей выносливости.',duration:'25:00',author:'NovFit',cover_url:'https://avatars.mds.yandex.net/i?id=b69c6646f261721a289b95e0cd4d2db2_l-3548415-images-thumbs&n=13',youtube_id:'4l8ERXukrkA'},
 {slug:'beginner-strength',title:'Силовая тренировка для начинающих',description:'Базовые упражнения с собственным весом и спокойным темпом.',duration:'20:00',author:'Tom Peto Training',cover_url:'https://ameditransincorporated.one/wp-content/uploads/2025/12/www-54-768x491-1.png',youtube_id:'u6mQWV1Tp9o'}
]
const upsertVideo = db.prepare(`INSERT INTO videos(slug,title,description,duration,author,cover_url,youtube_id)
 VALUES(@slug,@title,@description,@duration,@author,@cover_url,@youtube_id)
 ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,duration=excluded.duration,
 author=excluded.author,cover_url=excluded.cover_url,youtube_id=excluded.youtube_id`)
db.transaction(rows => rows.forEach(row => upsertVideo.run(row)))(videos)


// Скачиваем обложки и сохраняем бинарные файлы в SQLite. Если внешний хост временно
// недоступен, приложение продолжит использовать исходный URL из записи материала.
const allCoverUrls = [...new Set([...articles.map(x=>x.image_url), ...videos.map(x=>x.cover_url)])]
const insertAsset = db.prepare('INSERT OR IGNORE INTO media_assets(source_url) VALUES(?)')
for (const url of allCoverUrls) insertAsset.run(url)
const assetForUrl = db.prepare('SELECT id,image_data FROM media_assets WHERE source_url=?')
const updateArticleAsset = db.prepare('UPDATE articles SET image_asset_id=? WHERE image_url=?')
const updateVideoAsset = db.prepare('UPDATE videos SET image_asset_id=? WHERE cover_url=?')
for (const url of allCoverUrls) {
 const asset = assetForUrl.get(url)
 updateArticleAsset.run(asset.id,url)
 updateVideoAsset.run(asset.id,url)
}
await Promise.all(allCoverUrls.map(async url => {
 const asset = assetForUrl.get(url)
 if (asset.image_data) return
 try {
  const response = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 NovFit/1.0'}, signal:AbortSignal.timeout(6000)})
  if (!response.ok) return
  const type = response.headers.get('content-type') || 'image/jpeg'
  if (!type.startsWith('image/')) return
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) return
  db.prepare('UPDATE media_assets SET image_data=?,content_type=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(bytes,type,asset.id)
 } catch (error) { console.warn(`Не удалось сохранить обложку ${url}: ${error.message}`) }
}))
