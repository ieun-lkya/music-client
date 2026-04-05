<template>
  <footer class="player-bar" :class="{ 'is-active': musicStore.currentSong }">
    <div class="progress-slider-wrapper">
      <el-slider v-model="playPercent" :show-tooltip="false" @input="isDragging = true" @change="onSliderSeek" class="player-slider" :disabled="!musicStore.currentSong" />
    </div>
    
    <div class="controls-content" v-if="musicStore.currentSong">
      <div class="track-info">
        <img :src="musicStore.currentSong.coverUrl || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="mini-cover" crossorigin="anonymous" @click="musicStore.showLyricPanel = true" />
        <div class="meta">
          <span class="t">{{ musicStore.currentSong.title }}</span>
          <span class="a">{{ musicStore.currentSong.artist }}</span>
        </div>
        <el-icon :size="22" class="like-icon" :class="{ 'is-liked': musicStore.isLiked(musicStore.currentSong.id) }" @click="$emit('toggle-like', musicStore.currentSong)">
          <component :is="musicStore.isLiked(musicStore.currentSong.id) ? StarFilled : Star" />
        </el-icon>
      </div>
      
      <div class="play-btns">
        <div class="prev-next-btn" @click="musicStore.playPrev()"></div>
        <div class="main-play-btn" :class="{'is-playing': musicStore.isPlaying}" @click="togglePlay"></div>
        <div class="prev-next-btn" @click="musicStore.playNext()"></div>
      </div>

      <div class="extra-funcs">
        <span class="time-display">{{ formatTime(musicStore.currentTime) }} / {{ formatTime(musicStore.duration) }}</span>
        <el-icon :size="18" class="mode-icon" @click="togglePlayMode">
          <component :is="musicStore.playMode === 'loop' ? RefreshLeft : (musicStore.playMode === 'random' ? Connection : Refresh)" />
        </el-icon>
        
        <el-popover placement="top-end" :width="430" trigger="click">
          <template #reference><el-icon :size="18" class="eq-icon"><Operation /></el-icon></template>
          <div class="eq-panel">
            <div style="margin-bottom: 15px; font-weight: 800; color: #0f172a;">🎛️ Echo 极客调音台</div>
            <div class="eq-presets">
              <el-tag size="small" effect="dark" color="#94a3b8" @click="setEQ('flat')" style="cursor:pointer; border:none;">原声 (Flat)</el-tag>
              <el-tag size="small" effect="dark" color="#ef4444" @click="setEQ('bass')" style="cursor:pointer; border:none;">动次打次 (Bass)</el-tag>
              <el-tag size="small" effect="dark" color="#3b82f6" @click="setEQ('vocal')" style="cursor:pointer; border:none;">清澈人声 (Vocal)</el-tag>
              <el-tag size="small" effect="dark" color="#10b981" @click="setEQ('live')" style="cursor:pointer; border:none;">Live 现场</el-tag>
            </div>
            <div class="eq-sliders">
              <div class="eq-band" v-for="(gain, index) in eqGains" :key="index">
                <el-slider v-model="eqGains[index]" vertical height="120px" :min="-12" :max="12" :step="0.5" @input="updateEQ(index)" :show-tooltip="false" />
                <span class="eq-freq">{{ eqLabels[index] }}</span>
              </div>
            </div>
          </div>
        </el-popover>

        <el-popover placement="top" width="40" trigger="hover">
          <template #reference><el-icon :size="20" class="vol-icon"><component :is="volume > 0 ? Headset : Mute" @click="toggleMute" /></el-icon></template>
          <el-slider v-model="volume" vertical height="80px" @input="onVolumeChange" />
        </el-popover>
        
        <el-icon :size="18" class="queue-icon" @click="queueDrawerVisible = true"><Expand /></el-icon>
      </div>
    </div>
  </footer>

  <el-drawer v-model="queueDrawerVisible" :with-header="false" size="380px" append-to-body class="queue-drawer">
    <div class="queue-drawer-content">
      <div class="q-header">
        <h3>当前播放队列 <span class="q-count">({{ musicStore.playQueue?.length || 0 }})</span></h3>
        <el-button type="info" link @click="clearQueue">清空列表</el-button>
      </div>
      <div class="q-list">
        <div v-if="!musicStore.playQueue || musicStore.playQueue.length === 0" class="q-empty">
          队列空空如也，快去大厅添加音乐吧~
        </div>
        <div v-for="(item, index) in musicStore.playQueue" :key="index"
             class="q-item" :class="{'is-active': musicStore.currentSong?.id === item.id}"
             @click="playQueueItem(item)">
          <div class="q-item-info">
            <el-icon v-if="musicStore.currentSong?.id === item.id" class="q-playing-icon"><VideoPlay /></el-icon>
            <span class="q-title">{{ item.title }}</span>
            <span class="q-artist">- {{ item.artist }}</span>
          </div>
          <el-icon class="q-del" @click.stop="removeFromQueue(index)"><Close /></el-icon>
        </div>
      </div>
    </div>
  </el-drawer>

  <!-- 💥 把 Audio Player 放到最后 -->
  <audio 
    id="echo-audio-player" 
    :src="musicStore.currentSong?.audioUrl"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="handleAudioEnded"
    @play="onAudioPlay"
    @pause="musicStore.isPlaying = false"
    @error="onAudioError"
    ref="audioRef"
  ></audio>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { Headset, Mute, Refresh, RefreshLeft, Star, StarFilled, Operation, VideoPause, VideoPlay, Connection, Expand, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useMusicStore } from '../../store/music'
