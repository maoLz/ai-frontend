<template>
  <div class="list-page">
    <el-card class="toolbar" shadow="never">
      <div class="toolbar-left">
        <div v-if="flowId">当前流程：{{ flowId }}</div>
        <el-alert
          v-else
          title="缺少 flowId 参数，请从流程列表进入"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      <div class="toolbar-actions">
        <el-button @click="fetchList">刷新</el-button>
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
        <el-table-column prop="nodeKey" label="节点Key" width="140" />
        <el-table-column prop="nodeName" label="节点名称" width="140" />
        <el-table-column prop="nodeType" label="节点类型" width="120" />
        <el-table-column prop="executorType" label="执行器类型" width="120" />
        <el-table-column prop="positionX" label="位置X" width="100" />
        <el-table-column prop="positionY" label="位置Y" width="100" />
        <el-table-column prop="sortNo" label="排序号" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>

  <FlowNodeDialog
    v-model="dialogVisible"
    :node-id="currentNodeId"
    :default-flow-id="flowId"
    @success="fetchList"
    @closed="handleDialogClosed"
  />
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { deleteFlowNode, getFlowNodeByFlowId, getFlowNodeList } from '@/api/flowNode'
import FlowNodeDialog from '@/components/flow/FlowNodeDialog.vue'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentNodeId = ref(null)
const route = useRoute()
const flowId = computed(() => route.query.flowId || null)
const hasFlowId = computed(() => !!flowId.value)

const fetchList = async () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法加载节点')
    tableData.value = []
    return
  }
  loading.value = true
  try {
    tableData.value = await getFlowNodeByFlowId(flowId.value)
  } catch (error) {
    ElMessage.error(error?.message || '获取节点列表失败')
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法编辑节点')
    return
  }
  currentNodeId.value = row.id
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法删除节点')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除节点「${row.nodeName || row.nodeKey || row.id}」吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )
    await deleteFlowNode(row.id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

const handleDialogClosed = () => {
  currentNodeId.value = null
}

onMounted(() => {
  fetchList()
})

watch(flowId, () => {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  color: #666;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.table-card {
  flex: 1;
}
</style>
