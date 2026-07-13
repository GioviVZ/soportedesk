import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeMode, ThemeService } from '../../core/services/theme.service';
import { ModeloImpresoraFormComponent } from './modelo-impresora-form.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { VpnConfigInstitucionalFormComponent } from '../vpn/vpn-config-institucional-form.component';
import { VpnService } from '../vpn/vpn.service';
import {
  Dependencia,
  MarcaImpresora,
  ModeloImpresora,
  Sede,
  Subdependencia,
  TipoBien,
  TipoContrato,
  TipoEquipoCatalogo,
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
  | 'modelosImpresora'
  | 'tiposEquipo'
  | 'vpnInstitucional';

type PendingDelete = {
  tab: CatalogoTab;
  id: number;
  title: string;
  detail?: string;
};

type CatalogoNavItem = {
  tab: CatalogoTab;
  label: string;
  description: string;
  affects: string[];
};

type CatalogoNavGroup = {
  title: string;
  description: string;
  icon: string;
  items: CatalogoNavItem[];
};

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModeloImpresoraFormComponent, ModalComponent, VpnConfigInstitucionalFormComponent],
  templateUrl: './catalogos.component.html',
  styleUrl: './catalogos.component.scss',
})
export class CatalogosComponent implements OnInit {
  private service = inject(CatalogoService);
  private authService = inject(AuthService);
  private vpnService = inject(VpnService);
  private themeService = inject(ThemeService);