import { recordPlayAPI } from '../../api/user'

const musicStore = useMusicStore()
const emit = defineEmits(['play-prev', 'play-next', 'toggle-like'])

const volume = ref(70)
const playPercent = ref(0)
const isDragging = ref(false)

// 🚀 播放队列抽屉状态与引擎
const queueDrawerVisible = ref(false)

const playQueueItem = (item) => {
  musicStore.selectSong(item, musicStore.playQueue)
}

const removeFromQueue = (index) => {
  const removed = musicStore.playQueue.splice(index, 1)[0]
  if (musicStore.currentSong?.id === removed.id) {
    if (musicStore.playQueue.length > 0) {
       const nextIndex = index >= musicStore.playQueue.length ? 0 : index
       musicStore.selectSong(musicStore.playQueue[nextIndex], musicStore.playQueue)
    } else {
       musicStore.currentSong = null
       musicStore.isPlaying = false
       const audio = document.getElementById('echo-audio-player')
       if(audio) audio.pause()
    }
  }
}

const clearQueue = () => {
  musicStore.playQueue = []
  musicStore.currentSong = null
  musicStore.isPlaying = false
  queueDrawerVisible.value = false
  const audio = document.getElementById('echo-audio-player')
  if(audio) audio.pause()
}

// 🚀 迷你歌词悬浮舱状态与引擎
const miniLyrics = ref([])
const currentMiniLyric = ref('🎶 享受纯粹的音乐时刻...')

