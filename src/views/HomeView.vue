<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#3b82f6"><MagicStick /></el-icon>
        <span class="logo-text">EchoScene <span class="badge">AI</span></span>
      </div>
      
      <nav class="nav-menu">
        <div class="nav-item" :class="{ active: currentMenu === 'discover' }" @click="switchMenu('discover')">
          <el-icon><Compass /></el-icon> 发现音乐
        </div>
        <div class="nav-item" :class="{ active: currentMenu === 'radio' }" @click="switchMenu('radio')">
          <el-icon><Mic /></el-icon> 智能场景电台
        </div>
        <div class="nav-item" :class="{ active: currentMenu === 'profile' }" @click="switchMenu('profile')">
          <el-icon><User /></el-icon> 个人中心
        </div>
      </nav>

      <div class="nav-group">我的音乐</div>
      <div class="nav-sub-item" :class="{ active: currentMenu === 'liked' }" @click="switchMenu('liked')">❤️ 我喜欢的</div>
      <div class="nav-sub-item" :class="{ active: currentMenu === 'sleep' }" @click="switchMenu('sleep')">🌙 助眠系列</div>
      <div class="nav-sub-item" :class="{ active: currentMenu === 'history' }" @click="switchMenu('history')">🕒 最近播放</div>

      <div class="nav-group" style="display:flex; justify-content:space-between; align-items:center;">
        <span>自建歌单</span>
        <el-icon style="cursor:pointer; color:#3b82f6;" @click="openPlaylistDialog"><Plus /></el-icon>
      </div>
      <div 
        v-for="pl in customPlaylists" 
        :key="pl.id"
        class="nav-sub-item" 
        :class="{ active: currentMenu === 'playlist_' + pl.id }" 
        @click="switchMenu('playlist_' + pl.id)"
      >
        💿 {{ pl.name }}
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <div class="ai-input-wrapper">
          <el-input
            v-if="currentMenu === 'discover' && discoverMode === 'ai'"
            v-model="userInput"
            placeholder="描述此刻场景，让 AI 懂你，例如：失恋后看雨..."
            class="scene-search"
            @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon class="el-input__icon"><Search /></el-icon></template>
            <template #suffix>
              <el-button type="primary" link class="match-btn" :loading="isSearching" @click="handleSearch">
                AI 匹配
              </el-button>
            </template>
          </el-input>

          <el-input
            v-else
            v-model="localSearchKeyword"
            :placeholder="searchPlaceholder"
            class="scene-search local-search"
            clearable
          >
            <template #prefix><el-icon class="el-input__icon"><Search /></el-icon></template>
          </el-input>
        </div>
        
        <div class="user-profile" v-if="currentUser">
          <el-avatar :size="36" :src="currentUser.avatar" />
          <span class="user-name">{{ currentUser.username }}</span>
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

        <section v-if="currentMenu === 'discover'" class="hero-section fade-in">
          <div class="discover-header">
            <div>
              <h2>发现音乐</h2>
              <p class="theory-note">{{ discoverMode === 'ai' ? 'AI 已为您精准匹配。' : '探索全站曲库。' }}</p>
            </div>
            <div style="display:flex; align-items:center; gap: 15px;">

              <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode">
                <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
              </el-button>
              <div class="view-toggle">
                <div class="toggle-btn" :class="{ active: discoverMode === 'ai' }" @click="discoverMode = 'ai'"><el-icon :size="18"><MagicStick /></el-icon> AI 匹配</div>
                <div class="toggle-btn" :class="{ active: discoverMode === 'library' }" @click="discoverMode = 'library'"><el-icon :size="18"><List /></el-icon> 全部曲库</div>
              </div>
            </div>
          </div>

          <div v-if="discoverMode === 'ai'">
            <el-empty v-if="aiMusicList.length === 0" description="在顶部输入场景，召唤 AI 为你匹配吧！" />
            <el-row :gutter="25" class="music-grid" v-else>
              <el-col :xs="12" :sm="8" :md="6" v-for="item in aiMusicList" :key="item.id">
                <div class="song-card" @click="handleItemClick(item)">
                  <div class="cover-box">
                    <el-image :src="item.coverUrl" fit="cover" lazy class="main-cover" />
                    <div class="play-btn-overlay"><el-icon :size="45" color="#fff"><VideoPlay /></el-icon></div>
                    <div class="checkbox-overlay" v-if="isBatchMode" @click.stop><el-checkbox :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" size="large"/></div>
                  </div>
                  <div class="song-detail"><div class="title">{{ item.title }}</div><div class="artist">{{ item.artist }}</div></div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="music-list-view fade-in" v-else>
            <div class="list-header">
              <span class="col-title">歌曲标题</span>
              <span class="col-like-cell"></span> 
              <span class="col-artist">歌手</span>
            </div>
            <div class="list-item" v-for="item in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'playing-item': currentSong && currentSong.id === item.id }">
              <span class="col-title">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:15px;"/>
                <el-icon class="play-icon" v-if="currentSong && currentSong.id === item.id && isPlaying && !isBatchMode"><VideoPause /></el-icon>
                <el-icon class="play-icon" v-else-if="!isBatchMode"><VideoPlay /></el-icon>
                <span class="title-text">{{ item.title }}</span>
              </span>
              
              <span class="col-like-cell">
                <el-icon :size="18" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)">
                  <component :is="isLiked(item.id) ? StarFilled : Star" />
                </el-icon>
              </span>
              
              <span class="col-artist"><span class="artist-text">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

        <section v-else-if="currentMenu === 'liked'" class="hero-section fade-in">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
            <div>
              <h2>❤️ 我喜欢的音乐</h2>
              <p class="theory-note">这里存放着您红心收藏的专属歌单。</p>
            </div>
            <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode" v-if="likedMusicList.length > 0">
              <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
            </el-button>
          </div>
          
          <el-empty v-if="likedMusicList.length === 0" description="暂无收藏" />
          <el-row :gutter="25" class="music-grid" v-else>
            <el-col :xs="12" :sm="8" :md="6" v-for="item in activePlayList" :key="item.id">
              <div class="song-card" @click="handleItemClick(item)">
                <div class="cover-box">
                  <el-image :src="item.coverUrl" fit="cover" lazy class="main-cover" />
                  <div class="play-btn-overlay"><el-icon :size="45" color="#fff"><VideoPlay /></el-icon></div>
                  <div class="checkbox-overlay" v-if="isBatchMode" @click.stop>
                    <el-checkbox :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" size="large"/>
                  </div>
                </div>
                <div class="song-detail"><div class="title">{{ item.title }}</div><div class="artist">{{ item.artist }}</div></div>
              </div>
            </el-col>
          </el-row>
        </section>

        <section v-else-if="currentMenu === 'history'" class="hero-section fade-in">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
            <div>
              <h2>🕒 最近播放</h2>
              <p class="theory-note">这里记录了你最近畅听的 50 首歌曲。</p>
            </div>
            <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode" v-if="playHistory.length > 0">
              <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
            </el-button>
          </div>

          <el-empty v-if="playHistory.length === 0" description="暂无播放记录" />
          <div class="music-list-view fade-in" v-else>
            <div class="list-header">
              <span class="col-title">歌曲标题</span>
              <span class="col-like-cell"></span> 
              <span class="col-artist">歌手</span>
            </div>
            <div class="list-item" v-for="item in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'playing-item': currentSong && currentSong.id === item.id }">
              <span class="col-title">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:15px;"/>
                <el-icon class="play-icon" v-if="currentSong && currentSong.id === item.id && isPlaying && !isBatchMode"><VideoPause /></el-icon>
                <el-icon class="play-icon" v-else-if="!isBatchMode"><VideoPlay /></el-icon>
                <span class="title-text">{{ item.title }}</span>
              </span>
              
              <span class="col-like-cell">
                <el-icon :size="18" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)">
                  <component :is="isLiked(item.id) ? StarFilled : Star" />
                </el-icon>
              </span>
              
              <span class="col-artist"><span class="artist-text">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

        <section v-else-if="currentMenu.startsWith('playlist_')" class="hero-section fade-in">
          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <h2>💿 {{ currentActivePlaylist?.name }}</h2>
              <p class="theory-note">共 {{ currentActivePlaylist?.songs.length }} 首歌曲</p>
            </div>
            <div style="display:flex; gap:10px;">
              <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode" v-if="currentActivePlaylist?.songs.length > 0">
                <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
              </el-button>
              <el-button type="danger" plain round @click="deletePlaylist(currentActivePlaylist?.id)">删除该歌单</el-button>
            </div>
          </div>
          
          <el-empty v-if="currentActivePlaylist?.songs.length === 0" description="歌单空空如也，快去发现音乐批量添加吧！" />
          <div class="music-list-view fade-in" v-else style="margin-top: 20px;">
            <div class="list-header">
              <span class="col-title">歌曲标题</span>
              <span class="col-like-cell"></span> 
              <span class="col-artist">歌手</span>
            </div>
            <div class="list-item" v-for="item in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'playing-item': currentSong && currentSong.id === item.id }">
              <span class="col-title">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:15px;"/>
                <el-icon class="play-icon" v-if="currentSong && currentSong.id === item.id && isPlaying && !isBatchMode"><VideoPause /></el-icon>
                <el-icon class="play-icon" v-else-if="!isBatchMode"><VideoPlay /></el-icon>
                <span class="title-text">{{ item.title }}</span>
              </span>
              
              <span class="col-like-cell">
                <el-icon :size="18" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)">
                  <component :is="isLiked(item.id) ? StarFilled : Star" />
                </el-icon>
              </span>
              
              <span class="col-artist"><span class="artist-text">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

        <section v-else-if="currentMenu === 'radio'" class="hero-section fade-in"><h2>📡 智能电台建设中...</h2></section>
        <section v-else-if="currentMenu === 'sleep'" class="hero-section fade-in"><h2>🌙 助眠系列建设中...</h2></section>
        <section v-else-if="currentMenu === 'profile'" class="hero-section fade-in"><h2>👤 个人中心建设中...</h2></section>
      </div>

      <transition name="slide-up">
        <div class="lyric-overlay" v-if="showLyricPanel" :style="{ backgroundImage: `url(${currentSong?.coverUrl})` }">
          <div class="lyric-blur-bg"></div>
          
          <div class="lyric-content-wrapper">
            <div class="record-side"><div class="record-wrapper" :class="{ 'is-paused': !isPlaying }"><img :src="currentSong?.coverUrl" class="record-cover" /></div></div>
            <div class="lyric-side">
              <h2 class="lyric-song-title">{{ currentSong?.title }}</h2><p class="lyric-song-artist">{{ currentSong?.artist }}</p>
              <div class="lyric-scroll-box" ref="lyricBoxRef" @wheel="handleLyricScroll" @touchmove="handleLyricScroll">
                <div class="lyric-inner">
                  <p v-for="(line, index) in parsedLyrics" :key="index" class="lyric-line" :class="{ 'active': currentLyricIndex === index }" @click="seekToLyric(line.time)">{{ line.text }}</p>
                  <p v-if="parsedLyrics.length === 0" class="lyric-line active">{{ isLoadingLyric ? '加载中...' : '暂无歌词' }}</p>
                </div>
              </div>
            </div>
          </div>
          <el-button circle size="large" class="close-lyric-btn" @click="showLyricPanel = false"><el-icon :size="24"><ArrowDownBold /></el-icon></el-button>
        </div>
      </transition>
    </main>

    <el-dialog v-model="playlistDialogVisible" title="操作歌单" width="400px" top="30vh" append-to-body>
      <div v-if="selectedMusicIds.length > 0" style="margin-bottom:20px; color:#3b82f6; font-weight:bold;">已勾选 {{ selectedMusicIds.length }} 首歌曲</div>
      <el-input v-model="newPlaylistName" placeholder="输入新歌单名称..." maxlength="20"><template #append><el-button type="primary" @click="createNewPlaylist">创建并加入</el-button></template></el-input>
      <el-divider v-if="customPlaylists.length > 0">或加入已有歌单</el-divider>
      <div class="playlist-options" v-if="customPlaylists.length > 0">
        <div class="pl-option" v-for="pl in customPlaylists" :key="pl.id" @click="addToExistingPlaylist(pl)"><el-icon><Menu /></el-icon> {{ pl.name }}</div>
      </div>
    </el-dialog>

    <footer class="player-bar" :class="{ 'is-active': currentSong }">
      <div class="progress-slider-wrapper"><el-slider v-model="playPercent" :show-tooltip="false" @input="isDragging = true" @change="onSliderSeek" class="player-slider" :disabled="!currentSong" /></div>
      <div class="controls-content" v-if="currentSong">
        <div class="track-info">
          <img :src="currentSong.coverUrl" class="mini-cover" style="cursor: pointer;" @click="showLyricPanel = true" />
          <div class="meta">
            <span class="t">{{ currentSong.title }}</span>
            <span class="a">{{ currentSong.artist }}</span>
          </div>
          <el-icon :size="22" class="like-icon" :class="{ 'is-liked': isLiked(currentSong.id) }" @click="toggleLike(currentSong)">
            <component :is="isLiked(currentSong.id) ? StarFilled : Star" />
          </el-icon>
        </div>
        <div class="play-btns"><el-button link class="prev-next-btn" @click="playPrev"><el-icon :size="20"><ArrowLeftBold /></el-icon></el-button><el-button circle size="large" type="primary" class="main-play-btn" @click="togglePlay"><el-icon :size="24"><component :is="isPlaying ? VideoPause : VideoPlay" /></el-icon></el-button><el-button link class="prev-next-btn" @click="playNext"><el-icon :size="20"><ArrowRightBold /></el-icon></el-button></div>
        <div class="extra-funcs"><span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span><el-icon :size="18" class="mode-icon" @click="togglePlayMode"><component :is="playMode === 'list' ? Refresh : RefreshLeft" /></el-icon><el-popover placement="top" width="40" trigger="hover"><template #reference><el-icon :size="20" class="vol-icon"><Headset /></el-icon></template><el-slider v-model="volume" vertical height="80px" @input="onVolumeChange" /></el-popover></div>
      </div>
      <div class="empty-player" v-else>请在上方点击歌曲播放</div>
      
      <audio ref="audioRef" :src="currentSong?.audioUrl" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" @ended="onPlayEnded"></audio>
    </footer>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Compass, Mic, User, MagicStick, Search, VideoPlay, VideoPause, ArrowLeftBold, ArrowRightBold, Headset, Refresh, RefreshLeft, Star, StarFilled, List, ArrowDownBold, Check, Plus, Menu } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getMusicListAPI, recommendMusicAPI } from '../api/music'
