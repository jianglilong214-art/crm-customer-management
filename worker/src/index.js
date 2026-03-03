import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'

const JWT_SECRET = 'crm_secret_key_2024'

const app = new Hono()

app.use('*', cors())

// ==================== Auth Middleware ====================
app.use('/api/*', async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/auth') || path.startsWith('/api/setup')) {
    return next()
  }
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ code: 401, message: '未登录' }, 401)
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = await verify(token, JWT_SECRET, 'HS256')
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ code: 401, message: 'Token已过期' }, 401)
  }
})

// ==================== Setup / Seed ====================
app.get('/api/setup', async (c) => {
  const db = c.env.DB
  const check = await db.prepare('SELECT COUNT(*) as count FROM users').first()
  if (check.count > 0) {
    return c.json({ code: 200, message: '数据库已初始化，如需重新初始化请先清空数据' })
  }

  const hashedPassword = bcrypt.hashSync('123456', 10)

  // Users
  await db.batch([
    db.prepare('INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)').bind('admin', hashedPassword, '管理员', '13800000000', 'admin', '管理部'),
    db.prepare('INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)').bind('zhangsan', hashedPassword, '张三', '13800000001', 'manager', '销售一部'),
    db.prepare('INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)').bind('lisi', hashedPassword, '李四', '13800000002', 'sales', '销售一部'),
    db.prepare('INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)').bind('wangwu', hashedPassword, '王五', '13800000003', 'sales', '销售二部'),
    db.prepare('INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)').bind('zhaoliu', hashedPassword, '赵六', '13800000004', 'sales', '销售二部'),
  ])

  // Customers
  const customers = [
    ['王先生', '18900001111', '男', 35, 'A', '网络推广', '北京市朝阳区建国路88号', '北京', '北京', '朝阳区', '对三居室感兴趣', 'signed', 1],
    ['李女士', '18900002222', '女', 28, 'A', '门店来访', '上海市浦东新区陆家嘴', '上海', '上海', '浦东新区', '预算200万左右', 'followed', 2],
    ['张先生', '18900003333', '男', 42, 'B', '朋友推荐', '广州市天河区珠江新城', '广东', '广州', '天河区', '想了解学区房', 'potential', 3],
    ['刘女士', '18900004444', '女', 31, 'B', '电话营销', '深圳市南山区科技园', '广东', '深圳', '南山区', '首套房需求', 'followed', 3],
    ['陈先生', '18900005555', '男', 45, 'A', '网络推广', '杭州市西湖区文三路', '浙江', '杭州', '西湖区', '投资需求，多套', 'signed', 2],
    ['赵女士', '18900006666', '女', 33, 'C', '门店来访', '成都市武侯区天府大道', '四川', '成都', '武侯区', '刚开始了解', 'potential', 4],
    ['孙先生', '18900007777', '男', 38, 'B', '朋友推荐', '武汉市江汉区解放大道', '湖北', '武汉', '江汉区', '改善型需求', 'followed', 4],
    ['周女士', '18900008888', '女', 26, 'C', '电话营销', '南京市鼓楼区中山路', '江苏', '南京', '鼓楼区', '暂无购房计划', 'potential', 1],
    ['吴先生', '18900009999', '男', 50, 'A', '网络推广', '重庆市渝北区新牌坊', '重庆', '重庆', '渝北区', '商铺投资', 'signed', 2],
    ['郑女士', '18900001010', '女', 29, 'B', '门店来访', '天津市和平区南京路', '天津', '天津', '和平区', '婚房需求', 'followed', 3],
    ['黄先生', '18900001111', '男', 41, 'C', '电话营销', '西安市雁塔区小寨', '陕西', '西安', '雁塔区', '了解价格', 'potential', 1],
    ['何女士', '18900001212', '女', 36, 'A', '朋友推荐', '苏州市工业园区金鸡湖', '江苏', '苏州', '工业园区', '别墅需求', 'followed', 4],
  ]
  await db.batch(customers.map(c =>
    db.prepare('INSERT INTO customers (name, phone, gender, age, intention_level, source, address, province, city, district, remark, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(...c)
  ))

  // Customer follows
  const follows = [
    [1, 1, '客户来电咨询三居室户型，已发送户型图', 'phone'],
    [1, 1, '客户到店看房，对A栋1502很满意', 'visit'],
    [1, 1, '客户已签约A栋1502，总价280万', 'visit'],
    [2, 2, '电话沟通，客户预算200万，推荐了B栋小户型', 'phone'],
    [2, 2, '带客户实地看了3套房源', 'visit'],
    [3, 3, '初次接触，客户对学区房有强烈需求', 'phone'],
    [4, 3, '微信沟通，发送了项目资料', 'wechat'],
    [5, 2, '老客户推荐，客户资金充裕', 'phone'],
    [5, 2, '带客户看了商铺和住宅，签约2套', 'visit'],
    [6, 4, '初次来电，了解项目基本情况', 'phone'],
    [7, 4, '客户到店，重点介绍了改善型产品', 'visit'],
    [9, 2, '客户是企业主，投资商铺3间', 'visit'],
    [10, 3, '年轻夫妻，看了婚房户型', 'visit'],
    [12, 4, '客户要求看别墅区，预约周末看房', 'phone'],
  ]
  await db.batch(follows.map(f =>
    db.prepare('INSERT INTO customer_follows (customer_id, user_id, content, follow_type) VALUES (?, ?, ?, ?)').bind(...f)
  ))

  // Messages
  const msgs = [
    [1, '系统升级通知', 'CRM系统已升级至最新版本，新增团队竞赛功能。', 'system'],
    [1, '新客户分配', '系统已为您分配新客户"周女士"，请及时跟进。', 'customer'],
    [2, '业绩提醒', '本月已签约3单，距离目标还差2单，继续加油！', 'performance'],
    [2, '新客户分配', '系统已为您分配新客户"吴先生"，请及时跟进。', 'customer'],
    [3, '培训通知', '本周五下午3点，销售技巧培训，请准时参加。', 'system'],
    [3, '客户跟进提醒', '客户"张先生"已3天未跟进，请及时联系。', 'reminder'],
    [4, '业绩提醒', '恭喜本月签约业绩排名第二！', 'performance'],
    [1, '月度总结', '本月团队总签约金额突破1000万，再创新高！', 'system'],
  ]
  await db.batch(msgs.map(m =>
    db.prepare('INSERT INTO messages (user_id, title, content, type) VALUES (?, ?, ?, ?)').bind(...m)
  ))

  // Teams
  await db.batch([
    db.prepare('INSERT INTO teams (name, leader_id, member_count) VALUES (?, ?, ?)').bind('猛虎队', 2, 2),
    db.prepare('INSERT INTO teams (name, leader_id, member_count) VALUES (?, ?, ?)').bind('雄鹰队', 4, 2),
    db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').bind(1, 2),
    db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').bind(1, 3),
    db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').bind(2, 4),
    db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').bind(2, 5),
  ])

  // Projects
  await db.batch([
    db.prepare('INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').bind('翡翠湾花园', '高端住宅项目，共12栋，1200户', '北京市朝阳区东四环', 'active', '2025-01-01', '2026-12-31'),
    db.prepare('INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').bind('阳光城商业广场', '商业综合体项目，含写字楼和商铺', '上海市浦东新区世纪大道', 'active', '2025-06-01', '2027-06-30'),
    db.prepare('INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').bind('学府名苑', '学区房项目，紧邻重点学校', '广州市天河区华师附近', 'completed', '2024-01-01', '2025-12-31'),
    db.prepare('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)').bind(1, '项目启动', '翡翠湾花园项目正式启动销售', 'milestone', 1),
    db.prepare('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)').bind(1, '开盘活动', '首批100套房源开盘，当日去化率85%', 'event', 1),
    db.prepare('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)').bind(1, '月度总结', '本月新增客户200组，签约15套', 'report', 2),
    db.prepare('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)').bind(2, '项目启动', '阳光城商业广场开始预售', 'milestone', 1),
    db.prepare('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)').bind(2, '招商进展', '已签约入驻品牌30个', 'info', 2),
  ])

  // Talents
  const talents = [
    ['张明', '17700001111', '男', '本科', '北京大学', '市场营销', '3年房产销售经验', 'available', null, '沟通能力强'],
    ['李华', '17700002222', '女', '硕士', '清华大学', '金融学', '5年金融行业经验', 'available', null, '有丰富的客户资源'],
    ['王磊', '17700003333', '男', '本科', '浙江大学', '工商管理', '2年销售经验', 'assigned', 2, '执行力强'],
    ['陈静', '17700004444', '女', '大专', '上海商学院', '电子商务', '1年电商经验', 'available', null, '熟悉网络营销'],
    ['刘洋', '17700005555', '男', '本科', '武汉大学', '土木工程', '4年房产行业经验', 'assigned', 4, '技术背景，专业性强'],
  ]
  await db.batch(talents.map(t =>
    db.prepare('INSERT INTO talents (name, phone, gender, education, school, major, experience, status, assigned_to, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(...t)
  ))

  // Attendance & work logs & salary (dynamic seed data)
  const today = new Date()
  const attendanceBatch = []
  const worklogBatch = []
  for (let i = 0; i < 10; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (d.getDay() === 0 || d.getDay() === 6) continue
    for (let uid = 1; uid <= 5; uid++) {
      const signIn = `${dateStr} 0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      const signOut = `${dateStr} ${17 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      const status = Math.random() > 0.9 ? 'late' : 'normal'
      attendanceBatch.push(
        db.prepare('INSERT INTO attendance (user_id, sign_in_time, sign_out_time, location, status, date) VALUES (?, ?, ?, ?, ?, ?)').bind(uid, signIn, signOut, '公司总部', status, dateStr)
      )
    }
  }
  for (let uid = 1; uid <= 4; uid++) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      worklogBatch.push(
        db.prepare('INSERT INTO work_logs (user_id, content, customer_count, call_count, visit_count, date) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(uid, `今日工作：拜访客户${2 + i}组，电话沟通${5 + i}人，整理客户资料`, 2 + i, 5 + i, 1 + Math.floor(i / 2), dateStr)
      )
    }
  }
  await db.batch([...attendanceBatch, ...worklogBatch])

  // Salary records
  const salaryBatch = []
  for (let uid = 1; uid <= 5; uid++) {
    for (let m = 1; m <= 2; m++) {
      const base = uid === 1 ? 15000 : uid === 2 ? 10000 : 6000
      const commission = Math.floor(Math.random() * 10000) + 2000
      const bonus = Math.floor(Math.random() * 3000)
      const deduction = Math.floor(Math.random() * 500)
      const total = base + commission + bonus - deduction
      salaryBatch.push(
        db.prepare('INSERT INTO salary_records (user_id, base_salary, commission, bonus, deduction, total, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(uid, base, commission, bonus, deduction, total, m, 2026)
      )
    }
  }
  // Team scores
  for (let tid = 1; tid <= 2; tid++) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      salaryBatch.push(
        db.prepare('INSERT INTO team_scores (team_id, score, customer_count, sign_count, date) VALUES (?, ?, ?, ?, ?)')
          .bind(tid, Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 3), dateStr)
      )
    }
  }
  await db.batch(salaryBatch)

  return c.json({ code: 200, message: '数据库初始化成功！默认账号: admin/123456, zhangsan/123456, lisi/123456, wangwu/123456, zhaoliu/123456' })
})

