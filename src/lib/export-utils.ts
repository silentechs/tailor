/**
 * Export Utilities for generating CSV and Excel files
 * These functions work on both server and client side
 */

type CellValue = string | number | null | undefined;

// Convert data to CSV format
export function generateCSV(headers: string[], rows: CellValue[][]): string {
    const headerRow = headers.join(',');
    const dataRows = rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
}

// Convert data to Excel XML format (simple XLSX alternative that works in Excel)
export function generateExcelXML(
    headers: string[],
    rows: CellValue[][],
    sheetName = 'Data'
): string {
    const escapeXML = (str: string) =>
        String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="Header">
    <Font ss:Bold="1"/>
    <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
    <NumberFormat ss:Format="#,##0.00"/>
  </Style>
</Styles>
<Worksheet ss:Name="${escapeXML(sheetName)}">
<Table>`;

    // Header row
    xml += '\n<Row ss:StyleID="Header">';
    for (const header of headers) {
        xml += `<Cell><Data ss:Type="String">${escapeXML(header)}</Data></Cell>`;
    }
    xml += '</Row>';

    // Data rows
    for (const row of rows) {
        xml += '\n<Row>';
        for (const cell of row) {
            const isNumber = typeof cell === 'number' || (!isNaN(Number(cell)) && cell !== '');
            if (isNumber) {
                xml += `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${cell}</Data></Cell>`;
            } else {
                xml += `<Cell><Data ss:Type="String">${escapeXML(String(cell))}</Data></Cell>`;
            }
        }
        xml += '</Row>';
    }

    xml += `
</Table>
</Worksheet>
</Workbook>`;

    return xml;
}

// Download a file with given content
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Export types
export type ExportFormat = 'csv' | 'xlsx';

// Export data in specified format
export function exportData(
    headers: string[],
    rows: (string | number)[][],
    filename: string,
    format: ExportFormat
): void {
    const date = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
        const csv = generateCSV(headers, rows);
        downloadFile(csv, `${filename}-${date}.csv`, 'text/csv;charset=utf-8;');
    } else if (format === 'xlsx') {
        const xml = generateExcelXML(headers, rows, filename);
        downloadFile(xml, `${filename}-${date}.xls`, 'application/vnd.ms-excel');
    }
}
