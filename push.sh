#!/bin/bash
# mathcoe_admin - 提交代码到 GitHub
set -e

COMMIT_MSG="${1:-更新代码 $(date '+%Y-%m-%d %H:%M')}"
git add -A
git commit -m "$COMMIT_MSG"
git push origin master
echo "✅ admin 提交完成"