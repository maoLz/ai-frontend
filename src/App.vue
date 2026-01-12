<template>
  <div v-if="isBlankLayout">
    <router-view />
  </div>
  <el-container v-else class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside width="200px" class="layout-aside">
      <div class="logo">My Admin</div>

      <el-menu
        :default-active="activeMenu"
        router
        class="el-menu-vertical"
      >
       <el-menu-item index="/flow">
          <span>工作流</span>
        </el-menu-item>
        <el-menu-item index="/code-tree">
          <span>文件树</span>
        </el-menu-item>
        <el-menu-item index="/file-contents">
          <span>文件内容</span>
        </el-menu-item>
        <el-menu-item index="/apply-patches">
          <span>应用补丁</span>
        </el-menu-item>
      
        <!-- <el-menu-item  @click="openMarkdownManager">
          <span>Markdown </span>
        </el-menu-item> -->
        <el-menu-item index="/flow-start">
          <span>自动创建工作流节点</span>
        </el-menu-item>
        <el-menu-item index="/node-config">
          <span>节点配置表单</span>
        </el-menu-item>
        <el-menu-item index="/flow-code-output">
          <span>ai代码编写</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容 -->
    <el-container>
      <el-header class="layout-header">
        <span>后台管理系统</span>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { House, Document } from '@element-plus/icons-vue'
import { ElSubMenu } from 'element-plus'

const route = useRoute()

const activeMenu = computed(() => route.path)
const isBlankLayout = computed(() => route.meta?.blankLayout)

const openMarkdownManager = () => {
  window.open('/markdown-manager', '_blank')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #fff;
  color: #fff;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
}

.el-menu-vertical {
  border-right: none;
}

.layout-header {
  background: #fff;
  display: flex;
  align-items: center;
  padding-left: 20px;
  border-bottom: 1px solid #eee;
}

.layout-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
