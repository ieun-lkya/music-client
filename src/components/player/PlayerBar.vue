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
        <div class="prev-next-btn" @click="$emit('play-prev')"></div>
        <div class="main-play-btn" :class="{'is-playing': musicStore.isPlaying}" @click="togglePlay"></div>
        <div class="prev-next-btn" @click="$emit('play-next')"></div>
      </div>

      <div class="extra-funcs">
        <span class="time-display">{{ formatTime(musicStore.currentTime) }} / {{ formatTime(musicStore.duration) }}</span>
        <el-icon :size="18" class="mode-icon" @click="togglePlayMode"><component :is="playMode === 'list' ? Refresh : RefreshLeft" /></el-icon>
        
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
          <template #reference><el-icon :size="20" class="vol-icon"><Headset /></el-icon></template>
          <el-slider v-model="volume" vertical height="80px" @input="onVolumeChange" />
        </el-popover>
      </div>
    </div>
    <div class="mini-lyric-container" v-if="musicStore.currentSong && !musicStore.showLyricPanel">
      <div class="mini-lyric-wrapper" :key="currentMiniLyric">
        <div v-for="(line, index) in currentMiniLyric.split('\n')" :key="index" :class="index === 0 ? 'lyric-primary' : 'lyric-secondary'">
          {{ line }}
        </div>
      </div>
    </div>
    <div class="empty-player" v-else>请在上方点击歌曲播放</div>
    
    <audio id="echo-audio-player" :src="musicStore.currentSong?.audioUrl" crossorigin="anonymous" 
           @timeupdate="onTimeUpdate" 
           @loadedmetadata="onLoadedMetadata" 
           @ended="onPlayEnded"
           @play="musicStore.isPlaying = true"
           @pause="musicStore.isPlaying = false"
           @error="onAudioError">
    </audio>
  </footer>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '../../store/music'
import { Headset, Refresh, RefreshLeft, Star, StarFilled, Operation } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const musicStore = useMusicStore()
const emit = defineEmits(['play-prev', 'play-next', 'toggle-like'])

const playMode = ref('list')
const volume = ref(70)
const playPercent = ref(0)
const isDragging = ref(false)

// 🚀 迷你歌词悬浮舱状态与引擎
const miniLyrics = ref([])
const currentMiniLyric = ref('🎶 享受纯粹的音乐时刻...')

// 🚀 极其智能的双语聚合歌词解析器
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
    
    // 💥 核心修复：使用 Map 来聚合相同时间戳的双语歌词！
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
            
            // 💥 核心黑魔法：智能语种探测雷达！
            const hasChinese = (text) => /[\u4e00-\u9fa5]/.test(text)
            
            if (hasChinese(existingText) && !hasChinese(lrcText)) {
              // 现有的是中文翻译，新来的是外文原词 -> 强行把原词顶到前面！
              timeMap.set(time, lrcText + '\n' + existingText)
            } else if (!hasChinese(existingText) && hasChinese(lrcText)) {
              // 现有的是原词，新来的是中文翻译 -> 乖乖把翻译排到后面！
              timeMap.set(time, existingText + '\n' + lrcText)
            } else {
              // 兜底（如果是纯中文歌，或者两句都有中文）：按文件原始顺序
              timeMap.set(time, existingText + '\n' + lrcText)
            }
          } else {
            timeMap.set(time, lrcText)
          }
        }
      }
    }
    
    // 把 Map 转换为数组并排序
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

// 监听时间更新以同步迷你歌词
watch(() => musicStore.currentTime, (newTime) => {
  if (musicStore.currentSong && miniLyrics.value.length > 0) {
    updateMiniLyric(newTime)
  }
})

