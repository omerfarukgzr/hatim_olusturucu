<template>
  <div class="tracking-container">
    <div v-if="participants.length === 0" class="empty-state">
      <p>Henüz katılımcı eklenmedi.</p>
    </div>

    <!-- Özet Bilgi Kartları -->
    <div v-if="participants.length > 0" class="summary-grid">
      <!-- Gün Durumu -->
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-body">
          <div class="stat-value">{{ elapsedDays }}<span class="stat-unit"> / {{ totalDays || '?' }}</span></div>
          <div class="stat-label">Geçen / Toplam Gün</div>
        </div>
      </div>

      <!-- Genel Tamamlanma -->
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-body">
          <div class="stat-value">{{ overallProgress }}<span class="stat-unit">%</span></div>
          <div class="stat-label">Genel Tamamlanma</div>
        </div>
      </div>

      <!-- Toplam Okunan Sayfa -->
      <div class="stat-card">
        <div class="stat-icon">📖</div>
        <div class="stat-body">
          <div class="stat-value">{{ totalPagesRead.toLocaleString('tr-TR') }}</div>
          <div class="stat-label">Toplam Okunan Sayfa</div>
        </div>
      </div>

      <!-- Geride Kalan Kişi -->
      <div class="stat-card" :class="{ 'stat-card--warn': behindCount > 0 }">
        <div class="stat-icon">{{ behindCount > 0 ? '⚠️' : '✅' }}</div>
        <div class="stat-body">
          <div class="stat-value">{{ behindCount }}</div>
          <div class="stat-label">{{ behindCount > 0 ? 'Kişi Geride' : 'Herkes Zamanında' }}</div>
        </div>
      </div>
    </div>
    <div v-if="participants.length > 0" class="tracking-list">
      <!-- Arama -->
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          class="search-input"
          type="text"
          placeholder="İsimle ara..."
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" title="Temizle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="compact-list-header">
        <button class="sort-btn" :class="{ active: sortKey === 'name' }" @click="toggleSort('name')">
          Katılımcı <span class="sort-arrow">{{ sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
        </button>
        <button class="sort-btn" :class="{ active: sortKey === 'pages' }" @click="toggleSort('pages')">
          Sayfa/Gün <span class="sort-arrow">{{ sortKey === 'pages' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
        </button>
        <button class="sort-btn" :class="{ active: sortKey === 'days' }" @click="toggleSort('days')">
          Gün Takibi <span class="sort-arrow">{{ sortKey === 'days' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
        </button>
        <button class="sort-btn" :class="{ active: sortKey === 'progress' }" @click="toggleSort('progress')">
          Oran <span class="sort-arrow">{{ sortKey === 'progress' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
        </button>
      </div>
      <!-- Sonuç yok -->
      <div v-if="filteredParticipants.length === 0" class="no-result">
        "​{{ searchQuery }}​" ile eşleşen katılımcı bulunamadı.
      </div>
      <div
        v-for="(p) in filteredParticipants"
        :key="p.id"
        class="compact-row"
        :class="{ 'compact-row--behind': isBehindSchedule(p) }"
        @click="goToParticipantPage(p.fullName)"
      >
        <!-- İsim + uyarı -->
        <div class="cr-name">
          <span class="cr-name-text">{{ p.fullName }}</span>
          <span v-if="isBehindSchedule(p)" class="cr-warn" title="Okuma programının gerisinde!">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="warn-svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
        </div>

        <!-- Sayfa/Gün -->
        <div class="cr-pages">{{ p.pages }} sf/gün</div>

        <!-- Gün tamamlanma: X / Y gün -->
        <div class="cr-days">{{ getCheckedCount(p) }} <span class="cr-days-total">/ {{ totalDays }} gün</span></div>

        <!-- Progress + yüzde -->
        <div class="cr-progress">
          <div class="cr-bar"><div class="cr-fill" :style="{ width: getProgress(p) + '%' }"></div></div>
          <span class="cr-pct">{{ getProgress(p) }}%</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
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

const sortKey = ref('pages');
const sortDir = ref('desc');
const searchQuery = ref('');

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'desc';
  }
}

const sortedParticipants = computed(() => {
  return [...props.participants].sort((a, b) => {
    let va, vb;
    if (sortKey.value === 'name') {
      va = (a.fullName || '').toLocaleLowerCase('tr');
      vb = (b.fullName || '').toLocaleLowerCase('tr');
      return sortDir.value === 'asc' ? va.localeCompare(vb, 'tr') : vb.localeCompare(va, 'tr');
    }
    if (sortKey.value === 'pages') {
      va = parseInt(a.pages) || 0;
      vb = parseInt(b.pages) || 0;
    } else if (sortKey.value === 'days') {
      va = getCheckedCount(a);
      vb = getCheckedCount(b);
    } else if (sortKey.value === 'progress') {
      va = getProgress(a);
      vb = getProgress(b);
    }
    return sortDir.value === 'asc' ? va - vb : vb - va;
  });
});

// Türkçe toleranslı normalize: ö→o, ü→u, ş→s, ç→c, ğ→g, ı/İ→i
function normalize(str) {
  return (str || '')
    .toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

const filteredParticipants = computed(() => {
  const q = normalize(searchQuery.value).trim();
  if (!q) return sortedParticipants.value;
  return sortedParticipants.value.filter(p =>
    normalize(p.fullName).includes(q)
  );
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

// Geçen gün sayısı (1-based, minimum 0)
const elapsedDays = computed(() => {
  const idx = currentDayIndex.value;
  if (idx < 0) return 0;
  return Math.min(idx + 1, totalDays.value || idx + 1);
});

// Genel tamamlanma — üstteki progress bar ile aynı ağırlıklı formül:
// toplam okunan sayfa / (totalDays × toplam atanan sayfa/gün) × 100
const overallProgress = computed(() => {
  if (!props.participants.length || totalDays.value === 0) return 0;
  let totalRead = 0;
  let totalToRead = 0;
  props.participants.forEach(p => {
    const pages = parseInt(p.pages) || 0;
    const checked = p.checkedDays ? p.checkedDays.length : 0;
    totalRead  += checked * pages;
    totalToRead += totalDays.value * pages;
  });
  if (totalToRead === 0) return 0;
  return Math.min(Math.round((totalRead / totalToRead) * 100), 100);
});


// Toplam okunan sayfa sayısı
const totalPagesRead = computed(() => {
  return props.participants.reduce((acc, p) => {
    const checked = p.checkedDays ? p.checkedDays.length : 0;
    return acc + checked * (parseInt(p.pages) || 0);
  }, 0);
});

// Geride kalan kişi sayısı
const behindCount = computed(() => {
  return props.participants.filter(p => isBehindSchedule(p)).length;
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

/* ── ÖZET KARTLAR ── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: var(--accent-soft);
}

.stat-card--warn {
  border-color: #f59e0b44;
  background: linear-gradient(135deg, var(--surface), #fef3c720);
}

.stat-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

/* ── ARAMA ── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--surface);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text);
  outline: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.search-clear:hover {
  color: var(--text);
  background: var(--border-soft);
}

.no-result {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}


.tracking-list {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* ── BAŞLIK SATIRI ── */
.compact-list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.4fr;
  gap: 12px;
  padding: 6px 16px;
  background: var(--bg-alt);
  border-bottom: 1px solid var(--border-soft);
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 6px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
  width: 100%;
  text-align: left;
}

.sort-btn:hover {
  background: var(--border-soft);
  color: var(--text);
}

.sort-btn.active {
  color: var(--accent);
}

.sort-arrow {
  font-size: 12px;
  opacity: 0.7;
}

/* ── KOMPAKT SATIR ── */
.compact-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.4fr;
  gap: 12px;
  align-items: center;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background 0.15s ease;
}

.compact-row:last-child {
  border-bottom: none;
}

.compact-row:hover {
  background: var(--accent-soft);
}

.compact-row--behind {
  border-left: 3px solid #ef4444;
}

/* İsim + uyarı */
.cr-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cr-name-text {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-warn {
  color: #ef4444;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  animation: pulse-red 2s infinite;
}

.warn-svg {
  width: 15px;
  height: 15px;
}

@keyframes pulse-red {
  0%   { transform: scale(1);    opacity: 1; }
  50%  { transform: scale(1.15); opacity: 0.75; }
  100% { transform: scale(1);    opacity: 1; }
}

/* Sayfa/Gün */
.cr-pages {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* Gün takibi */
.cr-days {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.cr-days-total {
  font-weight: 400;
  color: var(--text-muted);
}

/* Progress + yüzde */
.cr-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cr-bar {
  flex: 1;
  height: 7px;
  background: var(--bg-alt);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
}

.cr-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover, var(--accent)));
  border-radius: 4px;
  transition: width 0.4s ease;
}

.cr-pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  min-width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
