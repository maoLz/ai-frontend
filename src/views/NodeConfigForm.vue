<template>
  <div class="node-config-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-main">
        <div>
          <div class="hero-title">HTTP 节点配置表单</div>
          <div class="hero-subtitle">按照 createNodeV0.1 规范，整理请求参数、头信息与输出映射。</div>
          <div class="hero-tags">
            <el-tag size="small" type="info">url 仅使用 {hostname} 占位</el-tag>
            <el-tag size="small" type="info">POST 必含 Content-Type</el-tag>
            <el-tag size="small" type="info">merchant 接口需平台头</el-tag>
            <el-tag v-if="selectedNodeId" size="small" type="success">已选节点：{{ selectedNodeId }}</el-tag>
          </div>
        </div>
        <div class="hero-actions">
          <el-switch
            v-model="form.merchantApi"
            active-text="merchant 接口"
            inactive-text="普通接口"
          />
          <el-button plain size="small" @click="ensureHostnameParam">补充 hostname 参数</el-button>
          <el-button plain size="small" :disabled="!selectedNodeId || !preview.text || !isHttpNode" @click="handleSave" :loading="saving">
            保存到节点
          </el-button>
          <el-button type="primary" plain size="small" :disabled="!preview.text" @click="copyConfig">
            复制配置
          </el-button>
          <el-button type="primary" size="small" :disabled="!finalOutput" @click="copyFinal">
            复制最终 JSON
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="selector-card" shadow="never">
      <div class="selector-row">
        <el-form :inline="true" :model="selectors" class="selector-form">
          <el-form-item label="工作流">
            <el-select
              v-model="selectors.flowId"
              filterable
              placeholder="选择 Flow"
              style="width: 240px"
              :loading="flowLoading"
              :disabled="hasFlowId"
              @change="handleFlowChange"
            >
              <el-option
                v-for="item in flowOptions"
                :key="item.id"
                :value="item.id"
                :label="`${item.name || item.code || item.id}`"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="节点">
            <el-select
              v-model="selectors.nodeId"
              filterable
              placeholder="选择节点"
              style="width: 320px"
              :loading="nodeLoading"
              @change="handleNodeChange"
              :disabled="!selectors.flowId"
            >
              <el-option
                v-for="item in nodeOptions"
                :key="item.id"
                :label="`${item.nodeName || item.nodeKey || item.id}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button @click="fetchFlowOptions" :loading="flowLoading">刷新工作流</el-button>
            <el-button :disabled="!selectors.flowId" @click="fetchNodes" :loading="nodeLoading">刷新节点</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-alert
        v-if="selectedNodeId && !isHttpNode"
        type="warning"
        :closable="false"
        title="该节点 executorType 非 HTTP，无法显示配置"
        description="请选择 HTTP 节点或在其他页面调整执行器类型为 HTTP 后再试"
      />
    </el-card>

    <div class="page-grid">
      <el-card class="section-card" shadow="never">
        <el-form :model="form" label-width="120px" class="section-form">
          <el-divider content-position="left">节点元信息</el-divider>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="nodeKey">
                <el-input v-model="form.nodeKey" placeholder="API_VERIFY_EMAIL_OTP_xxx" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="nodeName">
                <el-input v-model="form.nodeName" placeholder="校验邮箱验证码" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="Method">
                <el-select v-model="form.method" style="width: 100%">
                  <el-option label="POST" value="POST" />
                  <el-option label="GET" value="GET" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="URL">
                <el-input v-model="form.url" placeholder="{hostname}/rest/merchant/otp/verify" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">
            <div class="section-header">
              <span>请求参数（params）</span>
              <div class="section-actions">
                <el-button size="small" type="primary" link @click="ensureHostnameParam">
                  添加 hostname PATH
                </el-button>
                <el-button size="small" plain @click="addParam">新增参数</el-button>
              </div>
            </div>
          </el-divider>

          <div class="param-list">
            <el-empty v-if="!form.params.length" description="暂无参数，请添加" />
            <el-card
              v-for="item in form.params"
              :key="item.id"
              class="param-item"
              shadow="never"
            >
              <div class="param-item__header">
                <span class="param-item__title">{{ item.name || '未命名参数' }}</span>
                <div class="param-item__tools">
                  <el-tag v-if="item.location === 'PATH'" type="warning" size="small">PATH</el-tag>
                  <el-tag v-else type="success" size="small">BODY</el-tag>
                  <el-button
                    v-if="form.params.length > 1"
                    type="danger"
                    text
                    size="small"
                    @click="removeParam(item.id)"
                  >
                    移除
                  </el-button>
                </div>
              </div>
              <el-row :gutter="8">
                <el-col :span="8">
                  <el-form-item label="Name" label-width="60px">
                    <el-input v-model="item.name" placeholder="account / otpCode" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Type" label-width="60px">
                    <el-select v-model="item.type">
                      <el-option label="STRING" value="STRING" />
                      <el-option label="NUMBER" value="NUMBER" />
                      <el-option label="ARRAY" value="ARRAY" />
                      <el-option label="OBJECT" value="OBJECT" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Location" label-width="70px">
                    <el-select v-model="item.location">
                      <el-option label="PATH" value="PATH" />
                      <el-option label="BODY" value="BODY" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="值类型" label-width="60px">
                    <el-radio-group v-model="item.valueMode" size="small">
                      <el-radio-button label="text">文本</el-radio-button>
                      <el-radio-button label="json">JSON</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="Value" label-width="60px">
                <el-input
                  v-if="item.valueMode === 'text'"
                  type="textarea"
                  :autosize="{ minRows: 1, maxRows: 30 }"
                  v-model="item.value"
                  placeholder='支持 ${context.xxx}'
                />
                <el-input
                  v-else
                  v-model="item.value"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 30 }"
                  resize="vertical"
                  placeholder='填写 JSON，如 {"skuId": "${context.skuId}"}'
                />
              </el-form-item>
            </el-card>
          </div>

          <el-divider content-position="left">
            <div class="section-header">
              <span>Headers</span>
              <div class="section-actions">
                <el-button size="small" plain @click="addHeader">新增 Header</el-button>
              </div>
            </div>
          </el-divider>

          <div class="header-list">
            <el-empty v-if="!form.headers.length" description="暂无 Header，可点击新增" />
            <el-card
              v-for="header in form.headers"
              :key="header.id"
              class="header-item"
              shadow="never"
            >
              <div class="header-item__row">
                <el-input v-model="header.key" placeholder="X-Platform" :disabled="header.locked" />
                <el-input
                  v-model="header.value"
                  placeholder="merchant"
                  :disabled="header.locked && header.value"
                />
                <el-button
                  v-if="!header.locked"
                  type="danger"
                  text
                  size="small"
                  @click="removeHeader(header.id)"
                >
                  删除
                </el-button>
                <el-tag v-else size="small" type="info">自动添加</el-tag>
              </div>
            </el-card>
          </div>

          <el-divider content-position="left">
            <div class="section-header">
              <span>输出映射（outputMapping）</span>
              <div class="section-actions">
                <el-switch v-model="form.enableOutputMapping" active-text="启用" />
                <el-button
                  v-if="form.enableOutputMapping"
                  size="small"
                  plain
                  @click="addOutputMapping"
                >
                  新增映射
                </el-button>
              </div>
            </div>
          </el-divider>

          <div v-if="form.enableOutputMapping" class="mapping-list">
            <el-empty v-if="!form.outputMappings.length" description="暂无映射" />
            <el-card
              v-for="mapping in form.outputMappings"
              :key="mapping.id"
              class="mapping-item"
              shadow="never"
            >
              <div class="mapping-row">
                <el-input
                  v-model="mapping.contextKey"
                  placeholder="emailOtpSessionId"
                  clearable
                />
                <el-input
                  v-model="mapping.jsonPath"
                  placeholder="$.body.content.otpSessionId"
                  clearable
                />
                <el-button
                  v-if="form.outputMappings.length > 1"
                  type="danger"
                  text
                  size="small"
                  @click="removeOutputMapping(mapping.id)"
                >
                  删除
                </el-button>
              </div>
            </el-card>
          </div>
        </el-form>
      </el-card>

      <div class="side-panel">
        <el-card class="section-card" shadow="never">
          <div class="section-header">
            <span>配置预览</span>
            <div class="section-actions">
              <el-button size="small" type="primary" plain :disabled="!preview.text" @click="copyConfig">
                复制配置
              </el-button>
            </div>
          </div>
          <el-alert
            v-if="preview.error"
            type="error"
            :closable="false"
            class="mb-8"
            :description="preview.error"
          />
          <el-input
            :model-value="preview.text"
            type="textarea"
            :rows="14"
            resize="vertical"
            readonly
            placeholder="填写表单后自动生成"
          />
        </el-card>

        <el-card class="section-card" shadow="never">
          <div class="section-header">
            <span>最终输出（含 nodeKey/nodeName）</span>
            <div class="section-actions">
              <el-button size="small" type="primary" :disabled="!finalOutput" @click="copyFinal">
                复制
              </el-button>
            </div>
          </div>
          <el-input
            :model-value="finalOutput"
            type="textarea"
            :rows="10"
            resize="vertical"
            readonly
            placeholder="填写 nodeKey 和 nodeName 后查看"
          />
        </el-card>

        <el-card class="section-card" shadow="never">
          <div class="section-header">
            <span>字符串压缩（Markdown/JSON）</span>
            <div class="section-actions">
              <el-button size="small" plain @click="compressText" :disabled="!compressInput">
                生成字符串
              </el-button>
              <el-button size="small" type="primary" :disabled="!compressOutput" @click="copyCompressed">
                复制
              </el-button>
            </div>
          </div>
          <el-input
            v-model="compressInput"
            type="textarea"
            :rows="6"
            resize="vertical"
            placeholder="粘贴一大串 Markdown/JSON 文档"
          />
          <el-input
            :model-value="compressOutput"
            type="textarea"
            :rows="6"
            resize="vertical"
            readonly
            placeholder="生成后可直接放入双引号的字符串"
          />
          <div class="helper-text">提示：已自动转义引号、反斜杠与换行符。</div>
        </el-card>

        <el-card class="section-card" shadow="never">
          <div class="section-header">
            <span>规范速览</span>
            <div class="section-actions">
              <el-button size="small" text type="primary" @click="ensureHostnameParam">
                强制补齐 hostname
              </el-button>
            </div>
          </div>
          <el-scrollbar height="260px" class="prompt-scroll">
            <pre class="prompt-text">{{ promptText }}</pre>
          </el-scrollbar>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getFlowList } from '@/api/flow'
