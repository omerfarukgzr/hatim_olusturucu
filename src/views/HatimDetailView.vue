<template>
  <div v-if="hatim">
    <div class="nav-bar">
      <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" @click="$router.push('/')">
        <div class="logo">
          <img src="../assets/logo.png" alt="Hatim Takip Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />
        </div>
        <h1 class="nav-title">Hatim Takip</h1>
      </div>
      
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="btn btn-ghost" @click="$router.push('/')">⬅️ Listeye Dön</button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>

    <main class="main">
      <!-- Tab System at the top -->
      <div class="tabs-container">
        <div class="tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'list' }" 
            @click="activeTab = 'list'"
          >
            Katılımcı Listesi
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'tracking' }" 
            @click="activeTab = 'tracking'"
          >
            Takip Çizelgesi
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'settings' }" 
            @click="activeTab = 'settings'"
          >
            Hatim Bilgisi
          </button>
        </div>
      </div>

      <div class="hatim-summary-card">
        <div class="summary-header">
          <div class="summary-title-group">
            <h2 class="summary-name">{{ hatim.name }}</h2>
            <div class="summary-progress-info">
              <div class="percentage-pill">
                <span class="percentage-dot" :class="{ 'is-complete': readingPercentage === 100 }"></span>
                <span class="percentage-text">{{ readingPercentage.toFixed(1) }}% Tamamlandı</span>
              </div>
            </div>
          </div>
        </div>
        <div class="summary-progress-bar">
          <div class="progress-fill" :style="{ width: readingPercentage + '%' }"></div>
        </div>
      </div>

      <!-- Tab Content: Participant List -->
      <div v-if="activeTab === 'list'">
        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div class="info-content">
            <h3 class="info-title">Hatırlatma: 600 Sayfa Dağıtımı</h3>
            <p class="info-text">
              Hatim dağıtımı <strong>600 sayfa</strong> üzerinden yapılmektedir. Son 4 sayfa kısa süreler olduğu için dağıtıma dahil edilmemiştir. 
              <strong>600. sayfaya denk gelen kişinin son 4 sayfayı da okuması gerekmektedir.</strong>
            </p>
          </div>
        </div>

        <AddParticipantForm
          :remainingPages="remaining"
          :percentage="distributionPercentage"
          @add="handleAdd"
          @addBatch="handleAddBatch"
        />

        <ParticipantList
          :participants="hatim.participants"
          :getStartPage="idx => getStartPage(idx)"
          @delete="openDeleteModal"
          @move="handleMove"
          @update="handleUpdate"
          @reorder="handleReorder"
        />
      </div>

      <!-- Tab Content: Tracking Chart -->
      <div v-if="activeTab === 'tracking'">
        <TrackingChart 
          :participants="hatim.participants"
          :startDate="hatim.start_date"
          :endDate="hatim.end_date"
          :hatimId="hatim.id"
        />
      </div>

      <!-- Tab Content: Settings -->
      <div v-if="activeTab === 'settings'">
        <HatimInfoCard
          v-model:hatimName="hatim.name"
          v-model:start_date="hatim.start_date"
          v-model:end_date="hatim.end_date"
        />
      </div>

      <AppFooter
        :count="hatim.participants.length"
        :used="total"
        :remaining="remaining"
        :showActions="activeTab !== 'settings'"
        @export="handleExport"
        @exportPdf="handleExportPdf"
        @copyLink="handleCopyLink"
      />
    </main>

    <!-- Delete Modal -->
    <BaseModal 
      :isOpen="deleteModalOpen" 
      title="Kişiyi Sil" 
      confirmText="Sil" 
      @close="deleteModalOpen = false" 
      @confirm="confirmDelete"
    >
      <p>"{{ deleteName }}" adlı kişiyi listeden silmek istediğinize emin misiniz?</p>
    </BaseModal>
  </div>
  <div v-else class="not-found">
    <div class="loading-container" v-if="isLoading">
      <div class="spinner"></div>
      <p>Hatim bilgileri yükleniyor...</p>
    </div>
    <div v-else>
      Hatim bulunamadı. <button @click="$router.push('/')">Listeye Dön</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHatim } from '../composables/useHatim';
