import request from './request'

// 将节点和连线提交到后端，接口路径按实际情况调整
export function submitFlowGraph(flowId,nodes, edges) {
  return request.post('/flow-nodes/canvas/submit', { flowId,nodes, edges })
}

export function load(flowId) {
  return request.get(`/flow-nodes/canvas/${flowId}`);
}