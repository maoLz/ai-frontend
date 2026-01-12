<template>
  <div class="page">
    <el-card class="toolbar" shadow="never">
      <div class="toolbar-left">
        <el-alert
          v-if="!hasFlowId"
          title="缺少 flowId 参数，请从流程列表进入"
          type="error"
          :closable="false"
          show-icon
        />
        <template v-else>
          <div class="flow-id">当前流程：{{ flowId }}</div>
          <el-button type="primary" :disabled="!hasFlowId" @click="openAddDialog">新增节点</el-button>
          <el-button :disabled="!hasFlowId" @click="resetDemo">重置示例</el-button>
          <el-button type="success" :disabled="!hasFlowId" @click="handleSubmitGraph">保存坐标与线</el-button>
          <el-button type="warning" :disabled="!hasFlowId" @click="handleOptimizeLayout">优化布局</el-button>
          <el-button :disabled="!hasFlowId" @click="goToFlowNodes">节点列表</el-button>
        </template>
      </div>
      <div class="toolbar-right">
        <span v-if="connectingFrom">正在连接：{{ connectingFrom }}</span>
      </div>
    </el-card>

    <div class="canvas-wrapper" ref="canvasRef">
      <svg class="edges" :width="canvasWidth" :height="canvasHeight">
        <g v-for="edge in edges" :key="edge.id">
          <line
            :x1="edgePoints[edge.id]?.x1"
            :y1="edgePoints[edge.id]?.y1"
            :x2="edgePoints[edge.id]?.x2"
            :y2="edgePoints[edge.id]?.y2"
            class="edge-line"
            stroke="#5c7cfa"
            stroke-width="2"
            marker-end="url(#arrow)"
            :class="{ selected: selectedEdgeId === edge.id }"
          />
          <!-- 隐藏的命中区域，便于点击 -->
          <line
            :x1="edgePoints[edge.id]?.x1"
            :y1="edgePoints[edge.id]?.y1"
            :x2="edgePoints[edge.id]?.x2"
            :y2="edgePoints[edge.id]?.y2"
            class="edge-hit"
            stroke="transparent"
            stroke-width="14"
            @click.stop="handleEdgeClick(edge)"
          />
        </g>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5c7cfa" />
          </marker>
        </defs>
      </svg>

      <div
        v-for="node in nodes"
        :key="node.id"
        class="node"
        :class="{ active: connectingFrom === node.id }"
        :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        @mousedown="startDrag(node, $event)"
        @mouseup.stop="handleNodeMouseUp(node)"
      >
        <div class="node-header">
          <span>{{ node.name }}</span>
          <div class="node-actions">
            <el-button text size="small" @click.stop="handleEdit(node)">编辑</el-button>
            <el-button text size="small" @click.stop="beginConnect(node)">连线</el-button>
          </div>
        </div>
        <div class="node-body">
          <div class="node-text">ID: {{ node.id }}</div>
          <div class="node-text">KEY: {{ node.key }}</div>
        </div>
      </div>
    </div>
    <FlowNodeDialog
      v-model="dialogVisible"
      :use-local="false"
      :disable-position="true"
      :initial-data="editingNode"
      :node-id="editingNode?.id || null"
      :default-flow-id="flowId"
      @success="handleDialogSuccess"
      @deleted="handleDialogDeleted"
      @closed="handleDialogClosed"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import FlowNodeDialog from '@/components/flow/FlowNodeDialog.vue'
import { submitFlowGraph,load } from '@/api/flowCanvas'
import { getFlowNodeByFlowId } from '@/api/flowNode'

const canvasRef = ref(null)
const canvasWidth = ref(5000)
const canvasHeight = ref(5000)

const NODE_WIDTH = 200
const NODE_HEIGHT = 90

const nodes = reactive([

])

const edges = reactive([])
const connectingFrom = ref(null)
const dialogVisible = ref(false)
const editingNode = ref(null)
const route = useRoute()
const router = useRouter()
const flowId = computed(() => route.query.flowId || null)
const hasFlowId = computed(() => !!flowId.value)
const selectedEdgeId = ref(null)

