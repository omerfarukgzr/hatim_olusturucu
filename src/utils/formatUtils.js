import { MAX_PAGES } from '../constants';

export const dateUtils = {
    formatToLocale(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    },

    formatDayName(date) {
        const days = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
        return days[date.getDay()];
    },

    getDatesInRange(startStr, endStr) {
        const dates = [];
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (isNaN(start) || isNaN(end) || start > end) return dates;
        const cur = new Date(start);
        while (cur <= end) {
            dates.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return dates;
    }
};

export const hatimUtils = {
    getPersonStartPage(participants, index) {
        let start = 1;
        for (let i = 0; i < index; i++) {
            start += (participants[i].pages || 0);
        }
        // Wrap around logic for MAX_PAGES pages
        return ((start - 1) % MAX_PAGES) + 1;
    },

    getDayRange(participants, personIndex, dayIndex) {
        const personStart = this.getPersonStartPage(participants, personIndex);
        const pages = participants[personIndex].pages;

        // Calculate raw start for the specific day
        // Note: personStart is already wrapped, but we need to calculate 
        // the offset correctly if we want continuous reading.
        // If we want person 2 to start where person 1 left off across days...
        // Actually, the current logic is: person starts at X, and each day they read 'pages' amount.

        let start = personStart + (dayIndex * pages);
        let end = start + pages - 1;

        return {
            start: ((start - 1) % MAX_PAGES) + 1,
            end: ((end - 1) % MAX_PAGES) + 1
        };
    }
};