// ==================== Auth Routes ====================
app.post('/api/auth/login', async (c) => {
  const db = c.env.DB
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ code: 400, message: '请输入用户名和密码' })

  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
  if (!user) return c.json({ code: 400, message: '用户不存在' })

  if (!bcrypt.compareSync(password, user.password)) {
    return c.json({ code: 400, message: '密码错误' })
  }

  const token = await sign(
    { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
    JWT_SECRET,
    'HS256'
  )
  const { password: _, ...userInfo } = user
  return c.json({ code: 200, data: { token, user: userInfo }, message: '登录成功' })
})

app.post('/api/auth/register', async (c) => {
  const db = c.env.DB
  const { username, password, name, phone } = await c.req.json()
  if (!username || !password || !name) return c.json({ code: 400, message: '请填写完整信息' })

  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (existing) return c.json({ code: 400, message: '用户名已存在' })

  const hashed = bcrypt.hashSync(password, 10)
  await db.prepare('INSERT INTO users (username, password, name, phone) VALUES (?, ?, ?, ?)').bind(username, hashed, name, phone || '').run()
  return c.json({ code: 200, message: '注册成功' })
})

app.post('/api/auth/change-password', async (c) => {
  const db = c.env.DB
  const { userId, oldPassword, newPassword } = await c.req.json()
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user) return c.json({ code: 400, message: '用户不存在' })

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return c.json({ code: 400, message: '原密码错误' })
  }
  const hashed = bcrypt.hashSync(newPassword, 10)
  await db.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashed, userId).run()
  return c.json({ code: 200, message: '密码修改成功' })
})

