import request from './request'

export function getFlowList() {
  return request.get('/flow')
}

export function createFlow(payload) {
  return request.post('/flow', payload)
}

export function getFlowDetail(id) {
  return request.get(`/flow/${id}`)
}

export function updateFlow(id, payload) {
  return request.put(`/flow/${id}`, payload)
}

export function deleteFlow(id) {
  return request.delete(`/flow/${id}`)
}

export function startFlow(payload, options = {}) {
  return request.post('/flow/start', payload, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
}

export function continueFlow(payload) {
  return request.post('/flow/continueTask', payload)
}

export function loadLastParam(id) {
  return request.get(`/flow/${id}/latest-instance-input`)
}

export function cloneFlow(id) {
  return request.post(`/flow/${id}/clone`)
}
