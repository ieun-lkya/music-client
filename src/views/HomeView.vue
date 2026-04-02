<template>
  <div class="main-layout">
    <Sidebar @switch-menu="switchMenu" @open-playlist-dialog="openPlaylistDialog" />

    <main class="main-content">
      <header class="top-header">
        <div class="ai-input-wrapper">
          <el-input v-if="musicStore.currentMenu === 'discover' && discoverMode === 'ai'" v-model="userInput" placeholder="描述此刻场景，让 AI 懂你..." class="scene-search ai-search-pulse" @keyup.enter="handleSearch">
            <template #prefix><el-icon class="el-input__icon"><Search /></el-icon></template>
            <template #suffix><el-button type="primary" link class="match-btn" :loading="isSearching" @click="handleSearch">AI 匹配</el-button></template>
          </el-input>
          <el-input v-else v-model="localSearchKeyword" :placeholder="searchPlaceholder" class="scene-search local-search" clearable>
            <template #prefix><el-icon class="el-input__icon"><Search /></el-icon></template>
          </el-input>
        </div>
        
        <div class="user-profile" v-if="musicStore.currentUser">
          <el-avatar :size="36" :src="musicStore.currentUser.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
          <span class="user-name">{{ musicStore.currentUser.username }}</span>
          <el-button type="danger" link style="margin-left: 10px;" @click="handleLogout">退出</el-button>
        </div>
        <div class="user-profile" v-else @click="goToLogin">
          <el-avatar :size="36" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          <span class="user-name" style="color: #3b82f6;">未登录 (点击登录)</span>
        </div>
      </header>

      <div class="scroll-container">
        <transition name="slide-up">
          <div class="batch-action-bar" v-if="isBatchMode">
            <span>已选择 {{ selectedMusicIds.length }} 首歌曲</span>
            <div style="display:flex; gap:10px;">
              <el-button type="danger" round @click="batchLikeSongs">❤️ 批量收藏</el-button>
              <el-button type="warning" round @click="openPlaylistDialog">➕ 加入/创建歌单</el-button>
              <el-button type="info" plain round @click="toggleBatchMode">取消批量</el-button>
            </div>
          </div>
        </transition>

        <section v-if="musicStore.currentMenu === 'discover'" class="discover-section fade-in">
          <div class="hero-banner">
            <div class="hero-glow shape-1"></div><div class="hero-glow shape-2"></div>
            <div class="hero-content">
              <h1 class="hero-title">探索 <span>无界</span> 音乐</h1>
              <p class="hero-subtitle">{{ discoverMode === 'ai' ? '通义千问 AI 正在为您精准匹配专属频率。' : '潜入海量曲库，寻找灵魂共鸣。' }}</p>
            </div>
            <div class="hero-actions">
              <div class="ios-segment-control">
                <div class="segment-btn" :class="{ active: discoverMode === 'ai' }" @click="discoverMode = 'ai'"><el-icon><MagicStick /></el-icon> AI 灵感</div>
                <div class="segment-btn" :class="{ active: discoverMode === 'library' }" @click="discoverMode = 'library'"><el-icon><List /></el-icon> 全部曲库</div>
              </div>
              <el-button :type="isBatchMode ? 'danger' : 'primary'" class="batch-btn-hero" round @click="toggleBatchMode" v-if="activePlayList.length > 0">
                <el-icon><Check /></el-icon> {{ isBatchMode ? '退出批量' : '整理曲库' }}
              </el-button>
            </div>
          </div>

          <div v-if="discoverMode === 'ai'">
            <el-empty v-if="aiMusicList.length === 0" description="在顶部输入场景，召唤 AI 为你匹配吧！" :image-size="200" />
            <el-row :gutter="25" class="bento-grid" v-else>
              <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="item in aiMusicList" :key="item.id">
                <div class="bento-card" @click="handleItemClick(item)">
                  <div class="bento-cover-box">
                    <el-image :src="item.coverUrl" fit="cover" lazy class="bento-cover" />
                    <div class="bento-play-overlay"><div class="bento-play-btn"><el-icon :size="28" color="#fff"><VideoPlay /></el-icon></div></div>
                    <div class="checkbox-overlay" v-if="isBatchMode" @click.stop><el-checkbox :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" size="large"/></div>
                  </div>
                  <div class="bento-info"><div class="bento-title">{{ item.title }}</div><div class="bento-artist">{{ item.artist }}</div></div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-playing': musicStore.currentSong && musicStore.currentSong.id === item.id }">
              <span class="modern-title-group">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:10px;"/>
                <div class="track-status-box" v-if="!isBatchMode"><span class="track-num">{{ (index + 1).toString().padStart(2, '0') }}</span><el-icon class="track-play"><VideoPlay /></el-icon><el-icon class="track-pause"><VideoPause /></el-icon></div>
                <span class="modern-title">{{ item.title }}</span>
              </span>
              <span class="col-like-cell"><el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': musicStore.isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="musicStore.isLiked(item.id) ? StarFilled : Star" /></el-icon></span>
              <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

        <section v-else-if="musicStore.currentMenu === 'radio'" class="hero-section fade-in">
          <div class="discover-header">
            <div><h2>📡 Echo 私人智能 FM</h2><p class="theory-note">AI 正在根据您的听歌基因，实时演算专属调频。</p></div>
            <el-button type="primary" round @click="initRadio(true)" :loading="isRadioLoading"><el-icon><Refresh /></el-icon> 换一批调频</el-button>
          </div>
          <div class="radio-layout" v-loading="isRadioLoading">
            <el-empty v-if="radioMusicList.length === 0" description="正在接收宇宙电波..." style="width: 100%;" />
            <template v-else>
              <div class="radio-player-panel fade-in">
                <div class="fm-cover-wrapper" :class="{ 'is-playing': musicStore.isPlaying }">
                  <el-image :src="musicStore.currentSong?.coverUrl || radioMusicList[0]?.coverUrl" class="fm-cover" fit="cover" />
                  <div class="fm-center-hole"></div>
                </div>
                <div class="fm-info"><h3>{{ musicStore.currentSong?.title || radioMusicList[0]?.title }}</h3><p>{{ musicStore.currentSong?.artist || radioMusicList[0]?.artist }}</p></div>
              </div>
              <div class="radio-queue-panel fade-in">
                <h3 class="queue-title">即将播放队列</h3>
                <div class="modern-list-view queue-list">
                  <div class="modern-list-item" v-for="(item, index) in radioMusicList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-playing': musicStore.currentSong && musicStore.currentSong.id === item.id }">
                    <span class="modern-title-group">
                      <span class="index-num" v-if="!musicStore.currentSong || musicStore.currentSong.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                      <div class="modern-play-icon"><el-icon v-if="musicStore.currentSong && musicStore.currentSong.id === item.id && musicStore.isPlaying"><VideoPause /></el-icon><el-icon v-else><VideoPlay /></el-icon></div>
                      <span class="modern-title">{{ item.title }}</span>
                    </span>
                    <span class="col-like-cell"><el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': musicStore.isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="musicStore.isLiked(item.id) ? StarFilled : Star" /></el-icon></span>
                    <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>

        </div>
      
      <LyricOverlay />
    </main>

    <el-dialog v-model="playlistDialogVisible" title="操作云端歌单" width="400px" top="30vh" append-to-body>
      <div v-if="selectedMusicIds.length > 0" style="margin-bottom:20px; color:#3b82f6; font-weight:bold;">已勾选 {{ selectedMusicIds.length }} 首歌曲</div>
      <el-input v-model="newPlaylistName" placeholder="输入新歌单名称..." maxlength="20"><template #append><el-button type="primary" @click="createNewPlaylist">创建并加入</el-button></template></el-input>
      <el-divider v-if="musicStore.customPlaylists.length > 0">或加入已有云端歌单</el-divider>
      <div class="playlist-options" v-if="musicStore.customPlaylists.length > 0">
        <div class="pl-option" v-for="pl in musicStore.customPlaylists" :key="pl.id" @click="addToExistingPlaylist(pl)"><el-icon><Menu /></el-icon> {{ pl.name }}</div>
      </div>
    </el-dialog>

    <PlayerBar @play-prev="playPrev" @play-next="playNext" @toggle-like="toggleLike" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, VideoPlay, VideoPause, Star, StarFilled, List, Check, Menu, MagicStick, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 🚀 引入解耦后的终极组件群
