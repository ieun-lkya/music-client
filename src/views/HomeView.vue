<template>
  <div class="main-layout">
    <Sidebar @switch-menu="switchMenu" @open-playlist-dialog="openPlaylistDialog" />

    <main class="main-content">
      <header class="top-header">
        <div class="ai-input-wrapper">
          <el-input v-if="musicStore.currentMenu === 'discover' && discoverMode === 'ai'" v-model="userInput" placeholder="描述此刻场景，让 AI 懂你，例如：失恋后看雨..." class="scene-search ai-search-pulse" @keyup.enter="handleSearch">
            <template #prefix><el-icon class="el-input__icon"><Search /></el-icon></template>
            <template #suffix><el-button type="primary" link class="match-btn" :loading="isSearching" @click="handleSearch">AI 匹配</el-button></template>
          </el-input>
          <el-input v-else v-model="localSearchKeyword" :placeholder="searchPlaceholder" class="scene-search local-search" clearable @keyup.enter="executeGlobalSearch">
            <template #prefix><el-icon class="el-input__icon"><Search /></el-icon></template>
            <template #suffix><el-button type="primary" link :loading="isGlobalSearching" @click="executeGlobalSearch">全站搜索</el-button></template>
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
            <el-empty v-if="aiMusicList.length === 0" description="在顶部输入场景，召唤 AI 为您匹配吧！" :image-size="200" />
            <el-row :gutter="25" class="bento-grid" v-else>
              <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="item in aiMusicList" :key="item.id">
                <div class="bento-card" @click="handleItemClick(item)">
                  <div class="bento-cover-box">
                    <el-image :src="item.coverUrl" fit="cover" lazy class="bento-cover" />
                    <div class="bento-play-overlay">
                      <div class="bento-play-btn">
                        <el-icon :size="28" color="#fff">
                          <component :is="musicStore.currentSong?.id === item.id && musicStore.isPlaying ? VideoPause : VideoPlay" />
                        </el-icon>
                      </div>
                    </div>
                    <div class="checkbox-overlay" v-if="isBatchMode" @click.stop><el-checkbox :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" size="large"/></div>
                  </div>
                  <div class="bento-info"><div class="bento-title">{{ item.title }}</div><div class="bento-artist">{{ item.artist }}</div></div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
              <span class="modern-title-group">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:10px;"/>
                <div class="track-status-box" v-if="!isBatchMode">
                  <span class="track-num" v-show="musicStore.currentSong?.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                  <el-icon class="track-play" v-show="musicStore.currentSong?.id !== item.id"><VideoPlay /></el-icon>
                  <el-icon class="track-playing-icon" v-show="musicStore.currentSong?.id === item.id && musicStore.isPlaying"><VideoPause /></el-icon>
                  <el-icon class="track-paused-icon" v-show="musicStore.currentSong?.id === item.id && !musicStore.isPlaying"><VideoPlay /></el-icon>
                </div>
                <span class="modern-title" :class="{'active-text': musicStore.currentSong?.id === item.id}">{{ item.title }}</span>
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
                  <el-image :src="musicStore.currentSong?.coverUrl || radioMusicList[0]?.coverUrl || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="fm-cover" fit="cover" />
                  <div class="fm-center-hole"></div>
                </div>
                <div class="fm-info"><h3>{{ musicStore.currentSong?.title || radioMusicList[0]?.title }}</h3><p>{{ musicStore.currentSong?.artist || radioMusicList[0]?.artist }}</p></div>
              </div>
              <div class="radio-queue-panel fade-in">
                <h3 class="queue-title">即将播放队列</h3>
                <div class="modern-list-view queue-list">
                  <div class="modern-list-item" v-for="(item, index) in radioMusicList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
                    <span class="modern-title-group">
                      <div class="track-status-box" style="margin-right: 0;">
                        <span class="track-num" v-show="musicStore.currentSong?.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                        <el-icon class="track-play" v-show="musicStore.currentSong?.id !== item.id"><VideoPlay /></el-icon>
                        <el-icon class="track-playing-icon" v-show="musicStore.currentSong?.id === item.id && musicStore.isPlaying"><VideoPause /></el-icon>
                        <el-icon class="track-paused-icon" v-show="musicStore.currentSong?.id === item.id && !musicStore.isPlaying"><VideoPlay /></el-icon>
                      </div>
                      <span class="modern-title" :class="{'active-text': musicStore.currentSong?.id === item.id}">{{ item.title }}</span>
                    </span>
                    <span class="col-like-cell"><el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': musicStore.isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="musicStore.isLiked(item.id) ? StarFilled : Star" /></el-icon></span>
                    <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>

        <section v-else-if="musicStore.currentMenu === 'sleep'" class="hero-section fade-in sleep-mode-bg">
          <div class="discover-header" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div><h2 style="color: #fff;">🌙 深度助眠频段</h2><p style="color: #9ca3af;">褪去白日的喧嚣，AI 为您精选的白噪音与轻音乐。</p></div>
            <el-button type="primary" color="#4f46e5" round @click="initSleepMode(true)" :loading="isSleepLoading"><el-icon><Refresh /></el-icon> 重新生成梦境</el-button>
          </div>
          <div v-loading="isSleepLoading" element-loading-background="rgba(0, 0, 0, 0.4)">
            <el-empty v-if="sleepMusicList.length === 0 && !isSleepLoading" description="正在为您生成梦境频段..." />
            <div class="modern-list-view fade-in dark-list" v-else>
              <div class="modern-list-item" v-for="(item, index) in sleepMusicList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
                <span class="modern-title-group">
                  <div class="track-status-box" style="margin-right: 0;">
                    <span class="track-num" v-show="musicStore.currentSong?.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                    <el-icon class="track-play" v-show="musicStore.currentSong?.id !== item.id"><VideoPlay /></el-icon>
                    <el-icon class="track-playing-icon" v-show="musicStore.currentSong?.id === item.id && musicStore.isPlaying"><VideoPause /></el-icon>
                    <el-icon class="track-paused-icon" v-show="musicStore.currentSong?.id === item.id && !musicStore.isPlaying"><VideoPlay /></el-icon>
                  </div>
                  <span class="modern-title" :class="{'active-text': musicStore.currentSong?.id === item.id}">{{ item.title }}</span>
                </span>
                <span class="col-like-cell"><el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': musicStore.isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="musicStore.isLiked(item.id) ? StarFilled : Star" /></el-icon></span>
                <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="musicStore.currentMenu === 'profile'" class="hero-section fade-in">
          <div class="profile-container">
            <div class="profile-header">
              <div class="avatar-wrapper" @click="openProfileEditor">
                <el-avatar :size="100" :src="musicStore.currentUser?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
                <div class="avatar-edit"><el-icon><Edit /></el-icon></div>
              </div>
              <div class="profile-info">
                <h2>{{ musicStore.currentUser?.username || '神秘听众' }}<el-button type="primary" link @click="openProfileEditor"><el-icon><EditPen /></el-icon> 编辑名片</el-button></h2>
                <p>🎵 {{ musicStore.currentUser?.signature || '用音乐记录生活，寻找灵魂共鸣...' }}</p>
                <p style="margin-top: 5px; font-size: 13px;">EchoScene 尊贵用户 ｜ 听歌品味：<el-tag size="small" type="success" effect="dark">极致硬核</el-tag></p>
              </div>
            </div>
            <el-row :gutter="20" class="stats-row">
              <el-col :span="8"><div class="stat-card"><div class="stat-num">{{ musicStore.likedMusicList.length }}</div><div class="stat-label">❤️ 累计红心</div></div></el-col>
              <el-col :span="8"><div class="stat-card"><div class="stat-num">{{ musicStore.customPlaylists.length }}</div><div class="stat-label">💿 云端歌单</div></div></el-col>
              <el-col :span="8"><div class="stat-card"><div class="stat-num">{{ musicStore.playHistory.length }}</div><div class="stat-label">🕒 历史足迹</div></div></el-col>
            </el-row>
          </div>
        </section>

        <section v-else-if="musicStore.currentMenu === 'square'" class="hero-section fade-in">
          <div class="discover-header">
            <div>
              <h2>🌍 云端歌单广场</h2>
              <p class="theory-note">探索全站音乐达人创建的精选集，寻找灵魂共鸣。</p>
            </div>
            <el-button type="primary" plain round @click="switchMenu('square')"><el-icon><Refresh /></el-icon> 刷新广场</el-button>
          </div>
          
          <el-row :gutter="25" class="bento-grid">
            <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="pl in squarePlaylists" :key="pl.id">
              <div class="bento-card" @click="openSquarePlaylist(pl)">
                <div class="bento-cover-box" style="background: linear-gradient(135deg, #e0e7ff 0%, #bae6fd 100%); display:flex; justify-content:center; align-items:center;">
                  <el-icon :size="48" color="#3b82f6"><DataBoard /></el-icon>
                </div>
                <div class="bento-info">
                  <div class="bento-title"> {{ pl.name }} </div>
                  <div class="bento-artist">创建者: @{{ pl.creatorName || '神秘达人' }} </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </section>

        <section v-else-if="musicStore.currentMenu === 'search_results'" class="hero-section fade-in">
          <div class="discover-header">
            <div>
              <h2>🔍 探索全网</h2>
              <p class="theory-note">关于「{{ lastSearchKeyword }}」的检索结果，共发现 {{ searchMusicList.length }} 首灵魂共鸣。</p>
            </div>
            <div style="display:flex; gap:10px;">
              <el-button type="primary" round @click="playAllSearch" v-if="searchMusicList.length > 0">
                <el-icon style="margin-right: 5px;"><VideoPlay /></el-icon> 播放全部
              </el-button>
              <el-button plain round @click="switchMenu('discover')">返回大厅</el-button>
            </div>
          </div>
          
          <el-empty v-if="searchMusicList.length === 0" description="在这片星系中，没有找到与此相关的频率..." />
          
          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in searchMusicList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
              <span class="modern-title-group">
                <div class="track-status-box">
                  <span class="track-num" v-show="musicStore.currentSong?.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                  <el-icon class="track-play" v-show="musicStore.currentSong?.id !== item.id"><VideoPlay /></el-icon>
                  <el-icon class="track-playing-icon" v-show="musicStore.currentSong?.id === item.id && musicStore.isPlaying"><VideoPause /></el-icon>
                  <el-icon class="track-paused-icon" v-show="musicStore.currentSong?.id === item.id && !musicStore.isPlaying"><VideoPlay /></el-icon>
                </div>
                <span class="modern-title" :class="{'active-text': musicStore.currentSong?.id === item.id}">{{ item.title }}</span>
              </span>
              <span class="col-like-cell"><el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': musicStore.isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="musicStore.isLiked(item.id) ? StarFilled : Star" /></el-icon></span>
              <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

        <section v-else-if="['liked', 'history', 'public_playlist'].includes(musicStore.currentMenu) || musicStore.currentMenu.startsWith('playlist_')" class="hero-section fade-in">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
            <div>
              <h2 v-if="musicStore.currentMenu === 'liked'">❤️ 我喜欢的音乐</h2>
              <h2 v-else-if="musicStore.currentMenu === 'history'">🕒 最近播放</h2>
              <h2 v-else-if="musicStore.currentMenu === 'public_playlist'">🌍 {{ publicPlaylistData.name }} </h2>
              <h2 v-else>💿 {{ currentActivePlaylist?.name }} </h2>

              <p class="theory-note" v-if="musicStore.currentMenu === 'public_playlist'">By @ {{ publicPlaylistData.creator }} · 共 {{ publicPlaylistData.songs.length }} 首歌曲</p>
              <p class="theory-note" v-else-if="musicStore.currentMenu === 'liked'">专属红心云端歌单。</p>
              <p class="theory-note" v-else-if="musicStore.currentMenu === 'history'">最近畅听的 50 首歌曲。</p>
              <p class="theory-note" v-else>共 {{ currentActivePlaylist?.songs?.length || 0 }} 首云端歌曲</p>
            </div>
            <div style="display:flex; gap:10px;">
              <el-button type="primary" round @click="playAllPublic" v-if="musicStore.currentMenu === 'public_playlist' && activePlayList.length > 0">
                <el-icon style="margin-right: 5px;"><VideoPlay /></el-icon> 播放全部
              </el-button>
              <el-button type="success" plain round @click="collectAllPublic" v-if="musicStore.currentMenu === 'public_playlist' && activePlayList.length > 0">
                <el-icon style="margin-right: 5px;"><Star /></el-icon> 收藏全部
              </el-button>

              <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode" v-if="activePlayList.length > 0">
                <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
              </el-button>
              <el-button type="danger" plain round @click="deletePlaylist(currentActivePlaylist?.id)" v-if="musicStore.currentMenu.startsWith('playlist_')">删除该歌单</el-button>
            </div>
          </div>
          
          <el-empty v-if="activePlayList.length === 0" description="这里空空如也~" />
          
          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
              <span class="modern-title-group">
                <el-checkbox v-if="isBatchMode" :model-value="selectedMusicIds.includes(item.id)" @change="toggleSelection(item.id)" @click.stop style="margin-right:10px;"/>
                <div class="track-status-box" v-if="!isBatchMode">
                  <span class="track-num" v-show="musicStore.currentSong?.id !== item.id">{{ (index + 1).toString().padStart(2, '0') }}</span>
                  <el-icon class="track-play" v-show="musicStore.currentSong?.id !== item.id"><VideoPlay /></el-icon>
                  <el-icon class="track-playing-icon" v-show="musicStore.currentSong?.id === item.id && musicStore.isPlaying"><VideoPause /></el-icon>
                  <el-icon class="track-paused-icon" v-show="musicStore.currentSong?.id === item.id && !musicStore.isPlaying"><VideoPlay /></el-icon>
                </div>
                <span class="modern-title" :class="{'active-text': musicStore.currentSong?.id === item.id}">{{ item.title }}</span>
              </span>
              <span class="col-like-cell"><el-icon :size="20" class="list-like-icon" :class="{ 'is-liked': musicStore.isLiked(item.id) }" @click.stop="toggleLike(item)"><component :is="musicStore.isLiked(item.id) ? StarFilled : Star" /></el-icon></span>
              <span class="col-artist"><span class="modern-artist">{{ item.artist }}</span></span>
            </div>
          </div>
        </section>

      </div>
      
      <LyricOverlay />
    </main>

    <el-dialog v-model="profileDialogVisible" title="定制音乐名片" width="400px" top="25vh" append-to-body class="glass-dialog">
      <div class="profile-editor-box">
        <div class="upload-area">
          <el-upload class="avatar-uploader" :show-file-list="false" :http-request="customUploadAvatar">
            <img v-if="editProfileForm.avatar" :src="editProfileForm.avatar" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            <div class="upload-hint">点击更换音乐头像</div>
          </el-upload>
        </div>
        <el-input v-model="editProfileForm.username" placeholder="你的专属音乐昵称" maxlength="15" size="large" style="margin-bottom: 15px;">
          <template #prefix><el-icon><User /></el-icon></template>
        </el-input>
        <el-input v-model="editProfileForm.signature" type="textarea" :rows="3" placeholder="写下你的个性签名，让懂你的人在此停留..." maxlength="50" show-word-limit />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="profileDialogVisible = false" round>取消</el-button>
          <el-button type="primary" @click="submitProfileUpdate" :loading="isProfileUpdating" round>保存名片</el-button>
        </span>
      </template>
    </el-dialog>

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
import { Search, VideoPlay, VideoPause, Star, StarFilled, List, Check, Menu, MagicStick, Refresh, Edit, EditPen, Plus, User, DataBoard } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import Sidebar from '../components/layout/Sidebar.vue'
import PlayerBar from '../components/player/PlayerBar.vue'
import LyricOverlay from '../components/player/LyricOverlay.vue'
import { useMusicStore } from '../store/music'

