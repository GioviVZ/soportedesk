import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Impresora } from './impresora.model';

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

  private calcularResumen(): void {
    const filtered = this.impresoras.filter(imp =>
      (!this.selectedSede || imp.sede?.nombre === this.selectedSede) &&
      (!this.selectedDependencia || imp.dependencia?.nombre === this.selectedDependencia) &&
      (!this.selectedSubdependencia || imp.subdependencia?.nombre === this.selectedSubdependencia) &&
      (!this.selectedMarca || imp.modeloImpresora?.marca?.nombre === this.selectedMarca) &&
      (!this.selectedModelo || imp.modeloImpresora?.nombre === this.selectedModelo)
    );

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
}
