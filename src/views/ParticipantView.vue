<template>
  <div class="participant-page">
    <div class="nav-bar">
      <div class="logo-container" @click="$router.push('/')">
        <div class="logo">
          <img src="../assets/logo.png" alt="Logo" />
        </div>
        <h1 class="nav-title">Hatim Takip</h1>
      </div>
    </div>

    <main class="main-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Yükleniyor...</p>
      </div>

      <div v-else-if="!hatim" class="entry-card">
        <h2 class="title">Hatim Takibi</h2>
        <p class="subtitle">Size iletilen hatim kodunu girerek okuma çizelgenize ulaşabilirsiniz.</p>
        
        <div class="input-group">
          <label>Hatim Kodu</label>
          <input 
            v-model="hatimIdInput" 
            type="text" 
            placeholder="Örn: 550e8400-e29b..."
            @keyup.enter="handleLoadHatim"
          />
        </div>
        
        <button class="btn-primary" @click="handleLoadHatim">Hatim Bul</button>
      </div>

      <div v-else-if="!selectedParticipant" class="entry-card">
        <div class="input-group" style="margin-bottom: 20px;">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 İsim ara..."
            class="search-input"
          />
        </div>

        <div class="participant-selector">
          <div 
            v-for="(p, idx) in filteredParticipants" 
            :key="p.id"
            class="participant-item"
            @click="selectParticipant(p, getOriginalIndex(p))"
          >
            <span class="p-name">{{ p.fullName }}</span>
            <span class="p-pages">{{ p.pages }} Sayfa</span>
          </div>
          <div v-if="filteredParticipants.length === 0" class="no-results">
            Aradığınız isim bulunamadı.
          </div>
        </div>

        <button class="btn-ghost" @click="hatim = null">⬅️ Başka Hatim Girişi</button>
      </div>

      <div v-else class="schedule-card">
        <div class="schedule-header">
          <div class="header-main">
            <h2 class="title">{{ selectedParticipant.fullName }}</h2>
            <p class="badge">Sizin Çizelgeniz</p>
          </div>
          <button class="btn-download" @click="handleExportPdf">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            PDF İndir
          </button>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Hatim</span>
            <span class="value">{{ hatim.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Tarih Aralığı</span>
            <span class="value">{{ dates.length }} Gün ({{ dateUtils.formatToLocale(hatim.startDate) }} - {{ dateUtils.formatToLocale(hatim.endDate) }})</span>
          </div>
          <div class="info-item">
            <span class="label">Günlük</span>
            <span class="value">{{ selectedParticipant.pages }} Sayfa</span>
          </div>
        </div>

        <div class="days-list">
          <div v-for="(date, idx) in dates" :key="idx" class="day-row">
            <div class="day-info">
              <span class="day-name">{{ dateUtils.formatDayName(date) }}</span>
              <span class="day-date">{{ dateUtils.formatToLocale(date) }}</span>
            </div>
            <div class="day-pages">
              <span class="page-range">{{ getDayRange(idx).start }} - {{ getDayRange(idx).end }}</span>
              <span class="page-label">Sayfalar</span>
            </div>
          </div>
        </div>

        <div v-if="hasLastPages" class="warning-note">
          <strong>Önemli Not:</strong> 600. sayfaya denk geldiğiniz için hatmin sonundaki 4 sayfayı da (kısa sureler) okumanız gerekmektedir.
        </div>

        <button class="btn-ghost" style="margin-top: 24px;" @click="selectedParticipant = null">⬅️ Geri Dön</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHatim } from '../composables/useHatim';
import { dateUtils, hatimUtils } from '../utils/formatUtils';
import { useToast } from '../composables/useToast';
import { exportService } from '../utils/exportUtils';

const route = useRoute();
const router = useRouter();
const { loadHatim } = useHatim();
const { show } = useToast();

const hatim = ref(null);
const hatimIdInput = ref('');
const searchQuery = ref('');
const loading = ref(false);
const selectedParticipant = ref(null);
const selectedIndex = ref(-1);

const filteredParticipants = computed(() => {
  if (!hatim.value) return [];
  if (!searchQuery.value) return hatim.value.participants;
  
  const normalize = (str) => {
    return str.toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/i̇/g, 'i'); // handle combined dot i
  };

  const query = normalize(searchQuery.value);
  return hatim.value.participants.filter(p => 
    normalize(p.fullName).includes(query)
  );
});

