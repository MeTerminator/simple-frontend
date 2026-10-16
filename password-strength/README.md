# Password Strength · 密码复杂度力量测试机

将密码复杂度检测做成游乐场的力量测试机：点击 Check，杠杆敲击底座，滑块按密码复杂度弹起；Strong 等级会点亮绿色刻度并敲响铃铛。

使用原生 HTML、CSS、JavaScript 和 SVG 实现，无第三方依赖、无需构建，适配桌面和手机屏幕。

## 运行

克隆仓库后，直接用浏览器打开 `password-strength/index.html`，并保留同目录的 `assets/` 文件夹；页面运行无需联网。

也可以在仓库根目录运行：

```sh
python3 -m http.server 8765 --directory password-strength
```

访问 [http://localhost:8765](http://localhost:8765)。如果已进入 `password-strength/` 目录，运行 `python3 -m http.server 8765` 即可。

## 操作流程

1. 输入密码，点击 **Check** 或按回车检测复杂度。
2. 杠杆敲击底座，滑块按 Weak、Fair、Good、Strong 对应的高度弹起。
3. Weak、Fair 保持 **Check**，不能进入下一页；Good、Strong 将按钮变为 **Continue**。
4. 动画结束后点击 Continue，进入标题为 **Password** 的页面，在黄色虚线框中展示刚设置的密码。
5. 检测通过后若编辑密码，按钮恢复 Check，需要重新检测。

输入框聚焦时显示亮蓝色边框与淡蓝光圈。检测结果同步更新刻度、输入框边框和提示；Weak 反馈同时触发约 500 毫秒的左右衰减抖动；编辑密码会取消旧动画。

眼睛按钮切换明文/隐藏；音效默认开启，没有关闭开关。浏览器通常需要首次输入或点击后才允许播放。没有播放演示或重置按钮；刷新页面重新开始。

底部 `MeTerminator/simple-frontend` 指向 [GitHub 仓库](https://github.com/MeTerminator/simple-frontend)，通过 `target="_blank"` 和 `rel="noopener noreferrer"` 在新标签页或窗口打开。

## 复杂度规则

规则从上到下依次判断，命中后即返回结果。

| 等级 | 条件 | 可继续 |
| --- | --- | --- |
| Weak | 少于 8 个字符，或不同字符少于 4 个，或命中内置常见密码模式 | 否 |
| Strong | 至少 20 个字符；或至少 4 个以空白分隔的词且长度至少 18；或长度至少 12 且包含至少 3 种字符类别 | 是 |
| Good | 未命中前面规则，长度至少 12，或包含至少 3 种字符类别 | 是 |
| Fair | 其余通过基础检查的密码 | 否 |

字符类别为：小写英文字母、大写英文字母、数字、非字母数字下划线且非空白的符号。长度按 JavaScript 字符串的 `length` 计算。

内置常见模式包括 `password` 加可选数字、`123456` 加可选数字，以及 `qwerty`、`abcdefgh` 等前缀后接单词字符的组合，具体以 `strength(value)` 为准。

示例：

| 输入 | 结果 |
| --- | --- |
| `password1` | Weak |
| `sunflower` | Fair |
| `sunflowerday` | Good |
| `correct horse battery staple` | Strong |

这些是本地启发式规则，未接入泄露密码库或密码熵估计服务。

## 目录结构

```text
password-strength/
├── README.md
├── index.html       # 页面、样式、SVG 与交互逻辑
└── assets/
    ├── key.mp3      # 输入音效
    ├── weak.mp3     # 普通敲击音效
    └── strong.mp3   # 强密码敲击与铃铛音效
```

## 实现与修改

编辑 `index.html` 即可调整效果：

- `index.html`：页面结构、CSS、内联 SVG 及 JavaScript。
- `strength(value)`：复杂度评分；`result(level)`：刻度、提示与 Check/Continue 状态。
- `strike()`：Web Animations API 驱动杠杆、滑块与拖影。
- `nextPhase()`：再次检查通过条件，以 `textContent` 展示密码原文。
- `assets/key.mp3`：输入音效。
- `assets/weak.mp3`：普通敲击音效。
- `assets/strong.mp3`：强密码敲击与铃铛音效。

声音截取自制作时提供的参考视频。密码仅在页面内存中处理，不发送、不持久化；刷新页面后清除。

## 数据处理

密码不会发送到服务器，也不会写入浏览器存储。结果页以 `textContent` 显示用户输入，HTML 符号按原文展示。通过状态与检测时的输入关联，编辑密码后必须重新检测。

## License

仓库采用 [MIT License](../LICENSE)。

[返回项目索引](../README.md)
