<template>
  <div class="page">
    <el-card class="toolbar" shadow="never">
      <div class="toolbar-left">
        <div class="flow-chip">当前流程（path）ID：{{ pathFlowId }}</div>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          启动流程
        </el-button>
      </div>
    </el-card>

    <el-card class="form-card" shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="form"
      >
        <el-form-item label="业务Key" prop="businessKey">
          <el-input v-model="form.businessKey" disabled placeholder="自动生成的 UUID" />
        </el-form-item>

        <el-divider>Context</el-divider>

        <el-form-item label="Hostname" prop="context.hostname">
          <el-input v-model="form.context.hostname" placeholder="例如 http://127.0.0.1:7001" />
        </el-form-item>

        <el-form-item label="Path" prop="context.path">
          <el-input v-model="form.context.path" placeholder="例如 /v1/ai/code" />
        </el-form-item>

        <el-form-item label="Code" prop="context.code">
          <el-input
            v-model="form.context.code"
            type="textarea"
            :rows="5"
            resize="vertical"
            placeholder="请输入代码"
            class="wide-textarea"
          />
        </el-form-item>

        <el-form-item label="Question" prop="context.question">
          <el-input
            v-model="form.context.question"
            type="textarea"
            :rows="5"
            resize="vertical"
            placeholder="请输入问题描述"
            class="wide-textarea"
          />
        </el-form-item>

        <el-form-item label="Code BackLog">
          <el-input
            v-model="form.context.codeBackLog"
            type="textarea"
            :rows="4"
            resize="vertical"
            placeholder="请输入代码 backlog（手动输入）"
            class="wide-textarea"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            启动流程
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { startFlow } from '@/api/flow'

const pathFlowId = 6

const formRef = ref(null)

const generateBusinessKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bk-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

const form = reactive({
  businessKey: generateBusinessKey(),
  context: {
    hostname: 'http://127.0.0.1:7001',
    path: '',
    code: '',
    question: '',
    codeBackLog: ''
  }
})

const rules = {
  businessKey: [{ required: true, message: '请输入业务Key', trigger: 'blur' }],
  'context.hostname': [{ required: true, message: '请输入 Hostname', trigger: 'blur' }]
}

const submitting = ref(false)

const resetForm = () => {
  form.businessKey = generateBusinessKey()
  form.context.hostname = 'http://127.0.0.1:7001'
  form.context.path = ''
  form.context.code = ''
  form.context.question = ''
  form.context.codeBackLog = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  submitting.value = true
  try {
    await startFlow(pathFlowId, {
      businessKey: form.businessKey,
      context: JSON.stringify(form.context)
    })
    ElMessage.success('流程启动成功')
    resetForm()
  } catch (error) {
    ElMessage.error(error?.message || '启动失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  padding-bottom: 0;
}

.toolbar :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  color: #666;
}

.flow-chip {
  max-width: 400px;
  padding: 4px 10px;
  border-radius: 4px;
  background: #f5f7fa;
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.form-card :deep(.el-card__body) {
  padding: 16px 20px 8px;
}

.form {
  max-width: 960px;
}

.wide-textarea :deep(textarea) {
  min-height: 140px;
}
</style>
