import http from '../../utils/request'

export const uploadFileAPI = (formData) => http.post('/common/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
