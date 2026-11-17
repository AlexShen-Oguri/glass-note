# Windows / macOS 升级验收

目标是验证旧版留下的真实有效记录能被新版读取、继续编辑并再次保存。安装成功、进程仍在或一个样例文件没有变化，各自只能证明其中一部分。

## 准备测试版本与环境

优先在独立系统测试用户或虚拟机中操作，用合成记录；测试前仍应导出备份。安装/覆盖应用会修改本机程序和注册信息；导入“替换”会修改所选个人数据，不要拿日常账户做第一次试验。

验收 1.1.0 时，从公开 `v1.0.0` 升级。新版的构建来源以下载信息为准。两个同版本号的构建相互覆盖只能检查部分文件保留。若继续支持 `0.1.11` 预览用户，还应保留那条升级路径。

记录：系统版本/CPU、旧版/新版版本、候选 source commit、构建任务链接（如有）、安装包 SHA256、安装位置、测试结果。Windows x64、macOS Apple Silicon、macOS Intel 分别记录实际执行状态；通用包包含两种架构不等于在两种机器上都运行过。当前 macOS 最低配置为 12，CI 的 macOS 15 检查不能覆盖所有支持版本。

## 五步人工验收

1. **在旧版通过界面准备记录。** 至少保存：语言/单位/动效偏好；一个确切来源版本的收藏和私人酒单；材料与拥有瓶款；带照片、两次保存版本及中文/特殊字符笔记的私人配方；一个实验项目/配方版本/批次；调制进度/完成记录；一条口味评价。退出再打开，确认旧版本来就保存成功，然后导出 `before.json` 并记录关键字段/截图。不要直接写伪造存储 JSON。
2. **退出旧版，覆盖安装。** 同一系统用户、同一安装位置，保留应用数据。Windows 运行新版 `setup.exe`；macOS 打开新版 DMG，把 Glass Notes 拖到原来的 Applications 位置并选择替换。不要先卸载、清数据，或从 DMG 直接启动作为验收结果。
3. **确认运行的确实是新版。** 检查下方平台信息，排除另一份旧应用/重复注册项。应用标识仍应为 `com.glassnotes.desktop`；存储目录不因版本改变。没有自动升级机制，下载包但未覆盖不算升级。检查首页酒杯可见、动效暂停/恢复可用，并在首页、私人配方和备份之间往返；导航应可响应，无持续空白或卡住。浏览器深链接首次打开私人配方/备份后再回首页也应正常；记录实际机器的图形表现，不能以 CI 的无头 Chromium 结果替代。
4. **逐项验证保留与新写入。** 检查第一步所有记录的内容、来源版本、照片、历史版本和关系。新建一条私人配方并编辑一条旧记录；完成一次保存，退出重开两次，再导出 `after.json`。比较备份中的业务分类/引用和预期改动，核对照片与文本；导出时间等元数据允许变化，不要求整个文件逐字节一致。另在隔离账户中预览并恢复 `before.json`，确认备份也可用；不要覆盖原测试账户来“证明”数据原本保留。
5. **记录通过或失败。** 所有原记录可读，新增/编辑重开后仍在，备份可恢复，启动无空白/崩溃/静默清空或恢复阻断，才算这条路径通过。失败时停止继续写入，保留旧备份、候选版本和脱敏错误证据；不要反复清数据掩盖问题。旧安装包不保证能读取新版写入的数据，回退应在隔离环境使用兼容版本和旧备份验证。

涉及备份/存储变动时，再增加：旧 schema 1/2/3 导入、合并/替换、取消/损坏文件、完整备份超过 5,000,000 字节且各分类仍合法、保存失败或中断后的恢复。优先使用合成数据和故障注入测试，不在个人电脑中途强杀写入来制造故障。

## Windows 核对

在 PowerShell 中读取新版安装包哈希，将文件名替换为实际下载位置，与该候选的构建/发布校验记录比较：

```powershell
Get-FileHash 'C:\test-packages\windows-x64-setup.exe' -Algorithm SHA256
```

覆盖安装后读取注册信息：

```powershell
Get-ChildItem 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall' |
  Get-ItemProperty |
  Where-Object DisplayName -EQ 'Glass Notes' |
  Select-Object DisplayName, DisplayVersion, InstallLocation, MainBinaryName
```

