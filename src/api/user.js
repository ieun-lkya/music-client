import http from '../utils/request'

// 用户注册登录 - 毒瘤已拔除！
export const registerAPI = (data) => http.post('/user/register', data)
export const loginAPI = (data) => http.post('/user/login', data)

// 收藏业务 - 毒瘤已拔除！
export const likeMusicAPI = (userId, musicId) => http.post('/user/like', null, { params: { userId, musicId } })
export const unlikeMusicAPI = (userId, musicId) => http.post('/user/unlike', null, { params: { userId, musicId } })
export const getLikedMusicAPI = (userId) => http.get('/user/likes', { params: { userId } })