import { useToast } from '../composables/useToast';

import HatimInfoCard from '../components/HatimInfoCard.vue';
import AddParticipantForm from '../components/AddParticipantForm.vue';
import ParticipantList from '../components/ParticipantList.vue';
import TrackingChart from '../components/TrackingChart.vue';
import AppFooter from '../components/AppFooter.vue';
import BaseModal from '../components/BaseModal.vue';
import UserMenu from '../components/UserMenu.vue';
import ThemeToggle from '../components/ThemeToggle.vue';

const route = useRoute();
const router = useRouter();
const { hatims, calculateStats, calculateReadingProgress, getPersonStartPage, exportExcel, exportPdf, MAX_PAGES, updateHatim, loadHatim } = useHatim();
const { show } = useToast();

const hatim = ref(null);
const isLoading = ref(true);
const activeTab = ref('list');

onMounted(async () => {
  const id = route.params.id;
  // Try to find in global state first
  const existing = hatims.value.find(h => h.id === id);
  if (existing) {
    hatim.value = { ...existing };
  } else {
    // Fetch from Supabase directly (for shared links)
    const data = await loadHatim(id);
    if (data) {
      hatim.value = data;
    }
  }
  isLoading.value = false;
});

// Deep watch and auto-save (debounced would be better, but let's keep it simple for now or manual save)
async function triggerSave() {
  if (hatim.value && !isLoading.value) {
    await updateHatim(hatim.value.id, {
      name: hatim.value.name,
      start_date: hatim.value.start_date,
      end_date: hatim.value.end_date,
      participants: hatim.value.participants
    });
  }
}

const stats = computed(() => {
  if (!hatim.value) return { total: 0, remaining: MAX_PAGES, percentage: 0 };
  return calculateStats(hatim.value.participants);
});

const total = computed(() => stats.value.total);
const remaining = computed(() => stats.value.remaining);
const distributionPercentage = computed(() => stats.value.percentage);

const readingPercentage = computed(() => {
  if (!hatim.value) return 0;
  return calculateReadingProgress(hatim.value.participants);
});

// Delete Modal State
const deleteModalOpen = ref(false);
const deleteIndex = ref(null);
const deleteName = ref('');

function getStartPage(index) {
  if (!hatim.value) return 1;
  return getPersonStartPage(hatim.value.participants, index);
}

async function handleAdd({ fullName, pages }) {
  hatim.value.participants.push({
    id: Date.now().toString(),
    fullName,
    pages
  });
  await triggerSave();
  show(`${fullName} eklendi.`);
}

async function handleAddBatch(newParticipants) {
  let count = 0;
  
  newParticipants.sort((a, b) => b.pages - a.pages);

  for (const p of newParticipants) {
    hatim.value.participants.push({
      id: (Date.now() + Math.random()).toString(),
      fullName: p.fullName,
      pages: p.pages
    });
    count++;
  }
  
  if (count > 0) {
    await triggerSave();
    show(`${count} kişi listeden eklendi.`, 'success');
  }
}

function openDeleteModal(index) {
  const p = hatim.value.participants[index];
  if (p) {
    deleteName.value = p.fullName;
    deleteIndex.value = index;
    deleteModalOpen.value = true;
  }
}

async function confirmDelete() {
  if (deleteIndex.value !== null && hatim.value) {
    hatim.value.participants.splice(deleteIndex.value, 1);
    await triggerSave();
    show('Kişi silindi.', 'warning');
    deleteIndex.value = null;
  }
  deleteModalOpen.value = false;
}

async function handleMove(index, direction) {
  const p = hatim.value.participants;
  if (direction === 'up' && index > 0) {
    [p[index], p[index - 1]] = [p[index - 1], p[index]];
    await triggerSave();
  } else if (direction === 'down' && index < p.length - 1) {
    [p[index], p[index + 1]] = [p[index + 1], p[index]];
    await triggerSave();
  }
}

