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
  
  // 💥 新增：播放队列与播放模式
  playQueue: [], // 当前播放列表
  playMode: 'list', // 模式：'list'(列表循环) | 'random'(随机播放) | 'loop'(单曲循环)

  likedMusicList: [],
  customPlaylists: [],
  collectedPlaylists: [],
  showLyricPanel: false,
  audioAnalyser: null,

  togglePlay() {
    this.isPlaying = !this.isPlaying;
  },
  
  // 💥 升级版选歌逻辑：支持传入整个歌单作为队列
  selectSong(song, queue = []) {
    this.currentSong = song;
    this.isPlaying = true; // 💥 必须加回来！切歌时状态必须是播放！

    // 如果传入了新的队列，就覆盖当前队列；如果没有且队列为空，就把这首歌塞进去
    if (queue.length > 0) {
      this.playQueue = queue;
    } else if (this.playQueue.length === 0) {
      this.playQueue = [song];
    }
    
    // 发射播放脉冲
    
    // 写入历史记录
    const index = this.playHistory.findIndex(item => item.id === song.id);
    if (index !== -1) this.playHistory.splice(index, 1);
    this.playHistory.unshift(song);
    if (this.playHistory.length > 50) this.playHistory.pop();
    localStorage.setItem('echo_play_history', JSON.stringify(this.playHistory));
  },

  // 💥 新增：下一首引擎
  playNext() {
    if (this.playQueue.length === 0) return;
    if (this.playQueue.length === 1) { this.currentTime = 0; return; } // 只有一首就重播
    
    if (this.playMode === 'random') {
      let randomIndex = Math.floor(Math.random() * this.playQueue.length);
      // 防止随机到同一首
      while (this.playQueue[randomIndex].id === this.currentSong.id) {
        randomIndex = Math.floor(Math.random() * this.playQueue.length);
      }
      this.selectSong(this.playQueue[randomIndex]);
      return;
    }
    // 列表循环
    const currentIndex = this.playQueue.findIndex(s => s.id === this.currentSong?.id);
    const nextIndex = (currentIndex + 1) % this.playQueue.length;
    this.selectSong(this.playQueue[nextIndex]);
  },
  
  // 💥 新增：上一首引擎
  playPrev() {
    if (this.playQueue.length === 0) return;
    if (this.playMode === 'random') {
      this.playNext(); // 随机模式上一首也按随机算
      return;
    }
    // 列表循环
    const currentIndex = this.playQueue.findIndex(s => s.id === this.currentSong?.id);
    const prevIndex = (currentIndex - 1 + this.playQueue.length) % this.playQueue.length;
    this.selectSong(this.playQueue[prevIndex]);
  },

  isLiked(musicId) {
    return this.likedMusicList.some(item => item.id === musicId)
  }
})

// 💥 极其关键的救命修复：导出一个函数！这样前端写 useMusicStore() 才不会白屏暴毙！
export const useMusicStore = () => store