  readonly theme = this.themeService.theme;

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }

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
  tiposEquipo: TipoEquipoCatalogo[] = [];

  editingId: number | null = null;
  nombreForm = '';
  glpiValorForm = '';
  tipoNormalizadoForm = '';
  parentIdForm: number | null = null;
  editingModeloImpresora: ModeloImpresora | null = null;
  formOpen = false;
  modeloFormOpen = false;
  vpnConfigOpen = false;
  vpnConfigVencimiento: string | null = null;
  pendingDelete: PendingDelete | null = null;

  readonly navGroups: CatalogoNavGroup[] = [
    {
      title: 'Ubicacion institucional',
      description: 'Estructura usada para filtrar y ubicar registros por sede, dependencia y subdependencia.',
      icon: 'UB',
      items: [
        {
          tab: 'sedes',
          label: 'Sedes',
          description: 'Base geografica de usuarios, equipos, impresoras y contratos.',
          affects: ['Usuarios de Red', 'Equipos', 'Impresoras'],
        },
        {
          tab: 'dependencias',
          label: 'Dependencias',
          description: 'Areas principales dentro de cada sede.',
          affects: ['Usuarios de Red', 'Equipos', 'Impresoras'],
        },
        {
          tab: 'subdependencias',
          label: 'Subdependencias',
          description: 'Areas internas para ubicacion fina de activos y usuarios.',
          affects: ['Usuarios de Red', 'Equipos', 'Impresoras'],
        },
      ],
    },
    {
      title: 'Impresoras',
      description: 'Catalogos que alimentan el inventario, consumibles, modelos y drivers de impresoras.',
      icon: 'IM',
      items: [
        {
          tab: 'tiposImpresora',
          label: 'Tipos de impresora',
          description: 'Clasifica impresoras por funcion o tecnologia.',
          affects: ['Impresoras'],
        },
        {
          tab: 'marcasImpresora',
          label: 'Marcas de impresora',
          description: 'Marcas disponibles para modelos y fichas de impresora.',
          affects: ['Impresoras'],
        },
        {
          tab: 'modelosImpresora',
          label: 'Modelos de impresora',
          description: 'Modelos, toners y driver descargable por marca.',
          affects: ['Impresoras'],
        },
      ],
    },
    {
      title: 'Licencias y bienes',
      description: 'Opciones que ordenan el registro de licencias, bienes y contratos asociados.',
      icon: 'LB',
      items: [
        {
          tab: 'tiposLicencia',
          label: 'Tipos de licencia',
          description: 'Categorias de licencias de software.',
          affects: ['Licencias'],
        },
        {
          tab: 'tiposBien',
          label: 'Tipos de bien',
          description: 'Naturaleza del bien asociado a una licencia.',
          affects: ['Licencias'],
        },
        {
          tab: 'tiposContrato',
          label: 'Tipos de contrato',
          description: 'Tipos de contrato usados en usuarios, equipos e impresoras.',
          affects: ['Usuarios de Red', 'Equipos', 'Impresoras'],
        },
      ],
    },
    {
      title: 'Equipos GLPI',
      description: 'Normalizacion de datos importados o consultados desde GLPI.',
      icon: 'GL',
      items: [
        {
          tab: 'tiposEquipo',
          label: 'Tipos de equipo (GLPI)',
          description: 'Mapea valores GLPI a tipos normalizados del sistema.',
          affects: ['Equipos'],
        },
      ],
    },
    {
      title: 'VPN y seguridad',
      description: 'Parametros institucionales usados para calcular vencimientos y validar accesos VPN.',
      icon: 'VP',
      items: [
        {
          tab: 'vpnInstitucional',
          label: 'Antivirus institucional',
          description: 'Fecha anual que define el vencimiento VPN para equipos INIA.',
          affects: ['VPN'],
        },
      ],
    },
  ];

  get activeTabLabel(): string {
    return this.tabLabel(this.activeTab);
  }

  get simpleFormTitle(): string {
    return `${this.editingId ? 'Editar' : 'Agregar'} ${this.activeTabLabel}`;
  }

  get simpleFormPlaceholder(): string {
    return `Nombre de ${this.activeTabLabel.toLowerCase()}`;
  }

  get needsParent(): boolean {
    return this.activeTab === 'dependencias' || this.activeTab === 'subdependencias';
  }

  get canWrite(): boolean {
    return this.authService.canWrite('catalogos');
  }

  get activeNavItem(): CatalogoNavItem {
    return this.navGroups
      .flatMap((group) => group.items)
      .find((item) => item.tab === this.activeTab)!;
  }

  get activeGroup(): CatalogoNavGroup {
    return this.navGroups.find((group) => group.items.some((item) => item.tab === this.activeTab))!;
  }

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
    this.service.getTiposEquipo().subscribe((data) => (this.tiposEquipo = data));
    if (this.canWrite) {
      this.loadVpnConfig();
    }
  }

  setTab(tab: CatalogoTab): void {
    this.activeTab = tab;
    this.editingModeloImpresora = null;
    this.modeloFormOpen = false;
    this.vpnConfigOpen = false;
    this.formOpen = false;
    this.resetForm();
  }

  startAdd(): void {
    if (!this.canWrite) return;
    if (this.activeTab === 'vpnInstitucional') {
      this.vpnConfigOpen = true;
      return;
    }
    this.resetForm();
    if (this.activeTab === 'modelosImpresora') {
      this.modeloFormOpen = true;
      return;
    }
    this.formOpen = true;
  }

  loadVpnConfig(): void {
    this.vpnService
      .getConfigInstitucional()
      .subscribe((data) => (this.vpnConfigVencimiento = data.vencimientoAntivirus));
  }

  closeVpnConfig(): void {
    this.vpnConfigOpen = false;
  }

  onVpnConfigSaved(): void {
    this.vpnConfigOpen = false;
    this.loadVpnConfig();
  }

  onEditModeloImpresora(modelo: ModeloImpresora): void {
    if (!this.canWrite) return;
    this.editingModeloImpresora = modelo;
    this.modeloFormOpen = true;
  }

  onModeloImpresoraSaved(): void {
    this.editingModeloImpresora = null;
    this.modeloFormOpen = false;
    this.loadAll();
  }

  onModeloImpresoraCancelled(): void {
    this.editingModeloImpresora = null;
    this.modeloFormOpen = false;
  }

  onModeloImpresoraDriverUploaded(updated: ModeloImpresora): void {
    this.editingModeloImpresora = updated;
    this.service.getModelosImpresora().subscribe((data) => (this.modelosImpresora = data));
  }

  deleteModeloImpresora(id: number): void {
    if (!this.canWrite) return;
    this.service.deleteModeloImpresora(id).subscribe(() => this.loadAll());
  }

  startEdit(id: number, nombre: string, parentId?: number): void {
    if (!this.canWrite) return;
    this.editingId = id;
    this.nombreForm = nombre;
    this.parentIdForm = parentId ?? null;
    this.formOpen = true;
  }

  resetForm(): void {
    this.editingId = null;
    this.nombreForm = '';
    this.parentIdForm = null;
    this.glpiValorForm = '';
    this.tipoNormalizadoForm = '';
    this.formOpen = false;
  }

  startEditTipoEquipo(item: TipoEquipoCatalogo): void {
    if (!this.canWrite) return;
    this.editingId = item.id;
    this.glpiValorForm = item.glpiValor;
    this.tipoNormalizadoForm = item.tipoNormalizado;
    this.formOpen = true;
  }

  submitTipoEquipo(): void {
    if (!this.canWrite) return;
    if (!this.glpiValorForm.trim() || !this.tipoNormalizadoForm.trim()) return;
    const req = { glpiValor: this.glpiValorForm.trim(), tipoNormalizado: this.tipoNormalizadoForm.trim() };
    const obs = this.editingId
      ? this.service.updateTipoEquipo(this.editingId, req)
      : this.service.createTipoEquipo(req);
    obs.subscribe(() => {
      this.resetForm();
      this.loadAll();
    });
  }

  submitSimple(): void {
    if (!this.canWrite) return;
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

  requestDelete(tab: CatalogoTab, id: number, title: string, detail?: string): void {
    if (!this.canWrite) return;
    this.pendingDelete = { tab, id, title, detail };
  }

  requestDeleteModelo(modelo: ModeloImpresora): void {
    if (!this.canWrite) return;
    this.pendingDelete = {
      tab: 'modelosImpresora',
      id: modelo.id,
      title: `${modelo.marca.nombre} ${modelo.nombre}`,
      detail: 'Modelo de impresora',
    };
  }

  closeDelete(): void {
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.canWrite) return;
    if (!this.pendingDelete) return;
    const item = this.pendingDelete;
    if (item.tab === 'modelosImpresora') {
      this.service.deleteModeloImpresora(item.id).subscribe(() => {
        this.pendingDelete = null;
        this.loadAll();
      });
      return;
    }
    this.deleteItem(item.tab, item.id);
    this.pendingDelete = null;
  }

  deleteItem(tab: CatalogoTab, id: number): void {
    if (!this.canWrite) return;
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
    } else if (tab === 'tiposEquipo') {
      obs = this.service.deleteTipoEquipo(id);
    } else {
      obs = this.service.deleteTipoImpresora(id);
    }
    obs.subscribe(() => this.loadAll());
  }

  tabLabel(tab: CatalogoTab): string {
    const labels: Record<CatalogoTab, string> = {
      sedes: 'Sede',
      dependencias: 'Dependencia',
      subdependencias: 'Subdependencia',
      tiposContrato: 'Tipo de contrato',
      tiposLicencia: 'Tipo de licencia',
      tiposBien: 'Tipo de bien',
      tiposImpresora: 'Tipo de impresora',
      marcasImpresora: 'Marca de impresora',
      modelosImpresora: 'Modelo de impresora',
      tiposEquipo: 'Tipo de equipo (GLPI)',
      vpnInstitucional: 'Antivirus institucional',
    };
    return labels[tab];
  }

  itemCount(tab: CatalogoTab): number {
    const counts: Record<CatalogoTab, number> = {
      sedes: this.sedes.length,
      dependencias: this.dependencias.length,
      subdependencias: this.subdependencias.length,
      tiposContrato: this.tiposContrato.length,
      tiposLicencia: this.tiposLicencia.length,
      tiposBien: this.tiposBien.length,
      tiposImpresora: this.tiposImpresora.length,
      marcasImpresora: this.marcasImpresora.length,
      modelosImpresora: this.modelosImpresora.length,
      tiposEquipo: this.tiposEquipo.length,
      vpnInstitucional: this.vpnConfigVencimiento ? 1 : 0,
    };
    return counts[tab];
  }

  groupCount(group: CatalogoNavGroup): number {
    return group.items.reduce((total, item) => total + this.itemCount(item.tab), 0);
  }

  isGroupActive(group: CatalogoNavGroup): boolean {
    return group.items.some((item) => item.tab === this.activeTab);
  }

  setGroup(group: CatalogoNavGroup): void {
    this.setTab(group.items[0].tab);
  }

  trackGroup(_: number, group: CatalogoNavGroup): string {
    return group.title;
  }

  trackItem(_: number, item: CatalogoNavItem): string {
    return item.tab;
  }
}