import { likeMusicAPI, unlikeMusicAPI, getLikedMusicAPI } from '../api/user'

const router = useRouter()
const goToLogin = () => router.push('/login')

const currentMenu = ref('discover')
const discoverMode = ref('library') 
const userInput = ref('')
const isSearching = ref(false)
const allMusicList = ref([]) 
const aiMusicList = ref([]) 
const currentUser = ref(null)
const likedMusicList = ref([])
const playHistory = ref([])

const localSearchKeyword = ref('')

const searchPlaceholder = computed(() => {
  if (currentMenu.value === 'discover') return '极速检索全站曲库...'
  if (currentMenu.value === 'liked') return '检索我的收藏...'
  if (currentMenu.value === 'history') return '检索播放历史...'
  if (currentMenu.value.startsWith('playlist_')) return `检索 ${currentActivePlaylist.value?.name}...`
  return '极速检索歌名/歌手...'
})

const customPlaylists = ref([])
const isBatchMode = ref(false)
const selectedMusicIds = ref([])
const playlistDialogVisible = ref(false)
const newPlaylistName = ref('')

const rawActivePlayList = computed(() => {
  if (currentMenu.value === 'liked') return likedMusicList.value
  if (currentMenu.value === 'history') return playHistory.value
  if (currentMenu.value.startsWith('playlist_')) return currentActivePlaylist.value?.songs || []
  if (currentMenu.value === 'discover') return discoverMode.value === 'library' ? allMusicList.value : aiMusicList.value
  return []
})

