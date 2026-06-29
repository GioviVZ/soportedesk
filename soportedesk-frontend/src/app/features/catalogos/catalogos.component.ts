import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { ModeloImpresoraFormComponent } from './modelo-impresora-form.component';
import {
  Dependencia,
  MarcaImpresora,
  ModeloImpresora,
  Sede,
  Subdependencia,
  TipoBien,
  TipoContrato,
  TipoLicencia,
  TipoImpresora,
} from '../../core/models/catalogo.model';

type CatalogoTab =
  | 'sedes'
  | 'dependencias'
  | 'subdependencias'
  | 'tiposContrato'
  | 'tiposLicencia'
  | 'tiposBien'
  | 'tiposImpresora'
  | 'marcasImpresora'
  | 'modelosImpresora';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModeloImpresoraFormComponent],
  templateUrl: './catalogos.component.html',
  styleUrl: './catalogos.component.scss',
})
export class CatalogosComponent implements OnInit {
  private service = inject(CatalogoService);

  activeTab: CatalogoTab = 'sedes';

  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  tiposContrato: TipoContrato[] = [];
  tiposLicencia: TipoLicencia[] = [];
  tiposBien: TipoBien[] = [];
  tiposImpresora: TipoImpresora[] = [];
  marcasImpresora: MarcaImpresora[] = [];
  modelosImpresora: ModeloImpresora[] = [];

  editingId: number | null = null;
  nombreForm = '';
  parentIdForm: number | null = null;
  editingModeloImpresora: ModeloImpresora | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.service.getSedes().subscribe((data) => (this.sedes = data));
    this.service.getDependencias().subscribe((data) => (this.dependencias = data));
    this.service.getSubdependencias().subscribe((data) => (this.subdependencias = data));
    this.service.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
    this.service.getTiposLicencia().subscribe((data) => (this.tiposLicencia = data));
    this.service.getTiposBien().subscribe((data) => (this.tiposBien = data));
    this.service.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
    this.service.getMarcasImpresora().subscribe((data) => (this.marcasImpresora = data));
    this.service.getModelosImpresora().subscribe((data) => (this.modelosImpresora = data));
  }

  setTab(tab: CatalogoTab): void {
    this.activeTab = tab;
    this.editingModeloImpresora = null;
    this.resetForm();
  }

  onEditModeloImpresora(modelo: ModeloImpresora): void {
    this.editingModeloImpresora = modelo;
  }

  onModeloImpresoraSaved(): void {
    this.editingModeloImpresora = null;
    this.loadAll();
  }

  onModeloImpresoraCancelled(): void {
    this.editingModeloImpresora = null;
  }

  onModeloImpresoraDriverUploaded(updated: ModeloImpresora): void {
    this.editingModeloImpresora = updated;
    this.service.getModelosImpresora().subscribe((data) => (this.modelosImpresora = data));
  }

  deleteModeloImpresora(id: number): void {
    this.service.deleteModeloImpresora(id).subscribe(() => this.loadAll());
  }

  startEdit(id: number, nombre: string, parentId?: number): void {
    this.editingId = id;
    this.nombreForm = nombre;
    this.parentIdForm = parentId ?? null;
  }

  resetForm(): void {
    this.editingId = null;
    this.nombreForm = '';
    this.parentIdForm = null;
  }

  submitSimple(): void {
    if (!this.nombreForm.trim()) return;

    let obs;
    if (this.activeTab === 'sedes') {
      obs = this.editingId
        ? this.service.updateSede(this.editingId, { nombre: this.nombreForm })
        : this.service.createSede({ nombre: this.nombreForm });
    } else if (this.activeTab === 'tiposContrato') {
      obs = this.editingId
        ? this.service.updateTipoContrato(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoContrato({ nombre: this.nombreForm });
    } else if (this.activeTab === 'tiposLicencia') {
      obs = this.editingId
        ? this.service.updateTipoLicencia(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoLicencia({ nombre: this.nombreForm });
    } else if (this.activeTab === 'tiposBien') {
      obs = this.editingId
        ? this.service.updateTipoBien(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoBien({ nombre: this.nombreForm });
    } else if (this.activeTab === 'tiposImpresora') {
      obs = this.editingId
        ? this.service.updateTipoImpresora(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoImpresora({ nombre: this.nombreForm });
    } else if (this.activeTab === 'marcasImpresora') {
      obs = this.editingId
        ? this.service.updateMarcaImpresora(this.editingId, { nombre: this.nombreForm })
        : this.service.createMarcaImpresora({ nombre: this.nombreForm });
    } else if (this.activeTab === 'dependencias') {
      if (!this.parentIdForm) return;
      obs = this.editingId
        ? this.service.updateDependencia(this.editingId, {
            nombre: this.nombreForm,
            sedeId: this.parentIdForm,
          })
        : this.service.createDependencia({ nombre: this.nombreForm, sedeId: this.parentIdForm });
    } else {
      if (!this.parentIdForm) return;
      obs = this.editingId
        ? this.service.updateSubdependencia(this.editingId, {
            nombre: this.nombreForm,
            dependenciaId: this.parentIdForm,
          })
        : this.service.createSubdependencia({
            nombre: this.nombreForm,
            dependenciaId: this.parentIdForm,
          });
    }

    obs.subscribe(() => {
      this.resetForm();
      this.loadAll();
    });
  }

  deleteItem(tab: CatalogoTab, id: number): void {
    let obs;
    if (tab === 'sedes') {
      obs = this.service.deleteSede(id);
    } else if (tab === 'dependencias') {
      obs = this.service.deleteDependencia(id);
    } else if (tab === 'subdependencias') {
      obs = this.service.deleteSubdependencia(id);
    } else if (tab === 'tiposContrato') {
      obs = this.service.deleteTipoContrato(id);
    } else if (tab === 'tiposLicencia') {
      obs = this.service.deleteTipoLicencia(id);
    } else if (tab === 'tiposBien') {
      obs = this.service.deleteTipoBien(id);
    } else if (tab === 'marcasImpresora') {
      obs = this.service.deleteMarcaImpresora(id);
    } else {
      obs = this.service.deleteTipoImpresora(id);
    }
    obs.subscribe(() => this.loadAll());
  }
}
