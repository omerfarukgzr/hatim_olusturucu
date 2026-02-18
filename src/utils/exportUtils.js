import ExcelJS from 'exceljs';
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { dateUtils, hatimUtils } from './formatUtils';

// Initialize PDF Fonts
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
}

export const exportService = {
    async excel(hatim) {
        if (!hatim.participants?.length) throw new Error('Önce katılımcı ekleyin.');
        if (!hatim.startDate || !hatim.endDate) throw new Error('Lütfen tarih aralığı seçin.');

        const dates = dateUtils.getDatesInRange(hatim.startDate, hatim.endDate);
        if (dates.length === 0) throw new Error('Geçerli bir tarih aralığı seçin.');

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Hatim Listesi');

        const headerRow1 = ['#', 'İSİM SOYİSİM', 'SAYFA SAYISI'];
        dates.forEach(d => headerRow1.push(dateUtils.formatToLocale(d)));
        const headerRow2 = ['', '', ''];
        dates.forEach(d => headerRow2.push(dateUtils.formatDayName(d)));

        ws.addRow(headerRow1);
        ws.addRow(headerRow2);
        ws.mergeCells('A1:A2');
        ws.mergeCells('B1:B2');
        ws.mergeCells('C1:C2');

        hatim.participants.forEach((p, i) => {
            const row = [i + 1, p.fullName, p.pages];
            dates.forEach((_, dayIndex) => {
                const { start, end } = hatimUtils.getDayRange(hatim.participants, i, dayIndex);
                row.push(`${start}-${end}`);
            });
            ws.addRow(row);
        });

        // Styling (simplified for brevity, keep existing logic if needed)
        ws.eachRow(row => {
            row.eachCell(cell => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${hatim.name.replace(/\s+/g, '_')}.xlsx`;
        a.click();
    },

    pdf(hatim) {
        if (!hatim.participants?.length) throw new Error('Önce katılımcı ekleyin.');
        const dates = dateUtils.getDatesInRange(hatim.startDate, hatim.endDate);

        const colNumWidth = 15;
        const colNameWidth = 90;
        const colPageWidth = 30;
        const colDateWidth = 55;
        const tableWidth = colNumWidth + colNameWidth + colPageWidth + (dates.length * colDateWidth);
        const pageW = Math.max(2000, tableWidth + 80);
        const pageH = Math.max(595, hatim.participants.length * 15 + 200);

        const body = [
            [
                { text: '#', rowSpan: 2, fillColor: '#d9d9d9', alignment: 'center' },
                { text: 'İSİM SOYİSİM', rowSpan: 2, fillColor: '#d9d9d9', alignment: 'center' },
                { text: 'SAYFA', rowSpan: 2, fillColor: '#d9d9d9', alignment: 'center' },
                ...dates.map(d => ({ text: dateUtils.formatToLocale(d), fillColor: '#d9d9d9', alignment: 'center', fontSize: 7 }))
            ],
            [
                {}, {}, {},
                ...dates.map(d => ({ text: dateUtils.formatDayName(d), fillColor: '#d9d9d9', alignment: 'center', fontSize: 6 }))
            ]
        ];

        hatim.participants.forEach((p, i) => {
            body.push([
                { text: (i + 1).toString(), alignment: 'center', fontSize: 7 },
                { text: p.fullName, fontSize: 7 },
                { text: p.pages.toString(), alignment: 'center', fontSize: 7 },
                ...dates.map((_, dayIdx) => {
                    const { start, end } = hatimUtils.getDayRange(hatim.participants, i, dayIdx);
                    return { text: `${start}-${end}`, alignment: 'center', fontSize: 7 };
                })
            ]);
        });

        const docDefinition = {
            pageSize: { width: pageW, height: pageH },
            content: [
                { text: hatim.name, fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                {
                    table: { headerRows: 2, body },
                    layout: 'lightHorizontalLines'
                }
            ],
            defaultStyle: { font: 'Roboto', fontSize: 7 }
        };

        pdfMake.createPdf(docDefinition).download(`${hatim.name.replace(/\s+/g, '_')}.pdf`);
    }
};
