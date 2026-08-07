import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { TipoContrato } from '../../core/models/catalogo.model';
import { UsuarioRedContratoService } from './usuario-red-contrato.service';
import { UsuarioRedContrato, UsuarioRedContratoRequest, esTipoContratoOs } from './usuario-red-contrato.model';

@Component({
    selector: 'app-usuario-red-contratos-panel',
    imports: [CommonModule, FormsModule, SectionCardComponent, ModalComponent, VencimientoBadgeComponent],
    template: `
    <app-section-card title="Contratos">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    
      @if (notice) {
        <div class="notice" [class.error]="notice.tone === 'error'" [class.success]="notice.tone === 'success'">
          {{ notice.text }}
        </div>
      }
    
      @if (contratos.length) {
        <div class="contract-expiry-alert" [class.danger]="vencimientoEstado() === 'VENCIDO'" [class.warning]="vencimientoEstado() === 'POR_VENCER'">
          <div>
            <strong>Vencimiento de usuario de red</strong>
            <span>{{ vencimientoUsuarioRed() ? (vencimientoUsuarioRed() | date:'dd/MM/yyyy') : 'Sin fecha fin registrada' }}</span>
          </div>
          <app-vencimiento-badge [fecha]="vencimientoUsuarioRed()" />
        </div>
      }
    
      @if (editable) {
        <button type="button" class="btn btn-primary btn-create-record" (click)="openCreate()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar contrato
        </button>
      }
    
      @if (!loading && !contratos.length) {
        <p class="muted">Sin contratos registrados para esta cuenta.</p>
      }
    
      @if (contratos.length) {
        <div class="assigned-list contrato-list">
          @for (c of contratos; track c) {
            <div class="contrato-item">
              <div class="contrato-main">
                <span class="contrato-tipo">{{ c.tipoContratoNombre }}</span>
                <span class="contrato-fechas">
                  {{ c.fechaInicio | date:'dd/MM/yyyy' }} - {{ c.fechaFin ? (c.fechaFin | date:'dd/MM/yyyy') : 'Actual' }}
                  <app-vencimiento-badge [fecha]="c.fechaFin" />
                </span>
                @if (c.numeroContrato) {
                  <span class="contrato-numero">Nro. {{ c.numeroContrato }}</span>
                }
                @if (esOs(c)) {
                  <span class="contrato-personal">
                    Titular: <strong>{{ c.personalNombre }} {{ c.personalApellidos }}</strong>
                  </span>
                }
              </div>
              @if (editable) {
                <div class="contrato-actions">
                  <button type="button" class="record-action link-edit" (click)="openEdit(c)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                    </svg>
                    Editar
                  </button>
                  <button type="button" class="record-action link-danger" (click)="remove(c)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </app-section-card>
    
    <app-modal [title]="editingId ? 'Editar contrato' : 'Agregar contrato'" [open]="modalOpen" [hideDefaultFooter]="true" (closed)="closeModal()">
      <form class="modal-form form-grid" (ngSubmit)="save()" id="usuario-red-contrato-edit-form">
        <div class="field">
          <label>Tipo de contrato</label>
          <select name="tipoContratoId" [(ngModel)]="form.tipoContratoId" required>
            <option [ngValue]="null" disabled>Selecciona un tipo</option>
            @for (tipo of tiposContrato; track tipo) {
              <option [ngValue]="tipo.id">{{ tipo.nombre }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Nro. de contrato</label>
          <input name="numeroContrato" [(ngModel)]="form.numeroContrato" />
        </div>
        <div class="field">
          <label>Fecha inicio</label>
          <input type="date" name="fechaInicio" [(ngModel)]="form.fechaInicio" required />
        </div>
        <div class="field">
          <label>Fecha fin</label>
          <input type="date" name="fechaFin" [(ngModel)]="form.fechaFin" />
        </div>
        @if (esTipoSeleccionadoOs()) {
          <div class="field">
            <label>Nombre del personal</label>
            <input name="personalNombre" [(ngModel)]="form.personalNombre" />
          </div>
          <div class="field">
            <label>Apellidos del personal</label>
            <input name="personalApellidos" [(ngModel)]="form.personalApellidos" />
          </div>
        }
    
      </form>
    
      <footer modal-footer class="modal-actions full">
        <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
        <button type="submit" form="usuario-red-contrato-edit-form" class="btn btn-primary" [disabled]="saving">Guardar</button>
      </footer>
    </app-modal>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./usuarios-red.shared.scss', './usuario-red-contratos-panel.scss']
})
export class UsuarioRedContratosPanelComponent implements OnChanges {
  private service = inject(UsuarioRedContratoService);
  private catalogoService = inject(CatalogoService);

  @Input({ required: true }) usuario!: string;
  @Input() editable = false;

  contratos: UsuarioRedContrato[] = [];
  tiposContrato: TipoContrato[] = [];
  loading = false;
  saving = false;
  modalOpen = false;
  editingId: number | null = null;
  form: UsuarioRedContratoRequest = this.emptyForm();
  notice: { tone: 'success' | 'error'; text: string } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      this.load();
    }
  }

  esOs(c: UsuarioRedContrato): boolean {
    return esTipoContratoOs(c.tipoContratoNombre);
  }

  esTipoSeleccionadoOs(): boolean {
    const tipo = this.tiposContrato.find((t) => t.id === this.form.tipoContratoId);
    return esTipoContratoOs(tipo?.nombre);
  }

  vencimientoUsuarioRed(): string | null {
    const fechas = this.contratos
      .map((contrato) => contrato.fechaFin)
      .filter((fecha): fecha is string => !!fecha)
      .sort();
    return fechas.length ? fechas[fechas.length - 1] : null;
  }

  vencimientoEstado(): 'VENCIDO' | 'POR_VENCER' | 'VIGENTE' | 'SIN_FECHA' {
    const fecha = this.vencimientoUsuarioRed();
    if (!fecha) return 'SIN_FECHA';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fecha);
    vencimiento.setHours(0, 0, 0, 0);
    const diffDias = (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDias < 0) return 'VENCIDO';
    if (diffDias <= 30) return 'POR_VENCER';
    return 'VIGENTE';
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.editingId = null;
    this.notice = null;
    this.ensureTiposContrato();
    this.modalOpen = true;
  }

  openEdit(c: UsuarioRedContrato): void {
    this.form = {
      usuario: c.usuario,
      tipoContratoId: c.tipoContratoId,
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin,
      numeroContrato: c.numeroContrato,
      personalNombre: c.personalNombre,
      personalApellidos: c.personalApellidos,
    };
    this.editingId = c.id;
    this.notice = null;
    this.ensureTiposContrato();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  save(): void {
    if (!this.form.tipoContratoId || !this.form.fechaInicio) {
      this.notice = { tone: 'error', text: 'Completa tipo de contrato y fecha de inicio.' };
      return;
    }
    this.saving = true;
    const request$ = this.editingId
      ? this.service.update(this.editingId, this.form)
      : this.service.create({ ...this.form, usuario: this.usuario });
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.modalOpen = false;
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.notice = { tone: 'error', text: err?.error?.message || 'No se pudo guardar el contrato.' };
      },
    });
  }

  remove(c: UsuarioRedContrato): void {
    if (!confirm(`¿Eliminar el contrato ${c.tipoContratoNombre} de "${c.usuario}"?`)) return;
    this.service.delete(c.id).subscribe({
      next: () => this.load(),
      error: () => (this.notice = { tone: 'error', text: 'No se pudo eliminar el contrato.' }),
    });
  }

  private load(): void {
    this.loading = true;
    this.service.getByUsuario(this.usuario).subscribe({
      next: (contratos) => {
        this.contratos = contratos;
        this.loading = false;
      },
      error: () => {
        this.contratos = [];
        this.loading = false;
      },
    });
  }

  private ensureTiposContrato(): void {
    if (this.tiposContrato.length) return;
    this.catalogoService.getTiposContrato().subscribe({
      next: (tipos) => (this.tiposContrato = tipos),
      error: () => (this.tiposContrato = []),
    });
  }

  private emptyForm(): UsuarioRedContratoRequest {
    return {
      usuario: this.usuario,
      tipoContratoId: null as unknown as number,
      fechaInicio: '',
      fechaFin: null,
      numeroContrato: null,
      personalNombre: null,
      personalApellidos: null,
    };
  }
}