const loadMiniLyrics = async (song) => {
  miniLyrics.value = []
  currentMiniLyric.value = '🎶 享受纯粹的音乐时刻...'
  if (!song || !song.lyricUrl) return
  try {
    const res = await fetch(encodeURI(song.lyricUrl), { mode: 'cors' })
    if (!res.ok) return
    const text = await res.text()
    const lines = text.split('\n')
    const timeReg = /\[(\d{1,}):(\d{1,2})(?:[\.:](\d{1,3}))?\]/
    
    const timeMap = new Map()
    for (let line of lines) {
      const match = line.match(timeReg)
      if (match) {
        const m = parseInt(match[1]); const s = parseInt(match[2]);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0')) / 1000 : 0;
        const time = m * 60 + s + ms;
        const lrcText = line.replace(/\[.*?\]/g, '').trim();
        if (lrcText) {
          if (timeMap.has(time)) {
            let existingText = timeMap.get(time)
            const hasChinese = (text) => /[\u4e00-\u9fa5]/.test(text)
            if (hasChinese(existingText) && !hasChinese(lrcText)) {
              timeMap.set(time, lrcText + '\n' + existingText)
            } else if (!hasChinese(existingText) && hasChinese(lrcText)) {
              timeMap.set(time, existingText + '\n' + lrcText)
            } else {
              timeMap.set(time, existingText + '\n' + lrcText)
            }
          } else {
            timeMap.set(time, lrcText)
          }
        }
      }
    }
    const result = Array.from(timeMap.entries()).map(([time, text]) => ({ time, text }))
    result.sort((a, b) => a.time - b.time)
    miniLyrics.value = result
  } catch (e) {
    console.warn('Lyrics load failed', e)
  }
}

const updateMiniLyric = (currentTime) => {
  if (miniLyrics.value.length === 0) return
  let currentText = '🎶 享受纯粹的音乐时刻...'
  for (let i = 0; i < miniLyrics.value.length; i++) {
    if (currentTime >= miniLyrics.value[i].time - 0.2) {
      currentText = miniLyrics.value[i].text
    } else {
      break
    }
  }
  if (currentMiniLyric.value !== currentText) currentMiniLyric.value = currentText || '🎶 ...'
}

watch(() => musicStore.currentTime, (newTime) => {
  if (musicStore.currentSong && miniLyrics.value.length > 0) updateMiniLyric(newTime)
})

// 💥 极简控制：直接指挥音频原件
const togglePlay = () => { 
  const audio = document.getElementById('echo-audio-player');
  if (!audio || !musicStore.currentSong) return;
  if (audio.paused) {
    audio.play().catch(()=>{});
  } else {
    audio.pause();
  }
}

const togglePlayMode = () => { 
  const modes = ['list', 'random', 'loop'];
  const currentIndex = modes.indexOf(musicStore.playMode);
  musicStore.playMode = modes[(currentIndex + 1) % modes.length];
}

const onLoadedMetadata = (e) => { musicStore.duration = e.target.duration }
const onSliderSeek = (val) => { const audio = document.getElementById('echo-audio-player'); if (audio) audio.currentTime = (val / 100) * musicStore.duration; isDragging.value = false }
const onTimeUpdate = (e) => { 
  musicStore.currentTime = e.target.currentTime; 
  if (!isDragging.value) playPercent.value = musicStore.duration ? (musicStore.currentTime / musicStore.duration) * 100 : 0;
  updateMiniLyric(musicStore.currentTime);
}
const onVolumeChange = (val) => { const audio = document.getElementById('echo-audio-player'); if (audio) audio.volume = val / 100 }

const toggleMute = () => {
  if (volume.value > 0) {
    localStorage.setItem('preMuteVolume', volume.value); 
    volume.value = 0; 
  } else {
    const preMuteVolume = localStorage.getItem('preMuteVolume');
    volume.value = preMuteVolume ? parseInt(preMuteVolume) : 70; 
  }
  onVolumeChange(volume.value);
}

const handleAudioEnded = () => {
  if (musicStore.playMode === 'loop') {
    const audio = document.getElementById('echo-audio-player');
    if(audio) {
      audio.currentTime = 0;
      audio.play().catch(()=>{});
    }
  } else {
    musicStore.playNext();
  }
}

