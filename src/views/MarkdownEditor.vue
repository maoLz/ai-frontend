<template>
  <el-card class="md-editor-card">
    <div class="card-header">
      <div>
        <div class="title">Markdown 编辑器</div>
        <div class="subtitle">自带预览，直接编辑即可</div>
      </div>
      <el-button size="small" type="primary" @click="resetContent">重置示例</el-button>
    </div>
    <v-md-editor
      v-model="content"
      height="700px"
      @save="handleSave"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import '@kangc/v-md-editor/lib/style/preview.css'

const defaultContent = `# 欢迎使用 Markdown 编辑器

在左侧编辑 Markdown，右侧实时预览渲染效果。

## 快速示例
- **加粗** 与 *斜体*
- 代码块:
  \`\`\`js
  const hello = 'world'
  console.log(hello)
  \`\`\`
- 引用: > 记录你的想法

按下工具栏里的保存按钮会触发回调。`

const content = ref(defaultContent)

const handleSave = (text) => {
  console.log('保存的 Markdown 文本：', text)
  ElMessage.success('内容已保存（控制台查看文本）')
}

const resetContent = () => {
  content.value = defaultContent
}

const handleBeforeUnload = (event) => {
  event.preventDefault()
  event.returnValue = '将要离开页面，请保存'
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})


</script>

<style scoped>
.md-editor-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  color: #909399;
  font-size: 13px;
}
</style>
