<template>
  <div class="list-page">
    <el-card class="toolbar" shadow="never">
      <el-button type="primary" @click="openCreate">新增</el-button>
      <el-button @click="fetchList">刷新</el-button>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" border style="width: 100%" :loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="项目名称" width="160" />
        <el-table-column label="项目路径" min-width="240">
          <template #default="{ row }">
            <span>{{ formatPaths(row.paths) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="项目简介" min-width="260" />
        <el-table-column prop="createDate" label="创建时间" width="200" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="openEdit(row)">修改</el-button>
              <el-button type="info" text size="small" @click="openDetail(row)">详情</el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="70%"
      :close-on-click-modal="false"
      @close="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" :disabled="isReadOnly" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目路径" prop="paths">
          <el-select
            v-model="form.paths"
            :disabled="isReadOnly"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入项目路径，可输入多个"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="项目简介" prop="description">
          <v-md-preview v-if="isReadOnly" :text="form.description || ''" />
          <v-md-editor
            v-else
            v-model="form.description"
            height="360px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="!isReadOnly" type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createProjectInfo,
  deleteProjectInfo,
  getProjectInfoDetail,
  getProjectInfoList,
  updateProjectInfo
} from '@/api/projectInfo'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const currentId = ref(null)
const submitting = ref(false)

const formRef = ref(null)
const form = reactive({
  name: '',
  paths: [],
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  paths: [{ required: true, message: '请输入项目路径', trigger: 'change' }]
}

const dialogTitle = computed(() => {
  if (dialogMode.value === 'edit') return '修改项目'
  if (dialogMode.value === 'detail') return '项目详情'
  return '新增项目'
})

const isReadOnly = computed(() => dialogMode.value === 'detail')

const resetForm = () => {
  form.name = ''
  form.paths = []
  form.description = ''
  formRef.value?.clearValidate()
}

const normalizePaths = (value) => {
  if (Array.isArray(value)) return value
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [String(parsed)]
  } catch (error) {
    return String(value).split(/[,\\n]/).map((item) => item.trim()).filter(Boolean)
  }
}

const formatPaths = (value) => normalizePaths(value).join(', ')

const fetchList = async () => {
  loading.value = true
  try {
    const list = await getProjectInfoList()
    tableData.value = list.map((item) => ({
      ...item,
      paths: normalizePaths(item.paths)
    }))
  } catch (error) {
    ElMessage.error(error?.message || '获取列表失败')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  dialogMode.value = 'create'
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEdit = async (row) => {
  dialogMode.value = 'edit'
  currentId.value = row.id
  await loadDetail(row.id)
  dialogVisible.value = true
}

const openDetail = async (row) => {
  dialogMode.value = 'detail'
  currentId.value = row.id
  await loadDetail(row.id)
  dialogVisible.value = true
}

const loadDetail = async (id) => {
  try {
    const detail = await getProjectInfoDetail(id)
    form.name = detail.name ?? ''
    form.paths = normalizePaths(detail.paths)
    form.description = detail.description ?? ''
  } catch (error) {
    ElMessage.error(error?.message || '获取详情失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  submitting.value = true
  try {
    if (dialogMode.value === 'edit' && currentId.value) {
      await updateProjectInfo(currentId.value, {
        name: form.name,
        paths: form.paths,
        description: form.description
      })
      ElMessage.success('更新成功')
    } else {
      await createProjectInfo({
        name: form.name,
        paths: form.paths,
        description: form.description
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchList()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除项目「${row.name || row.id}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteProjectInfo(row.id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

const handleDialogClosed = () => {
  if (!dialogVisible.value) {
    dialogMode.value = 'create'
    currentId.value = null
    resetForm()
  }
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
</style>
