import { Injectable } from '@nestjs/common';

@Injectable()
export class CsvExportService {
  /**
   * Mengamankan sel CSV dari CSV / Spreadsheet Formula Injection (CWE-1236)
   * Karakter sensitif di awal nilai (=, +, -, @, tab, CR) akan diprefix tanda petik tunggal (')
   */
  public sanitizeCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    let str = String(value);

    // Deteksi karakter eksekusi formula spreadsheet
    const formulaPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (formulaPrefixes.some((prefix) => str.startsWith(prefix))) {
      str = `'${str}`;
    }

    // Escape tanda kutip ganda dan bungkus dengan kutip jika mengandung koma, newline, atau kutip
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  public toCsvString(headers: string[], rows: any[][]): string {
    const headerLine = headers.map((h) => this.sanitizeCellValue(h)).join(',');
    const dataLines = rows.map((row) =>
      row.map((cell) => this.sanitizeCellValue(cell)).join(','),
    );

    return [headerLine, ...dataLines].join('\r\n');
  }
}
