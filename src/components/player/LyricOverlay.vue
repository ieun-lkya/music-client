<template>
  <transition name="slide-up">
    <div class="lyric-overlay" v-if="musicStore.showLyricPanel" :style="{ backgroundImage: `url(${musicStore.currentSong?.coverUrl})` }">
      <div class="lyric-blur-bg"></div>
      <canvas ref="spectrumCanvasRef" class="spectrum-canvas"></canvas>

      <div class="lyric-top-actions">
        <el-button round class="glass-btn" @click="commentDrawerVisible = true">
          <el-icon style="margin-right: 5px;"><ChatDotRound /></el-icon> 999+ 云村热评
        </el-button>
        <el-button circle class="glass-btn" @click="musicStore.showLyricPanel = false">
          <el-icon :size="20"><ArrowDownBold /></el-icon>
        </el-button>
      </div>

      <div class="lyric-content-wrapper">
        <div class="record-side">
          <div class="record-wrapper" :class="{ 'is-paused': !musicStore.isPlaying }">
            <img :src="musicStore.currentSong?.coverUrl" class="record-cover" crossorigin="anonymous" />
          </div>
        </div>
        <div class="lyric-side">
          <h2 class="lyric-song-title">{{ musicStore.currentSong?.title }}</h2>
          <p class="lyric-song-artist">{{ musicStore.currentSong?.artist }}</p>
          <div class="lyric-scroll-box" ref="lyricBoxRef" @wheel="handleLyricScroll" @touchmove="handleLyricScroll">
            <div class="lyric-inner">
              <p v-for="(line, index) in parsedLyrics" :key="index" class="lyric-line" :class="{ 'active': currentLyricIndex === index }" @click="seekToLyric(line.time)">{{ line.text }}</p>
              <p v-if="parsedLyrics.length === 0" class="lyric-line active"> {{ isLoadingLyric ? '加载中...' : '暂无歌词' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <el-drawer v-model="commentDrawerVisible" title="🎵 云村热评" direction="rtl" size="420px" class="light-comment-drawer" :with-header="false">
    <div class="drawer-header">
      <h3>{{ musicStore.currentSong?.title }} - 热评</h3>
      <el-icon class="drawer-close" @click="commentDrawerVisible = false"><Close /></el-icon>
    </div>
    
    <div class="comments-list">
      <div class="comment-item" v-for="(cmt, idx) in currentComments" :key="idx">
        <el-avatar :size="36" :src="cmt.avatar" />
        <div class="comment-body">
          <div class="comment-user">
            <span class="name">{{ cmt.username }}</span>
            <span class="likes" :class="{'is-liked': cmt.isLiked}" @click="handleLikeComment(cmt)">
               {{ cmt.likes }} <el-icon><component :is="cmt.isLiked ? StarFilled : Star" /></el-icon>
            </span>
          </div>
          <div class="comment-text">{{ cmt.content }}</div>
          <div class="comment-time">{{ cmt.createTime }}</div>
        </div>
      </div>
      <el-empty v-if="currentComments.length === 0" description="还没有人评论，快来抢沙发~" />
    </div>

    <div class="comment-input-area">
      <el-tag v-if="replyTarget" closable @close="replyTarget = null" class="reply-tag" effect="dark" round>回复 @{{ replyTarget.username }}</el-tag>
      
      <el-input v-model="newComment" :placeholder="replyTarget ? '写下你的回复...' : '听懂这首歌的人，一定也有故事吧...'" maxlength="100" @keyup.enter="submitComment" />
      <el-button type="primary" circle @click="submitComment" :disabled="!newComment.trim()"><el-icon><Position /></el-icon></el-button>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useMusicStore } from '../../store/music'
import axios from 'axios'
import { ChatDotRound, ArrowDownBold, Close, Star, StarFilled, Position } from '@element-plus/icons-vue'
import { getCommentsAPI, addCommentAPI, likeCommentAPI } from '../../api/music'
import { ElMessage } from 'element-plus'

const musicStore = useMusicStore()

// --- 歌词处理逻辑 ---
const parsedLyrics = ref([])        
const currentLyricIndex = ref(0)    
const isLoadingLyric = ref(false)   
const lyricBoxRef = ref(null)       
const isUserScrolling = ref(false)
let scrollTimeout = null  

const parseLrc = (lrcStr) => {
  const lines = lrcStr.split('\n'); const result = []; const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/
  for (let line of lines) {
    const match = line.match(timeReg)
    if (match) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]) + (match[3].length === 2 ? parseInt(match[3]) * 10 : parseInt(match[3])) / 1000
      const text = line.replace(timeReg, '').trim()
      if (text) result.push({ time, text })
    }
  }
  return result
}

const loadLyrics = async (song) => {
  parsedLyrics.value = []; currentLyricIndex.value = 0; isLoadingLyric.value = true
  if (lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: 0 })
  try {
    if (!song.lyricUrl) return
    const response = await axios.get(song.lyricUrl)
    parsedLyrics.value = parseLrc(response.data)
  } catch (e) {} finally { isLoadingLyric.value = false }
}

