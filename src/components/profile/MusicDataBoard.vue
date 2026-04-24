<template>
  <div class="music-data-board">
    <div class="summary-grid">
      <div class="summary-card" v-for="item in summaryCards" :key="item.label">
        <div class="summary-value">{{ item.value }}</div>
        <div class="summary-label">{{ item.label }}</div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="dashboard-card chart-card wide-card">
        <div class="card-header">
          <h3>最近 14 天听歌趋势</h3>
          <span>按播放次数统计</span>
        </div>
        <div ref="trendChartRef" class="chart-box"></div>
      </div>

      <div class="dashboard-card chart-card">
        <div class="card-header">
          <h3>音乐风格偏好</h3>
          <span>按标签聚合</span>
        </div>
        <div ref="radarChartRef" class="chart-box"></div>
      </div>

      <div class="dashboard-card chart-card">
        <div class="card-header">
          <h3>24 小时听歌分布</h3>
          <span>找出你的高频时段</span>
        </div>
        <div ref="hourlyChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="insight-grid">
      <div class="dashboard-card heatmap-card">
        <div class="card-header">
          <h3>最近 28 天活跃热力图</h3>
          <span>每天播放越多颜色越深</span>
        </div>
        <div class="heatmap-grid">
          <el-tooltip
            v-for="(day, index) in heatmapData"
            :key="index"
            :content="`${day.date}：播放 ${day.count} 次`"
            placement="top"
          >
            <div class="heatmap-cell" :data-level="day.level"></div>
          </el-tooltip>
        </div>
        <div class="heatmap-legend">
          <span>少</span>
          <div class="heatmap-cell" data-level="0"></div>
          <div class="heatmap-cell" data-level="1"></div>
          <div class="heatmap-cell" data-level="2"></div>
          <div class="heatmap-cell" data-level="3"></div>
          <div class="heatmap-cell" data-level="4"></div>
          <span>多</span>
        </div>
      </div>

      <div class="dashboard-card ranking-card">
        <div class="card-header">
          <h3>听歌排行榜</h3>
          <span>主流播放器常见看板</span>
        </div>

        <div class="ranking-section">
          <div class="ranking-title">Top 歌曲</div>
          <div v-if="dashboard.topSongs.length > 0" class="ranking-list song-list">
            <div class="rank-item song-item" v-for="(item, index) in dashboard.topSongs.slice(0, 5)" :key="`song-${index}`">
              <div class="rank-index">{{ index + 1 }}</div>
              <img class="song-cover" :src="item.coverUrl || defaultCover" alt="cover" />
              <div class="rank-meta">
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-sub">{{ item.subLabel || '未知歌手' }}</div>
              </div>
              <div class="rank-value">{{ item.value }}</div>
            </div>
          </div>
          <el-empty v-else description="还没有足够的播放数据" :image-size="90" />
        </div>

        <div class="ranking-double">
          <div class="ranking-section compact">
            <div class="ranking-title">Top 歌手</div>
            <div v-if="dashboard.topArtists.length > 0" class="ranking-list">
              <div class="rank-item compact-item" v-for="(item, index) in dashboard.topArtists.slice(0, 5)" :key="`artist-${index}`">
                <span class="rank-index">{{ index + 1 }}</span>
                <span class="rank-name">{{ item.name }}</span>
                <span class="rank-value">{{ item.value }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无歌手排行" :image-size="70" />
          </div>

          <div class="ranking-section compact">
            <div class="ranking-title">Top 风格</div>
            <div v-if="dashboard.topTags.length > 0" class="ranking-list">
              <div class="rank-item compact-item" v-for="(item, index) in dashboard.topTags.slice(0, 5)" :key="`tag-${index}`">
                <span class="rank-index">{{ index + 1 }}</span>
                <span class="rank-name">{{ item.name }}</span>
                <span class="rank-value">{{ item.value }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无风格偏好" :image-size="70" />
          </div>
        </div>
      </div>
    </div>

    <div class="record-wall-section">
      <div class="card-header record-header">
        <h3>黑胶收藏墙</h3>
        <span>真实 Top 歌曲展示</span>
      </div>
      <div class="record-wall" v-if="topRecords.length > 0">
        <div class="record-item" v-for="(song, index) in topRecords" :key="`record-${index}`">
          <div class="record-sleeve"><img :src="song.coverUrl || defaultCover" alt="cover" /></div>
          <div class="record-disc"><div class="disc-center"></div></div>
          <div class="record-info">
            <div class="record-title">{{ song.name }}</div>
            <div class="record-artist">{{ song.subLabel || '未知歌手' }}</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="听几首歌后，这里会点亮你的黑胶收藏墙" :image-size="100" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useMusicStore } from '../../store/music'
import { getAnalysisDashboardAPI } from '../../api/modules/analysis'

const defaultCover = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const musicStore = useMusicStore()

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  }
})