const activePlayList = computed(() => {
  const list = rawActivePlayList.value
  if (currentMenu.value === 'discover' && discoverMode.value === 'ai') return list 
  
  if (!localSearchKeyword.value) return list
  const kw = localSearchKeyword.value.toLowerCase().trim()
  return list.filter(song => 
    (song.title && song.title.toLowerCase().includes(kw)) || 
    (song.artist && song.artist.toLowerCase().includes(kw))
  )
})

const currentActivePlaylist = computed(() => {
  if (currentMenu.value.startsWith('playlist_')) {
    const pId = currentMenu.value.split('_')[1]
    return customPlaylists.value.find(p => p.id === pId)
  }
  return null
})

const toggleBatchMode = () => { isBatchMode.value = !isBatchMode.value; selectedMusicIds.value = [] }
const toggleSelection = (id) => { const index = selectedMusicIds.value.indexOf(id); if (index > -1) selectedMusicIds.value.splice(index, 1); else selectedMusicIds.value.push(id) }

const handleItemClick = (item) => {
  if (isBatchMode.value) toggleSelection(item.id) 
  else selectSong(item) 
}

const getSelectedSongObjects = () => {
  return activePlayList.value.filter(s => selectedMusicIds.value.includes(s.id))
}

const openPlaylistDialog = () => {
  if (selectedMusicIds.value.length === 0) return ElMessage.warning('请先勾选歌曲哦！')
  playlistDialogVisible.value = true
}

