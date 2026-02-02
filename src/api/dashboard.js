import request from './request'

export function getInstances(id) {
  return request.get(`/dashboard/instance/${id}`)
}

export function getFlowDetail(id){
    return request.get(`/dashboard/flow/${id}`)
}

export function getInstanceDetail(id) {
  return request.get(`/dashboard/instanceDetail/${id}`)
}

export function getInstanceRecords(flowInstanceId) {
  return request.get(`/dashboard/instanceRecords/${flowInstanceId}`)
}

export function getInstanceRecordDetail(id) {
  return request.get(`/dashboard/instanceRecordDetail/${id}`)
}
