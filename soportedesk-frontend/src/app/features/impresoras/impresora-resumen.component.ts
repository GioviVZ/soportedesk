import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Impresora } from './impresora.model';
import * as XLSX from 'xlsx';

interface ResumenRow {
  tipoLabel: string;
  modelo: string;
  cantidad: number;
}

@Component({
  selector: 'app-impresora-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impresora-resumen.component.html',
  styleUrl: './impresora-resumen.component.scss',
})
export class ImpresoraResumenComponent implements OnChanges {
  @Input() impresoras: Impresora[] = [];

  selectedSede = '';
  selectedDependencia = '';
  selectedSubdependencia = '';
  selectedMarca = '';
  selectedModelo = '';
  collapsed = false;

  rows: ResumenRow[] = [];
  sedes: string[] = [];
  dependencias: string[] = [];
  subdependencias: string[] = [];
  marcas: string[] = [];
  modelos: string[] = [];

  ngOnChanges(): void {
    this.sedes = [...new Set(
      this.impresoras.map(i => i.sede?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.dependencias = [...new Set(
      this.impresoras.map(i => i.dependencia?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.updateSubdependencias();
    this.marcas = [...new Set(
      this.impresoras.map(i => i.modeloImpresora?.marca?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.updateModelos();
    this.calcularResumen();
  }

  onFilterChange(): void {
    this.calcularResumen();
  }

  onDependenciaChange(): void {
    this.selectedSubdependencia = '';
    this.updateSubdependencias();
    this.calcularResumen();
  }

  onMarcaChange(): void {
    this.selectedModelo = '';
    this.updateModelos();
    this.calcularResumen();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }

  exportExcel(event: MouseEvent): void {
    event.stopPropagation();
    if (this.rows.length === 0) return;

    const rows = this.buildExportRows();

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 22 },
      { wch: 12 },
      { wch: 18 },
      { wch: 30 },
      { wch: 30 },
      { wch: 18 },
      { wch: 26 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consumibles');
    XLSX.writeFile(workbook, `resumen-consumibles-${this.exportDate()}.xlsx`);
  }

  private calcularResumen(): void {
    const filtered = this.filteredImpresoras();

    const counts = new Map<string, ResumenRow>();
    for (const imp of filtered) {
      for (const toner of imp.modeloImpresora?.toners ?? []) {
        const key = `${toner.color}|${toner.variante}|${toner.codigo}`;
        const entry = counts.get(key);
        if (entry) {
          entry.cantidad += 1;
        } else {
          counts.set(key, {
            tipoLabel: `Tóner ${toner.color} — ${toner.variante}`,
            modelo: toner.codigo,
            cantidad: 1,
          });
        }
      }
    }
    this.rows = Array.from(counts.values());
  }

  private buildExportRows(): Array<Record<string, string | number>> {
    const counts = new Map<string, Record<string, string | number>>();

    for (const imp of this.filteredImpresoras()) {
      for (const toner of imp.modeloImpresora?.toners ?? []) {
        const row = {
          Consumible: `Toner ${toner.color} - ${toner.variante}`,
          Modelo: toner.codigo,
          Sede: imp.sede?.nombre ?? 'Sin sede',
          Dependencia: imp.dependencia?.nombre ?? 'Sin dependencia',
          Subdependencia: imp.subdependencia?.nombre ?? 'Sin subdependencia',
          Marca: imp.modeloImpresora?.marca?.nombre ?? 'Sin marca',
          'Modelo de impresora': imp.modeloImpresora?.nombre ?? 'Sin modelo',
          Impresoras: 0,
        };
        const key = [
          row.Consumible,
          row.Modelo,
          row.Sede,
          row.Dependencia,
          row.Subdependencia,
          row.Marca,
          row['Modelo de impresora'],
        ].join('|');
        const entry = counts.get(key) ?? row;
        entry['Impresoras'] = Number(entry['Impresoras']) + 1;
        counts.set(key, entry);
      }
    }

    return Array.from(counts.values()).sort((a, b) =>
      String(a['Consumible']).localeCompare(String(b['Consumible'])) ||
      String(a['Sede']).localeCompare(String(b['Sede'])) ||
      String(a['Dependencia']).localeCompare(String(b['Dependencia'])) ||
      String(a['Marca']).localeCompare(String(b['Marca'])) ||
      String(a['Modelo de impresora']).localeCompare(String(b['Modelo de impresora'])),
    );
  }

  private filteredImpresoras(): Impresora[] {
    return this.impresoras.filter(imp =>
      (!this.selectedSede || imp.sede?.nombre === this.selectedSede) &&
      (!this.selectedDependencia || imp.dependencia?.nombre === this.selectedDependencia) &&
      (!this.selectedSubdependencia || imp.subdependencia?.nombre === this.selectedSubdependencia) &&
      (!this.selectedMarca || imp.modeloImpresora?.marca?.nombre === this.selectedMarca) &&
      (!this.selectedModelo || imp.modeloImpresora?.nombre === this.selectedModelo)
    );
  }

  private updateSubdependencias(): void {
    this.subdependencias = [...new Set(
      this.impresoras
        .filter(i => !this.selectedDependencia || i.dependencia?.nombre === this.selectedDependencia)
        .map(i => i.subdependencia?.nombre)
        .filter((n): n is string => !!n)
    )].sort();
  }

  private updateModelos(): void {
    this.modelos = [...new Set(
      this.impresoras
        .filter(i => !this.selectedMarca || i.modeloImpresora?.marca?.nombre === this.selectedMarca)
        .map(i => i.modeloImpresora?.nombre)
        .filter((n): n is string => !!n)
    )].sort();
  }

  private exportDate(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
