import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'crm.db');

let db = null;

export async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
    saveDatabase();
  }

  return db;
}

export function getDb() {
  return db;
}

export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'sales',
    department TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    age INTEGER,
    intention_level TEXT DEFAULT 'C',
    source TEXT,
    address TEXT,
    province TEXT,
    city TEXT,
    district TEXT,
    remark TEXT,
    status TEXT DEFAULT 'potential',
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customer_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    follow_type TEXT DEFAULT 'phone',
    next_follow_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'system',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sign_in_time DATETIME,
    sign_out_time DATETIME,
    location TEXT,
    photo TEXT,
    status TEXT DEFAULT 'normal',
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    customer_count INTEGER DEFAULT 0,
    call_count INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS salary_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    base_salary REAL DEFAULT 0,
    commission REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    total REAL DEFAULT 0,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leader_id INTEGER,
    member_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS team_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    customer_count INTEGER DEFAULT 0,
    sign_count INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS project_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'info',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS talents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    education TEXT,
    school TEXT,
    major TEXT,
    experience TEXT,
    status TEXT DEFAULT 'available',
    assigned_to INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  )`);
}

function seedData() {
  // Create admin user (password: 123456)
  const hashedPassword = bcrypt.hashSync('123456', 10);

  // Users
  db.run(`INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin', hashedPassword, '管理员', '13800000000', 'admin', '管理部']);
  db.run(`INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
    ['zhangsan', hashedPassword, '张三', '13800000001', 'manager', '销售一部']);
  db.run(`INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
    ['lisi', hashedPassword, '李四', '13800000002', 'sales', '销售一部']);
  db.run(`INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
    ['wangwu', hashedPassword, '王五', '13800000003', 'sales', '销售二部']);
  db.run(`INSERT INTO users (username, password, name, phone, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
    ['zhaoliu', hashedPassword, '赵六', '13800000004', 'sales', '销售二部']);

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
  ];

  customers.forEach(c => {
    db.run(`INSERT INTO customers (name, phone, gender, age, intention_level, source, address, province, city, district, remark, status, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, c);
  });

  // Customer follows
  const follows = [
    [1, 1, '客户来电咨询三居室户型，已发送户型图', 'phone', null],
    [1, 1, '客户到店看房，对A栋1502很满意', 'visit', null],
    [1, 1, '客户已签约A栋1502，总价280万', 'visit', null],
    [2, 2, '电话沟通，客户预算200万，推荐了B栋小户型', 'phone', null],
    [2, 2, '带客户实地看了3套房源', 'visit', null],
    [3, 3, '初次接触，客户对学区房有强烈需求', 'phone', null],
    [4, 3, '微信沟通，发送了项目资料', 'wechat', null],
    [5, 2, '老客户推荐，客户资金充裕', 'phone', null],
    [5, 2, '带客户看了商铺和住宅，签约2套', 'visit', null],
    [6, 4, '初次来电，了解项目基本情况', 'phone', null],
    [7, 4, '客户到店，重点介绍了改善型产品', 'visit', null],
    [9, 2, '客户是企业主，投资商铺3间', 'visit', null],
    [10, 3, '年轻夫妻，看了婚房户型', 'visit', null],
    [12, 4, '客户要求看别墅区，预约周末看房', 'phone', null],
  ];

  follows.forEach(f => {
    db.run(`INSERT INTO customer_follows (customer_id, user_id, content, follow_type, next_follow_time) VALUES (?, ?, ?, ?, ?)`, f);
  });

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
  ];
  msgs.forEach(m => {
    db.run(`INSERT INTO messages (user_id, title, content, type) VALUES (?, ?, ?, ?)`, m);
  });

  // Attendance - seed recent dates
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (let uid = 1; uid <= 5; uid++) {
      const signIn = `${dateStr} 0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
      const signOut = `${dateStr} ${17 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
      const status = Math.random() > 0.9 ? 'late' : 'normal';
      db.run(`INSERT INTO attendance (user_id, sign_in_time, sign_out_time, location, status, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [uid, signIn, signOut, '公司总部', status, dateStr]);
    }
  }

  // Work logs
  for (let uid = 1; uid <= 4; uid++) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      db.run(`INSERT INTO work_logs (user_id, content, customer_count, call_count, visit_count, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [uid, `今日工作：拜访客户${2+i}组，电话沟通${5+i}人，整理客户资料`, 2+i, 5+i, 1+Math.floor(i/2), dateStr]);
    }
  }

  // Salary records
  for (let uid = 1; uid <= 5; uid++) {
    for (let m = 1; m <= 2; m++) {
      const base = uid === 1 ? 15000 : uid === 2 ? 10000 : 6000;
      const commission = Math.floor(Math.random() * 10000) + 2000;
      const bonus = Math.floor(Math.random() * 3000);
      const deduction = Math.floor(Math.random() * 500);
      const total = base + commission + bonus - deduction;
      db.run(`INSERT INTO salary_records (user_id, base_salary, commission, bonus, deduction, total, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid, base, commission, bonus, deduction, total, m, 2026]);
    }
  }

  // Teams
  db.run(`INSERT INTO teams (name, leader_id, member_count) VALUES (?, ?, ?)`, ['猛虎队', 2, 2]);
  db.run(`INSERT INTO teams (name, leader_id, member_count) VALUES (?, ?, ?)`, ['雄鹰队', 4, 2]);

  // Team members
  db.run(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`, [1, 2]);
  db.run(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`, [1, 3]);
  db.run(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`, [2, 4]);
  db.run(`INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`, [2, 5]);

  // Team scores
  for (let tid = 1; tid <= 2; tid++) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      db.run(`INSERT INTO team_scores (team_id, score, customer_count, sign_count, date) VALUES (?, ?, ?, ?, ?)`,
        [tid, Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 3), dateStr]);
    }
  }

  // Projects
  db.run(`INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
    ['翡翠湾花园', '高端住宅项目，共12栋，1200户', '北京市朝阳区东四环', 'active', '2025-01-01', '2026-12-31']);
  db.run(`INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
    ['阳光城商业广场', '商业综合体项目，含写字楼和商铺', '上海市浦东新区世纪大道', 'active', '2025-06-01', '2027-06-30']);
  db.run(`INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
    ['学府名苑', '学区房项目，紧邻重点学校', '广州市天河区华师附近', 'completed', '2024-01-01', '2025-12-31']);

  // Project events
  db.run(`INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`,
    [1, '项目启动', '翡翠湾花园项目正式启动销售', 'milestone', 1]);
  db.run(`INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`,
    [1, '开盘活动', '首批100套房源开盘，当日去化率85%', 'event', 1]);
  db.run(`INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`,
    [1, '月度总结', '本月新增客户200组，签约15套', 'report', 2]);
  db.run(`INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`,
    [2, '项目启动', '阳光城商业广场开始预售', 'milestone', 1]);
  db.run(`INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`,
    [2, '招商进展', '已签约入驻品牌30个', 'info', 2]);

  // Talents
  const talents = [
    ['张明', '17700001111', '男', '本科', '北京大学', '市场营销', '3年房产销售经验', 'available', null, '沟通能力强'],
    ['李华', '17700002222', '女', '硕士', '清华大学', '金融学', '5年金融行业经验', 'available', null, '有丰富的客户资源'],
    ['王磊', '17700003333', '男', '本科', '浙江大学', '工商管理', '2年销售经验', 'assigned', 2, '执行力强'],
    ['陈静', '17700004444', '女', '大专', '上海商学院', '电子商务', '1年电商经验', 'available', null, '熟悉网络营销'],
    ['刘洋', '17700005555', '男', '本科', '武汉大学', '土木工程', '4年房产行业经验', 'assigned', 4, '技术背景，专业性强'],
  ];
  talents.forEach(t => {
    db.run(`INSERT INTO talents (name, phone, gender, education, school, major, experience, status, assigned_to, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, t);
  });
}
