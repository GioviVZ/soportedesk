
import { Component, EventEmitter, Input, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Subdependencia } from '../../core/models/catalogo.model';
import { ActiveDirectoryService } from './active-directory.service';
import { AdPanelResult, AdUser, CorreoDisponible, UpdateUserInfoRequest } from './active-directory.model';

@Component({
    selector: 'app-ad-edit-info-panel',
    imports: [FormsModule, SectionCardComponent],
    template: `
    <form class="modal-form form-grid" (ngSubmit)="submit()" id="ad-edit-info-edit-form">
      <app-section-card title="Datos de AD" class="full">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
        </svg>
    
        @if (error) {
          <div class="notice error full">{{ error }}</div>
        }
    
        <div class="field"><label>Nombre mostrado</label><input name="displayName" [(ngModel)]="form.displayName" /></div>
        <div class="field"><label>Cargo</label><input name="title" [(ngModel)]="form.title" /></div>
        <div class="field">
          <label>Dependencia</label>
          <select name="dependenciaId" [(ngModel)]="dependenciaId" (ngModelChange)="onDependenciaChange($event)">
            <option [ngValue]="null">Seleccione...</option>
            @for (dependencia of dependencias; track dependencia) {
              <option [ngValue]="dependencia.id">{{ dependencia.nombre }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Subdependencia</label>
          <select name="subdependenciaId" [(ngModel)]="subdependenciaId" (ngModelChange)="onSubdependenciaChange($event)" [disabled]="!dependenciaId">
            <option [ngValue]="null">Usar dependencia seleccionada</option>
            @for (subdependencia of subdependencias; track subdependencia) {
              <option [ngValue]="subdependencia.id">{{ subdependencia.nombre }}</option>
            }
          </select>
        </div>
        <div class="field"><label>Telefono</label><input name="telephoneNumber" [(ngModel)]="form.telephoneNumber" /></div>
        <div class="field"><label>Celular</label><input name="mobile" [(ngModel)]="form.mobile" /></div>
        <div class="field">
          <label>Correo institucional</label>
          <input
            type="search"
            name="correoSearch"
            [(ngModel)]="correoSearch"
            (ngModelChange)="onCorreoSearch($event)"
            (focus)="correoPickerOpen = true"
            [disabled]="correosLoading"
            [placeholder]="correosLoading ? 'Cargando correos...' : 'Buscar email o nombre'"
            autocomplete="off"
            aria-label="Buscar correo institucional registrado"
            />
          @if (correoPickerOpen && correosFiltrados.length) {
            <div class="pick-list correo-pick-list">
              @for (correo of correosFiltrados; track correo) {
                <button type="button" (click)="selectCorreo(correo)">
                  <strong>{{ correo.email }}</strong>
                  <span>{{ correo.nombreCompleto || 'Sin nombre registrado' }} · {{ correo.estado || 'Sin estado' }}</span>
                </button>
              }
            </div>
          }
          @if (form.mail) {
            <div class="selected-dn selected-mail">
              <span>Vinculado con Correos: <strong>{{ form.mail }}</strong></span>
              <button type="button" class="clear-mail-button" (click)="clearCorreo()">Dejar sin correo</button>
            </div>
          }
          @if (!correosLoading && !correosError) {
            <small class="field-hint">Opcional. Puedes conservarlo, elegir uno disponible o dejar al usuario sin correo.</small>
          }
          @if (correosError) {
            <small class="field-hint error-text">{{ correosError }}</small>
          }
        </div>
        <div class="field full"><label>Descripcion</label><textarea name="description" rows="3" [(ngModel)]="form.description"></textarea></div>
      </app-section-card>
    
    </form>
    
    <footer modal-footer class="modal-actions full">
      <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancelar</button>
      <button type="submit" form="ad-edit-info-edit-form" class="btn btn-primary btn-edit-record" [disabled]="working || correosLoading">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
        Guardar cambios
      </button>
    </footer>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red.shared.scss'
})
export class AdEditInfoPanelComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private catalogoService = inject(CatalogoService);

  @Input({ required: true }) user!: AdUser;
  @Output() saved = new EventEmitter<AdPanelResult>();
  @Output() cancelled = new EventEmitter<void>();

  form: UpdateUserInfoRequest = {};
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  working = false;
  error = '';
  correosDisponibles: CorreoDisponible[] = [];
  correoSearch = '';
  correoPickerOpen = false;
  correosLoading = false;
  correosError = '';
  private originalMail: string | null = null;

  ngOnInit(): void {
    this.form = {
      displayName: this.user.displayName,
      title: this.user.title,
      department: this.user.department,
      office: this.user.office,
      telephoneNumber: this.user.telephoneNumber,
      mobile: this.user.mobile,
      mail: this.user.mail,
      description: this.user.description,
    };
    this.originalMail = this.blankToNull(this.user.mail);
    this.correoSearch = this.originalMail ?? '';
    this.loadCorreosDisponibles();
    this.catalogoService.getDependencias().subscribe({
      next: (items) => {
        this.dependencias = this.sortByName(items);
        this.syncCatalogSelectionFromInfo();
      },
      error: () => (this.dependencias = []),
    });
  }

  get correosFiltrados(): CorreoDisponible[] {
    const term = this.correoSearch.trim().toLocaleLowerCase('es-PE');
    const items = term
      ? this.correosDisponibles.filter((correo) =>
          correo.email.toLocaleLowerCase('es-PE').includes(term)
          || (correo.nombreCompleto ?? '').toLocaleLowerCase('es-PE').includes(term))
      : this.correosDisponibles;
    return items.slice(0, 12);
  }

  onCorreoSearch(value: string): void {
    this.correoSearch = value;
    this.form = { ...this.form, mail: null };
    this.correoPickerOpen = true;
  }

  selectCorreo(correo: CorreoDisponible): void {
    this.form = { ...this.form, mail: correo.email };
    this.correoSearch = correo.email;
    this.correoPickerOpen = false;
  }

  clearCorreo(): void {
    this.form = { ...this.form, mail: null };
    this.correoSearch = '';
    this.correoPickerOpen = false;
  }

  onDependenciaChange(value: number | null): void {
    this.dependenciaId = this.normalizeSelectId(value);
    this.subdependenciaId = null;
    this.subdependencias = [];
    const dependencia = this.findDependencia(this.dependenciaId);
    this.form = { ...this.form, department: dependencia?.nombre ?? null, office: dependencia?.nombre ?? null };
    if (this.dependenciaId) {
      this.catalogoService.getSubdependencias(this.dependenciaId).subscribe((items) => (this.subdependencias = this.sortByName(items)));
    }
  }

  onSubdependenciaChange(value: number | null): void {
    this.subdependenciaId = this.normalizeSelectId(value);
    const subdependencia = this.findSubdependencia(this.subdependenciaId);
    this.form = { ...this.form, office: subdependencia?.nombre || this.form.department || null };
  }

  submit(): void {
    this.error = '';
    const department = this.blankToNull(this.form.department);
    const office = this.blankToNull(this.form.office) ?? department;
    const request: UpdateUserInfoRequest = {
      displayName: this.blankToNull(this.form.displayName),
      title: this.blankToNull(this.form.title),
      department,
      office,
      telephoneNumber: this.blankToNull(this.form.telephoneNumber),
      mobile: this.blankToNull(this.form.mobile),
      mail: this.blankToNull(this.form.mail),
      clearMail: !this.blankToNull(this.form.mail),
      description: this.blankToNull(this.form.description),
    };
    if (request.mail && !this.isOriginalMail(request.mail)
        && !this.correosDisponibles.some((correo) => correo.email.toLocaleLowerCase('es-PE') === request.mail?.toLocaleLowerCase('es-PE'))) {
      this.error = 'Selecciona un correo de la lista sincronizada con el módulo Correos.';
      return;
    }
    this.working = true;
    this.adService.updateInfo(this.user.samAccountName, request).subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.saved.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: (err) => {
        this.working = false;
        this.error = err?.error?.message || 'No se pudo completar la acción.';
      },
    });
  }

  private loadCorreosDisponibles(): void {
    this.correosLoading = true;
    this.correosError = '';
    this.adService.getCorreosDisponibles(this.user.samAccountName).subscribe({
      next: (correos) => {
        this.correosDisponibles = [...correos].sort((a, b) => a.email.localeCompare(b.email, 'es'));
        this.correosLoading = false;
      },
      error: () => {
        this.correosDisponibles = [];
        this.correosLoading = false;
        this.correosError = 'No se pudieron cargar los correos institucionales.';
      },
    });
  }

  private isOriginalMail(mail: string): boolean {
    return !!this.originalMail && this.originalMail.toLocaleLowerCase('es-PE') === mail.toLocaleLowerCase('es-PE');
  }

  private syncCatalogSelectionFromInfo(): void {
    const dependencia = this.findDependenciaByName(this.form.department);
    this.dependenciaId = dependencia?.id ?? null;
    this.subdependenciaId = null;
    this.subdependencias = [];
    if (!dependencia) return;

    this.catalogoService.getSubdependencias(dependencia.id).subscribe((items) => {
      this.subdependencias = this.sortByName(items);
      const office = this.normalizeName(this.form.office);
      const department = this.normalizeName(this.form.department);
      this.subdependenciaId = office && office !== department
        ? (this.subdependencias.find((item) => this.normalizeName(item.nombre) === office)?.id ?? null)
        : null;
      if (!this.subdependenciaId && this.form.department) {
        this.form = { ...this.form, office: this.form.department };
      }
    });
  }

  private findDependencia(id: number | null): Dependencia | null {
    return id ? (this.dependencias.find((item) => item.id === id) ?? null) : null;
  }

  private findDependenciaByName(name: string | null | undefined): Dependencia | null {
    const normalized = this.normalizeName(name);
    return normalized ? (this.dependencias.find((item) => this.normalizeName(item.nombre) === normalized) ?? null) : null;
  }

  private findSubdependencia(id: number | null): Subdependencia | null {
    return id ? (this.subdependencias.find((item) => item.id === id) ?? null) : null;
  }

  private normalizeSelectId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeName(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private sortByName<T extends { nombre: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private blankToNull(value: string | null | undefined): string | null {
    return value?.trim() ? value.trim() : null;
  }
}
