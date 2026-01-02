import request from './request'

export function getFlowNodeList() {
  return request.get('/flow-nodes')
}

export function getFlowNodeDetail(id) {
  return request.get(`/flow-nodes/${id}`)
}

export function getFlowNodeByFlowId(flowId) {
  return request.get(`/flow-nodes/flow/${flowId}`)
}

export function createFlowNode(payload) {
  return request.post('/flow-nodes', payload)
}

export function updateFlowNode(id, payload) {
  return request.put(`/flow-nodes/${id}`, payload)
}

export function deleteFlowNode(id) {
  return request.delete(`/flow-nodes/${id}`)
}
