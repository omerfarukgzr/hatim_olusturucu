<template>
  <div class="info-card-container">
    <div class="info-header">
      <div class="header-text">
        <h3 class="title">Hatim Bilgilerini Düzenle</h3>
        <p class="subtitle">Hatim adını ve mukabele tarih aralığını buradan güncelleyebilirsiniz.</p>
      </div>
    </div>
    
    <div class="info-grid">
      <div class="field-card name-field">
        <label for="hatimName" class="field-label">Hatim Adı</label>
        <div class="input-wrapper">
          <input 
            id="hatimName" 
            type="text" 
            class="premium-input"
            placeholder="Örn: Ramazan Hatmi" 
            :value="hatimName" 
            @input="$emit('update:hatimName', $event.target.value)" 
          />
        </div>
      </div>

      <div class="date-row">
        <div class="field-card">
          <label for="startDate" class="field-label">Başlangıç Tarihi</label>
          <div class="input-wrapper">
            <input 
              id="startDate" 
              type="date" 
              class="premium-input"
              :value="start_date" 
              @change="$emit('update:start_date', $event.target.value)" 
            />
          </div>
        </div>

        <div class="field-card">
          <label for="endDate" class="field-label">Bitiş Tarihi</label>
          <div class="input-wrapper">
            <input 
              id="endDate" 
              type="date" 
              class="premium-input"
              :value="end_date" 
              @change="$emit('update:end_date', $event.target.value)" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hatimName: String,
  start_date: String,
  end_date: String,
});
defineEmits(['update:hatimName', 'update:start_date', 'update:end_date']);
</script>

<style scoped>
.info-card-container {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow);
  margin-bottom: 32px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-soft);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.title {
  font-family: 'Lora', serif;
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--text-muted);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.field-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-icon {
  font-size: 16px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.premium-input {
  width: 100%;
  padding: 14px 18px;
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text);
  font-family: inherit;
  font-size: 16px;
  transition: var(--transition);
}

/* Date input specifically */
.premium-input[type="date"] {
  cursor: pointer;
  position: relative;
}

/* Make the entire input area trigger the native picker in Chrome/Edge */
.premium-input[type="date"]::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  cursor: pointer;
  opacity: 0; /* Hidden but clickable everywhere */
}

/* Add a professional SVG calendar icon - only for date inputs */
.input-wrapper:has(input[type="date"])::after {
  content: '';
  position: absolute;
  right: 18px;
  width: 20px;
  height: 20px;
  background-color: var(--text);
  opacity: 0.4;
  pointer-events: none;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

.premium-input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.date-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.info-note {
  margin-top: 32px;
  padding: 16px;
  background: var(--bg-alt);
  border-radius: var(--radius-md);
  display: flex;
  gap: 12px;
  align-items: center;
}

.note-icon {
  font-size: 20px;
}

.info-note p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

@media (max-width: 600px) {
  .date-row {
    grid-template-columns: 1fr;
  }
  .info-card-container {
    padding: 20px;
  }
}
</style>
