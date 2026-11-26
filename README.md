# vibeproject

纯机器做工，无古法手工 —— 创意 Vibe Coding 项目合集仓库。

## 🌐 在线体验（GitHub Pages）

- **总导航入口**：https://arthur618.github.io/vibeproject/
- **Arcade9 · 九宫奇趣屋**：https://arthur618.github.io/vibeproject/arcade9/
- **moyu · 摸鱼游乐场**：https://arthur618.github.io/vibeproject/moyu/
- **Papercraft 3D 模板示例**：https://arthur618.github.io/vibeproject/papercraft/skills/papercraft/assets/templates/popup-3d/

## 📦 项目列表

| 目录 | 项目名称 | 在线试玩 / 运行方式 | 简介 |
| :--- | :--- | :---: | :--- |
| [`arcade9/`](./arcade9/) | **Arcade9 · 九宫奇趣屋** | [在线运行](https://arthur618.github.io/vibeproject/arcade9/) | 纯原生 HTML5 Canvas + Web Audio 合成音效的九宫格创意小游戏合集（含 9 款原创微游戏） |
| [`moyu/`](./moyu/) | **moyu · 摸鱼游乐场** | [在线运行](https://arthur618.github.io/vibeproject/moyu/) | 18 个零依赖小游戏：9 个轻量游戏 + 9 个无倒计时益智游戏，支持本地纪录和移动端按钮 |
| [`papertrails/`](./papertrails/) | **Papertrails**（by [@xikhar](https://github.com/xikhar/papertrails), MIT） | `cd papertrails && npm i && npm run dev` | 基于 Three.js 的无尽折纸立体书探索世界，走动时树屋、河流与山丘随折痕立体展开 |
| [`papercraft/`](./papercraft/) | **Papercraft Skill & Templates**（by [@xikhar](https://github.com/xikhar/papercraft), MIT） | [3D 模板预览](https://arthur618.github.io/vibeproject/papercraft/skills/papercraft/assets/templates/popup-3d/) | 手工立体书纸艺风格 Agent Skill，含 Three.js / Canvas 2D 纸艺渲染库与 3D/2D 模板示例 |

## 🧩 已安装的 Agent Skill

- `.agents/skills/papercraft/`：`xikhar/papercraft`（v0.6.0），同时已全局安装至 `~/.gemini/config/skills/papercraft/`。

## 🚀 本地运行示例

在仓库根目录启动静态服务即可同时预览总导航、`arcade9`、`moyu` 与 `papercraft` 模板：

```bash
python3 -m http.server 8765
```

然后在浏览器打开 `http://localhost:8765/`。