import { getFlowNodeByFlowId, getFlowNodeDetail, updateFlowNode } from '@/api/flowNode'

const route = useRoute()
const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}
const flowId = computed(() => route.query.flowId || null)
const hasFlowId = computed(() => !!flowId.value)

const newParam = (preset = {}) => ({
  id: preset.id || createId(),
  name: preset.name || '',
  type: preset.type || 'STRING',
  location: preset.location || 'BODY',
  valueMode: preset.valueMode || 'text',
  value: preset.value ?? ''
})

const form = reactive({
  nodeKey: '',
  nodeName: '',
  url: '{hostname}/rest/merchant/otp/verify',
  method: 'POST',
  merchantApi: true,
  params: [
    newParam({
      name: 'hostname',
      type: 'STRING',
      location: 'PATH',
      value: '${context.hostname}'
    })
  ],
  headers: [],
  enableOutputMapping: false,
  outputMappings: [
    {
      id: createId(),
      contextKey: 'emailOtpSessionId',
      jsonPath: '$.body.content.otpSessionId'
    }
  ]
})

const promptText = ref('')
const selectors = reactive({
  flowId: '',
  nodeId: ''
})
const flowOptions = ref([])
const nodeOptions = ref([])
const flowLoading = ref(false)
const nodeLoading = ref(false)
const saving = ref(false)
const selectedNodeDetail = ref(null)
const selectedNodeId = computed(() => selectors.nodeId)
const isHttpNode = computed(() => selectedNodeDetail.value?.executorType === 'HTTP')

