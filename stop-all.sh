#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 停止 N-Admin 项目${NC}"
echo "================================"

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 从 PID 文件读取
if [ -f ".next/dev-server.pid" ]; then
    PID=$(cat .next/dev-server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⏳ 正在停止开发服务器 (PID: $PID)...${NC}"
        kill $PID 2>/dev/null || true
        sleep 2
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  强制停止...${NC}"
            kill -9 $PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 开发服务器已停止${NC}"
    fi
    rm -f .next/dev-server.pid
fi

# 检查并停止相关进程
echo ""
echo -e "${BLUE}🔍 检查并清理相关进程...${NC}"

# 停止 pnpm run dev 进程
if pgrep -f "pnpm run dev" >/dev/null; then
    echo -e "${YELLOW}⏳ 停止 pnpm run dev 进程...${NC}"
    pkill -f "pnpm run dev" 2>/dev/null || true
fi

# 停止 Next.js 开发服务器
if pgrep -f "next dev" >/dev/null; then
    echo -e "${YELLOW}⏳ 停止 Next.js 开发服务器...${NC}"
    pkill -f "next dev" 2>/dev/null || true
fi

# 等待进程完全停止
sleep 2

# 强制清理端口 3003
if lsof -ti:3003 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  强制释放端口 3003...${NC}"
    lsof -ti:3003 | xargs kill -9 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ N-Admin 已停止${NC}"
echo -e "${GREEN}================================${NC}"
