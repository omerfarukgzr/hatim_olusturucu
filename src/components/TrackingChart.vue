<template>
  <div class="tracking-container">
    <div v-if="participants.length === 0" class="empty-state">
      <p>Henüz katılımcı eklenmedi.</p>
    </div>
    <div v-else class="tracking-list">
      <div 
        v-for="(p, idx) in sortedParticipants" 
        :key="p.id" 
        class="participant-tracking-card"
        @click="goToParticipantPage(p.fullName)"
      >
        <div class="card-top">
          <div class="p-info">
            <span class="p-name">{{ p.fullName }}</span>
            <span class="p-stats">{{ p.pages }} Sayfa / Gün</span>
          </div>
          <div class="p-progress">
            <span class="progress-text">{{ getProgress(p) }}%</span>
            <div class="progress-bar-mini">
              <div class="progress-fill" :style="{ width: getProgress(p) + '%' }"></div>
            </div>
          </div>
        </div>
        
        <div class="days-mini-grid">
          <div 
            v-for="dayIdx in totalDays" 
            :key="dayIdx" 
            class="day-box"
            :class="{ 'checked': isDayChecked(p, dayIdx - 1) }"
            :title="'Gün ' + dayIdx"
          ></div>
        </div>

        <div class="card-footer">
          <span class="read-info">
            {{ getCheckedCount(p) }} / {{ totalDays }} gün tamamlandı
          </span>
          <span class="page-info">
            Toplam: {{ getCheckedCount(p) * p.pages }} sayfa okudu
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  participants: {
    type: Array,
    required: true
  },
  startDate: String,
  endDate: String,
  hatimId: String
});

const router = useRouter();

const totalDays = computed(() => {
  if (!props.startDate || !props.endDate) return 0;
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  
  if (isNaN(start) || isNaN(end)) return 0;
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

const sortedParticipants = computed(() => {
  return [...props.participants].sort((a, b) => b.pages - a.pages);
});

function isDayChecked(participant, dayIdx) {
  return participant.checkedDays && participant.checkedDays.includes(dayIdx);
}

function getCheckedCount(participant) {
  return participant.checkedDays ? participant.checkedDays.length : 0;
}

function getProgress(participant) {
  if (totalDays.value === 0) return 0;
  return Math.round((getCheckedCount(participant) / totalDays.value) * 100);
}

function goToParticipantPage(fullName) {
  if (!props.hatimId) return;
  router.push({
    name: 'participant-detail',
    params: { id: props.hatimId },
    query: { p: fullName }
  });
}
</script>

<style scoped>
.tracking-container {
  padding: 8px 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.tracking-list {
  display: grid;
  gap: 20px;
}

.participant-tracking-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.participant-tracking-card::before {
  content: 'Takip Listesine Git ➔';
  position: absolute;
  top: 0;
  right: 0;
  background: var(--accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-bottom-left-radius: 8px;
  transform: translateY(-100%);
  transition: var(--transition);
}

.participant-tracking-card:hover::before {
  transform: translateY(0);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.p-name {
  display: block;
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  margin-bottom: 2px;
}

.p-stats {
  font-size: 13px;
  color: var(--text-muted);
}

.p-progress {
  text-align: right;
  min-width: 80px;
}

.progress-text {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 4px;
}

.progress-bar-mini {
  width: 80px;
  height: 6px;
  background: var(--bg-alt);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.days-mini-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
}

.day-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: var(--bg-alt);
  border: 1px solid var(--border-soft);
}

.day-box.checked {
  background: var(--accent);
  border-color: var(--accent);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
}

.read-info {
  font-weight: 600;
}
</style>
