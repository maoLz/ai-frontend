import request from './request'

export function getFlowList() {
  return request.get('/flows')
}

export function createFlow(payload) {
  return request.post('/flows', payload)
}

export function getFlowDetail(id) {
  return request.get(`/flows/${id}`)
}

export function updateFlow(id, payload) {
  return request.put(`/flows/${id}`, payload)
}

export function deleteFlow(id) {
  return request.delete(`/flows/${id}`)
}

export function startFlow(id, payload) {
  return request.post(`/flows/${id}/start`, payload)
}

export function preCheckFlow(id, payload) {
  return request.post(`/flows/${id}/preCheck`, payload)
}