const addParam = () => {
  form.params.push(newParam())
}

const removeParam = (id) => {
  const index = form.params.findIndex((item) => item.id === id)
  if (index !== -1) {
    form.params.splice(index, 1)
  }
}

const ensureHostnameParam = () => {
  const existing = form.params.find((item) => item.name === 'hostname')
  if (existing) {
    existing.type = 'STRING'
    existing.location = 'PATH'
    existing.valueMode = 'text'
    existing.value = '${context.hostname}'
    return
  }
  form.params.unshift(
    newParam({
      name: 'hostname',
      type: 'STRING',
      location: 'PATH',
      value: '${context.hostname}',
      valueMode: 'text'
    })
  )
}

const addHeader = () => {
  form.headers.push({
    id: createId(),
    key: '',
    value: '',
    locked: false
  })
}

const removeHeader = (id) => {
  const index = form.headers.findIndex((item) => item.id === id)
  if (index !== -1 && !form.headers[index].locked) {
    form.headers.splice(index, 1)
  }
}

const ensureHeader = (key, value, locked) => {
  const targetKey = key
  const existing = form.headers.find((item) => item.key === targetKey)
  if (existing) {
    existing.value = existing.value || value
    existing.locked = locked
    return
  }
  form.headers.unshift({
    id: createId(),
    key: targetKey,
    value,
    locked
  })
}

