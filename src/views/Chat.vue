<template>
  <div class="chatgpt-page">
    <!-- 消息区 -->
    <div class="chat-list" ref="chatRef">
      <div
        v-for="(item, index) in messages"
        :key="index"
        class="chat-item"
        :class="item.role"
      >
        <div class="avatar">
          {{ item.role === 'user' ? '你' : 'AI' }}
        </div>

        <div class="bubble">
          <!-- Think 模式 -->
          <details v-if="item.role === 'assistant' && item.think" class="think">
            <summary>🤔 思考过程</summary>
            <pre>{{ item.think }}</pre>
          </details>

          <!-- Markdown 回复 -->
          <v-md-preview
            v-if="item.role === 'assistant'"
            :text="item.content"
          />

          <!-- 用户消息 -->
          <div v-else class="plain-text">
            {{ item.content }}
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input">
      <el-input
        v-model="inputText"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 6 }"
        resize="none"
        placeholder="输入内容，Enter 发送，Shift + Enter 换行"
        @keydown="handleKeydown"
      />

      <div class="actions">
        <el-switch
          v-model="thinkMode"
          active-text="Think"
        />
        <el-button
          v-if="loading"
          @click="stopGenerate"
        >
          停止
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="sendMessage"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

/* ======================
   状态
====================== */
const messages = ref([
  {
    role: 'assistant',
    content: '你好 👋\n\n我是 **ChatGPT 风格（亮色）**，支持 **流式输出 + Think 模式**。',
    think: ''
  }
])

const inputText = ref('')
const loading = ref(false)
const thinkMode = ref(false)
const chatRef = ref(null)

let controller = null

/* ======================
   发送消息（流式）
====================== */
const sendMessage = async () => {
  if (!inputText.value.trim() || loading.value) return

  messages.value.push({
    role: 'user',
    content: inputText.value
  })

  const userText = inputText.value
  inputText.value = ''
  loading.value = true

  const aiMessage = {
    role: 'assistant',
    content: '',
    think: ''
  }
  messages.value.push(aiMessage)

  controller = new AbortController()

  await nextTick()
  scrollToBottom()

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        think: thinkMode.value
      }),
      signal: controller.signal
    })

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })

      /**
       * 约定后端格式（你可以改）：
       * data: {"type":"think","content":"..."}
       * data: {"type":"answer","content":"..."}
       */
      chunk.split('\n').forEach(line => {
        if (!line.startsWith('data:')) return
        const data = JSON.parse(line.replace('data:', '').trim())

        if (data.type === 'think') {
          aiMessage.think += data.content
        } else {
          aiMessage.content += data.content
        }
      })

      scrollToBottom()
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      aiMessage.content = '❌ 请求失败'
    }
  } finally {
    loading.value = false
    controller = null
  }
}

/* ======================
   停止生成
====================== */
const stopGenerate = () => {
  controller?.abort()
  loading.value = false
}

/* ======================
   键盘
====================== */
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

/* ======================
   滚动
====================== */
const scrollToBottom = async () => {
  await nextTick()
  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight
  }
}

watch(messages, scrollToBottom, { deep: true })
</script>

<style scoped>
.chatgpt-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.chat-item {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.chat-item.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.chat-item.assistant .avatar {
  background: #dbeafe;
}

.bubble {
  max-width: 720px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.chat-item.user .bubble {
  background: #ecfeff;
}

.plain-text {
  white-space: pre-wrap;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.think {
  background: #fff7ed;
  border: 1px dashed #fdba74;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 13px;
}

.think summary {
  cursor: pointer;
  font-weight: bold;
}
</style>