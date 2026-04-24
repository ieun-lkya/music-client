import http from '../../utils/request'

export const getMusicListAPI = () => http.get('/music/list')
export const searchMusicAPI = (keyword) => http.get('/music/search', { keyword })
export const getMusicByArtistAPI = (artist) => http.get('/music/artist', { name: artist })
export const addPlayCountAPI = (id) => http.post(`/music/play/${id}`)
