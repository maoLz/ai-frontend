import request from './request'

export const getCodeTree = (path, nameFilters = []) => {
  return request.post('/code/tree', {
    path,
    nameFilters
  })
}

export const getFileContents = (projectPath, relativePaths = []) => {
  const payload = {
    projectPath,
    relativePaths
  }

  return request.post('/code/content', {
    requestStr: JSON.stringify(payload)
  })
}

export const applyCodePatches = (projectPath, patches = []) => {
  return request.post('/code/applyPatches', {
    projectPath,
    patchStr: JSON.stringify(patches)
  })
}
