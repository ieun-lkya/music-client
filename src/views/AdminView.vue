<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <el-icon :size="24" color="#fff"><Monitor /></el-icon>
        <span>EchoAdmin <span>Pro</span></span>
      </div>
      <nav class="nav-menu">
        <div class="nav-item" :class="{ active: currentTab === 'dashboard' }" @click="switchTab('dashboard')">
          <el-icon><DataLine /></el-icon> 数据大屏
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'publish' }" @click="switchTab('publish')">
          <el-icon><UploadFilled /></el-icon> 发布中心
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'manage' }" @click="switchTab('manage')">
          <el-icon><List /></el-icon> 曲库管理
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'users' }" @click="switchTab('users')">
          <el-icon><UserFilled /></el-icon> 用户管理
        </div>
      </nav>
      <div class="logout-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon> 退出系统
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <h2>{{ pageTitle }}</h2>
        <div class="admin-info">
          <el-button size="small" plain @click="refreshCurrentTab" :loading="currentTab === 'dashboard' ? isDashboardLoading : tableLoading">
            刷新当前页
          </el-button>
          <el-tag type="success" effect="plain">在线</el-tag>
          <span>{{ adminProfile.displayName }}</span>
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
        </div>
      </header>

      <div class="content-wrapper">
        
        <div v-show="currentTab === 'dashboard'" class="dashboard-container fade-in" v-loading="isDashboardLoading">
          <el-row :gutter="20" class="stat-cards">
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card data-card-1">
                <div class="stat-title">全站注册用户数</div>
                <div class="stat-value">{{ dashboardData.userCount || 0 }} <span class="unit">人</span></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card data-card-2">
                <div class="stat-title">曲库总容量</div>
                <div class="stat-value">{{ dashboardData.musicCount || 0 }} <span class="unit">首</span></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card data-card-3">
                <div class="stat-title">红心收藏总次数</div>
                <div class="stat-value">{{ dashboardData.likeCount || 0 }} <span class="unit">次</span></div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="20" class="chart-row">
            <el-col :span="12">
              <el-card shadow="never" class="chart-card">
                <template #header><div class="card-header">🎵 AI 曲库场景标签分布</div></template>
                <div ref="pieChartRef" class="chart-box tag-chart-box"></div>
                <el-collapse v-model="tagCollapseActive" class="tag-collapse">
                  <el-collapse-item title="查看全部场景标签" name="tags">
                    <div class="tag-groups">
                      <div class="tag-group" v-for="group in groupedTagDistribution" :key="group.name">
                        <div class="tag-group-title">{{ group.name }}</div>
                        <div class="tag-chip-list">
                          <el-tag v-for="tag in group.items" :key="tag.name" size="small" effect="plain">
                            {{ tag.name }} · {{ tag.value }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="chart-card">
                <template #header><div class="card-header">🔥 听歌用户最爱 (收藏 TOP 5)</div></template>
                <div ref="barChartRef" class="chart-box"></div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="20" class="chart-row">
            <el-col :span="8">
              <el-card shadow="never" class="chart-card">
                <template #header><div class="card-header">📈 近 14 天播放趋势</div></template>
                <div ref="trendChartRef" class="chart-box small-chart"></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="chart-card">
                <template #header><div class="card-header">🎤 Top 歌手排行</div></template>
                <div ref="artistChartRef" class="chart-box small-chart"></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="chart-card">
                <template #header><div class="card-header">🧩 曲库资源完整度</div></template>
                <div ref="resourceChartRef" class="chart-box small-chart"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-show="currentTab === 'publish'" class="publish-container fade-in">
          <el-card class="publish-card" shadow="never">
            <template #header><div class="card-header"><span>发布新音乐</span></div></template>
            <el-form :model="form" label-width="80px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="歌曲名称"><el-input v-model="form.title" placeholder="如：七里香" /></el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="演唱歌手"><el-input v-model="form.artist" placeholder="如：周杰伦" /></el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="场景标签" required>
                <div style="display: flex; flex-direction: column; width: 100%;">
                  <div style="display: flex; gap: 10px; width: 100%;">
                    <el-input v-model="form.tags" placeholder="从下方词库中选择，多个用英文逗号分隔" style="flex: 1;" />
                    <el-button type="success" plain icon="MagicStick" @click="handleAiTagging" :loading="isAiTagging">
                      AI 智能打标
                    </el-button>
                  </div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 6px; line-height: 1.4;">
                    <span style="color:#6b7280; font-weight:bold;">规定词库：</span>流行, 摇滚, 民谣, 电子, 纯音乐, 伤感, 治愈, 励志, 轻松, 助眠, 运动, 驾车, 雨天, 深夜, 咖啡馆, 工作学习, 华语, 欧美, 日韩, 怀旧, 爱情, 浪漫, 节奏控, 古风, 经典
                  </div>
                </div>
              </el-form-item>

              <el-row :gutter="15">
                <el-col :span="8">
                  <div class="upload-col-title">🎧 音频 (MP3)</div>
                  <el-upload ref="uploadAudioRef" action="" :auto-upload="false" :on-change="handleAudioChange" :limit="1" accept="audio/mpeg, audio/mp3" class="compact-upload" drag>
                    <el-icon class="el-icon--upload"><Headset /></el-icon>
                    <div class="el-upload__text">拖拽音频到此</div>
                  </el-upload>
                  <div class="file-name" v-if="audioFile">
                    <span class="text-truncate">{{ audioFile.name }}</span>
                    <el-tag size="small" type="warning" effect="dark" v-if="isParsing" style="margin-left: 5px;">解析中</el-tag>
                    <el-tag size="small" type="success" effect="dark" v-else-if="audioFile && !isParsing" style="margin-left: 5px;">完成</el-tag>
                  </div>
                </el-col>

                <el-col :span="8">
                  <div class="upload-col-title">🖼️ 封面 (JPG/PNG)</div>
                  <div v-if="parsedCover && !imageFile" class="compact-parsed-cover">
                    <el-image :src="parsedCover" fit="cover" />
                    <div class="cover-tip">内置封面</div>
                  </div>
                  <el-upload v-else ref="uploadImageRef" action="" :auto-upload="false" :on-change="handleImageChange" :limit="1" accept="image/jpeg, image/png" class="compact-upload" drag>
                    <el-icon class="el-icon--upload"><Picture /></el-icon>
                    <div class="el-upload__text">拖拽封面到此</div>
                  </el-upload>
                  <div class="file-name" v-if="imageFile"><span class="text-truncate">{{ imageFile.name }}</span></div>
                </el-col>

                <el-col :span="8">
                  <div class="upload-col-title">📝 歌词 (LRC)</div>
                  <el-upload ref="uploadLyricRef" action="" :auto-upload="false" :on-change="(f) => lyricFile = f.raw" :limit="1" accept=".lrc" class="compact-upload" drag>
                    <el-icon class="el-icon--upload"><Document /></el-icon>
                    <div class="el-upload__text">拖拽歌词到此</div>
                  </el-upload>
                  <div class="file-name" v-if="lyricFile"><span class="text-truncate">{{ lyricFile.name }}</span></div>
                </el-col>
              </el-row>

              <div class="quality-panel">
                <div class="quality-title">发布质量检查</div>
                <div class="quality-items">
                  <span v-for="item in publishQualityItems" :key="item.label" class="quality-item" :class="{ ok: item.ok }">
                    {{ item.ok ? '✓' : '!' }} {{ item.label }}
                  </span>
                </div>
              </div>

              <div style="margin-top: 30px;">
                <el-button type="primary" size="large" @click="submitMusic" :loading="isSubmitting" class="submit-btn">🚀 确 认 发 布 入 库</el-button>
              </div>
            </el-form>
          </el-card>
        </div>

        <div v-show="currentTab === 'manage'" class="manage-container fade-in">
          <el-card shadow="never" class="table-card">
            <div class="manage-toolbar">
              <div>
                <div class="toolbar-title">曲库歌曲</div>
                <div class="toolbar-subtitle">共 {{ musicList.length }} 首，当前筛选 {{ filteredMusicList.length }} 首</div>
              </div>
              <el-input
                v-model="musicSearchKeyword"
                clearable
                placeholder="按歌名、歌手或标签搜索"
                class="manage-search"
              />
            </div>
            <div class="filter-strip">
              <el-select v-model="tagFilter" clearable placeholder="按标签筛选" class="filter-select">
                <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
              </el-select>
              <el-select v-model="resourceFilter" clearable placeholder="按资源状态筛选" class="filter-select">
                <el-option label="资源完整" value="complete" />
                <el-option label="缺封面" value="missingCover" />
                <el-option label="缺歌词" value="missingLyric" />
                <el-option label="缺音频" value="missingAudio" />
              </el-select>
              <el-button plain @click="clearMusicFilters">清空筛选</el-button>
            </div>
            <el-table :data="filteredMusicList" stripe style="width: 100%" v-loading="tableLoading" height="600" empty-text="没有匹配的歌曲">
              <el-table-column label="封面" width="90">
                <template #default="scope">
                  <el-image :src="scope.row.coverUrl" style="width: 50px; height: 50px; border-radius: 6px;" fit="cover" />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="歌曲名称" width="180" />
              <el-table-column prop="artist" label="歌手" width="130" />
              <el-table-column prop="tags" label="场景标签">
                <template #default="scope">
                  <el-tag v-for="tag in (scope.row.tags ? scope.row.tags.split(',') : [])" :key="tag" size="small" style="margin-right: 5px; margin-bottom: 2px;">
                    {{ tag }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="歌词状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.lyricUrl ? 'success' : 'info'" size="small">
                    {{ scope.row.lyricUrl ? '已包含' : '无歌词' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="资源状态" width="150">
                <template #default="scope">
                  <el-tag :type="getResourceStatus(scope.row).type" size="small">
                    {{ getResourceStatus(scope.row).label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="scope">
                  <el-button type="primary" link icon="Edit" @click="openEditDialog(scope.row)">编辑</el-button>
                  <el-popconfirm title="彻底删除歌曲及云端文件？" @confirm="handleDelete(scope.row.id)" confirm-button-type="danger">
                    <template #reference>
                      <el-button type="danger" link icon="Delete">删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <div v-show="currentTab === 'users'" class="manage-container fade-in">
          <el-card shadow="never" class="table-card">
            <div class="manage-toolbar">
              <div>
                <div class="toolbar-title">注册用户</div>
                <div class="toolbar-subtitle">共 {{ userList.length }} 位，当前筛选 {{ filteredUserList.length }} 位</div>
              </div>
              <el-input
                v-model="userSearchKeyword"
                clearable
                placeholder="按账号、昵称或签名搜索"
                class="manage-search"
                @keyup.enter="fetchUserList"
              />
            </div>
            <div class="filter-strip">
              <el-button type="primary" plain @click="fetchUserList" :loading="userTableLoading">查询用户</el-button>
              <el-button plain @click="clearUserSearch">清空搜索</el-button>
            </div>
            <el-table :data="filteredUserList" stripe style="width: 100%" v-loading="userTableLoading" height="600" empty-text="没有匹配的用户">
              <el-table-column label="用户" min-width="220">
                <template #default="scope">
                  <div class="user-cell">
                    <el-avatar :size="42" :src="scope.row.avatar" />
                    <div>
                      <div class="user-cell-name">{{ scope.row.nickname || scope.row.username }}</div>
                      <div class="user-cell-sub">@{{ scope.row.username }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="signature" label="个性签名" min-width="260" show-overflow-tooltip />
              <el-table-column prop="likeCount" label="收藏" width="90" sortable />
              <el-table-column prop="playlistCount" label="歌单" width="90" sortable />
              <el-table-column prop="playCount" label="播放" width="90" sortable />
              <el-table-column prop="createTime" label="注册时间" width="170" />
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="scope">
                  <el-button type="warning" link @click="resetUserProfile(scope.row)">重置资料</el-button>
                  <el-popconfirm title="删除该用户及其收藏、歌单、聊天等关联数据？" @confirm="deleteUser(scope.row.id)" confirm-button-type="danger">
                    <template #reference>
                      <el-button type="danger" link>删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

      </div>
    </main>

    <el-dialog v-model="editDialogVisible" title="✏️ 修改音乐档案" width="800px" top="5vh">
      <el-form :model="editForm" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="歌曲名称"><el-input v-model="editForm.title" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="歌手"><el-input v-model="editForm.artist" /></el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="场景标签" required>
          <div style="display: flex; flex-direction: column; width: 100%;">
            <div style="display: flex; gap: 10px; width: 100%;">
              <el-input v-model="editForm.tags" placeholder="从下方词库中选择，多个用英文逗号分隔" style="flex: 1;" />
              <el-button type="success" plain @click="handleEditAiTagging" :loading="isAiTagging">AI 打标</el-button>
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 6px; line-height: 1.4;">
              <span style="color:#6b7280; font-weight:bold;">规定词库：</span>流行，摇滚，民谣，电子，纯音乐，伤感，治愈，励志，轻松，助眠，运动，驾车，雨天，深夜，咖啡馆，工作学习，华语，欧美，日韩，怀旧，爱情，浪漫，节奏控，古风，经典
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="15" style="margin-top: 15px;">
          <el-col :span="8">
            <div class="upload-col-title">🖼️ 替换封面</div>
            <el-upload ref="editUploadImageRef" action="" :auto-upload="false" :on-change="handleEditCoverChange" :limit="1" accept="image/*" class="compact-upload" drag>
              <el-icon class="el-icon--upload"><Picture /></el-icon>
              <div class="el-upload__text">拖入新封面</div>
            </el-upload>
            <div v-if="editCoverFile" class="file-name text-truncate">待更: {{ editCoverFile.name }}</div>
          </el-col>

          <el-col :span="8">
            <div class="upload-col-title">🎧 替换音频</div>
            <el-upload ref="editUploadAudioRef" action="" :auto-upload="false" :on-change="handleEditAudioChange" :limit="1" accept="audio/*" class="compact-upload" drag>
              <el-icon class="el-icon--upload"><Headset /></el-icon>
              <div class="el-upload__text">拖入新音频</div>
            </el-upload>
            <div v-if="editAudioFile" class="file-name text-truncate">待更: {{ editAudioFile.name }}</div>
          </el-col>

          <el-col :span="8">
            <div class="upload-col-title">📝 替换歌词</div>
            <el-upload ref="editUploadLyricRef" action="" :auto-upload="false" :on-change="(f) => editLyricFile = f.raw" :limit="1" accept=".lrc" class="compact-upload" drag>
              <el-icon class="el-icon--upload"><Document /></el-icon>
              <div class="el-upload__text">拖入新歌词</div>
            </el-upload>
            <div v-if="editLyricFile" class="file-name text-truncate">待更: {{ editLyricFile.name }}</div>
          </el-col>
        </el-row>

        <div class="quality-panel edit-quality">
          <div class="quality-title">当前资源状态</div>
          <div class="quality-items">
            <span v-for="item in editQualityItems" :key="item.label" class="quality-item" :class="{ ok: item.ok }">
              {{ item.ok ? '✓' : '!' }} {{ item.label }}
            </span>
          </div>
        </div>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="isEditing">保 存 修 改</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, DataLine, UploadFilled, List, SwitchButton, Plus, Edit, Delete, MagicStick, Picture, Document, Headset, UserFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts' // 🚀 补回被删掉的 echarts！
import { getMusicListAPI } from '../api/modules/music'
import {
  deleteMusicByAdminAPI,
  deleteUserByAdminAPI,
  getAdminProfileAPI,
  getAdminUsersAPI,
  getDashboardDataAPI,
  parseOnlyAPI,
  publishMusicAPI,
  resetUserProfileAPI,
  suggestTagsAPI,
  updateMusicByAdminAPI
} from '../api/modules/admin'

const router = useRouter()
const currentTab = ref('dashboard')
const adminProfile = ref({ username: 'admin', displayName: '超级管理员', role: 'ADMIN' })
const pageTitle = computed(() => {
  if (currentTab.value === 'dashboard') return '📊 核心数据看板'
  if (currentTab.value === 'publish') return '🚀 音乐发布中心'
  if (currentTab.value === 'manage') return '🎵 全站曲库管理'
  return '👥 用户管理中心'
})

const loadAdminProfile = async () => {
  try {
    const profile = await getAdminProfileAPI()
    adminProfile.value = {
      username: profile.username || 'admin',
      displayName: profile.displayName || '超级管理员',
      role: profile.role || 'ADMIN'
    }
    localStorage.setItem('admin_profile', JSON.stringify(adminProfile.value))
  } catch (error) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_profile')
    router.push({ path: '/login', query: { role: 'admin', redirect: '/admin' } })
  }
}

const switchTab = (tab) => {
  currentTab.value = tab
  if (tab === 'dashboard') fetchDashboardData()
  if (tab === 'manage') fetchMusicList()
  if (tab === 'users') fetchUserList()
}

// ================= 大屏逻辑 (Echarts 满血复活) =================
const dashboardData = ref({
  userCount: 0,
  musicCount: 0,
  likeCount: 0,
  tagDistribution: [],
  topSongs: [],
  playTrend: [],
  topArtists: [],
  resourceCompleteness: []
})
const isDashboardLoading = ref(false)
const tagCollapseActive = ref(['tags'])
const pieChartRef = ref(null)
const barChartRef = ref(null)
const trendChartRef = ref(null)
const artistChartRef = ref(null)
const resourceChartRef = ref(null)
let pieChartInstance = null
let barChartInstance = null
let trendChartInstance = null
let artistChartInstance = null
let resourceChartInstance = null

const TAG_GROUPS = [
  { name: '风格', tags: ['流行', '摇滚', '民谣', '电子', '纯音乐', '古风', '经典'] },
  { name: '情绪', tags: ['伤感', '治愈', '励志', '轻松', '爱情', '浪漫', '怀旧'] },
  { name: '场景', tags: ['助眠', '运动', '驾车', '雨天', '深夜', '咖啡馆', '工作学习'] },
  { name: '语种地区', tags: ['华语', '欧美', '日韩'] },
  { name: '节奏偏好', tags: ['节奏控'] }
]

const groupedTagDistribution = computed(() => {
  const valueMap = new Map((dashboardData.value.tagDistribution || []).map(item => [item.name, item.value]))
  const used = new Set()
  const groups = TAG_GROUPS.map(group => {
    const items = group.tags.map(tag => {
      used.add(tag)
      return { name: tag, value: valueMap.get(tag) || 0 }
    })
    return { ...group, items }
  })
  const others = (dashboardData.value.tagDistribution || []).filter(item => !used.has(item.name))
  if (others.length > 0) {
    groups.push({ name: '其他', items: others })
  }
  return groups
})

const fetchDashboardData = async () => {
  isDashboardLoading.value = true
  try {
    const res = await getDashboardDataAPI()
    dashboardData.value = res || dashboardData.value
    await nextTick()
    initCharts()
  } catch (error) { 
    console.error('获取大屏数据失败，使用模拟数据展示...', error) 
    // 兜底数据，万一后端接口没写好，也不至于白屏！
    dashboardData.value = {
      userCount: 128, musicCount: musicList.value.length || 56, likeCount: 890,
      tagDistribution: [
        { name: '流行', value: 35 }, { name: '伤感', value: 20 }, { name: '治愈', value: 15 },
        { name: '纯音乐', value: 10 }, { name: '工作学习', value: 8 }
      ],
      topSongs: [
        { title: '七里香', likes: 230 }, { title: '夜曲', likes: 180 }, { title: '晴天', likes: 150 },
        { title: '稻香', likes: 120 }, { title: '青花瓷', likes: 90 }
      ],
      playTrend: [],
      topArtists: [
        { name: '周杰伦', value: 30 }, { name: '林俊杰', value: 18 }, { name: '陈奕迅', value: 12 }
      ],
      resourceCompleteness: [
        { name: '音频完整', value: 56 }, { name: '封面完整', value: 45 }, { name: '歌词完整', value: 32 },
        { name: '缺封面', value: 11 }, { name: '缺歌词', value: 24 }
      ]
    }
    await nextTick()
    initCharts()
  } finally {
    isDashboardLoading.value = false
  }
}

// 🚀 找回灵魂的大厂级 Echarts 渲染配置！
const initCharts = () => {
  if (pieChartRef.value) {
    if (!pieChartInstance) {
      pieChartInstance = echarts.init(pieChartRef.value)
    }
    pieChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 6,
        left: 24,
        right: 24,
        itemWidth: 12,
        itemHeight: 8,
        pageIconColor: '#3b82f6',
        pageTextStyle: { color: '#64748b' },
        textStyle: { color: '#475569', fontSize: 12 }
      },
      series: [
        {
          name: '标签分布',
          type: 'pie',
          radius: ['42%', '66%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}',
            color: '#374151',
            fontSize: 11
          },
          labelLine: {
            show: true,
            length: 8,
            length2: 8
          },
          emphasis: {
            label: {
              show: true,
              formatter: '{b}\n{c} 首',
              fontSize: 14,
              fontWeight: 800,
              color: '#111827'
            }
          },
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          data: dashboardData.value.tagDistribution
        }
      ]
    })
  }

  if (barChartRef.value) {
    if (!barChartInstance) {
      barChartInstance = echarts.init(barChartRef.value)
    }
    barChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dashboardData.value.topSongs?.map(s => s.title) || [], axisTick: { alignWithLabel: true } },
      yAxis: { type: 'value' },
      series: [
        {
          name: '收藏数',
          type: 'bar',
          barWidth: '40%',
          itemStyle: { 
            borderRadius: [4, 4, 0, 0], 
            // 极其炫酷的蓝蓝渐变色
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#83bff6' }, { offset: 1, color: '#188df0' }]) 
          },
          data: dashboardData.value.topSongs?.map(s => s.likes) || []
        }
      ]
    })
  }

  if (trendChartRef.value) {
    if (!trendChartInstance) {
      trendChartInstance = echarts.init(trendChartRef.value)
    }
    const trend = dashboardData.value.playTrend || []
    trendChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 18, top: 30, bottom: 42 },
      xAxis: {
        type: 'category',
        data: trend.map(item => String(item.label).slice(5)),
        axisLabel: { color: '#6b7280' }
      },
      yAxis: { type: 'value', axisLabel: { color: '#6b7280' }, splitLine: { lineStyle: { color: '#eef2f7' } } },
      series: [{
        name: '播放次数',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        areaStyle: { color: 'rgba(59,130,246,0.12)' },
        lineStyle: { color: '#3b82f6', width: 3 },
        itemStyle: { color: '#3b82f6' },
        data: trend.map(item => item.value)
      }]
    })
  }

  if (artistChartRef.value) {
    if (!artistChartInstance) {
      artistChartInstance = echarts.init(artistChartRef.value)
    }
    const artists = dashboardData.value.topArtists || []
    artistChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 70, right: 18, top: 24, bottom: 24 },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f7' } } },
      yAxis: {
        type: 'category',
        data: artists.map(item => item.name),
        axisLabel: { color: '#374151', fontWeight: 700 }
      },
      series: [{
        name: '播放次数',
        type: 'bar',
        barWidth: 14,
        itemStyle: { borderRadius: [0, 10, 10, 0], color: '#10b981' },
        data: artists.map(item => item.value)
      }]
    })
  }

  if (resourceChartRef.value) {
    if (!resourceChartInstance) {
      resourceChartInstance = echarts.init(resourceChartRef.value)
    }
    resourceChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        name: '资源状态',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 8 },
        data: dashboardData.value.resourceCompleteness || []
      }]
    })
  }
}

