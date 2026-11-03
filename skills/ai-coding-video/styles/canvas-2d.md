# Canvas 2D（42 种）

[← 选风格索引](../index.md) · [提示词方法](../prompting.md) · [技术标签](../tags.md)

画面画在 Canvas 2D 画布上：路径、填充、像素操作，必要时叠一层 WebGL 做纸纹、晕染这类全屏效果。手绘、版画、像素类风格大多在这里。

每个条目依次是：样帧（已渲染的才有）、一句可直接复制的风格提示词、题材、适合讲什么、技术标签、参考链接。「技术（已验证）」表示仓库里有真能跑出这张样帧的代码；「技术（建议）」是推荐写法，还没有样帧验证。

<a id="C-001"></a>

## C-001 中国水墨 / 写意

```text
用中国水墨写意风格：暖色宣纸底（#F2ECDE）带纸纤维，画面 60–80% 留白，只用墨分五色的黑灰，没骨笔触自带深浅边、快笔处带干笔飞白，全片唯一的红是朱印，场景之间用墨滴在湿纸上晕开过渡，镜头像展开手卷一样从右往左横移，古琴配乐。
```

- 题材：手绘与绘画
- 适合：武侠、哲理、东方题材
- 技术（建议）：Canvas 2D · WebGL
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ink-wash/STYLE.md) · [@AxtonLiu](https://x.com/AxtonLiu/status/2103288413969621231) · [@shfred0](https://x.com/shfred0/status/2102495989194236158)

<a id="C-002"></a>

## C-002 水彩

```text
用水彩风格：暖白色冷压棉纸纹理，颜料透明叠色、边缘有水渍积色，干笔处露出纸白，颜色略微溢出铅笔线，一镜到底横移穿过风景，角落有手写批注，结尾拉远成一张手绘地图。
```

- 题材：手绘与绘画
- 适合：自然、旅行、温情 MV
- 技术（建议）：Canvas 2D · p5.brush
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/watercolor/STYLE.md) · [@johnknopf](https://x.com/johnknopf/status/2103170666187117006) · [@mablesjoseph](https://x.com/mablesjoseph/status/2103465246014746943)

<a id="C-003"></a>

## C-003 钢笔淡彩

```text
用钢笔淡彩城市速写风格：奶油色冷压纸，棕褐色针管笔线条轻微抖动、出头、不闭合，透明淡彩随手点上、略微偏离线条并溢出，颜色在纸边溶成空白，整个画面像速写本上的一页。
```

- 题材：手绘与绘画
- 适合：城市、公园、日常
- 技术（建议）：Canvas 2D · Rough.js
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/urban-sketch/STYLE.md)

<a id="C-004"></a>

## C-004 油画厚涂

```text
用刮刀油画厚涂风格：大块平整、边缘锋利的色面，侧光照出每一道颜料隆起的肌理，先保证明暗结构再加质感，焦点处硬边、其余区域安静平涂，人物用少量笔触概括。
```

- 题材：手绘与绘画
- 适合：情绪片、艺术感广告
- 技术（建议）：Canvas 2D · WebGL · GLSL
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/impasto/STYLE.md) · [@yumaeriel](https://x.com/yumaeriel/status/2103053166006657284)

<a id="C-005"></a>

## C-005 蜡笔绘本

```text
用儿童蜡笔绘本风格：米白色粗纹纸，蜡笔只附着在纸纹凸起处、露出细小白点，靛蓝色抖动描边，排线会越出轮廓，全片只用一次透明水彩晕染来揭示蜡笔藏起来的东西，睡前故事般的温柔节奏。
```

- 题材：手绘与绘画
- 适合：儿童故事
- 技术（建议）：Canvas 2D · p5.js
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/crayon-book/STYLE.md)

<a id="C-006"></a>

## C-006 儿童涂鸦

