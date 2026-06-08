# CareBridge Bootstrap Demo 页面审查报告

审查日期：2026-06-08  
审查范围：当前目录下 14 个主静态页面：`index.html`、`residents.html`、`users.html`、`personnel-analytics.html`、`conversations.html`、`service-inquiries.html`、`conversation-detail.html`、`schedule.html`、`appointment-requests.html`、`schedule-analytics.html`、`care-records.html`、`health-observations.html`、`reports.html`、`security.html`。  
审查重点：语义逻辑、交互逻辑、页面布局规划。已按要求跳过代码语法检查。

## 总体结论

项目已经不是单纯模板页，而是一个可运行的 Bootstrap 多页面 demo。页面壳、左侧导航、列表区、详情区、Bootstrap modal、toast、tab、table、chart 等结构基本统一，核心 demo 数据通过 `assets/js/carebridge.js` 渲染并可通过 `localStorage` 保留。桌面端整体能形成“导航 - 列表 - 详情”的管理台结构，预约审批、消息发送、护理记录提交、健康观测提交、日报生成等主要流程有基础闭环。

但仍存在一些 demo 阶段也能直接看出的逻辑和语义问题：

1. 全局搜索在输入过程中立即跳转，按键输入 `Robert` 时会先用首字母 `R` 匹配到 Eleanor Carter，导致选错住户；粘贴完整词才正确。问题源于 `applyCommandSearch()` 每次 `input` 都立即执行匹配和导航，见 `assets/js/carebridge.js:1649-1668`。
2. 多个搜索/筛选无结果时只清空列表或表格，没有显示“无结果”说明；`reports.html` 甚至在列表无结果时继续显示旧的报告详情，容易造成语义错位。相关渲染见 `assets/js/carebridge.js:570-588`、`713-735`、`941-968`、`971-1005`。
3. 会话归档只把 conversation 状态改为 `archived`，但仍留在会话列表中，关联 inquiry 仍保持 Pending，仪表盘和工单列表仍按未关闭工单计算，见 `assets/js/carebridge.js:2209-2219` 和 `2378-2398`。
4. 员工回复消息后 inquiry 状态变成 `Replied`，但“Pending inquiries / Open inquiries”仍把 Replied 计入未处理总数，因为 `openInquiries()` 只排除 `Closed`，见 `assets/js/carebridge.js:1909-1916` 和 `2378-2381`。
5. 住户权限页的开关看起来可以配置权限，但开关状态是硬编码且不持久化，刷新后恢复默认，见 `assets/js/carebridge.js:1390-1397`。
6. Elderly Today 面板的大按钮 `Call Family`、`Send Voice Message`、`Contact Caregiver`、`Play Reminder` 是普通按钮但没有 `data-action`、没有 disabled 状态，也没有反馈，属于明显的“看起来可点但无行为”。
7. 移动端导航隐藏了所有导航文字和全局搜索，只保留图标；对于业务页面较多的管理台，发现成本较高，且视觉上首屏导航占用较大，见 `assets/css/carebridge.css:1033-1098`。
8. 移动端多个表格依赖横向滚动，尤其 `users.html`、`service-inquiries.html`、`appointment-requests.html`；可以使用，但阅读和操作密度偏高。

## 验证方式

- 使用本地静态服务打开项目：`http://localhost:8000/`。
- 使用 Chrome/Playwright 对 14 个页面分别以桌面视口 `1440x1000` 和移动视口 `390x844` 进行渲染检查。
- 记录页面标题、主导航激活状态、列表区/详情区文本、可见交互按钮、图表 canvas 尺寸、横向溢出、控制台错误。
- 抽测关键交互：全局搜索、列表筛选、预约审批、消息发送、会话归档、权限开关、无结果状态、移动端布局。

## 逐页审查

### 1. `index.html` - Dashboard

语义逻辑：页面聚合待处理 inquiry、预约、今日日程、缺失记录，作为工作台语义成立。但“Pending inquiries”实际来自 `openInquiries()`，只排除 Closed，因此 Replied 也会被算作 pending，和文案不一致。

交互逻辑：点击住户、工单和导航可跳转到对应详情，基础可用。全局搜索存在按键输入过早跳转问题，影响从 dashboard 搜索住户。

