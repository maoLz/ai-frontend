<template>
  <div class="list-page">
    <el-card class="toolbar" shadow="never">
      <div class="toolbar-left">
        <template v-if="hasFlowInstanceId">
          <div class="flow-chip">当前实例：{{ flowInstanceId }}</div>
        </template>
        <el-alert
          v-else
          title="缺少 flowInstanceId 参数，请从实例列表进入"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      <div class="toolbar-actions">
        <el-button :disabled="!hasFlowInstanceId" @click="fetchList">刷新</el-button>
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
        <el-table-column prop="flowInstanceId" label="实例ID" width="120" />
        <el-table-column prop="nodeId" label="节点ID" width="120" />
        <el-table-column prop="nodeKey" label="节点Key" width="200" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="200" />
        <el-table-column prop="endTime" label="结束时间" width="200" />
        <el-table-column prop="retryCount" label="重试次数" width="140" />
        <el-table-column prop="input" label="输入" min-width="260">
          <template #default="{ row }">
            <span
              class="ellipsis"
              title="双击查看完整内容"
              @dblclick="handleJsonPreview('输入', row.input)"
            >
              {{ shortJson(row.input) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="output" label="输出" min-width="260">
          <template #default="{ row }">
            <span
              class="ellipsis"
              title="双击查看完整内容"
              @dblclick="handleJsonPreview('输出', row.output)"
            >
              {{ shortJson(row.output) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" min-width="260">
          <template #default="{ row }">
            <span class="ellipsis">{{ row.errorMessage || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleViewDetail(row)">运行详情</el-button>
            <el-button
              v-if="isFailed(row.status)"
              type="danger"
              text
              size="small"
              :loading="row._reExecuting"
              @click="handleReExecute(row)"
            >
              重新执行
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ElAlert, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getNodeExecutorRecordsByFlowInstanceId, getNodeExecutorRecordDetail, reExecuteNodeExecutorRecord } from '@/api/nodeExecutorRecord'

const tableData = ref([])
const loading = ref(false)
const route = useRoute()
const flowInstanceId = computed(() => route.query.flowInstanceId || null)
const hasFlowInstanceId = computed(() => !!flowInstanceId.value)

const statusType = (status) => {
  if (!status) return 'info'
  const upper = String(status).toUpperCase()
  if (upper === 'SUCCESSED' || upper === 'SUCCESS' || upper === 'COMPLETED') return 'success'
  if (upper === 'FAILED' || upper === 'FAIL' || upper === 'ERROR') return 'danger'
  if (upper === 'RUNNING' || upper === 'PROCESSING') return 'warning'
  return 'info'
}

const isFailed = (status) => {
  const upper = String(status || '').toUpperCase()
  return upper === 'FAILED' || upper === 'FAIL' || upper === 'ERROR'
}

const shortJson = (value) => {
  const str = formatJson(value)
  return str.length > 60 ? `${str.slice(0, 60)}...` : str
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
    return typeof value === 'string' ? value : String(value)
  }
}

const fetchList = async () => {
  if (!hasFlowInstanceId.value) {
    ElMessage.error('缺少 flowInstanceId，无法加载列表')
    tableData.value = []
    return
  }
  loading.value = true
  try {
    tableData.value = await getNodeExecutorRecordsByFlowInstanceId(flowInstanceId.value)
  } catch (error) {
    ElMessage.error(error?.message || '获取执行记录失败')
  } finally {
    loading.value = false
  }
}

const handleViewDetail = async (row) => {
  try {
    const detail = await getNodeExecutorRecordDetail(row.id)
    const content = escapeHtml(formatJson(detail))
    ElMessageBox.alert(
      `<pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-family:SFMono-Regular,Consolas,Menlo,monospace;">${content}</pre>`,
      '运行详情',
      {
        confirmButtonText: '关闭',
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

const handleReExecute = async (row) => {
  if (!row || !row.id) return
  try {
    row._reExecuting = true
    await reExecuteNodeExecutorRecord(row.id)
    ElMessage.success('重新执行成功')
    await fetchList()
  } catch (error) {
    ElMessage.error(error?.message || '重新执行失败')
  } finally {
    row._reExecuting = false
  }
}

onMounted(() => {
  fetchList()
})

watch(flowInstanceId, () => {
  fetchList()
})
</script>

<style scoped>
.list-page {
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

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
}

.ellipsis {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
