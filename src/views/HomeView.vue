<template>
  <div class="app-header">
    <div class="header-top">
      <div class="logo">📖</div>
      <div>
        <div class="app-title">Hatim Takip Paneli</div>
        <div class="app-subtitle">Tüm Hatim Organizasyonlarınızı Yönetin</div>
      </div>
      <div v-if="user" class="user-info">
        <span class="user-email">👤 {{ user.email }}</span>
        <button class="btn btn-ghost" @click="handleLogout">Çıkış Yap 🚪</button>
      </div>
    </div>
  </div>

  <main class="main">
    <div class="list-card">
      <div class="list-header">
        <span class="list-title">📂 Hatim Listesi</span>
        <button class="btn btn-primary" @click="openCreateModal">➕ Yeni Hatim Oluştur</button>
      </div>
      <div class="table-wrap">
        <table v-if="hatims.length > 0">
          <thead>
            <tr>
              <th>HATIM ADI</th>
              <th>TARİH ARALIĞI</th>
              <th>KİŞİ SAYISI</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in hatims" :key="h.id" class="cursor-pointer" @click="goToDetail(h.id)">
              <td class="td-name">{{ h.name }}</td>
              <td class="td-range">
                <span v-if="h.startDate">{{ formatDate(h.startDate) }} - {{ formatDate(h.endDate) }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="td-pages">
                <span class="counter-badge">{{ (h.participants || []).length }}</span>
              </td>
              <td class="td-actions" @click.stop>
                <button class="btn btn-danger btn-icon" @click="openDeleteModal(h.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon">📂</div>
          <div class="empty-text">Henüz hatim oluşturulmadı</div>
          <div class="empty-sub">Yeni bir hatim oluşturarak başlayın</div>
        </div>
      </div>
    </div>
  </main>

  <!-- Create Modal -->
  <BaseModal 
    :isOpen="createModalOpen" 
    title="Yeni Hatim Oluştur" 
    confirmText="Oluştur" 
    @close="createModalOpen = false" 
    @confirm="createConfirm"
  >
    <div class="field-group">
      <label class="field-label">Hatim Adı</label>
      <input 
        ref="createInput"
        v-model="newHatimName" 
        class="field-input" 
        placeholder="Örn: Ramazan Hatmi 2025" 
        @keydown.enter="createConfirm" 
      />
    </div>
  </BaseModal>

  <!-- Delete Modal -->
  <BaseModal 
    :isOpen="deleteModalOpen" 
    title="Hatimi Sil" 
    confirmText="Sil" 
    @close="deleteModalOpen = false" 
    @confirm="deleteConfirm"
  >
    <p>Bu hatimi silmek istediğinize emin misiniz? <br><br>Bu işlem geri alınamaz.</p>
  </BaseModal>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { useHatim } from '../composables/useHatim';
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';
import BaseModal from '../components/BaseModal.vue';

const { hatims, createHatim, deleteHatim, loadAll } = useHatim();
const { user, signOut } = useAuth();
const router = useRouter();

onMounted(() => {
  loadAll();
});

async function handleLogout() {
  await signOut();
  router.push('/login');
}

// Create Modal State
const createModalOpen = ref(false);
const newHatimName = ref('');
const createInput = ref(null);

// Delete Modal State
const deleteModalOpen = ref(false);
const deleteId = ref(null);

function openCreateModal() {
  newHatimName.value = '';
  createModalOpen.value = true;
  nextTick(() => {
    if (createInput.value) createInput.value.focus();
  });
}

async function createConfirm() {
  const name = newHatimName.value.trim() || 'Yeni Hatim';
  const id = await createHatim(name);
  if (id) {
    createModalOpen.value = false;
    router.push(`/hatim/${id}`);
  }
}

function openDeleteModal(id) {
  deleteId.value = id;
  deleteModalOpen.value = true;
}

async function deleteConfirm() {
  if (deleteId.value) {
    await deleteHatim(deleteId.value);
    deleteId.value = null;
  }
  deleteModalOpen.value = false;
}

function goToDetail(id) {
  router.push(`/hatim/${id}`);
}

function formatDate(d) {
  if (!d) return '';
  return d.split('-').reverse().join('.');
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.text-muted { color: var(--text-muted); }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.field-input { 
  background: var(--surface2); border: 1px solid var(--border); 
  padding: 10px; border-radius: var(--radius-sm); color: var(--text); outline: none; width: 100%;
}
.field-input:focus { border-color: var(--accent); }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-email {
  font-size: 14px;
  color: var(--text-muted);
  background: var(--surface2);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
}
</style>
