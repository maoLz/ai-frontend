<template>  
  <div class="page">  
    <el-card class="card" shadow="never">  
      <template #header>文件树查询</template>  
      <el-form label-width="120px" :model="form">  
        <el-form-item label="项目路径">  
          <el-input v-model="form.path" placeholder="例如：/Users/zhanglizhong/personalProjects/ai-backend" />  
        </el-form-item>  
        <el-form-item label="名称过滤">  
          <div class="filter-list">
            <div
              v-for="(filter, index) in form.nameFilters"
              :key="index"
              class="filter-row"
            >
              <el-input
                v-model="form.nameFilters[index]"
                placeholder="可选，过滤文件名"
              />
            </div>
            <el-button type="primary" link :icon="Plus" @click="addFilterInput">
              新增过滤
            </el-button>
          </div>
        </el-form-item>  
        <el-form-item>  
          <el-button type="primary" :loading="loading" @click="handleFetch">拉取文件树</el-button>  
          <el-button @click="reset">重置</el-button>  
        </el-form-item>  
      </el-form>  
      <el-alert  
        title="调用 /api/code/tree，返回的字段会直接作为树的 children/name 展示，具体结构以后端为准"  
        type="info"  
        show-icon  
      />  
    </el-card>  
  
  
    <el-row :gutter="12">  
      <el-col >  
        <el-card class="card" shadow="never">  
          <template #header>
            <div class="header-with-search">
              <span>文件列表（仅 file）</span>
              <div class="search-container">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索文件路径"
                  clearable
                  :prefix-icon="Search"
                  @input="handleSearch"
                  style="width: 300px;"
                />
                <el-button
                  v-if="isSearching"
                  type="text"
                  @click="clearSearch"
                  style="margin-left: 8px;"
                >
                  清除搜索
                </el-button>
              </div>
            </div>
          </template>  
          <div v-if="isSearching" class="search-info">
            <el-tag type="info" size="small">
              共找到 {{ filteredFileList.length }} 个匹配结果
            </el-tag>
          </div>
          <el-empty v-if="!displayFileList.length && !loading" description="暂无数据" />  
          <el-table  
            v-else  
            :data="displayFileList"  
            style="width: 100%"  
            border  
            :loading="loading"  
            row-key="path"  
          >  
            <el-table-column type="selection" width="55" />  
            <el-table-column prop="name" label="名称" width="200" />  
            <el-table-column prop="path" label="路径">  
              <template #default="{ row }">
                <div v-html="highlightText(row.path, searchKeyword)" />
              </template>
            </el-table-column>  
            <el-table-column prop="type" label="类型" width="120" />  
          </el-table>  
        </el-card>  
      </el-col>  
    </el-row>  
  </div>  
</template>  
  
  
<script setup>  
import { reactive, ref, computed } from 'vue'  
import { ElMessage } from 'element-plus'  
import { Plus, Search } from '@element-plus/icons-vue'
import { getCodeTree } from '@/api/code'  
  
  
const form = reactive({  
  path: '/Users/zhanglizhong/rebell/ai/',  
  nameFilters: ['']  
})  
  
const rawJson = ref('')  
const loading = ref(false)  
const fileList = ref([])  
const searchKeyword = ref('')  
const isSearching = computed(() => searchKeyword.value.trim().length > 0)

// 原始文件列表（用于搜索时重置）
const originalFileList = ref([])

// 过滤后的文件列表
const filteredFileList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return originalFileList.value
  }
  
  const keyword = searchKeyword.value.trim().toLowerCase()
  return originalFileList.value.filter(item => {
    // 在 path 中搜索匹配
    return item.path.toLowerCase().includes(keyword)
  })
})

// 实际显示的文件列表
const displayFileList = computed(() => {
  return filteredFileList.value
})

// 高亮搜索关键词
const highlightText = (text, keyword) => {
  if (!keyword.trim()) return text
  
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 转义正则表达式特殊字符
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 属性中处理
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

const handleFetch = async () => {  
  if (!form.path) {  
    ElMessage.warning('请填写项目路径')  
    return  
  }  
  loading.value = true  
  try {  
    const filters = form.nameFilters
      .map((item) => item.trim())
      .filter(Boolean)
    const data = await getCodeTree(form.path, filters)  
    // 接口 data 是字符串化的 FileNode JSON  
    rawJson.value = formatJsonPreview(data)  
    const parsed = parseTree(rawJson.value, data)  
    const flattened = flattenFiles(parsed)
    fileList.value = flattened
    originalFileList.value = [...flattened] // 保存原始数据副本
  } catch (error) {  
    ElMessage.error(error?.message || '获取文件树失败')  
  } finally {  
    loading.value = false  
  }  
}  
  
  
const formatJsonPreview = (data) => {  
  if (typeof data === 'string') {  
    try {  
      return JSON.stringify(JSON.parse(data), null, 2)  
    } catch (error) {  
      return data  
    }  
  }  
  return JSON.stringify(data, null, 2)  
}  
  
  
const parseTree = (raw, fallback) => {  
  let parsed = fallback  
  if (typeof raw === 'string') {  
    try {  
      parsed = JSON.parse(raw)  
    } catch (error) {  
      ElMessage.error('文件树 JSON 解析失败')  
      return []  
    }  
  }  
  
  
  if (Array.isArray(parsed)) {  
    return parsed  
  }  
  if (parsed && typeof parsed === 'object') {  
    return [parsed]  
  }  
  return []  
}  
  
  
const filterFileNodes = (nodes) => {  
  if (!Array.isArray(nodes)) return []  
  return nodes  
    .map((node) => {  
      // 只保留 type=file，目录仅用于承载文件子节点  
      if (node.type === 'file') {  
        return { ...node, children: [] }  
      }  
      if (node.children && node.children.length) {  
        const kept = filterFileNodes(node.children)  
        if (kept.length) {  
          return { ...node, children: kept }  
        }  
      }  
      return null  
    })  
    .filter(Boolean)  
}  
  
  
const flattenFiles = (nodes) => {  
  const result = []  
  const walker = (arr) => {  
    arr?.forEach((node) => {  
      if (node.type === 'file') {  
        result.push({  
          name: node.name || '未命名',  
          path: node.path || node.relativePath || '',  
          type: node.type  
        })  
      }  
      if (node.children && node.children.length) {  
        walker(node.children)  
      }  
    })  
  }  
  walker(nodes)  
  return result  
}  
  
  
const reset = () => {  
  form.path = ''  
  form.nameFilters = ['']  
  fileList.value = []  
  originalFileList.value = []
  searchKeyword.value = ''
  rawJson.value = ''  
}  

const addFilterInput = () => {
  form.nameFilters.push('')
}
</script>

<style scoped>
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  gap: 8px;
}

.header-with-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-info {
  margin-bottom: 16px;
}

.highlight {
  background-color: #ffd700;
  color: #333;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 2px;
}
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  width: 100%;
}

</style>
