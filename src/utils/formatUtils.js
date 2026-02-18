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
        return start;
    },

    getDayRange(participants, personIndex, dayIndex) {
        const personStart = this.getPersonStartPage(participants, personIndex);
        const pages = participants[personIndex].pages;
        const start = personStart + dayIndex * pages;
        const end = start + pages - 1;
        return { start, end };
    }
};
