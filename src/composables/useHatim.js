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
        // For local hatims, load from local storage
        if (String(id).startsWith('local-')) {
            const localData = getLocalHatims();
            return localData.find(h => h.id === id) || null;
        }

        // For Supabase hatims, always fetch from DB to get the latest progress
        try {
            return await hatimService.getById(id);
        } catch (e) {
            console.error('Hatim yüklenemedi', e);
            return null;
        }
    }

    async function createHatim(name, startDate = '', endDate = '') {
        const user = await authService.getCurrentUser();

        const newHatim = {
            name: name || 'Yeni Hatim',
            start_date: startDate || '',
            end_date: endDate || '',
            participants: [],
            user_id: user ? user.id : null
        };

        if (!user) {
            // Guest mode: save to local storage
            const localHatim = { ...newHatim, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
            const current = getLocalHatims();
            current.unshift(localHatim);
            saveLocalHatims(current);
            hatims.value.unshift(localHatim);
            return localHatim.id;
        }

        try {
            const data = await hatimService.create(newHatim);
            hatims.value.unshift(data);
            return data.id;
        } catch (e) {
            console.error('Hatim oluşturulamadı', e);
            throw e;
        }
    }

    async function updateHatim(id, updates) {
        const user = await authService.getCurrentUser();

        // Update in state first for responsiveness
        const idx = hatims.value.findIndex(h => h.id === id);
        if (idx !== -1) {
            hatims.value[idx] = { ...hatims.value[idx], ...updates };
        }

        if (String(id).startsWith('local-')) {
            // Local hatim: update in local storage
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
            throw e;
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

    function calculateReadingProgress(participants, startDate, endDate) {
        if (!participants || participants.length === 0) return 0;

        // Calculate total days in the period
        let totalDays = 0;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (!isNaN(start) && !isNaN(end)) {
                const diffTime = Math.abs(end - start);
                totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
        }

        let totalRead = 0;
        let totalToRead = 0;

        participants.forEach(p => {
            const pages = parseInt(p.pages) || 0;
            const checkedCount = p.checkedDays ? p.checkedDays.length : 0;
            totalRead += checkedCount * pages;

            // If dates are set, calculate total assigned pages for the period
            // Otherwise, fallback to 600 as a reference for a single hatim
            if (totalDays > 0) {
                totalToRead += totalDays * pages;
            }
        });

        // Fallback: If no dates are set or period is 0, use MAX_PAGES (600) as denominator
        if (totalToRead === 0) {
            totalToRead = MAX_PAGES;
        }

        const progress = (totalRead / totalToRead) * 100;
        return Math.min(progress, 100);
    }



    return {
        hatims,
        loadAll,
        loadHatim,
        createHatim,
        updateHatim,
        deleteHatim,
        calculateStats,
        calculateReadingProgress,
        getPersonStartPage: hatimUtils.getPersonStartPage,
        exportExcel: exportService.excel,
        exportPdf: exportService.pdf,
        MAX_PAGES
    };
}
