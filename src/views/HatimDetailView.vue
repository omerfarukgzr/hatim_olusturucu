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
        <ThemeToggle />
        <button class="btn btn-ghost" @click="$router.push('/')">⬅️ Listeye Dön</button>
        <UserMenu />
      </div>
    </div>

    <main class="main">
      <HatimInfoCard
        v-model:hatimName="hatim.name"
        v-model:startDate="hatim.startDate"
        v-model:endDate="hatim.endDate"
      />

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
        :percentage="percentage"
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

      <AppFooter
        :count="hatim.participants.length"
        :used="total"
        :remaining="remaining"
        @export="handleExport"
        @exportPdf="handleExportPdf"
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
    Hatim bulunamadı. <button @click="$router.push('/')">Listeye Dön</button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHatim } from '../composables/useHatim';
import { useToast } from '../composables/useToast';

import HatimInfoCard from '../components/HatimInfoCard.vue';
import AddParticipantForm from '../components/AddParticipantForm.vue';
import ParticipantList from '../components/ParticipantList.vue';
import AppFooter from '../components/AppFooter.vue';
import BaseModal from '../components/BaseModal.vue';
import UserMenu from '../components/UserMenu.vue';
import ThemeToggle from '../components/ThemeToggle.vue';

const route = useRoute();
const { hatims, calculateStats, getPersonStartPage, exportExcel, exportPdf, MAX_PAGES, updateHatim, loadHatim } = useHatim();
const { show } = useToast();

const hatim = ref(null);
const isLoading = ref(true);

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
// For now, let's call updateHatim manually to avoid excessive API calls
async function triggerSave() {
  if (hatim.value) {
    await updateHatim(hatim.value.id, {
      name: hatim.value.name,
      startDate: hatim.value.startDate,
      endDate: hatim.value.endDate,
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
const percentage = computed(() => stats.value.percentage);

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

// Watchers for basic info
watch(() => hatim.value?.name, triggerSave);
watch(() => hatim.value?.startDate, triggerSave);
watch(() => hatim.value?.endDate, triggerSave);
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

.not-found {
  padding: 100px 24px;
  text-align: center;
  color: var(--text-muted);
}
.not-found button {
  margin-left: 10px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
}

.info-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 32px;
  display: flex;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  align-items: flex-start;
  transition: var(--transition);
}

.info-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.info-icon {
  color: var(--accent);
  background: var(--accent-soft);
  width: 40px;
  height: 40px;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
  margin-top: 0;
}

.info-text {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

.info-text strong {
  color: var(--text);
  font-weight: 600;
}
</style>
