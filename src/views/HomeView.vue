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
            class="scene-search ai-search-pulse"
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
          <el-avatar :size="36" :src="currentUser.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
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

        <section v-if="currentMenu === 'discover'" class="discover-section fade-in">
          
          <div class="hero-banner">
            <div class="hero-glow shape-1"></div>
            <div class="hero-glow shape-2"></div>
            
            <div class="hero-content">
              <h1 class="hero-title">探索 <span>无界</span> 音乐</h1>
              <p class="hero-subtitle">{{ discoverMode === 'ai' ? '通义千问 AI 正在为您感知时空，精准匹配专属频率。' : '潜入海量曲库，寻找属于你的灵魂共鸣。' }}</p>
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
                    <div class="bento-play-overlay">
                      <div class="bento-play-btn"><el-icon :size="28" color="#fff"><VideoPlay /></el-icon></div>
                    </div>
                    <div class="checkbox-overlay" v-if="isBatchMode" @click.stop>
                      <el-checkbox :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" size="large"/>
                    </div>
                  </div>
                  <div class="bento-info">
                    <div class="bento-title">{{ item.title }}</div>
                    <div class="bento-artist">{{ item.artist }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-playing': currentSong && currentSong.id === item.id }">
              <span class="modern-title-group">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:10px;"/>
                <span class="index-num" v-else-if="!currentSong || currentSong.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                
                <div class="modern-play-icon" v-if="!isBatchMode">
                  <el-icon v-if="currentSong && currentSong.id === item.id && isPlaying"><VideoPause /></el-icon>
                  <el-icon v-else><VideoPlay /></el-icon>
                </div>
                
                <span class="modern-title">{{ item.title }}</span>
              </span>
              
              <span class="col-like-cell">
                <el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)">
                  <component :is="isLiked(item.id) ? StarFilled : Star" />
                </el-icon>
              </span>
              
              <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

        <section v-else-if="currentMenu === 'radio'" class="hero-section fade-in">
          <div class="discover-header">
            <div>
              <h2>📡 Echo 私人智能 FM</h2>
              <p class="theory-note">AI 正在根据您的听歌基因，实时演算专属调频。</p>
            </div>
            <el-button type="primary" round @click="initRadio(true)" :loading="isRadioLoading">
              <el-icon><Refresh /></el-icon> 换一批调频
            </el-button>
          </div>

          <div class="radio-layout" v-loading="isRadioLoading">
            <el-empty v-if="radioMusicList.length === 0" description="正在接收宇宙电波..." style="width: 100%;" />
            <template v-else>
              <div class="radio-player-panel fade-in">
                <div class="fm-cover-wrapper" :class="{ 'is-playing': isPlaying }">
                  <el-image :src="currentSong?.coverUrl || radioMusicList[0]?.coverUrl" class="fm-cover" fit="cover" />
                  <div class="fm-center-hole"></div>
                </div>
                <div class="fm-info">
                  <h3>{{ currentSong?.title || radioMusicList[0]?.title }}</h3>
                  <p>{{ currentSong?.artist || radioMusicList[0]?.artist }}</p>
                </div>
              </div>
              <div class="radio-queue-panel fade-in">
                <h3 class="queue-title">即将播放队列</h3>
                <div class="modern-list-view queue-list">
                  <div class="modern-list-item" v-for="(item, index) in radioMusicList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-playing': currentSong && currentSong.id === item.id }">
                    <span class="modern-title-group">
                      <div class="track-status-box" v-if="!isBatchMode">
                        <span class="track-num">{{ (index + 1).toString().padStart(2, '0') }}</span>
                        <el-icon class="track-play"><VideoPlay /></el-icon>
                        <el-icon class="track-pause"><VideoPause /></el-icon>
                      </div>
                      <span class="modern-title">{{ item.title }}</span>
                    </span>
                    <span class="col-like-cell">
                      <el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="isLiked(item.id) ? StarFilled : Star" /></el-icon>
                    </span>
                    <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>

        <section v-else-if="currentMenu === 'sleep'" class="hero-section fade-in sleep-mode-bg">
          <div class="discover-header" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div>
              <h2 style="color: #fff;">🌙 深度助眠频段</h2>
              <p style="color: #9ca3af;">褪去白日的喧嚣，AI 为您精选的白噪音与轻音乐。</p>
            </div>
            <el-button type="primary" color="#4f46e5" round @click="initSleepMode(true)" :loading="isSleepLoading">
              <el-icon><Refresh /></el-icon> 重新生成梦境
            </el-button>
          </div>
          
          <div v-loading="isSleepLoading" element-loading-background="rgba(0, 0, 0, 0.4)">
            <el-empty v-if="sleepMusicList.length === 0 && !isSleepLoading" description="正在为您生成梦境频段..." />
            <div class="modern-list-view fade-in dark-list" v-else>
              <div class="modern-list-item" v-for="(item, index) in sleepMusicList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-playing': currentSong && currentSong.id === item.id }">
                <span class="modern-title-group">
                  <div class="track-status-box" v-if="!isBatchMode">
                    <span class="track-num">{{ (index + 1).toString().padStart(2, '0') }}</span>
                    <el-icon class="track-play"><VideoPlay /></el-icon>
                    <el-icon class="track-pause"><VideoPause /></el-icon>
                  </div>
                  <span class="modern-title">{{ item.title }}</span>
                </span>
                <span class="col-like-cell">
                  <el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="isLiked(item.id) ? StarFilled : Star" /></el-icon>
                </span>
                <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="currentMenu === 'profile'" class="hero-section fade-in">
          <div class="profile-container">
            <div class="profile-header">
              <div class="avatar-wrapper">
                <el-avatar :size="100" :src="currentUser?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
                <div class="avatar-edit"><el-icon><Edit /></el-icon></div>
              </div>
              <div class="profile-info">
                <h2>{{ currentUser?.username || '未命名架构师' }}</h2>
                <p>EchoScene 尊贵会员 ｜ 听歌品味：<el-tag size="small" type="success">极度硬核</el-tag></p>
              </div>
            </div>

            <el-row :gutter="20" class="stats-row">
              <el-col :span="8">
                <div class="stat-card">
                  <div class="stat-num">{{ likedMusicList.length }}</div>
                  <div class="stat-label">❤️ 累计红心</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card">
                  <div class="stat-num">{{ customPlaylists.length }}</div>
                  <div class="stat-label">💿 云端歌单</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card">
                  <div class="stat-num">{{ playHistory.length }}</div>
                  <div class="stat-label">🕒 历史足迹</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </section>

        <section v-else-if="['liked', 'history'].includes(currentMenu) || currentMenu.startsWith('playlist_')" class="hero-section fade-in">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
            <div>
              <h2 v-if="currentMenu === 'liked'">❤️ 我喜欢的音乐</h2>
              <h2 v-else-if="currentMenu === 'history'">🕒 最近播放</h2>
              <h2 v-else>💿 {{ currentActivePlaylist?.name }}</h2>
              
              <p class="theory-note" v-if="currentMenu === 'liked'">专属红心云端歌单。</p>
              <p class="theory-note" v-else-if="currentMenu === 'history'">最近畅听的 50 首歌曲。</p>
              <p class="theory-note" v-else>共 {{ currentActivePlaylist?.songs?.length || 0 }} 首云端歌曲</p>
            </div>
            <div style="display:flex; gap:10px;">
              <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode" v-if="activePlayList.length > 0">
                <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
              </el-button>
              <el-button type="danger" plain round @click="deletePlaylist(currentActivePlaylist?.id)" v-if="currentMenu.startsWith('playlist_')">删除该歌单</el-button>
            </div>
          </div>
          
          <el-empty v-if="activePlayList.length === 0" description="这里空空如也~" />
          
          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-playing': currentSong && currentSong.id === item.id }">
              <span class="modern-title-group">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:10px;"/>
                
                <div class="track-status-box" v-if="!isBatchMode">
                  <span class="track-num">{{ (index + 1).toString().padStart(2, '0') }}</span>
                  <el-icon class="track-play"><VideoPlay /></el-icon>
                  <el-icon class="track-pause"><VideoPause /></el-icon>
                </div>
                
                <span class="modern-title">{{ item.title }}</span>
              </span>
              
              <span class="col-like-cell">
                <el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': isLiked(item.id) }" @click.stop="toggleLike(item)">
                  <component :is="isLiked(item.id) ? StarFilled : Star" />
                </el-icon>
              </span>
              <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

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

    <el-dialog v-model="playlistDialogVisible" title="操作云端歌单" width="400px" top="30vh" append-to-body>
      <div v-if="selectedMusicIds.length > 0" style="margin-bottom:20px; color:#3b82f6; font-weight:bold;">已勾选 {{ selectedMusicIds.length }} 首歌曲</div>
      <el-input v-model="newPlaylistName" placeholder="输入新歌单名称..." maxlength="20"><template #append><el-button type="primary" @click="createNewPlaylist">创建并加入</el-button></template></el-input>
      <el-divider v-if="customPlaylists.length > 0">或加入已有云端歌单</el-divider>
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
        <div class="play-btns">
          <el-button link class="prev-next-btn" @click="playPrev"><el-icon :size="20"><ArrowLeftBold /></el-icon></el-button>
          
          <button class="pure-play-btn" @click="togglePlay">
            <svg v-if="!isPlaying" class="pure-play-icon" viewBox="0 0 24 24" width="22" height="22">
              <path d="M8 5v14l11-7z" fill="currentColor"></path>
            </svg>
            
            <svg v-else class="pure-pause-icon" viewBox="0 0 24 24" width="22" height="22">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"></path>
            </svg>
          </button>
          
          <el-button link class="prev-next-btn" @click="playNext"><el-icon :size="20"><ArrowRightBold /></el-icon></el-button>
        </div>
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
import { Compass, Mic, User, MagicStick, Search, VideoPlay, VideoPause, ArrowLeftBold, ArrowRightBold, Headset, Refresh, RefreshLeft, Star, StarFilled, List, ArrowDownBold, Check, Plus, Menu, RefreshRight, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getMusicListAPI, recommendMusicAPI, getUserPlaylistsAPI, createPlaylistAPI, deletePlaylistAPI, addMusicToPlaylistAPI, getPlaylistMusicAPI } from '../api/music'
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
    return customPlaylists.value.find(p => p.id == pId)
  }
  return null
})