const batchLikeSongs = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录才能收藏歌曲哦！')
    return goToLogin()
  }
  if (selectedMusicIds.value.length === 0) return ElMessage.warning('请先勾选歌曲！')

  let successCount = 0
  for (let id of selectedMusicIds.value) {
    if (!isLiked(id)) {
      try {
        await likeMusicAPI(currentUser.value.id, id)
        successCount++
      } catch (error) { console.error('收藏失败', id) }
    }
  }

  if (successCount > 0) {
    ElMessage.success(`❤️ 成功批量收藏 ${successCount} 首新歌曲！`)
    await fetchMyLikes() 
  } else {
    ElMessage.info('选中的歌曲都已经躺在你的收藏列表里啦~')
  }
  
  toggleBatchMode() 
}

const savePlaylistsToLocal = () => { localStorage.setItem('echo_custom_playlists', JSON.stringify(customPlaylists.value)) }

const createNewPlaylist = () => {
  if (!newPlaylistName.value.trim()) return ElMessage.warning('请输入歌单名称！')
  const newId = Date.now().toString()
  const newPl = { id: newId, name: newPlaylistName.value, songs: getSelectedSongObjects() }
  customPlaylists.value.push(newPl); savePlaylistsToLocal()
  newPlaylistName.value = ''; playlistDialogVisible.value = false; toggleBatchMode() 
  ElMessage.success('🎉 歌单创建并添加成功！')
}

