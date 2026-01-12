<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>读取文件内容</template>
      <el-form label-width="120px" :model="form">
        <el-form-item label="项目路径">
          <el-input v-model="form.projectPath" placeholder="例如：/Users/zhanglizhong/personalProjects/ai-backend" />
        </el-form-item>
        <el-form-item label="相对路径列表">
          <el-input
            v-model="form.relativePathsText"
            type="textarea"
            :rows="5"
            placeholder="每行一个相对路径，例如：\nsrc/main/java/com/demo/App.java\nREADME.md"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleFetch">读取文件</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        title="接口 /api/code/content 需要 requestStr 包裹 projectPath 与 relativePaths，这里已自动封装"
        type="info"
        show-icon
      />
    </el-card>

    <el-card class="card" shadow="never">
      <template #header>文件内容</template>
      <el-empty v-if="!results.length && !loading" description="暂无数据" />
      <el-skeleton v-if="loading" animated :rows="6" />
      <div v-else class="result-grid">
        <el-card
          v-for="item in results"
          :key="item.relativePath || item.path || item.name"
          class="file-card"
          shadow="hover"
        >
          <template #header>
            <div class="file-header">
              <span class="path">{{ item.relativePath || item.path || '未命名' }}</span>
            </div>
          </template>
          <el-input
            v-model="item.content"
            type="textarea"
            :rows="12"
            readonly
          />
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getFileContents } from '@/api/code'

const form = reactive({
  projectPath: '',
  relativePathsText: ''
})

const loading = ref(false)
const results = ref([])

const handleFetch = async () => {
  if (!form.projectPath) {
    ElMessage.warning('请填写项目路径')
    return
  }
  const paths = form.relativePathsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (!paths.length) {
    ElMessage.warning('请至少输入一个相对路径')
    return
  }

  loading.value = true
  try {
    const data = await getFileContents(form.projectPath, paths)
    if (Array.isArray(data)) {
      results.value = data
    } else if (data && typeof data === 'object') {
      results.value = Object.entries(data).map(([key, value]) => ({
        relativePath: key,
        content: value
      }))
    } else {
      results.value = []
    }
  } catch (error) {
    ElMessage.error(error?.message || '读取文件失败')
  } finally {
    loading.value = false
  }
}

const reset = () => {
  form.projectPath = ''
  form.relativePathsText = ''
  results.value = []
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  width: 100%;
}

.result-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.file-card {
  width: 100%;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.path {
  font-weight: 600;
  word-break: break-all;
}
</style>