const toggleBatchMode = () => { isBatchMode.value = !isBatchMode.value; selectedMusicIds.value = [] }
const toggleSelection = (id) => { const index = selectedMusicIds.value.indexOf(id); if (index > -1) selectedMusicIds.value.splice(index, 1); else selectedMusicIds.value.push(id) }

const handleItemClick = (item) => {
  if (isBatchMode.value) toggleSelection(item.id) 
  else selectSong(item) 
}

const openPlaylistDialog = () => {
  if (!currentUser.value) return ElMessage.warning('请先登录才能使用云端歌单哦！')
  if (selectedMusicIds.value.length === 0) return ElMessage.warning('请先勾选歌曲哦！')
  playlistDialogVisible.value = true
}

const batchLikeSongs = async () => {
  if (!currentUser.value) { return goToLogin() }
  if (selectedMusicIds.value.length === 0) return ElMessage.warning('请先勾选歌曲！')

  let successCount = 0
  for (let id of selectedMusicIds.value) {
    if (!isLiked(id)) {
      try { await likeMusicAPI(currentUser.value.id, id); successCount++ } catch (error) {}
    }
  }
  if (successCount > 0) { ElMessage.success(`❤️ 成功批量收藏 ${successCount} 首歌！`); await fetchMyLikes() } 
  else { ElMessage.info('歌曲都在收藏列表里啦~') }
  toggleBatchMode() 
}

