import request from './request'

export function getFlowInstanceByFlowId(flowId) {
  return request.get(`/flow-instances/flow/${flowId}`)
}

export function getFlowInstanceList() {
  return request.get('/flow-instances')
}

export function getFlowInstanceDetail(id) {
  return request.get(`/flow-instances/${id}`)
}

export function deleteFlowInstance(id) {
  return request.delete(`/flow-instances/${id}`)
}

export function deleteFlowInstancesByFlowId(flowId) {
  return request.delete(`/flow-instances/flow/${flowId}`)
}