const handleLyricScroll = () => {
  isUserScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => { 
    isUserScrolling.value = false
    if (currentLyricIndex.value !== -1 && lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: currentLyricIndex.value * 45, behavior: 'smooth' }) 
  }, 3000) 
}

const seekToLyric = (time) => { 
  const audio = document.getElementById('echo-audio-player')
  if (audio) { 
    audio.currentTime = time; audio.play(); musicStore.isPlaying = true; 
    isUserScrolling.value = false; if (scrollTimeout) clearTimeout(scrollTimeout) 
  } 
}

watch(() => musicStore.currentTime, (time) => {
  if (parsedLyrics.value.length > 0) {
    let activeIndex = parsedLyrics.value.findIndex((line, index) => { 
      const nextLine = parsedLyrics.value[index + 1]; 
      return time >= line.time && (!nextLine || time < nextLine.time) 
    })
    if (activeIndex !== -1 && activeIndex !== currentLyricIndex.value) {
      currentLyricIndex.value = activeIndex
      if (!isUserScrolling.value && lyricBoxRef.value && musicStore.showLyricPanel) {
        lyricBoxRef.value.scrollTo({ top: activeIndex * 45, behavior: 'smooth' })
      }
    }
  }
})

// --- 频谱分析引擎 ---
const spectrumCanvasRef = ref(null)
let audioCtx = null, analyser = null, animationFrameId = null

const initAudioVisualizer = () => {
  const audioEl = document.getElementById('echo-audio-player')
  if (!audioEl || audioCtx) return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256 
    const audioSource = audioCtx.createMediaElementSource(audioEl)
    audioSource.connect(analyser)
    analyser.connect(audioCtx.destination)
    drawVisualizer()
  } catch (e) {}
}

