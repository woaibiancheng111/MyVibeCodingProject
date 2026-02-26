# 长辈用药与复诊提醒助手（MVP）

一个面向银发经济场景的首个 `vibe coding` 项目：
- 用药计划管理
- 复诊计划管理
- 家属联系人管理
- 浏览器通知 + 语音提醒
- 本地 JSON 持久化

## 技术栈

- Node.js
- Express
- 原生 HTML/CSS/JS

## 快速启动

```bash
cd elder-med-reminder
npm install
npm start
```

打开：`http://localhost:3000`

## MVP 功能说明

1. 用药计划
- 录入药名、剂量、提醒时间（可多个，逗号分隔）
- 首页展示今日即将提醒事项

2. 复诊计划
- 录入日期、时间、医院/科室
- 与用药事项统一展示在概览区

3. 家属联系人
- 保存联系人姓名、手机号、关系
- 作为后续短信/微信通知扩展基础

4. 提醒能力
- 每分钟检查一次当前时间
- 命中用药时间后触发语音播报
- 如果浏览器已授权，发送系统通知
- 记录提醒日志

## 项目结构

```text
elder-med-reminder/
  data/db.json
  public/
    index.html
    styles.css
    app.js
  server.js
  package.json
```

## 下一步迭代建议

1. 接入短信服务（阿里云/腾讯云）给家属发送提醒
2. 增加登录与多家庭成员共享
3. 接入医院挂号/复诊日历同步
4. 增加“未服药确认”与依从性统计图