const togglePlay = () => { if(!musicStore.currentSong) return; musicStore.togglePlay() }
const togglePlayMode = () => { playMode.value = playMode.value === 'list' ? 'single' : 'list' }
const onLoadedMetadata = (e) => { musicStore.duration = e.target.duration }
const onSliderSeek = (val) => { const audio = document.getElementById('echo-audio-player'); if (audio) audio.currentTime = (val / 100) * musicStore.duration; isDragging.value = false }
const onTimeUpdate = (e) => { 
  musicStore.currentTime = e.target.currentTime; 
  if (!isDragging.value) playPercent.value = musicStore.duration ? (musicStore.currentTime / musicStore.duration) * 100 : 0;
  
  // 💥 驱动引擎：时间每走一毫秒，歌词探针就去核对一次！
  updateMiniLyric(musicStore.currentTime);
}
const onVolumeChange = (val) => { const audio = document.getElementById('echo-audio-player'); if (audio) audio.volume = val / 100 }
const onPlayEnded = () => { if (playMode.value === 'single') { const audio = document.getElementById('echo-audio-player'); audio.currentTime = 0; audio.play() } else { emit('play-next') } }
  
// 🚀 核心容错：极其优雅的音源丢失降级处理
const onAudioError = () => {
  const audio = document.getElementById('echo-audio-player')
  // 只有当真的有歌曲链接（排除了初始空状态），并且加载失败时才触发
  if (audio && audio.getAttribute('src')) {
    musicStore.isPlaying = false // 强行终止播放状态，让播放按钮切回暂停图标
    ElMessage.error(`😭 抱歉，这首歌的云端音源迷路了或已被删除！`)
    
    // 如果你在放歌单，它甚至还能极其智能地帮你自动跳过坏歌，播下一首！（可选）
    setTimeout(() => { emit('play-next') }, 2000)
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00"
  const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 🚀 迷你歌词悬浮舱状态与引擎 (已移除)

// 🚀 特性 B：千万级 Web Audio 极客调音台引擎
const eqLabels = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];
const eqFreqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const eqGains = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
let audioCtx = null;
let filters = [];

const initAudioEngine = () => {
  if (audioCtx) return; // 绝对防御：一生只初始化一次
  const audioEl = document.getElementById('echo-audio-player');
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audioEl);

  let prevNode = source;
  // 生成 10 个串联的双二阶滤波器 (BiquadFilterNode)
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
  analyser.connect(audioCtx.destination); // 最终输出到扬声器

  musicStore.audioAnalyser = analyser; // 把分析器共享给 Vuex，拯救歌词面板！
}

const updateEQ = (index) => { if(filters[index]) filters[index].gain.value = eqGains.value[index]; }
const setEQ = (type) => {
  let target = [0,0,0,0,0,0,0,0,0,0];
  if(type === 'bass') target = [6, 5, 4, 1, 0, -1, 0, 1, 2, 3]; // 低音增强，中频削弱
  if(type === 'vocal') target = [-2, -1, 0, 2, 4, 5, 4, 2, 0, -1]; // 中高频人声增强
  if(type === 'live') target = [4, 3, 1, -1, 0, 2, 4, 5, 4, 3]; // 两头翘，模拟空间感
  eqGains.value = target;
  target.forEach((_, i) => updateEQ(i));
}

// --- 底层核心逻辑修改 ---
// 🚀 核心大修复：将音频上下文的挂载逻辑，牢牢绑死在每一次切歌的瞬间！
watch(() => musicStore.currentSong, async (newSong) => {
  if (newSong) {
    musicStore.currentTime = 0; playPercent.value = 0
    
    // 💥 切歌点火：拉取并解析这首歌的迷你歌词！
    loadMiniLyrics(newSong); 

    await nextTick()
    const audio = document.getElementById('echo-audio-player')
    if (audio) {
      audio.currentTime = 0; audio.volume = volume.value / 100
      
      // 💥 致命修复：任何场景下，只要准备播放，必须先强制点火引擎！
      initAudioEngine();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

      audio.play().then(() => { musicStore.isPlaying = true }).catch(e => { musicStore.isPlaying = false })
    }
  }
})

watch(() => musicStore.isPlaying, async (playing) => {
  await nextTick() 
  const audio = document.getElementById('echo-audio-player')
  if (audio && audio.getAttribute('src')) { 
    if (playing && audio.paused) {
      // 💥 致命修复：底部的播放/暂停键也加上双保险！
      initAudioEngine();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      
      audio.play().catch(() => { musicStore.isPlaying = false })
    }
    else if (!playing && !audio.paused) { audio.pause() }
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
</style>