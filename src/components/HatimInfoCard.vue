<template>
  <div class="add-card" style="margin-bottom: 24px;">
    <div class="card-header">
      <span class="card-title">📖 Hatim Bilgileri</span>
    </div>
    <div class="info-form">
      <div class="form-group hatim-name">
        <label class="form-label" for="hatimName">Hatim Adı</label>
        <input class="form-input" id="hatimName" type="text" placeholder="Örn: Ramazan Hatmi" :value="hatimName" @input="$emit('update:hatimName', $event.target.value)" />
      </div>
      <div class="form-group">
        <label class="form-label" for="startDate">Başlangıç</label>
        <input class="form-input" id="startDate" type="date" :value="startDate" @change="$emit('update:startDate', $event.target.value)" />
      </div>
      <div class="form-group">
        <label class="form-label" for="endDate">Bitiş</label>
        <input class="form-input" id="endDate" type="date" :value="endDate" @change="$emit('update:endDate', $event.target.value)" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hatimName: String,
  startDate: String,
  endDate: String
});
defineEmits(['update:hatimName', 'update:startDate', 'update:endDate']);
</script>

<style scoped>
.info-form {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  align-items: end;
}
@media (max-width: 700px) {
  .info-form { grid-template-columns: 1fr; }
}

.hatim-name { width: 100%; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--t-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 4px;
}

.card-header {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
  margin-left: -24px;
  margin-right: -24px;
  padding-left: 24px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}
</style>