// 🚀 原生的播放起飞事件
const onAudioPlay = () => {
  musicStore.isPlaying = true;
  try {
    initAudioEngine(); 
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {
    console.warn('调音台挂载跳过:', e);
  }
}

// 🚀 核心容错：极其优雅的音源丢失降级处理 (消灭了所有重复，只留这一个！)
const onAudioError = () => {
  const audio = document.getElementById('echo-audio-player')
  if (audio && audio.getAttribute('src')) {
    musicStore.isPlaying = false
    ElMessage.error(`😭 音源加载失败！可能是云端文件被删或网络限制。`)
    setTimeout(() => { musicStore.playNext() }, 2000)
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00"
  const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 🚀 千万级 Web Audio 极客调音台引擎
const eqLabels = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];
const eqFreqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const eqGains = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
let audioCtx = null;
let filters = [];

const initAudioEngine = () => {
  if (audioCtx) return; 
  const audioEl = document.getElementById('echo-audio-player');
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audioEl);

  let prevNode = source;
  eqFreqs.forEach((freq, i) => {
    const filter = audioCtx.createBiquadFilter();
    filter.type = i === 0 ? 'lowshelf' : (i === 9 ? 'highshelf' : 'peaking');
    filter.frequency.value = freq;
    filter.Q.value = 1;
    filter.gain.value = eqGains.value[i];
    filters.push(filter);
    prevNode.connect(filter);
    prevNode = filter;
  });

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  prevNode.connect(analyser);
  analyser.connect(audioCtx.destination); 

  musicStore.audioAnalyser = analyser; 
}

const updateEQ = (index) => { if(filters[index]) filters[index].gain.value = eqGains.value[index]; }
const setEQ = (type) => {
  let target = [0,0,0,0,0,0,0,0,0,0];
  if(type === 'bass') target = [6, 5, 4, 1, 0, -1, 0, 1, 2, 3]; 
  if(type === 'vocal') target = [-2, -1, 0, 2, 4, 5, 4, 2, 0, -1]; 
  if(type === 'live') target = [4, 3, 1, -1, 0, 2, 4, 5, 4, 3]; 
  eqGains.value = target;
  target.forEach((_, i) => updateEQ(i));
}

// 💥 唯一的切歌引擎：只监听歌曲变化，消灭重复监听造成的死锁冲突！
watch(() => musicStore.currentSong, async (newSong) => {
  if (newSong) {
    if (musicStore.currentUser) {
      recordPlayAPI(musicStore.currentUser.id, newSong.id).catch(()=>{})
    }
    musicStore.currentTime = 0; 
    playPercent.value = 0;
    loadMiniLyrics(newSong);
    
    await nextTick(); 
    const audio = document.getElementById('echo-audio-player');
    if (audio) {
      audio.volume = volume.value / 100;
      audio.play().catch(e => {
        console.warn('浏览器自动播放拦截:', e);
        musicStore.isPlaying = false; 
      });
    }
  }
})
</script>

<style scoped>
/* 样式保留与上一版本一致 */
.player-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 90px; background: rgba(255,255,255,0.85); backdrop-filter: saturate(180%) blur(20px); border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; z-index: 100; box-sizing: border-box; }
.empty-player { color: #94a3b8; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.progress-slider-wrapper { position: absolute; top: -14px; left: 0; right: 0; z-index: 200; }
.player-slider :deep(.el-slider__runway) { height: 4px; background: #e4e4e7; margin: 0; }
.player-slider :deep(.el-slider__bar) { height: 4px; background-color: #0f172a; }
.player-slider :deep(.el-slider__button) { width: 12px; height: 12px; border: none; background-color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.controls-content { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; box-sizing: border-box; }
.track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
.mini-cover { width: 56px; height: 56px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); object-fit: cover; transition: 0.3s; cursor: pointer; }
.mini-cover:hover { transform: scale(1.05); }
.meta { display: flex; flex-direction: column; gap: 4px; }
.t { font-weight: 700; font-size: 14px; color: #0f172a; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 150px; }
.a { font-size: 12px; color: #64748b; font-weight: 500; }
.like-icon { cursor: pointer; color: #94a3b8; transition: 0.2s;}
.like-icon.is-liked { color: #ef4444; }
.like-icon:hover { transform: scale(1.1); }
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

/* 🚀 EQ 控制面板极其优雅的样式 */
.eq-icon { cursor: pointer; color: #64748b; transition: 0.2s;}
.eq-icon:hover { color: #0f172a; }

/* 🚀 核心修复 2：注入 box-sizing: border-box，强行约束盒子边界！ */
.eq-panel { 
  padding: 10px; 
  box-sizing: border-box; 
  width: 100%;
}
.eq-sliders { 
  display: flex; 
  justify-content: space-between; 
  padding: 0 5px; 
  box-sizing: border-box;
}
.eq-presets { display: flex; gap: 8px; margin-bottom: 25px; justify-content: center; }
.eq-band { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.eq-band :deep(.el-slider__runway) { background: #e2e8f0; }
.eq-band :deep(.el-slider__bar) { background: linear-gradient(to top, #3b82f6, #8b5cf6); }
.eq-band :deep(.el-slider__button) { border-color: #3b82f6; }
.eq-freq { font-size: 11px; color: #64748b; font-family: monospace; font-weight: bold;}

/* 🚀 迷你歌词悬浮舱的 Apple 级玻璃拟物化样式 (双语分行版) */
.mini-lyric-container {
  position: absolute; 
  /* 💥 极其关键：废弃 top，改用 bottom: 100%！让它不论几行都只能自动"向上生长"，绝对不压到底部栏！ */
  bottom: 100%; 
  left: 50%; transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.75); backdrop-filter: saturate(180%) blur(20px);
  padding: 8px 30px; border-radius: 16px 16px 0 0; 
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.03); 
  border: 1px solid #f1f5f9; border-bottom: none; pointer-events: none; 
  text-align: center; z-index: -1; 
  max-width: 60%;
}

.mini-lyric-wrapper {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; /* 两行歌词的呼吸间距 */
  animation: lyric-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 原文：大字号、加粗、深色 */
.lyric-primary {
  font-size: 14px; color: #1e293b; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}

/* 翻译：小字号、常规、次级灰色，极其高级！ */
.lyric-secondary {
  font-size: 12px; color: #64748b; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}

@keyframes lyric-pop {
  0% { opacity: 0; transform: translateY(8px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* 🚀 播放列表图标与抽屉玻璃态样式 */
.queue-icon { cursor: pointer; color: #64748b; transition: 0.2s; margin-left: 10px; }
.queue-icon:hover { color: #0f172a; transform: scale(1.1); }

:deep(.queue-drawer) { background: rgba(255,255,255,0.85) !important; backdrop-filter: saturate(180%) blur(25px) !important; }
.queue-drawer-content { display: flex; flex-direction: column; height: 100%; padding: 20px 25px; box-sizing: border-box;}
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 15px; }
.q-header h3 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 800; display: flex; align-items: baseline; gap: 8px;}
.q-count { font-size: 13px; color: #64748b; font-weight: 600; }
.q-list { flex: 1; overflow-y: auto; padding-right: 5px; }
.q-list::-webkit-scrollbar { width: 6px; }
.q-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.q-empty { text-align: center; color: #94a3b8; margin-top: 50px; font-size: 14px; font-weight: bold; }
.q-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 15px; border-radius: 12px; cursor: pointer; transition: 0.2s; margin-bottom: 8px; border: 1px solid transparent; }
.q-item:hover { background: #f8fafc; border-color: #e2e8f0; }
.q-item.is-active { background: linear-gradient(135deg, #eff6ff, #e0e7ff); border-color: #bfdbfe; }
.q-item-info { display: flex; align-items: center; gap: 10px; overflow: hidden; }
.q-playing-icon { color: #3b82f6; animation: pulse 1.5s infinite; }
.q-title { font-size: 14px; color: #1e293b; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.q-artist { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; font-weight: 500;}
.q-item.is-active .q-title { color: #3b82f6; }
.q-del { color: #94a3b8; font-size: 16px; opacity: 0; transition: 0.2s; }
.q-item:hover .q-del { opacity: 1; }
.q-del:hover { color: #ef4444; transform: scale(1.2); }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
</style>