const fetchMyPlaylists = async () => {
  if (!currentUser.value) return
  try { customPlaylists.value = await getUserPlaylistsAPI(currentUser.value.id) || [] } catch (error) {}
}

const createNewPlaylist = async () => {
  if (!newPlaylistName.value.trim()) return ElMessage.warning('请输入歌单名称！')
  try {
    await createPlaylistAPI(currentUser.value.id, newPlaylistName.value.trim())
    await fetchMyPlaylists() 
    const newPl = customPlaylists.value.find(p => p.name === newPlaylistName.value.trim())
    if (newPl && selectedMusicIds.value.length > 0) {
      for(let sid of selectedMusicIds.value) { await addMusicToPlaylistAPI(newPl.id, sid) }
      ElMessage.success('🎉 歌单创建并添加成功！')
    } else { ElMessage.success('🎉 歌单创建成功！') }
  } catch (error) { ElMessage.error('创建云端歌单失败') }
  newPlaylistName.value = ''; playlistDialogVisible.value = false; toggleBatchMode() 
}

const addToExistingPlaylist = async (pl) => {
  let successCount = 0
  for(let sid of selectedMusicIds.value) {
    try { await addMusicToPlaylistAPI(pl.id, sid); successCount++ } catch(e) {}
  }
  if (successCount > 0) ElMessage.success(`✅ 成功将 ${successCount} 首歌加入【${pl.name}】！`)
  playlistDialogVisible.value = false; toggleBatchMode()
  if (currentMenu.value === `playlist_${pl.id}`) loadPlaylistSongs(pl.id)
}

const deletePlaylist = (pId) => {
  ElMessageBox.confirm('确定要删除这个云端歌单吗？', '删除确认', { type: 'warning' }).then(async () => {
    try { await deletePlaylistAPI(pId); await fetchMyPlaylists(); currentMenu.value = 'discover'; ElMessage.success('歌单已删除') } catch (error) {}
  }).catch(() => {})
}

const loadPlaylistSongs = async (plId) => {
  try {
    const res = await getPlaylistMusicAPI(plId)
    const pl = customPlaylists.value.find(p => p.id == plId)
    if (pl) pl.songs = res || []
  } catch (error) {}
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
  if (!currentUser.value) return goToLogin()
  if (!song) return
  try {
    if (isLiked(song.id)) { await unlikeMusicAPI(currentUser.value.id, song.id); ElMessage.success('已取消收藏') } 
    else { await likeMusicAPI(currentUser.value.id, song.id); ElMessage.success('❤️ 收藏成功！') }
    await fetchMyLikes() 
  } catch (error) {}
}

const showLyricPanel = ref(false)   
const parsedLyrics = ref([])        
const currentLyricIndex = ref(0)    
const isLoadingLyric = ref(false)   
const lyricBoxRef = ref(null)       

watch(showLyricPanel, async (isOpen) => {
  if (isOpen) { await nextTick(); setTimeout(() => { if (lyricBoxRef.value && currentLyricIndex.value !== -1) lyricBoxRef.value.scrollTo({ top: currentLyricIndex.value * 45 }) }, 50) }
})

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

