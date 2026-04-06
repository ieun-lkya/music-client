import http from '../utils/request'

// 用户注册登录 - 毒瘤已拔除！
export const registerAPI = (data) => http.post('/user/register', data)
export const loginAPI = (data) => http.post('/user/login', data)

// 收藏业务 - 毒瘤已拔除！
export const likeMusicAPI = (userId, musicId) => http.post('/user/like', null, { params: { userId, musicId } })
export const unlikeMusicAPI = (userId, musicId) => http.post('/user/unlike', null, { params: { userId, musicId } })
export const getLikedMusicAPI = (userId) => http.get('/user/likes', { params: { userId } })

// 🚀 更新用户音乐名片
export const updateUserAPI = (data) => http.post('/user/update', data)

// 🚀 核心修复 1：把错误的 request 全部换回 http！
export const getHeatmapAPI = (userId) => http.get(`/analysis/heatmap/${userId}`)
export const getRadarAPI = (userId) => http.get(`/analysis/radar/${userId}`)
export const recordPlayAPI = (userId, musicId) => http.post(`/analysis/record?userId=${userId}&musicId=${musicId}`)

// 🚀 社交系统：模糊搜索用户
export const searchUsersAPI = (keyword) => http.get('/user/search', { params: { keyword } })

// 🚀 社交系统网络请求
export const getUserProfileAPI = (id, currentUserId) => http.get(`/user/profile/${id}`, { params: { currentUserId } })
export const followUserAPI = (followerId, followingId) => http.post('/user/follow', null, { params: { followerId, followingId } })
export const unfollowUserAPI = (followerId, followingId) => http.post('/user/unfollow', null, { params: { followerId, followingId } })
export const sendMessageAPI = (data) => http.post('/user/chat/send', data)
export const getChatHistoryAPI = (userId1, userId2) => http.get('/user/chat/history', { params: { userId1, userId2 } })
