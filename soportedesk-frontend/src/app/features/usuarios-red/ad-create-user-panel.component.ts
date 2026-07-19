
import { Component, EventEmitter, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryOu, AdPanelResult, CorreoDisponible, CreateAdUserRequest } from './active-directory.model';
import { UsuarioRedContratoRequest, esTipoContratoOs } from './usuario-red-contrato.model';
import { UsuarioRedContratoService } from './usuario-red-contrato.service';

@Component({
    selector: 'app-ad-create-user-panel',
    imports: [FormsModule, SectionCardComponent],
    template: `
    <form class="modal-form" (ngSubmit)="submit()" id="ad-create-user-edit-form">
      @if (error) {
        <div class="notice error">{{ error }}</div>
      }
    
      <app-section-card title="Cuenta">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <div class="form-grid">
          <div class="field">
            <label>Usuario</label>
            <input name="samAccountName" [(ngModel)]="form.samAccountName" (ngModelChange)="onSamChanged($event)" required minlength="2" pattern="[A-Za-z0-9._-]+" />
          </div>
          <div class="field">
            <label>Contraseña temporal</label>
            <input type="password" name="temporaryPassword" [(ngModel)]="form.temporaryPassword" minlength="8" required />
          </div>
          <div class="field">
            <label>Nombres</label>
            <input name="givenName" [(ngModel)]="form.givenName" required />
          </div>
          <div class="field">
            <label>Apellidos</label>
            <input name="surname" [(ngModel)]="form.surname" required />
          </div>
          <div class="field">
            <label>Nombre mostrado</label>
            <input name="displayName" [(ngModel)]="form.displayName" />
          </div>
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
              <small class="field-hint">Opcional. Solo se muestran correos que todavía no están vinculados a otro usuario de red.</small>
            }
            @if (correosError) {
              <small class="field-hint error-text">{{ correosError }}</small>
            }
          </div>
          <div class="field">
            <label>UPN</label>
            <input name="userPrincipalName" [(ngModel)]="form.userPrincipalName" (ngModelChange)="onUpnChanged($event)" placeholder="usuario@inia.local" />
          </div>
          <div class="field">
            <label>Cargo</label>
            <input name="title" [(ngModel)]="form.title" />
          </div>
          <label class="checkbox-field">
            <input type="checkbox" name="enabled" [(ngModel)]="form.enabled" />
            Habilitar cuenta al crearla
          </label>
          <label class="checkbox-field">
            <input type="checkbox" name="forceChange" [(ngModel)]="form.forceChange" />
            Exigir cambio al iniciar sesión
          </label>
        </div>
      </app-section-card>
    
      <app-section-card title="Ubicación">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" /><circle cx="12" cy="10" r="2" />
        </svg>
        <div class="form-grid">
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
          <div class="field">
            <label>Telefono</label>
            <input name="telephoneNumber" [(ngModel)]="form.telephoneNumber" />
          </div>
          <div class="field">
            <label>Celular</label>
            <input name="mobile" [(ngModel)]="form.mobile" />
          </div>
          <div class="field full">
            <label>Unidad organizativa destino</label>
            <div class="inline-search">
              <input name="ouSearch" [(ngModel)]="ouSearch" placeholder="Buscar OU" (keyup.enter)="searchOus()" />
              <button type="button" class="btn btn-ghost" (click)="searchOus()">Buscar</button>
            </div>
            @if (form.ouDestinoDn) {
              <div class="selected-dn">{{ form.ouDestinoDn }}</div>
            }
            @if (ouResults.length) {
              <div class="pick-list">
                @for (ou of ouResults; track ou) {
                  <button type="button" (click)="selectOu(ou)">
                    <strong>{{ ou.name }}</strong>
                    <span>{{ ou.dn }}</span>
                  </button>
                }
              </div>
            }
          </div>
          <div class="field full">
            <label>Descripcion</label>
            <textarea name="description" rows="2" [(ngModel)]="form.description"></textarea>
          </div>
        </div>
      </app-section-card>
    
      <app-section-card title="Contrato">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
          <path d="M9 13h6" /><path d="M9 17h6" />
        </svg>
        <label class="checkbox-field contract-toggle">
          <input type="checkbox" name="contratoEnabled" [(ngModel)]="contratoEnabled" (ngModelChange)="onContratoToggle($event)" />
          Registrar contrato al crear el usuario
        </label>
    
        @if (contratoEnabled) {
          <div class="contract-inline-grid">
            <div class="field">
              <label>Tipo de contrato</label>
              <select name="tipoContratoId" [(ngModel)]="contratoForm.tipoContratoId" required>
                <option [ngValue]="null" disabled>Selecciona...</option>
                @for (tipo of tiposContrato; track tipo) {
                  <option [ngValue]="tipo.id">{{ tipo.nombre }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Nro. de contrato</label>
              <input name="numeroContrato" [(ngModel)]="contratoForm.numeroContrato" />
            </div>
            <div class="field">
              <label>Fecha inicio</label>
              <input type="date" name="fechaInicio" [(ngModel)]="contratoForm.fechaInicio" required />
            </div>
            <div class="field">
              <label>Fecha fin</label>
              <input type="date" name="fechaFin" [(ngModel)]="contratoForm.fechaFin" />
            </div>
            @if (esContratoOs()) {
              <div class="field">
                <label>Nombre del personal</label>
                <input name="personalNombre" [(ngModel)]="contratoForm.personalNombre" />
              </div>
              <div class="field">
                <label>Apellidos del personal</label>
                <input name="personalApellidos" [(ngModel)]="contratoForm.personalApellidos" />
              </div>
            }
          </div>
        }
      </app-section-card>
    
    </form>
    
    <footer modal-footer class="modal-actions">
      <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancelar</button>
      <button type="submit" form="ad-create-user-edit-form" class="btn btn-primary" [disabled]="working || correosLoading">{{ contratoEnabled ? 'Crear en AD y registrar contrato' : 'Crear en AD' }}</button>
    </footer>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red.shared.scss'
})
export class AdCreateUserPanelComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private contratoService = inject(UsuarioRedContratoService);
  private catalogoService = inject(CatalogoService);
  private readonly adDomain = 'inia.local';

  @Output() saved = new EventEmitter<AdPanelResult>();
  @Output() cancelled = new EventEmitter<void>();

  form: CreateAdUserRequest = this.emptyForm();
  contratoEnabled = false;
  contratoForm: UsuarioRedContratoRequest = this.emptyContratoForm();
  tiposContrato: TipoContrato[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  ouSearch = '';
  ouResults: ActiveDirectoryOu[] = [];
  working = false;
  error = '';
  correosDisponibles: CorreoDisponible[] = [];
  correoSearch = '';
  correoPickerOpen = false;
  correosLoading = false;
  correosError = '';
  private upnEdited = false;

  ngOnInit(): void {
    this.catalogoService.getDependencias().subscribe({
      next: (items) => (this.dependencias = this.sortByName(items)),
      error: () => (this.dependencias = []),
    });
    this.loadCorreosDisponibles();
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
    this.form.mail = '';
    this.correoPickerOpen = true;
  }

  selectCorreo(correo: CorreoDisponible): void {
    this.form.mail = correo.email;
    this.correoSearch = correo.email;
    this.correoPickerOpen = false;
  }

  clearCorreo(): void {
    this.form.mail = '';
    this.correoSearch = '';
    this.correoPickerOpen = false;
  }

  esContratoOs(): boolean {
    const tipo = this.tiposContrato.find((item) => item.id === this.contratoForm.tipoContratoId);
    return esTipoContratoOs(tipo?.nombre);
  }

  onSamChanged(value: string): void {
    this.form.samAccountName = value;
    this.contratoForm = { ...this.contratoForm, usuario: value };
    if (!this.upnEdited) {
      this.form.userPrincipalName = this.generatedUpn(value);
    }
  }

  onUpnChanged(value: string): void {
    this.form.userPrincipalName = value;
    this.upnEdited = !!value?.trim() && value.trim() !== this.generatedUpn(this.form.samAccountName);
  }

  onDependenciaChange(value: number | null): void {
    this.dependenciaId = this.normalizeSelectId(value);
    this.subdependenciaId = null;
    this.subdependencias = [];
    const dependencia = this.findDependencia(this.dependenciaId);
    this.form.department = dependencia?.nombre ?? '';
    this.form.office = dependencia?.nombre ?? '';
    if (this.dependenciaId) {
      this.catalogoService.getSubdependencias(this.dependenciaId).subscribe((items) => (this.subdependencias = this.sortByName(items)));
    }
  }

  onSubdependenciaChange(value: number | null): void {
    this.subdependenciaId = this.normalizeSelectId(value);
    const subdependencia = this.findSubdependencia(this.subdependenciaId);
    this.form.office = subdependencia?.nombre || this.form.department || '';
  }

  onContratoToggle(enabled: boolean): void {
    this.contratoEnabled = enabled;
    if (enabled) {
      this.contratoForm = { ...this.contratoForm, usuario: this.form.samAccountName };
      this.ensureTiposContrato();
    }
  }

  searchOus(): void {
    const term = this.ouSearch.trim();
    if (term.length < 2) return;
    this.adService.searchOus(term).subscribe((ous) => (this.ouResults = ous));
  }

  selectOu(ou: ActiveDirectoryOu): void {
    this.form.ouDestinoDn = ou.dn;
    this.ouSearch = ou.name;
    this.ouResults = [];
  }

  submit(): void {
    this.ensureUpn();
    const request = this.normalizedRequest();
    if (!request.samAccountName || !request.givenName || !request.surname || !request.temporaryPassword || !request.ouDestinoDn) {
      this.error = 'Completa usuario, nombres, apellidos, contraseña temporal y OU destino.';
      return;
    }
    if (request.mail && !this.correosDisponibles.some((correo) => correo.email.toLocaleLowerCase('es-PE') === request.mail?.toLocaleLowerCase('es-PE'))) {
      this.error = 'Selecciona un correo de la lista sincronizada con el módulo Correos.';
      return;
    }
    if (request.temporaryPassword.length < 8) {
      this.error = 'La contraseña temporal debe tener al menos 8 caracteres.';
      return;
    }
    if (this.contratoEnabled && (!this.contratoForm.tipoContratoId || !this.contratoForm.fechaInicio)) {
      this.error = 'Completa tipo de contrato y fecha de inicio del contrato inicial.';
      return;
    }

    this.error = '';
    this.working = true;
    this.adService.createUser(request).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.working = false;
          this.error = response.message;
          return;
        }
        const user = response.data;
        const usuarioCreado = user.samAccountName || request.samAccountName;
        if (!this.contratoEnabled) {
          this.working = false;
          this.saved.emit({ user, notice: { tone: 'success', text: response.message } });
          return;
        }
        this.contratoService.create(this.normalizedContratoRequest(usuarioCreado)).subscribe({
          next: () => {
            this.working = false;
            this.saved.emit({ user, notice: { tone: 'success', text: `${response.message} Contrato inicial registrado.` } });
          },
          error: (err) => {
            this.working = false;
            this.saved.emit({
              user,
              notice: { tone: 'error', text: `Usuario creado en AD, pero no se pudo registrar el contrato: ${err?.error?.message || 'error no especificado'}.` },
            });
          },
        });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo crear el usuario en Active Directory.';
      },
    });
  }

  private ensureTiposContrato(): void {
    if (this.tiposContrato.length) return;
    this.catalogoService.getTiposContrato().subscribe({
      next: (tipos) => (this.tiposContrato = this.sortByName(tipos)),
      error: () => (this.tiposContrato = []),
    });
  }

  private loadCorreosDisponibles(): void {
    this.correosLoading = true;
    this.correosError = '';
    this.adService.getCorreosDisponibles().subscribe({
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

  private emptyForm(): CreateAdUserRequest {
    return {
      samAccountName: '',
      givenName: '',
      surname: '',
      displayName: '',
      mail: '',
      userPrincipalName: '',
      temporaryPassword: '',
      ouDestinoDn: '',
      title: '',
      department: '',
      office: '',
      telephoneNumber: '',
      mobile: '',
      description: '',
      enabled: true,
      forceChange: true,
    };
  }

  private emptyContratoForm(): UsuarioRedContratoRequest {
    return {
      usuario: '',
      tipoContratoId: null as unknown as number,
      fechaInicio: '',
      fechaFin: null,
      numeroContrato: null,
      personalNombre: null,
      personalApellidos: null,
    };
  }

  private normalizedRequest(): CreateAdUserRequest {
    const department = this.blankToNull(this.form.department);
    const office = this.blankToNull(this.form.office) ?? department;
    return {
      samAccountName: this.form.samAccountName.trim(),
      givenName: this.form.givenName.trim(),
      surname: this.form.surname.trim(),
      displayName: this.blankToNull(this.form.displayName),
      mail: this.blankToNull(this.form.mail),
      userPrincipalName: this.blankToNull(this.form.userPrincipalName),
      temporaryPassword: this.form.temporaryPassword,
      ouDestinoDn: this.form.ouDestinoDn.trim(),
      title: this.blankToNull(this.form.title),
      department,
      office,
      telephoneNumber: this.blankToNull(this.form.telephoneNumber),
      mobile: this.blankToNull(this.form.mobile),
      description: this.blankToNull(this.form.description),
      enabled: this.form.enabled,
      forceChange: this.form.forceChange,
    };
  }

  private normalizedContratoRequest(usuario: string): UsuarioRedContratoRequest {
    return {
      usuario: usuario.trim(),
      tipoContratoId: this.contratoForm.tipoContratoId,
      fechaInicio: this.contratoForm.fechaInicio,
      fechaFin: this.blankToNull(this.contratoForm.fechaFin),
      numeroContrato: this.blankToNull(this.contratoForm.numeroContrato),
      personalNombre: this.blankToNull(this.contratoForm.personalNombre),
      personalApellidos: this.blankToNull(this.contratoForm.personalApellidos),
    };
  }

  private findDependencia(id: number | null): Dependencia | null {
    return id ? (this.dependencias.find((item) => item.id === id) ?? null) : null;
  }

  private findSubdependencia(id: number | null): Subdependencia | null {
    return id ? (this.subdependencias.find((item) => item.id === id) ?? null) : null;
  }

  private normalizeSelectId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private sortByName<T extends { nombre: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private blankToNull(value: string | null | undefined): string | null {
    return value?.trim() ? value.trim() : null;
  }

  private ensureUpn(): void {
    if (!this.form.userPrincipalName?.trim()) {
      this.form.userPrincipalName = this.generatedUpn(this.form.samAccountName);
    }
  }

  private generatedUpn(value: string | null | undefined): string {
    const sam = value?.trim();
    return sam ? `${sam}@${this.adDomain}` : '';
  }
}