const dashboard = ref({
  summary: {
    totalPlays: 0,
    recentWeekPlays: 0,
    likedSongs: 0,
    customPlaylists: 0,
    activeDays: 0
  },
  topSongs: [],
  topArtists: [],
  topTags: [],
  weeklyTrend: [],
  hourlyDistribution: [],
  heatmap: [],
  radar: []
})

const radarChartRef = ref(null)
const trendChartRef = ref(null)
const hourlyChartRef = ref(null)

let radarInstance = null
let trendInstance = null
let hourlyInstance = null

const targetUserId = computed(() => props.userId || musicStore.currentUser?.id)

const summaryCards = computed(() => [
  { label: '累计播放', value: dashboard.value.summary.totalPlays || 0 },
  { label: '近 7 天播放', value: dashboard.value.summary.recentWeekPlays || 0 },
  { label: '收藏歌曲', value: dashboard.value.summary.likedSongs || 0 },
  { label: '自建歌单', value: dashboard.value.summary.customPlaylists || 0 },
  { label: '近 28 天活跃', value: dashboard.value.summary.activeDays || 0 }
])

const topRecords = computed(() => dashboard.value.topSongs.slice(0, 5))

const heatmapData = computed(() => {
  const sourceMap = {}
  for (const item of dashboard.value.heatmap || []) {
    sourceMap[item.date] = item.count || 0
  }

  const today = new Date()
  const result = []
  for (let i = 27; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}/${mm}/${dd}`
    const count = sourceMap[dateStr] || 0

    let level = 0
    if (count > 0 && count <= 2) level = 1
    else if (count <= 5) level = 2
    else if (count <= 10) level = 3
    else level = 4

    result.push({ date: dateStr, count, level })
  }
  return result
})

const loadDashboard = async () => {
  if (!targetUserId.value) {
    return
  }

  try {
    dashboard.value = await getAnalysisDashboardAPI(targetUserId.value)
    await nextTick()
    renderAllCharts()
  } catch (error) {
    dashboard.value = {
      summary: {
        totalPlays: 0,
        recentWeekPlays: 0,
        likedSongs: 0,
        customPlaylists: 0,
        activeDays: 0
      },
      topSongs: [],
      topArtists: [],
      topTags: [],
      weeklyTrend: [],
      hourlyDistribution: [],
      heatmap: [],
      radar: []
    }
    await nextTick()
    renderAllCharts()
  }
}

const renderAllCharts = () => {
  renderTrendChart()
  renderRadarChart()
  renderHourlyChart()
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return
  if (trendInstance) trendInstance.dispose()

  trendInstance = echarts.init(trendChartRef.value)
  trendInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 30, right: 18, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dashboard.value.weeklyTrend.map(item => item.label.slice(5)),
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      type: 'line',
      data: dashboard.value.weeklyTrend.map(item => item.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#3b82f6' },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59,130,246,0.25)' },
          { offset: 1, color: 'rgba(59,130,246,0.02)' }
        ])
      }
    }]
  })
}

const renderRadarChart = () => {
  if (!radarChartRef.value) return
  if (radarInstance) radarInstance.dispose()

  const radarData = dashboard.value.radar.length > 0 ? dashboard.value.radar : [
    { name: '流行', value: 0 },
    { name: '摇滚', value: 0 },
    { name: '电子', value: 0 },
    { name: '民谣', value: 0 },
    { name: '纯音乐', value: 0 },
    { name: '经典', value: 0 }
  ]

  radarInstance = echarts.init(radarChartRef.value)
  radarInstance.setOption({
    radar: {
      indicator: radarData.map(item => ({ name: item.name, max: Math.max(...radarData.map(entry => entry.value), 1) })),
      radius: '62%',
      splitNumber: 4,
      axisName: {
        color: '#475569',
        fontSize: 12,
        fontWeight: 'bold'
      },
      splitArea: {
        areaStyle: { color: ['rgba(59,130,246,0.02)', 'rgba(59,130,246,0.08)'].reverse() }
      },
      axisLine: { lineStyle: { color: 'rgba(59,130,246,0.18)' } },
      splitLine: { lineStyle: { color: 'rgba(59,130,246,0.18)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.map(item => item.value),
        areaStyle: { color: 'rgba(59,130,246,0.25)' },
        lineStyle: { color: '#3b82f6', width: 2.5 },
        itemStyle: { color: '#3b82f6' }
      }]
    }]
  })
}

const renderHourlyChart = () => {
  if (!hourlyChartRef.value) return
  if (hourlyInstance) hourlyInstance.dispose()

  hourlyInstance = echarts.init(hourlyChartRef.value)
  hourlyInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 22, right: 12, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dashboard.value.hourlyDistribution.map(item => `${item.label}:00`),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', interval: 3 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      type: 'bar',
      barWidth: '56%',
      data: dashboard.value.hourlyDistribution.map(item => item.value),
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#60a5fa' },
          { offset: 1, color: '#2563eb' }
        ])
      }
    }]
  })
}

const handleResize = () => {
  trendInstance?.resize()
  radarInstance?.resize()
  hourlyInstance?.resize()
}

watch(targetUserId, () => {
  loadDashboard()
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendInstance?.dispose()
  radarInstance?.dispose()
  hourlyInstance?.dispose()
})
</script>

<style scoped>
.music-data-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 24px 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.summary-value {
  font-size: 34px;
  font-weight: 900;
  color: #2563eb;
  line-height: 1;
}

.summary-label {
  margin-top: 10px;
  font-size: 14px;
  color: #64748b;
  font-weight: 700;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 20px;
}

.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 20px;
}

.dashboard-card {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.card-header span {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.chart-box {
  width: 100%;
  height: 260px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 22px);
  grid-template-rows: repeat(4, 22px);
  gap: 8px;
  justify-content: center;
  align-content: center;
  min-height: 140px;
  margin: 12px 0 14px;
}

.heatmap-cell {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #ebedf0;
  transition: 0.2s;
  cursor: pointer;
}

.heatmap-cell:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.heatmap-cell[data-level="1"] { background: #bfdbfe; }
.heatmap-cell[data-level="2"] { background: #93c5fd; }
.heatmap-cell[data-level="3"] { background: #60a5fa; }
.heatmap-cell[data-level="4"] { background: #2563eb; }

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.heatmap-legend .heatmap-cell {
  width: 14px;
  height: 14px;
  cursor: default;
}

.heatmap-legend .heatmap-cell:hover {
  transform: none;
  box-shadow: none;
}

.ranking-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ranking-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-title {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;
}

.rank-index {
  width: 24px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 900;
  color: #2563eb;
  text-align: center;
}

.song-cover {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.rank-meta {
  flex: 1;
  min-width: 0;
}

.rank-name {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-value {
  font-size: 13px;
  font-weight: 800;
  color: #475569;
}

.ranking-double {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.compact .rank-item {
  justify-content: space-between;
}

.compact .rank-name {
  flex: 1;
}

.record-wall-section {
  background: #0f172a;
  border-radius: 28px;
  padding: 28px 24px 34px;
  box-shadow: inset 0 20px 60px rgba(0, 0, 0, 0.28);
}

.record-header h3,
.record-header span {
  color: #f8fafc;
}

.record-header span {
  color: #94a3b8;
}

.record-wall {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0;
  perspective: 1200px;
  padding: 16px 0 8px;
  overflow: hidden;
  min-height: 260px;
}

.record-item {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 -25px;
  transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
  transform: rotateY(-25deg) scale(0.9);
  cursor: pointer;
}

.record-item:hover {
  transform: rotateY(0deg) scale(1.15) translateY(-15px);
  z-index: 10;
  margin: 0 45px;
}

.record-sleeve {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  box-shadow: -10px 15px 30px rgba(0,0,0,0.6);
  z-index: 2;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  background: #333;
}

.record-sleeve img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-disc {
  position: absolute;
  top: 2px;
  right: -30px;
  width: 136px;
  height: 136px;
  background: repeating-radial-gradient(#111, #111 2px, #222 3px, #222 4px);
  border-radius: 50%;
  z-index: 1;
  transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 5px 5px 20px rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.record-item:hover .record-disc {
  right: -60px;
  transform: rotate(180deg);
}

.disc-center {
  width: 44px;
  height: 44px;
  background: #ff5e3a;
  border-radius: 50%;
  border: 2px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
}

.disc-center::after {
  content: '';
  width: 8px;
  height: 8px;
  background: #f8fafc;
  border-radius: 50%;
}

.record-info {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  width: 160%;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
}

.record-item:hover .record-info {
  opacity: 1;
  bottom: -55px;
}

.record-title {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 800;
  text-shadow: 0 4px 10px rgba(0,0,0,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.record-artist {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .chart-grid,
  .insight-grid,
  .ranking-double {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-card,
  .record-wall-section {
    padding: 18px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
