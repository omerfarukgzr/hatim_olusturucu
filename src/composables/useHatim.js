import { ref } from 'vue';
import { hatimService } from '../services/hatimService';
import { authService } from '../services/authService';
import { hatimUtils } from '../utils/formatUtils';
import { exportService } from '../utils/exportUtils';
import { MAX_PAGES } from '../constants';

const hatims = ref([]);

export function useHatim() {

    async function loadAll() {
        const user = await authService.getCurrentUser();
        if (!user) return;
        try {
            hatims.value = await hatimService.getAllByUser(user.id);
        } catch (e) {
            console.error('Hatimler yüklenemedi', e);
        }
    }

    async function loadHatim(id) {
        try {
            return await hatimService.getById(id);
        } catch (e) {
            console.error('Hatim yüklenemedi', e);
            return null;
        }
    }

    async function createHatim(name) {
        const user = await authService.getCurrentUser();
        if (!user) return null;

        const newHatim = {
            name: name || 'Yeni Hatim',
            startDate: '',
            endDate: '',
            participants: [],
            created: new Date().toISOString(),
            user_id: user.id
        };

        try {
            const data = await hatimService.create(newHatim);
            hatims.value.unshift(data);
            return data.id;
        } catch (e) {
            console.error('Hatim oluşturulamadı', e);
            return null;
        }
    }

    async function updateHatim(id, updates) {
        try {
            await hatimService.update(id, updates);
            const idx = hatims.value.findIndex(h => h.id === id);
            if (idx !== -1) hatims.value[idx] = { ...hatims.value[idx], ...updates };
        } catch (e) {
            console.error('Hatim güncellenemedi', e);
        }
    }

    async function deleteHatim(id) {
        try {
            await hatimService.delete(id);
            hatims.value = hatims.value.filter(h => h.id !== id);
        } catch (e) {
            console.error('Hatim silinemedi', e);
        }
    }

    function calculateStats(participants) {
        const total = (participants || []).reduce((s, p) => s + (parseInt(p.pages) || 0), 0);
        const remaining = MAX_PAGES - total;
        const percentage = (total / MAX_PAGES) * 100;
        return { total, remaining, percentage };
    }

    return {
        hatims,
        loadAll,
        loadHatim,
        createHatim,
        updateHatim,
        deleteHatim,
        calculateStats,
        getPersonStartPage: hatimUtils.getPersonStartPage,
        exportExcel: exportService.excel,
        exportPdf: exportService.pdf,
        MAX_PAGES
    };
}
