import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { EquipoKpis, EquipoResumen, EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';

type Tab = 'inventario' | 'salud';

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

  activeTab = signal<Tab>('inventario');
  items = signal<EquipoTableRow[]>([]);
  kpis = signal<EquipoKpis | null>(null);
  salud = signal<EquipoSaludItem[]>([]);
  sedes = signal<string[]>([]);
  tipos = signal<string[]>([]);
  dependencias = signal<string[]>([]);
  subdependencias = signal<string[]>([]);
  fabricantes = signal<string[]>([]);
  selectedSede = signal('');
  selectedTipo = signal('');
  selectedDependencia = signal('');
  selectedSubdependencia = signal('');
  selectedFabricante = signal('');
  searchTerm = signal('');

  saludKpis = computed(() => {
    const s = this.salud();
    const rojos = s.filter((x) => x.nivelAlerta === 'ROJO').length;
    const amarillos = s.filter((x) => x.nivelAlerta === 'AMARILLO').length;
    const sinPatrimonial = s.filter((x) => x.sinCodigoPatrimonial).length;
    const sinUsuario = s.filter((x) => x.sinUsuario).length;
    const sinSede = s.filter((x) => x.sinSede).length;
    return [
      { label: 'Críticos (Rojo)', value: rojos, tone: 'red' },
      { label: 'Advertencia (Amarillo)', value: amarillos, tone: 'yellow' },
      { label: 'Sin cód. patrimonial', value: sinPatrimonial, tone: 'orange' },
      { label: 'Sin usuario', value: sinUsuario, tone: 'gray' },
      { label: 'Sin sede', value: sinSede, tone: 'gray' },
    ];
  });

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
    this.loadDependencias();
    this.loadFabricantes();
    this.load();
    this.loadSalud();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  load(): void {
    this.service
      .getAll({
        search: this.searchTerm(),
        sede: this.selectedSede(),
        tipo: this.selectedTipo(),
        dependencia: this.selectedDependencia(),
        subdependencia: this.selectedSubdependencia(),
        fabricante: this.selectedFabricante(),
      })
      .subscribe((data) => this.items.set(data.map((item) => this.toTableRow(item))));
  }

  loadSalud(): void {
    this.service.getSalud().subscribe((data) => this.salud.set(data));
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.load();
  }

  onSedeChange(value: string): void {
    this.selectedSede.set(value);
    this.selectedDependencia.set('');
    this.selectedSubdependencia.set('');
    this.subdependencias.set([]);
    this.loadDependencias();
    this.load();
  }

  onTipoChange(value: string): void {
    this.selectedTipo.set(value);
    this.load();
  }

  onDependenciaChange(value: string): void {
    this.selectedDependencia.set(value);
    this.selectedSubdependencia.set('');
    this.loadSubdependencias();
    this.load();
  }

  onSubdependenciaChange(value: string): void {
    this.selectedSubdependencia.set(value);
    this.load();
  }

  onFabricanteChange(value: string): void {
    this.selectedFabricante.set(value);
    this.load();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSede.set('');
    this.selectedTipo.set('');
    this.selectedDependencia.set('');
    this.selectedSubdependencia.set('');
    this.selectedFabricante.set('');
    this.loadDependencias();
    this.subdependencias.set([]);
    this.load();
  }

  onView(item: EquipoTableRow): void {
    this.router.navigate(['/equipos', item.computerID]);
  }

  onViewSalud(item: EquipoSaludItem): void {
    this.router.navigate(['/equipos', item.computerID]);
  }

  mesesLabel(val: number): string {
    if (val < 0) return 'Sin dato';
    if (val === 0) return 'Este mes';
    return `${val} mes${val === 1 ? '' : 'es'}`;
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

  private loadDependencias(): void {
    this.service.getDependencias(this.selectedSede() || undefined)
      .subscribe((data) => this.dependencias.set(data));
  }

  private loadSubdependencias(): void {
    this.service.getSubdependencias(
      this.selectedSede() || undefined,
      this.selectedDependencia() || undefined
    ).subscribe((data) => this.subdependencias.set(data));
  }

  private loadFabricantes(): void {
    this.service.getFabricantes().subscribe((data) => this.fabricantes.set(data));
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
