import request from './request'

export function getNodeExecutorRecordsByFlowInstanceId(flowInstanceId) {
  return request.get(`/node-executor-records/flow-instance/${flowInstanceId}`)
}

export function getNodeExecutorRecordDetail(id) {
  return request.get(`/node-executor-records/${id}`)
}

export function reExecuteNodeExecutorRecord(id) {
  return request.post(`/node-executor-records/re-execute/${id}`)
}