const drawVisualizer = () => {
  if (!spectrumCanvasRef.value || !analyser) return
  animationFrameId = requestAnimationFrame(drawVisualizer)
  const canvas = spectrumCanvasRef.value; const ctx = canvas.getContext('2d')
  canvas.width = canvas.clientWidth * window.devicePixelRatio
  canvas.height = canvas.clientHeight * window.devicePixelRatio
  const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const barWidth = (canvas.width / bufferLength) * 2.5; let barHeight; let x = 0
  for (let i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i] * 1.5 
    const r = 59 + (barHeight / 2); const g = 130 + (barHeight / 2); const b = 246
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`
    ctx.beginPath(); ctx.roundRect(x, canvas.height - barHeight, barWidth - 4, barHeight, [10, 10, 0, 0]); ctx.fill()
    x += barWidth
  }
}

// --- 云村热评引擎 ---
const commentDrawerVisible = ref(false)
const newComment = ref('')
const currentComments = ref([])

// 锁定你要回复的人
const replyTarget = ref(null)
const setReply = (cmt) => { replyTarget.value = cmt }

const fetchComments = async (musicId) => {
  try {
    const data = await getCommentsAPI(musicId) || []
    // 处理评论数据，将子评论挂到对应的父评论下
    const commentsMap = {}
    const rootComments = []
    
    // 先建立映射关系
    data.forEach(comment => {
      commentsMap[comment.id] = { ...comment, replies: [] }
    })
    
    // 再组织层级结构
    data.forEach(comment => {
      if (comment.parentId) {
        const parent = commentsMap[comment.parentId]
        if (parent) {
          parent.replies.push(comment)
        }
      } else {
        rootComments.push(commentsMap[comment.id])
      }
    })
    
    currentComments.value = rootComments
  } catch (error) {
    currentComments.value = []
  }
}

const submitComment = async () => {
  if (!newComment.value.trim() || !musicStore.currentUser || !musicStore.currentSong) return
  try {
    // 扁平化：不管你回复的是根评论还是子评论，全都挂在根评论的肚子里
    const pId = replyTarget.value ? (replyTarget.value.parentId || replyTarget.value.id) : null;
    
    await addCommentAPI({ 
      musicId: musicStore.currentSong.id, 
      userId: musicStore.currentUser.id, 
      content: newComment.value.trim(),
      parentId: pId
    })
    ElMessage.success('🎉 你的故事已成功留在云村！'); 
    newComment.value = ''; replyTarget.value = null; // 清空输入框和目标
    await fetchComments(musicStore.currentSong.id) // 刷新列表，树形结构立刻展现！
  } catch (e) {}
}

const handleLikeComment = async (cmt) => {
  if (!musicStore.currentUser) return ElMessage.warning('请先登录再给神评点赞哦！')
  if (cmt.isLiked) return 
  cmt.likes++; cmt.isLiked = true 
  try { await likeCommentAPI(cmt.id) } catch (e) { cmt.likes--; cmt.isLiked = false }
}

watch(() => musicStore.currentSong, (newSong) => {
  if (newSong) {
    loadLyrics(newSong)
    fetchComments(newSong.id)
    setTimeout(() => { initAudioVisualizer() }, 100)
  }
})

watch(() => musicStore.showLyricPanel, async (isOpen) => {
  if (isOpen) { await nextTick(); setTimeout(() => { if (lyricBoxRef.value && currentLyricIndex.value !== -1) lyricBoxRef.value.scrollTo({ top: currentLyricIndex.value * 45 }) }, 50) }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (audioCtx) audioCtx.close()
})
</script>

<style scoped>
.lyric-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: calc(100vh - 90px); z-index: 90; overflow: hidden; background-size: 400% 400%; background-position: center; animation: gradientMove 20s ease infinite; }
.lyric-blur-bg { position: absolute; inset: -20%; background: inherit; filter: blur(100px) saturate(150%); z-index: 0; animation: pulseGlow 8s alternate infinite; opacity: 0.85; }
.lyric-content-wrapper { position: relative; z-index: 2; display: flex; height: 100%; align-items: center; justify-content: center; gap: 120px; padding: 0 50px; background: rgba(0,0,0,0.3); }
@keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes pulseGlow { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }

.spectrum-canvas { position: absolute; bottom: 0; left: 0; width: 100%; height: 250px; pointer-events: none; z-index: 1; opacity: 0.8; }
.lyric-top-actions { position: absolute; top: 30px; right: 40px; z-index: 10; display: flex; gap: 15px; }
.glass-btn { background: rgba(255,255,255,0.1) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.2) !important; backdrop-filter: blur(10px); font-weight: bold; }
.glass-btn:hover { background: rgba(255,255,255,0.2) !important; transform: scale(1.05); }

.record-side { width: 350px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; }

.record-wrapper { width: 340px; height: 340px; flex-shrink: 0; aspect-ratio: 1 / 1; border-radius: 50%; background: #000; padding: 50px; box-shadow: 0 0 0 12px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.6); animation: spin 20s linear infinite; }
.record-wrapper.is-paused { animation-play-state: paused; }
.record-cover { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
@keyframes spin { 100% { transform: rotate(360deg); } }

.lyric-side { width: 550px; display: flex; flex-direction: column; color: #fff; text-align: center; }
.lyric-song-title { font-size: 36px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 2px; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.lyric-song-artist { font-size: 18px; color: rgba(255,255,255,0.6); margin: 0 0 40px 0; font-weight: 500;}
.lyric-scroll-box { height: 380px; overflow-y: auto; position: relative; padding: 60px 0; scroll-behavior: smooth; mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, black 10%, black 90%, rgba(0,0,0,0.3) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, black 10%, black 90%, rgba(0,0,0,0.3) 100%); }
.lyric-scroll-box::-webkit-scrollbar { display: none; }
.lyric-inner { position: relative; }
.lyric-line { min-height: 45px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.3); transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); margin: 0; padding: 10px 30px; cursor: pointer; word-break: break-word; white-space: normal; font-weight: 600;}
.lyric-line:hover { color: rgba(255,255,255,0.8); }
.lyric-line.active { font-size: 24px; font-weight: 900; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.4); transform: scale(1.05); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

.light-comment-drawer { background: #fff !important; color: #0f172a; }
.drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 1px solid #f1f5f9; }
.drawer-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.drawer-close { font-size: 24px; color: #94a3b8; cursor: pointer; transition: 0.3s; }
.drawer-close:hover { color: #0f172a; transform: rotate(90deg); }
.comments-list { padding: 20px 30px; height: calc(100vh - 160px); overflow-y: auto; }
.comments-list::-webkit-scrollbar { width: 4px; }
.comments-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.comment-item { display: flex; gap: 15px; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;}
.comment-body { flex: 1; }
.comment-user { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
.comment-user .name { font-size: 14px; font-weight: bold; color: #334155; }
.comment-user .likes { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: 0.2s;}
.comment-user .likes:hover, .comment-user .likes.is-liked { color: #ef4444; font-weight: bold;}
.comment-text { font-size: 14px; color: #1e293b; line-height: 1.6; margin-bottom: 8px; word-break: break-all; cursor: pointer; }
.comment-time { font-size: 12px; color: #94a3b8; }
.reply-btn { margin-left: 15px; color: #3b82f6; cursor: pointer; display: none; }
.comment-item:hover .reply-btn { display: inline; }
.replies-box { background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.reply-item { font-size: 13px; line-height: 1.5; word-break: break-all; }
.reply-user { font-weight: 700; color: #334155; cursor: pointer; }
.reply-content { color: #475569; cursor: pointer; transition: 0.2s; }
.reply-content:hover { color: #0f172a; }
.comment-input-area { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 30px; background: #fff; border-top: 1px solid #f1f5f9; display: flex; gap: 15px; align-items: center;}
.comment-input-area :deep(.el-input__wrapper) { background: #f8fafc; box-shadow: none; border: 1px solid #e2e8f0; border-radius: 20px; }
.comment-input-area :deep(.el-input__inner) { color: #0f172a; }
.reply-tag { margin-bottom: -10px; z-index: 10; margin-left: 10px; }
</style>