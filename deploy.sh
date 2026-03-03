#!/bin/bash
# ============================================
# CRM 系统 Cloudflare 一键部署脚本
# ============================================

set -e

echo "========================================="
echo "  CRM 客户管理系统 - Cloudflare 部署"
echo "========================================="
echo ""

# 检查 wrangler 是否已登录
echo "[1/6] 检查 Cloudflare 登录状态..."
cd worker
npm install

if ! npx wrangler whoami 2>/dev/null | grep -q "Account"; then
  echo "需要先登录 Cloudflare 账号..."
  npx wrangler login
fi
echo "✓ 已登录"
echo ""

# 创建 D1 数据库
echo "[2/6] 创建 D1 数据库..."
DB_OUTPUT=$(npx wrangler d1 create crm-database 2>&1 || true)

if echo "$DB_OUTPUT" | grep -q "already exists"; then
  echo "数据库 crm-database 已存在，跳过创建"
  DB_ID=$(npx wrangler d1 list 2>&1 | grep "crm-database" | awk '{print $1}')
else
  DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $2}')
fi

if [ -z "$DB_ID" ]; then
  echo "⚠ 无法自动获取 database_id，请手动操作："
  echo "  1. 运行: cd worker && npx wrangler d1 list"
  echo "  2. 复制 crm-database 的 ID"
  echo "  3. 编辑 worker/wrangler.toml 中的 database_id"
  echo ""
  echo "$DB_OUTPUT"
  read -p "请输入 database_id: " DB_ID
fi

echo "数据库 ID: $DB_ID"
echo ""

# 更新 wrangler.toml
echo "[3/6] 更新配置文件..."
sed -i "s/在此填入你的数据库ID/$DB_ID/g" wrangler.toml
echo "✓ wrangler.toml 已更新"
echo ""

# 初始化数据库表结构
echo "[4/6] 初始化数据库表结构..."
npx wrangler d1 execute crm-database --file=schema.sql --remote
echo "✓ 数据表创建完成"
echo ""

# 部署 Worker API
echo "[5/6] 部署 Worker API..."
DEPLOY_OUTPUT=$(npx wrangler deploy 2>&1)
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.workers\.dev' | head -1)

if [ -z "$WORKER_URL" ]; then
  echo "Worker 已部署，但无法自动获取 URL"
  echo "$DEPLOY_OUTPUT"
  read -p "请输入 Worker URL (如 https://crm-api.xxx.workers.dev): " WORKER_URL
fi

echo "✓ Worker 已部署到: $WORKER_URL"
echo ""

# 初始化种子数据
echo "正在初始化演示数据..."
curl -s "${WORKER_URL}/api/setup" | head -200
echo ""
echo ""

# 构建并部署前端
echo "[6/6] 构建并部署前端..."
cd ..

# 写入环境变量
echo "VITE_API_URL=${WORKER_URL}/api" > .env.production

npm run build

echo "部署前端到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=crm-system
echo ""

echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "后端 API:  $WORKER_URL"
echo "初始化数据: 访问 ${WORKER_URL}/api/setup"
echo ""
echo "默认账号:"
echo "  admin    / 123456"
echo "  zhangsan / 123456"
echo "  lisi     / 123456"
echo "  wangwu   / 123456"
echo "  zhaoliu  / 123456"
echo ""
