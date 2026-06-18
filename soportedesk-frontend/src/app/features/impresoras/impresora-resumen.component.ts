import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Impresora } from './impresora.model';

interface ResumenRow {
  tipoLabel: string;
  modelo: string;
  cantidad: number;
}

const CONSUMIBLE_DEFS: { key: keyof Impresora; label: string }[] = [
  { key: 'modeloTonerNegro', label: 'Tóner Negro' },
  { key: 'modeloTonerC',     label: 'Tóner Cyan' },
  { key: 'modeloTonerM',     label: 'Tóner Magenta' },
  { key: 'modeloTonerY',     label: 'Tóner Amarillo' },
  { key: 'modeloCartucho',   label: 'Cartucho' },
  { key: 'modeloDrum',       label: 'Drum' },
  { key: 'modeloFusor',      label: 'Fusor' },
];

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
  collapsed = false;

  rows: ResumenRow[] = [];
  sedes: string[] = [];
  dependencias: string[] = [];

  ngOnChanges(): void {
    this.sedes = [...new Set(
      this.impresoras.map(i => i.sede?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.dependencias = [...new Set(
      this.impresoras.map(i => i.dependencia?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.calcularResumen();
  }

  onFilterChange(): void {
    this.calcularResumen();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }

  private calcularResumen(): void {
    const filtered = this.impresoras.filter(imp =>
      (!this.selectedSede || imp.sede?.nombre === this.selectedSede) &&
      (!this.selectedDependencia || imp.dependencia?.nombre === this.selectedDependencia)
    );

    const rows: ResumenRow[] = [];
    for (const { key, label } of CONSUMIBLE_DEFS) {
      const counts = new Map<string, number>();
      for (const imp of filtered) {
        const val = imp[key] as string | null | undefined;
        if (val) counts.set(val, (counts.get(val) ?? 0) + 1);
      }
      for (const [modelo, cantidad] of counts) {
        rows.push({ tipoLabel: label, modelo, cantidad });
      }
    }
    this.rows = rows;
  }
}
