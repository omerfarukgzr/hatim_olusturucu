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
        if (!hatim.start_date || !hatim.end_date) throw new Error('Lütfen tarih aralığı seçin.');

        const dates = dateUtils.getDatesInRange(hatim.start_date, hatim.end_date);
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

        // Add footer note
        ws.addRow(['']);
        const noteRow = ws.addRow(['NOT: 600. sayfaya gelenlerin son 4 sayfayı da okuması gerekmektedir.']);
        ws.mergeCells(`A${noteRow.number}:C${noteRow.number}`);
        noteRow.font = { bold: true, color: { argb: 'FF0000' } };

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
        const dates = dateUtils.getDatesInRange(hatim.start_date, hatim.end_date);

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
                    table: { headerRows: 2, body: body },
                    layout: 'lightHorizontalLines'
                },
                { text: 'NOT: 600. sayfaya gelenlerin son 4 sayfayı da okuması gerekmektedir.', fontSize: 10, bold: true, color: 'red', margin: [0, 10, 0, 0] }
            ],
            defaultStyle: { font: 'Roboto', fontSize: 7 }
        };

        pdfMake.createPdf(docDefinition).download(`${hatim.name.replace(/\s+/g, '_')}.pdf`);
    },

    personalPdf(hatim, participant, index) {
        if (!hatim || !participant) throw new Error('Veri eksik.');
        const dates = dateUtils.getDatesInRange(hatim.start_date, hatim.end_date);

        const body = [
            [
                { text: 'GÜN / TARİH', fillColor: '#f3f4f6', alignment: 'center', bold: true },
                { text: 'OKUNACAK SAYFALAR', fillColor: '#f3f4f6', alignment: 'center', bold: true }
            ]
        ];

        let has600 = false;
        dates.forEach((date, dIdx) => {
            const { start, end } = hatimUtils.getDayRange(hatim.participants, index, dIdx);
            if (start === 600 || end === 600) has600 = true;

            body.push([
                {
                    stack: [
                        { text: dateUtils.formatDayName(date), fontSize: 10, bold: true },
                        { text: dateUtils.formatToLocale(date), fontSize: 8, color: '#6b7280' }
                    ],
                    margin: [0, 5, 0, 5]
                },
                {
                    text: `${start} - ${end}`,
                    alignment: 'center',
                    fontSize: 14,
                    bold: true,
                    color: '#2d5a27',
                    margin: [0, 8, 0, 0]
                }
            ]);
        });

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 40],
            content: [
                { text: 'KİŞİSEL HATİM ÇİZELGESİ', fontSize: 10, color: '#2d5a27', bold: true, alignment: 'center' },
                { text: participant.fullName, fontSize: 24, bold: true, alignment: 'center', margin: [0, 5, 0, 2] },
                { text: hatim.name, fontSize: 14, alignment: 'center', color: '#6b7280', margin: [0, 0, 0, 20] },

                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*'],
                        body: body
                    },
                    layout: {
                        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 2 : 1,
                        vLineWidth: () => 0,
                        hLineColor: (i) => (i === 0 || i === 1) ? '#2d5a27' : '#e5e7eb',
                        paddingTop: () => 8,
                        paddingBottom: () => 8
                    }
                },

                has600 ? {
                    text: 'NOT: 600. sayfaya geldiğiniz için hatim sonundaki 4 sayfayı (kısa sureler) da okumanız gerekmektedir.',
                    fontSize: 10,
                    bold: true,
                    color: 'red',
                    margin: [0, 20, 0, 0],
                    alignment: 'center'
                } : null
            ],
            defaultStyle: { font: 'Roboto' }
        };

        pdfMake.createPdf(docDefinition).download(`${participant.fullName.replace(/\s+/g, '_')}_Hatim.pdf`);
    }
};