const edgePoints = computed(() => {
  const map = {}
  edges.forEach((edge) => {
    const from = nodes.find((n) => n.id === edge.from)
    const to = nodes.find((n) => n.id === edge.to)
    if (from && to) {
      map[edge.id] = {
        x1: from.x + 100,
        y1: from.y + 30,
        x2: to.x + 100,
        y2: to.y + 30
      }
    }
  })
  return map
})

const beginConnect = (node) => {
  selectedEdgeId.value = null
  connectingFrom.value = node.id
  ElMessage.info(`从 ${node.name} 开始连线，点击目标节点完成`)
}

const handleNodeMouseUp = (targetNode) => {
  // 停止拖拽（鼠标抬起在节点上时不会冒泡到 window，所以这里兜底关闭拖拽状态）
  if (dragging.nodeId) {
    stopDrag()
  }

  // 连线模式：完成连接
  if (!connectingFrom.value) return
  if (connectingFrom.value === targetNode.id) {
    connectingFrom.value = null
    return
  }
  const exists = edges.find((e) => e.from === connectingFrom.value && e.to === targetNode.id)
  if (!exists) {
    const newEdge = { id: `${connectingFrom.value}-${targetNode.id}-${Date.now()}`, from: connectingFrom.value, to: targetNode.id }
    edges.push(newEdge)
    ElMessage.success(`已连接 ${connectingFrom.value} -> ${targetNode.id}`)
  }
  connectingFrom.value = null
}

const openAddDialog = () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法新增节点')
    return
  }
  const rect = canvasRef.value?.getBoundingClientRect()
  const baseX = rect ? rect.width / 2 - NODE_WIDTH / 2 : 200
  const baseY = rect ? rect.height / 2 - NODE_HEIGHT / 2 : 150
  editingNode.value = {
    flowId: flowId.value,
    positionX: baseX,
    positionY: baseY
  }
  dialogVisible.value = true
}

const handleEdit = (node) => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法编辑节点')
    return
  }
  editingNode.value = { ...node }
  dialogVisible.value = true
}

const handleOptimizeLayout = async () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法优化布局')
    return
  }
  try {
    const canvasData = await load(flowId.value)
    const loadedNodes = (canvasData?.nodes || []).map((node) => ({
      id: node.id,
      key: node.nodeKey,
      name: node.nodeName || node.nodeKey || `节点${nodes.length + 1}`,
      x: node.positionX ?? 0,
      y: node.positionY ?? 0,
      ...node
    }))
    const loadedEdges = (canvasData?.edges || []).map((edge) => ({
      id: edge.id,
      from: edge.fromNodeId,
      to: edge.toNodeId,
      ...edge
    }))

    const nodeMap = new Map()
    loadedNodes.forEach((node) => nodeMap.set(node.id, node))
    const indegree = new Map()
    const outdegree = new Map()
    const adjacency = new Map()
    loadedNodes.forEach((node) => {
      indegree.set(node.id, 0)
      outdegree.set(node.id, 0)
      adjacency.set(node.id, [])
    })
    loadedEdges.forEach((edge) => {
      if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) return
      adjacency.get(edge.from).push(edge.to)
      indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1)
      outdegree.set(edge.from, (outdegree.get(edge.from) || 0) + 1)
    })

    const isStartNode = (node) => {
      const key = String(node.key || '').toUpperCase()
      const name = String(node.name || '').toUpperCase()
      return key === 'START' || name === 'START'
    }

    const startNodes = loadedNodes.filter(isStartNode)
    const queue = (startNodes.length ? startNodes : loadedNodes.filter((n) => (indegree.get(n.id) || 0) === 0))
      .map((n) => n.id)
    const visited = new Set()
    const orderedIds = []

    while (queue.length) {
      const id = queue.shift()
      if (visited.has(id)) continue
      visited.add(id)
      orderedIds.push(id)
      const neighbors = adjacency.get(id) || []
      neighbors.forEach((nextId) => {
        if (!visited.has(nextId)) {
          queue.push(nextId)
        }
      })
    }

    loadedNodes.forEach((node) => {
      if (!visited.has(node.id) && (indegree.get(node.id) || 0) + (outdegree.get(node.id) || 0) > 0) {
        orderedIds.push(node.id)
        visited.add(node.id)
      }
    })

    const disconnectedIds = loadedNodes
      .filter((node) => (indegree.get(node.id) || 0) + (outdegree.get(node.id) || 0) === 0)
      .map((node) => node.id)

    const stepX = 150
    const stepY = 400
    const perColumn = 4
    const columnHeight = perColumn * stepY

    orderedIds.forEach((id, index) => {
      const node = nodeMap.get(id)
      if (!node) return
      const col = Math.floor(index / perColumn)
      const row = index % perColumn
      const y = col % 2 === 0 ? row * stepY : columnHeight - row * stepY
      node.x = y
      node.y = col * stepX
    })

    const disconnectedStartY = 1000
    const disconnectedPerRow = 5
    disconnectedIds.forEach((id, index) => {
      const node = nodeMap.get(id)
      if (!node) return
      const col = index % disconnectedPerRow
      const row = Math.floor(index / disconnectedPerRow)
      node.x = disconnectedStartY + row * stepY
      node.y = col * stepX
    })

    nodes.splice(0, nodes.length, ...loadedNodes)
    edges.splice(0, edges.length, ...loadedEdges)
    resizeCanvas()
    ElMessage.success('布局已更新，请保存坐标与线')
  } catch (error) {
    ElMessage.error(error?.message || '优化布局失败')
  }
}

