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
        
        <div class="header-actions" v-if="musicStore.currentUser" style="display: flex; align-items: center; gap: 12px;">
          <div class="header-bell" @click="openMessageCenter" style="cursor: pointer; display: flex; align-items: center;">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
              <el-icon :size="22" class="hover-bell" color="#475569"><Bell /></el-icon>
            </el-badge>
          </div>
          
          <div class="user-profile" style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <el-avatar :size="36" :src="musicStore.currentUser.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
            <span class="user-name">{{ musicStore.currentUser.nickname || musicStore.currentUser.username }}</span>
            <el-button type="danger" link style="margin-left: 5px;" @click="handleLogout">退出</el-button>
          </div>
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
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" @contextmenu.prevent="enterBatchModeFrom(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
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
                  <div class="modern-list-item" v-for="(item, index) in radioMusicList" :key="item.id" @click="handleItemClick(item)" @contextmenu.prevent="enterBatchModeFrom(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
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
              <div class="modern-list-item" v-for="(item, index) in sleepMusicList" :key="item.id" @click="handleItemClick(item)" @contextmenu.prevent="enterBatchModeFrom(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
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
                <h2>{{ musicStore.currentUser?.nickname || musicStore.currentUser?.username }}</h2>
                <p class="u-account" style="color: #64748b; font-size: 14px; margin-top: -5px; margin-bottom: 10px;">
                  账号 ID: {{ musicStore.currentUser?.username }}
                </p>
                <p>{{ musicStore.currentUser?.signature || '用音乐记录生活，寻找灵魂共鸣...' }}</p>
                <p style="margin-top: 5px; font-size: 13px;">EchoScene 尊贵用户 ｜ 听歌品味：<el-tag size="small" type="success" effect="dark">极致硬核</el-tag></p>
              </div>
            </div>
            
            <el-row :gutter="20" class="stats-row">
              <el-col :span="8"><div class="stat-card"><div class="stat-num">{{ musicStore.likedMusicList.length }}</div><div class="stat-label">❤️ 累计红心</div></div></el-col>
              <el-col :span="8"><div class="stat-card"><div class="stat-num">{{ musicStore.customPlaylists.length }}</div><div class="stat-label">💿 云端歌单</div></div></el-col>
              <el-col :span="8"><div class="stat-card"><div class="stat-num">{{ musicStore.playHistory.length }}</div><div class="stat-label">🕒 历史足迹</div></div></el-col>
            </el-row>

            <MusicDataBoard />

          </div>
        </section>

        <section v-else-if="musicStore.currentMenu === 'square'" class="hero-section fade-in">
          
          <div class="discover-header">
            <div>
              <h2>🤖 AI 瞬息频段</h2>
              <p class="theory-note">大模型基于当前时空【自主创造】的绝版歌单，每一次呼吸都是不同的灵魂碰撞。</p>
            </div>
            <el-button type="primary" color="#8b5cf6" round @click="refreshAiPlaylists" :loading="isAiPlaylistsLoading">
              <el-icon><MagicStick /></el-icon> 重新演算时空
            </el-button>
          </div>
          
          <el-row :gutter="25" class="bento-grid" v-loading="isAiPlaylistsLoading">
            <el-empty v-if="dynamicAiPlaylists.length === 0 && !isAiPlaylistsLoading" description="AI 正在宇宙深处捕捉灵感信号..." style="width:100%"/>
            <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="pl in dynamicAiPlaylists" :key="pl.id">
              <div class="bento-card" @click="openSquarePlaylist(pl)">
                <div class="bento-cover-box" style="background: linear-gradient(135deg, #e0e7ff 0%, #bae6fd 100%); display:flex; justify-content:center; align-items:center;">
                  <img v-if="pl.coverUrl" :src="pl.coverUrl" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;" />
                  <el-icon v-else :size="48" color="#3b82f6"><MagicStick /></el-icon>
                  
                  <div style="position:absolute; top:8px; right:8px; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color:#fff; font-size:12px; padding:4px 10px; border-radius:12px; font-weight:800; border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; gap: 4px;">
                    <el-icon><MagicStick /></el-icon> AI 生成
                  </div>
                </div>
                <div class="bento-info">
                  <div class="bento-title">{{ pl.name }}</div>
                  <div class="bento-artist">创建者: @{{ pl.creatorName }}</div>
                </div>
              </div>
            </el-col>
          </el-row>

          <div class="discover-header">
            <div>
              <h2>🌍 达人云端歌单</h2>
              <p class="theory-note">探索全站音乐达人手工创建的精选集，寻找灵魂共鸣。</p>
            </div>
            <el-button type="primary" plain round @click="switchMenu('square')"><el-icon><Refresh /></el-icon> 刷新广场</el-button>
          </div>
          
          <el-row :gutter="25" class="bento-grid">
            <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="pl in squarePlaylists" :key="pl.id">
              <div class="bento-card" @click="openSquarePlaylist(pl)">
                <div class="bento-cover-box" style="background: linear-gradient(135deg, #e0e7ff 0%, #bae6fd 100%); display:flex; justify-content:center; align-items:center;">
                  <img v-if="pl.coverUrl" :src="pl.coverUrl" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;" />
                  <el-icon v-else :size="48" color="#3b82f6"><DataBoard /></el-icon>
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
              <p class="theory-note">关于「{{ lastSearchKeyword }}」的检索结果</p>
            </div>
            <div style="display:flex; gap:10px; align-items: center;">
              <div class="ios-segment-control" style="margin-right: 20px;">
                <div class="segment-btn" :class="{ active: searchTab === 'music' }" @click="searchTab = 'music'">单曲 ({{ searchMusicList.length }})</div>
                <div class="segment-btn" :class="{ active: searchTab === 'user' }" @click="searchTab = 'user'">用户 ({{ searchUserList.length }})</div>
              </div>
              <el-button type="primary" round @click="playAllSearch" v-if="searchTab === 'music' && searchMusicList.length > 0">
                <el-icon style="margin-right: 5px;"><VideoPlay /></el-icon> 播放全部
              </el-button>
              <el-button plain round @click="switchMenu('discover')">返回大厅</el-button>
            </div>
          </div>

          <div v-show="searchTab === 'music'">
            <el-empty v-if="searchMusicList.length === 0" description="在这片星系中，没有找到与此相关的频率..." />
            <div class="modern-list-view fade-in" v-else>
              <div class="modern-list-item" v-for="(item, index) in searchMusicList" :key="item.id" @click="handleItemClick(item)" @contextmenu.prevent="enterBatchModeFrom(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
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
          </div>

          <div v-show="searchTab === 'user'" class="fade-in">
            <el-empty v-if="searchUserList.length === 0" description="未找到匹配的音乐达人..." />
            <el-row :gutter="20" v-else>
              <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="user in searchUserList" :key="user.id" style="margin-bottom: 20px;">
                <div class="user-card" @click="viewOtherProfile(user)">
                  <el-avatar :size="60" :src="user.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="u-avatar" />
                  <div class="u-info">
                    <div class="u-name">
                      {{ user.nickname || user.username }}
                      <span style="font-size:12px; color:#94a3b8; font-weight:normal; margin-left:5px;">(@{{ user.username }})</span>
                    </div>
                    <div class="u-sign">{{ user.signature || '这个人很酷，什么也没留下...' }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </section>

        <section v-else-if="['liked', 'history', 'public_playlist'].includes(musicStore.currentMenu) || musicStore.currentMenu.startsWith('playlist_') || musicStore.currentMenu.startsWith('col_playlist_')" class="hero-section fade-in">
          <div v-if="musicStore.currentMenu === 'public_playlist'" style="margin-bottom: 15px; animation: fadeIn 0.3s ease;">
            <el-button plain round size="small" @click="switchMenu('square')" style="color: #64748b; border-color: #e2e8f0;">
              <el-icon style="margin-right: 4px;"><ArrowLeft /></el-icon> 返回云端广场
            </el-button>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
            <div>
              <h2 v-if="musicStore.currentMenu === 'liked'">❤️ 我喜欢的音乐</h2>
              <h2 v-else-if="musicStore.currentMenu === 'history'">🕒 最近播放</h2>
              <h2 v-else-if="musicStore.currentMenu === 'public_playlist'">🌍 {{ publicPlaylistData.name }} </h2>
              <h2 v-else>💿 {{ currentActivePlaylist?.name }} </h2>

              <div v-if="musicStore.currentMenu === 'public_playlist' && publicPlaylistData.isAi" class="ai-insight-panel">
                <div class="insight-header">
                  <el-icon color="#8b5cf6"><MagicStick /></el-icon>
                  <span>AI 创作随笔</span>
                </div>
                <p class="insight-basis">{{ publicPlaylistData.basis }}</p>
                <div class="insight-tags">
                  <span v-for="tag in publicPlaylistData.tags.split(/[,，/ ]+/)" :key="tag" class="tag-capsule">{{ tag }}</span>
                </div>
              </div>

              <p class="theory-note" v-if="musicStore.currentMenu === 'public_playlist' && !publicPlaylistData.isAi">By @ {{ publicPlaylistData.creator }} · 共 {{ publicPlaylistData.songs.length }} 首歌曲</p>
              <p class="theory-note" v-else-if="musicStore.currentMenu === 'liked'">专属红心云端歌单。</p>
              <p class="theory-note" v-else-if="musicStore.currentMenu === 'history'">最近畅听的 50 首歌曲。</p>
              <p class="theory-note" v-else-if="!publicPlaylistData.isAi">共 {{ currentActivePlaylist?.songs?.length || 0 }} 首云端歌曲</p>
            </div>
            <div style="display:flex; gap:10px;">
              <template v-if="musicStore.currentMenu === 'public_playlist' && activePlayList.length > 0">
                <el-button type="primary" round @click="playAllPublic"><el-icon style="margin-right: 5px;"><VideoPlay /></el-icon> 播放全部</el-button>
                <el-button type="warning" round @click="collectCurrentPlaylist" v-if="!isCurrentPlaylistCollected"><el-icon style="margin-right: 5px;"><Star /></el-icon> 收藏该歌单</el-button>
                <el-button type="info" plain round @click="uncollectCurrentPlaylist" v-if="isCurrentPlaylistCollected">取消收藏</el-button>
                <el-button type="success" plain round @click="collectAllPublic"><el-icon style="margin-right: 5px;"><Star /></el-icon> 收藏全部单曲</el-button>
              </template>

              <el-button type="danger" plain round @click="deletePlaylist(currentActivePlaylist?.id)" v-if="musicStore.currentMenu.startsWith('playlist_')">删除该歌单</el-button>

              <el-button type="danger" plain round @click="uncollectCurrentPlaylist" v-if="musicStore.currentMenu.startsWith('col_playlist_')">不再收藏</el-button>

              <el-button :type="isBatchMode ? 'danger' : 'primary'" plain round @click="toggleBatchMode" v-if="activePlayList.length > 0">
                <el-icon style="margin-right:5px;"><Check /></el-icon> {{ isBatchMode ? '退出批量' : '批量操作' }}
              </el-button>
            </div>
          </div>
          
          <el-empty v-if="activePlayList.length === 0" description="这里空空如也~" />
          
          <div class="modern-list-view fade-in" v-else>
            <div class="modern-list-item" v-for="(item, index) in activePlayList" :key="item.id" @click="handleItemClick(item)" @contextmenu.prevent="enterBatchModeFrom(item)" :class="{ 'is-active-row': musicStore.currentSong?.id === item.id }">
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
        <el-input v-model="editProfileForm.nickname" placeholder="取一个响亮的网名吧..." maxlength="20" size="large" style="margin-bottom: 15px;">
          <template #prefix><el-icon><Postcard /></el-icon></template>
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

    <el-dialog v-model="otherProfileVisible" width="380px" style="border-radius: 20px; text-align: center;">
      <div v-if="targetUser" style="padding: 10px 0 20px;">
        <el-avatar :size="90" :src="targetUser.avatar" style="border: 3px solid #eff6ff;" />
        <h3 style="margin: 15px 0 5px; font-size: 20px; color: #0f172a;">{{ targetUser.nickname || targetUser.username }}</h3>
        <p style="color: #64748b; font-size: 13px; margin: 0 0 25px;">{{ targetUser.signature || '这个人很酷，什么也没留下...' }}</p>
        
        <div style="display: flex; justify-content: center; gap: 15px;" v-if="targetUser.id !== musicStore.currentUser?.id">
          <el-button :type="isFollowingTarget ? 'default' : 'primary'" round @click="toggleFollow" style="width: 110px;">
            {{ isFollowingTarget ? '已关注' : '+ 关注' }}
          </el-button>
          <el-button round @click="openChat(targetUser)" style="width: 110px;">
            发私信 <span v-if="isMutual" style="margin-left: 4px; color:#67c23a; font-size:12px;">(好友)</span>
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-drawer v-model="chatDrawerVisible" :show-close="false" size="400px">
      <template #header>
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-icon :size="20" style="cursor: pointer; color: #64748b;" @click="backToMessageCenter"><ArrowLeft /></el-icon>
          <span style="font-size: 16px; font-weight: 600; color: #0f172a;">与 {{ chatTarget?.nickname || chatTarget?.username }} 聊天中</span>
        </div>
      </template>
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div id="chatBox" style="flex: 1; overflow-y: auto; padding: 15px; background: #f8fafc; border-radius: 12px; margin-bottom: 15px;">
          <div v-for="msg in chatHistory" :key="msg.id" :style="{ display: 'flex', gap: '10px', marginBottom: '15px', flexDirection: msg.senderId === musicStore.currentUser.id ? 'row-reverse' : 'row' }">
            <el-avatar :size="35" :src="msg.senderId === musicStore.currentUser.id ? musicStore.currentUser.avatar : chatTarget.avatar" style="flex-shrink: 0;" />
            
            <div :style="{ display: 'flex', flexDirection: 'column', alignItems: msg.senderId === musicStore.currentUser.id ? 'flex-end' : 'flex-start', maxWidth: '70%' }">
              <div :style="{ padding: '10px 15px', borderRadius: '15px', wordBreak: 'break-all', fontSize: '14px', background: msg.senderId === musicStore.currentUser.id ? '#3b82f6' : '#fff', color: msg.senderId === musicStore.currentUser.id ? '#fff' : '#1e293b', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }">
                {{ msg.content }}
              </div>
              <span style="font-size: 11px; color: #94a3b8; margin-top: 4px; padding: 0 4px;">{{ formatChatTime(msg.createTime) }}</span>
            </div>
            
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <el-input v-model="chatInput" placeholder="发条友善的消息吧..." @keyup.enter="sendChat" />
          <el-button type="primary" @click="sendChat">发送</el-button>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="msgCenterVisible" title="📬 消息中心" size="320px">
      <el-empty v-if="recentContacts.length === 0" description="还没有人找你聊天哦~" />
      <div v-else class="contact-list">
        
        <div v-for="item in recentContacts" :key="item.contact.id" class="contact-item" @click="openChatFromCenter(item.contact)">
          <el-avatar :src="item.contact.avatar" :size="45" style="border: 2px solid #eff6ff; flex-shrink: 0;" />
          
          <div class="c-info" style="flex: 1; min-width: 0; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <div class="c-name" style="flex: 1; margin-right: 10px;">{{ item.contact.nickname || item.contact.username }}</div>
              <div style="font-size: 11px; color: #94a3b8; flex-shrink: 0;">{{ formatChatTime(item.lastTime) }}</div>
            </div>
            <div class="c-sign">{{ item.lastMessage || '暂无消息...' }}</div>
          </div>
          
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, VideoPlay, VideoPause, Star, StarFilled, List, Check, Menu, MagicStick, Refresh, Edit, EditPen, Plus, User, DataBoard, InfoFilled, ArrowLeft, Postcard, Bell } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import Sidebar from '../components/layout/Sidebar.vue'
import PlayerBar from '../components/player/PlayerBar.vue'
import LyricOverlay from '../components/player/LyricOverlay.vue'
import MusicDataBoard from '../components/profile/MusicDataBoard.vue'
import { useMusicStore } from '../store/music'

import { getMusicListAPI, recommendMusicAPI, generateAiPlaylistsAPI, getUserPlaylistsAPI, createPlaylistAPI, deletePlaylistAPI, addMusicToPlaylistAPI, getPlaylistMusicAPI, getAllPlaylistsAPI, searchMusicAPI, uploadFileAPI, collectPlaylistAPI, uncollectPlaylistAPI, getCollectedPlaylistsAPI } from '../api/music'
import { likeMusicAPI, unlikeMusicAPI, getLikedMusicAPI, updateUserAPI, searchUsersAPI, getUserProfileAPI, followUserAPI, unfollowUserAPI, sendMessageAPI, getChatHistoryAPI, getRecentContactsAPI, getUnreadCountAPI, markAsReadAPI } from '../api/user'

const router = useRouter()
const goToLogin = () => router.push('/login')
const musicStore = useMusicStore()

const discoverMode = ref('library') 
const userInput = ref('')
const isSearching = ref(false)
const localSearchKeyword = ref('')

// 🚀 新增：广场数据状态
const squarePlaylists = ref([])
const publicPlaylistData = ref({ id: '', name: '', creator: '', description: '', basis: '', tags: '', songs: [], isAi: false })

// 🚀 真·AI 歌单引擎！
const dynamicAiPlaylists = ref([]);
const isAiPlaylistsLoading = ref(false);

const refreshAiPlaylists = async () => {
  isAiPlaylistsLoading.value = true;
  try {
    // 💥 强行唤醒后端的 LLM 引擎生成 JSON 数据！
    const res = await generateAiPlaylistsAPI();
    dynamicAiPlaylists.value = res || [];
  } catch(e) {
    ElMessage.error('📡 量子坍缩失败，请重试');
  } finally {
    isAiPlaylistsLoading.value = false;
  }
}

// 💥 极其硬核的：AI 广场分类雷达状态引擎！
const aiSquareCategories = ['🚗 兜风公路', '☕ 慵懒午后', '🌃 赛博深夜', '🏃‍♂️ 极限运动', '💔 伤感治愈'];
const currentAiCategory = ref('☕ 慵懒午后');
const squareAiSongs = ref([]);
const isSquareAiLoading = ref(false);

const fetchSquareAiSongs = async (category) => {
  if (isSquareAiLoading.value) return;
  currentAiCategory.value = category;
  isSquareAiLoading.value = true;
  try {
    const prompt = `帮我推荐几首极其符合【${category}】场景氛围的流行音乐或纯音乐。`;
    squareAiSongs.value = await recommendMusicAPI(prompt) || [];
  } catch(e) {
    ElMessage.error('📡 AI 雷达频段接收失败');
  } finally {
    isSquareAiLoading.value = false;
  }
}

const allMusicList = ref([]); const aiMusicList = ref([]); const radioMusicList = ref([]); const sleepMusicList = ref([])
const isRadioLoading = ref(false); const isSleepLoading = ref(false)

const isBatchMode = ref(false); const selectedMusicIds = ref([])
const playlistDialogVisible = ref(false); const newPlaylistName = ref('')

// 🚀 废弃乱七八糟的提示切换，统一全站搜索占位符
const searchPlaceholder = computed(() => '输入歌名、歌手或用户昵称进行全站搜索...')

// 🚀 终极修正 1：必须先声明 rawActivePlayList！
const rawActivePlayList = computed(() => {
  if (musicStore.currentMenu === 'liked') return musicStore.likedMusicList
  if (musicStore.currentMenu === 'history') return musicStore.playHistory
  if (musicStore.currentMenu.startsWith('playlist_')) return currentActivePlaylist.value?.songs || []
  if (musicStore.currentMenu.startsWith('col_playlist_')) return currentActivePlaylist.value?.songs || [] // 🚀 支持收藏歌单
  if (musicStore.currentMenu === 'public_playlist') return publicPlaylistData.value.songs 
  if (musicStore.currentMenu === 'search_results') return searchMusicList.value // 接管搜索数据
  if (musicStore.currentMenu === 'discover') return discoverMode.value === 'library' ? allMusicList.value : aiMusicList.value
  
  // 💥 致命补充：让底层播放引擎认领 AI 广场上的这些歌！
  if (musicStore.currentMenu === 'square') return squareAiSongs.value 
  
  return []
})

// 🚀 终极修正 2：然后再声明 activePlayList（因为它依赖了上面的 rawActivePlayList.value）
// 🚀 听大哥的！彻底废除边打字边过滤的逻辑，全权交给"全站搜索"，保持列表稳如磐石
const activePlayList = computed(() => {
  return rawActivePlayList.value
})

const currentActivePlaylist = computed(() => {
  if (musicStore.currentMenu.startsWith('playlist_')) { return musicStore.customPlaylists.find(p => p.id == musicStore.currentMenu.split('_')[1]) }
  if (musicStore.currentMenu.startsWith('col_playlist_')) { return musicStore.collectedPlaylists.find(p => p.id == musicStore.currentMenu.split('_')[2]) } // 🚀 支持收藏歌单
  return null
})

const toggleBatchMode = () => { isBatchMode.value = !isBatchMode.value; selectedMusicIds.value = [] }

// 🚀 神级交互：从任意歌曲右键瞬间进入批量模式，并自动勾选这首歌！
const enterBatchModeFrom = (item) => {
  if (isBatchMode.value) return; // 已经在批量模式就不管了
  isBatchMode.value = true;
  selectedMusicIds.value = [item.id];
  ElMessage.success('✨ 已进入批量整理模式，请勾选更多歌曲。');
}

const toggleSelection = (id) => { const index = selectedMusicIds.value.indexOf(id); if (index > -1) selectedMusicIds.value.splice(index, 1); else selectedMusicIds.value.push(id) }

// 🚀 核心修复 4：完美切歌逻辑！如果是当前歌曲，改为切换播放/暂停！
const handleItemClick = (item) => {
  if (isBatchMode.value) {
    toggleSelection(item.id) 
  } else {
    if (musicStore.currentSong && musicStore.currentSong.id === item.id) {
      musicStore.togglePlay() 
    } else {
      // 💥 关键修复：把当前屏幕上的播放列表传给引擎！
      musicStore.selectSong(item, activePlayList.value) 
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

const fetchMyPlaylists = async () => { 
  if (musicStore.currentUser) { 
    try { 
      musicStore.customPlaylists = await getUserPlaylistsAPI(musicStore.currentUser.id) || [] 
      musicStore.collectedPlaylists = await getCollectedPlaylistsAPI(musicStore.currentUser.id) || [] // 🚀 极速拉取收藏
    } catch (error) {} 
  } 
}

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
  // 💥 加上第二个参数：publicPlaylistData.value.songs
  musicStore.selectSong(publicPlaylistData.value.songs[0], publicPlaylistData.value.songs);
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
    let pl = musicStore.customPlaylists.find(p => p.id == plId)
    if (!pl) pl = musicStore.collectedPlaylists.find(p => p.id == plId) // 🚀 在收藏库里找
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
    if (force && radioMusicList.value.length > 0) musicStore.selectSong(radioMusicList.value[0], radioMusicList.value)
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
const searchUserList = ref([]) // 新增：搜索到的用户列表
const searchTab = ref('music') // 新增：搜索结果的 Tab（'music' 或 'user'）
const isGlobalSearching = ref(false)
const lastSearchKeyword = ref('') // 记录最后一次搜索的词，防止用户改输入框导致标题乱跳

// 🚀 发动全站多维搜索脉冲！
const executeGlobalSearch = async () => {
  if (!localSearchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索内容！')
    return
  }
  isGlobalSearching.value = true
  lastSearchKeyword.value = localSearchKeyword.value.trim()
  musicStore.currentMenu = 'search_results'
  
  try {
    // 💥 并发请求：同时向后端索要"歌曲"和"用户"数据！
    const [musicRes, userRes] = await Promise.all([
      searchMusicAPI(lastSearchKeyword.value).catch(() => []),
      searchUsersAPI(lastSearchKeyword.value).catch(() => [])
    ])
    searchMusicList.value = musicRes || []
    searchUserList.value = userRes || []

    // 💥 核心智能化 UX 升级：
    // 如果没搜到歌，但是搜到了人，自动帮你把选项卡切到"用户"界面！
    if (searchMusicList.value.length === 0 && searchUserList.value.length > 0) {
      searchTab.value = 'user'
    } else {
      searchTab.value = 'music'
    }
    
  } catch (error) {
    ElMessage.error('全站检索网络异常！')
  } finally {
    isGlobalSearching.value = false
  }
}

// 🚀 推荐音乐核心状态
// const isRadioLoading = ref(false)

// 🚀 发动推荐音乐脉冲！
const executeRadio = async (dynamicPrompt = '', force = false) => {
  isRadioLoading.value = true
  try {
    const data = await recommendMusicAPI(dynamicPrompt)
    radioMusicList.value = data || []
    // 💥 加上第二个参数：radioMusicList.value
    if (force && radioMusicList.value.length > 0) musicStore.selectSong(radioMusicList.value[0], radioMusicList.value)
  } catch (error) { 
    console.error('获取推荐音乐失败:', error)
  }
}

// 播放搜索出来的全部
const playAllSearch = () => {
  if (searchMusicList.value.length > 0) {
    // 💥 加上第二个参数：searchMusicList.value
    musicStore.selectSong(searchMusicList.value[0], searchMusicList.value)
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
const editProfileForm = ref({ id: null, username: '', nickname: '', avatar: '', signature: '' }) // 💥 加上 nickname 占位

// 打开编辑器，回显当前数据
const openProfileEditor = () => {
  if (!musicStore.currentUser) return ElMessage.warning('请先登录！')
  editProfileForm.value = { 
    id: musicStore.currentUser.id, 
    username: musicStore.currentUser.username, 
    nickname: musicStore.currentUser.nickname || '', // 💥 关键点：把网名从仓库取出回显到表单
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
  else if (menuName.startsWith('col_playlist_')) await loadPlaylistSongs(menuName.split('_')[2]) // 🚀 加载收藏歌单歌曲
  else if (menuName === 'radio') initRadio() 
  else if (menuName === 'sleep') initSleepMode() 
  // 💥 点击广场，拉取全站歌单 + 点火 AI 雷达！
  else if (menuName === 'square') {
    const res = await getAllPlaylistsAPI();
    squarePlaylists.value = res || [];
    // 💥 进广场时，如果 AI 引擎没跑过，直接拉取第一波！
    if (dynamicAiPlaylists.value.length === 0) refreshAiPlaylists();
  }
}

// 🚀 新增：点击广场里别人的歌单
const openSquarePlaylist = async (pl) => {
  musicStore.currentMenu = 'public_playlist';
  publicPlaylistData.value.id = pl.id; 
  publicPlaylistData.value.name = pl.name;
  publicPlaylistData.value.creator = pl.creatorName;
  publicPlaylistData.value.isAi = pl.isAi || false;
  // 💥 注入大模型的灵魂解析
  publicPlaylistData.value.description = pl.description || '';
  publicPlaylistData.value.basis = pl.basis || ''; 
  publicPlaylistData.value.tags = pl.tags || '';

  if (pl.isAi) {
    // 💥 极速秒开！因为 AI 歌单在生成时，后端已经把歌曲全部带过来了！
    publicPlaylistData.value.songs = pl.songs || [];
  } else {
    const res = await getPlaylistMusicAPI(pl.id);
    publicPlaylistData.value.songs = res || [];
  }
}

// 🚀 注入计算属性和点击事件
const isCurrentPlaylistCollected = computed(() => {
  if (!musicStore.currentUser || !musicStore.collectedPlaylists) return false;
  if (publicPlaylistData.value.isAi) return false; // AI 歌单永远处于可被“实体化收藏”的状态
  return musicStore.collectedPlaylists.some(p => p.id === publicPlaylistData.value.id)
})

const collectCurrentPlaylist = async () => {
  if (!musicStore.currentUser) return goToLogin()
  
  if (publicPlaylistData.value.isAi) {
    // 💥 发动大招：将 AI 的临时量子歌单，真实地写进数据库变成你自己的歌单！
    try {
      const newName = `${publicPlaylistData.value.name} (AI精选)`;
      await createPlaylistAPI(musicStore.currentUser.id, newName);
      
      const playlists = await getUserPlaylistsAPI(musicStore.currentUser.id);
      const newPl = playlists.find(p => p.name === newName);
      
      if (newPl && publicPlaylistData.value.songs.length > 0) {
        for (let song of publicPlaylistData.value.songs) {
          await addMusicToPlaylistAPI(newPl.id, song.id); // 灌入数据
        }
      }
      ElMessage.success('🌟 虚空固化成功！AI 的绝版灵感已永久保存在您的私人云端！')
      await fetchMyPlaylists(); 
    } catch(e) {}
  } else {
    // 凡人歌单的常规收藏
    try {
      await collectPlaylistAPI(musicStore.currentUser.id, publicPlaylistData.value.id)
      ElMessage.success('🌟 歌单收藏成功！')
      await fetchMyPlaylists() 
    } catch (e) {}
  }
}

const uncollectCurrentPlaylist = async () => {
  if (!musicStore.currentUser) return goToLogin()
  
  // 极其敏锐地判断用户是在哪个页面点击的取消收藏
  let targetId = null;
  if (musicStore.currentMenu === 'public_playlist') {
    targetId = publicPlaylistData.value.id;
  } else if (musicStore.currentMenu.startsWith('col_playlist_')) {
    targetId = parseInt(musicStore.currentMenu.split('_')[2]);
  }
  if (!targetId) return;

  try {
    await uncollectPlaylistAPI(musicStore.currentUser.id, targetId)
    ElMessage.success('已将该歌单移出您的收藏匣')
    await fetchMyPlaylists() // 刷新左侧栏，让它瞬间消失
    
    // 如果用户是在左侧栏看的时候取消的，直接极其无情地把他踢回大厅！
    if (musicStore.currentMenu.startsWith('col_playlist_')) {
      musicStore.currentMenu = 'discover'
    }
  } catch (e) {}
}

onMounted(async () => {
  await loadDiscoverData()
  if (musicStore.currentUser) { await fetchMyLikes(); await fetchMyPlaylists() }
})

// 🚀 社交引擎核心状态
const otherProfileVisible = ref(false)
const targetUser = ref(null)
const isFollowingTarget = ref(false)
const isMutual = ref(false)

const chatDrawerVisible = ref(false)
const chatTarget = ref(null)
const chatHistory = ref([])
const chatInput = ref('')

// 查看他人主页
const viewOtherProfile = async (user) => {
  if (!musicStore.currentUser) return ElMessage.warning('请先登录才能探索星球！')
  try {
    const res = await getUserProfileAPI(user.id, musicStore.currentUser.id)
    targetUser.value = res.user
    isFollowingTarget.value = res.isFollowing
    isMutual.value = res.isMutual
    otherProfileVisible.value = true
  } catch(e) {}
}

// 关注 / 取消关注
const toggleFollow = async () => {
  try {
    if (isFollowingTarget.value) {
      await unfollowUserAPI(musicStore.currentUser.id, targetUser.value.id)
      isFollowingTarget.value = false
      ElMessage.success('已取消关注')
    } else {
      await followUserAPI(musicStore.currentUser.id, targetUser.value.id)
      isFollowingTarget.value = true
      ElMessage.success('关注成功！')
    }
    // 刷新互关状态
    const res = await getUserProfileAPI(targetUser.value.id, musicStore.currentUser.id)
    isMutual.value = res.isMutual
  } catch(e) {}
}

// 唤起聊天室
const openChat = (user) => {
  chatTarget.value = user
  otherProfileVisible.value = false
  chatDrawerVisible.value = true
  loadChatHistory()
}

// 核心修复：拉取聊天记录并智能滚动
const loadChatHistory = async () => {
  try {
    const res = await getChatHistoryAPI(musicStore.currentUser.id, chatTarget.value.id)
    // 💥 判定是否有新消息：如果数量变多了，才允许往下滚，否则不要打断用户阅读
    const isNewMessage = chatHistory.value.length !== (res || []).length
    chatHistory.value = res || []
    
    if (isNewMessage) {
      setTimeout(() => {
        const box = document.getElementById('chatBox')
        if (box) box.scrollTop = box.scrollHeight
      }, 100)
    }
  } catch(e) {}
}

// 发射私信
const sendChat = async () => {
  if (!chatInput.value.trim()) return
  try {
    await sendMessageAPI({
      senderId: musicStore.currentUser.id,
      receiverId: chatTarget.value.id,
      content: chatInput.value.trim()
    })
    chatInput.value = ''
    loadChatHistory() // 刷新消息流
  } catch(e) {
    // 拦截器会自动抛出"只能发一条"的红字警告！
  }
}

// 🚀 聊天时间智能格式化引擎
const formatChatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  
  // 💥 只有不是今天发的消息，才带上月 - 日
  if (isToday) {
    return `${hh}:${mm}`
  } else {
    return `${date.getMonth() + 1}-${date.getDate()} ${hh}:${mm}`
  }
}

// 🚀 消息中心核心状态与心跳引擎
const msgCenterVisible = ref(false)
const unreadCount = ref(0)
const recentContacts = ref([])
let msgPollingTimer = null

// 悄悄去后端查有没有新消息 (心脏起搏器)
const fetchUnreadCount = async () => {
  if (!musicStore.currentUser) return
  try {
    const res = await getUnreadCountAPI(musicStore.currentUser.id)
    unreadCount.value = res || 0
  } catch(e) {}
}

// 打开消息中心 (拉取联系人)
const openMessageCenter = async () => {
  if (!musicStore.currentUser) return
  msgCenterVisible.value = true
  try {
    const res = await getRecentContactsAPI(musicStore.currentUser.id)
    recentContacts.value = res || []
  } catch(e) {
    ElMessage.error('网络拥堵，联系人拉取失败')
  }
}

// 从联系人列表打开聊天 (并消除红点)
const openChatFromCenter = async (contact) => {
  chatTarget.value = contact
  msgCenterVisible.value = false
  chatDrawerVisible.value = true
  await markAsReadAPI(contact.id, musicStore.currentUser.id) // 告诉后端我看了
  fetchUnreadCount() // 瞬间熄灭红点！
  loadChatHistory()
}

// 返回消息中心
const backToMessageCenter = () => {
  chatDrawerVisible.value = false
  msgCenterVisible.value = true
  chatTarget.value = null
}

// 引擎点火：只要页面加载，就每 5 秒查一次新消息！
onMounted(() => {
  fetchUnreadCount()
  msgPollingTimer = setInterval(() => {
    fetchUnreadCount() // 查红点
    
    // 💥 实时同步引擎：如果当前聊天框是打开状态，自动拉取最新聊天记录！
    if (chatDrawerVisible.value && chatTarget.value) {
      loadChatHistory()
      markAsReadAPI(chatTarget.value.id, musicStore.currentUser.id) // 看了就立刻消除红点
    }
  }, 5000)
})

onUnmounted(() => {
  if (msgPollingTimer) clearInterval(msgPollingTimer)
})
</script>

<style scoped>
/* 全局重置与基础布局 */
:global(body), :global(html), :global(#app) { 
  margin: 0 !important; 
  padding: 0 !important; 
  height: 100vh !important; 
  width: 100vw !important; 
  max-width: 100% !important;
  box-sizing: border-box !important; 
  overflow: hidden !important;
}

*, *::before, *::after { box-sizing: border-box; }

.main-layout { 
  display: flex; 
  width: 100%; 
  height: 100vh; 
  background-color: #f8fafc; 
  color: #333; 
  overflow: hidden; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
}

.main-content { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  position: relative; 
}

/* 顶部导航栏 */
.top-header { 
  height: 76px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 40px; 
  background: rgba(255,255,255,0.8); 
  backdrop-filter: blur(12px); 
  border-bottom: 1px solid #f1f5f9; 
  z-index: 5; 
}

.ai-input-wrapper { width: 480px; }
.scene-search :deep(.el-input__wrapper) { 
  border-radius: 20px; 
  background-color: #f1f5f9; 
  box-shadow: none; 
  padding-left: 15px; 
}

.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }

/* 主内容滚动区域 */
.scroll-container { 
  flex: 1; 
  overflow-y: auto; 
  overflow-x: hidden;
  padding: 30px 40px 120px; 
}

/* 发现页 Hero Banner */
.discover-section { display: flex; flex-direction: column; gap: 20px; }

.hero-banner { 
  position: relative; 
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); 
  border-radius: 28px; 
  padding: 45px 50px; 
  overflow: hidden; 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-end; 
  border: 1px solid #fff; 
}

.hero-content { position: relative; z-index: 2; }
.hero-title { 
  font-size: 42px; 
  font-weight: 900; 
  color: #0f172a; 
  margin: 0 0 10px 0; 
  letter-spacing: -1px; 
}

.hero-title span { 
  color: transparent; 
  background-clip: text; 
  -webkit-background-clip: text; 
  background-image: linear-gradient(to right, #3b82f6, #8b5cf6); 
}

.hero-subtitle { font-size: 15px; color: #475569; margin: 0; font-weight: 600; }

.hero-actions { 
  position: relative; 
  z-index: 2; 
  display: flex; 
  flex-direction: column; 
  align-items: flex-end; 
  gap: 20px; 
}

.ios-segment-control { 
  display: flex; 
  background: rgba(255,255,255,0.6); 
  backdrop-filter: blur(10px); 
  padding: 6px; 
  border-radius: 20px; 
  gap: 5px; 
  border: 1px solid rgba(255,255,255,0.8); 
}

.segment-btn { 
  padding: 10px 24px; 
  border-radius: 14px; 
  font-weight: 600; 
  font-size: 14px; 
  color: #64748b; 
  cursor: pointer; 
  transition: 0.3s; 
}

.segment-btn.active { 
  background: #fff; 
  color: #3b82f6; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.08); 
}

/* Bento Grid 卡片样式 */
.bento-grid { padding: 10px 0; }

.bento-card { 
  background: #fff; 
  border-radius: 24px; 
  padding: 16px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.03); 
  transition: 0.4s; 
  cursor: pointer; 
  margin-bottom: 20px;
}

.bento-card:hover { 
  transform: translateY(-10px); 
  box-shadow: 0 20px 40px rgba(59,130,246,0.12); 
}

.bento-cover-box { 
  width: 100%; 
  aspect-ratio: 1; 
  border-radius: 16px; 
  overflow: hidden; 
  position: relative; 
}

.bento-cover { width: 100%; height: 100%; object-fit: cover; }

.bento-play-overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(0,0,0,0.25); 
  opacity: 0; 
  transition: 0.3s; 
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.bento-card:hover .bento-play-overlay { opacity: 1; }

.bento-play-btn { 
  width: 64px; 
  height: 64px; 
  background: rgba(255,255,255,0.25); 
  border-radius: 50%; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  backdrop-filter: blur(10px); 
  border: 1px solid rgba(255,255,255,0.6); 
  transform: translateY(20px); 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
}

.bento-card:hover .bento-play-btn { transform: translateY(0); }

.bento-info { padding: 16px 4px 4px; text-align: center; }
.bento-title { 
  font-size: 16px; 
  font-weight: 700; 
  margin-bottom: 6px; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}

/* 现代列表视图样式 */
.modern-list-view { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  padding: 10px 0;
}

.modern-list-item { 
  display: grid; 
  grid-template-columns: 1fr 80px 1fr; 
  align-items: center; 
  padding: 16px 30px; 
  background: #fff; 
  border-radius: 20px; 
  transition: 0.3s; 
  cursor: pointer; 
  border: 1px solid transparent;
}

.modern-list-item:hover { 
  transform: scale(1.01); 
  box-shadow: 0 10px 25px rgba(0,0,0,0.06); 
}

.modern-list-item.is-active-row { 
  background: linear-gradient(to right, #eff6ff, #fff); 
  border-color: #bfdbfe; 
}

.modern-title-group { display: flex; align-items: center; gap: 16px; }

.modern-title { 
  font-size: 16px; 
  font-weight: 600; 
  color: #1e293b; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
  max-width: 400px;
}

.active-text { color: #3b82f6; }

.track-status-box { 
  width: 30px; 
  text-align: center; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  color: #94a3b8; 
}

.track-num { display: block; font-size: 14px; font-weight: 600; }
.track-play { display: none; font-size: 22px; color: #94a3b8;}

.modern-list-item:hover .track-num { display: none; }
.modern-list-item:hover .track-play { display: block; }

.track-playing-icon { font-size: 22px; color: #3b82f6; }
.track-paused-icon { font-size: 22px; color: #3b82f6; }

.list-like-icon { color: #94a3b8; transition: 0.2s;}
.list-like-icon.is-liked { color: #ef4444; }

/* 通用头部与说明文字 */
.discover-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-end; 
  margin-bottom: 30px; 
  border-bottom: 1px solid #f1f5f9; 
  padding-bottom: 15px; 
}

.hero-section h2 { 
  font-size: 36px; 
  font-weight: 900; 
  color: #0f172a; 
  margin: 0 0 8px 0; 
  letter-spacing: -1px;
}

.theory-note { color: #64748b; font-size: 15px; margin: 0; font-weight: 500;}

/* 电台模式样式 */
.radio-layout { display: flex; gap: 30px; align-items: flex-start; }

.radio-player-panel { 
  flex: 0 0 320px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  background: #fff; 
  padding: 40px 20px; 
  border-radius: 24px; 
  box-shadow: 0 10px 40px rgba(0,0,0,0.04); 
  position: sticky; 
  top: 20px; 
  border: 1px solid #f1f5f9;
}

.radio-queue-panel { flex: 1; min-width: 0; }

.fm-cover-wrapper { 
  width: 240px; 
  height: 240px; 
  flex-shrink: 0; 
  aspect-ratio: 1 / 1; 
  border-radius: 50%; 
  box-shadow: 0 15px 35px rgba(0,0,0,0.2); 
  position: relative; 
  overflow: hidden; 
  animation: spin 20s linear infinite; 
  animation-play-state: paused; 
  border: 6px solid #0f172a; 
  margin-bottom: 25px; 
}

.fm-cover-wrapper.is-playing { animation-play-state: running; }
.fm-cover { width: 100%; height: 100%; }

.fm-center-hole { 
  position: absolute; 
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%); 
  width: 45px; 
  height: 45px; 
  background: #f8fafc; 
  border-radius: 50%; 
  border: 3px solid #333; 
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); 
}

.fm-info { text-align: center; width: 100%; }

.fm-info h3 { 
  font-size: 20px; 
  font-weight: 800; 
  color: #0f172a; 
  margin: 0 0 8px 0; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
}

.fm-info p { color: #64748b; font-size: 14px; margin: 0; font-weight: 500;}

@keyframes spin { 100% { transform: rotate(360deg); } }

/* 助眠模式样式 */
.sleep-mode-bg { 
  background: linear-gradient(135deg, #0f172a, #1e1b4b); 
  border-radius: 28px; 
  padding: 40px; 
  box-shadow: 0 20px 50px rgba(0,0,0,0.3) inset; 
  border: 1px solid rgba(255,255,255,0.1);
}

.dark-list { background: transparent !important; padding: 0;}

.dark-list .modern-list-item { 
  background: rgba(255,255,255,0.03); 
  border: 1px solid rgba(255,255,255,0.05); 
  color: #fff; 
  box-shadow: none;
}

.dark-list .modern-list-item:hover { 
  background: rgba(255,255,255,0.08); 
  border-color: rgba(255,255,255,0.1);
}

.dark-list .modern-title, .dark-list .modern-artist { color: #e2e8f0; }

.dark-list .modern-list-item.is-active-row { 
  background: rgba(59,130,246,0.15); 
  border-color: rgba(59,130,246,0.3);
}

.dark-list .active-text { color: #93c5fd; }
.dark-list .track-playing-icon, .dark-list .track-paused-icon { color: #93c5fd; }
.dark-list .track-play { color: #cbd5e1; }

/* 个人资料页样式 */
.profile-container { 
  max-width: 800px; 
  margin: 0 auto; 
  background: #fff; 
  border-radius: 28px; 
  padding: 50px; 
  box-shadow: 0 10px 40px rgba(0,0,0,0.03); 
  border: 1px solid #f1f5f9;
}

.profile-header { display: flex; align-items: center; gap: 35px; margin-bottom: 60px; }

.avatar-wrapper { position: relative; cursor: pointer; }

.avatar-edit { 
  position: absolute; 
  bottom: 0; 
  right: 0; 
  background: #3b82f6; 
  color: white; 
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border: 4px solid #fff; 
  transition: 0.3s; 
  box-shadow: 0 4px 10px rgba(59,130,246,0.3);
}

.profile-info h2 { display: flex; align-items: center; gap: 15px; }
.profile-info p { margin: 0; color: #64748b; display: flex; align-items: center; gap: 10px; font-weight: 500;}

.stats-row { text-align: center; }

.stat-card { 
  padding: 35px 20px; 
  background: #f8fafc; 
  border-radius: 24px; 
  transition: 0.4s; 
  border: 1px solid transparent;
}

.stat-card:hover { 
  transform: translateY(-8px); 
  box-shadow: 0 15px 30px rgba(0,0,0,0.04); 
  border-color: #e2e8f0; 
  background: #fff;
}

.stat-num { 
  font-size: 42px; 
  font-weight: 900; 
  color: #3b82f6; 
  margin-bottom: 12px; 
  font-family: monospace;
}

.stat-label { font-size: 15px; color: #64748b; font-weight: 700; }

/* 个人资料编辑器 */
.profile-editor-box { display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }

.upload-area { margin-bottom: 25px; text-align: center; }

.avatar-uploader .el-upload { 
  border: 2px dashed #d9d9d9; 
  border-radius: 50%; 
  cursor: pointer; 
  position: relative; 
  overflow: hidden; 
  transition: 0.3s; 
  width: 100px; 
  height: 100px; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  background: #f8fafc;
}

.avatar-uploader .el-upload:hover { border-color: #3b82f6; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; }
.avatar-preview { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
.upload-hint { font-size: 12px; color: #94a3b8; margin-top: 10px; }

/* 🚀 极其高贵的：全局吸底玻璃态批量操作舱 */
.batch-action-bar {
  position: fixed;
  bottom: 110px; /* 💥 完美悬浮在底部播放器 (90px) 的正上方 */
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.85); /* 极客深色玻璃态 */
  backdrop-filter: saturate(180%) blur(20px);
  padding: 15px 35px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); /* 深邃的悬浮阴影 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 3000; /* 💥 绝对置顶，无视任何滚动遮挡！ */
  color: #f8fafc;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
}

/* 🚀 赋予悬浮舱极其丝滑的弹出与消散动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 80px) scale(0.9); /* 从底部弹出的物理阻尼感 */
}

.ai-insight-panel {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-left: 4px solid #8b5cf6;
  padding: 15px 20px;
  border-radius: 4px 12px 12px 4px;
  margin: 15px 0 25px 0;
  max-width: 800px;
}
.insight-header { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #1e293b; margin-bottom: 8px; font-size: 14px; }
.insight-basis { color: #64748b; font-size: 14px; line-height: 1.7; margin: 0 0 12px 0; font-style: italic; }
.insight-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag-capsule { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }

/* 🚀 用户搜索名片样式 */
.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.08);
  border-color: #bfdbfe;
}
.u-avatar {
  border: 2px solid #eff6ff;
  flex-shrink: 0;
}
.u-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 4px;
}
.u-name {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.u-sign {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 🚀 消息铃铛与列表样式 */
.hover-bell { transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.hover-bell:hover { color: #3b82f6 !important; transform: scale(1.15) rotate(10deg); }

.contact-item { display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; transition: 0.2s; margin-bottom: 10px; border: 1px solid transparent; }
.contact-item:hover { background: #f8fafc; border-color: #e2e8f0; }
.c-info { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.c-name { font-size: 15px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c-sign { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