```text
用儿童涂鸦风格：像 6 岁孩子画的，线条稚拙、比例不准、颜色涂出界，蜡笔和水彩笔混用，动作是一格一格的简单替换，不要任何专业透视和光影。
```

- 题材：手绘与绘画
- 适合：亲子、MV；可附孩子的原画让它照着动起来
- 技术（建议）：Canvas 2D · Rough.js

<a id="C-007"></a>

## C-007 铅笔素描

```text
用铅笔素描风格：速写本纸纹上的石墨灰阶，先出淡淡的构图辅助线再逐笔加深，阴影用排线和擦抹表现，保留擦痕和未完成的线，只用黑白灰。
```

- 题材：手绘与绘画
- 适合：创意过程、设计思考
- 技术（建议）：Canvas 2D
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/karakalem)

<a id="C-010"></a>

## C-010 黑板粉笔

```text
用黑板粉笔风格：墨绿色黑板带旧擦痕，白色和黄色粉笔字有颗粒和断笔，板擦擦过留下灰雾，画面像老师上课的板书，关键词用粉笔圈出和画下划线。
```

- 题材：手绘与绘画
- 适合：课程、规则、“别忘了”
- 技术（建议）：Canvas 2D
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/kara-tahta)

<a id="C-011"></a>

## C-011 沙画

```text
用沙画风格：暖光灯箱上的一层细沙，形象由手指划开的沙痕和剪影构成，只用棕褐和暖黄两种色调，转场是沙子被抹开再聚成下一个画面。
```

- 题材：手绘与绘画
- 适合：历史叙事
- 技术（建议）：Canvas 2D · WebGL

<a id="C-012"></a>

## C-012 手绘卡通角色片

```text
用手绘卡通角色片风格：纸张质感背景，用 p5.brush 水彩笔刷上色、线条略带抖动，角色造型简单且全片固定，有清晰表情和夸张但克制的表演，每个镜头围绕角色情绪展开。
```

- 题材：手绘与绘画
- 适合：角色短片、个人故事
- 技术（建议）：Canvas 2D · p5.js · p5.brush
- 参考：[ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)

<a id="C-013"></a>

## C-013 皮影戏

```text
用中国皮影戏风格：半透明的染色兽皮人偶，身上镂空如蕾丝纹样，关节分段、由操纵杆带动、动作有轻微摆荡，贴在棉布幕上、被背后的油灯照亮并微微闪烁，人偶离幕远时边缘变虚，锣鼓和板胡配乐。
```

- 题材：东方传统
- 适合：神话、民间故事
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/shadow-puppet/STYLE.md)

<a id="C-014"></a>

## C-014 浮世绘

```text
用江户浮世绘木版画风格：平涂色块加雕刻感墨线，主色是普鲁士蓝，天空和水面用上深下浅的晕染渐变，看得见纸纹和套版痕迹，每个镜头都是一幅完整版画，镜头像展开画卷一样横移。
```

- 题材：东方传统
- 适合：旅途、日本题材
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ukiyoe/STYLE.md)

<a id="C-016"></a>

## C-016 纸雕灯影

```text
用纸雕灯影风格：6–9 层镂空卡纸叠在浅木盒里，背后暖色灯光透过纸层，窗户和月亮从镂孔里发亮，每层在下一层上投出柔和阴影，镜头在层与层之间形成视差，开场先拍桌上这只真实灯箱再推进去。
```

- 题材：东方传统
- 适合：中秋、节日、团圆
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/paper-lantern/STYLE.md) · [@makwired](https://x.com/makwired/status/2103008945220567166)

<a id="C-017"></a>

## C-017 麻胶版画

```text
用麻胶版画（linocut）风格：米色纸上只用黑色加一种朱红，所有形状边缘带雕刻刀痕，大色块里有油墨印不实的斑驳颗粒，放射线和粗体大字构成宣传海报式构图，元素像盖印一样“压”上画面。
```

- 题材：印刷、版画与装饰
- 适合：宣言、单一强信息
- 技术（建议）：Canvas 2D
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/linocut)

