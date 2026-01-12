<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="流程ID">
        <el-input :model-value="flowId" disabled />
      </el-form-item>

      <el-form-item label="业务Key" prop="businessKey">
        <el-input v-model="form.businessKey" placeholder="请输入业务唯一标识" />
      </el-form-item>

      <el-form-item label="上下文(JSON)" prop="context">
        <JsonEditor
          v-model="form.context"
          :rows="8"
          placeholder='例如 {"foo":"bar"}'
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :loading="copying" @click="handleLoadLastParam">加载上次执行参数</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        启动
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { startFlow, getFlowDetail, loadLastParam as fetchLastParam } from '@/api/flow'
import JsonEditor from '@/components/common/JsonEditor.vue'

const props = defineProps({
  flowId: {
    type: [String, Number],
    required: true
  }
})

const visible = defineModel()
const emit = defineEmits(['success', 'closed'])

const formRef = ref(null)
const form = reactive({
  businessKey: '',
  context: ''
})

const rules = {
  businessKey: [{ required: true, message: '请输入业务Key', trigger: 'blur' }]
}

const submitting = ref(false)
const copying = ref(false)
const dialogTitle = '启动流程'

const formatContext = (value) => {
  if (!value) return ''
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return typeof value === 'string' ? value : String(value)
  }
}

const resetForm = () => {
  form.businessKey = ''
  form.context = ''
  formRef.value?.clearValidate()
}

const loadDetail = async () => {
  if (!props.flowId) {
    form.context = ''
    return
  }
  try {
    const detail = await getFlowDetail(props.flowId)
    form.context = formatContext(detail?.contextConfig)
    form.businessKey = crypto.randomUUID()
  } catch (error) {
    // 仅提示，不阻塞弹窗使用
    ElMessage.error(error?.message || '获取流程详情失败')
  }
}
const handleLoadLastParam = async () => {
  if (!props.flowId) {
    ElMessage.warning('缺少流程ID，无法加载')
    return
  }
  copying.value = true
  try {
    const latest = await fetchLastParam(props.flowId)
    if (!latest) {
      ElMessage.warning('没有可用的历史参数')
      return
    }
    form.context = formatContext(latest)
    ElMessage.success('已加载上次执行参数')
  } catch (error) {
    ElMessage.error(error?.message || '获取上次参数失败')
  } finally {
    copying.value = false
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form }
    await startFlow({
      flowId: props.flowId,
      businessKey: payload.businessKey,
      contextJson: payload.context
    })
    ElMessage.success('流程启动成功')
    emit('success')
  } catch (error) {
    ElMessage.error(error?.message || '启动失败')
    emit('closed')
  } finally {
    submitting.value = false
    visible.value = false
  }
}

const buildCopyText = () => {
  const payload = {
    flowId: props.flowId,
    businessKey: form.businessKey,
    context: form.context
  }
  try {
    return JSON.stringify(payload, null, 2)
  } catch (error) {
    return String(payload)
  }
}

const handleCopy = async () => {
  const text = buildCopyText()
  copying.value = true
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success('已复制弹窗内容')
  } catch (error) {
    ElMessage.error(error?.message || '复制失败')
  } finally {
    copying.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('closed')
}

watch(
  () => [visible.value, props.flowId],
  ([isVisible]) => {
    if (isVisible) {
      loadDetail()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>
