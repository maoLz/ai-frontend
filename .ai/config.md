很好，这一步你想得**非常对** 👍
👉 **把 HTTP Node 的 JSON 配置规则单独整理出来，让 AI / 人 来“填配置”，而不是写代码**
这是工作流系统能规模化落地的关键。

下面我给你一份 **「HTTP Node 配置规则说明（可直接给 AI 用）」**，我会按：

* 📌 **总体约定**
* 📌 **完整 JSON 结构**
* 📌 **字段逐项说明**
* 📌 **变量 & 上下文规则**
* 📌 **完整示例（可复制）**
* 📌 **给 AI 的 Prompt 模板**

来整理，你可以**原样拿去单独开一个对话**。

---

# HTTP Node 配置规则说明（Workflow）

> 本配置用于 **工作流系统中的 HTTP 类型节点（HTTP Node）**，
> 用来描述如何发起一次 HTTP 请求，以及如何从流程上下文中取值。

---

## 一、总体约定（非常重要）

### 1️⃣ 配置格式

* JSON 格式
* 存储在 `FlowNode.config` 字段中
* **只描述请求行为，不包含业务代码**

### 2️⃣ 支持能力

* HTTP 方法：GET / POST / PUT / DELETE
* URL 路径参数（`{id}`）
* Query 参数
* Header 参数
* JSON Body 参数
* 从流程上下文 `context` 取值
* 类型转换（STRING / NUMBER / BOOLEAN）

---

## 二、完整 JSON 结构（总览）

```json
{
  "method": "POST",
  "url": "http://example.com/api/order/{orderId}",
  "headers": {
    "Authorization": "${context.token}",
    "Content-Type": "application/json"
  },
  "params": [
    {
      "name": "orderId",
      "type": "STRING",
      "location": "PATH",
      "value": "${context.orderId}"
    }
  ]
}
```

---

## 三、字段说明（逐项）

### 1️⃣ method（必填）

HTTP 请求方法。

```json
"method": "POST"
```

**可选值**

* `GET`
* `POST`
* `PUT`
* `DELETE`

---

### 2️⃣ url（必填）

请求地址，支持路径参数。

```json
"url": "http://example.com/api/order/{orderId}"
```

📌 `{orderId}` 会被 `location = PATH` 的参数替换。

---

### 3️⃣ headers（可选）

HTTP 请求头，**支持从上下文取值**。

```json
"headers": {
  "Authorization": "${context.token}",
  "Content-Type": "application/json"
}
```

---

### 4️⃣ params（可选，数组）

参数定义数组，用于描述请求中使用的动态参数。

```json
"params": [
  {
    "name": "status",
    "type": "STRING",
    "location": "QUERY",
    "value": "PAID"
  }
]
```

---

## 四、params 字段详细说明（非常重要）

### params[i].name（必填）

参数名。

```json
"name": "orderId"
```

---

### params[i].type（必填）

参数类型，用于类型转换。

```json
"type": "STRING"
```

**可选值**

* `STRING`
* `NUMBER`
* `BOOLEAN`

---

### params[i].location（必填）

参数放置位置。

```json
"location": "BODY"
```

**可选值**

| 值        | 说明       |
| -------- | -------- |
| `PATH`   | URL 路径参数 |
| `QUERY`  | URL 查询参数 |
| `BODY`   | JSON 请求体 |
| `HEADER` | 请求头      |

---

### params[i].value（必填）

参数值，支持从流程上下文取值。

```json
"value": "${context.amount}"
```

---

## 五、上下文（context）取值规则

### 1️⃣ 基本语法

```text
${context.xxx}
```

### 2️⃣ 示例

假设流程上下文为：

```json
{
  "orderId": "10001",
  "amount": 88.5,
  "token": "Bearer abc"
}
```

则：

```json
"value": "${context.amount}"
```

最终值为：

```json
88.5
```

---

## 六、请求组合规则（执行时）

| 参数位置   | 行为                |
| ------ | ----------------- |
| PATH   | 替换 URL 中 `{name}` |
| QUERY  | 拼接到 `?a=b&c=d`    |
| BODY   | 合并为 JSON 请求体      |
| HEADER | 放入 HTTP Header    |

---

## 七、完整示例（推荐给 AI 生成）

### 示例：调用订单支付接口

```json
{
  "method": "POST",
  "url": "http://localhost:8080/api/order/{orderId}/pay",
  "headers": {
    "Authorization": "${context.token}"
  },
  "params": [
    {
      "name": "orderId",
      "type": "STRING",
      "location": "PATH",
      "value": "${context.orderId}"
    },
    {
      "name": "amount",
      "type": "NUMBER",
      "location": "BODY",
      "value": "${context.amount}"
    },
    {
      "name": "currency",
      "type": "STRING",
      "location": "BODY",
      "value": "CNY"
    }
  ]
}
```

---

## 八、给 AI 的 Prompt 模板（你可以直接复制）

> **Prompt：**

```
你是一个工作流系统的配置助手。
请帮我生成一个 HTTP Node 的 JSON 配置，遵循以下规则：

- 使用 JSON 格式
- 包含 method、url
- 如果有动态参数，请使用 params 数组
- 参数 location 只能是 PATH / QUERY / BODY / HEADER
- 参数 value 如来自流程上下文，请使用 ${context.xxx}
- 不要生成多余字段

需求描述如下：
【在这里描述你要调用的接口】
```

---

## 九、你现在这套 HTTP Node 配置的“完成度”

你已经具备：

* ✅ 完整参数模型
* ✅ Context 驱动
* ✅ AI 可生成、可校验的配置
* ✅ 完全低代码 / 配置化

👉 **这是一个“可以让 AI 当配置工程师”的设计**

---

如果你愿意，下一步我可以帮你继续整理：

* 🔥 **HTTP Node 的 outputMapping 规则说明**
* 🔥 **Gateway（条件节点）配置规则**
* 🔥 **Human Node（人工节点）配置规则**
* 🔥 **一个完整流程的 DSL 示例**

你想下一步让 AI 帮你**生成「请求配置」**，还是**生成「完整流程定义」**？
