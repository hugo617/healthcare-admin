#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${BLUE}🚀 启动 N-Admin 项目${NC}"
echo "================================"

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ 错误: pnpm 未安装${NC}"
    echo "请先安装 pnpm: npm install -g pnpm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  未检测到 node_modules，正在安装依赖...${NC}"
    pnpm install
fi

# 检查数据库连接
echo -e "${BLUE}🔍 检查 PostgreSQL 数据库...${NC}"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="n_admin"

if ! lsof -ti:$DB_PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  警告: PostgreSQL 未在端口 $DB_PORT 运行${NC}"
    echo "请先启动 PostgreSQL 数据库"
    read -p "是否继续启动应用? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL 运行正常${NC}"
fi

# 检查并停止现有的服务
echo -e "${BLUE}🛑 检查现有服务...${NC}"
if lsof -ti:3003 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口 3003 已被占用，正在释放...${NC}"
    lsof -ti:3003 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 启动项目
echo ""
echo -e "${GREEN}🎯 启动 N-Admin 应用 (端口 3003)...${NC}"
echo "================================"
echo ""

# 启动开发服务器
pnpm run dev &
MAIN_PID=$!

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3003 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务启动成功！${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  服务可能需要更多时间启动...${NC}"
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 N-Admin 启动完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📊 管理端:${NC}      http://localhost:3003"
echo -e "${BLUE}📱 移动端 (H5):${NC} http://localhost:3003/h5"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "  - 按 Ctrl+C 停止服务"
echo "  - 查看进程: pgrep -f 'next dev'"
echo "  - 停止服务: ./project-manager.sh stop"
echo ""

# 保存 PID 到文件，方便后续管理
echo $MAIN_PID > .next/dev-server.pid

# 等待用户中断
trap "echo -e '\n${YELLOW}🛑 正在停止服务...${NC}'; kill $MAIN_PID 2>/dev/null || true; rm -f .next/dev-server.pid; exit 0" INT TERM

wait $MAIN_PID 2>/dev/null