import Sidebar from '../components/layout/Sidebar.vue'
import PlayerBar from '../components/player/PlayerBar.vue'
import LyricOverlay from '../components/player/LyricOverlay.vue'
import { useMusicStore } from '../store/music'

import { getMusicListAPI, recommendMusicAPI, getUserPlaylistsAPI, createPlaylistAPI, deletePlaylistAPI, addMusicToPlaylistAPI, getPlaylistMusicAPI } from '../api/music'
import { likeMusicAPI, unlikeMusicAPI, getLikedMusicAPI } from '../api/user'

const router = useRouter()
const goToLogin = () => router.push('/login')
const musicStore = useMusicStore()

const discoverMode = ref('library') 
const userInput = ref('')
const isSearching = ref(false)
const localSearchKeyword = ref('')

const allMusicList = ref([]); const aiMusicList = ref([]); const radioMusicList = ref([]); const sleepMusicList = ref([])
const isRadioLoading = ref(false); const isSleepLoading = ref(false)

const isBatchMode = ref(false); const selectedMusicIds = ref([])
const playlistDialogVisible = ref(false); const newPlaylistName = ref('')

const searchPlaceholder = computed(() => {
  if (musicStore.currentMenu === 'discover') return '极速检索全站曲库...'
  return '极速检索歌名/歌手...'
})