const resizeCharts = () => {
  pieChartInstance?.resize()
  barChartInstance?.resize()
  trendChartInstance?.resize()
  artistChartInstance?.resize()
  resourceChartInstance?.resize()
}

// ================= 发布中心逻辑 =================
const form = reactive({ title: '', artist: '', tags: '' })
const audioFile = ref(null)
const imageFile = ref(null)
const lyricFile = ref(null) 
const uploadLyricRef = ref(null)

const isSubmitting = ref(false)
const isParsing = ref(false)
const parsedCover = ref('')
const isAiTagging = ref(false)

const uploadAudioRef = ref(null)
const uploadImageRef = ref(null)

const publishQualityItems = computed(() => [
  { label: '音频已选择', ok: !!audioFile.value },
  { label: '歌名已填写', ok: !!form.title.trim() },
  { label: '歌手已填写', ok: !!form.artist.trim() },
  { label: '标签已填写', ok: !!form.tags.trim() },
  { label: '封面可用', ok: !!imageFile.value || !!parsedCover.value },
  { label: '歌词可选', ok: !!lyricFile.value }
])

const handleAudioChange = async (file) => {
  audioFile.value = file.raw
  if (!audioFile.value) return

  isParsing.value = true
  ElMessage.info('🤖 正在解析 MP3 元数据...')
  const formData = new FormData()
  formData.append('file', audioFile.value)

  try {
    const res = await parseOnlyAPI(formData)
    if (res.title) form.title = res.title
    if (res.artist) form.artist = res.artist
    if (res.coverBase64) parsedCover.value = res.coverBase64
    ElMessage.success('🎉 解析成功！')
  } catch (error) {
    ElMessage.warning('未能自动解析出信息，请手动填写')
  } finally {
    isParsing.value = false
  }
}