// ==================== Customer Routes ====================
app.get('/api/customers', async (c) => {
  const db = c.env.DB
  const { keyword, status, intention_level, source, page = '1', pageSize = '10' } = c.req.query()
  let where = []
  let params = []

  if (keyword) {
    where.push('(c.name LIKE ? OR c.phone LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  if (status) { where.push('c.status = ?'); params.push(status) }
  if (intention_level) { where.push('c.intention_level = ?'); params.push(intention_level) }
  if (source) { where.push('c.source = ?'); params.push(source) }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  const { total } = await db.prepare(`SELECT COUNT(*) as total FROM customers c ${whereClause}`).bind(...params).first()
  const { results: list } = await db.prepare(
    `SELECT c.*, u.name as owner_name FROM customers c LEFT JOIN users u ON c.owner_id = u.id ${whereClause} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(pageSize), offset).all()

  return c.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

app.get('/api/customers/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const customer = await db.prepare('SELECT c.*, u.name as owner_name FROM customers c LEFT JOIN users u ON c.owner_id = u.id WHERE c.id = ?').bind(id).first()
  if (!customer) return c.json({ code: 404, message: '客户不存在' })

  const { results: follows } = await db.prepare('SELECT cf.*, u.name as user_name FROM customer_follows cf LEFT JOIN users u ON cf.user_id = u.id WHERE cf.customer_id = ? ORDER BY cf.created_at DESC').bind(id).all()
  return c.json({ code: 200, data: { ...customer, follows } })
})

app.post('/api/customers', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { name, phone, gender, age, intention_level, source, address, province, city, district, remark, status } = await c.req.json()
  const { meta } = await db.prepare(
    'INSERT INTO customers (name, phone, gender, age, intention_level, source, address, province, city, district, remark, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(name, phone || '', gender || '', age || 0, intention_level || 'C', source || '', address || '', province || '', city || '', district || '', remark || '', status || 'potential', user.id).run()
  return c.json({ code: 200, data: { id: meta.last_row_id }, message: '添加成功' })
})

app.put('/api/customers/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const { name, phone, gender, age, intention_level, source, address, province, city, district, remark, status } = await c.req.json()
  await db.prepare(
    'UPDATE customers SET name=?, phone=?, gender=?, age=?, intention_level=?, source=?, address=?, province=?, city=?, district=?, remark=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(name, phone || '', gender || '', age || 0, intention_level || 'C', source || '', address || '', province || '', city || '', district || '', remark || '', status || 'potential', id).run()
  return c.json({ code: 200, message: '更新成功' })
})

app.delete('/api/customers/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  await db.batch([
    db.prepare('DELETE FROM customer_follows WHERE customer_id = ?').bind(id),
    db.prepare('DELETE FROM customers WHERE id = ?').bind(id),
  ])
  return c.json({ code: 200, message: '删除成功' })
})

app.post('/api/customers/:id/follow', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const id = parseInt(c.req.param('id'))
  const { content, follow_type, next_follow_time } = await c.req.json()
  await db.batch([
    db.prepare('INSERT INTO customer_follows (customer_id, user_id, content, follow_type, next_follow_time) VALUES (?, ?, ?, ?, ?)').bind(id, user.id, content, follow_type || 'phone', next_follow_time || null),
    db.prepare('UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id),
  ])
  return c.json({ code: 200, message: '跟进记录添加成功' })
})

app.post('/api/customers/:id/assign', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const { owner_id } = await c.req.json()
  await db.prepare('UPDATE customers SET owner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(owner_id, id).run()
  return c.json({ code: 200, message: '分配成功' })
})

// ==================== Message Routes ====================
app.get('/api/messages', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { type, page = '1', pageSize = '20' } = c.req.query()
  let where = 'WHERE m.user_id = ?'
  let params = [user.id]
  if (type) { where += ' AND m.type = ?'; params.push(type) }

  const offset = (parseInt(page) - 1) * parseInt(pageSize)
  const { total } = await db.prepare(`SELECT COUNT(*) as total FROM messages m ${where}`).bind(...params).first()
  const { results: list } = await db.prepare(`SELECT * FROM messages m ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...params, parseInt(pageSize), offset).all()
  const { unread } = await db.prepare('SELECT COUNT(*) as unread FROM messages WHERE user_id = ? AND is_read = 0').bind(user.id).first()

  return c.json({ code: 200, data: { list, total, unread } })
})

app.get('/api/messages/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  await db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').bind(id).run()
  const msg = await db.prepare('SELECT * FROM messages WHERE id = ?').bind(id).first()
  if (!msg) return c.json({ code: 404, message: '消息不存在' })
  return c.json({ code: 200, data: msg })
})

