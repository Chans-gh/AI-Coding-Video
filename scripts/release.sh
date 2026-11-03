#!/usr/bin/env bash
# 发版：登记样片 → 词典检查 → API.md 检查 → 生成介绍页 → 提交并推送当前分支。
#   scripts/release.sh "<提交说明>"          提交说明可以多行（附署名行）
#   scripts/release.sh --live "<提交说明>"   推送后再用无头浏览器打开线上介绍页，打一行结果
#   scripts/release.sh --live                只检查线上介绍页，不提交
# 推到 main 会自动重新发布介绍页（.github/workflows/pages.yml），线上要等一两分钟才更新。
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"
live=0
if [[ "${1:-}" == "--live" ]]; then live=1; shift; fi
msg="${1:-}"
if [[ -n "$msg" ]]; then
  python3 samples/tools/mark.py all | grep -v '^= ' || true
  python3 skills/ai-coding-video/scripts/build_index.py --check
  python3 samples/tools/apidoc.py --check
  python3 site/build.py | tail -1
  git add -A
  git commit -q -m "$msg"
  branch="$(git rev-parse --abbrev-ref HEAD)"
  for i in 0 2 4 8 16; do
    sleep "$i"
    if git push -q -u origin "$branch"; then echo "已推送 $branch：$(git log -1 --format='%h %s')"; break; fi
    [[ "$i" == 16 ]] && { echo "推送失败"; exit 1; }
  done
elif [[ "$live" == 0 ]]; then
  sed -n 2,6p "$0"; exit 1
fi
if [[ "$live" == 1 ]]; then python3 scripts/check_live.py; fi