const unlockHeader = (key) => {
  const target = form.headers.find((item) => item.key === key)
  if (target) {
    target.locked = false
  }
}

const applyHeaderRules = () => {
  const needContentType = form.method === 'POST'
  ensureHeader('Content-Type', 'application/json', needContentType)
  if (!needContentType) {
    unlockHeader('Content-Type')
  }

  if (form.merchantApi) {
    ensureHeader('X-Platform', 'merchant', true)
    ensureHeader('X-Client-Type', 'merchant_app', true)
  } else {
    unlockHeader('X-Platform')
    unlockHeader('X-Client-Type')
  }
}

watch(
  () => form.method,
  () => applyHeaderRules(),
  { immediate: true }
)

watch(
  () => form.merchantApi,
  () => applyHeaderRules(),
  { immediate: true }
)

const fetchFlowOptions = async () => {
  flowLoading.value = true
  try {
    const list = await getFlowList()
    flowOptions.value = Array.isArray(list) ? list : []
  } catch (error) {
    ElMessage.error(error?.message || '获取工作流失败')
  } finally {
    flowLoading.value = false
  }
}

const fetchNodes = async () => {
  if (!selectors.flowId) {
    nodeOptions.value = []
    return
  }
  nodeLoading.value = true
  try {
    const list = await getFlowNodeByFlowId(selectors.flowId)
    nodeOptions.value = Array.isArray(list) ? list : []
  } catch (error) {
    ElMessage.error(error?.message || '获取节点失败')
  } finally {
    nodeLoading.value = false
  }
}

const handleFlowChange = () => {
  selectors.nodeId = ''
  selectedNodeDetail.value = null
  fetchNodes()
}

const handleNodeChange = async () => {
  selectedNodeDetail.value = null
  if (!selectors.nodeId) return
  try {
    const detail = await getFlowNodeDetail(selectors.nodeId)
    selectedNodeDetail.value = detail
    if (detail.executorType !== 'HTTP') {
      ElMessage.warning('该节点执行器类型不是 HTTP，无法展示配置')
      return
    }
    if (!detail.config) {
      ElMessage.warning('该节点未配置 config')
      return
    }
    loadConfigToForm(detail)
  } catch (error) {
    ElMessage.error(error?.message || '获取节点详情失败')
  }
}

