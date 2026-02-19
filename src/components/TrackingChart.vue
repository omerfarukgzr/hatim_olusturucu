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
            <div class="p-name-row">
              <span class="p-name">{{ p.fullName }}</span>
              <div v-if="isBehindSchedule(p)" class="behind-warning" title="Okuma programının gerisinde!">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="warning-icon">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>
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

const currentDayIndex = computed(() => {
  if (!props.startDate) return -1;
  const start = new Date(props.startDate);
  const now = new Date();
  
  // Set times to midnight to calculate day difference correctly
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = todayDate - startDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

function isDayChecked(participant, dayIdx) {
  return participant.checkedDays && participant.checkedDays.includes(dayIdx);
}

function isBehindSchedule(participant) {
  if (currentDayIndex.value <= 0) return false;
  
  // Participant is behind if any day before today is not checked
  // Only check up to the total days available
  const daysToCheck = Math.min(currentDayIndex.value, totalDays.value);
  for (let i = 0; i < daysToCheck; i++) {
    if (!isDayChecked(participant, i)) return true;
  }
  return false;
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

.p-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.p-name {
  display: block;
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
}

.behind-warning {
  color: var(--red);
  display: flex;
  align-items: center;
  animation: pulse-red 2s infinite;
}

.warning-icon {
  width: 18px;
  height: 18px;
}

@keyframes pulse-red {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
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