const isUserScrolling = ref(false)
let scrollTimeout = null           
const handleLyricScroll = () => {
  isUserScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => { isUserScrolling.value = false; if (currentLyricIndex.value !== -1 && lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: currentLyricIndex.value * 45, behavior: 'smooth' }) }, 3000) 
}

const seekToLyric = (time) => { if (audioRef.value) { audioRef.value.currentTime = time; audioRef.value.play(); isPlaying.value = true; isUserScrolling.value = false; if (scrollTimeout) clearTimeout(scrollTimeout) } }

const loadLyrics = async (song) => {
  parsedLyrics.value = []; currentLyricIndex.value = 0; isLoadingLyric.value = true
  if (lyricBoxRef.value) lyricBoxRef.value.scrollTo({ top: 0 })
  try {
    if (!song.lyricUrl) { isLoadingLyric.value = false; return }
    const response = await axios.get(song.lyricUrl)
    parsedLyrics.value = parseLrc(response.data)
  } catch (error) {} finally { isLoadingLyric.value = false }
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
  try { likedMusicList.value = await getLikedMusicAPI(currentUser.value.id) || [] } catch (error) {}
}

const handleLogout = () => {
  currentUser.value = null; likedMusicList.value = []; customPlaylists.value = [];
  localStorage.removeItem('echo_user'); localStorage.removeItem('echo_token'); router.push('/login')
}

const loadDiscoverData = async () => {
  try { const res = await getMusicListAPI(); allMusicList.value = res.data ? res.data : (res || []) } catch (error) {}
}

const isRadioLoading = ref(false)
const radioMusicList = ref([])

const initRadio = async (force = false) => {
  if (!force && radioMusicList.value.length > 0) return 
  isRadioLoading.value = true
  let dynamicPrompt = ''

  if (playHistory.value && playHistory.value.length > 0) {
    const songGenes = playHistory.value.slice(0, 5).map(s => `《${s.title}》(${s.artist})`).join('、')
    dynamicPrompt = `用户最近循环播放了这几首歌：${songGenes}。请你作为极其专业的音乐DJ，深度剖析这些歌曲的流派、情绪，推荐 10 首风格高度相似的极其好听的流行或电子音乐。`
    ElMessage.info('📡 正在解析听歌 DNA，演算私人频段...')
  } else {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 10) dynamicPrompt = '现在是清晨，推荐充满活力、节奏轻快的流行音乐'
    else if (hour >= 10 && hour < 18) dynamicPrompt = '现在是白天工作时间，推荐节奏感强、能提升专注力的音乐'
    else if (hour >= 18 && hour < 22) dynamicPrompt = '现在是傍晚，推荐放松身心、治愈的R&B或微醺爵士'
    else dynamicPrompt = '现在是深夜，推荐极其孤独、氛围感极强、适合一个人静静听的音乐'
    ElMessage.info('📡 正在感知此刻时空，为您生成专属调频...')
  }

  try {
    const data = await recommendMusicAPI(dynamicPrompt)
    radioMusicList.value = data || []
    if (radioMusicList.value.length > 0 && force) { selectSong(radioMusicList.value[0]) }
  } catch (error) { ElMessage.error('电台生成失败，请检查网络') } finally { isRadioLoading.value = false }
}

const isSleepLoading = ref(false)
const sleepMusicList = ref([])

const initSleepMode = async (force = false) => {
  if (!force && sleepMusicList.value.length > 0) return
  isSleepLoading.value = true
  ElMessage.info('🌙 正在为您编织助眠梦境...')
  try {
    sleepMusicList.value = await recommendMusicAPI('极度安静、适合深夜深度睡眠、让人放松的轻音乐、钢琴曲或白噪音') || []
  } catch (error) {} finally { isSleepLoading.value = false }
}

const handleSearch = async () => {
  if (!userInput.value.trim()) return ElMessage.warning('请输入场景描述哦')
  if (currentMenu.value !== 'discover') currentMenu.value = 'discover'
  discoverMode.value = 'ai'; isSearching.value = true
  try { aiMusicList.value = await recommendMusicAPI(userInput.value) || []; ElMessage.success('匹配成功！') } 
  catch (error) {} finally { isSearching.value = false }
}

const selectSong = (song) => {
  currentSong.value = song; isPlaying.value = true
  setTimeout(() => { if (audioRef.value) { audioRef.value.volume = volume.value / 100; audioRef.value.play() } }, 100)
}

const togglePlay = () => {
  if (!audioRef.value) return
  if (isPlaying.value) audioRef.value.pause()
  else audioRef.value.play()
  isPlaying.value = !isPlaying.value
}

const playPrev = () => {
  const index = activePlayList.value.findIndex(item => item.id === currentSong.value?.id)
  if (index === -1) return
  selectSong(activePlayList.value[(index - 1 + activePlayList.value.length) % activePlayList.value.length])
}