const rawActivePlayList = computed(() => {
  if (musicStore.currentMenu === 'liked') return musicStore.likedMusicList
  if (musicStore.currentMenu === 'history') return musicStore.playHistory
  if (musicStore.currentMenu.startsWith('playlist_')) return currentActivePlaylist.value?.songs || []
  if (musicStore.currentMenu === 'discover') return discoverMode.value === 'library' ? allMusicList.value : aiMusicList.value
  return []
})

const activePlayList = computed(() => {
  const list = rawActivePlayList.value
  if (musicStore.currentMenu === 'discover' && discoverMode.value === 'ai') return list 
  if (!localSearchKeyword.value) return list
  const kw = localSearchKeyword.value.toLowerCase().trim()
  return list.filter(song => (song.title && song.title.toLowerCase().includes(kw)) || (song.artist && song.artist.toLowerCase().includes(kw)))
})

const currentActivePlaylist = computed(() => {
  if (musicStore.currentMenu.startsWith('playlist_')) { return musicStore.customPlaylists.find(p => p.id == musicStore.currentMenu.split('_')[1]) }
  return null
})

const toggleBatchMode = () => { isBatchMode.value = !isBatchMode.value; selectedMusicIds.value = [] }
const toggleSelection = (id) => { const index = selectedMusicIds.value.indexOf(id); if (index > -1) selectedMusicIds.value.splice(index, 1); else selectedMusicIds.value.push(id) }

const handleItemClick = (item) => {
  if (isBatchMode.value) toggleSelection(item.id) 
  else musicStore.selectSong(item) 
}

const openPlaylistDialog = () => {
  if (!musicStore.currentUser) return ElMessage.warning('请先登录！')
  if (selectedMusicIds.value.length === 0) return ElMessage.warning('请先勾选歌曲哦！')
  playlistDialogVisible.value = true
}

const batchLikeSongs = async () => {
  if (!musicStore.currentUser) return goToLogin()
  let successCount = 0
  for (let id of selectedMusicIds.value) {
    if (!musicStore.isLiked(id)) { try { await likeMusicAPI(musicStore.currentUser.id, id); successCount++ } catch (error) {} }
  }
  if (successCount > 0) { ElMessage.success(`❤️ 成功批量收藏 ${successCount} 首歌！`); await fetchMyLikes() } 
  toggleBatchMode() 
}

const toggleLike = async (song) => {
  if (!musicStore.currentUser) return goToLogin()
  try {
    if (musicStore.isLiked(song.id)) { await unlikeMusicAPI(musicStore.currentUser.id, song.id); ElMessage.success('已取消收藏') } 
    else { await likeMusicAPI(musicStore.currentUser.id, song.id); ElMessage.success('❤️ 收藏成功！') }
    await fetchMyLikes() 
  } catch (error) {}
}

const fetchMyPlaylists = async () => { if (musicStore.currentUser) { try { musicStore.customPlaylists = await getUserPlaylistsAPI(musicStore.currentUser.id) || [] } catch (error) {} } }
const fetchMyLikes = async () => { if (musicStore.currentUser) { try { musicStore.likedMusicList = await getLikedMusicAPI(musicStore.currentUser.id) || [] } catch (error) {} } }