页面布局规划：桌面首屏清晰。移动端导航占据较高位置，工作队列下方内容需要大量滚动。

### 2. `residents.html` - Residents

语义逻辑：住户档案、关系、权限、今日日程、近期护理记录和会话组合合理。问题在权限页：开关呈现为真实配置项，但没有状态保存或业务影响。

交互逻辑：新增、编辑、删除住户可用，删除会清理关联 demo 记录。搜索无结果时列表直接为空，没有说明当前是“无匹配”还是加载失败。

页面布局规划：桌面列表和详情分区清晰。移动端详情页内容很长，图表在住户基本信息之前占比较高，可考虑把图表放到次级区域。

### 3. `users.html` - User Management

语义逻辑：RBAC 用户、角色、部门、关联住户、状态基本合理。角色筛选中存在 Admin、Activity Staff、Elderly Resident 等当前默认数据没有的选项，demo 可以接受，但最好用空状态解释。

交互逻辑：新增、编辑、冻结/激活、删除用户可用。搜索无结果时表格显示 `0 users` 但仍展示分析图表，没有明确空结果提示。

页面布局规划：桌面表格可读。移动端表格列数多，横向滚动明显，按钮组挤在右侧，不利于小屏操作。

### 4. `personnel-analytics.html` - Personnel Analytics

语义逻辑：作为人员与住户模块的分析页，指标、图表和“Required module operations”说明合理。

交互逻辑：此页主要展示分析，没有新增/编辑主流程，符合分析页定位。

页面布局规划：桌面图表分布清楚，但首屏只看到上半部分，操作覆盖说明在下方。移动端纵向长度较大，可以接受。

### 5. `conversations.html` - Conversations

语义逻辑：会话 inbox、未读、开放 inquiry、按住户统计的语义成立。主要问题是 Replied 仍被归为 open/pending，导致状态统计和工作队列含义不准确。

交互逻辑：点击会话进入详情，创建 inquiry 可用。打开详情会清除 unread，逻辑合理。

页面布局规划：桌面摘要和两列列表清楚。移动端内容堆叠后仍可读，但会话模块导航只显示图标，页面识别依赖标题。

### 6. `service-inquiries.html` - Service Inquiries

语义逻辑：工单表有 title、resident、assigned、status、priority、action，结构合理。归档会话不会同步 inquiry 状态，是跨模块语义问题。

交互逻辑：创建、状态更新、关闭、删除可用。搜索无结果时表格为空但缺少提示。

页面布局规划：桌面可读。移动端表格过宽，Processing/Close/Delete 按钮组在右侧，需要横向滚动才能完整操作。

### 7. `conversation-detail.html` - Conversation Detail

语义逻辑：消息线程 + 住户快照 + 工单详情组合合理。问题是 `Archive Conversation` 和 inquiry 生命周期没有对应关系：归档后工单仍 Pending，列表仍显示该会话。

交互逻辑：发送消息可用，员工回复后 inquiry 会变成 Replied；但工作队列仍将 Replied 计入 open/pending。归档操作有 toast，但没有真正从列表或统计中退出。

页面布局规划：桌面三块信息密度偏高，右栏操作按钮较多。移动端聊天框、住户资料、工单按钮、图表全部纵向排列，页面较长但没有横向溢出。

### 8. `schedule.html` - Schedule

语义逻辑：日程板、可见性、住户今日计划、预约流程说明合理。Elderly Today 的大按钮语义上像真实入口，但没有任何行为或禁用说明。

交互逻辑：创建、编辑、完成、取消日程可用。审批后的预约会生成 schedule 记录，这一流程通过测试。

页面布局规划：桌面日程板信息量大但清晰。移动端日程项按钮较多，反复出现 Edit/Complete/Cancel，操作密度偏高。

### 9. `appointment-requests.html` - Appointment Requests

语义逻辑：预约申请、审批状态、审批动作和图表统计合理。

交互逻辑：批准 Pending 预约会将状态改为 Approved 并新增 `Visit with Noah Williams` 日程，闭环成立。删除有确认。Rejected 后不会生成日程，符合预期。

页面布局规划：桌面可读。移动端表格列多，审批按钮需要横向滚动；建议小屏改为卡片列表。