const headersObject = computed(() => {
  const result = {}
  form.headers.forEach((item) => {
    const key = (item.key || '').trim()
    if (!key) return
    result[key] = item.value ?? ''
  })
  return result
})

const parseParamValue = (item) => {
  if (item.valueMode === 'json' && item.value) {
    try {
      return JSON.parse(item.value)
    } catch (error) {
      throw new Error(`参数 ${item.name || '未命名'} 的 JSON 格式有误`)
    }
  }
  return item.value ?? ''
}

const buildParams = () =>
  form.params
    .filter((item) => (item.name || '').trim())
    .map((item) => ({
      name: item.name.trim(),
      type: item.type || 'STRING',
      location: item.location || 'BODY',
      value: parseParamValue(item)
    }))

const buildOutputMapping = () => {
  if (!form.enableOutputMapping) return null
  const mapping = {}
  form.outputMappings.forEach((item) => {
    const key = (item.contextKey || '').trim()
    const path = (item.jsonPath || '').trim()
    if (!key || !path) return
    mapping[key] = path
  })
  return Object.keys(mapping).length ? mapping : null
}

const setHeadersFromObject = (headers = {}) => {
  form.headers.splice(0, form.headers.length)
  Object.entries(headers || {}).forEach(([key, value]) => {
    form.headers.push({
      id: createId(),
      key,
      value,
      locked: false
    })
  })
}

const setOutputMappingFromObject = (mappingObj) => {
  if (mappingObj && typeof mappingObj === 'object') {
    const entries = Object.entries(mappingObj).map(([contextKey, jsonPath]) => ({
      id: createId(),
      contextKey,
      jsonPath
    }))
    form.enableOutputMapping = entries.length > 0
    form.outputMappings.splice(0, form.outputMappings.length, ...entries)
  } else {
    form.enableOutputMapping = false
    form.outputMappings.splice(0, form.outputMappings.length)
  }
}

const loadConfigToForm = (detail) => {
  form.nodeKey = detail.nodeKey || ''
  form.nodeName = detail.nodeName || ''
  let parsedConfig = {}
  try {
    parsedConfig =
      typeof detail.config === 'string' ? JSON.parse(detail.config) : detail.config || {}
  } catch (error) {
    ElMessage.error('config 解析失败，请检查格式')
    return
  }
  form.url = parsedConfig.url || '{hostname}/rest/merchant/otp/verify'

  const paramList = Array.isArray(parsedConfig.params) ? parsedConfig.params : []
  const mappedParams = paramList.map((item) => {
    const isObjectValue = typeof item.value === 'object' && item.value !== null
    return {
      id: createId(),
      name: item.name || '',
      type: item.type || 'STRING',
      location: item.location || 'BODY',
      valueMode: isObjectValue ? 'json' : 'text',
      value: isObjectValue ? JSON.stringify(item.value, null, 2) : item.value ?? ''
    }
  })
  form.params.splice(0, form.params.length, ...mappedParams)
  ensureHostnameParam()

  setHeadersFromObject(parsedConfig.headers || {})
  const merchant =
    parsedConfig.headers?.['X-Platform'] === 'merchant' &&
    parsedConfig.headers?.['X-Client-Type'] === 'merchant_app'
  form.merchantApi = !!merchant

  form.method = parsedConfig.method || 'POST'

  setOutputMappingFromObject(parsedConfig.outputMapping)
  applyHeaderRules()
}

const preview = computed(() => {
  try {
    const config = {
      url: form.url || '{hostname}/rest/merchant/otp/verify',
      method: form.method,
      params: buildParams(),
      headers: headersObject.value
    }
    const mapping = buildOutputMapping()
    if (mapping) {
      config.outputMapping = mapping
    }
    return {
      text: JSON.stringify(config, null, 2),
      error: ''
    }
  } catch (error) {
    return {
      text: '',
      error: error?.message || '生成配置失败'
    }
  }
})