const createNewPlaylist = async () => {
  try {
    await createPlaylistAPI(musicStore.currentUser.id, newPlaylistName.value.trim())
    await fetchMyPlaylists() 
    const newPl = musicStore.customPlaylists.find(p => p.name === newPlaylistName.value.trim())
    if (newPl && selectedMusicIds.value.length > 0) {
      for(let sid of selectedMusicIds.value) { await addMusicToPlaylistAPI(newPl.id, sid) }
    }
    ElMessage.success('🎉 歌单创建并添加成功！')
  } catch (error) {}
  newPlaylistName.value = ''; playlistDialogVisible.value = false; toggleBatchMode() 
}

const addToExistingPlaylist = async (pl) => {
  for(let sid of selectedMusicIds.value) { try { await addMusicToPlaylistAPI(pl.id, sid) } catch(e) {} }
  ElMessage.success('✅ 成功加入！'); playlistDialogVisible.value = false; toggleBatchMode()
  if (musicStore.currentMenu === `playlist_${pl.id}`) loadPlaylistSongs(pl.id)
}

const deletePlaylist = (pId) => {
  ElMessageBox.confirm('确定要删除吗？', '确认', { type: 'warning' }).then(async () => {
    try { await deletePlaylistAPI(pId); await fetchMyPlaylists(); musicStore.currentMenu = 'discover'; } catch (error) {}
  }).catch(() => {})
}

const loadPlaylistSongs = async (plId) => {
  try {
    const res = await getPlaylistMusicAPI(plId)
    const pl = musicStore.customPlaylists.find(p => p.id == plId)
    if (pl) pl.songs = res || []
  } catch (error) {}
}

const handleLogout = () => {
  musicStore.currentUser = null; musicStore.likedMusicList = []; musicStore.customPlaylists = [];
  localStorage.removeItem('echo_user'); localStorage.removeItem('echo_token'); router.push('/login')
}

const loadDiscoverData = async () => { try { const res = await getMusicListAPI(); allMusicList.value = res.data ? res.data : (res || []) } catch (error) {} }

const initRadio = async (force = false) => {
  isRadioLoading.value = true
  try {
    radioMusicList.value = await recommendMusicAPI('推荐浪漫流行的经典歌曲。') || []
    if (force && radioMusicList.value.length > 0) musicStore.selectSong(radioMusicList.value[0])
  } catch (error) {} finally { isRadioLoading.value = false }
}

const initSleepMode = async (force = false) => {
  isSleepLoading.value = true
  try { sleepMusicList.value = await recommendMusicAPI('助眠白噪音') || [] } catch (error) {} finally { isSleepLoading.value = false }
}

const handleSearch = async () => {
  if (!userInput.value.trim()) return
  musicStore.currentMenu = 'discover'; discoverMode.value = 'ai'; isSearching.value = true
  try { aiMusicList.value = await recommendMusicAPI(userInput.value) || [] } catch (error) {} finally { isSearching.value = false }
}

const playPrev = () => {
  const index = activePlayList.value.findIndex(item => item.id === musicStore.currentSong?.id)
  if (index !== -1) musicStore.selectSong(activePlayList.value[(index - 1 + activePlayList.value.length) % activePlayList.value.length])
}
const playNext = () => {
  const index = activePlayList.value.findIndex(item => item.id === musicStore.currentSong?.id)
  if (index !== -1) musicStore.selectSong(activePlayList.value[(index + 1) % activePlayList.value.length])
}

const switchMenu = async (menuName) => {
  musicStore.currentMenu = menuName; isBatchMode.value = false ; localSearchKeyword.value = '' 
  if (menuName === 'discover') await loadDiscoverData()
  else if (menuName === 'liked') await fetchMyLikes()
  else if (menuName.startsWith('playlist_')) await loadPlaylistSongs(menuName.split('_')[1])
  else if (menuName === 'radio') initRadio() 
  else if (menuName === 'sleep') initSleepMode() 
}

onMounted(async () => {
  await loadDiscoverData()
  if (musicStore.currentUser) { await fetchMyLikes(); await fetchMyPlaylists() }
})
</script>

