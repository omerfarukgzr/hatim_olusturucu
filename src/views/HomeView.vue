<template>
  <header class="app-header">
    <div class="header-top">
      <div style="display: flex; align-items: center; gap: 20px;">
        <div class="logo">
          <img src="../assets/logo.png" alt="Hatim Takip Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" />
        </div>
        <h1 class="app-title">Hatim Takip</h1>
      </div>
      <div class="user-info-section">
        <ThemeToggle />
        <UserMenu v-if="user" />
        <button v-else class="btn btn-primary" @click="$router.push('/login')" style="padding: 8px 16px; font-size: 13px; display: flex; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          Giriş Yap
        </button>
      </div>
    </div>
  </header>

  <main class="main">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h2 class="hero-title">Hatimlerinizi Kolayca Planlayın ve Paylaşın</h2>
        <p class="hero-subtitle">
          Katılımcıları ekleyin, sayfaları otomatik dağıtın, Excel veya PDF olarak çıktı alıp grubunuzla paylaşın.
          Kayıt olmanıza gerek kalmadan hemen başlayabilirsiniz.
        </p>
        <button class="btn btn-primary hero-btn" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Hemen Başla
        </button>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡️</div>
        <h3 class="feature-title">Otomatik Dağıtım</h3>
        <p class="feature-desc">Kişi sayısına göre cüzleri veya sayfaları saniyeler içinde adaletli şekilde dağıtın.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📄</div>
        <h3 class="feature-title">Excel ve PDF Çıktısı</h3>
        <p class="feature-desc">Hazırladığınız listeyi profesyonel formatta indirip WhatsApp'ta paylaşın.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3 class="feature-title">Üyeliksiz Kullanım</h3>
        <p class="feature-desc">Kayıt olmanıza gerek yok, verileriniz tarayıcınızda güvenle saklanır.</p>
      </div>
    </div>

    <div class="list-card">
      <div class="list-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: var(--accent);">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="list-title">Hatim Listesi</span>
        </div>
        <button class="btn btn-primary" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 8px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Yeni Hatim Oluştur
        </button>
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
          <h3 class="empty-title">Henüz Hatim Oluşturulmadı</h3>
          <p class="empty-desc">Yeni bir hatim oluşturarak başlayın</p>
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
import UserMenu from '../components/UserMenu.vue';
import ThemeToggle from '../components/ThemeToggle.vue';

const { hatims, createHatim, deleteHatim, loadAll } = useHatim();
const { user } = useAuth();
const router = useRouter();

onMounted(() => {
  loadAll();
});

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
.user-info-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%);
  border-radius: var(--radius);
  margin-bottom: 40px;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-sm);
}

.hero-title {
  font-family: 'Lora', serif;
  font-size: 36px;
  color: var(--accent);
  margin-bottom: 16px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto 32px;
  line-height: 1.6;
}

.hero-btn {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 50px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: var(--surface);
  padding: 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  transition: var(--transition);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow);
  border-color: var(--accent-soft);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ── EMPTY STATE ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-title {
  font-family: 'Lora', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.empty-desc {
  font-size: 15px;
  color: var(--text-muted);
  max-width: 320px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title { font-size: 28px; }
  .hero-subtitle { font-size: 16px; }
}
</style>