const addToExistingPlaylist = (pl) => {
  const songsToAdd = getSelectedSongObjects()
  const existingIds = pl.songs.map(s => s.id)
  const uniqueSongs = songsToAdd.filter(s => !existingIds.includes(s.id))
  if (uniqueSongs.length === 0) return ElMessage.warning('选中的歌曲已经都在这个歌单里啦~')
  pl.songs.push(...uniqueSongs); savePlaylistsToLocal()
  playlistDialogVisible.value = false; toggleBatchMode()
  ElMessage.success(`✅ 成功将 ${uniqueSongs.length} 首歌加入【${pl.name}】！`)
}

const deletePlaylist = (pId) => {
  ElMessageBox.confirm('确定要删除这个辛辛苦苦建的歌单吗？', '删除确认', { type: 'warning' }).then(() => {
    customPlaylists.value = customPlaylists.value.filter(p => p.id !== pId); savePlaylistsToLocal()
    currentMenu.value = 'discover'; ElMessage.success('歌单已删除')
  }).catch(() => {})
}

const currentSong = ref(null)
const audioRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const volume = ref(70)
const duration = ref(0) 
const playMode = ref('list') 
const playPercent = ref(0)
const isDragging = ref(false) 

const isLiked = (musicId) => likedMusicList.value.some(item => item.id === musicId)

const toggleLike = async (song) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录才能收藏哦！')
    return goToLogin()
  }
  if (!song) return
  
  const mId = song.id
  const uId = currentUser.value.id
  try {
    if (isLiked(mId)) {
      await unlikeMusicAPI(uId, mId)
      ElMessage.success('已取消收藏')
    } else {
      await likeMusicAPI(uId, mId)
      ElMessage.success('❤️ 收藏成功！')
    }
    await fetchMyLikes() 
  } catch (error) { 
    ElMessage.error('操作失败') 
  }
}

const showLyricPanel = ref(false)   
const parsedLyrics = ref([])        
const currentLyricIndex = ref(0)    
const isLoadingLyric = ref(false)   
const lyricBoxRef = ref(null)       

watch(showLyricPanel, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    setTimeout(() => { if (lyricBoxRef.value && currentLyricIndex.value !== -1) lyricBoxRef.value.scrollTo({ top: currentLyricIndex.value * 45 }) }, 50)
  }
})

const parseLrc = (lrcStr) => {
  const lines = lrcStr.split('\n')
  const result = []
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/
  for (let line of lines) {
    const match = line.match(timeReg)
    if (match) {
      const min = parseInt(match[1]); const sec = parseInt(match[2]); const ms = match[3].length === 2 ? parseInt(match[3]) * 10 : parseInt(match[3])
      const time = min * 60 + sec + ms / 1000
      const text = line.replace(timeReg, '').trim()
      if (text) result.push({ time, text })
    }
  }
  return result
}

const isUserScrolling = ref(false)
let scrollTimeout = null           
const handleLyricScroll = () => {
  isUserScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false
    if (currentLyricIndex.value !== -1 && lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: currentLyricIndex.value * 45, behavior: 'smooth' })
  }, 3000) 
}

const seekToLyric = (time) => {
  if (audioRef.value) { audioRef.value.currentTime = time; audioRef.value.play(); isPlaying.value = true; isUserScrolling.value = false; if (scrollTimeout) clearTimeout(scrollTimeout) }
}

const loadLyrics = async (song) => {
  parsedLyrics.value = []; currentLyricIndex.value = 0; isLoadingLyric.value = true
  if (lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: 0 })
  try {
    if (!song.lyricUrl) { isLoadingLyric.value = false; return }
    const response = await axios.get(song.lyricUrl)
    parsedLyrics.value = parseLrc(response.data)
  } catch (error) { console.warn("拉取歌词失败:", error) } finally { isLoadingLyric.value = false }
}

watch(currentSong, (newSong) => {
  if (newSong) {
    loadLyrics(newSong)
    const index = playHistory.value.findIndex(item => item.id === newSong.id)
    if (index !== -1) playHistory.value.splice(index, 1)
    playHistory.value.unshift(newSong)
    if (playHistory.value.length > 50) playHistory.value.pop()
    localStorage.setItem('echo_play_history', JSON.stringify(playHistory.value))
  }
})

const fetchMyLikes = async () => {
  if (!currentUser.value) return
  try {
    const res = await getLikedMusicAPI(currentUser.value.id)
    likedMusicList.value = res.data || res || []
  } catch (error) { console.error('获取收藏失败', error) }
}

const handleLogout = () => {
  currentUser.value = null; likedMusicList.value = []; localStorage.removeItem('echo_user')
  router.push('/login')
}

