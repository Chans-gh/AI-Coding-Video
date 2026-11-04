#!/usr/bin/env bash
# 把 skills/ai-coding-video 拷到各家 Agent 的 Skill 目录。
#   scripts/install.sh claude|codex|dsh|all            装到用户目录（~/.claude/skills 等）
#   scripts/install.sh claude|codex|dsh|all <项目目录>  装到某个项目里（<项目>/.claude/skills 等）
#   scripts/install.sh zip                             打成 dist/ai-coding-video.zip（上传到 WorkBuddy 等）
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$HERE/skills/ai-coding-video"
target="${1:-}"; base="${2:-$HOME}"
claude="$base/.claude/skills"; codex="$base/.agents/skills"; dsh="$base/.dsh/skills"
# Skill 里的 samples/、packs/ 是样片和风格包代码（build_index.py 从仓库同步）；有人在里面装过依赖、出过片的，不带走 node_modules、out
copy() { mkdir -p "$1"; rm -rf "$1/ai-coding-video"; cp -R "$SRC" "$1/ai-coding-video"; rm -f "$1/ai-coding-video/images/.gitkeep"
  find "$1/ai-coding-video" -depth -type d \( -name node_modules -o -name out -o -name __pycache__ \) -exec rm -rf {} +; echo "已装到 $1/ai-coding-video"; }
case "$target" in
  claude) copy "$claude";;
  codex)  copy "$codex";;
  dsh)    copy "$dsh";;
  all)    copy "$claude"; copy "$codex"; copy "$dsh";;
  zip)    mkdir -p "$HERE/dist"; (cd "$HERE/skills" && rm -f "$HERE/dist/ai-coding-video.zip" && zip -qr "$HERE/dist/ai-coding-video.zip" ai-coding-video -x '*/.gitkeep' '*/__pycache__/*' '*/node_modules/*' '*/out/*'); echo "已打包 dist/ai-coding-video.zip";;
  *) sed -n 2,5p "$0"; exit 1;;
esac
