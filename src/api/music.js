import http from '@/utils/request'

// 纯本地解析
export const parseOnlyAPI = (formData) => http.post('/admin/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// 终极一键上传+入库
export const publishMusicAPI = (formData) => http.post('/admin/publish', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// 上传图片/封面的接口
export const uploadFileAPI = (formData) => http.post('/common/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// 将最终确认的表单信息存入 MySQL 数据库
export const addMusicAPI = (musicData) => http.post('/music/add', musicData)

// 删除音乐
export const deleteMusicAPI = (id) => http.delete(`/music/delete/${id}`)

// 更新封面
export const updateCoverAPI = (id, coverUrl) => http.post('/music/updateCover', null, { params: { id, coverUrl } })

// 🚀 获取所有音乐（大厅）
export const getMusicListAPI = () => http.get('/music/list')

// 🚀 呼叫 AI 场景匹配 (必须是老版本的路径和传参)
export const recommendMusicAPI = (scene) => http.get('/music/ai/recommend', { params: { scene } })

// 🚀 云村热评系统接口 (完美适配咱们刚才改过的双保险后端)
export const getCommentsAPI = (musicId) => http.get('/comment/list', { params: { musicId } })
export const addCommentAPI = (data) => http.post('/comment/add', data)
export const likeCommentAPI = (id) => http.post(`/comment/like/${id}`)

// 🚀 真实后端分页接口 (PageHelper)
export const getMusicPageAPI = (pageNum, pageSize) => http.get('/music/page', { params: { pageNum, pageSize } })

// 🚀 播放量脉冲 & 热歌榜 (流量变现基建)
export const addPlayCountAPI = (id) => http.post(`/music/play/${id}`)
export const getTopMusicAPI = () => http.get('/music/top')

// 💥💥💥 核心抢救区：云端歌单接口（绝不使用错乱的路径传参，严格改回 params 传参！）
export const createPlaylistAPI = (userId, name) => http.post('/playlist/create', null, { params: { userId, name } })
export const getUserPlaylistsAPI = (userId) => http.get('/playlist/list', { params: { userId } })
export const addMusicToPlaylistAPI = (playlistId, musicId) => http.post('/playlist/addMusic', null, { params: { playlistId, musicId } })
export const getPlaylistMusicAPI = (playlistId) => http.get('/playlist/musicList', { params: { playlistId } })
export const deletePlaylistAPI = (playlistId) => http.delete('/playlist/delete', { params: { playlistId } })

export const getAllPlaylistsAPI = () => http.get('/playlist/all')

// 🚀 全局搜索引擎
export const searchMusicAPI = (keyword) => http.get('/music/search', { params: { keyword } })
