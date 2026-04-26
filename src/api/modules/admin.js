import http from '../../utils/request'

export const adminLoginAPI = (credentials) => http.post('/admin/login', credentials)
export const getAdminProfileAPI = () => http.get('/admin/me')
export const getDashboardDataAPI = () => http.get('/admin/dashboard/data')
export const getAdminUsersAPI = (keyword = '') => http.get('/admin/users', { keyword })
export const resetUserProfileAPI = (id) => http.post(`/admin/users/${id}/resetProfile`)
export const deleteUserByAdminAPI = (id) => http.delete(`/admin/users/${id}`)
export const parseOnlyAPI = (formData) => http.post('/admin/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const suggestTagsAPI = (title, artist) => http.get('/admin/suggestTags', { title, artist })
export const publishMusicAPI = (formData) => http.post('/admin/publish', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteMusicByAdminAPI = (id) => http.delete(`/admin/delete/${id}`)
export const updateMusicByAdminAPI = (formData) => http.post('/admin/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
