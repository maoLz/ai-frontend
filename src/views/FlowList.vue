<template>
  <div class="list-page">
    <!-- 顶部操作栏 -->
    <el-card class="toolbar" shadow="never">
      <el-button type="primary" @click = "openDialog()">新增</el-button>
      <el-button @click = "fetchList">刷新</el-button>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        style="width: 100%"
        border
        :loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" width="120"/>
        <el-table-column prop="code" label="code" width="150" />
        <el-table-column prop="description" label="描述"  /> 
        <el-table-column prop="flowVersion" label="版本号" width="80"/>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createDate" label="创建时间" width="200"/>
        <el-table-column label="操作" width="440" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.status !== 'PUBLISHED'"
                type="primary"
                text
                size="small"
                @click="handleEdit(row)"
              >编辑</el-button>
              <el-button
                v-if="row.status !== 'DRAFT'"
                type="warning"
                text
                size="small"
                @click="openRunDialog(row)"
              >启动</el-button>
              <el-button type="primary" text size="small" @click="handleClone(row)">克隆</el-button>
              <el-button type="success" text size="small" @click="handleViewNodes(row)">节点</el-button>
              <el-button
                v-if="row.status !== 'DRAFT'"
                type="info"
                text
                size="small"
                @click="handleViewInstances(row)"
              >实例</el-button>
              <el-button
                v-if="row.status !== 'PUBLISHED'"
                type="danger"
                text
                size="small"
                @click="handleDelete(row)"
              >删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
  <CreateDialog
    v-model="dialogVisible"
    :flow-id="currentFlowId"
    @success="fetchList"
    @closed="handleDialogClosed"
  />
  <FlowRunDialog
    v-model="runDialogVisible"
    v-if="runDialogVisible"
    :flow-id="runFlowId"
    @closed="handleRunDialogClosed"
  />
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getFlowList, deleteFlow, cloneFlow } from '@/api/flow';
import CreateDialog from '@/components/flow/CreateDialog.vue'
import FlowRunDialog from '@/components/flow/FlowRunDialog.vue'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentFlowId = ref(null)
const runDialogVisible = ref(false)
const runFlowId = ref(null)
const router = useRouter()

/**
 * 加载列表
 */
const fetchList = async () => {
  loading.value = true
  try {
    tableData.value = await getFlowList()
  } catch (error) {
    ElMessage.error(error?.message || '获取列表失败')
  } finally {
    loading.value = false
  }
}

const openDialog = () => {
  currentFlowId.value = null
  dialogVisible.value = true
}

const handleEdit = (row) => {
  currentFlowId.value = row.id
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除流程「${row.name || row.id}」吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )
    await deleteFlow(row.id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

const handleViewNodes = (row) => {
  router.push({
    path: '/flow-canvas',
    query: { flowId: row.id }
  })
}

const handleViewInstances = (row) => {
  router.push({
    path: '/flow-instances',
    query: { flowId: row.id }
  })
}

const openRunDialog = (row) => {
  runFlowId.value = row.id
  runDialogVisible.value = true
}

const handleClone = async (row) => {
  try {
    await cloneFlow(row.id)
    ElMessage.success('克隆成功')
    fetchList()
  } catch (error) {
    ElMessage.error(error?.message || '克隆失败')
  }
}

const handleRunDialogClosed = () => {
  runDialogVisible.value = false
  runFlowId.value = null
}

const handleDialogClosed = () => {
  currentFlowId.value = null
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.list-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  padding-bottom: 0;
}

.table-card {
  flex: 1;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
}

.action-buttons :deep(.el-button) {
  padding: 0 6px;
}
</style>