<a id="C-018"></a>

## C-018 木刻

```text
用木刻版画风格：每一帧都是一块涂黑的木板，光只存在于被刀刻掉的地方，用密集的平行刀痕表现明暗和质感，画面是随着刻刀一道道刻出来的，最多加一种颜色，只给火、炉、灯这类“燃烧的东西”。
```

- 题材：印刷、版画与装饰
- 适合：严肃寓言、历史
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/woodcut/STYLE.md)

<a id="C-019"></a>

## C-019 Risograph 孔版印刷

```text
用 Risograph 孔版印刷风格：暖色纸上 2–3 种半透明荧光专色（如荧光粉、蓝、黄）叠印出新颜色，暗部用半调网点，油墨有颗粒和不均，各色版每帧轻微错位抖动，像一张张印出来的动画。
```

- 题材：印刷、版画与装饰
- 适合：轻松生活、潮流品牌
- 技术（建议）：Canvas 2D · WebGL
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/risograph/STYLE.md)

<a id="C-025"></a>

## C-025 分层卡纸剪纸

```text
用分层卡纸剪纸风格：场景由多层彩色卡纸前后叠成，每层边缘是剪刀剪出的不规则线并露出纸纤维，层与层之间有真实投影，镜头移动时各层形成视差，星星和月亮像用线吊着，角色是关节式剪纸。
```

- 题材：纸艺、材质与定格
- 适合：童话、情感开场
- 技术（建议）：Canvas 2D
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/kagit-kesik) · [Papermotion](https://github.com/francozanardi/papermotion)

<a id="C-027"></a>

## C-027 拼贴

```text
用拼贴风格：剪报字母、撕边纸片、格子本、胶带和荧光笔涂抹叠在一起，强对比配色（如粉红加黑），元素一张张“贴”上画面并跟节拍跳动，字幕用勒索信式拼字。
```

- 题材：纸艺、材质与定格
- 适合：MV、观点讲解、节庆
- 技术（建议）：Canvas 2D · HTML/CSS
- 参考：[@NFT_Chen](https://x.com/NFT_Chen/status/2103380404791333144)

<a id="C-030"></a>

## C-030 剪影剧场

```text
用剪影剧场风格：人物、房屋和树全是纯黑剪影，背景是一整片渐变天空，随剧情从日落的橙红慢慢变到月夜的深蓝，暗色幕布框住画面，只有很少几行诗一样的文字。
```

- 题材：纸艺、材质与定格
- 适合：诗意短片
- 技术（建议）：Canvas 2D

<a id="C-035"></a>

## C-035 70 年代电视片头

```text
用 70 年代电视节目片头风格：橙、褐、芜菇黄的暖色调，放射光线和彩虹条纹，圆润粗衣线字体带多层描边阴影，画面像显像管电视播放（圆角、暗角、轻微扫描线和色散），来一段复古放克配乐。
```

- 题材：平面设计与动态排版
- 适合：怀旧开场、系列片头
- 技术（建议）：Canvas 2D · WebGL
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/retro-70ler)

<a id="C-048"></a>

## C-048 1930 年代橡皮管卡通

```text
用 1930 年代橡皮管卡通风格：黑白手工勾线加灰阶平涂，角色四肢是没有关节的橡皮管、戴白手套、黑豆眼带缺口，万物（杯子、水龙头、房子）都活着并跟着热爵士乐队左右摇摆，整个画面像老胶片，有颗粒、划痕和抖动。
```

- 题材：卡通与动漫
- 适合：搞笑追逐
- 技术（建议）：Canvas 2D · SVG
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/rubber-hose/STYLE.md) · [@ianstig](https://x.com/ianstig/status/2103169675928764486)

<a id="C-049"></a>

## C-049 80 年代赛璐璐动画

```text
用 80 年代日本赛璐璐动画风格：角色是双色平涂（亮面加一层硬阴影）的赛璐璐片，叠在喷枪渐变的手绘背景上，霓虹灯逆光勾出轮廓，按一拍三的有限动画节奏动，整体像 1987 年录像带在显像管电视上播放，有轻微色散和带子噪点。
```

- 题材：卡通与动漫
- 适合：城市夜景、怀旧
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/cel-anime-80s/STYLE.md)