const goToFlowNodes = () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法跳转节点列表')
    return
  }
  router.push({
    path: '/flow-nodes',
    query: { flowId: flowId.value }
  })
}

const resetDemo = () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法重置')
    return
  }
  nodes.splice(0, nodes.length, { id: 'A', name: '节点A', x: 120, y: 120 }, { id: 'B', name: '节点B', x: 420, y: 200 }, { id: 'C', name: '节点C', x: 260, y: 420 })
  edges.splice(0, edges.length)
  connectingFrom.value = null
}

const dragging = reactive({
  nodeId: null,
  offsetX: 0,
  offsetY: 0,
  bounds: null
})

const startDrag = (node, event) => {
  if (connectingFrom.value) return // 连线模式下不允许拖拽，避免误移动
  const rect = canvasRef.value?.getBoundingClientRect()
  dragging.bounds = rect
  dragging.nodeId = node.id
  dragging.offsetX = event.clientX - (rect?.left || 0) - node.x
  dragging.offsetY = event.clientY - (rect?.top || 0) - node.y
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
}

const onMouseMove = (event) => {
  if (!dragging.nodeId) return
  const node = nodes.find((n) => n.id === dragging.nodeId)
  if (!node) return
  const bounds = dragging.bounds
  const rectLeft = bounds?.left || 0
  const rectTop = bounds?.top || 0
  const nextX = Math.max(0, event.clientX - rectLeft - dragging.offsetX)
  const nextY = Math.max(0, event.clientY - rectTop - dragging.offsetY)
  node.x = nextX
  node.y = nextY
  resizeCanvas()
}

const stopDrag = () => {
  dragging.nodeId = null
  dragging.bounds = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
}

const handleSubmitGraph = async () => {
  try {
    if (!hasFlowId.value) {
      ElMessage.error('缺少 flowId，无法提交')
      return
    }
    const plainNodes = nodes.map((n) => ({ ...n }))
    const plainEdges = edges.map((e) => ({ ...e }))
    console.log(plainNodes, plainEdges)
    await submitFlowGraph(flowId.value,plainNodes, plainEdges)
    ElMessage.success('已提交节点与连线')
  } catch (error) {
    ElMessage.error(error?.message || '提交失败')
  }
}

const handleEdgeClick = (edge) => {
  if (selectedEdgeId.value === edge.id) {
    // 二次点击同一条线，执行删除
    const idx = edges.findIndex((e) => e.id === edge.id)
    if (idx !== -1) {
      edges.splice(idx, 1)
      ElMessage.success('已删除连线')
    }
    selectedEdgeId.value = null
    return
  }
  selectedEdgeId.value = edge.id
  ElMessage.info(`已选中连线 ${edge.from} -> ${edge.to}，再次点击删除`)
}