const handleImageChange = (file) => { imageFile.value = file.raw }

const handleAiTagging = async () => {
  if (!form.title) return ElMessage.warning('请先填写（或上传解析）歌名哦！')
  isAiTagging.value = true
  try {
    const res = await suggestTagsAPI(form.title, form.artist || '未知')
    form.tags = res
    ElMessage.success('✨ AI 已自动为您选好最佳标签！')
  } catch (error) {
    ElMessage.error('AI 打标失败')
  } finally {
    isAiTagging.value = false
  }
}

const submitMusic = async () => {
  if (!audioFile.value || !form.title || !form.artist) return ElMessage.warning("音频、歌名、歌手为必填！")
  
  // 🚀 1. 新增：发布时的铁壁拦截
  const tagCheck = validateAndFormatTags(form.tags)
  if (!tagCheck.valid) return ElMessage.warning(tagCheck.msg)
  form.tags = tagCheck.formatted // 覆盖为极其标准的英文逗号格式！

  isSubmitting.value = true
  const formData = new FormData()
  formData.append('file', audioFile.value)
  if (imageFile.value) formData.append('coverFile', imageFile.value)
  if (lyricFile.value) formData.append('lyricFile', lyricFile.value)
  
  formData.append('title', form.title)
  formData.append('artist', form.artist)
  formData.append('tags', form.tags)

  try {
    await publishMusicAPI(formData)
    ElMessage.success("🎉 发布成功！")
    
    // 清空一切
    form.title = ''; form.artist = ''; form.tags = '';
    audioFile.value = null; imageFile.value = null; lyricFile.value = null;
    parsedCover.value = '';
    
    if (uploadAudioRef.value) uploadAudioRef.value.clearFiles()
    if (uploadImageRef.value) uploadImageRef.value.clearFiles()
    if (uploadLyricRef.value) uploadLyricRef.value.clearFiles()

  } catch (error) { ElMessage.error("发布失败") } finally { isSubmitting.value = false }
}

