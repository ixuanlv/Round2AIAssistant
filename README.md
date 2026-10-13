# Round2 AI Assistant

第一阶段 CloudPebble / Alloy 最小验证版本，目标平台为 Pebble Round 2（Gabbro）。

## 当前功能

- Round 2 圆形屏幕安全区域布局，按 260 x 260 设计。
- SELECT 键启动语音输入。
- 语音转文字后显示在手表上。
- UP/DOWN 键测试文本显示和振动。
- 手表通过 AppMessage 将问题发送到手机端。
- 手机端返回固定测试回复。
- 暂未接入豆包或其他 AI API。

## CloudPebble 文件

将整个项目结构复制到 CloudPebble：

- `package.json`
- `src/embeddedjs/manifest.json`
- `src/embeddedjs/main.js`
- `src/pkjs/index.js`

目标平台只保留 `gabbro`。

## 第一阶段测试

1. 在 CloudPebble 中创建 Alloy / Moddable 项目，或导入这些文件。
2. 选择 Gabbro 模拟器并编译运行。
3. 确认能看到 `ROUND 2 ASSIST`。
4. 按 UP 或 DOWN，确认文本变化并振动。
5. 按 SELECT，确认出现系统语音输入界面。
6. 说一句英文或中文，确认转写结果能显示。
7. 确认随后出现 `Test reply OK...`。

如果中文显示为方框或乱码，先把 CloudPebble 的运行日志和截图发回；第一阶段暂时以英文界面作为兼容基线。
