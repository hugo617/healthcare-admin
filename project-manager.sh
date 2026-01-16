#!/bin/bash

# N-Admin 项目管理脚本

show_help() {
    echo "🚀 N-Admin 项目管理脚本"
    echo "============================="
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start       启动应用"
    echo "  stop        停止应用"
    echo "  restart     重启应用"
    echo "  status      查看运行状态"
    echo "  help        显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动应用"
    echo "  $0 stop     # 停止应用"
    echo "  $0 restart  # 重启应用"
    echo "  $0 status   # 查看运行状态"
}

show_status() {
    echo "📊 N-Admin 运行状态"
    echo "============================="

    # 检查端口3003
    if lsof -ti:3003 >/dev/null 2>&1; then
        echo "✅ 应用 (端口 3003): 运行中"
        echo "   🌐 管理端:   http://localhost:3003"
        echo "   📱 移动端:   http://localhost:3003/h5"
    else
        echo "❌ 应用 (端口 3003): 未运行"
    fi

    # 检查相关进程
    echo ""
    echo "🔍 进程信息:"
    if pgrep -f "pnpm run dev" >/dev/null; then
        PID=$(pgrep -f "pnpm run dev")
        echo "✅ pnpm run dev 进程: 运行中 (PID: $PID)"
    else
        echo "❌ pnpm run dev 进程: 未运行"
    fi

    if pgrep -f "next dev" >/dev/null; then
        echo "✅ Next.js 开发服务器: 运行中"
    else
        echo "❌ Next.js 开发服务器: 未运行"
    fi

    # 检查数据库
    echo ""
    echo "🗄️  数据库状态:"
    if lsof -ti:5432 >/dev/null 2>&1; then
        echo "✅ PostgreSQL (端口 5432): 运行中"
    else
        echo "❌ PostgreSQL (端口 5432): 未运行"
    fi
}

# 主逻辑
case "${1:-}" in
    "start")
        echo "🚀 启动 N-Admin..."
        bash "$(dirname "$0")/start-all.sh"
        ;;
    "stop")
        echo "🛑 停止 N-Admin..."
        bash "$(dirname "$0")/stop-all.sh"
        ;;
    "restart")
        echo "🔄 重启 N-Admin..."
        bash "$(dirname "$0")/stop-all.sh"
        sleep 2
        bash "$(dirname "$0")/start-all.sh"
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac