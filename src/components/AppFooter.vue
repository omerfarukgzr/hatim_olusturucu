<template>
  <div class="footer-card">
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Toplam Kişi</span>
        <span class="stat-value">{{ count }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Dağıtılan</span>
        <span class="stat-value">{{ used }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Kalan</span>
        <span class="stat-value">{{ remaining }}</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-outline" @click="$emit('exportPdf')" title="PDF İndir">
        PDF İndir
      </button>
      <button class="btn btn-success" @click="$emit('export')" title="Excel İndir">
        Excel İndir
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: Number,
  used: Number,
  remaining: Number
});
defineEmits(['export', 'exportPdf']);
</script>

<style scoped>
.footer-card {
  background: var(--header-bg);
  border-top: 1px solid var(--border-soft);
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  bottom: 0;
  backdrop-filter: blur(12px);
  z-index: 10;
  max-width: 1000px;
  margin: 0 auto;
  border-radius: var(--radius) var(--radius) 0 0;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.03);
}

.stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-value {
  font-family: 'Lora', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
}

.actions {
  display: flex;
  gap: 16px;
}


@media (max-width: 600px) {
  .footer-card { flex-direction: column; gap: 20px; align-items: stretch; padding: 20px; border-radius: 0; }
  .stats { justify-content: space-between; gap: 12px; }
  .actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>
