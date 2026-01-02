<template>
<el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="80px"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入流程名称" />
      </el-form-item>

      <el-form-item label="编码" prop="code">
        <el-input v-model="form.code" placeholder="请输入唯一编码" />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="请输入描述"
          :rows="3"
        />
      </el-form-item>

      <el-form-item label="上下文" prop="contextConfig">
        <JsonEditor
          v-model="form.contextConfig"
          :rows="10"
          placeholder="请输入上下文配置 JSON"
        />
      </el-form-item>

      <el-form-item label="版本号" prop="flowVersion">
        <el-input-number
          v-model="form.flowVersion"
          :min="1"
          :step="1"
          controls-position="right"
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="已禁用" value="DISABLED" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createFlow, getFlowDetail, updateFlow } from '@/api/flow'
import JsonEditor from '@/components/common/JsonEditor.vue'

const props = defineProps({
  flowId: {
    type: [String, Number],
    default: null
  }
})

const visible = defineModel() // Vue 3.3+ 推荐写法

const emit = defineEmits(['success', 'closed'])

const formRef = ref(null)
const form = reactive({
  name: '',
  code: '',
  description: '',
  flowVersion: 1,
  status: 'DRAFT',
  contextConfig: ''
})

const validateContextConfig = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  try {
    JSON.parse(value)
    callback()
  } catch (error) {
    callback(new Error('请输入有效的 JSON'))
  }
}

const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' }
  ],
  flowVersion: [
    { required: true, message: '请输入版本号', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  contextConfig: [
    { validator: validateContextConfig, trigger: 'blur' }
  ]
}

const submitting = ref(false)
const dialogTitle = computed(() => (props.flowId ? '编辑数据' : '创建数据'))

const buildPayload = () => ({
  name: form.name,
  code: form.code,
  description: form.description,
  flowVersion: form.flowVersion,
  status: form.status,
  contextConfig: form.contextConfig || ''
})

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  submitting.value = true
  try {
    if (props.flowId) {
      await updateFlow(props.flowId, buildPayload())
      ElMessage.success('更新成功')
    } else {
      await createFlow(buildPayload())
      ElMessage.success('创建成功')
    }
    emit('success')
    visible.value = false
    resetForm()
  } catch (error) {
    ElMessage.error(error?.message || (props.flowId ? '更新失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('closed')
}

const resetForm = () => {
  form.name = ''
  form.code = ''
  form.description = ''
  form.flowVersion = 1
  form.status = 'DRAFT'
  form.contextConfig = ''
  formRef.value?.clearValidate()
}

const fillForm = (data) => {
  form.name = data.name ?? ''
  form.code = data.code ?? ''
  form.description = data.description ?? ''
  form.flowVersion = data.flowVersion ?? 1
  form.status = data.status ?? 'DRAFT'
  const config = data.contextConfig
  if (!config) {
    form.contextConfig = ''
    return
  }
  try {
    const parsed = typeof config === 'string' ? JSON.parse(config) : config
    form.contextConfig = JSON.stringify(parsed, null, 2)
  } catch (error) {
    form.contextConfig = typeof config === 'string' ? config : String(config)
  }
}

const loadDetail = async () => {
  if (!props.flowId) {
    resetForm()
    return
  }
  try {
    const detail = await getFlowDetail(props.flowId)
    fillForm(detail)
    formRef.value?.clearValidate()
  } catch (error) {
    ElMessage.error(error?.message || '获取详情失败')
  }
}

watch(
  () => [visible.value, props.flowId],
  ([isVisible]) => {
    if (isVisible) {
      loadDetail()
    }
  }
)
</script>
