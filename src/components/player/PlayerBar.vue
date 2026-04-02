<template>
  <footer class="player-bar" :class="{ 'is-active': musicStore.currentSong }">
    <div class="progress-slider-wrapper">
      <el-slider v-model="playPercent" :show-tooltip="false" @input="isDragging = true" @change="onSliderSeek" class="player-slider" :disabled="!musicStore.currentSong" />
    </div>
    
    <div class="controls-content" v-if="musicStore.currentSong">
      <div class="track-info">
        <img :src="musicStore.currentSong.coverUrl" class="mini-cover" crossorigin="anonymous" @click="musicStore.showLyricPanel = true" />
        <div class="meta">
          <span class="t">{{ musicStore.currentSong.title }}</span>
          <span class="a">{{ musicStore.currentSong.artist }}</span>
        </div>
        <el-icon :size="22" class="like-icon" :class="{ 'is-liked': musicStore.isLiked(musicStore.currentSong.id) }" @click="$emit('toggle-like', musicStore.currentSong)">
          <component :is="musicStore.isLiked(musicStore.currentSong.id) ? StarFilled : Star" />
        </el-icon>
      </div>
      
      <div class="play-btns">
        <div class="prev-next-btn" @click="$emit('play-prev')"></div>
        <div class="main-play-btn" :class="{'is-playing': musicStore.isPlaying}" @click="togglePlay"></div>
        <div class="prev-next-btn" @click="$emit('play-next')"></div>
      </div>

      <div class="extra-funcs">
        <span class="time-display">{{ formatTime(musicStore.currentTime) }} / {{ formatTime(musicStore.duration) }}</span>
        <el-icon :size="18" class="mode-icon" @click="togglePlayMode"><component :is="playMode === 'list' ? Refresh : RefreshLeft" /></el-icon>
        <el-popover placement="top" width="40" trigger="hover">
          <template #reference><el-icon :size="20" class="vol-icon"><Headset /></el-icon></template>
          <el-slider v-model="volume" vertical height="80px" @input="onVolumeChange" />
        </el-popover>
      </div>
    </div>
    <div class="empty-player" v-else>请在上方点击歌曲播放</div>
    
    <audio id="echo-audio-player" :src="musicStore.currentSong?.audioUrl" crossorigin="anonymous" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" @ended="onPlayEnded"></audio>
  </footer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMusicStore } from '../../store/music'
import { Headset, Refresh, RefreshLeft, Star, StarFilled } from '@element-plus/icons-vue'

const musicStore = useMusicStore()
const emit = defineEmits(['play-prev', 'play-next', 'toggle-like'])

const playMode = ref('list')
const volume = ref(70)
const playPercent = ref(0)
const isDragging = ref(false)

const togglePlay = () => {
  const audio = document.getElementById('echo-audio-player')
  if (!audio) return
  if (musicStore.isPlaying) { audio.pause() } else { audio.play() }
  musicStore.togglePlay()
}