const playNext = () => {
  const index = activePlayList.value.findIndex(item => item.id === currentSong.value?.id)
  if (index === -1) return
  selectSong(activePlayList.value[(index + 1) % activePlayList.value.length])
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
  await loadDiscoverData()
  const savedUser = localStorage.getItem('echo_user')
  if (savedUser) { currentUser.value = JSON.parse(savedUser); await fetchMyLikes(); await fetchMyPlaylists() }
  const savedHistory = localStorage.getItem('echo_play_history')
  if (savedHistory) playHistory.value = JSON.parse(savedHistory)
})

const switchMenu = async (menuName) => {
  currentMenu.value = menuName; isBatchMode.value = false ; localSearchKeyword.value = '' 
  if (menuName === 'discover') await loadDiscoverData()
  else if (menuName === 'liked') await fetchMyLikes()
  else if (menuName.startsWith('playlist_')) await loadPlaylistSongs(menuName.split('_')[1])
  else if (menuName === 'radio') initRadio() 
  else if (menuName === 'sleep') initSleepMode() 
}
</script>

<style scoped>
/* 🌈 ================= 顶级大厂 Glassmorphism 核心 UI 升维 ================= 🌈 */

.discover-section { display: flex; flex-direction: column; gap: 20px; }

/* 1. 极其克制的 Apple Music 级侧边栏 */
.sidebar { width: 240px; background-color: #f4f4f5; border-right: none; padding: 35px 20px; display: flex; flex-direction: column; z-index: 10; }
.logo { display: flex; align-items: center; gap: 10px; margin-bottom: 45px; padding-left: 10px; }
.logo-text { font-size: 22px; font-weight: 800; color: #18181b; letter-spacing: -0.5px; }
.badge { font-size: 10px; background: #18181b; color: #fff; padding: 2px 6px; border-radius: 4px; vertical-align: super; }
.nav-group { font-size: 12px; color: #a1a1aa; font-weight: 700; margin: 35px 0 12px 10px; letter-spacing: 1px; }
.nav-item { padding: 10px 15px; border-radius: 8px; cursor: pointer; color: #52525b; margin-bottom: 2px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; transition: all 0.2s ease; }
.nav-item:hover { color: #18181b; background-color: #e4e4e7; }
.nav-item.active { background-color: #d4d4d8; color: #18181b; font-weight: 700; }
.nav-sub-item { padding: 10px 15px; font-size: 14px; color: #52525b; font-weight: 500; cursor: pointer; border-radius: 8px; margin-bottom: 2px; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
.nav-sub-item:hover { color: #18181b; background-color: #e4e4e7; }
.nav-sub-item.active { background-color: #d4d4d8; color: #18181b; font-weight: 700; }

/* 2. 极致纯粹的 Spotify 级底部播放器 */
.player-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 90px; background: rgba(255,255,255,0.85); backdrop-filter: saturate(180%) blur(20px); border-top: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; z-index: 100; }
.empty-player { color: #a1a1aa; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.progress-slider-wrapper { position: absolute; top: -14px; left: 0; right: 0; z-index: 200; }

/* 进度条去油：变成高级的暗黑色 */
.player-slider :deep(.el-slider__runway) { height: 4px; background: #e4e4e7; margin: 0; }
.player-slider :deep(.el-slider__bar) { height: 4px; background-color: #18181b; }
.player-slider :deep(.el-slider__button) { width: 12px; height: 12px; border: none; background-color: #18181b; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

.controls-content { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
.mini-cover { width: 56px; height: 56px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); object-fit: cover; transition: 0.3s; }
.mini-cover:hover { transform: scale(1.05); }
.meta { display: flex; flex-direction: column; gap: 4px; }
.t { font-weight: 700; font-size: 14px; color: #18181b; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 150px; }
.a { font-size: 12px; color: #71717a; font-weight: 500; }

.play-btns { display: flex; align-items: center; gap: 30px; justify-content: center; flex: 1; }

/* 🚀 播放按钮终极去油：摒弃蓝色大圆，采用纯净暗黑悬浮按钮 */
.main-play-btn { 
  background: #18181b !important; 
  border: none !important; 
  width: 44px !important; 
  height: 44px !important; 
  border-radius: 50% !important; 
  display: flex !important; 
  align-items: center !important; 
  justify-content: center !important; 
  color: #fff !important; 
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
}
.main-play-btn:hover { 
  background: #000 !important; 
  transform: scale(1.08) !important; 
  box-shadow: 0 6px 14px rgba(0,0,0,0.2) !important;
}
.main-play-btn .el-icon { font-size: 20px !important; margin-left: 2px; } /* 稍微往右偏一点点，视觉居中 */
.prev-next-btn { color: #71717a !important; transform: scale(1.3); transition: 0.2s; }
.prev-next-btn:hover { color: #18181b !important; transform: scale(1.4); }

.extra-funcs { display: flex; align-items: center; gap: 20px; width: 30%; justify-content: flex-end; }
.time-display { font-size: 12px; font-family: monospace; color: #71717a; font-weight: 600; }
.vol-icon { cursor: pointer; color: #71717a; }
.mode-icon { cursor: pointer; color: #71717a; transition: 0.3s; }
.mode-icon:hover { color: #18181b; }

/* 3. Bento 便当盒网格 (AI 卡片) */
.bento-grid { padding: 10px 0; }
.bento-card { background: #fff; border-radius: 24px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255,255,255,0.8); cursor: pointer; position: relative; margin-bottom: 20px;}
.bento-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(59,130,246,0.12); border-color: #e0e7ff; }
.bento-cover-box { width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden; position: relative; }
.bento-cover { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
.bento-card:hover .bento-cover { transform: scale(1.08); }
.bento-play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: center; opacity: 0; transition: all 0.3s ease; }
.bento-card:hover .bento-play-overlay { opacity: 1; }
.bento-play-btn { width: 50px; height: 50px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.8); box-shadow: none; backdrop-filter: none;}
.bento-play-btn .el-icon { font-size: 24px !important; }
.bento-info { padding: 16px 4px 4px; text-align: center; }
.bento-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bento-artist { font-size: 13px; color: #64748b; font-weight: 500; }
.checkbox-overlay { position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(255,255,255,0.95); border-radius: 8px; padding: 4px 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

/* 4. 漂浮胶囊列表 (全局极客曲库) */
.modern-list-view { display: flex; flex-direction: column; gap: 8px; padding: 10px 0;}
.modern-list-item { display: grid; grid-template-columns: 1fr 80px 1fr; align-items: center; padding: 16px 30px; background: #fff; border-radius: 20px; transition: all 0.3s ease; border: 1px solid transparent; box-shadow: 0 4px 15px rgba(0,0,0,0.02); cursor: pointer; position: relative; overflow: hidden; }
.modern-list-item:hover { transform: scale(1.01); box-shadow: 0 10px 25px rgba(0,0,0,0.06); z-index: 1; border-color: #f1f5f9; }
.modern-list-item.is-playing { background: linear-gradient(to right, #eff6ff, #fff); border-color: #bfdbfe; }
.modern-title-group { display: flex; align-items: center; gap: 16px; }

/* 🚀 强行干掉之前的丑陋大圆圈，换成 Spotify 级极简悬浮体验 */
.track-status-box { width: 30px; text-align: center; display: flex; justify-content: center; align-items: center; color: #94a3b8; }
.track-play, .track-pause { display: none; font-size: 22px; cursor: pointer; }

/* 默认状态：显示数字，隐藏图标 */
.modern-list-item .track-num { display: block; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }

/* 悬浮状态：隐藏数字，显示播放图标 */
.modern-list-item:hover .track-num { display: none; }
/* 🚀 同步更新：让列表悬浮图标也变成极简灰色 */
.modern-list-item:hover .track-play { color: #94a3b8 !important; }

/* 播放中状态：锁定为暂停图标（或跳动的音轨），并且变成主题色 */
.modern-list-item.is-playing .track-num { display: none; }
.modern-list-item.is-playing .track-play { display: none; }
/* 🚀 播放中状态锁定为黑色，保持极简 */
.modern-list-item.is-playing .track-pause { color: #18181b !important; }

/* 🚀 播放按钮终极返璞归真：采用图片里的极简兜底图案风格 */

/* 🚀 彻底重构的几何播放按钮 */
.pure-play-btn { 
  background: #fff; 
  border: 1px solid #e2e8f0; 
  width: 50px; 
  height: 50px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #94a3b8; /* 图片里那种极其克制的高级灰 */
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
  box-shadow: 0 4px 10px rgba(0,0,0,0.02); 
  padding: 0;
  outline: none;
  cursor: pointer;
}
.pure-play-btn:hover { 
  background: #f8fafc; 
  transform: scale(1.05); 
  box-shadow: 0 6px 14px rgba(0,0,0,0.05);
  color: #64748b;
}

/* 🎯 重点来了！强制修正三角形的视觉重心，只偏移动三角形！ */
.pure-play-icon {
  margin-left: 3px; 
}

/* 🎯 暂停的双竖线绝对不受影响，稳稳地钉在正中心！ */
.pure-pause-icon {
  margin: 0;
}

/* 顺便把切歌按钮也变成灰色，保持视觉统一 */
.prev-next-btn { color: #94a3b8 !important; transform: scale(1.3); transition: 0.2s; }
.prev-next-btn:hover { color: #18181b !important; transform: scale(1.4); }

/* 顺手把上方 AI 便当盒的厚重按钮也削薄！ */
.bento-play-btn { width: 50px; height: 50px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.8); box-shadow: none; backdrop-filter: none;}
.bento-play-btn .el-icon { font-size: 24px !important; }

.index-num { font-size: 14px; font-weight: bold; color: #cbd5e1; width: 24px; text-align: center; font-variant-numeric: tabular-nums;}
.modern-title { font-size: 16px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px;}
.modern-list-item.is-playing .modern-title { color: #3b82f6; }
.modern-artist { font-size: 14px; color: #64748b; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;}
.ai-search-pulse :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 2px #3b82f6 inset, 0 0 15px rgba(59,130,246,0.3); }

/* ================= 其他保留的顶级框架样式 ================= */
.batch-action-bar { position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%); background: #111827; color: white; padding: 12px 30px; border-radius: 40px; z-index: 200; display: flex; gap: 30px; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-weight: bold; }
.playlist-options { margin-top: 15px; display: flex; flex-direction: column; gap: 8px; }
.pl-option { padding: 10px 15px; background: #f3f4f6; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; color: #374151; font-weight: 500; }
.pl-option:hover { background: #e0e7ff; color: #3b82f6; }

:global(body), :global(html), :global(#app) { margin: 0; padding: 0; height: 100%; width: 100%; box-sizing: border-box; }
*, *::before, *::after { box-sizing: border-box; }
.main-layout { display: flex; width: 100vw; height: 100vh; background-color: #f8fafc; color: #333; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
.sidebar { width: 240px; background-color: #ffffff; border-right: 1px solid #f1f5f9; padding: 25px 20px; display: flex; flex-direction: column; z-index: 10; box-shadow: 4px 0 15px rgba(0,0,0,0.01); }
.logo { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; padding-left: 10px; }
.logo-text { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
.badge { font-size: 10px; background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; vertical-align: super; }
.nav-item { padding: 12px 15px; border-radius: 12px; cursor: pointer; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 500; transition: all 0.2s; }
.nav-item:hover, .nav-item.active { background-color: #eff6ff; color: #3b82f6; font-weight: 700; }
.nav-group { font-size: 12px; color: #94a3b8; font-weight: 700; margin: 30px 0 10px 15px; letter-spacing: 0.5px;}
.nav-sub-item { padding: 10px 15px; font-size: 14px; color: #475569; font-weight: 500; cursor: pointer; border-radius: 10px; margin-bottom: 4px; transition: 0.2s;}
.nav-sub-item:hover, .nav-sub-item.active { background: #f1f5f9; color: #0f172a; }
.main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
.top-header { height: 76px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; z-index: 5; }
.ai-input-wrapper { width: 480px; }
.scene-search :deep(.el-input__wrapper) { border-radius: 20px; background-color: #f1f5f9; box-shadow: none; padding-left: 15px; }
.scene-search :deep(.el-input__wrapper.is-focus) { background-color: #fff; }
.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; padding: 6px 12px; border-radius: 24px; }
.user-profile:hover { background: #f1f5f9; }
.user-name { font-size: 14px; color: #334155; font-weight: 600; }
.scroll-container { flex: 1; overflow-y: auto; padding: 30px 40px 120px; }

.discover-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
.hero-section h2 { font-size: 36px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -1px;}
.theory-note { color: #64748b; font-size: 15px; margin: 0; font-weight: 500;}

.fade-in { animation: fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* 播放器 */
.player-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 90px; background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; z-index: 100; box-shadow: 0 -10px 30px rgba(0,0,0,0.02); }
.empty-player { color: #94a3b8; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.progress-slider-wrapper { position: absolute; top: -14px; left: 0; right: 0; z-index: 200; }
.player-slider :deep(.el-slider__runway) { height: 4px; background: #e2e8f0; margin: 0; }
.player-slider :deep(.el-slider__bar) { height: 4px; background-color: #3b82f6; }
.player-slider :deep(.el-slider__button) { width: 14px; height: 14px; border: 3px solid #fff; background-color: #3b82f6; box-shadow: 0 2px 6px rgba(0,0,0,0.2);}
.controls-content { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
.mini-cover { width: 56px; height: 56px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); object-fit: cover; transition: 0.3s;}
.mini-cover:hover { transform: scale(1.05); }
.meta { display: flex; flex-direction: column; gap: 4px; }
.t { font-weight: 700; font-size: 15px; color: #0f172a; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 150px;}
.a { font-size: 13px; color: #64748b; font-weight: 500;}
.play-btns { display: flex; align-items: center; gap: 25px; justify-content: center; flex: 1; }
.extra-funcs { display: flex; align-items: center; gap: 20px; width: 30%; justify-content: flex-end; }
.time-display { font-size: 13px; font-family: monospace; color: #64748b; font-weight: 600;}
.vol-icon { cursor: pointer; color: #64748b; }
.mode-icon { cursor: pointer; color: #64748b; transition: 0.3s; }
.mode-icon:hover { color: #3b82f6; }

.lyric-overlay { position: absolute; inset: 0; z-index: 50; background-size: cover; background-position: center; overflow: hidden; }
.lyric-blur-bg { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(50px); }
.lyric-content-wrapper { position: relative; z-index: 2; display: flex; height: 100%; align-items: center; justify-content: center; gap: 100px; padding-bottom: 90px; }
.close-lyric-btn { position: absolute; top: 30px; right: 40px; z-index: 10; background: rgba(255,255,255,0.1) !important; color: #fff !important; border: none !important; backdrop-filter: blur(10px);}
.close-lyric-btn:hover { background: rgba(255,255,255,0.2) !important; transform: scale(1.1);}

.record-side { width: 350px; display: flex; justify-content: center; }
.record-wrapper { width: 340px; height: 340px; border-radius: 50%; background: #000; padding: 50px; box-shadow: 0 0 0 12px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.6); animation: spin 20s linear infinite; }
.record-wrapper.is-paused { animation-play-state: paused; }
.record-cover { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
@keyframes spin { 100% { transform: rotate(360deg); } }

.lyric-side { width: 550px; display: flex; flex-direction: column; color: #fff; text-align: center; }
.lyric-song-title { font-size: 36px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 2px; }
.lyric-song-artist { font-size: 18px; color: rgba(255,255,255,0.6); margin: 0 0 40px 0; font-weight: 500;}
.lyric-scroll-box { height: 380px; overflow-y: auto; position: relative; padding: 60px 0; scroll-behavior: smooth; mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, black 10%, black 90%, rgba(0,0,0,0.3) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, black 10%, black 90%, rgba(0,0,0,0.3) 100%); }
.lyric-scroll-box::-webkit-scrollbar { display: none; }
.lyric-inner { position: relative; }
.lyric-line { min-height: 45px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.3); transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); margin: 0; padding: 10px 30px; cursor: pointer; word-break: break-word; white-space: normal; font-weight: 600;}
.lyric-line:hover { color: rgba(255,255,255,0.8); }
.lyric-line.active { font-size: 24px; font-weight: 900; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.4); transform: scale(1.05); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

.like-icon { margin-left: 15px; cursor: pointer; color: #94a3b8; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.like-icon:hover { transform: scale(1.2); color: #f87171; }
.like-icon.is-liked { color: #ef4444; }
.list-like-icon { cursor: pointer; color: #cbd5e1; transition: 0.3s; }
.list-like-icon:hover { color: #f87171; transform: scale(1.2); }
.list-like-icon.is-liked { color: #ef4444; }

/* 电台、助眠、个人中心 极客样式 */
.radio-layout { display: flex; gap: 30px; align-items: flex-start; }
.radio-player-panel { flex: 0 0 320px; display: flex; flex-direction: column; align-items: center; background: #fff; padding: 40px 20px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); position: sticky; top: 20px; border: 1px solid #f1f5f9;}
.radio-queue-panel { flex: 1; min-width: 0; }
.queue-title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 15px 5px; letter-spacing: -0.5px; }
.fm-cover-wrapper { width: 240px; height: 240px; border-radius: 50%; box-shadow: 0 15px 35px rgba(0,0,0,0.2); position: relative; overflow: hidden; animation: spin 20s linear infinite; animation-play-state: paused; border: 6px solid #0f172a; margin-bottom: 25px; }
.fm-cover-wrapper.is-playing { animation-play-state: running; }
.fm-cover { width: 100%; height: 100%; }
.fm-center-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 45px; height: 45px; background: #f8fafc; border-radius: 50%; border: 3px solid #333; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
.fm-info { text-align: center; width: 100%; }
.fm-info h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fm-info p { color: #64748b; font-size: 14px; margin: 0; font-weight: 500;}
.queue-list { background: transparent; box-shadow: none; padding: 0;}

.sleep-mode-bg { background: linear-gradient(135deg, #0f172a, #1e1b4b); border-radius: 28px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.3) inset; border: 1px solid rgba(255,255,255,0.1);}
.dark-list { background: transparent !important; padding: 0;}
.dark-list .modern-list-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #fff; box-shadow: none;}
.dark-list .modern-list-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1);}
.dark-list .modern-title, .dark-list .modern-artist { color: #e2e8f0; }
.dark-list .modern-list-item.is-playing { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3);}
.dark-list .modern-list-item.is-playing .modern-title { color: #93c5fd; }
.dark-list .modern-play-icon { background: rgba(255,255,255,0.1); color: #cbd5e1;}

.profile-container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 28px; padding: 50px; box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;}
.profile-header { display: flex; align-items: center; gap: 35px; margin-bottom: 60px; }
.avatar-wrapper { position: relative; cursor: pointer; }
.avatar-edit { position: absolute; bottom: 0; right: 0; background: #3b82f6; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; transition: 0.3s; box-shadow: 0 4px 10px rgba(59,130,246,0.3);}
.avatar-wrapper:hover .avatar-edit { transform: scale(1.1); background: #2563eb; }
.profile-info h2 { font-size: 32px; font-weight: 900; margin: 0 0 12px 0; color: #0f172a; letter-spacing: -1px;}
.profile-info p { margin: 0; color: #64748b; display: flex; align-items: center; gap: 10px; font-weight: 500;}
.stats-row { text-align: center; }
.stat-card { padding: 35px 20px; background: #f8fafc; border-radius: 24px; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid transparent;}
.stat-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.04); border-color: #e2e8f0; background: #fff;}
.stat-num { font-size: 42px; font-weight: 900; color: #3b82f6; margin-bottom: 12px; font-family: monospace; letter-spacing: -2px;}
.stat-label { font-size: 15px; color: #64748b; font-weight: 700; letter-spacing: 1px; }
</style>
