import http from '../../utils/request'

export const recommendMusicAPI = (scene) => http.get('/music/ai/recommend', { scene })
export const generateAiPlaylistsAPI = () => http.get('/music/ai/generatePlaylists')
export const getArtistBioAPI = (artist) => http.get('/music/ai/artist/bio', { artist })
