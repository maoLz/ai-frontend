import request from './request'

export const chatOllama = (payload) => request.post('/ollama/chat', payload)
