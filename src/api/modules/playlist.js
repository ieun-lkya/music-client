import http from '../../utils/request'

export const createPlaylistAPI = (userId, name) => http.post('/playlist/create', null, { params: { userId, name } })
export const getUserPlaylistsAPI = (userId) => http.get('/playlist/list', { userId })
export const addMusicToPlaylistAPI = (playlistId, musicId) => http.post('/playlist/addMusic', null, { params: { playlistId, musicId } })
export const getPlaylistMusicAPI = (playlistId) => http.get('/playlist/musicList', { playlistId })
export const deletePlaylistAPI = (playlistId) => http.delete('/playlist/delete', { playlistId })
export const getAllPlaylistsAPI = () => http.get('/playlist/all')
export const collectPlaylistAPI = (userId, playlistId) => http.post('/playlist/collect', null, { params: { userId, playlistId } })
export const uncollectPlaylistAPI = (userId, playlistId) => http.post('/playlist/uncollect', null, { params: { userId, playlistId } })
export const getCollectedPlaylistsAPI = (userId) => http.get(`/playlist/collected/${userId}`)
