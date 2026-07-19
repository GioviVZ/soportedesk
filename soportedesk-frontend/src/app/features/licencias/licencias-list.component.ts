import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { FieldComponent } from '../../shared/field/field.component';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { LicenciaFormComponent } from './licencia-form.component';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';
import * as XLSX from 'xlsx';
import { RealtimeChange } from '../../core/services/realtime.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-licencias-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent, ModalComponent, FieldComponent, LicenciaFormComponent],
  templateUrl: './licencias-list.component.html',
  styleUrl: './licencias-list.component.scss',
})
export class LicenciasListComponent implements OnInit {
  private service = inject(LicenciaService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  licencias: Licencia[] = [];
  columns: TableColumn[] = [
    { key: 'tipoLicencia.nombre', label: 'Tipo' },
    { key: 'descripcion', label: 'Licencia' },
    { key: 'ordenCompra', label: 'Orden de Compra' },
    { key: 'anio', label: 'Año' },
  ];

  viewing: Licencia | null = null;
  editing: Licencia | null = null;
  formOpen = false;
  searchTerm = '';
  filters = {
    tipoLicencia: '',
    tipoBien: '',
    anio: '',
    ordenCompra: '',
  };

  get totalActivaciones(): number {
    return this.filteredLicencias.reduce((total, licencia) => total + this.activacionesOf(licencia).length, 0);
  }

  get totalUnidades(): number {
    return this.filteredLicencias.reduce((total, licencia) => total + (licencia.cantidad ?? 0), 0);
  }

  get canWrite(): boolean {
    return this.authService.canWrite('licencias');
  }

  get canManage(): boolean {
    return this.route.snapshot.data['mode'] === 'administracion' && this.canWrite;
  }

  ngOnInit(): void {
    this.load();
  }

  @HostListener('window:soportedesk:data-change', ['$event'])
  onRealtimeChange(event: CustomEvent<RealtimeChange>): void {
    if (event.detail.modulo === 'licencias') this.load();
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.licencias = data));
  }

  onSearch(term: string): void {
    this.searchTerm = term;
  }

  onView(licencia: Licencia): void {
    this.viewing = licencia;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(licencia: Licencia): void {
    this.editing = licencia;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(licencia: Licencia): void {
    if (!confirm(`Eliminar la licencia "${licencia.descripcion}"?`)) {
      return;
    }
    this.service.delete(licencia.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  get filteredLicencias(): Licencia[] {
    const search = this.normalize(this.searchTerm);
    const ordenCompra = this.normalize(this.filters.ordenCompra);

    return this.licencias.filter((licencia) => {
      const exactFilters =
        (!this.filters.tipoLicencia || licencia.tipoLicencia?.nombre === this.filters.tipoLicencia) &&
        (!this.filters.tipoBien || licencia.tipoBien?.nombre === this.filters.tipoBien) &&
        (!this.filters.anio || licencia.anio === this.filters.anio);

      if (!exactFilters) {
        return false;
      }

      if (ordenCompra && !this.normalize(licencia.ordenCompra).includes(ordenCompra)) {
        return false;
      }

      if (!search) {
        return true;
      }

      const activaciones = this.activacionesOf(licencia)
        .flatMap((item) => [item.cuentaActivacion, item.claveActivacion])
        .join(' ');

      return this.normalize([
        licencia.tipoLicencia?.nombre,
        licencia.tipoBien?.nombre,
        licencia.descripcion,
        licencia.ordenCompra,
        licencia.anio,
        String(licencia.cantidad ?? ''),
        licencia.serialActivacion,
        activaciones,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tiposLicencia(): string[] {
    return this.unique(this.licencias.map((licencia) => licencia.tipoLicencia?.nombre));
  }

  get tiposBien(): string[] {
    return this.unique(this.licencias
      .filter((licencia) => !this.filters.tipoLicencia || licencia.tipoLicencia?.nombre === this.filters.tipoLicencia)
      .map((licencia) => licencia.tipoBien?.nombre));
  }

  get anios(): string[] {
    return this.unique(this.licencias.map((licencia) => licencia.anio));
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm ||
      this.filters.tipoLicencia ||
      this.filters.tipoBien ||
      this.filters.anio ||
      this.filters.ordenCompra
    );
  }

  onTipoLicenciaFilterChange(): void {
    this.filters.tipoBien = '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      tipoLicencia: '',
      tipoBien: '',
      anio: '',
      ordenCompra: '',
    };
  }

  exportExcel(): void {
    const rows = this.filteredLicencias.map((licencia) => {
      const activaciones = this.activacionesOf(licencia);

      return {
        'Tipo de Licencia': licencia.tipoLicencia?.nombre ?? '',
        'Tipo de Bien': licencia.tipoBien?.nombre ?? '',
        Licencia: licencia.descripcion ?? '',
        'Orden de Compra': licencia.ordenCompra ?? '',
        Año: licencia.anio ?? '',
        Cantidad: licencia.cantidad ?? 0,
        'Cuentas de Activacion': activaciones.map((item) => item.cuentaActivacion).filter(Boolean).join('\n'),
        'Claves de Activacion': activaciones.map((item) => item.claveActivacion).filter(Boolean).join('\n'),
        'Serial de Activacion': licencia.serialActivacion ?? '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 22 },
      { wch: 38 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 34 },
      { wch: 34 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Licencias');
    XLSX.writeFile(workbook, `licencias-${this.exportDate()}.xlsx`);
  }

  activacionesOf(licencia: Licencia): { cuentaActivacion: string; claveActivacion: string }[] {
    if (licencia.activaciones?.length) {
      return licencia.activaciones;
    }
    if (licencia.cuentaActivacion || licencia.claveActivacion) {
      return [{
        cuentaActivacion: licencia.cuentaActivacion ?? '',
        claveActivacion: licencia.claveActivacion ?? '',
      }];
    }
    return [];
  }

  private unique(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
      .sort((a, b) => a.localeCompare(b));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private exportDate(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