预期只有一个 Glass Notes 项，`DisplayVersion` 是候选版本，`InstallLocation` 与旧版相同。通过此位置的实际可执行文件启动，不只看开始菜单的快捷方式。安装器面向当前用户；运行依赖 WebView2，首次安装缺少运行库时可能需要网络。

业务记录在 `%APPDATA%\com.glassnotes.desktop\data`。只核对/复制留证，不手动编辑或删除。新旧包均未签名时，记录系统提示与来源核验结果，不把提示关闭视为测试通过。

## macOS 核对

先校验 DMG 的 SHA256 和完整性（替换示例路径）：

```sh
shasum -a 256 '/path/to/macos-universal.dmg'
hdiutil verify '/path/to/macos-universal.dmg'
```

完成替换后，检查安装到 Applications 的实际副本：

```sh
test_app='/Applications/Glass Notes.app'
/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$test_app/Contents/Info.plist"
/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' "$test_app/Contents/Info.plist"
codesign --verify --deep --strict --verbose=2 "$test_app"
lipo "$test_app/Contents/MacOS/glass-notes-desktop" -verify_arch arm64 x86_64
open "$test_app"
```

预期标识为 `com.glassnotes.desktop`、版本为候选版本，签名校验和双架构检查成功，然后执行五步中的业务验收。若原来安装在用户自己的 Applications，则全程使用那个相同位置；不能同时留两份不同版本来判断升级。

业务记录在 `~/Library/Application Support/com.glassnotes.desktop/data`，同一系统用户下覆盖 `.app` 后应仍可读取。当前包使用 ad-hoc 签名，未 Apple 公证；签名完整性检查不证明公证或 Gatekeeper 体验通过。实际出现的首次打开提示和处理结果需如实记录；不要通过移除 quarantine 或关闭系统保护来替代验收。

## 现有自动检查的证据边界

| 检查 | 实际验证 | 仍缺的证据 |
| --- | --- | --- |
| `npm run validate` | 类型、Node 行为/内容测试、Web 导出、Chromium 桌面/手机宽度 E2E | Windows/macOS 安装升级、真实手机 Safari/Chrome |
| `npm run desktop:test -- --locked` | Rust 宿主存储测试 | 安装器行为、完整 UI 与业务记录升级 |
| Windows release CI / `scripts/check-windows-install.ps1` | 在临时 runner 默认从 `1.0.0` 升级：注册版本、安装目录、一个原始样例文件不变、程序至少启动 10 秒 | 有效业务记录解析/照片/历史版本/升级后读写。样例 JSON 是文件保留标记，不是有效实验室业务记录 |
| macOS release CI | bundle 标识/版本、ad-hoc 签名、双架构、DMG 完整性、启动 | Applications 中旧版覆盖升级、个人数据保留、Intel/各支持系统真实运行 |

Windows 安装检查脚本有“仅临时 Windows CI runner”保护，不要在日常电脑绕过保护运行。候选版本应附实际 CI run 的成功结果；仓库里存在 workflow 不表示它已经运行。构建产物上传也不等于创建 GitHub Release。

需要补测旧预览升级时，在独立临时 Windows runner 上传入 `-BaselineTag v0.1.11`；结果中的 baseline 应与实际下载版本一致。

## 开发侧准备与证据保存

先按 [CONTRIBUTING](../CONTRIBUTING.md) 完成候选检查。以下命令会下载依赖/浏览器并写入生成目录，Rust 测试可能下载 crates 和编译；它们不会替代上面的人工升级：

```sh
npm ci
npm run browser:install
npm run validate
npm run desktop:prepare
npm run desktop:test -- --locked
```

Windows 在具备 MSVC/Windows SDK 的主机运行 `npm run desktop:build -- --target x86_64-pc-windows-msvc`。macOS 安装两种 Rust targets 后运行 `npm run desktop:build -- --target universal-apple-darwin`。打包和构建前置步骤会生成前端及安装产物，不会安装应用；实际配置见 README 和 `.github/workflows/desktop-release.yml`。主机包构建成功不能推断另一系统通过。

测试日志和脱敏截图可放在忽略的 `artifacts/desktop-acceptance/<candidate>/<platform>/`；用测试记录记录旧/新版本、系统/CPU、安装/注册、各业务分类、升级后写入、恢复和问题。个人备份应另存到安全位置，不提交到 Git 或上传到公共 CI/Release。公开说明只列真实验证范围与未验证项。