app.post('/api/messages/read-all', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  await db.prepare('UPDATE messages SET is_read = 1 WHERE user_id = ?').bind(user.id).run()
  return c.json({ code: 200, message: '已全部标为已读' })
})

// ==================== Attendance Routes ====================
app.get('/api/attendance', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { month, year, page = '1', pageSize = '31' } = c.req.query()
  let where = 'WHERE user_id = ?'
  let params = [user.id]
  if (year && month) {
    where += ' AND date LIKE ?'
    params.push(`${year}-${String(month).padStart(2, '0')}%`)
  }
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  const { results: list } = await db.prepare(`SELECT * FROM attendance ${where} ORDER BY date DESC LIMIT ? OFFSET ?`).bind(...params, parseInt(pageSize), offset).all()
  const { total } = await db.prepare(`SELECT COUNT(*) as total FROM attendance ${where}`).bind(...params).first()

  return c.json({ code: 200, data: { list, total } })
})

app.get('/api/attendance/today', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const today = new Date().toISOString().split('T')[0]
  const record = await db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(user.id, today).first()
  return c.json({ code: 200, data: record || null })
})

app.post('/api/attendance/sign-in', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const { location } = await c.req.json()

  const existing = await db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(user.id, today).first()
  if (existing) return c.json({ code: 400, message: '今日已签到' })

  const hour = new Date().getHours()
  const status = hour >= 9 ? 'late' : 'normal'
  await db.prepare('INSERT INTO attendance (user_id, sign_in_time, location, status, date) VALUES (?, ?, ?, ?, ?)').bind(user.id, now, location || '公司', status, today).run()
  return c.json({ code: 200, message: status === 'late' ? '签到成功（迟到）' : '签到成功' })
})

