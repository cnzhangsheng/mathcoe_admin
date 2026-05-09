#!/bin/bash
# 检查端口是否被占用
if lsof -i :3000 > /dev/null 2>&1; then
    echo "端口 3000 已被占用，停止现有进程..."
    lsof -i :3000 -t | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 启动服务
echo "启动 admin 服务..."
echo "服务地址: http://localhost:3000"
echo ""

# 使用 nohup 在后台运行，日志输出到 logs 目录
mkdir -p logs
nohup npm run dev > logs/server.log 2>&1 &

# 等待服务启动
sleep 2

# 检查服务是否成功启动

