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

        <el-form-item label="目标工作流" prop="context.flowId">
          <el-select
            v-model="form.context.flowId"
            filterable
            placeholder="请选择工作流"
            :loading="flowLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in flowOptions"
              :key="item.id"
              :label="`${item.name || item.code || item.id}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Hostname">
          <el-input
            v-model="form.context.hostname"
            placeholder="例如 api.example.com"
            list="hostname-options"
          />
        </el-form-item>

        <el-form-item label="Api Tag">
          <el-input
            v-model="form.context.apiTag"
            placeholder="例如 getUser"
            list="api-tag-options"
          />
        </el-form-item>

        <el-form-item label="Path">
          <el-input v-model="form.context.path" placeholder="例如 /v1/users" />
        </el-form-item>

        <el-form-item label="System Message">
          <el-input
            v-model="form.context.systemMessage"
            type="textarea"
            :rows="5"
            resize="vertical"
            placeholder="请输入 systemMessage"
            class="wide-textarea"
          />
        </el-form-item>

        <el-form-item label="User Message">
          <el-input
            v-model="form.context.userMessage"
            type="textarea"
            :rows="5"
            resize="vertical"
            placeholder="请输入 userMessage"
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

      <datalist id="hostname-options">
        <option v-for="item in hostnameOptions" :key="item" :value="item" />
      </datalist>
      <datalist id="api-tag-options">
        <option v-for="item in apiTagOptions" :key="item" :value="item" />
      </datalist>
    </el-card>
  </div>
</template>

<script setup>
import { ElAlert, ElMessage } from 'element-plus'
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { startFlow, getFlowList } from '@/api/flow'

const pathFlowId = 5

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
    flowId: '',
    hostname: 'http://127.0.0.1:7001',
    apiTag: 'flow',
    path: '',
    systemMessage: '',
    userMessage: ''
  }
})

const rules = {
  businessKey: [{ required: true, message: '请输入业务Key', trigger: 'blur' }]
}

const submitting = ref(false)
const flowLoading = ref(false)
const flowOptions = ref([])
const HOSTNAME_KEY = 'flow-start.hostnameOptions'
const API_TAG_KEY = 'flow-start.apiTagOptions'

const loadOptions = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

const hostnameOptions = ref(loadOptions(HOSTNAME_KEY))
const apiTagOptions = ref(loadOptions(API_TAG_KEY))

const persistOption = (value, listRef, key) => {
  const trimmed = (value || '').trim()
  if (!trimmed) return
  const existing = listRef.value.filter((item) => item !== trimmed)
  listRef.value = [trimmed, ...existing].slice(0, 20)
  localStorage.setItem(key, JSON.stringify(listRef.value))
}

const resetForm = () => {
  form.businessKey = generateBusinessKey()
  form.context.flowId = ''
  form.context.hostname = ''
  form.context.apiTag = ''
  form.context.path = ''
  form.context.systemMessage = ''
  form.context.userMessage = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  submitting.value = true
  try {
    const flowId = 5
    await startFlow({
      flowId,
      businessKey: form.businessKey,
      contextJson: JSON.stringify(form.context)
    })
    ElMessage.success('流程启动成功')
    persistOption(form.context.hostname, hostnameOptions, HOSTNAME_KEY)
    persistOption(form.context.apiTag, apiTagOptions, API_TAG_KEY)
    resetForm()
  } catch (error) {
    ElMessage.error(error?.message || '启动失败')
  } finally {
    submitting.value = false
  }
}

const fetchFlowOptions = async () => {
  flowLoading.value = true
  try {
    const list = await getFlowList()
    flowOptions.value = Array.isArray(list) ? list : []
  } catch (error) {
    ElMessage.error(error?.message || '获取流程列表失败')
  } finally {
    flowLoading.value = false
  }
}

onMounted(async () => {
  fetchFlowOptions()
  const res = await fetch('/prompts/createNode.txt')
  form.context.systemMessage = await res.text()
})
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
