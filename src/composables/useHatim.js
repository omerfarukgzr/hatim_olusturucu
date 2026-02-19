import { ref } from 'vue';
import { hatimService } from '../services/hatimService';
import { authService } from '../services/authService';
import { hatimUtils } from '../utils/formatUtils';
import { exportService } from '../utils/exportUtils';
import { MAX_PAGES, STORAGE_KEY } from '../constants';

const hatims = ref([]);

export function useHatim() {

    function getLocalHatims() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalHatims(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    async function loadAll() {
        const user = await authService.getCurrentUser();
        if (!user) {
            // Guest mode: load from local storage
            hatims.value = getLocalHatims();
            return;
        }
        try {
            hatims.value = await hatimService.getAllByUser(user.id);
        } catch (e) {
            console.error('Hatimler yüklenemedi', e);
        }
    }

    async function loadHatim(id) {
        const user = await authService.getCurrentUser();

        // Try to find in local storage first (for guest created hatims)
        const localData = getLocalHatims();
        const localHatim = localData.find(h => h.id === id);
        if (localHatim) return localHatim;

        // If not local, try fetching from service (e.g., shared link)
        try {
            return await hatimService.getById(id);
        } catch (e) {
            console.error('Hatim yüklenemedi', e);
            return null;
        }
    }

    async function createHatim(name) {
        const user = await authService.getCurrentUser();

        const newHatim = {
            id: user ? undefined : `local-${Date.now()}`, // Temporary ID for local
            name: name || 'Yeni Hatim',
            startDate: '',
            endDate: '',
            participants: [],
            created: new Date().toISOString(),
            user_id: user ? user.id : 'guest'
        };

        if (!user) {
            // Guest mode: save to local storage
            const current = getLocalHatims();
            current.unshift(newHatim);
            saveLocalHatims(current);
            hatims.value.unshift(newHatim);
            return newHatim.id;
        }

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
        const user = await authService.getCurrentUser();

        // Update in state first for responsiveness
        const idx = hatims.value.findIndex(h => h.id === id);
        if (idx !== -1) {
            hatims.value[idx] = { ...hatims.value[idx], ...updates };
        }

        if (!user || String(id).startsWith('local-')) {
            // Guest mode or local hatim: update in local storage
            const current = getLocalHatims();
            const localIdx = current.findIndex(h => h.id === id);
            if (localIdx !== -1) {
                current[localIdx] = { ...current[localIdx], ...updates };
                saveLocalHatims(current);
            }
            return;
        }

        try {
            await hatimService.update(id, updates);
        } catch (e) {
            console.error('Hatim güncellenemedi', e);
        }
    }

    async function deleteHatim(id) {
        const user = await authService.getCurrentUser();

        if (!user || String(id).startsWith('local-')) {
            // Guest mode: delete from local storage
            const current = getLocalHatims();
            const filtered = current.filter(h => h.id !== id);
            saveLocalHatims(filtered);
            hatims.value = hatims.value.filter(h => h.id !== id);
            return;
        }

        try {
            await hatimService.delete(id);
            hatims.value = hatims.value.filter(h => h.id !== id);
        } catch (e) {
            console.error('Hatim silinemedi', e);
        }
    }

    function calculateStats(participants) {
        const total = (participants || []).reduce((s, p) => s + (parseInt(p.pages) || 0), 0);
        const cycleUsed = total % MAX_PAGES;

        if (total > 0 && cycleUsed === 0) {
            return { total, remaining: 0, percentage: 100 };
        }

        const remaining = MAX_PAGES - cycleUsed;
        const percentage = (cycleUsed / MAX_PAGES) * 100;
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