app.post('/api/attendance/sign-out', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const record = await db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(user.id, today).first()
  if (!record) return c.json({ code: 400, message: '请先签到' })
  if (record.sign_out_time) return c.json({ code: 400, message: '今日已签退' })

  await db.prepare('UPDATE attendance SET sign_out_time = ? WHERE id = ?').bind(now, record.id).run()
  return c.json({ code: 200, message: '签退成功' })
})

// ==================== Work Log Routes ====================
app.get('/api/worklog', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { page = '1', pageSize = '10', startDate, endDate } = c.req.query()
  let where = 'WHERE user_id = ?'
  let params = [user.id]
  if (startDate) { where += ' AND date >= ?'; params.push(startDate) }
  if (endDate) { where += ' AND date <= ?'; params.push(endDate) }

  const offset = (parseInt(page) - 1) * parseInt(pageSize)
  const { total } = await db.prepare(`SELECT COUNT(*) as total FROM work_logs ${where}`).bind(...params).first()
  const { results: list } = await db.prepare(`SELECT * FROM work_logs ${where} ORDER BY date DESC LIMIT ? OFFSET ?`).bind(...params, parseInt(pageSize), offset).all()

  return c.json({ code: 200, data: { list, total } })
})

app.post('/api/worklog', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { content, customer_count, call_count, visit_count, date } = await c.req.json()
  const logDate = date || new Date().toISOString().split('T')[0]
  await db.prepare('INSERT INTO work_logs (user_id, content, customer_count, call_count, visit_count, date) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(user.id, content, customer_count || 0, call_count || 0, visit_count || 0, logDate).run()
  return c.json({ code: 200, message: '日志提交成功' })
})

// ==================== Salary Routes ====================
app.get('/api/salary', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { year, month } = c.req.query()
  let where = 'WHERE sr.user_id = ?'
  let params = [user.id]
  if (year) { where += ' AND sr.year = ?'; params.push(parseInt(year)) }
  if (month) { where += ' AND sr.month = ?'; params.push(parseInt(month)) }

  const { results: list } = await db.prepare(
    `SELECT sr.*, u.name as user_name FROM salary_records sr LEFT JOIN users u ON sr.user_id = u.id ${where} ORDER BY sr.year DESC, sr.month DESC`
  ).bind(...params).all()
  return c.json({ code: 200, data: list })
})