<a id="C-052"></a>

## C-052 连环漫画 / 漫画分格

```text
用复古报纸连环漫画风格：黑色粗边框分格，网点印刷底纹，黄、红、青高饱和平涂，对白气泡和旁白框用手写字，关键动作配爆炸形拟声字和速度线，镜头在格子之间推进，最后拉远看到整页漫画。
```

- 题材：卡通与动漫
- 适合：搞笑、对话、悬念
- 技术（建议）：Canvas 2D · HTML/CSS
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/cizgi-roman) · [@elianiva_](https://x.com/elianiva_/status/2103003425915195750)

<a id="C-053"></a>

## C-053 16-bit 像素平台

```text
用 16-bit 横版平台游戏像素风格：低分辨率整数倍放大、像素边缘锐利不模糊，限定 16–32 色调色板，蓝天白云、圆形山丘、砖块和金币，顶部 HUD 显示分数和时间，角色跳跃顶砖块，完成时弹出像素字“过关”，芯片音效。
```

- 题材：游戏
- 适合：游戏化、进度
- 技术（建议）：Canvas 2D
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/piksel) · [@riku720720](https://x.com/riku720720/status/2102515055116063144)

<a id="C-054"></a>

## C-054 16-bit 像素 RPG

```text
用 90 年代主机 RPG 像素风格：内部分辨率 320×180 再整数倍放大，限定调色板，底部蓝色对话框逐字打出并带“哔哔”声，有战斗菜单、HP/MP 数值和存档点，镜头不动、场景靠切换，带回声的芯片音乐。
```

- 题材：游戏
- 适合：冒险故事
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/pixel-rpg/STYLE.md)

<a id="C-056"></a>

## C-056 微游戏快闪

```text
用微游戏快闪风格：每关只有几秒、屏幕上一个大写指令词（如“吃！”）、只做一个动作，每一关换一种完全不同的画风（蜡笔、蓝图、像素…），关与关之间有倒计时和成败判定，节奏越来越快。
```

- 题材：游戏
- 适合：趣味、短视频
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/microgame/STYLE.md)

<a id="C-058"></a>

## C-058 可玩游戏 / 模拟器录屏

```text
先用 Canvas 2D 做一个可以真实操作的单文件 HTML 游戏（横版动作、机关、战斗、灯光闪烁），再让脚本自动玩一遍并录制 60 秒演示，保留 HUD 和菜单，镜头跟随角色。
```

