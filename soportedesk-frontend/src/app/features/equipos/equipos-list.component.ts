import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { EquipoKpis, EquipoResumen } from './equipo.model';
import { EquipoService } from './equipo.service';

interface EquipoTableRow extends EquipoResumen {
  usuarioLimpio: string;
  fabricanteModelo: string;
  cpuCorto: string;
  ramLabel: string;
  diskLabel: string;
}

@Component({
  selector: 'app-equipos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent],
  templateUrl: './equipos-list.component.html',
  styleUrl: './equipos-list.component.scss',
})
export class EquiposListComponent implements OnInit {
  private service = inject(EquipoService);
  private router = inject(Router);

  items = signal<EquipoTableRow[]>([]);
  kpis = signal<EquipoKpis | null>(null);
  sedes = signal<string[]>([]);
  tipos = signal<string[]>([]);
  selectedSede = signal('');
  selectedTipo = signal('');
  searchTerm = signal('');

  kpiCards = computed(() => {
    const k = this.kpis();
    return [
      { label: 'Total Activos', value: k?.totalActivos ?? 0, tone: 'blue' },
      { label: 'Desktop', value: k?.desktopCount ?? 0, tone: 'indigo' },
      { label: 'Laptop', value: k?.laptopCount ?? 0, tone: 'violet' },
      { label: 'Otros', value: k?.otrosCount ?? 0, tone: 'gray' },
      { label: 'Sede Central', value: k?.sedeCentralCount ?? 0, tone: 'green' },
      { label: 'EEAs', value: k?.eeasCount ?? 0, tone: 'orange' },
    ];
  });

  columns: TableColumn[] = [
    { key: 'nombreEquipo', label: 'Equipo' },
    { key: 'usuarioLimpio', label: 'Usuario' },
    { key: 'sedeNombre', label: 'Sede' },
    { key: 'oficinaId', label: 'Dependencia' },
    { key: 'tipoEquipo', label: 'Tipo' },
    { key: 'fabricanteModelo', label: 'Fabricante / Modelo' },
    { key: 'cpuCorto', label: 'CPU' },
    { key: 'ramLabel', label: 'RAM' },
    { key: 'diskLabel', label: 'Disco' },
    { key: 'ipEquipo', label: 'IP' },
  ];

  ngOnInit(): void {
    this.loadKpis();
    this.loadSedes();
    this.loadTipos();
    this.load();
  }

  load(): void {
    this.service
      .getAll({
        search: this.searchTerm(),
        sede: this.selectedSede(),
        tipo: this.selectedTipo(),
      })
      .subscribe((data) => this.items.set(data.map((item) => this.toTableRow(item))));
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.load();
  }

  onSedeChange(value: string): void {
    this.selectedSede.set(value);
    this.load();
  }

  onTipoChange(value: string): void {
    this.selectedTipo.set(value);
    this.load();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSede.set('');
    this.selectedTipo.set('');
    this.load();
  }

  onView(item: EquipoTableRow): void {
    this.router.navigate(['/equipos', item.computerID]);
  }

  private loadKpis(): void {
    this.service.getKpis().subscribe((data) => this.kpis.set(data));
  }

  private loadSedes(): void {
    this.service.getSedes().subscribe((data) => this.sedes.set(data));
  }

  private loadTipos(): void {
    this.service.getTipos().subscribe((data) => this.tipos.set(data));
  }

  private toTableRow(item: EquipoResumen): EquipoTableRow {
    return {
      ...item,
      usuarioLimpio: this.stripDomain(item.usuarioContacto),
      fabricanteModelo: [item.fabricanteEquipo, item.modeloEquipo].filter(Boolean).join(' '),
      cpuCorto: this.truncate(item.cpuModelos, 30),
      ramLabel: this.gbLabel(item.ramTotalGb),
      diskLabel: this.gbLabel(item.diskTotalGb),
    };
  }

  private stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  private truncate(value: string | null | undefined, max: number): string {
    const text = value ?? '';
    return text.length > max ? `${text.slice(0, max - 1)}...` : text;
  }

  private gbLabel(value: number | null | undefined): string {
    return value == null ? '' : `${value} GB`;
  }
}
