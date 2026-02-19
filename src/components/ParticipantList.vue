<template>
  <div class="list-card">
    <div class="list-header">
      <span class="list-title">👥 Katılımcı Listesi</span>
      <span class="list-count">{{ participants.length }} kişi</span>
    </div>
    <div class="table-wrap">
      <table v-if="participants.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>İSİM SOYİSİM</th>
            <th>SAYFA SAYISI</th>
            <th>BAŞLANGIÇ SF.</th>
            <th>İŞLEMLER</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(p, index) in participants" 
            :key="p.id"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent="onDragOver($event, index)"
            @drop="onDrop(index)"
            @dragend="onDragEnd"
            :class="{ 
              'is-dragging': draggedIndex === index,
              'drag-over-top': dragOverIndex === index && dropPosition === 'top',
              'drag-over-bottom': dragOverIndex === index && dropPosition === 'bottom'
            }"
            class="draggable-row"
          >
            <td class="td-num">{{ index + 1 }}</td>
            <td class="td-name">
              <input v-if="editingId === p.id" v-model="editName" class="inline-edit" type="text" />
              <span v-else>{{ p.fullName }}</span>
            </td>
            <td class="td-pages">
              <input v-if="editingId === p.id" v-model.number="editPages" class="inline-edit" type="number" min="1" :max="MAX_PAGES" />
              <span v-else>{{ p.pages }}</span>
            </td>
            <td class="td-range">Sf. {{ getStartPage(index) }}</td>
            <td>
              <div class="td-actions" v-if="editingId === p.id">
                <button class="btn btn-primary btn-icon" title="Kaydet" @click="save(index)">💾</button>
                <button class="btn btn-ghost btn-icon" title="İptal" @click="cancelEdit">✕</button>
              </div>
              <div class="td-actions" v-else>
                <button class="btn btn-ghost btn-icon" title="Düzenle" @click="startEdit(p)">✏️</button>
                <button class="btn btn-danger btn-icon" title="Sil" @click="$emit('delete', index)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3 class="empty-title">Henüz Katılımcı Yok</h3>
        <p class="empty-desc">Listeniz şu an boş. Yukarıdaki formu kullanarak<br>yeni katılımcılar ekleyebilirsiniz.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { MAX_PAGES } from '../constants';

const props = defineProps({
  participants: Array,
  getStartPage: Function
});

const emit = defineEmits(['delete', 'move', 'update', 'reorder']);

const editingId = ref(null);
const editName = ref('');
const editPages = ref('');

// Drag & Drop State
const draggedIndex = ref(null);
const dragOverIndex = ref(null);
const dropPosition = ref(null); // 'top' or 'bottom'
let scrollInterval = null;

function onDragStart(index) {
  draggedIndex.value = index;
}

function onDragOver(event, index) {
  dragOverIndex.value = index;
  const rect = event.currentTarget.getBoundingClientRect();
  const relativeY = event.clientY - rect.top;
  
  if (relativeY < rect.height / 2) {
    dropPosition.value = 'top';
  } else {
    dropPosition.value = 'bottom';
  }

  // Auto-scroll logic
  const threshold = 100; // px from edge
  const speed = 15;
  const viewportHeight = window.innerHeight;

  if (event.clientY > viewportHeight - threshold) {
    // Scroll down
    if (!scrollInterval) {
      scrollInterval = setInterval(() => {
        window.scrollBy({ top: speed, behavior: 'auto' });
      }, 16);
    }
  } else if (event.clientY < threshold) {
    // Scroll up
    if (!scrollInterval) {
      scrollInterval = setInterval(() => {
        window.scrollBy({ top: -speed, behavior: 'auto' });
      }, 16);
    }
  } else {
    stopScroll();
  }
}

function stopScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

function onDragEnd() {
  draggedIndex.value = null;
  dragOverIndex.value = null;
  dropPosition.value = null;
  stopScroll();
}

function onDrop(toIndex) {
  stopScroll();
  if (draggedIndex.value !== null) {
    emit('reorder', { 
      from: draggedIndex.value, 
      to: toIndex,
      position: dropPosition.value 
    });
  }
}

function startEdit(p) {
  editingId.value = p.id;
  editName.value = p.fullName;
  editPages.value = p.pages;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = '';
  editPages.value = '';
}

function save(index) {
  if (!editName.value.trim()) return;
  if (!editPages.value || editPages.value < 1) return;
  
  emit('update', index, { fullName: editName.value, pages: parseInt(editPages.value) });
  cancelEdit();
}
</script>

<style scoped>
.draggable-row {
  cursor: grab;
  transition: var(--transition);
}

.draggable-row:active {
  cursor: grabbing;
}

.is-dragging {
  opacity: 0.4;
  background: var(--surface-alt);
}

.drag-over-top {
  box-shadow: inset 0 3px 0 0 var(--accent) !important;
}

.drag-over-bottom {
  box-shadow: inset 0 -3px 0 0 var(--accent) !important;
}

.inline-edit {
  width: 100%;
  padding: 4px 8px;
  background: var(--surface-alt);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

.inline-edit:focus {
  border-color: var(--accent);
  background: var(--surface);
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
</style>
