# 小书房：精细模型第一版

新增地址为 `/room/?lang=zh` 或 `/room/?lang=en`。网站根页面仍是现有普通主页；本阶段没有切换首页入口，也没有部署线上版本。

## 已实现

- 同一场景内的完整房屋：四面墙、双面拱门、屋顶、门廊、步道、花盆与庭院灌木。门外由墙和屋顶遮住室内；室内探索时根据视角隐藏近侧墙，转向门口时可看到入口墙内侧。
- 圆角书桌、双色纸张夹板、书架、柜内有层板和服饰的衣柜，以及沙发、靠枕、边桌、台灯、地毯、挂画、办公椅和多处植物。
- 沙发和植物注册了稳定 ID、动作类型与空间锚点，后续可接入坐下 / 起身 / 浇水。未绑定的动作当前不显示提示，也不能点击触发。
- 方向键 / WASD 行走、斜向等速、碰撞与边界、失焦清空按键。
- Q / E 左右旋转镜头，按住鼠标左键拖动旋转，纵向拖动微调俯视角；走动方向始终跟随画面。室内支持环绕，外墙根据视角自动隐藏；门廊限制在门前左右 60°。
- 走近后鼠标点击物品；鼠标悬停才显示名称，键盘操作入口只在 Tab 聚焦时出现在物品旁。
- 简洁游戏界面：右上角只有无底色语言切换，初始移动按键提示在走动后淡出；没有欢迎文案或底部按钮栏。
- 简历抬起 / 放回动画、可选择复制的 HTML 正文、Esc 和浏览器前进 / 后退。
- 细化角色脸部、发束、鞋子、挂绳；三顶帽子与无帽状态，灰色衬衫领卫衣、粉色开衫、黄色连帽衫有不同细节；浏览器保存装扮。
- 完整发顶、偏分刘海、侧发和低马尾；戴帽时保留帽下头发。桌前座椅朝向桌面。
- 奶油色小屋插画与分阶段加载进度条，随资源、房间和角色准备推进；首帧画出后淡入场景。经典主页入口仅在失败或禁用 JavaScript 时显示。
- 博客读取 `site.posts`，论文读取可选的 `_data/publications.yml`；没有内容时显示空状态。
- 手机 / 平板直接访问房间时转入普通版，不请求 Three.js 和房间资源。窄窗口电脑仍可使用房间。
- WebGL 或资源失败时提供普通版入口。减少动态效果设置会缩短过渡。

当前是可继续调整的程序化精细模型第一版，使用独立部件与关节组动画；尚未制作 Blender 源文件、GLB 或蒙皮动画。原始个人照片不用于网页资源。已接受的灰模源文件快照保存在 `_design/interactive-home/greybox-20260930/`；模型与未来动作接口见 [本轮记录](../_design/interactive-home/model-pass-01.md)。

## 本机预览（Windows + 已有 WSL）

需要 Node.js 22.12+、WSL 中的 Ruby / Bundler 和 Gemfile 依赖。本机已发现 Ubuntu-24.04，用户 gems 位于 `~/gems`。从仓库根目录运行：

```powershell
Push-Location room-app
npm.cmd ci
Pop-Location
node scripts/build-site.mjs --wsl Ubuntu-24.04
node scripts/preview-site.mjs
```

打开 `http://localhost:4173/room/?lang=zh`。服务保持在前台运行，Ctrl+C 停止。修改源代码后重新执行构建命令并刷新浏览器；当前预览服务器不自动构建。

`build-site.mjs` 顺序执行 TypeScript 检查、Vite 构建、资源清单生成、Jekyll 构建和产物完整性检查。`--wsl` 只把 Ruby/Jekyll 步骤放入 WSL，前端构建仍使用 Windows Node。

## Linux / macOS 运行机器

```bash
cd room-app
npm ci
cd ..
bundle install
node scripts/build-site.mjs
node scripts/preview-site.mjs
```

根目录的 `Gemfile` / `Gemfile.lock` 是 Ruby 依赖文件，需要一并带到运行机器；它们在本次开发开始时为未跟踪文件，未自动提交。若机器尚无 Gemfile，内容为：

```ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
```

用户主页默认不需要 `baseurl`。如果部署在仓库子路径，构建时使用 `node scripts/build-site.mjs --baseurl /repository-name`；预览时设置 `STUDY_BASEURL=/repository-name`，从对应路径访问。不要直接双击 HTML 文件。

## 操作

1. 门廊直接点击门进入。走近并点击门铃，打开当前语言普通主页。
2. 场景加载后即可使用 WASD / 方向键移动，鼠标始终可用；焦点离开后点击场景恢复。
   Q / E 旋转镜头，或按住左键拖动。点击物品时保持鼠标位置，拖动后松开不会打开物品。阅读、换装和进出门动画期间暂停旋转，结束后恢复对应区域此前的视角。
3. 走到桌子前，点击中文 / 英文纸张；阅读时方向键正常滚动，不会移动角色。
4. Esc 或关闭按钮放回纸张。浏览器后退 / 前进可关闭 / 恢复阅读。
5. 走近书架查看内容，走到右侧衣柜前换帽子和上衣。换装时角色走到柜门前方，镜头对准全身，关闭后恢复原位置。
6. 回门廊时，鼠标移到室内前方带小箭头的门垫并点击。无需使用导航按钮；距离较远时通过短暂淡入淡出衔接出门动作。

鼠标点击普通地面不会移动角色。远处点击简历、书架或衣柜会提示先靠近；门口出口可直接点击离开。场景中的可聚焦操作入口遵守相同规则，不显示为按钮栏。

## 验证

```bash
cd room-app
npm run test:unit
npx playwright install chromium
npm run test:browser
```

浏览器测试需要先完成整站构建；没有预览服务时测试会自动启动，已有 `127.0.0.1:4173` 服务时会复用。报告位于 `room-app/playwright-report`，截图及失败 trace 位于 `room-app/test-results`。

Windows 也可使用已安装的 Edge，跳过下载测试浏览器：

```powershell
$env:STUDY_BROWSER_CHANNEL = 'msedge'
Push-Location room-app
npm.cmd run test:browser
Pop-Location
```

本机测试默认使用浏览器的图形设置；CI 使用 SwiftShader 软件渲染。本机需要复现 CI 图形路径时设置 `STUDY_SOFTWARE_WEBGL=1`。软件渲染在复杂场景和实时阴影下可能明显慢于实际 GPU，不能将其截图测试时间当作用户设备帧率。

`.github/workflows/room-preview.yml` 是手动触发的验证工作流，只构建、运行测试并上传预览 artifact，不发布 GitHub Pages。当前站点的线上部署流程尚未切换。

## 文件与内容维护

- `src/domain.ts`：移动、碰撞、距离判定、装扮校验。
- `src/world.ts` / `src/avatar.ts`：完整房屋、视角裁切与角色部件。
- `src/modeling.ts` / `src/furnishings.ts`：圆角网格、材质、静态合批、家具与植物。
- `src/layout.ts` / `src/furniture-actions.ts`：家具碰撞范围、未来动作注册及空间锚点。
- `src/main.ts`：输入、相机、拾取、动画状态与历史记录。
- `src/ui.ts` / `src/style.css`：双语界面、阅读与换装面板。
- `../_layouts/room.html`：Jekyll 布局；通过 `resume_lang` 标记复用两份首页 Markdown。
- `../assets/js/room-device.js` / `room-entry.js`：移动分流和资源延迟加载。
- `../scripts/`：构建、资源清单、产物检查与本地预览。

继续编辑 `index.md` 和 `index_zh.md` 即可更新两份房间简历。当前只有一个 `CV.pdf`，两种语言的面板均明确链接这份现有 PDF。

Vite 与 Jekyll 的衔接采用生成资源清单的方式，参考 [Vite 官方说明](https://vite.dev/guide/backend-integration.html)。`assets/room/`、`_data/room_assets.json` 和 `_site/` 是忽略的构建产物，不需要手动维护；Node 源码、脚本和设计稿不会进入站点产物。