const handleSearch = async () => {
  if (!userInput.value.trim()) return ElMessage.warning('请输入场景描述哦')
  if (currentMenu.value !== 'discover') currentMenu.value = 'discover'
  discoverMode.value = 'ai'; isSearching.value = true
  try {
    const data = await recommendMusicAPI(userInput.value)
    aiMusicList.value = data.data || data || []
    ElMessage.success('匹配成功！')
  } catch (error) { console.error(error) } finally { isSearching.value = false }
}

const selectSong = (song) => {
  currentSong.value = song
  isPlaying.value = true
  setTimeout(() => {
    if (audioRef.value) {
      audioRef.value.volume = volume.value / 100
      audioRef.value.play()
    }
  }, 100)
}

const togglePlay = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const playPrev = () => {
  const index = activePlayList.value.findIndex(item => item.id === currentSong.value?.id)
  if (index === -1) return
  const prevIndex = (index - 1 + activePlayList.value.length) % activePlayList.value.length
  selectSong(activePlayList.value[prevIndex])
}

const playNext = () => {
  const index = activePlayList.value.findIndex(item => item.id === currentSong.value?.id)
  if (index === -1) return
  const nextIndex = (index + 1) % activePlayList.value.length
  selectSong(activePlayList.value[nextIndex])
}

const togglePlayMode = () => { playMode.value = playMode.value === 'list' ? 'single' : 'list' }
const onLoadedMetadata = (e) => { duration.value = e.target.duration }
const onSliderSeek = (val) => { if (audioRef.value) audioRef.value.currentTime = (val / 100) * duration.value; isDragging.value = false }
const onTimeUpdate = (e) => {
  currentTime.value = e.target.currentTime
  if (!isDragging.value) playPercent.value = duration.value ? (currentTime.value / duration.value) * 100 : 0
  if (parsedLyrics.value.length > 0) {
    const time = currentTime.value
    let activeIndex = parsedLyrics.value.findIndex((line, index) => { const nextLine = parsedLyrics.value[index + 1]; return time >= line.time && (!nextLine || time < nextLine.time) })
    if (activeIndex !== -1 && activeIndex !== currentLyricIndex.value) {
      currentLyricIndex.value = activeIndex
      if (!isUserScrolling.value && lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: activeIndex * 45, behavior: 'smooth' })
    }
  }
}
const onVolumeChange = (val) => { if (audioRef.value) audioRef.value.volume = val / 100 }
const onPlayEnded = () => { if (playMode.value === 'single') { currentTime.value = 0; if (audioRef.value) audioRef.value.play() } else { playNext() } }
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00"
  const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(async () => {
  try {
    const data = await getMusicListAPI()
    allMusicList.value = data.data || data || [] 
  } catch (error) { console.error("初始化获取音乐列表失败", error) }

  const savedUser = localStorage.getItem('echo_user')
  if (savedUser) { currentUser.value = JSON.parse(savedUser); fetchMyLikes() }
  
  const savedHistory = localStorage.getItem('echo_play_history')
  if (savedHistory) playHistory.value = JSON.parse(savedHistory)
  
  const savedPlaylists = localStorage.getItem('echo_custom_playlists')
  if (savedPlaylists) customPlaylists.value = JSON.parse(savedPlaylists)
})

const switchMenu = async (menuName) => {
  currentMenu.value = menuName
  isBatchMode.value = false 
  localSearchKeyword.value = '' 
  if (menuName === 'discover') {
    try { const data = await getMusicListAPI(); allMusicList.value = data.data || data || [] } catch (error) { }
  }
  if (menuName === 'liked') fetchMyLikes()
}
</script>