import { getMusicListAPI, recommendMusicAPI, getUserPlaylistsAPI, createPlaylistAPI, deletePlaylistAPI, addMusicToPlaylistAPI, getPlaylistMusicAPI, getAllPlaylistsAPI, searchMusicAPI, uploadFileAPI } from '../api/music'
import { likeMusicAPI, unlikeMusicAPI, getLikedMusicAPI, updateUserAPI } from '../api/user'

const router = useRouter()
const goToLogin = () => router.push('/login')
const musicStore = useMusicStore()

const discoverMode = ref('library') 
const userInput = ref('')
const isSearching = ref(false)
const localSearchKeyword = ref('')

// 🚀 新增：广场数据状态
const squarePlaylists = ref([])
const publicPlaylistData = ref({ name: '', creator: '', songs: [] })

const allMusicList = ref([]); const aiMusicList = ref([]); const radioMusicList = ref([]); const sleepMusicList = ref([])
const isRadioLoading = ref(false); const isSleepLoading = ref(false)

const isBatchMode = ref(false); const selectedMusicIds = ref([])
const playlistDialogVisible = ref(false); const newPlaylistName = ref('')

const searchPlaceholder = computed(() => {
  if (musicStore.currentMenu === 'discover') return '极速检索全站曲库...'
  return '极速检索歌名/歌手...'
})