async function handleReorder({ from, to, position }) {
  const p = hatim.value.participants;
  const item = p.splice(from, 1)[0];
  
  // Calculate new index after splice
  let newIndex = to;
  if (from < to && position === 'top') newIndex = to - 1;
  else if (from > to && position === 'bottom') newIndex = to + 1;
  
  p.splice(newIndex, 0, item);
  await triggerSave();
}

async function handleUpdate(index, { fullName, pages }) {
  hatim.value.participants[index].fullName = fullName;
  hatim.value.participants[index].pages = pages;
  await triggerSave();
  show('Güncellendi.');
}

function handleExport() {
  try {
    exportExcel(hatim.value);
    show('Excel indirildi!');
  } catch (e) {
    show(e.message, 'error');
  }
}

function handleExportPdf() {
  try {
    exportPdf(hatim.value);
    show('PDF indiriliyor...', 'success');
  } catch (e) {
    show(e.message, 'error');
  }
}

function handleCopyLink() {
  const resolved = router.resolve({ 
    name: 'participant-detail', 
    params: { id: hatim.value.id } 
  });
  const url = `${window.location.origin}${resolved.href}`;
  navigator.clipboard.writeText(url);
  show('Takip linki kopyalandı! Bu linki katılımcılara gönderebilirsiniz.', 'success');
}

// Watchers for basic info
watch(() => hatim.value?.name, triggerSave);
watch(() => hatim.value?.start_date, triggerSave);
watch(() => hatim.value?.end_date, triggerSave);
</script>

<style scoped>
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-soft);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 101;
}

.nav-bar .logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.nav-bar .nav-title {
  font-family: 'Lora', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  margin: 0;
}

/* Hatim Summary Card */
.hatim-summary-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-top: 8px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn-round {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-alt);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.back-btn-round:hover {
  background: var(--accent-light);
  color: var(--accent);
  border-color: var(--accent);
}

.summary-title-group {
  flex: 1;
}

.summary-name {
  font-family: 'Lora', serif;
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.summary-progress-info {
  margin-top: 4px;
}

.percentage-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-soft);
  padding: 4px 12px;
  border-radius: 100px;
  margin-top: 4px;
}

.percentage-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  display: inline-block;
  animation: pulse-dot 2s infinite;
}

.percentage-dot.is-complete {
  background: var(--green);
  animation: none;
  box-shadow: 0 0 10px var(--green);
}

@keyframes pulse-dot {
  0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(74, 103, 65, 0.4); }
  70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 6px rgba(74, 103, 65, 0); }
  100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(74, 103, 65, 0); }
}

.percentage-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}

.summary-progress-bar {
  height: 16px;
  background: var(--bg-alt);
  border-radius: 30px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-soft);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.summary-progress-bar .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%);
  border-radius: 30px;
  transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 20px rgba(122, 156, 110, 0.25);
  position: relative;
}

/* Glass shine effect */
.summary-progress-bar .progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
  border-radius: 30px 30px 0 0;
  pointer-events: none;
}

/* Tabs */
.tabs-container {
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}

.tabs {
  display: inline-flex;
  background: var(--bg-alt);
  padding: 4px;
  border-radius: var(--radius-md);
  gap: 4px;
}

.tab-btn {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
}

.tab-btn.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.tab-btn:hover:not(.active) {
  background: rgba(0, 0, 0, 0.05);
}

.tab-icon {
  font-size: 16px;
}

.not-found {
  padding: 100px 24px;
  text-align: center;
  color: var(--text-muted);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.info-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 32px;
  display: flex;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  align-items: flex-start;
}

.info-icon {
  color: var(--accent);
  background: var(--accent-light);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-family: 'Lora', serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
  margin-top: 0;
}

.info-text {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.info-text strong {
  color: var(--text);
  font-weight: 600;
}
</style>
