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

export function startFlow(payload, options = {}) {
  return request.post('/flows/start', payload, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
}

export function preCheckFlow(id, payload) {
  return request.post(`/flows/${id}/preCheck`, payload)
}

export function continueFlow(payload) {
  return request.post('/flows/continueTask', payload)
}