// ================= 曲库管理与编辑逻辑 =================
const musicList = ref([])
const tableLoading = ref(false)
const musicSearchKeyword = ref('')
const tagFilter = ref('')
const resourceFilter = ref('')
const availableTags = computed(() => {
  const tags = new Set()
  musicList.value.forEach(item => {
    String(item.tags || '')
      .split(/[,，]/)
      .map(tag => tag.trim())
      .filter(Boolean)
      .forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})
const filteredMusicList = computed(() => {
  const keyword = musicSearchKeyword.value.trim().toLowerCase()
  return musicList.value.filter(item => {
    const matchesKeyword = !keyword || [item.title, item.artist, item.tags]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword))
    const matchesTag = !tagFilter.value || String(item.tags || '')
      .split(/[,，]/)
      .map(tag => tag.trim())
      .includes(tagFilter.value)
    const matchesResource = !resourceFilter.value || getResourceStatus(item).value === resourceFilter.value
    return matchesKeyword && matchesTag && matchesResource
  })
})

const clearMusicFilters = () => {
  musicSearchKeyword.value = ''
  tagFilter.value = ''
  resourceFilter.value = ''
}

const getResourceStatus = (row) => {
  if (!row.audioUrl) return { label: '缺音频', type: 'danger', value: 'missingAudio' }
  if (!row.coverUrl) return { label: '缺封面', type: 'warning', value: 'missingCover' }
  if (!row.lyricUrl) return { label: '缺歌词', type: 'info', value: 'missingLyric' }
  return { label: '资源完整', type: 'success', value: 'complete' }
}

