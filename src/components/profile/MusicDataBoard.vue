<template>
  <div class="music-data-board" style="background: #fff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); padding: 20px;">
    <div class="geek-dashboard">
      <div class="dashboard-card">
        <h3 class="card-title">🧬 音乐 DNA 基因图谱</h3>
        <div ref="radarChartRef" class="radar-chart-container"></div>
      </div>

      <div class="dashboard-card">
        <h3 class="card-title">🔥 沉浸频率 (近 4 周)</h3>
        <div class="heatmap-grid">
          <el-tooltip v-for="(day, index) in heatmapData" :key="index" :content="`${day.date}: 听了 ${day.count} 首`" placement="top">
            <div class="heatmap-cell" :data-level="day.level"></div>
          </el-tooltip>
        </div>
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="heatmap-cell" data-level="0"></div><div class="heatmap-cell" data-level="1"></div>
          <div class="heatmap-cell" data-level="2"></div><div class="heatmap-cell" data-level="3"></div>
          <div class="heatmap-cell" data-level="4"></div>
          <span>More</span>
        </div>
      </div>
    </div>

    <div class="record-wall-section">
      <h3 class="wall-title">🎵 灵魂共鸣 · Top 5 挚爱黑胶</h3>
      <div class="record-wall">
        <div class="record-item" v-for="(song, index) in topRecords" :key="index">
          <div class="record-sleeve"><img :src="song.coverUrl || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" /></div>
          <div class="record-disc"><div class="disc-center"></div></div>
          
          <div class="record-info">
            <div class="record-title">{{ song.title || '未知频段' }}</div>
            <div class="record-artist">{{ song.artist || '神秘音乐人' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { useMusicStore } from '../../store/music'
import { getHeatmapAPI, getRadarAPI } from '../../api/modules/analysis'

const musicStore = useMusicStore()

// 💥 新增：接收外部传入的用户 ID (如果没传，则默认为当前登录用户)
const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  }
})

// 💥 核心修复：被我弄丢的这两个"阵眼"变量，必须补回来！
const radarChartRef = ref(null)
let radarInstance = null

// 🚀 真实引擎 A：拉取真数据并「智能分词聚合」渲染雷达图
const renderRadarChart = async () => {
  if (!radarChartRef.value) return
  
  // 💥 优先使用传入的 userId，如果没有传入，则使用当前登录用户的 id
  const targetId = props.userId || musicStore.currentUser?.id
  if (!targetId) return
  
  let radarData = [10, 10, 10, 10, 10, 10]; // 默认兜底
  let indicator = [
    { name: '流行 Pop' }, { name: '摇滚 Rock' }, { name: '电子 EDM' },
    { name: '民谣 Folk' }, { name: '轻音乐' }, { name: '说唱 Rap' }
  ];

  try {
    const res = await getRadarAPI(targetId)
    if (res && res.length > 0) {
      // 💥 核心黑魔法：接管后端脏数据，进行前端分词与聚合统计！
      const tagMap = {}
      res.forEach(item => {
        if (item.name) {
          // 强行按 中英文逗号、斜杠、顿号 进行切割拆分！
          const tags = item.name.split(/[,，/|、]+/).map(t => t.trim()).filter(t => t !== '')
          tags.forEach(t => {
            tagMap[t] = (tagMap[t] || 0) + item.value // 词频累加
          })
        }
      })

      // 将 Map 转换为数组，按听歌频次从高到低排序，死死截取前 6 个！
      const sortedTags = Object.entries(tagMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      // 🛡️ 兜底装甲：如果用户听的歌标签种类不足 6 种，拿默认标签强行补齐 6 个角！
      const defaultNames = ['流行', '摇滚', '电子', '民谣', '纯音乐', '说唱']
      while (sortedTags.length < 6) {
        const nextDefault = defaultNames.find(d => !sortedTags.some(s => s.name === d)) || ('未知频段' + sortedTags.length)
        sortedTags.push({ name: nextDefault, value: 0 })
      }

      radarData = sortedTags.map(item => item.value)
      // 💥 极致解耦：把 max 计算交给 ECharts 引擎动态处理，前端只负责提供数据！
      indicator = sortedTags.map(item => ({ name: item.name }))
    }
  } catch(e) {}

  if (radarInstance) radarInstance.dispose()
  radarInstance = echarts.init(radarChartRef.value)
  const option = {
    radar: {
      indicator: indicator,
      radius: '60%', // 强行收缩图形半径，绝不让文字溢出
      center: ['50%', '55%'], // 中心点下沉
      axisName: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: 'bold',
        formatter: function (value) {
          // 极致排版：如果单个独立标签依然过长，强行截断显示省略号
          if (value.length > 8) return value.substring(0, 8) + '...'
          return value;
        }
      },
      splitArea: { areaStyle: { color: ['rgba(59,130,246, 0.02)', 'rgba(59,130,246, 0.08)'].reverse() } },
      axisLine: { lineStyle: { color: 'rgba(59,130,246, 0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(59,130,246, 0.2)' } }
    },
    series: [{
      name: '音乐 DNA', type: 'radar',
      data: [{
        value: radarData, name: '真实听歌偏好',
        areaStyle: { color: 'rgba(59,130,246, 0.4)' },
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        symbolSize: 6
      }]
    }]
  }
  radarInstance.setOption(option)
}

// 💥 核心修复 2：把丢失的热力图响应式变量补回来！！！
const heatmapData = ref([])