- 题材：游戏
- 适合：游戏 demo、交互科普
- 技术（建议）：Canvas 2D · Playwright
- 参考：[@ring_hyacinth](https://x.com/ring_hyacinth/status/2102865595675050010) · [@RyanSael](https://x.com/RyanSael/status/2102591147927654847)

<a id="C-060"></a>

## C-060 16mm 黑白纪录片

```text
用 16mm 黑白老纪录片风格：粗胶片颗粒、随机划痕和灰尘、整体明暗轻微闪烁、四角暗角，开头是倒数计时片头，字幕用打字机字体，片名用衣线字加细边框，聚光灯打在主体上。
```

- 题材：电影年代与屏幕科技
- 适合：历史、起源故事
- 技术（建议）：Canvas 2D · WebGL
- 参考：[源码](https://github.com/yasinozmeen/animasyon-stil-katalogu/tree/main/stiller/belgesel-16mm)

<a id="C-061"></a>

## C-061 1920 年代默片

```text
用 1920 年代默片喜剧风格：画面是铜版插画式墨线加银灰晕染，4:3 画幅放在天鹅绒幕布中间，胶片闪烁、轻微上下晃动，对白用黑底白字的字幕卡代替，整段用一个固定全景镜头讲完一个笑点，影院钢琴即兴配乐。
```

- 题材：电影年代与屏幕科技
- 适合：喜剧
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/silent-film/STYLE.md)

<a id="C-077"></a>

## C-077 生成式抽象 / 音乐可视化

```text
用生成式抽象音乐可视化风格：分形纹理和有机体形态按音乐的频谱和节拍生长、脉动、变形，青蓝和冷色为主，每个可见的碰撞或重音都对应一次视觉变化，整段没有具象角色和文字。
```

- 题材：3D 与实时图形
- 适合：音乐片、艺术装置
- 技术（建议）：Canvas 2D · p5.js · WebGL
- 参考：[@KamStudioLabs](https://x.com/KamStudioLabs/status/2102899866762440893)

<a id="C-084"></a>

## C-084 1950 年代科学教科书

```text
用 1950 年代科学教科书插图风格：泛黄米色纸页，页眉有科目、章节名和页码，插图用单色网点加有限的蓝、橙专色，图注写“Fig. 1”，粗衣线大标题，旁边有黑底白字的“知识补充”小方框，像翻书一样一页一页讲解。
```

- 题材：信息讲解与产品发布
- 适合：科普、复古教学栏目
- 技术（建议）：Canvas 2D

<a id="C-087"></a>

## C-087 多画风穿越

```text
让同一个角色依次穿越多种画风世界（如暖色写实城市→动漫东京→黏土村庄→像素世界）：角色的外形、配色和剪影在每个世界保持不变，只改变线条、填色、纹理和着色方式，镜头贴近角色视线高度，每次画风切换本身就是转场。
```

- 题材：卡通与动漫
- 适合：品牌 IP 角色、年度回顾、炫技短片；需要先给角色设定图
- 技术（建议）：Canvas 2D · WebGL
- 参考：[@ianstig](https://x.com/ianstig/status/2103169675928764486)

<a id="C-088"></a>

## C-088 圆珠笔速写

```text
用圆珠笔速写风格：奶油色卡纸上只有一支蓝色圆珠笔，线条粗细几乎不变，明暗全靠排线的疏密来表现，笔画停住的地方留一个小墨点，先画轮廓再一层层加排线，整段像把一张速写慢放出来。
```

- 题材：手绘与绘画
- 适合：产品与物件特写、手账感讲解、复古钟表机械
- 技术（建议）：Canvas 2D · Rough.js
- 参考：[anidoodle 风格索引](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/INDEX.md)

<a id="C-089"></a>

## C-089 碎色印象派

```text
用印象派碎色笔触风格：亚麻底布上一小块一小块不混色的不透明色点，每一笔落下就不再修改，互补色并排放着让眼睛自己去混（橙玫瑰进蓝影、紫进金），水面用长而平的笔触、天空顺着云势排，全程没有轮廓线，形体就是色点停下来的地方。
```

- 题材：手绘与绘画
- 适合：风景、日出日落、旅行、艺术感广告
- 技术（建议）：Canvas 2D · WebGL
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/brokenColour.md)

<a id="C-090"></a>

## C-090 炭笔擦除重绘

```text
用炭笔擦除重绘风格：厚棉纸上先用柳枝炭条轻轻起形、最后才用压缩炭条提黑，侧锋铺大调子、纸擦笔揉成雾气，每次修改都用可塑橡皮擦掉一部分再画在残影上，什么都不会被擦干净，只用一种暖黑和奶油白。
```

- 题材：手绘与绘画
- 适合：回忆与思考、艺术创作过程、静物与树木
- 技术（建议）：Canvas 2D
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/charcoalErasure.md)

<a id="C-091"></a>

## C-091 彩色铅笔

```text
用彩色铅笔风格：奶油色卡纸的纸纹让每片颜色里都带着细小的留白，笔触是短而略弯的排线，几乎全部朝同一个斜向，颜色靠力度和一层层叠色出来（紫叠暮蓝、蓝叠青），没有轮廓线，最后才用深色铅笔补几根断续的外形线。
```

- 题材：手绘与绘画
- 适合：儿童内容、生活场景插画、温和的讲解
- 技术（建议）：Canvas 2D · p5.brush
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/colouredPencil.md)