const fetchMusicList = async () => {
  tableLoading.value = true
  try {
    const data = await getMusicListAPI()
    musicList.value = data
  } catch (error) { ElMessage.error("获取歌曲列表失败") } finally { tableLoading.value = false }
}

const handleDelete = async (id) => {
  try {
    await deleteMusicByAdminAPI(id)
    ElMessage.success("已彻底双重删除！")
    fetchMusicList() 
  } catch (error) { ElMessage.error("删除失败") }
}

// ================= 用户管理逻辑 =================
const userList = ref([])
const userTableLoading = ref(false)
const userSearchKeyword = ref('')
const filteredUserList = computed(() => {
  const keyword = userSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return userList.value
  return userList.value.filter(user => {
    return [user.username, user.nickname, user.signature]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword))
  })
})

const fetchUserList = async () => {
  userTableLoading.value = true
  try {
    userList.value = await getAdminUsersAPI(userSearchKeyword.value.trim())
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    userTableLoading.value = false
  }
}

const clearUserSearch = () => {
  userSearchKeyword.value = ''
  fetchUserList()
}

const resetUserProfile = async (user) => {
  try {
    await resetUserProfileAPI(user.id)
    ElMessage.success('用户资料已重置')
    fetchUserList()
  } catch (error) {
    ElMessage.error(error?.message || '重置用户资料失败')
  }
}