const handleDialogSuccess = (payload) => {
  if (editingNode.value?.id) {
    const target = nodes.find((n) => n.id === editingNode.value.id)
    if (target) {
      Object.assign(target, {
        ...target,
        ...payload,
        x: payload.positionX ?? target.x,
        y: payload.positionY ?? target.y
      })
    }
  } else {
    const rect = canvasRef.value?.getBoundingClientRect()
    const baseX = payload.positionX ?? (rect ? rect.width / 2 - NODE_WIDTH / 2 : 200)
    const baseY = payload.positionY ?? (rect ? rect.height / 2 - NODE_HEIGHT / 2 : 150)
    nodes.push({
      id: payload.id,
      name: payload.nodeName || payload.nodeKey || `节点${nodes.length + 1}`,
      x: baseX,
      y: baseY,
      ...payload
    })
  }
  dialogVisible.value = false
  resizeCanvas()
}

const handleDialogClosed = () => {
  dialogVisible.value = false
  editingNode.value = null
}

const handleDialogDeleted = (deletedId) => {
  if (!deletedId) return
  const nodeIndex = nodes.findIndex((n) => n.id === deletedId)
  if (nodeIndex !== -1) {
    nodes.splice(nodeIndex, 1)
  }
  for (let i = edges.length - 1; i >= 0; i -= 1) {
    if (edges[i].from === deletedId || edges[i].to === deletedId) {
      edges.splice(i, 1)
    }
  }
  dialogVisible.value = false
  editingNode.value = null
  resizeCanvas()
}

const resizeCanvas = () => {
  const rect = canvasRef.value?.getBoundingClientRect()
  const baseWidth = rect?.width || canvasWidth.value
  const baseHeight = rect?.height || canvasHeight.value

  const maxX = nodes.reduce((max, n) => Math.max(max, (n.x ?? 0) + NODE_WIDTH), 0)
  const maxY = nodes.reduce((max, n) => Math.max(max, (n.y ?? 0) + NODE_HEIGHT), 0)
  const padding = 400

  canvasWidth.value = Math.max(baseWidth, maxX + padding)
  canvasHeight.value = Math.max(baseHeight, maxY + padding)
}

onMounted(() => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法使用画布，请从流程列表进入')
    return
  }
  resizeCanvas()
  fetchList()
  window.addEventListener('resize', resizeCanvas)
})

const fetchList = async () => {
  if (!hasFlowId.value) {
    ElMessage.error('缺少 flowId，无法加载节点')
    tableData.value = []
    return
  }
  try {
    let canvasData = await load(flowId.value)
    console.log(canvasData)
    canvasData.nodes.forEach((node) => {
      nodes.push({
        id: node.id,
        key: node.nodeKey,
        name: node.nodeName || node.nodeKey || `节点${nodes.length + 1}`,
        x: node.positionX,
        y: node.positionY,
      })
    })
    canvasData.edges.forEach((edge) => {
      edges.push({
        id: edge.id,
        from: edge.fromNodeId,
        to: edge.toNodeId,
      })
    })
    resizeCanvas()
  } catch (error) {
    ElMessage.error(error?.message || '获取节点列表失败')
  } finally {
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
})

watch(
  () => nodes.length,
  () => {
    resizeCanvas()
  }
)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.flow-id {
  font-weight: 500;
  color: #333;
}

.canvas-wrapper {
  position: relative;
  min-height: 700px;
  background: radial-gradient(circle at 20% 20%, #f6f9ff 0%, #f6f9ff 25%, #f0f4ff 25%, #f0f4ff 50%) repeat;
  background-size: 120px 120px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
}

.edges {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}

.edge-line {
  stroke-linecap: round;
  stroke-dasharray: 10 8;
  animation: flow-edge 1.4s linear infinite;
  pointer-events: stroke; /* 允许点击线条本身 */
}

.edge-line.selected {
  stroke: #f56c6c;
}

.edge-hit {
  pointer-events: stroke;
}

@keyframes flow-edge {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -36px;
  }
}

.node {
  position: absolute;
  max-width: 400px;
  background: #fff;
  border: 1px solid #dbe1ff;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(92, 124, 250, 0.12);
  cursor: move;
  user-select: none;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(90deg, #e8edff, #f4f7ff);
  border-bottom: 1px solid #e5e7eb;
}

.node-actions {
  display: flex;
  gap: 4px;
}

.node-body {
  padding: 12px;
  color: #666;
}

.node-text {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node.active {
  border-color: #5c7cfa;
  box-shadow: 0 0 0 2px rgba(92, 124, 250, 0.2), 0 6px 16px rgba(92, 124, 250, 0.12);
}
</style>
