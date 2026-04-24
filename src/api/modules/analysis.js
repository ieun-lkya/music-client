import http from '../../utils/request'

export const getAnalysisDashboardAPI = (userId) => http.get(`/analysis/dashboard/${userId}`)
export const getHeatmapAPI = (userId) => http.get(`/analysis/heatmap/${userId}`)
export const getRadarAPI = (userId) => http.get(`/analysis/radar/${userId}`)
export const recordPlayAPI = (userId, musicId) => http.post('/analysis/record', null, { params: { userId, musicId } })