### 10. `schedule-analytics.html` - Schedule Analytics

语义逻辑：日程类型、预约状态、任务完成度作为分析页合理。

交互逻辑：无主要操作，符合分析页定位。

页面布局规划：桌面和移动端都可读，但“Required module operations”位置靠下，作为课程覆盖说明可以保留。

### 11. `care-records.html` - Care Records

语义逻辑：每日护理记录、主管复核、完成率、护理趋势图表组合合理。护理记录同日期替换旧记录，符合 README 中的 demo 设定。

交互逻辑：提交记录可用，删除记录有确认。搜索无结果时完成列表为空但没有空状态。

页面布局规划：桌面表单和图表较多，首屏下方内容被截断但可滚动。移动端表单很长，属于正常业务复杂度，但建议将图表放到折叠区或独立分析页。

### 12. `health-observations.html` - Health Observations

语义逻辑：护士体征记录和护理记录上下文关联合理。但右侧 Observation Records 表格在桌面也偏窄，Vitals/Time 信息密集。

交互逻辑：提交健康观测可用，搜索观测记录可用。观测记录没有删除或编辑入口，demo 阶段可以接受，但与 README 中“Modify/Delete”覆盖如果严格要求需要补齐。

页面布局规划：桌面右侧表格窄，移动端纵向阅读尚可。图表与健康观测的关系部分是“护理记录上下文”，语义上稍弱，建议明确哪些指标来自 care records，哪些来自 observations。

### 13. `reports.html` - Daily Reports

语义逻辑：家属可读日报、饮食/睡眠/心情/活动/健康/护理备注语义成立。问题是搜索报告无结果时，列表为空但详情仍显示 Eleanor Carter 的旧日报，容易误导用户。

交互逻辑：生成、重新生成、标记 reviewed、删除、从报告发起 inquiry 可用。若从报告发起 inquiry 后跨页跳转，toast 反馈可能在跳转中不明显。

页面布局规划：桌面报告块和趋势图清楚。移动端内容较长但可读。

### 14. `security.html` - Security

语义逻辑：安全模型、RBAC、居民绑定、审计日志和未来 B/S 架构说明合理。作为支持页，不要求实际安全功能完备。

交互逻辑：Reset Demo Data 可用。页面顶部通知铃铛实际链接到 Security，本页同时又是 Security，语义上可以解释为 audit log，但建议文案更明确。

页面布局规划：桌面和移动端都比较稳定。移动端架构卡片和 audit table 纵向堆叠清楚。

## 优先修改建议

1. 修复全局搜索：不要在每个字符输入时立即导航。可以改为按 Enter、点击结果、或 debounce 后展示候选列表；至少避免首字母误选住户。
2. 统一空状态：所有搜索和筛选无结果时显示明确文案，例如 “No matching residents/users/reports”。报告页无结果时不要继续显示旧详情，或加提示“当前详情不在筛选结果中”。
3. 统一 inquiry 状态模型：明确 Pending、Processing、Replied、Supervisor Review、Closed、Archived 的含义；dashboard 的 pending/open 统计应排除 Replied 或改名为 Non-closed inquiries。
4. 修复会话归档：归档后应从默认会话列表隐藏，或至少同步 inquiry 状态/统计；否则 `Archive Conversation` 的语义不成立。
5. 对无行为控件做处理：Elderly Today 大按钮要么接入 demo toast/流程，要么禁用并标注 demo-only；权限开关要么持久化到 state，要么展示为只读说明。
6. 优化移动端导航：保留文字标签或提供更清楚的二级导航；恢复移动端全局搜索入口或改为显式搜索按钮。
7. 优化移动端表格：用户、工单、预约审批页建议在小屏使用卡片列表替代表格，减少横向滚动和右侧操作按钮挤压。

## 已确认可用的部分

- 14 个主页面均能通过本地静态服务打开并完成 JS 渲染。
- 桌面端未发现全局横向溢出，图表 canvas 均有有效尺寸。
- 主要 Bootstrap 组件可用：modal、tabs、toast、table、button group、form controls。
- 预约批准会创建对应日程记录。
- 消息发送、护理记录提交、健康观测提交、日报生成、用户冻结/激活、删除确认等基础 demo 流程可以运行。
