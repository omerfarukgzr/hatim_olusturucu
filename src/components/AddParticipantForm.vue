<template>
  <div class="add-card">
    <div class="card-header">
      <span class="card-title">➕ Kişi Ekle</span>
      <div class="page-counter">
        <span class="counter-label">Kalan Sayfa:</span>
        <span :class="badgeClass">{{ remainingPages }}</span>
      </div>
    </div>
    
    <!-- Single Entry Form -->
    <div class="add-form">
      <div class="form-group name-group">
        <label class="form-label" for="addFullName">İsim Soyisim</label>
        <input class="form-input" id="addFullName" type="text" placeholder="Ahmet Yılmaz" v-model="fullName" @keydown.enter="submit" />
      </div>
      <div class="form-group pages-group">
        <label class="form-label" for="addPages">Sayfa Sayısı</label>
        <input class="form-input" id="addPages" type="number" min="1" max="604" placeholder="20" v-model.number="pages" @keydown.enter="submit" />
      </div>
      
      <button class="btn btn-primary action-btn" id="addBtn" @click="submit">
        <span>＋</span> Ekle
      </button>
    </div>

    <div class="divider"></div>

    <!-- Bulk Upload Section -->
    <div class="bulk-upload-section">
      <div class="bulk-content">
        <span class="bulk-title">📂 Excel ile Toplu Yükleme</span>
        <p class="bulk-desc">
          Toplu kişi eklemek için önce şablonu indirin, verilerinizi girin ve ardından dosyayı buraya yükleyin.
          (1. Sütun: İsim, 2. Sütun: Sayfa Sayısı)
        </p>
      </div>
      <div class="bulk-buttons">
        <button class="btn btn-outline" @click="downloadTemplate" title="Örnek Dosya İndir">
          📄 Şablon İndir
        </button>
        
        <input 
          type="file" 
          ref="fileInputRef" 
          style="display: none" 
          accept=".xlsx, .xls" 
          @change="handleFileUpload" 
        />
        <button class="btn btn-success" @click="triggerFileInput" title="Excel Dosyası Yükle">
          Dosya Yükle
        </button>
      </div>
    </div>
    
    <div class="progress-wrap">
      <div :class="progressBarClass" :style="{ width: percentage + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from '../composables/useToast';
import ExcelJS from 'exceljs';

const props = defineProps({
  remainingPages: Number,
  percentage: Number
});

const emit = defineEmits(['add', 'addBatch']);
const { show } = useToast();

const fullName = ref('');
const pages = ref('');
const fileInputRef = ref(null);

const badgeClass = computed(() => {
  return [
    'counter-badge',
    props.percentage >= 90 ? 'danger' : props.percentage >= 70 ? 'warning' : ''
  ];
});

const progressBarClass = computed(() => {
  return [
    'progress-bar',
    props.percentage >= 90 ? 'danger' : props.percentage >= 70 ? 'warning' : ''
  ];
});

function submit() {
  const name = fullName.value.trim();
  const ps = parseInt(pages.value);

  if (!name) {
    show('İsim Soyisim alanı boş olamaz.', 'error');
    return;
  }
  if (!ps || ps < 1) {
    show('Geçerli bir sayfa sayısı girin.', 'error');
    return;
  }

  emit('add', { fullName: name, pages: ps });

  fullName.value = '';
  pages.value = '';
}

function triggerFileInput() {
  fileInputRef.value.click();
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const buffer = evt.target.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.getWorksheet(1); 
      
      if (!ws) {
        show('Excel dosyasında sayfa bulunamadı.', 'error');
        return;
      }

      const newParticipants = [];
      ws.eachRow((row, rowNumber) => {
        let nameVal = row.getCell(1).value;
        let pagesVal = row.getCell(2).value;

        if (nameVal && typeof nameVal === 'object' && nameVal.richText) {
          nameVal = nameVal.richText.map(r => r.text).join('');
        }
        
        let p = parseInt(pagesVal);

        if (isNaN(p)) return;

        const nameStr = String(nameVal || '').trim();
        if (nameStr && p > 0) {
          newParticipants.push({ fullName: nameStr, pages: p });
        }
      });

      newParticipants.sort((a, b) => b.pages - a.pages);

      if (newParticipants.length > 0) {
        emit('addBatch', newParticipants);
        e.target.value = ''; 
      } else {
         show('Dosyadan geçerli veri okunamadı.', 'warning');
      }
    } catch (err) {
      console.error(err);
      show('Dosya okuma hatası.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

async function downloadTemplate() {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Şablon');
    
    // Headers
    const headerRow = ws.addRow(['İSİM SOYİSİM', 'SAYFA SAYISI']);
    headerRow.font = { bold: true };
    
    // Example Rows
    ws.addRow(['Ahmet Yılmaz', 20]);
    ws.addRow(['Mehmet Demir', 10]);
    
    // Styling
    ws.getColumn(1).width = 25;
    ws.getColumn(2).width = 15;
    ws.getColumn(2).alignment = { horizontal: 'center' };
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hatim_yukleme_sablonu.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    show('Şablon indirildi.', 'success');
  } catch(e) {
    show('Şablon oluşturulamadı.', 'error');
  }
}
</script>

<style scoped>
.add-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.name-group { flex: 2; min-width: 200px; }
.pages-group { flex: 0 0 120px; }

.action-btn { height: 45px; font-size: 1rem; }

/* Custom Badge overrides for this component */
.counter-badge {
  background: var(--bg);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 4px 12px;
  border: 1px solid var(--border);
}
.counter-badge.warning { background: #FEF3C7; color: #D97706; border-color: #FCD34D; }
.counter-badge.danger { background: #FEE2E2; color: #EF4444; border-color: #FCA5A5; }

/* Progress Bar */
.progress-wrap {
  margin-top: 20px;
  background: var(--bg);
  border-radius: 20px;
  height: 8px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 20px;
  background: var(--primary);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-bar.warning { background: var(--accent); }
.progress-bar.danger { background: var(--danger); }

/* Bulk Upload Section */
.divider {
  margin: 24px 0;
  border-top: 1px solid var(--border);
}

.bulk-upload-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg);
  padding: 20px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border);
}

.bulk-content { flex: 1; padding-right: 20px; }
.bulk-title { font-size: 0.95rem; font-weight: 600; color: var(--text); display: block; margin-bottom: 4px; }
.bulk-desc { font-size: 0.85rem; color: var(--t-muted); margin: 0; line-height: 1.5; }

.bulk-buttons { display: flex; gap: 12px; align-items: center; }

@media (max-width: 700px) {
  .add-form { flex-direction: column; align-items: stretch; gap: 12px; }
  .name-group, .pages-group { flex: 1; width: 100%; }
  
  .bulk-upload-section { flex-direction: column; align-items: flex-start; gap: 16px; }
  .bulk-content { padding-right: 0; }
  .bulk-buttons { width: 100%; flex-direction: column; }
  .btn { width: 100%; }
}
</style>