const deleteUser = async (id) => {
  try {
    await deleteUserByAdminAPI(id)
    ElMessage.success('用户已删除')
    fetchUserList()
    fetchDashboardData()
  } catch (error) {
    ElMessage.error(error?.message || '删除用户失败')
  }
}

const editDialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({ id: '', title: '', artist: '', tags: '', coverUrl: '', audioUrl: '' })
const editCoverFile = ref(null)
const editAudioFile = ref(null)
const editLyricFile = ref(null) 
const editOriginalLyricUrl = ref('')

const editUploadLyricRef = ref(null)
const editUploadImageRef = ref(null)
const editUploadAudioRef = ref(null)

const openEditDialog = (row) => {
  editForm.id = row.id; editForm.title = row.title; editForm.artist = row.artist; 
  editForm.tags = row.tags || ''; editForm.coverUrl = row.coverUrl; editForm.audioUrl = row.audioUrl;
  editOriginalLyricUrl.value = row.lyricUrl || ''
  editCoverFile.value = null; editAudioFile.value = null; editLyricFile.value = null; 
  if(editUploadImageRef.value) editUploadImageRef.value.clearFiles()
  if(editUploadAudioRef.value) editUploadAudioRef.value.clearFiles()
  if(editUploadLyricRef.value) editUploadLyricRef.value.clearFiles() 
  editDialogVisible.value = true
}

