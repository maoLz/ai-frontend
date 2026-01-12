<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>应用补丁</template>
      <el-form label-width="120px" :model="form">
        <el-form-item label="项目路径">
          <el-input v-model="form.projectPath" placeholder="目标项目绝对路径" />
        </el-form-item>
        <el-form-item label="补丁数组 JSON">
          <el-input
            v-model="form.patchText"
            type="textarea"
            :rows="10"
            placeholder='例如：[\n  {\n    "relativePath": "src/App.vue",\n    "patch": "*** Begin Patch..."\n  }\n]'
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleApply">提交补丁</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        title="接口 /api/code/applyPatches 需要 patchStr 传入可解析为 FilePatchDTO 列表的 JSON 字符串，这里会先尝试解析再提交。"
        type="info"
        show-icon
      />
    </el-card>

    <el-card class="card" shadow="never">
      <template #header>补丁预览</template>
      <el-empty v-if="!patchPreview.length" description="暂无可预览的补丁" />
      <el-collapse v-else>
        <el-collapse-item v-for="(item, index) in patchPreview" :key="index" :title="itemTitle(item, index)">
          <el-input v-model="item.patch" type="textarea" :rows="12" readonly />
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { applyCodePatches } from '@/api/code'

const form = reactive({
  projectPath: '',
  patchText: ''
})

const loading = ref(false)

const patchPreview = computed(() => {
  try {
    const parsed = JSON.parse(form.patchText || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
})

const itemTitle = (item, index) => {
  const path = item.relativePath || item.filePath || item.path || `补丁 ${index + 1}`
  return `${index + 1}. ${path}`
}

const handleApply = async () => {
  if (!form.projectPath) {
    ElMessage.warning('请填写项目路径')
    return
  }
  let patches = []
  try {
    const parsed = JSON.parse(form.patchText || '[]')
    if (!Array.isArray(parsed)) {
      throw new Error('补丁内容需为数组')
    }
    patches = parsed
  } catch (error) {
    ElMessage.error(error?.message || '补丁 JSON 解析失败')
    return
  }

  loading.value = true
  try {
    await applyCodePatches(form.projectPath, patches)
    ElMessage.success('补丁已提交，注意查看后端日志或目标文件状态')
  } catch (error) {
    ElMessage.error(error?.message || '提交补丁失败')
  } finally {
    loading.value = false
  }
}

const reset = () => {
  form.projectPath = ''
  form.patchText = ''
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
</style>
