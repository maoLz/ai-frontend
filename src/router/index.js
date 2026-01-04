import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Home.vue')
  }
//   ,
//   {
//     path: '/about',
//     component: () => import('../views/About.vue')
//   }
,
{
    path: '/flow',
    component: () => import('../views/FlowList.vue')
},
{
    path: '/flow-nodes',
    component: () => import('../views/FlowNodeList.vue')
},
{
    path: '/flow-canvas',
    component: () => import('../views/FlowCanvas.vue')
},
{
    path: '/flow-instances',
    component: () => import('../views/FlowInstanceList.vue')
},
{
    path: '/node-executor-records',
    component: () => import('../views/NodeExecutorRecordList.vue')
},
{
    path: '/flow-start',
    component: () => import('../views/FlowStart.vue')
},
{
    path: '/flow-code-output',
    component: () => import('../views/FlowCodeOutput.vue')
},
{
    path: '/node-config',
    component: () => import('../views/NodeConfigForm.vue')
},
{
    path: '/markdown',
    component: () => import('../views/MarkdownEditor.vue')
},
{
    path: '/markdown-manager',
    component: () => import('../views/MarkdownManager.vue'),
    meta: { blankLayout: true }
}
]

export default createRouter({
  history: createWebHistory(),
  routes
})
