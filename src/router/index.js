import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("../views/Home.vue"),
  },
  //   ,
  //   {
  //     path: '/about',
  //     component: () => import('../views/About.vue')
  //   }
  {
    path: "/code-tree",
    component: () => import("../views/CodeTree.vue"),
  },
  {
    path: "/file-contents",
    component: () => import("../views/FileContents.vue"),
  },
  {
    path: "/apply-patches",
    component: () => import("../views/ApplyPatches.vue"),
  },
  {
    path: "/flow",
    component: () => import("../views/FlowList.vue"),
  },
  {
    path: "/chat",
    component: () => import("../views/Chat.vue"),
  },
  {
    path: "/flow-nodes",
    component: () => import("../views/FlowNodeList.vue"),
  },
  {
    path: "/flow-canvas",
    component: () => import("../views/FlowCanvas.vue"),
  },
  {
    path: "/flow-instances",
    component: () => import("../views/FlowInstanceList.vue"),
  },
  {
    path: "/node-executor-records",
    component: () => import("../views/NodeExecutorRecordList.vue"),
  },
  {
    path: "/flow-start",
    component: () => import("../views/FlowStart.vue"),
  },
  {
    path: "/flow-code-output",
    component: () => import("../views/FlowCodeOutput.vue"),
  },
  {
    path: "/node-config",
    component: () => import("../views/NodeConfigForm.vue"),
  },
  {
    path: "/project-info",
    component: () => import("../views/ProjectInfoList.vue"),
  },
  {
    path: "/markdown",
    component: () => import("../views/MarkdownEditor.vue"),
  },
  {
    path: "/markdown-manager",
    component: () => import("../views/MarkdownManager.vue"),
    meta: { blankLayout: true },
  },
  {
    path: "/flow-run-page",
    component: () => import("../views/FlowRunPage.vue"),
  },
  {
    path: "/ollama",
    component: () => import("../views/OllamaChat.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