const finalOutput = computed(() => {
  if (preview.value.error) return ''
  const payload = {
    nodeKey: form.nodeKey || 'API_HTTP_NODE_KEY_UUID',
    nodeName: form.nodeName || '节点名称',
    config: preview.value.text
  }
  return JSON.stringify(payload, null, 2)
})

const copyText = async (text, successMessage) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMessage || '已复制')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const copyConfig = () => {
  if (!preview.value.text) return
  copyText(preview.value.text, '配置 JSON 已复制')
}

const copyFinal = () => {
  if (!finalOutput.value) return
  copyText(finalOutput.value, '最终 JSON 已复制')
}

const compressInput = ref('')
const compressOutput = ref('')

const compressText = () => {
  if (!compressInput.value) {
    compressOutput.value = ''
    return
  }
  const text = String(compressInput.value)
  compressOutput.value = JSON.stringify(text).slice(1, -1)
}

const copyCompressed = () => {
  if (!compressOutput.value) return
  copyText(compressOutput.value, '已复制为可放入双引号的字符串')
}

const handleSave = async () => {
  if (!selectors.nodeId) {
    ElMessage.warning('请先选择节点')
    return
  }
  if (!isHttpNode.value) {
    ElMessage.warning('节点执行器类型不是 HTTP，无法保存')
    return
  }
  if (preview.value.error || !preview.value.text) {
    ElMessage.error('配置有误，请先修正预览错误')
    return
  }
  const detail = selectedNodeDetail.value || {}
  const payload = {
    flowId: detail.flowId,
    nodeKey: form.nodeKey,
    nodeName: form.nodeName,
    nodeType: detail.nodeType,
    executorType: 'HTTP',
    positionX: detail.positionX,
    positionY: detail.positionY,
    sortNo: detail.sortNo,
    config: preview.value.text
  }
  saving.value = true
  try {
    await updateFlowNode(selectors.nodeId, payload)
    ElMessage.success('保存成功')
    await handleNodeChange()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const addOutputMapping = () => {
  form.outputMappings.push({
    id: createId(),
    contextKey: '',
    jsonPath: ''
  })
}

const removeOutputMapping = (id) => {
  const index = form.outputMappings.findIndex((item) => item.id === id)
  if (index !== -1) {
    form.outputMappings.splice(index, 1)
  }
}

onMounted(async () => {
  ensureHostnameParam()
  await fetchFlowOptions()
  try {
    const res = await fetch('/prompts/createNodeV0.1.txt')
    promptText.value = await res.text()
  } catch (error) {
    promptText.value = '未能加载规范，请检查 public/prompts/createNodeV0.1.txt'
  }
})

watch(
  flowId,
  (value) => {
    if (!value) return
    if (selectors.flowId === value) return
    selectors.flowId = value
    selectors.nodeId = ''
    selectedNodeDetail.value = null
    fetchNodes()
  },
  { immediate: true }
)
</script>

<style scoped>
.node-config-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-card :deep(.el-card__body) {
  padding: 16px 18px;
}

.hero-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.hero-subtitle {
  color: #666;
  font-size: 13px;
  margin-bottom: 8px;
}

.hero-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.page-grid {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 12px;
  align-items: start;
}

.section-card :deep(.el-card__body) {
  padding: 16px;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.param-list,
.header-list,
.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item :deep(.el-card__body),
.header-item :deep(.el-card__body),
.mapping-item :deep(.el-card__body) {
  padding: 12px 12px 8px;
}

.param-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.param-item__title {
  font-weight: 500;
}

.param-item__tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-item__row,
.mapping-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: center;
}

.mb-8 {
  margin-bottom: 8px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prompt-scroll {
  border: 1px solid #f0f0f0;
}

.prompt-text {
  white-space: pre-wrap;
  font-size: 12px;
  color: #444;
  padding: 8px 4px;
  margin: 0;
}

.helper-text {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
}

@media (max-width: 1200px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
