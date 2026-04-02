import { reactive } from 'vue'

// 🚀 极其轻量级的全局状态管理，替代臃肿的 Vuex/Pinia
export const useMusicStore = reactive({
  currentUser: JSON.parse(localStorage.getItem('echo_user')) || null,
  currentMenu: 'discover',
  
  // 播放状态
  currentSong: null,
  isPlaying: false,
  playHistory: JSON.parse(localStorage.getItem('echo_play_history')) || [],
  
  // 数据列表
  allMusicList: [],
  likedMusicList: [],
  customPlaylists: [],
  
  // 批量操作状态
  isBatchMode: false,
  selectedMusicIds: [],

  // 🚀 全局方法：切换播放状态
  togglePlay() {
    this.isPlaying = !this.isPlaying;
  },
  
  // 🚀 全局方法：选择歌曲
  selectSong(song) {
    this.currentSong = song;
    this.isPlaying = true;
    
    // 写入历史记录
    const index = this.playHistory.findIndex(item => item.id === song.id);
    if (index !== -1) this.playHistory.splice(index, 1);
    this.playHistory.unshift(song);
    if (this.playHistory.length > 50) this.playHistory.pop();
    localStorage.setItem('echo_play_history', JSON.stringify(this.playHistory));
  }
})