<style scoped>
.checkbox-overlay { position: absolute; top: 10px; left: 10px; z-index: 10; background: rgba(255,255,255,0.9); border-radius: 4px; padding: 2px 5px; }
.batch-action-bar { position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%); background: #111827; color: white; padding: 12px 30px; border-radius: 40px; z-index: 200; display: flex; gap: 30px; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-weight: bold; }
.playlist-options { margin-top: 15px; display: flex; flex-direction: column; gap: 8px; }
.pl-option { padding: 10px 15px; background: #f3f4f6; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; color: #374151; font-weight: 500; }
.pl-option:hover { background: #e0e7ff; color: #3b82f6; }

:global(body), :global(html), :global(#app) { margin: 0; padding: 0; height: 100%; width: 100%; box-sizing: border-box; }
*, *::before, *::after { box-sizing: border-box; }
.main-layout { display: flex; width: 100vw; height: 100vh; background-color: #f6f8fa; color: #333; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
.sidebar { width: 240px; background-color: #ffffff; border-right: 1px solid #ebedf0; padding: 25px 20px; display: flex; flex-direction: column; z-index: 10; box-shadow: 2px 0 8px rgba(0,0,0,0.02); }
.logo { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; padding-left: 10px; }
.logo-text { font-size: 22px; font-weight: 800; color: #1f2937; letter-spacing: -0.5px; }
.badge { font-size: 10px; background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; vertical-align: super; }
.nav-item { padding: 12px 15px; border-radius: 8px; cursor: pointer; color: #4b5563; margin-bottom: 4px; display: flex; align-items: center; gap: 12px; font-size: 15px; transition: all 0.2s; }
.nav-item:hover, .nav-item.active { background-color: #eff6ff; color: #3b82f6; font-weight: 600; }
.nav-group { font-size: 12px; color: #9ca3af; margin: 30px 0 10px 15px; }
.nav-sub-item { padding: 8px 15px; font-size: 13px; color: #6b7280; cursor: pointer; border-radius: 8px; margin-bottom: 2px; }
.nav-sub-item:hover, .nav-sub-item.active { background: #f3f4f6; color: #111827; }
.main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
.top-header { height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: #fff; border-bottom: 1px solid #ebedf0; z-index: 5; }
.ai-input-wrapper { width: 450px; }
.scene-search :deep(.el-input__wrapper) { border-radius: 20px; background-color: #f3f4f6; box-shadow: none; padding-left: 15px; }
.scene-search :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #3b82f6 inset; background-color: #fff; }
.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; padding: 5px 10px; border-radius: 20px; }
.user-profile:hover { background: #f3f4f6; }
.user-name { font-size: 14px; color: #374151; font-weight: 500; }
.scroll-container { flex: 1; overflow-y: auto; padding: 30px 40px 120px; }

.discover-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; }
.hero-section h2 { font-size: 32px; font-weight: bold; color: #111827; margin: 0 0 8px 0; }
.theory-note { color: #6b7280; font-size: 14px; margin: 0; }
.view-toggle { display: flex; background: #f3f4f6; padding: 4px; border-radius: 12px; gap: 4px; }
.toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; font-size: 14px; color: #6b7280; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; }
.toggle-btn:hover { color: #1f2937; }
.toggle-btn.active { background: #fff; color: #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

.music-grid { padding-top: 10px; }
.song-card { border-radius: 12px; overflow: hidden; cursor: pointer; margin-bottom: 30px; background: transparent; transition: transform 0.3s ease; }
.song-card:hover { transform: translateY(-6px); }
.cover-box { position: relative; width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
.main-cover { width: 100%; height: 100%; transition: transform 0.5s ease; }
.song-card:hover .main-cover { transform: scale(1.05); }
.play-btn-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; backdrop-filter: blur(2px); }
.song-card:hover .play-btn-overlay { opacity: 1; }
.song-detail { padding: 12px 4px; }
.title { font-weight: 600; font-size: 15px; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.artist { color: #6b7280; font-size: 13px; margin-top: 4px; }

/* 🚀 极其霸道的 Grid 网格布局：强制左边占 1 份，中间占 80px，右边占 1 份！ */
.list-header { 
  display: grid; 
  grid-template-columns: 1fr 80px 1fr; 
  align-items: center;
  padding: 15px 30px; 
  font-size: 13px; 
  color: #9ca3af; 
  border-bottom: 1px solid #f3f4f6; 
}

.list-item { 
  display: grid; 
  grid-template-columns: 1fr 80px 1fr; 
  align-items: center; 
  padding: 15px 30px; 
  border-bottom: 1px solid #f9fafb; 
  cursor: pointer; 
  transition: background 0.2s; 
}

.list-item:hover { background: #f9fafb; }
.list-item.playing-item { background: #eff6ff; }
.list-item.playing-item .col-title, .list-item.playing-item .title-text { color: #3b82f6; font-weight: 600; }

/* 🚀 极其精妙的排版修复：让内部文字能够正确被截断，且不会把红心挤跑 */
.col-title { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #374151; font-weight: 500; min-width: 0; overflow: hidden; }
.title-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.col-like-cell { display: flex; justify-content: center; align-items: center; } 
.col-artist { display: flex; align-items: center; font-size: 14px; color: #6b7280; min-width: 0; overflow: hidden; }
.artist-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }

.music-list-view { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); padding: 10px 0; }

.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 播放器与浮层 */
.player-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 90px; background: #ffffff; border-top: 1px solid #ebedf0; display: flex; align-items: center; justify-content: center; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.03); transform: translateY(0); transition: 0.3s; }
.empty-player { color: #9ca3af; font-size: 14px; letter-spacing: 1px; }
.progress-slider-wrapper { position: absolute; top: -14px; left: 0; right: 0; z-index: 200; }
.player-slider :deep(.el-slider__runway) { height: 3px; background: #e5e7eb; margin: 0; }
.player-slider :deep(.el-slider__bar) { height: 3px; background-color: #3b82f6; }
.player-slider :deep(.el-slider__button) { width: 12px; height: 12px; border: 2px solid #fff; background-color: #3b82f6; }
.controls-content { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
.mini-cover { width: 52px; height: 52px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: cover; }
.meta { display: flex; flex-direction: column; gap: 4px; }
.t { font-weight: 600; font-size: 14px; color: #111827; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 150px;}
.a { font-size: 12px; color: #6b7280; }
.play-btns { display: flex; align-items: center; gap: 25px; justify-content: center; flex: 1; }
.main-play-btn { background: #3b82f6; border: none; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
.main-play-btn:hover { background: #2563eb; transform: scale(1.05); }
.prev-next-btn { color: #4b5563; }
.prev-next-btn:hover { color: #3b82f6; }
.extra-funcs { display: flex; align-items: center; gap: 20px; width: 30%; justify-content: flex-end; }
.time-display { font-size: 12px; font-family: monospace; color: #6b7280; }
.vol-icon { cursor: pointer; color: #4b5563; }
.mode-icon { cursor: pointer; color: #4b5563; transition: 0.3s; }
.mode-icon:hover { color: #3b82f6; }

.lyric-overlay { position: absolute; inset: 0; z-index: 50; background-size: cover; background-position: center; overflow: hidden; }
.lyric-blur-bg { position: absolute; inset: 0; background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(40px); }
.lyric-content-wrapper { position: relative; z-index: 2; display: flex; height: 100%; align-items: center; justify-content: center; gap: 100px; padding-bottom: 90px; }
.close-lyric-btn { position: absolute; top: 30px; right: 40px; z-index: 10; background: rgba(255,255,255,0.1) !important; color: #fff !important; border: none !important; }
.close-lyric-btn:hover { background: rgba(255,255,255,0.3) !important; }

.record-side { width: 350px; display: flex; justify-content: center; }
.record-wrapper { width: 320px; height: 320px; border-radius: 50%; background: #111; padding: 50px; box-shadow: 0 0 0 10px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.5); animation: spin 20s linear infinite; }
.record-wrapper.is-paused { animation-play-state: paused; }
.record-cover { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
@keyframes spin { 100% { transform: rotate(360deg); } }

.lyric-side { width: 550px; display: flex; flex-direction: column; color: #fff; text-align: center; }
.lyric-song-title { font-size: 32px; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 2px; }
.lyric-song-artist { font-size: 16px; color: rgba(255,255,255,0.6); margin: 0 0 40px 0; }
.lyric-scroll-box { height: 380px; overflow-y: auto; position: relative; padding: 60px 0; scroll-behavior: smooth; mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, black 10%, black 90%, rgba(0,0,0,0.3) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, black 10%, black 90%, rgba(0,0,0,0.3) 100%); }
.lyric-scroll-box::-webkit-scrollbar { display: none; }
.lyric-inner { position: relative; }
.lyric-line { min-height: 45px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.4); transition: all 0.3s; margin: 0; padding: 10px 30px; cursor: pointer; word-break: break-word; white-space: normal; }
.lyric-line:hover { color: rgba(255,255,255,0.8); }
.lyric-line.active { font-size: 22px; font-weight: bold; color: #fff; text-shadow: 0 0 15px rgba(255,255,255,0.3); transform: scale(1.05); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

@media screen and (max-width: 768px) {
  .sidebar { display: none; }
  .top-header { padding: 0 15px; }
  .ai-input-wrapper { width: 100%; }
  .scroll-container { padding: 15px 15px 120px; }
  .lyric-content-wrapper { flex-direction: column; gap: 30px; padding-bottom: 110px; justify-content: flex-start; padding-top: 50px; }
  .record-side { width: 220px; height: 220px; }
  .record-wrapper { width: 220px; height: 220px; padding: 30px; }
  .lyric-side { width: 100%; padding: 0 20px; }
  .lyric-scroll-box { height: 300px; padding: 40px 0; }
  .lyric-line { padding: 10px; font-size: 14px; }
  .lyric-line.active { font-size: 18px; }
  .lyric-song-title { font-size: 24px; }
  .controls-content { padding: 0 10px; }
  .track-info { width: 50%; gap: 10px; }
  .mini-cover { width: 40px; height: 40px; }
  .t { font-size: 13px; max-width: 100px; }
  .extra-funcs { display: none; } 
}

/* ================= 🚀 补回并升级的收藏按钮 CSS ================= */
.like-icon { margin-left: 15px; cursor: pointer; color: #9ca3af; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.like-icon:hover { transform: scale(1.2); color: #f87171; }
.like-icon.is-liked { color: #ef4444; }

.list-like-icon { cursor: pointer; color: #e5e7eb; transition: 0.3s; }
.list-like-icon:hover { color: #f87171; transform: scale(1.2); }
.list-like-icon.is-liked { color: #ef4444; }
</style>