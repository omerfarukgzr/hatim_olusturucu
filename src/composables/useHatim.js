import { ref, computed, onMounted } from 'vue';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Assign virtual file system for fonts
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MAX_PAGES = 604;
const hatims = ref([]);

export function useHatim() {

    // ── STORAGE (Supabase) ──
    async function loadAll() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('hatims')
                .select('*')
                .eq('user_id', user.id)
                .order('created', { ascending: false });

            if (error) throw error;
            hatims.value = data || [];
        } catch (e) {
            console.error('Veri yüklenemedi', e);
        }
    }

    async function loadHatim(id) {
        try {
            const { data, error } = await supabase
                .from('hatims')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Hatim yüklenemedi', e);
            return null;
        }
    }

    // ── CRUD (Supabase) ──
    async function createHatim(name) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum açmanız gerekiyor.');

            const newHatim = {
                name: name || 'Yeni Hatim',
                startDate: '',
                endDate: '',
                participants: [],
                created: new Date().toISOString(),
                user_id: user.id
            };

            const { data, error } = await supabase
                .from('hatims')
                .insert([newHatim])
                .select()
                .single();

            if (error) throw error;
            hatims.value.unshift(data);
            return data.id;
        } catch (e) {
            console.error('Hatim oluşturulamadı', e);
            return null;
        }
    }

    async function updateHatim(id, updates) {
        try {
            const { error } = await supabase
                .from('hatims')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Local update
            const idx = hatims.value.findIndex(h => h.id === id);
            if (idx !== -1) {
                hatims.value[idx] = { ...hatims.value[idx], ...updates };
            }
        } catch (e) {
            console.error('Hatim güncellenemedi', e);
        }
    }

    async function deleteHatim(id) {
        try {
            const { error } = await supabase
                .from('hatims')
                .delete()
                .eq('id', id);

            if (error) throw error;
            hatims.value = hatims.value.filter(h => h.id !== id);
        } catch (e) {
            console.error('Hatim silinemedi', e);
        }
    }

    function getHatim(id) {
        return computed(() => hatims.value.find(h => h.id === id));
    }

    function getHatim(id) {
        return computed(() => hatims.value.find(h => h.id === id));
    }

    // ── CALCULATIONS ──
    function calculateStats(participants) {
        const total = (participants || []).reduce((s, p) => s + (parseInt(p.pages) || 0), 0);
        const remaining = MAX_PAGES - total;
        const percentage = (total / MAX_PAGES) * 100;
        return { total, remaining, percentage };
    }

    function getPersonStartPage(participants, index) {
        let start = 1;
        for (let i = 0; i < index; i++) {
            start += (participants[i].pages || 0);
        }
        return start;
    }

    // ── HELPER FUNCTIONS ──
    function getDatesInRange(startStr, endStr) {
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

    function formatDate(d) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function formatDayName(d) {
        const days = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
        return days[d.getDay()];
    }

    function getDayRange(participants, personIndex, dayIndex) {
        const personStart = getPersonStartPage(participants, personIndex);
        const pages = participants[personIndex].pages;
        const start = personStart + dayIndex * pages;
        const end = start + pages - 1;
        return { start, end };
    }

    // ── EXCEL EXPORT ──
    async function exportExcel(hatim) {
        if (!hatim.participants || hatim.participants.length === 0) throw new Error('Önce katılımcı ekleyin.');
        if (!hatim.startDate || !hatim.endDate) throw new Error('Lütfen tarih aralığı seçin.');

        const dates = getDatesInRange(hatim.startDate, hatim.endDate);
        if (dates.length === 0) throw new Error('Geçerli bir tarih aralığı seçin.');
        if (dates.length > 365) throw new Error('Tarih aralığı çok uzun.');

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Hatim Listesi');

        // Headers
        const headerRow1 = ['#', 'İSİM SOYİSİM', 'SAYFA SAYISI'];
        dates.forEach(d => headerRow1.push(formatDate(d)));

        const headerRow2 = ['', '', ''];
        dates.forEach(d => headerRow2.push(formatDayName(d)));

        ws.addRow(headerRow1);
        ws.addRow(headerRow2);

        // Merge
        ws.mergeCells('A1:A2');
        ws.mergeCells('B1:B2');
        ws.mergeCells('C1:C2');

        // Data
        hatim.participants.forEach((p, i) => {
            const row = [i + 1, p.fullName, p.pages];
            dates.forEach((_, dayIndex) => {
                const { start, end } = getDayRange(hatim.participants, i, dayIndex);
                row.push(`${start}-${end}`);
            });
            ws.addRow(row);
        });

        // Styling
        ws.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { name: 'Calibri', size: 10 };
                if (rowNumber <= 2) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
                    cell.font = { name: 'Calibri', size: 11, bold: true };
                }
            });
        });

        ws.getColumn(1).width = 5;
        ws.getColumn(2).width = 30;
        ws.getColumn(3).width = 15;
        for (let c = 4; c <= 3 + dates.length; c++) ws.getColumn(c).width = 14;

        ws.getRow(1).height = 25;
        ws.getRow(2).height = 25;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(hatim.name || 'Hatim').replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // ── PDF EXPORT (Excel Mimic - Compact Single Page) ──
    function exportPdf(hatim) {
        if (!hatim.participants || hatim.participants.length === 0) throw new Error('Önce katılımcı ekleyin.');
        if (!hatim.startDate || !hatim.endDate) throw new Error('Tarih seçilmedi.');

        const dates = getDatesInRange(hatim.startDate, hatim.endDate);

        // Exact Width Calculation - Compact Mode
        // Scale: 7pt font
        const colNumWidth = 15;
        const colNameWidth = 90;
        const colPageWidth = 30;
        const colDateWidth = 55; // Enough for dd.mm.yyyy at 7pt

        // Toplam tablo genişliği: Sabit sütunlar + (Gün sayısı * Gün sütun genişliği)
        const tableWidth = colNumWidth + colNameWidth + colPageWidth + (dates.length * colDateWidth);

        // Kenar Boşlukları (Tolerans)
        const sideMargin = 40; // Sol ve Sağ boşluk
        const totalTolerance = sideMargin * 2;

        // Exact Page Width
        // İçerik + Tolerans A4 Landscape'den (842) büyükse genişlet, değilse A4 kullan
        const pageW = Math.max(2000, tableWidth + totalTolerance);

        // Page Height Calculation (Force Single Page)
        // 2 header rows + data rows + doc header + footer gap
        const lineHeight = 14; // Approx height per row at 7pt
        const headerHeight = 35;
        const docHeaderHeight = 40;
        const totalContentHeight = docHeaderHeight + headerHeight + (hatim.participants.length * lineHeight) + 100; // buffer

        const pageH = Math.max(595, totalContentHeight); // Min A4 Height

        // Headers
        const headerRow1 = [
            { text: '#', rowSpan: 2, style: 'th', fillColor: '#d9d9d9', alignment: 'center', margin: [0, 4, 0, 0] },
            { text: 'İSİM SOYİSİM', rowSpan: 2, style: 'th', fillColor: '#d9d9d9', alignment: 'center', margin: [0, 4, 0, 0] },
            { text: 'SAYFA', rowSpan: 2, style: 'th', fillColor: '#d9d9d9', alignment: 'center', margin: [0, 4, 0, 0] }
        ];
        dates.forEach(d => {
            headerRow1.push({ text: formatDate(d), style: 'th', fillColor: '#d9d9d9', alignment: 'center', fontSize: 7 });
        });

        const headerRow2 = [{}, {}, {}];
        dates.forEach(d => {
            headerRow2.push({ text: formatDayName(d), style: 'th', fillColor: '#d9d9d9', alignment: 'center', fontSize: 6 });
        });

        const body = [headerRow1, headerRow2];

        // Data
        hatim.participants.forEach((p, i) => {
            let row = [
                { text: (i + 1).toString(), alignment: 'center', fontSize: 7 },
                { text: p.fullName, fontSize: 7 },
                { text: p.pages.toString(), alignment: 'center', fontSize: 7 }
            ];

            dates.forEach((_, dayIndex) => {
                const { start, end } = getDayRange(hatim.participants, i, dayIndex);
                row.push({ text: `${start}-${end}`, alignment: 'center', fontSize: 7 });
            });

            body.push(row);
        });

        const widths = [colNumWidth, colNameWidth, colPageWidth];
        for (let i = 0; i < dates.length; i++) widths.push(colDateWidth);

        const docDefinition = {
            pageSize: { width: pageW, height: pageH },
            pageMargins: [sideMargin, 10, sideMargin, 10],
            content: [
                { text: hatim.name || 'Hatim Çizelgesi', style: 'docHeader', alignment: 'center', margin: [0, 0, 0, 10] },
                {
                    table: {
                        headerRows: 2,
                        widths: widths,
                        body: body,
                        dontBreakRows: true, // Keep together
                        keepWithHeaderRows: 1 // Keep header with first row
                    },
                    layout: {
                        hLineWidth: function (i, node) { return 0.5; },
                        vLineWidth: function (i, node) { return 0.5; },
                        hLineColor: function (i, node) { return 'black'; },
                        vLineColor: function (i, node) { return 'black'; },
                        paddingLeft: function (i, node) { return 2; },
                        paddingRight: function (i, node) { return 2; },
                        paddingTop: function (i, node) { return 2; },
                        paddingBottom: function (i, node) { return 2; }
                    }
                }
            ],
            styles: {
                docHeader: { fontSize: 14, bold: true }, // Smaller header
                th: { bold: true, fontSize: 7, color: 'black' }
            },
            defaultStyle: { font: 'Roboto', fontSize: 7 }
        };

        pdfMake.createPdf(docDefinition).download(`${(hatim.name || 'Hatim').replace(/[\\/:*?"<>|]/g, '_')}.pdf`);
    }

    return {
        hatims,
        createHatim,
        deleteHatim,
        getHatim,
        calculateStats,
        getPersonStartPage,
        exportExcel,
        exportPdf,
        MAX_PAGES
    };
}