// 🚀 真实引擎 B：拉取真数据映射到 28 天网格中
const initHeatmap = async () => {
  // 💥 优先使用传入的 userId，如果没有传入，则使用当前登录用户的 id
  const targetId = props.userId || musicStore.currentUser?.id
  if (!targetId) return
  
  const data = []; const today = new Date()
  
  try {
    const res = await getHeatmapAPI(targetId)
    // 把后端传回来的 [{date: '2023/10/01', count: 5}] 转成 Map 方便极速查找
    const realDataMap = {}
    if (res && res.length > 0) res.forEach(item => { realDataMap[item.date] = item.count })

    // 💥 核心修改：循环 28 次 (从 27 到 0)
    for(let i = 27; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const yyyy = d.getFullYear(); 
      const mm = String(d.getMonth() + 1).padStart(2, '0'); 
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}/${mm}/${dd}` // 严格匹配 SQL 的 DATE_FORMAT

      const count = realDataMap[dateStr] || 0 // 查不到就是今天没听歌，为 0
      
      let level = 0
      if(count > 0 && count <= 2) level = 1
      else if(count > 2 && count <= 5) level = 2
      else if(count > 5 && count <= 10) level = 3
      else if(count > 10) level = 4
      
      data.push({ date: dateStr, count, level })
    }
  } catch (e) {
    // 降级处理为空白格子...
  }
  heatmapData.value = data
}

// 🚀 核心大招 C：黑胶唱片墙数据引擎
const topRecords = computed(() => {
  // 💥 如果是查看他人，则从 playHistory 中筛选出该用户的记录
  if (props.userId) {
    // 查看他人时，暂时显示默认封面（需要后端支持返回用户的听歌记录）
    return Array(5).fill({ coverUrl: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', title: '暂无数据', artist: '需要后端支持' })
  }
  // 查看自己时，使用当前逻辑
  let list = (musicStore.playHistory && musicStore.playHistory.length > 0) ? musicStore.playHistory : musicStore.likedMusicList;
  if (!list || list.length === 0) return Array(5).fill({ coverUrl: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' })
  return list.slice(0, 5) 
})

// 监听 userId 变化，重新渲染图表
watch(() => props.userId, () => {
  initHeatmap()
  renderRadarChart()
}, { immediate: true })

// 监听窗口大小变化，让 ECharts 完美自适应
const handleResize = () => { if (radarInstance) radarInstance.resize() }

// 💥 因为使用了 v-if，组件挂载时自动点火，彻底解耦！
onMounted(async () => {
  // userId 变化时会自动触发 watch，这里不需要重复调用
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (radarInstance) radarInstance.dispose() // 资深前端素养：防止内存泄漏！
})
</script>

<style scoped>
/* 🚀 把刚才加在 HomeView 里的极客大屏布局、雷达图、热力图、黑胶墙 CSS 全部移到这里！ */
.geek-dashboard { display: flex; gap: 20px; margin-top: 30px; }
.dashboard-card { flex: 1; background: #f8fafc; border-radius: 24px; padding: 25px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; }
.card-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;}

.radar-chart-container { width: 100%; height: 220px; }

/* 💥 核心修改：变成 4列 x 7行 的完美正方形矩阵并居中 */
.heatmap-grid { 
  display: grid; 
  grid-template-columns: repeat(4, 22px); 
  grid-template-rows: repeat(7, 22px); 
  gap: 6px; 
  justify-content: center; 
  align-content: center;
  height: 180px;
}

.heatmap-cell { border-radius: 4px; background: #ebedf0; transition: 0.2s; cursor: pointer; }
.heatmap-cell:hover { transform: scale(1.3); box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; position: relative;}
.heatmap-cell[data-level="1"] { background: #9be9a8; }
.heatmap-cell[data-level="2"] { background: #40c463; }
.heatmap-cell[data-level="3"] { background: #30a14e; }
.heatmap-cell[data-level="4"] { background: #216e39; }
.heatmap-legend { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 10px; font-size: 12px; color: #64748b;}
.heatmap-legend .heatmap-cell { width: 12px; height: 12px; cursor: default; }
.heatmap-legend .heatmap-cell:hover { transform: none; box-shadow: none; }

.record-wall-section { margin-top: 40px; background: #1e293b; padding: 30px 20px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.2) inset;}
.wall-title { font-size: 18px; font-weight: 800; color: #f8fafc; margin: 0 0 30px 0; text-align: center; letter-spacing: 2px;}
.record-wall { display: flex; justify-content: center; align-items: center; gap: -20px; perspective: 1200px; padding: 20px 0; overflow: hidden; height: 260px;} /* 💥 高度加到 260px */
.record-item { position: relative; width: 140px; height: 140px; margin: 0 -25px; transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-style: preserve-3d; transform: rotateY(-25deg) scale(0.9); cursor: pointer; }
.record-item:hover { transform: rotateY(0deg) scale(1.15) translateY(-15px); z-index: 10; margin: 0 45px; }
.record-sleeve { position: absolute; inset: 0; border-radius: 4px; box-shadow: -10px 15px 30px rgba(0,0,0,0.6); z-index: 2; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: #333;}
.record-sleeve img { width: 100%; height: 100%; object-fit: cover; }
.record-disc { position: absolute; top: 2px; right: -30px; width: 136px; height: 136px; background: repeating-radial-gradient(#111, #111 2px, #222 3px, #222 4px); border-radius: 50%; z-index: 1; transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 5px 5px 20px rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; }
.record-item:hover .record-disc { right: -60px; transform: rotate(180deg); }
.disc-center { width: 44px; height: 44px; background: #ff5e3a; border-radius: 50%; border: 2px solid #111; display: flex; justify-content: center; align-items: center;}
.disc-center::after { content: ''; width: 8px; height: 8px; background: #f8fafc; border-radius: 50%; }

/* 🚀 黑胶歌曲信息悬浮态 */
.record-info {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  width: 160%;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none; /* 防止遮挡鼠标 hover */
}

/* 鼠标放上去时，文字跟着唱片一起丝滑浮现并下坠一点 */
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
</style>
