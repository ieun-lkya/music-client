import http from '../../utils/request'

export const getDashboardDataAPI = () => http.get('/admin/dashboard/data')
export const parseOnlyAPI = (formData) => http.post('/admin/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const suggestTagsAPI = (title, artist) => http.get('/admin/suggestTags', { title, artist })
export const publishMusicAPI = (formData) => http.post('/admin/publish', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteMusicByAdminAPI = (id) => http.delete(`/admin/delete/${id}`)
export const updateMusicByAdminAPI = (formData) => http.post('/admin/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
