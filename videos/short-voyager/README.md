# short-voyager：接策划交接格式 4 的验收片

策划（ai-content-planner 0.7.1）批 I2 回放交来的 60 秒竖屏短视频：旅行者 1 号今天飞到一光日，讲透型、P1 热血燃、张力 3。用来验收 PLAN 阶段 15：开分镜不回头问策划、逐字稿只改断句和念法、配音后时长贴近目标。

- 计划在策划仓库 `docs/replay/short-voyager/`（`plan.md`、`content.md`），不进本仓库；本地放到 `plans/short-voyager/`（`.gitignore` 里）再跑检查。
- 这里只有分镜脚本和逐字稿；配音、`timing.json` 不进仓库（`.gitignore`），用本地 Kokoro 重配：

```bash
python3 skills/ai-coding-video/scripts/check_plan.py plans/short-voyager/plan.md \
    --storyboard videos/short-voyager/storyboard.json --script videos/short-voyager/script.json --table
cd samples && export AICV_TTS_CMD="python3 tools/adapters/kokoro.py"
python3 tools/voice.py ../videos/short-voyager && python3 tools/voice.py ../videos/short-voyager --check
```

2026-11-18 实测：zf_083、语速 1.05，15 句 61.7 秒（P1 12.9、P2 19.7、P3 29.1），回听 0 句不一致。开头原句「就在今天」只在北京时间 2026-11-18 当天成立，要发成片而日期不对，在 `plan.md` 缺口表加一行回流，不改原句。
