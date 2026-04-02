import { reactive } from 'vue'

// 🚀 极其轻量级的全局状态引擎 (终极完整版)
export const useMusicStore = reactive({
  currentUser: JSON.parse(localStorage.getItem('echo_user')) || null,
  currentMenu: 'discover',
  
  // 核心播放状态
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playHistory: JSON.parse(localStorage.getItem('echo_play_history')) || [],
  
  // 核心数据列表
  likedMusicList: [],
  customPlaylists: [],

  // 全局 UI 控制
  showLyricPanel: false,

  // 🚀 切换播放状态
  togglePlay() {
    this.isPlaying = !this.isPlaying;
  },
  
  // 🚀 选歌逻辑
  selectSong(song) {
    this.currentSong = song;
    this.isPlaying = true;
    const index = this.playHistory.findIndex(item => item.id === song.id);
    if (index !== -1) this.playHistory.splice(index, 1);
    this.playHistory.unshift(song);
    if (this.playHistory.length > 50) this.playHistory.pop();
    localStorage.setItem('echo_play_history', JSON.stringify(this.playHistory));
  },

  // 🚀 快捷判断是否红心 (修复白屏的救命稻草！)
  isLiked(musicId) {
    return this.likedMusicList.some(item => item.id === musicId)
  }
})