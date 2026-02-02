<template>
  <div class="ollama-page">
    <div class="panel">
      <h2 class="title">Ollama 对话</h2>
      <el-form label-position="top">
        <el-form-item label="系统提示词">
          <el-input
            v-model="systemPrompt"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入系统提示词"
          />
        </el-form-item>
        <el-form-item label="用户问题">
          <el-input
            v-model="userQuestion"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            placeholder="请输入用户问题"
          />
        </el-form-item>
        <el-form-item label="模型（可选）">
          <el-input v-model="model" placeholder="默认：qwen3:30b" />
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">
          发送
        </el-button>
      </el-form>
    </div>

    <div class="panel result">
      <h2 class="title">输出结果</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-else class="content">
        <pre v-if="content">{{ content }}</pre>
        <div v-else class="placeholder">等待请求结果...</div>
      </div>
      <details v-if="raw" class="raw">
        <summary>原始响应</summary>
        <pre>{{ raw }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { chatOllama } from '@/api/ollama'

const systemPrompt = ref('你是一位中文写作助手，语言自然、地道，避免翻译腔。')
const userQuestion = ref('帮我写一段有关三国游戏的产品介绍')
const model = ref('')
const content = ref('')
const raw = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  if (!systemPrompt.value.trim() || !userQuestion.value.trim() || loading.value) return
  loading.value = true
  content.value = ''
  raw.value = ''
  error.value = ''
  try {
    const res = await chatOllama({
      systemPrompt: systemPrompt.value,
      userQuestion: userQuestion.value,
      model: model.value
    })
    content.value = res?.content || ''
    raw.value = res?.raw ? JSON.stringify(res.raw, null, 2) : ''
  } catch (e) {
    error.value = e?.message || '请求失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ollama-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 100%;
}

.panel {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.title {
  margin: 0 0 12px 0;
  font-size: 18px;
}

.result .content {
  flex: 1;
  overflow: auto;
}

.result pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.placeholder {
  color: #999;
}

.error {
  color: #e6342a;
  margin-bottom: 8px;
}

.raw {
  margin-top: 12px;
}

@media (max-width: 900px) {
  .ollama-page {
    grid-template-columns: 1fr;
  }
}
</style>
