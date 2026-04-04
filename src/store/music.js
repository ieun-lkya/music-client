import { reactive } from 'vue'

// 🚀 将对象包裹在内部
const store = reactive({
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
  collectedPlaylists: [], // 🚀 新增：收藏歌单库

  // 全局 UI 控制
  showLyricPanel: false,

  // 🚀 新增：极其硬核的底层 Web Audio API 共享节点
  audioAnalyser: null,

  // 🚀 切换播放状态
  togglePlay() {
    this.isPlaying = !this.isPlaying;
  },
  
  // 🚀 选歌逻辑
  selectSong(song) {
    this.currentSong = song;
    this.isPlaying = true;
    
    // 🚀 发射播放脉冲，引爆热歌榜！
    import('../api/music').then(api => api.addPlayCountAPI(song.id).catch(()=>{}));
    
    const index = this.playHistory.findIndex(item => item.id === song.id);
    if (index !== -1) this.playHistory.splice(index, 1);
    this.playHistory.unshift(song);
    if (this.playHistory.length > 50) this.playHistory.pop();
    localStorage.setItem('echo_play_history', JSON.stringify(this.playHistory));
  },

  // 🚀 快捷判断是否红心
  isLiked(musicId) {
    return this.likedMusicList.some(item => item.id === musicId)
  }
})

// 💥 极其关键的救命修复：导出一个函数！这样前端写 useMusicStore() 才不会白屏暴毙！
export const useMusicStore = () => store