<a id="C-092"></a>

## C-092 刮画板

```text
用刮画板风格：白色瓷土上盖一层黑墨，所有笔触都是用刀尖把墨刮掉，画面从全黑开始，在光照到的地方一道道刮出白色的毛发和轮廓，没有灰色，灰度只来自白线排得有多密，刮痕从不渐入，都是整条整条刻出来的。
```

- 题材：手绘与绘画
- 适合：动物、夜景、悬疑、版画质感的片头
- 技术（建议）：Canvas 2D
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/scratchboard.md)

<a id="C-093"></a>

## C-093 点刻

```text
用点刻风格：一支 0.25 mm 针管笔在光滑白卡纸上一个点一个点地点出来，所有点一样大，明暗只由点的疏密决定，没有线、没有排线、没有轮廓，边缘就是点密度变化的地方，先点最暗的部分再向亮处扩散，点只出现、不渐入、不移动。
```

- 题材：手绘与绘画
- 适合：博物与自然标本、科普、慢节奏纪录片
- 技术（建议）：Canvas 2D
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/stipple.md)

<a id="C-094"></a>

## C-094 民间故事绘本

```text
用民间故事绘本风格：奶油色纸上先有一幅完整的铅笔底稿，再上水粉和水彩，近处厚涂、饱和、笔触可见，中景变成透明的薄水彩，远处干脆只留铅笔线，画面越远越空，深度就靠这种画法本身。
```

- 题材：手绘与绘画
- 适合：童话与民间故事、亲子内容、乡村题材
- 技术（建议）：Canvas 2D
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/folkTale.md)

<a id="C-096"></a>

## C-096 铜版雕刻（博物图版）

```text
用 19 世纪铜版雕刻博物图版风格：刻刀在铜板上刻出由细变粗再收尖的线，明暗全靠排线（一层平行线、二层交叉、最暗处第三层），不用任何灰色填充，奶油色版画纸上有压痕和边框，罗马体大写标题配意大利体学名，印好之后再手工罩一层透明水彩，颜色可以溢出线条。
```

- 题材：印刷、版画与装饰
- 适合：自然博物、历史、科普、美术馆展览
- 技术（建议）：Canvas 2D
- 参考：[Lemo 说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/engraving/STYLE.md)

<a id="C-097"></a>

## C-097 单线雕版

```text
用单线雕版风格：整幅画只用一根不断的雕刻线，像螺旋一样绕出整个形体，线的粗细随明暗变化，亮处细、暗处粗，没有任何填充和别的笔画，整幅图就是一笔。
```

- 题材：印刷、版画与装饰
- 适合：品牌标志、月亮与星球等圆形主体、艺术短片
- 技术（建议）：Canvas 2D
- 参考：[anidoodle 风格索引](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/INDEX.md)

<a id="C-099"></a>

## C-099 手工刺绣

```text
用手工刺绣风格：棉线穿过绷在木绣绷里的亚麻布，每个形状的边缘就是针脚的线头，茎用轮廓绣、花瓣用缎面绣顺着形状排、叶子用鱼骨绣、花心用法式结粒绣，光从左上来，针脚按绣的顺序一针一针缝出来。
```

- 题材：纸艺、材质与定格
- 适合：手工艺与家居、母婴、节日祝福、非遗
- 技术（建议）：Canvas 2D
- 参考：[anidoodle 配方](https://github.com/alexgreensh/anidoodle/blob/main/skills/anidoodle/references/styles/embroidery.md)