const handleEditCoverChange = (file) => { editCoverFile.value = file.raw }
const handleEditAudioChange = (file) => { editAudioFile.value = file.raw }

const editQualityItems = computed(() => [
  { label: '音频可用', ok: !!editForm.audioUrl || !!editAudioFile.value },
  { label: '封面可用', ok: !!editForm.coverUrl || !!editCoverFile.value },
  { label: '歌词可用', ok: !!editOriginalLyricUrl.value || !!editLyricFile.value },
  { label: '标签已填写', ok: !!editForm.tags.trim() }
])

const handleEditAiTagging = async () => {
  isAiTagging.value = true
  try {
    const res = await suggestTagsAPI(editForm.title, editForm.artist || '未知')
    editForm.tags = res
    ElMessage.success('✨ AI 重新打标成功！')
  } catch (error) { ElMessage.error('AI 打标失败') } finally { isAiTagging.value = false }
}

const submitEdit = async () => {
  // 🚀 2. 新增：编辑时的铁壁拦截
  const tagCheck = validateAndFormatTags(editForm.tags)
  if (!tagCheck.valid) return ElMessage.warning(tagCheck.msg)
  editForm.tags = tagCheck.formatted // 覆盖为极其标准的英文逗号格式！

  isEditing.value = true
  const formData = new FormData()
  formData.append('id', editForm.id); formData.append('title', editForm.title);
  formData.append('artist', editForm.artist); formData.append('tags', editForm.tags);
  if (editCoverFile.value) formData.append('newCover', editCoverFile.value)
  if (editAudioFile.value) formData.append('newAudio', editAudioFile.value)
  if (editLyricFile.value) formData.append('newLyric', editLyricFile.value)

  try {
    await updateMusicByAdminAPI(formData)
    ElMessage.success("修改成功，老文件已被云端抹除！")
    editDialogVisible.value = false
    fetchMusicList()
  } catch (error) { ElMessage.error("更新失败") } finally { isEditing.value = false }
}

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_profile')
  router.push('/login')
}

const refreshCurrentTab = () => {
  if (currentTab.value === 'dashboard') return fetchDashboardData()
  if (currentTab.value === 'manage') return fetchMusicList()
  if (currentTab.value === 'users') return fetchUserList()
  ElMessage.info('发布中心无需刷新，填写内容会保留')
}

onMounted(() => {
  const cachedProfile = localStorage.getItem('admin_profile')
  if (cachedProfile) {
    try {
      adminProfile.value = JSON.parse(cachedProfile)
    } catch (error) {
      localStorage.removeItem('admin_profile')
    }
  }
  loadAdminProfile()
  fetchDashboardData()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  pieChartInstance?.dispose()
  barChartInstance?.dispose()
  trendChartInstance?.dispose()
  artistChartInstance?.dispose()
  resourceChartInstance?.dispose()
})

// ================= 🚀 核心：极其严苛的标签词库白名单 =================
const VALID_TAGS = ["流行","摇滚","民谣","电子","纯音乐","伤感","治愈","励志","轻松","助眠","运动","驾车","雨天","深夜","咖啡馆","工作学习","华语","欧美","日韩","怀旧","爱情","浪漫","节奏控","古风","经典"]