app.post('/api/salary/calculate', async (c) => {
  const { base_salary, commission_rate, sales_amount, bonus, deduction } = await c.req.json()
  const commission = (commission_rate || 0) / 100 * (sales_amount || 0)
  const total = (base_salary || 0) + commission + (bonus || 0) - (deduction || 0)
  return c.json({ code: 200, data: { base_salary, commission: Math.round(commission * 100) / 100, bonus, deduction, total: Math.round(total * 100) / 100 } })
})

// ==================== Team Routes ====================
app.get('/api/teams', async (c) => {
  const db = c.env.DB
  const { results: list } = await db.prepare('SELECT t.*, u.name as leader_name FROM teams t LEFT JOIN users u ON t.leader_id = u.id ORDER BY t.id').all()
  return c.json({ code: 200, data: list })
})

app.get('/api/teams/ranking/list', async (c) => {
  const db = c.env.DB
  const { days = '7' } = c.req.query()
  const daysInt = parseInt(days)
  const { results: list } = await db.prepare(
    `SELECT t.id, t.name,
      COALESCE(SUM(ts.score), 0) as total_score,
      COALESCE(SUM(ts.customer_count), 0) as total_customers,
      COALESCE(SUM(ts.sign_count), 0) as total_signs
    FROM teams t
    LEFT JOIN team_scores ts ON t.id = ts.team_id AND ts.date >= date('now', ? || ' days')
    GROUP BY t.id ORDER BY total_score DESC`
  ).bind('-' + daysInt).all()
  return c.json({ code: 200, data: list })
})

app.get('/api/teams/ranking/individual', async (c) => {
  const db = c.env.DB
  const { results: list } = await db.prepare(
    `SELECT u.id, u.name, u.department,
      COUNT(DISTINCT c.id) as customer_count,
      COUNT(DISTINCT CASE WHEN c.status = 'signed' THEN c.id END) as sign_count
    FROM users u
    LEFT JOIN customers c ON c.owner_id = u.id
    WHERE u.role != 'admin'
    GROUP BY u.id ORDER BY sign_count DESC, customer_count DESC`
  ).all()
  return c.json({ code: 200, data: list })
})

app.get('/api/teams/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const team = await db.prepare('SELECT t.*, u.name as leader_name FROM teams t LEFT JOIN users u ON t.leader_id = u.id WHERE t.id = ?').bind(id).first()
  if (!team) return c.json({ code: 404, message: '团队不存在' })

  const { results: members } = await db.prepare('SELECT u.id, u.name, u.phone, u.department FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?').bind(id).all()
  return c.json({ code: 200, data: { ...team, members } })
})

// ==================== Project Routes ====================
app.get('/api/projects', async (c) => {
  const db = c.env.DB
  const { status } = c.req.query()
  let sql = 'SELECT * FROM projects'
  let params = []
  if (status) { sql += ' WHERE status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC'

  const { results: list } = await db.prepare(sql).bind(...params).all()
  return c.json({ code: 200, data: list })
})

app.get('/api/projects/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()
  if (!project) return c.json({ code: 404, message: '项目不存在' })

  const { results: events } = await db.prepare('SELECT pe.*, u.name as creator_name FROM project_events pe LEFT JOIN users u ON pe.created_by = u.id WHERE pe.project_id = ? ORDER BY pe.created_at DESC').bind(id).all()
  return c.json({ code: 200, data: { ...project, events } })
})

app.post('/api/projects', async (c) => {
  const db = c.env.DB
  const { name, description, address, status, start_date, end_date } = await c.req.json()
  await db.prepare('INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(name, description || '', address || '', status || 'active', start_date || '', end_date || '').run()
  return c.json({ code: 200, message: '项目创建成功' })
})

app.post('/api/projects/:id/events', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const id = parseInt(c.req.param('id'))
  const { title, content, type } = await c.req.json()
  await db.prepare('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)')
    .bind(id, title, content || '', type || 'info', user.id).run()
  return c.json({ code: 200, message: '事件添加成功' })
})

