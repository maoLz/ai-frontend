<template>
  <div class="list-page">
    <el-card class="toolbar" shadow="never">
      <div class="toolbar-left">
        <template v-if="hasFlowId">
          <div class="flow-chip">当前流程：{{ flowId }}</div>
        </template>
        <el-alert
          v-else
          title="缺少 flowId 参数，请从流程列表进入"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      <div class="toolbar-actions">
        <el-button :disabled="!hasFlowId" @click="fetchList">刷新</el-button>
        <el-button
          type="danger"
          :disabled="!hasFlowId"
          @click="handleClear"
        >
          清空实例
        </el-button>
        <el-button
          type="primary"
          :disabled="!hasFlowId"
          @click="openRunDialog"
        >
          启动实例
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        border
        style="width: 100%"
        :loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="flowId" label="流程ID" width="100" />
        <el-table-column prop="flowVersion" label="版本号" width="100" />
        <el-table-column prop="businessKey" label="业务Key" width="160" />
        <el-table-column prop="input" label="输入" min-width="200">
          <template #default="{ row }">
            <div class="input-cell">
              <span
                class="ellipsis"
                title="双击查看完整内容"
                @dblclick="handleJsonPreview('输入', row.input)"
              >
                {{ shortJson(row.input) }}
              </span>
              <el-button type="primary" link size="small" @click.stop="handleCopyInput(row.input)">
                复制
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleViewDetail(row)">运行详情</el-button>
            <el-button type="success" text size="small" @click="handleViewRecords(row)">执行记录</el-button>
            <el-button type="primary" text size="small" @click="handleRetry(row)">实例重试</el-button>
            
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>

  <FlowRunDialog
    v-if="runDialogVisible"
    v-model="runDialogVisible"
    :flow-id="flowId"
    @success="fetchList"
    @closed="handleRunDialogClosed"
  />
</template>

<script setup>
import { ElAlert, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteFlowInstancesByFlowId, getFlowInstanceByFlowId, getFlowInstanceDetail,runFlowInstance } from '@/api/flowInstance'
import FlowRunDialog from '@/components/flow/FlowRunDialog.vue'

const tableData = ref([])
const loading = ref(false)
const runDialogVisible = ref(false)
const router = useRouter()
const route = useRoute()
const flowId = computed(() => route.query.flowId || null)
const hasFlowId = computed(() => !!flowId.value)

const fetchList = async () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法加载实例列表')
    tableData.value = []
    return
  }
  loading.value = true
  try {
    tableData.value = await getFlowInstanceByFlowId(flowId.value)
  } catch (error) {
    ElMessage.error(error?.message || '获取实例列表失败')
  } finally {
    loading.value = false
  }
}

const handleClear = async () => {
  if (!hasFlowId.value) return
  try {
    await deleteFlowInstancesByFlowId(flowId.value)
    ElMessage.success('已清空实例')
    await fetchList()
  } catch (error) {
    ElMessage.error(error?.message || '清空失败')
  }
}
const handleRetry = async (row) => {
  if (!hasFlowId.value) return
  try {
    await runFlowInstance(row.id)
    ElMessage.success('实例重试成功')
    await fetchList()
  } catch (error) {
    ElMessage.error(error?.message || '实例重试失败')
  }
}

const openRunDialog = () => {
  runDialogVisible.value = true
}

const statusType = (status) => {
  if (!status) return 'info'
  const upper = String(status).toUpperCase()
  if (upper === 'SUCCESSED' || upper === 'COMPLETED' || upper === 'SUCCESS') return 'success'
  if (upper === 'FAILED' || upper === 'FAIL' || upper === 'ERROR') return 'danger'
  if (upper === 'RUNNING' || upper === 'PROCESSING') return 'warning'
  return 'info'
}

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatJson = (value) => {
  if (value === null || value === undefined || value === '') return '（空）'
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    // 保留原始字符串
    if (typeof value === 'string') return value
    return String(value)
  }
}

const shortJson = (value) => {
  const str = formatJson(value)
  return str.length > 60 ? `${str.slice(0, 60)}...` : str
}

const handleViewDetail = async (row) => {
  try {
    const detail = await getFlowInstanceDetail(row.id)
    const content = escapeHtml(formatJson(detail))
    ElMessageBox.alert(
      `<pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-family:SFMono-Regular,Consolas,Menlo,monospace;">${content}</pre>`,
      '运行详情',
      {
        confirmButtonText: '关闭',
        distinguishCancelAndClose: false,
        dangerouslyUseHTMLString: true,
        customStyle: { width: '800px', maxWidth: '90vw' }
      }
    )
  } catch (error) {
    ElMessage.error(error?.message || '获取详情失败')
  }
}

const handleJsonPreview = (title, value) => {
  const content = escapeHtml(formatJson(value))
  ElMessageBox.alert(
    `<pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-family:SFMono-Regular,Consolas,Menlo,monospace;">${content}</pre>`,
    title,
    {
      confirmButtonText: '关闭',
      dangerouslyUseHTMLString: true,
      customStyle: { width: '800px', maxWidth: '90vw' }
    }
  )
}

const handleRunDialogClosed = () => {
  runDialogVisible.value = false
  fetchList()
}

const copyToClipboard = async (text) => {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

const handleCopyInput = async (value) => {
  const content = formatJson(value)
  try {
    await copyToClipboard(content)
    ElMessage.success('输入内容已复制')
  } catch (error) {
    ElMessage.error(error?.message || '复制失败')
  }
}

const handleViewRecords = (row) => {
  router.push({
    path: '/node-executor-records',
    query: {
      flowInstanceId: row.id
    }
  })
}

onMounted(() => {
  fetchList()
})

watch(flowId, () => {
  fetchList()
})
</script>
<style scoped>
/* 页面整体布局 */
.list-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* ===== 工具栏 Card ===== */
.toolbar {
  padding-bottom: 0;
}

/* el-card 的真实内容容器，必须在这里做 flex */
.toolbar :deep(.el-card__body) {
  display: flex;
  align-items: center;            /* 上下居中 */
  justify-content: space-between; /* 左右分布 */
  gap: 12px;
}

/* 左侧：当前流程 / alert */
.toolbar-left {
  flex: 1;
  min-width: 0;                   /* 关键：允许被压缩 */
  display: flex;
  align-items: center;
  color: #666;
}

/* 当前流程展示 */
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

/* 右侧按钮区域 */
.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;                 /* 不被压缩、不换行 */
}

/* ===== 表格 Card ===== */
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 让表格撑满 card（可选但推荐） */
.table-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
}

.input-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ellipsis {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
</style>