// 防弹级校验引擎：查空、查错词、自动修复中文逗号
const validateAndFormatTags = (tagStr) => {
  if (!tagStr || !tagStr.trim()) return { valid: false, msg: "场景标签不能为空！" }
  
  // 极其包容：无论是中文逗号还是英文逗号，全给它切开
  const tags = tagStr.split(/[,，]/).map(t => t.trim()).filter(t => t)
  if (tags.length === 0) return { valid: false, msg: "场景标签不能为空！" }

  // 极其严苛：逐个比对白名单
  for (let t of tags) {
    if (!VALID_TAGS.includes(t)) {
      return { valid: false, msg: `非法标签：[${t}]！只能从下方规定的词库中选择。` }
    }
  }
  
  // 极其规整：强行拼装成标准的英文逗号返回
  return { valid: true, formatted: tags.join(',') }
}

</script>

<style scoped>
/* 侧边栏和布局样式 */
.admin-layout { display: flex; height: 100vh; background-color: #f3f4f6; }
.sidebar { width: 220px; background-color: #1f2937; color: #fff; display: flex; flex-direction: column; }
.logo { padding: 20px; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #374151; }
.logo span span { color: #3b82f6; }
.nav-menu { flex: 1; padding: 20px 0; }
.nav-item { padding: 15px 25px; cursor: pointer; display: flex; align-items: center; gap: 12px; color: #9ca3af; transition: 0.3s; }
.nav-item:hover, .nav-item.active { background-color: #374151; color: #fff; border-right: 4px solid #3b82f6; }
.logout-btn { padding: 20px; color: #f87171; cursor: pointer; display: flex; align-items: center; gap: 10px; border-top: 1px solid #374151; }

.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-header { height: 60px; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; }
.top-header h2 { font-size: 18px; margin: 0; color: #111827; }
.admin-info { display: flex; align-items: center; gap: 10px; color: #6b7280; font-size: 14px; }
.content-wrapper { flex: 1; padding: 30px; overflow-y: auto; }

/* 卡片和图表样式 */
.stat-cards { margin-bottom: 25px; }
.stat-card { border-radius: 12px; border: none; color: #fff; }
.data-card-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.data-card-2 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.data-card-3 { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
.stat-title { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
.stat-value { font-size: 32px; font-weight: bold; }
.chart-card { border-radius: 12px; }
.chart-box { height: 350px; width: 100%; }
.tag-chart-box { height: 430px; }
.small-chart { height: 280px; }
.tag-collapse {
  margin: -8px 18px 18px;
  border: 0;
}
.tag-collapse :deep(.el-collapse-item__header) {
  height: 38px;
  border: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}
.tag-collapse :deep(.el-collapse-item__wrap) {
  border: 0;
}
.tag-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.tag-group {
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}
.tag-group-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 900;
  color: #0f172a;
}
.tag-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

/* 曲库管理表格 */
.table-card { border-radius: 12px; }
.manage-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}
.toolbar-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}
.toolbar-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}
.manage-search {
  width: 320px;
}
.filter-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: -4px 0 18px;
  padding: 14px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #eef2f7;
}
.filter-select {
  width: 180px;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-cell-name {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}
.user-cell-sub {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
}
:deep(.el-table th) { background-color: #f9fafb !important; color: #374151; font-weight: 600; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) { background-color: #fdfdfd; }

.publish-card { border-radius: 12px; max-width: 900px; margin: 0 auto; }
.submit-btn { width: 100%; border-radius: 8px; font-size: 16px; font-weight: bold; }
.text-truncate { display: inline-block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;}

/* 🚀 核心 CSS：极其精致的压缩拖拽上传框！ */
.upload-col-title { font-size: 13px; color: #6b7280; font-weight: bold; margin-bottom: 8px; text-align: center;}
.compact-upload :deep(.el-upload-dragger) {
  padding: 10px;
  height: 120px; /* 高度极其压缩！ */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  background-color: #fafafa;
}
.compact-upload :deep(.el-upload-dragger:hover) { background-color: #f0fdf4; border-color: #10b981; }
.compact-upload .el-icon--upload { margin-bottom: 5px; font-size: 30px; color: #9ca3af; }
.compact-upload .el-upload__text { font-size: 12px; color: #6b7280; }
.file-name { margin-top: 8px; font-size: 12px; color: #10b981; text-align: center; }

.quality-panel {
  margin-top: 18px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%);
  border: 1px solid #dbeafe;
}
.edit-quality {
  margin-top: 20px;
}
.quality-title {
  font-size: 13px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 10px;
}
.quality-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.quality-item {
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  font-size: 12px;
  font-weight: 700;
}
.quality-item.ok {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.compact-parsed-cover {
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e5e7eb;
}
.compact-parsed-cover .el-image { width: 100%; height: 100%; display: block; }
.cover-tip { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; text-align: center; padding: 2px 0; backdrop-filter: blur(2px);}

.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
