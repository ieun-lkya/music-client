import http from '../../utils/request'

export const registerAPI = (data) => http.post('/user/register', data)
export const loginAPI = (data) => http.post('/user/login', data)
