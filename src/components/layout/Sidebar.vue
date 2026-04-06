<template>
  <aside class="sidebar">
    <div class="logo">
      <el-icon :size="28" color="#3b82f6"><MagicStick /></el-icon>
      <span class="logo-text">EchoScene <span class="badge">AI</span></span>
    </div>
    
    <nav class="nav-menu">
      <div class="nav-item" :class="{ active: musicStore.currentMenu === 'discover' }" @click="switchMenu('discover')">
        <el-icon><Compass /></el-icon> 发现音乐
      </div>
      
      <div class="nav-item" :class="{ active: musicStore.currentMenu === 'square' }" @click="switchMenu('square')">
        <el-icon><DataBoard /></el-icon> 歌单广场
      </div>
      
      <div class="nav-item" :class="{ active: musicStore.currentMenu === 'radio' }" @click="switchMenu('radio')">
        <el-icon><Mic /></el-icon> 智能场景电台
      </div>
      <div class="nav-item" :class="{ active: musicStore.currentMenu === 'profile' }" @click="switchMenu('profile')">
        <el-icon><User /></el-icon> 个人中心
      </div>
    </nav>

    <div class="menu-group">
      <h3 class="menu-label">我的</h3>
      <div class="menu-item" :class="{ active: musicStore.currentMenu === 'friends' }" @click="switchMenu('friends')">
        <el-icon><UserFilled /></el-icon> <span>我的好友</span>
      </div>
    </div>

    <div class="nav-group">我的音乐</div>
    <div class="nav-sub-item" :class="{ active: musicStore.currentMenu === 'liked' }" @click="switchMenu('liked')">❤️ 我喜欢的</div>
    <div class="nav-sub-item" :class="{ active: musicStore.currentMenu === 'sleep' }" @click="switchMenu('sleep')">🌙 助眠系列</div>
    <div class="nav-sub-item" :class="{ active: musicStore.currentMenu === 'history' }" @click="switchMenu('history')">🕒 最近播放</div>

    <div class="nav-group" style="display:flex; justify-content:space-between; align-items:center;">
      <span>自建歌单</span>
      <el-icon style="cursor:pointer; color:#3b82f6;" @click="$emit('open-playlist-dialog')"><Plus /></el-icon>
    </div>
    <div 
      v-for="pl in musicStore.customPlaylists" 
      :key="'own_'+pl.id"
      class="nav-sub-item" 
      :class="{ active: musicStore.currentMenu === 'playlist_' + pl.id }" 
      @click="switchMenu('playlist_' + pl.id)"
    >
      💿 {{ pl.name }}
    </div>

    <div class="menu-group-title" v-if="musicStore.currentUser">🌟 收藏的歌单</div>
    
    <div class="nav-sub-item" v-if="musicStore.currentUser && musicStore.collectedPlaylists.length === 0" @click="switchMenu('square')" style="cursor: pointer; opacity: 0.6;">
      <span style="font-size: 12px; margin-left: 26px;">去广场发现宝藏吧...</span>
    </div>

    <div 
      v-for="pl in musicStore.collectedPlaylists" 
      :key="'col_'+pl.id"
      class="nav-sub-item" 
      :class="{ active: musicStore.currentMenu === 'col_playlist_' + pl.id }" 
      @click="switchMenu('col_playlist_' + pl.id)"
    >
      🌟 {{ pl.name }}
    </div>
  </aside>
</template>

<script setup>
import { Compass, Mic, User, MagicStick, Plus, DataBoard, UserFilled } from '@element-plus/icons-vue'
import { useMusicStore } from '../../store/music'

const musicStore = useMusicStore()

// 极其纯粹的 UI 组件，切换菜单时，只负责抛出事件让大厅去请求数据，同时修改自己的高亮状态
const emit = defineEmits(['switch-menu', 'open-playlist-dialog'])

const switchMenu = (menuName) => {
  musicStore.currentMenu = menuName
  emit('switch-menu', menuName)
}
</script>

<style scoped>
/* 1. 极其克制的 Apple Music 级侧边栏 */
.sidebar { width: 240px; background-color: #f4f4f5; border-right: none; padding: 35px 20px; display: flex; flex-direction: column; z-index: 10; }
.logo { display: flex; align-items: center; gap: 10px; margin-bottom: 45px; padding-left: 10px; }
.logo-text { font-size: 22px; font-weight: 800; color: #18181b; letter-spacing: -0.5px; }
.badge { font-size: 10px; background: #18181b; color: #fff; padding: 2px 6px; border-radius: 4px; vertical-align: super; }
.menu-group { margin: 35px 0 12px 10px; }
.menu-label { font-size: 12px; color: #a1a1aa; font-weight: 700; margin: 0 0 12px 0; letter-spacing: 1px; }
.menu-item { padding: 10px 15px; border-radius: 8px; cursor: pointer; color: #52525b; margin-bottom: 2px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; transition: all 0.2s ease; }
.menu-item:hover { color: #18181b; background-color: #e4e4e7; }
.menu-item.active { background-color: #d4d4d8; color: #18181b; font-weight: 700; }
.nav-group { font-size: 12px; color: #a1a1aa; font-weight: 700; margin: 35px 0 12px 10px; letter-spacing: 1px; }
.nav-item { padding: 10px 15px; border-radius: 8px; cursor: pointer; color: #52525b; margin-bottom: 2px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; transition: all 0.2s ease; }
.nav-item:hover { color: #18181b; background-color: #e4e4e7; }
.nav-item.active { background-color: #d4d4d8; color: #18181b; font-weight: 700; }
.nav-sub-item { padding: 10px 15px; font-size: 14px; color: #52525b; font-weight: 500; cursor: pointer; border-radius: 8px; margin-bottom: 2px; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
.nav-sub-item:hover { color: #18181b; background-color: #e4e4e7; }
.nav-sub-item.active { background-color: #d4d4d8; color: #18181b; font-weight: 700; }
</style>