<style scoped>
/* 原有的通用布局样式、大厅样式统统保留，播放器和歌词的CSS已全部转移 */
.discover-section { display: flex; flex-direction: column; gap: 20px; }
.hero-banner { position: relative; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); border-radius: 28px; padding: 45px 50px; overflow: hidden; display: flex; justify-content: space-between; align-items: flex-end; border: 1px solid #fff; }
.hero-content { position: relative; z-index: 2; }
.hero-title { font-size: 42px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -1px; }
.hero-title span { color: transparent; background-clip: text; -webkit-background-clip: text; background-image: linear-gradient(to right, #3b82f6, #8b5cf6); }
.hero-subtitle { font-size: 15px; color: #475569; margin: 0; font-weight: 600; }
.hero-actions { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: flex-end; gap: 20px; }
.ios-segment-control { display: flex; background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); padding: 6px; border-radius: 20px; gap: 5px; border: 1px solid rgba(255,255,255,0.8); }
.segment-btn { padding: 10px 24px; border-radius: 14px; font-weight: 600; font-size: 14px; color: #64748b; cursor: pointer; transition: 0.3s; }
.segment-btn.active { background: #fff; color: #3b82f6; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
.bento-grid { padding: 10px 0; }
.bento-card { background: #fff; border-radius: 24px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); transition: 0.4s; cursor: pointer; margin-bottom: 20px;}
.bento-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(59,130,246,0.12); }
.bento-cover-box { width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden; position: relative; }
.bento-cover { width: 100%; height: 100%; object-fit: cover; }
.bento-play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.25); opacity: 0; transition: 0.3s; display: flex; align-items: center; justify-content: center;}
.bento-card:hover .bento-play-overlay { opacity: 1; }
.bento-info { padding: 16px 4px 4px; text-align: center; }
.bento-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.modern-list-view { display: flex; flex-direction: column; gap: 8px; padding: 10px 0;}
.modern-list-item { display: grid; grid-template-columns: 1fr 80px 1fr; align-items: center; padding: 16px 30px; background: #fff; border-radius: 20px; transition: 0.3s; cursor: pointer; }
.modern-list-item:hover { transform: scale(1.01); box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
.modern-list-item.is-playing { background: linear-gradient(to right, #eff6ff, #fff); }
.modern-title-group { display: flex; align-items: center; gap: 16px; }
.modern-title { font-size: 16px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px;}
.track-status-box { width: 30px; text-align: center; display: flex; justify-content: center; align-items: center; color: #94a3b8; }
.track-play, .track-pause { display: none; font-size: 22px; }
.modern-list-item .track-num { display: block; font-size: 14px; font-weight: 600; }
.modern-list-item:hover .track-num { display: none; }
.modern-list-item:hover .track-play { display: block; }
.modern-list-item.is-playing .track-num { display: none; }
.modern-list-item.is-playing .track-pause { display: block; color: #3b82f6; }
.list-like-icon { color: #94a3b8; transition: 0.2s;}
.list-like-icon.is-liked { color: #ef4444; }

:global(body), :global(html), :global(#app) { margin: 0; padding: 0; height: 100%; width: 100%; box-sizing: border-box; }
*, *::before, *::after { box-sizing: border-box; }
.main-layout { display: flex; width: 100vw; height: 100vh; background-color: #f8fafc; color: #333; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
.main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
.top-header { height: 76px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; z-index: 5; }
.ai-input-wrapper { width: 480px; }
.scene-search :deep(.el-input__wrapper) { border-radius: 20px; background-color: #f1f5f9; box-shadow: none; padding-left: 15px; }
.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.scroll-container { flex: 1; overflow-y: auto; padding: 30px 40px 120px; }

/* 其他电台、个人中心样式省略（均与上一版完全一致，没有任何改动） */
.radio-layout { display: flex; gap: 30px; align-items: flex-start; }
.radio-player-panel { flex: 0 0 320px; display: flex; flex-direction: column; align-items: center; background: #fff; padding: 40px 20px; border-radius: 24px; }
.radio-queue-panel { flex: 1; min-width: 0; }
.fm-cover-wrapper { width: 240px; height: 240px; border-radius: 50%; animation: spin 20s linear infinite; animation-play-state: paused; border: 6px solid #0f172a; }
.fm-cover-wrapper.is-playing { animation-play-state: running; }
.fm-cover { width: 100%; height: 100%; }
.fm-center-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 45px; height: 45px; background: #f8fafc; border-radius: 50%; border: 3px solid #333; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.sleep-mode-bg { background: linear-gradient(135deg, #0f172a, #1e1b4b); border-radius: 28px; padding: 40px; }
</style>