// 🚀 终极修正 1：必须先声明 rawActivePlayList！
const rawActivePlayList = computed(() => {
  if (musicStore.currentMenu === 'liked') return musicStore.likedMusicList
  if (musicStore.currentMenu === 'history') return musicStore.playHistory
  if (musicStore.currentMenu.startsWith('playlist_')) return currentActivePlaylist.value?.songs || []
  if (musicStore.currentMenu === 'public_playlist') return publicPlaylistData.value.songs 
  if (musicStore.currentMenu === 'search_results') return searchMusicList.value // 接管搜索数据
  if (musicStore.currentMenu === 'discover') return discoverMode.value === 'library' ? allMusicList.value : aiMusicList.value
  return []
})

// 🚀 终极修正 2：然后再声明 activePlayList（因为它依赖了上面的 rawActivePlayList.value）
const activePlayList = computed(() => {
  const list = rawActivePlayList.value
  // 如果是 AI 面板、或者是全局搜索面板，绝对不要执行本地的 keyword 过滤，原样展示！
  if ((musicStore.currentMenu === 'discover' && discoverMode.value === 'ai') || musicStore.currentMenu === 'search_results') {
    return list 
  }
  // 其他普通的本地页面依然保留轻量级的本地过滤
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

// 🚀 核心修复 4：完美切歌逻辑！如果是当前歌曲，改为切换播放/暂停！
const handleItemClick = (item) => {
  if (isBatchMode.value) {
    toggleSelection(item.id) 
  } else {
    if (musicStore.currentSong && musicStore.currentSong.id === item.id) {
      musicStore.togglePlay() 
    } else {
      musicStore.selectSong(item) 
    }
  }
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

// 🚀 新增：一键播放公共歌单的全部歌曲
const playAllPublic = () => {
  if (publicPlaylistData.value.songs.length === 0) return;
  // 直接播放该歌单的第一首歌，后续的"下一首"会自动在 activePlayList 里循环！
  musicStore.selectSong(publicPlaylistData.value.songs[0]);
  ElMessage.success('▶️ 正在播放歌单...');
}

// 🚀 新增：一键将公共歌单的所有歌"洗劫"到我的红心列表！
const collectAllPublic = async () => {
  if (!musicStore.currentUser) return goToLogin();
  let successCount = 0;
  for (let song of publicPlaylistData.value.songs) {
    if (!musicStore.isLiked(song.id)) {
      try { 
        await likeMusicAPI(musicStore.currentUser.id, song.id); 
        successCount++; 
      } catch (e) {}
    }
  }
  if (successCount > 0) {
    ElMessage.success(`🎉 成功将 ${successCount} 首歌洗劫到您的红心列表！`);
    await fetchMyLikes(); // 刷新本地红心状态
  } else {
    ElMessage.info('这些歌您都已经收藏过啦！');
  }
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
  if (!force && radioMusicList.value.length > 0) return 
  isRadioLoading.value = true
  let dynamicPrompt = ''

  if (musicStore.playHistory && musicStore.playHistory.length > 0) {
    const songGenes = musicStore.playHistory.slice(0, 5).map(s => `《${s.title}》(${s.artist})`).join('、')
    dynamicPrompt = `用户最近循环了：${songGenes}。请你作为懂情感的顶级DJ，剖析这些歌是否包含【爱情】、浪漫元素。请推荐10首风格相似、且带有明显【爱情】标签或浪漫氛围的音乐。`
    if(force) ElMessage.info('📡 正在解析听歌 DNA，演算私人频段...')
  } else {
    dynamicPrompt = '推荐一些适合【恋爱】氛围、充满浪漫甜蜜感、或者细腻伤感的经典爱情流行歌曲。'
    if(force) ElMessage.info('📡 正在感知此刻时空，为您生成电台调频...')
  }

  try {
    const data = await recommendMusicAPI(dynamicPrompt)
    radioMusicList.value = data || []
    if (force && radioMusicList.value.length > 0) musicStore.selectSong(radioMusicList.value[0])
  } catch (error) { 
    ElMessage.error('电台生成失败，请检查网络') 
  } finally { 
    isRadioLoading.value = false 
  }
}

const initSleepMode = async (force = false) => {
  if (!force && sleepMusicList.value.length > 0) return
  isSleepLoading.value = true
  if (force) ElMessage.info('🌙 正在为您编织助眠梦境...')
  try { 
    sleepMusicList.value = await recommendMusicAPI('极度安静、适合深夜深度睡眠、让人放松的轻音乐、钢琴曲或白噪音') || [] 
  } catch (error) {
  } finally { 
    isSleepLoading.value = false 
  }
}

const handleSearch = async () => {
  if (!userInput.value.trim()) return
  musicStore.currentMenu = 'discover'; discoverMode.value = 'ai'; isSearching.value = true
  try { aiMusicList.value = await recommendMusicAPI(userInput.value) || [] } catch (error) {} finally { isSearching.value = false }
}

// 🚀 全局搜索核心状态
const searchMusicList = ref([])
const isGlobalSearching = ref(false)
const lastSearchKeyword = ref('') // 记录最后一次搜索的词，防止用户改输入框导致标题乱跳

// 🚀 发动全站搜索脉冲！
const executeGlobalSearch = async () => {
  if (!localSearchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索内容！')
    return
  }
  isGlobalSearching.value = true
  lastSearchKeyword.value = localSearchKeyword.value.trim()
  musicStore.currentMenu = 'search_results' // 强行切到搜索结果面板
  
  try {
    const res = await searchMusicAPI(lastSearchKeyword.value)
    searchMusicList.value = res || []
  } catch (error) {
    ElMessage.error('全站检索网络异常！')
  } finally {
    isGlobalSearching.value = false
  }
}

// 播放搜索出来的全部
const playAllSearch = () => {
  if (searchMusicList.value.length > 0) {
    musicStore.selectSong(searchMusicList.value[0])
    ElMessage.success('▶️ 正在为您播放检索结果...')
  }
}

const playPrev = () => {
  const index = activePlayList.value.findIndex(item => item.id === musicStore.currentSong?.id)
  if (index !== -1) musicStore.selectSong(activePlayList.value[(index - 1 + activePlayList.value.length) % activePlayList.value.length])
}
const playNext = () => {
  const index = activePlayList.value.findIndex(item => item.id === musicStore.currentSong?.id)
  if (index !== -1) musicStore.selectSong(activePlayList.value[(index + 1) % activePlayList.value.length])
}

// 🚀 名片编辑状态与逻辑
const profileDialogVisible = ref(false)
const isProfileUpdating = ref(false)
const editProfileForm = ref({ id: null, username: '', avatar: '', signature: '' })

// 打开编辑器，回显当前数据
const openProfileEditor = () => {
  if (!musicStore.currentUser) return ElMessage.warning('请先登录！')
  editProfileForm.value = { 
    id: musicStore.currentUser.id, 
    username: musicStore.currentUser.username, 
    avatar: musicStore.currentUser.avatar || '',
    signature: musicStore.currentUser.signature || ''
  }
  profileDialogVisible.value = true
}

// 极其暴力的直连阿里云 OSS 头像上传！
const customUploadAvatar = async (options) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    // 💥 架构级指令：强行把这个文件押送到阿里云的 "avatars/" 专属隔离区！
    formData.append('folder', 'avatars/') 
    
    // 复用咱们写好的阿里云神级上传接口！
    const res = await uploadFileAPI(formData)
    editProfileForm.value.avatar = res // 回显最新 OSS 图片链接
    ElMessage.success('头像直传云端专属仓库成功！')
  } catch (error) {
    ElMessage.error('头像上传失败，请检查网络！')
  }
}

// 提交保存最新名片
const submitProfileUpdate = async () => {
  if (!editProfileForm.value.username.trim()) return ElMessage.warning('昵称不能为空哦~')
  isProfileUpdating.value = true
  try {
    const res = await updateUserAPI(editProfileForm.value)
    // 💥 极其关键：瞬间同步本地状态引擎，页面无缝变身！
    musicStore.currentUser = res
    localStorage.setItem('echo_user', JSON.stringify(res))
    ElMessage.success('🎉 音乐名片定制成功！你的品味已被整个宇宙铭记！')
    profileDialogVisible.value = false
  } catch (error) {
  } finally {
    isProfileUpdating.value = false
  }
}

// 🚀 修改 switchMenu，接管 square 逻辑
const switchMenu = async (menuName) => {
  musicStore.currentMenu = menuName; isBatchMode.value = false ; localSearchKeyword.value = '' 
  if (menuName === 'discover') await loadDiscoverData()
  else if (menuName === 'liked') await fetchMyLikes()
  else if (menuName.startsWith('playlist_')) await loadPlaylistSongs(menuName.split('_')[1])
  else if (menuName === 'radio') initRadio() 
  else if (menuName === 'sleep') initSleepMode() 
  // 💥 点击广场，拉取全站歌单！
  else if (menuName === 'square') {
    const res = await getAllPlaylistsAPI();
    squarePlaylists.value = res || [];
  }
}

// 🚀 新增：点击广场里别人的歌单
const openSquarePlaylist = async (pl) => {
  musicStore.currentMenu = 'public_playlist';
  publicPlaylistData.value.name = pl.name;
  publicPlaylistData.value.creator = pl.creatorName;
  const res = await getPlaylistMusicAPI(pl.id);
  publicPlaylistData.value.songs = res || [];
}

onMounted(async () => {
  await loadDiscoverData()
  if (musicStore.currentUser) { await fetchMyLikes(); await fetchMyPlaylists() }
})
</script>

<style scoped>
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
.bento-play-btn { width: 64px; height: 64px; background: rgba(255,255,255,0.25); border-radius: 50%; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.6); transform: translateY(20px); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.bento-card:hover .bento-play-btn { transform: translateY(0); }
.bento-info { padding: 16px 4px 4px; text-align: center; }
.bento-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 🚀 核心修复 5：废除冲突的 CSS Hover，拥抱干净的逻辑！ */
.modern-list-view { display: flex; flex-direction: column; gap: 8px; padding: 10px 0;}
.modern-list-item { display: grid; grid-template-columns: 1fr 80px 1fr; align-items: center; padding: 16px 30px; background: #fff; border-radius: 20px; transition: 0.3s; cursor: pointer; border: 1px solid transparent;}
.modern-list-item:hover { transform: scale(1.01); box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
.modern-list-item.is-active-row { background: linear-gradient(to right, #eff6ff, #fff); border-color: #bfdbfe; }
.modern-title-group { display: flex; align-items: center; gap: 16px; }
.modern-title { font-size: 16px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px;}
.active-text { color: #3b82f6; }

.track-status-box { width: 30px; text-align: center; display: flex; justify-content: center; align-items: center; color: #94a3b8; }
.track-num { display: block; font-size: 14px; font-weight: 600; }
.track-play { display: none; font-size: 22px; color: #94a3b8;}
.modern-list-item:hover .track-num { display: none; }
.modern-list-item:hover .track-play { display: block; }

.track-playing-icon { font-size: 22px; color: #3b82f6; }
.track-paused-icon { font-size: 22px; color: #3b82f6; }
.list-like-icon { color: #94a3b8; transition: 0.2s;}
.list-like-icon.is-liked { color: #ef4444; }

/* 🚀 终极净化 1：核弹级清除 Vite 默认样式幽灵，绝对禁止屏幕本体出现滚动！ */
:global(body), :global(html), :global(#app) { 
  margin: 0 !important; 
  padding: 0 !important; 
  height: 100vh !important; 
  width: 100vw !important; 
  max-width: 100% !important; /* 💥 强行斩杀 Vite 默认的 1280px 宽度限制 */
  box-sizing: border-box !important; 
  overflow: hidden !important; /* 💥 绝对禁止屏幕本体越界 */
}
*, *::before, *::after { box-sizing: border-box; }
.main-layout { display: flex; width: 100%; height: 100vh; background-color: #f8fafc; color: #333; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
.main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
.top-header { height: 76px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; z-index: 5; }
.ai-input-wrapper { width: 480px; }
.scene-search :deep(.el-input__wrapper) { border-radius: 20px; background-color: #f1f5f9; box-shadow: none; padding-left: 15px; }
.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }

/* 🚀 终极净化 2：斩杀 Element Plus 负边距引起的内部横向滚动条！ */
.scroll-container { 
  flex: 1; 
  overflow-y: auto; 
  overflow-x: hidden; /* 💥 核心杀招：强行剪断被栅格撑出去的那 12.5px！ */
  padding: 30px 40px 120px; 
}

.discover-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
.hero-section h2 { font-size: 36px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -1px;}
.theory-note { color: #64748b; font-size: 15px; margin: 0; font-weight: 500;}

.radio-layout { display: flex; gap: 30px; align-items: flex-start; }
.radio-player-panel { flex: 0 0 320px; display: flex; flex-direction: column; align-items: center; background: #fff; padding: 40px 20px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); position: sticky; top: 20px; border: 1px solid #f1f5f9;}
.radio-queue-panel { flex: 1; min-width: 0; }
.fm-cover-wrapper { width: 240px; height: 240px; flex-shrink: 0; aspect-ratio: 1 / 1; border-radius: 50%; box-shadow: 0 15px 35px rgba(0,0,0,0.2); position: relative; overflow: hidden; animation: spin 20s linear infinite; animation-play-state: paused; border: 6px solid #0f172a; margin-bottom: 25px; }
.fm-cover-wrapper.is-playing { animation-play-state: running; }
.fm-cover { width: 100%; height: 100%; }
.fm-center-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 45px; height: 45px; background: #f8fafc; border-radius: 50%; border: 3px solid #333; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
.fm-info { text-align: center; width: 100%; }
.fm-info h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fm-info p { color: #64748b; font-size: 14px; margin: 0; font-weight: 500;}
@keyframes spin { 100% { transform: rotate(360deg); } }

.sleep-mode-bg { background: linear-gradient(135deg, #0f172a, #1e1b4b); border-radius: 28px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.3) inset; border: 1px solid rgba(255,255,255,0.1);}
.dark-list { background: transparent !important; padding: 0;}
.dark-list .modern-list-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #fff; box-shadow: none;}
.dark-list .modern-list-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1);}
.dark-list .modern-title, .dark-list .modern-artist { color: #e2e8f0; }
.dark-list .modern-list-item.is-active-row { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3);}
.dark-list .active-text { color: #93c5fd; }
.dark-list .track-playing-icon, .dark-list .track-paused-icon { color: #93c5fd; }
.dark-list .track-play { color: #cbd5e1; }

.profile-container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 28px; padding: 50px; box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;}
.profile-header { display: flex; align-items: center; gap: 35px; margin-bottom: 60px; }
.avatar-wrapper { position: relative; cursor: pointer; }
.avatar-edit { position: absolute; bottom: 0; right: 0; background: #3b82f6; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; transition: 0.3s; box-shadow: 0 4px 10px rgba(59,130,246,0.3);}
.profile-info h2 { display: flex; align-items: center; gap: 15px; }
.profile-info p { margin: 0; color: #64748b; display: flex; align-items: center; gap: 10px; font-weight: 500;}
.stats-row { text-align: center; }
.stat-card { padding: 35px 20px; background: #f8fafc; border-radius: 24px; transition: 0.4s; border: 1px solid transparent;}
.stat-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.04); border-color: #e2e8f0; background: #fff;}
.stat-num { font-size: 42px; font-weight: 900; color: #3b82f6; margin-bottom: 12px; font-family: monospace;}
.stat-label { font-size: 15px; color: #64748b; font-weight: 700; }
/* 🚀 极其优雅的个人资料编辑器 CSS */
.profile-info h2 { display: flex; align-items: center; gap: 15px; }
.profile-editor-box { display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }
.upload-area { margin-bottom: 25px; text-align: center; }
.avatar-uploader .el-upload { border: 2px dashed #d9d9d9; border-radius: 50%; cursor: pointer; position: relative; overflow: hidden; transition: 0.3s; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; background: #f8fafc;}
.avatar-uploader .el-upload:hover { border-color: #3b82f6; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; }
.avatar-preview { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
.upload-hint { font-size: 12px; color: #94a3b8; margin-top: 10px; }
</style>