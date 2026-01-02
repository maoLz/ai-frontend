<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="流程ID" prop="flowId">
        <el-input-number
          v-model="form.flowId"
          :min="1"
          controls-position="right"
          style="width: 100%;"
          :disabled="!!props.defaultFlowId"
        />
      </el-form-item>

      <el-form-item label="节点Key" prop="nodeKey">
        <el-input v-model="form.nodeKey" placeholder="请输入唯一Key" />
      </el-form-item>

      <el-form-item label="节点名称" prop="nodeName">
        <el-input v-model="form.nodeName" placeholder="请输入节点名称" />
      </el-form-item>

      <el-form-item label="节点类型" prop="nodeType">
        <el-select v-model="form.nodeType" placeholder="请选择节点类型" clearable>
          <el-option v-for="item in nodeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="执行器类型" prop="executorType">
        <el-select v-model="form.executorType" placeholder="请选择执行器类型" clearable>
          <el-option v-for="item in executorTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="配置(JSON)" prop="config">
        <JsonEditor
          v-model="form.config"
          placeholder='可填写 JSON，比如 {"key":"value"}'
          :rows="20"
          
          :show-format-button="true"
        />
      </el-form-item>

      <el-form-item label="位置X" prop="positionX">
        <el-input-number
          v-model="form.positionX"
          :step="10"
          controls-position="right"
          style="width: 100%;"
          :disabled="disablePosition"
        />
      </el-form-item>

      <el-form-item label="位置Y" prop="positionY">
        <el-input-number
          v-model="form.positionY"
          :step="10"
          controls-position="right"
          style="width: 100%;"
          :disabled="disablePosition"
        />
      </el-form-item>

      <el-form-item label="排序号" prop="sortNo">
        <el-input-number v-model="form.sortNo" :min="0" :step="1" controls-position="right" style="width: 100%;" />
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
import { createFlowNode, getFlowNodeDetail, updateFlowNode } from '@/api/flowNode'
import JsonEditor from '@/components/common/JsonEditor.vue'

const props = defineProps({
  nodeId: {
    type: [String, Number],
    default: null
  },
  defaultFlowId: {
    type: [String, Number],
    default: null
  },
  disablePosition: {
    type: Boolean,
    default: false
  },
  useLocal: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: null
  }
})

const visible = defineModel()
const emit = defineEmits(['success', 'closed'])

const formRef = ref(null)
const form = reactive({
  flowId: null,
  nodeKey: '',
  nodeName: '',
  nodeType: 'TASK',
  executorType: 'NONE',
  config: '',
  positionX: null,
  positionY: null,
  sortNo: null
})

const rules = computed(() => ({
  flowId: props.useLocal ? [] : [{ required: true, message: '请输入流程ID', trigger: 'blur' }],
  nodeKey: [{ required: true, message: '请输入节点Key', trigger: 'blur' }]
}))

const nodeTypeOptions = [
  { label: 'START', value: 'START' },
  { label: 'TASK', value: 'TASK' },
  { label: 'END', value: 'END' },
  { label: 'GATEWAY', value: 'GATEWAY' }
]

const executorTypeOptions = [
  { label: 'HUMAN', value: 'HUMAN' },
  { label: 'MQ', value: 'MQ' },
  { label: 'HTTP', value: 'HTTP' },
  { label: 'SCRIPT', value: 'SCRIPT' },
  {label: 'NONE',value:'NONE'}
]

const submitting = ref(false)
const dialogTitle = computed(() => (props.nodeId ? '编辑节点' : '创建节点'))

const resetForm = () => {
  form.flowId = props.defaultFlowId ?? null
  form.nodeKey = ''
  form.nodeName = ''
  form.nodeType = 'TASK'
  form.executorType = 'NONE'
  form.config = ''
  form.positionX = null
  form.positionY = null
  form.sortNo = null
  formRef.value?.clearValidate()
}

const fillForm = (data) => {
  form.flowId = data.flowId ?? props.defaultFlowId ?? null
  form.nodeKey = data.nodeKey ?? ''
  form.nodeName = data.nodeName ?? ''
  form.nodeType = data.nodeType ?? ''
  form.executorType = data.executorType ?? ''
  const config = data.config
  if (!config) {
    form.config = ''
  } else {
    try {
      const parsed = typeof config === 'string' ? JSON.parse(config) : config
      form.config = JSON.stringify(parsed, null, 2)
    } catch (error) {
      form.config = typeof config === 'string' ? config : String(config)
    }
  }
  form.positionX = data.positionX ?? null
  form.positionY = data.positionY ?? null
  form.sortNo = data.sortNo ?? null
  formRef.value?.clearValidate()
}

const loadDetail = async () => {
  if (props.useLocal) {
    if (props.initialData) {
      fillForm(props.initialData)
    } else {
      resetForm()
    }
    return
  }
  if (!props.nodeId) {
    if (props.initialData) {
      fillForm(props.initialData)
    } else {
      resetForm()
    }
    return
  }
  try {
    const detail = await getFlowNodeDetail(props.nodeId)
    fillForm(detail)
  } catch (error) {
    ElMessage.error(error?.message || '获取节点详情失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 本地模式：仅返回数据，不调接口
  if (props.useLocal) {
    const payload = { ...form, id: props.nodeId ?? form.id ?? form.nodeKey ?? `local-${Date.now()}` }
    emit('success', payload)
    visible.value = false
    return
  }

  submitting.value = true
  try {
    let result
    if (props.nodeId) {
      result = await updateFlowNode(props.nodeId, { ...form })
      ElMessage.success('更新成功')
    } else {
      result = await createFlowNode({ ...form })
      ElMessage.success('创建成功')
    }
    emit('success', result || { ...form, id: props.nodeId })
    visible.value = false
  } catch (error) {
    ElMessage.error(error?.message || (props.nodeId ? '更新失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('closed')
}

watch(
  () => [visible.value, props.nodeId],
  ([isVisible]) => {
    if (isVisible) {
      loadDetail()
    }
  }
)
</script>

<style scoped>
.json-input {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}
</style>