function getOriginalIndex(participant) {
  return hatim.value.participants.findIndex(p => p.id === participant.id);
}

onMounted(async () => {
  const idFromUrl = route.params.id;
  if (idFromUrl) {
    hatimIdInput.value = idFromUrl;
    await handleLoadHatim();
  }
});

async function handleLoadHatim() {
  if (!hatimIdInput.value) return;
  
  loading.value = true;
  try {
    const data = await loadHatim(hatimIdInput.value);
    if (data) {
      hatim.value = data;
    } else {
      show('Hatim bulunamadı. Lütfen kodu kontrol edin.', 'error');
    }
  } catch (e) {
    show('Bir hata oluştu.', 'error');
  } finally {
    loading.value = false;
  }
}

function selectParticipant(p, idx) {
  selectedParticipant.value = p;
  selectedIndex.value = idx;
  // Browser history updates so sharing specific view is easier
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const dates = computed(() => {
  if (!hatim.value) return [];
  return dateUtils.getDatesInRange(hatim.value.startDate, hatim.value.endDate);
});

function getDayRange(dayIdx) {
  return hatimUtils.getDayRange(hatim.value.participants, selectedIndex.value, dayIdx);
}

const hasLastPages = computed(() => {
  if (!hatim.value || selectedIndex.value === -1) return false;
  const lastDayIdx = dates.value.length - 1;
  const lastRange = getDayRange(lastDayIdx);
  // If they read page 600 at any point, show the warning
  for (let i = 0; i < dates.value.length; i++) {
    const range = getDayRange(i);
    if (range.start === 600 || range.end === 600) return true;
  }
  return false;
});

function handleExportPdf() {
  try {
    exportService.personalPdf(hatim.value, selectedParticipant.value, selectedIndex.value);
    show('Kişisel PDF indiriliyor...', 'success');
  } catch (e) {
    show('PDF oluşturulamadı: ' + e.message, 'error');
  }
}
</script>

<style scoped>
.participant-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.nav-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-soft);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.nav-bar .logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.nav-bar .logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-bar .nav-title {
  font-family: 'Lora', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  margin: 0;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 20px;
}

.entry-card, .schedule-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow);
}

.title {
  font-family: 'Lora', serif;
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 8px 0;
  text-align: center;
}

.subtitle {
  color: var(--text-muted);
  text-align: center;
  font-size: 15px;
  margin-bottom: 32px;
}

.input-group {
  margin-bottom: 24px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 16px;
  transition: var(--transition);
}

.input-group input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-highlight);
  outline: none;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-primary:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.participant-selector {
  display: grid;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 24px;
  padding-right: 4px;
}

.participant-selector::-webkit-scrollbar {
  width: 6px;
}
.participant-selector::-webkit-scrollbar-thumb {
  background: var(--border-soft);
  border-radius: 3px;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.participant-item:hover {
  border-color: var(--accent);
  background: var(--surface);
  transform: translateX(4px);
}

.p-name {
  font-weight: 600;
  color: var(--text);
}

.p-pages {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--border-soft);
  padding: 4px 10px;
  border-radius: 99px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 15px;
  transition: var(--transition);
}

.search-input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.no-results {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 14px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.schedule-header .title {
  text-align: left;
  margin: 0;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  border-radius: 99px;
  margin-top: 4px;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--accent);
  color: var(--accent);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-download:hover {
  background: var(--accent);
  color: white;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
  padding: 16px;
  background: var(--accent-soft);
  border-radius: var(--radius-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--accent);
  font-weight: 700;
}

.info-item .value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.days-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-soft);
}

.day-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--surface);
}

.day-info {
  display: flex;
  flex-direction: column;
}

.day-name {
  font-weight: 700;
  font-size: 14px;
}

.day-date {
  font-size: 12px;
  color: var(--text-muted);
}

.day-pages {
  text-align: right;
  display: flex;
  flex-direction: column;
}

.page-range {
  font-family: 'Lora', serif;
  font-weight: 800;
  color: var(--accent);
  font-size: 16px;
}

.page-label {
  font-size: 11px;
  color: var(--text-muted);
}

.warning-note {
  margin-top: 24px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: #b91c1c;
  line-height: 1.5;
}

.btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-ghost:hover {
  background: var(--bg);
  color: var(--text);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .schedule-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .btn-download {
    width: 100%;
    justify-content: center;
  }
}
</style>
