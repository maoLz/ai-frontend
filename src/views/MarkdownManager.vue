<template>
  <div class="md-manager">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">Markdown 列表</div>
        <el-button circle type="primary" size="small" :icon="Plus" @click="addDocument" />
      </div>

      <el-scrollbar class="doc-list">
        <el-menu :default-active="activeId" class="menu">
          <el-menu-item
            v-for="doc in documents"
            :key="doc.id"
            :index="doc.id"
            @click="onMenuClick(doc.id)"
          >
            <div class="menu-item">
              <div class="doc-title">{{ doc.title }}</div>
              <div class="doc-meta">{{ doc.updatedAt }}</div>
            </div>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </aside>

    <section class="editor-pane" v-if="currentDoc">
      <div class="editor-header">
        <el-input v-model="currentDoc.title" placeholder="输入标题" class="title-input" />
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>

      <v-md-editor
        v-model="currentDoc.content"
        height="720px"
        @save="handleSave"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const nowString = () => new Date().toLocaleString()
const leaveMessage = '当前文档未保存，确定切换？'
const getSnapshot = (doc) => `${doc.title}__${doc.content}`

// -------------------- 文档数据 --------------------
const documents = reactive([
  {
    id: 'doc-1',
    title: '产品文档示例',
    content: '# 产品文档\n\n这里记录你的产品介绍。',
    updatedAt: nowString()
  },
  {
    id: 'doc-2',
    title: '开发记录',
    content: '## 开发日志\n- 功能开发\n- Bug 修复',
    updatedAt: nowString()
  }
])

const activeId = ref(documents[0].id)
const currentDoc = computed(() =>
  documents.find((d) => d.id === activeId.value)
)

// -------------------- 自动保存状态 --------------------
const snapshots = reactive({})
documents.forEach((d) => (snapshots[d.id] = getSnapshot(d)))

let debounceTimer = null
let intervalTimer = null
const lastSaveTime = ref(Date.now())

const hasChanges = (doc = currentDoc.value) => {
  if (!doc) return false
  return snapshots[doc.id] !== getSnapshot(doc)
}

const saveDocument = (doc = currentDoc.value, silent = true) => {
  if (!doc || !hasChanges(doc)) return

  doc.updatedAt = nowString()
  snapshots[doc.id] = getSnapshot(doc)
  lastSaveTime.value = Date.now()

  console.log('保存文档:', doc.title)

  if (!silent) {
    ElMessage.success('已保存')
  }
}

// -------------------- 菜单切换（核心改动） --------------------
const onMenuClick = (id) => {
  if (id === activeId.value) return

  if (hasChanges()) {
    const ok = window.confirm(leaveMessage)
    if (!ok) return
  }

  saveDocument(currentDoc.value, true)
  clearTimeout(debounceTimer)

  activeId.value = id

  if (!snapshots[id]) {
    const doc = documents.find((d) => d.id === id)
    snapshots[id] = getSnapshot(doc)
  }
}

// -------------------- 新建文档 --------------------
const addDocument = () => {
  const id = `doc-${Date.now()}`
  documents.unshift({
    id,
    title: '新建文档',
    content: '# 新建文档\n\n开始书写...',
    updatedAt: nowString()
  })
  snapshots[id] = getSnapshot(documents[0])
  activeId.value = id
}

// -------------------- 手动保存 --------------------
const handleSave = () => {
  saveDocument(currentDoc.value, false)
}

// -------------------- 自动保存（防抖 + 定时） --------------------
const scheduleDebouncedSave = () => {
  if (!hasChanges()) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => saveDocument(currentDoc.value, true), 3000)
}

watch(
  () => [currentDoc.value?.title, currentDoc.value?.content],
  () => scheduleDebouncedSave()
)

onMounted(() => {
  intervalTimer = setInterval(() => {
    if (hasChanges() && Date.now() - lastSaveTime.value > 15000) {
      saveDocument(currentDoc.value, true)
    }
  }, 2000)

  window.addEventListener('beforeunload', (e) => {
    if (!hasChanges()) return
    e.preventDefault()
    e.returnValue = ''
  })
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  clearInterval(intervalTimer)
})

</script>

<style scoped>
.md-manager {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  height: calc(100vh - 120px);
}

.sidebar {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sidebar-title {
  font-weight: 600;
  font-size: 15px;
}

.doc-list {
  flex: 1;
}

.menu {
  border-right: none;
}

.menu ::v-deep(.el-menu-item) {
  height: auto;
  line-height: 1.4;
  padding: 10px 12px;
  align-items: flex-start;
}

.menu-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  white-space: normal;
}

.doc-title {
  font-size: 14px;
  font-weight: 600;
}

.doc-meta {
  font-size: 12px;
  color: #909399;
}

.editor-pane {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.title-input {
  flex: 1;
}

@media (max-width: 1024px) {
  .md-manager {
    grid-template-columns: 1fr;
  }

  .sidebar {
    height: 240px;
  }
}
</style>
