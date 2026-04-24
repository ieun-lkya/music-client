import http from '../../utils/request'

export const getCommentsAPI = (musicId) => http.get('/comment/list', { musicId })
export const addCommentAPI = (data) => http.post('/comment/add', data)
export const likeCommentAPI = (id) => http.post(`/comment/like/${id}`)