const onLoadedMetadata = (e) => { musicStore.duration = e.target.duration }
const onSliderSeek = (val) => { 
  const audio = document.getElementById('echo-audio-player')
  if (audio) audio.currentTime = (val / 100) * musicStore.duration
  isDragging.value = false 
}
const onTimeUpdate = (e) => {
  musicStore.currentTime = e.target.currentTime
  if (!isDragging.value) playPercent.value = musicStore.duration ? (musicStore.currentTime / musicStore.duration) * 100 : 0
}
const onVolumeChange = (val) => { const audio = document.getElementById('echo-audio-player'); if (audio) audio.volume = val / 100 }
const onPlayEnded = () => { 
  if (playMode.value === 'single') { 
    const audio = document.getElementById('echo-audio-player'); audio.currentTime = 0; audio.play() 
  } else { emit('play-next') } 
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00"
  const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

watch(() => musicStore.currentSong, (newSong) => {
  if (newSong) {
    setTimeout(() => { 
      const audio = document.getElementById('echo-audio-player')
      if (audio) { audio.volume = volume.value / 100; audio.play() }
    }, 100)
  }
})

watch(() => musicStore.isPlaying, (playing) => {
  const audio = document.getElementById('echo-audio-player')
  if (audio) { playing ? audio.play() : audio.pause() }
})
</script>

<style scoped>
.player-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 90px; background: rgba(255,255,255,0.85); backdrop-filter: saturate(180%) blur(20px); border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; z-index: 100; }
.empty-player { color: #94a3b8; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.progress-slider-wrapper { position: absolute; top: -14px; left: 0; right: 0; z-index: 200; }
.player-slider :deep(.el-slider__runway) { height: 4px; background: #e4e4e7; margin: 0; }
.player-slider :deep(.el-slider__bar) { height: 4px; background-color: #0f172a; }
.player-slider :deep(.el-slider__button) { width: 12px; height: 12px; border: none; background-color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.controls-content { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
.mini-cover { width: 56px; height: 56px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); object-fit: cover; transition: 0.3s; cursor: pointer; }
.mini-cover:hover { transform: scale(1.05); }
.meta { display: flex; flex-direction: column; gap: 4px; }
.t { font-weight: 700; font-size: 14px; color: #0f172a; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 150px; }
.a { font-size: 12px; color: #64748b; font-weight: 500; }
.like-icon { cursor: pointer; color: #94a3b8; transition: 0.2s;}
.like-icon.is-liked { color: #ef4444; }
.like-icon:hover { transform: scale(1.1); }

/* 🚀 极简控制中枢 */
.play-btns { display: flex; align-items: center; gap: 35px; justify-content: center; flex: 1; }
.main-play-btn { background: transparent; width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.3s; cursor: pointer; border: 1px solid transparent;}
.main-play-btn:hover { background: #f1f5f9; border-color: #e2e8f0; transform: scale(1.1); }
.main-play-btn::before { content: ''; display: block; box-sizing: border-box; width: 0; height: 20px; border-color: transparent transparent transparent #0f172a; transition: 100ms all ease; border-style: solid; border-width: 10px 0 10px 16px; margin-left: 4px; }
.main-play-btn.is-playing::before { border-style: double; border-width: 0px 0 0px 16px; margin-left: 0; }
.prev-next-btn { position: relative; width: 24px; height: 24px; cursor: pointer; transition: 0.2s ease; opacity: 0.6; }
.prev-next-btn:hover { opacity: 1; transform: scale(1.1); }
.prev-next-btn:first-child::before, .prev-next-btn:first-child::after { content: ''; position: absolute; top: 50%; transform: translateY(-50%); }
.prev-next-btn:first-child::before { left: 10px; width: 0; height: 0; border-style: solid; border-width: 7px 10px 7px 0; border-color: transparent #0f172a transparent transparent; }
.prev-next-btn:first-child::after { left: 6px; width: 3px; height: 14px; background: #0f172a; border-radius: 1px; }
.prev-next-btn:last-child::before, .prev-next-btn:last-child::after { content: ''; position: absolute; top: 50%; transform: translateY(-50%); }
.prev-next-btn:last-child::before { right: 10px; width: 0; height: 0; border-style: solid; border-width: 7px 0 7px 10px; border-color: transparent transparent transparent #0f172a; }
.prev-next-btn:last-child::after { right: 6px; width: 3px; height: 14px; background: #0f172a; border-radius: 1px; }

.extra-funcs { display: flex; align-items: center; gap: 20px; width: 30%; justify-content: flex-end; }
.time-display { font-size: 13px; font-family: monospace; color: #64748b; font-weight: 600; }
.vol-icon, .mode-icon { cursor: pointer; color: #64748b; transition: 0.2s;}
.vol-icon:hover, .mode-icon:hover { color: #0f172a; }
</style>