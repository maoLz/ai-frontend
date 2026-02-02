import request from './request'

export function getProjectInfoList() {
  return request.get('/project-info')
}

export function createProjectInfo(payload) {
  return request.post('/project-info', payload)
}

export function getProjectInfoDetail(id) {
  return request.get(`/project-info/${id}`)
}

export function updateProjectInfo(id, payload) {
  return request.put(`/project-info/${id}`, payload)
}

export function deleteProjectInfo(id) {
  return request.delete(`/project-info/${id}`)
}