// ==================== Talent Routes ====================
app.get('/api/talents', async (c) => {
  const db = c.env.DB
  const { keyword, status, education, page = '1', pageSize = '10' } = c.req.query()
  let where = []
  let params = []

  if (keyword) {
    where.push('(t.name LIKE ? OR t.phone LIKE ? OR t.school LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (status) { where.push('t.status = ?'); params.push(status) }
  if (education) { where.push('t.education = ?'); params.push(education) }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  const { total } = await db.prepare(`SELECT COUNT(*) as total FROM talents t ${whereClause}`).bind(...params).first()
  const { results: list } = await db.prepare(
    `SELECT t.*, u.name as assigned_name FROM talents t LEFT JOIN users u ON t.assigned_to = u.id ${whereClause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(pageSize), offset).all()

  return c.json({ code: 200, data: { list, total } })
})

app.get('/api/talents/:id', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const talent = await db.prepare('SELECT t.*, u.name as assigned_name FROM talents t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?').bind(id).first()
  if (!talent) return c.json({ code: 404, message: '人才不存在' })
  return c.json({ code: 200, data: talent })
})

app.post('/api/talents', async (c) => {
  const db = c.env.DB
  const { name, phone, gender, education, school, major, experience, remark } = await c.req.json()
  await db.prepare('INSERT INTO talents (name, phone, gender, education, school, major, experience, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(name, phone || '', gender || '', education || '', school || '', major || '', experience || '', remark || '').run()
  return c.json({ code: 200, message: '添加成功' })
})

app.post('/api/talents/:id/assign', async (c) => {
  const db = c.env.DB
  const id = parseInt(c.req.param('id'))
  const { assigned_to } = await c.req.json()
  await db.prepare('UPDATE talents SET assigned_to = ?, status = ? WHERE id = ?').bind(assigned_to, 'assigned', id).run()
  return c.json({ code: 200, message: '分配成功' })
})

// ==================== Dashboard Routes ====================
app.get('/api/dashboard/stats', async (c) => {
  const db = c.env.DB
  const today = new Date().toISOString().split('T')[0]

  const { total: totalCustomers } = await db.prepare('SELECT COUNT(*) as total FROM customers').first()
  const { total: todayNew } = await db.prepare('SELECT COUNT(*) as total FROM customers WHERE date(created_at) = ?').bind(today).first()
  const { total: todayFollows } = await db.prepare('SELECT COUNT(*) as total FROM customer_follows WHERE date(created_at) = ?').bind(today).first()
  const { total: signedCount } = await db.prepare("SELECT COUNT(*) as total FROM customers WHERE status = 'signed'").first()
  const { total: todayAttendance } = await db.prepare('SELECT COUNT(*) as total FROM attendance WHERE date = ?').bind(today).first()

  // Customer trend (last 7 days)
  const trend = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const { count } = await db.prepare('SELECT COUNT(*) as count FROM customers WHERE date(created_at) = ?').bind(dateStr).first()
    trend.push({ date: dateStr, count })
  }

  // Source distribution
  const { results: sourceRows } = await db.prepare("SELECT source as name, COUNT(*) as value FROM customers WHERE source != '' GROUP BY source").all()

  // Intention distribution
  const { results: intentionRows } = await db.prepare('SELECT intention_level || \'级\' as name, COUNT(*) as value FROM customers GROUP BY intention_level').all()

  // Status distribution
  const { results: statusRaw } = await db.prepare('SELECT status, COUNT(*) as value FROM customers GROUP BY status').all()
  const statusLabels = { potential: '潜在客户', followed: '跟进中', signed: '已签约' }
  const statusDistribution = statusRaw.map(r => ({ name: statusLabels[r.status] || r.status, value: r.value }))

  return c.json({
    code: 200,
    data: {
      totalCustomers,
      todayNew,
      todayFollows,
      signedCount,
      todayAttendance,
      trend,
      sourceDistribution: sourceRows,
      intentionDistribution: intentionRows,
      statusDistribution
    }
  })
})

// ==================== User Routes ====================
app.get('/api/user/info', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const info = await db.prepare('SELECT id, username, name, phone, email, avatar, role, department, status, created_at FROM users WHERE id = ?').bind(user.id).first()
  if (!info) return c.json({ code: 404, message: '用户不存在' })
  return c.json({ code: 200, data: info })
})

app.put('/api/user/info', async (c) => {
  const db = c.env.DB
  const user = c.get('user')
  const { name, phone, email } = await c.req.json()
  await db.prepare('UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?').bind(name, phone || '', email || '', user.id).run()
  return c.json({ code: 200, message: '更新成功' })
})

app.get('/api/user/list', async (c) => {
  const db = c.env.DB
  const { results: list } = await db.prepare('SELECT id, username, name, phone, role, department FROM users WHERE status = 1 ORDER BY id').all()
  return c.json({ code: 200, data: list })
})

export default app
