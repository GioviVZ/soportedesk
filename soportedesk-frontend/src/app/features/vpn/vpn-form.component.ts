import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CARGOS_VPN, Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { EquipoResumen } from '../equipos/equipo.model';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Sede, Dependencia, TipoContrato } from '../../core/models/catalogo.model';

type TitularModo = 'buscando' | 'ad-seleccionado' | 'interno-manual' | 'externo';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);
  private catalogoService = inject(CatalogoService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly cargos = CARGOS_VPN;

  titularModo: TitularModo = 'buscando';
  adSearchTerm = '';
  adResults: UsuarioRed[] = [];
  adBusquedaRealizada = false;
  private adSearchTimeout?: ReturnType<typeof setTimeout>;

  selectedAdUserId: number | null = null;
  adUserSelected: UsuarioRed | null = null;

  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  tiposContrato: TipoContrato[] = [];
  titularSedeId: number | null = null;
  titularDependenciaId: number | null = null;
  titularTipoContratoId: number | null = null;

  equipoResults: EquipoResumen[] = [];
  equipoSeleccionado: EquipoResumen | null = null;
  equipoSearchTerm = '';
  private equipoSearchTimeout?: ReturnType<typeof setTimeout>;

  form = this.fb.nonNullable.group({
    titularNombre: [''],
    titularApellidos: [''],
    titularCorreo: [''],
    titularEmpresa: [''],
    titularMotivo: [''],
    titularCargo: ['', Validators.required],
    tipoEquipo: ['PERSONAL' as 'INIA' | 'PERSONAL', Validators.required],
    tieneGlpi: [false],
    glpiComputerId: [null as number | null],
    antivirusVerificado: [false],
    analisisAntivirusRealizado: [false],
    hostActualizado: [false],
  });

  get esInia(): boolean {
    return this.form.getRawValue().tipoEquipo === 'INIA';
  }

  get tieneGlpi(): boolean {
    return this.form.getRawValue().tieneGlpi;
  }

  ngOnInit(): void {
    this.catalogoService.getSedes().subscribe((data) => (this.sedes = data));
    this.catalogoService.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
  }

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        tipoEquipo: (this.vpn.tipoEquipo ?? 'PERSONAL') as 'INIA' | 'PERSONAL',
        tieneGlpi: this.vpn.glpiComputerId !== null,
        glpiComputerId: this.vpn.glpiComputerId,
        antivirusVerificado: this.vpn.antivirusVerificado ?? false,
        analisisAntivirusRealizado: this.vpn.analisisAntivirusRealizado ?? false,
        hostActualizado: this.vpn.hostActualizado ?? false,
        titularCargo: this.vpn.titularCargo ?? '',
      });
      if (this.vpn.glpiComputerId && this.vpn.glpiNombreEquipo) {
        this.equipoSeleccionado = {
          computerID: this.vpn.glpiComputerId,
          nombreEquipo: this.vpn.glpiNombreEquipo,
          ipEquipo: this.vpn.glpiIpEquipo,
        } as EquipoResumen;
      }
      if (this.vpn.usuarioRed) {
        this.selectedAdUserId = this.vpn.usuarioRed.id;
        this.adUserSelected = this.vpn.usuarioRed as UsuarioRed;
        this.setTitularModo('ad-seleccionado');
      } else if (this.vpn.titularTipo === 'INTERNO_MANUAL') {
        this.form.patchValue({
          titularNombre: this.vpn.titularNombre ?? '',
          titularApellidos: this.vpn.titularApellidos ?? '',
          titularCorreo: this.vpn.titularCorreo ?? '',
        });
        this.titularSedeId = this.vpn.titularSede?.id ?? null;
        this.titularDependenciaId = this.vpn.titularDependencia?.id ?? null;
        this.titularTipoContratoId = this.vpn.titularTipoContrato?.id ?? null;
        if (this.titularSedeId) {
          this.catalogoService.getDependencias(this.titularSedeId).subscribe((data) => (this.dependencias = data));
        }
        this.setTitularModo('interno-manual');
      } else if (this.vpn.titularTipo === 'EXTERNO') {
        this.form.patchValue({
          titularNombre: this.vpn.titularNombre ?? '',
          titularApellidos: this.vpn.titularApellidos ?? '',
          titularCorreo: this.vpn.titularCorreo ?? '',
          titularEmpresa: this.vpn.titularEmpresa ?? '',
          titularMotivo: this.vpn.titularMotivo ?? '',
        });
        this.setTitularModo('externo');
      }
    } else {
      this.resetAll();
    }
  }

  onAdSearch(term: string): void {
    this.adSearchTerm = term;
    clearTimeout(this.adSearchTimeout);
    this.adSearchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.adResults = [];
        this.adBusquedaRealizada = false;
        return;
      }
      this.usuarioRedService.getAll(term).subscribe((data) => {
        this.adResults = data;
        this.adBusquedaRealizada = true;
      });
    }, 300);
  }

  onAdUserSelected(usuario: UsuarioRed): void {
    this.selectedAdUserId = usuario.id;
    this.adUserSelected = usuario;
    this.adResults = [];
    this.adSearchTerm = '';
    this.setTitularModo('ad-seleccionado');
  }

  onCambiarUsuario(): void {
    this.selectedAdUserId = null;
    this.adUserSelected = null;
    this.setTitularModo('buscando');
  }

  onElegirInternoManual(): void {
    this.setTitularModo('interno-manual');
  }

  onElegirExterno(): void {
    this.setTitularModo('externo');
  }

  onVolverABuscar(): void {
    this.titularSedeId = null;
    this.titularDependenciaId = null;
    this.titularTipoContratoId = null;
    this.dependencias = [];
    this.setTitularModo('buscando');
  }

  onSedeChange(value: string): void {
    const sedeId = value ? Number(value) : null;
    this.titularSedeId = sedeId;
    this.titularDependenciaId = null;
    this.dependencias = [];
    if (sedeId) {
      this.catalogoService.getDependencias(sedeId).subscribe((data) => (this.dependencias = data));
    }
  }

  onDependenciaChange(value: string): void {
    this.titularDependenciaId = value ? Number(value) : null;
  }

  onTipoContratoChange(value: string): void {
    this.titularTipoContratoId = value ? Number(value) : null;
  }

  setTitularModo(modo: TitularModo): void {
    this.titularModo = modo;
    this.applyTitularValidators();
  }

  onTipoEquipoChange(): void {
    if (!this.esInia) {
      this.form.patchValue({ tieneGlpi: false, glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
  }

  onTieneGlpiChange(): void {
    if (!this.tieneGlpi) {
      this.form.patchValue({ glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
  }

  onEquipoSearch(term: string): void {
    this.equipoSearchTerm = term;
    clearTimeout(this.equipoSearchTimeout);
    this.equipoSearchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.equipoResults = [];
        return;
      }
      this.equipoService.getAll({ search: term }).subscribe((data) => (this.equipoResults = data));
    }, 300);
  }

  onEquipoSelected(equipo: EquipoResumen): void {
    this.equipoSeleccionado = equipo;
    this.equipoResults = [];
    this.equipoSearchTerm = '';
    this.form.patchValue({ glpiComputerId: equipo.computerID });
  }

  submit(): void {
    if (this.form.invalid) return;
    if (this.titularModo === 'buscando') {
      alert('Debe seleccionar un usuario de red, o indicar si es personal INIA sin cuenta AD o un tercero externo.');
      return;
    }
    if (this.titularModo === 'interno-manual' && (!this.titularSedeId || !this.titularDependenciaId || !this.titularTipoContratoId)) {
      alert('Complete sede, dependencia y tipo de contrato.');
      return;
    }
    const raw = this.form.getRawValue();
    const esManual = this.titularModo === 'interno-manual' || this.titularModo === 'externo';
    const request = {
      usuarioRedId: this.titularModo === 'ad-seleccionado' ? this.selectedAdUserId : null,
      titularTipo: this.titularModo === 'interno-manual' ? ('INTERNO_MANUAL' as const)
        : this.titularModo === 'externo' ? ('EXTERNO' as const)
        : null,
      titularNombre: esManual ? raw.titularNombre : null,
      titularApellidos: esManual ? raw.titularApellidos : null,
      titularCorreo: esManual ? raw.titularCorreo : null,
      titularSedeId: this.titularModo === 'interno-manual' ? this.titularSedeId : null,
      titularDependenciaId: this.titularModo === 'interno-manual' ? this.titularDependenciaId : null,
      titularTipoContratoId: this.titularModo === 'interno-manual' ? this.titularTipoContratoId : null,
      titularEmpresa: this.titularModo === 'externo' ? raw.titularEmpresa : null,
      titularMotivo: this.titularModo === 'externo' ? raw.titularMotivo : null,
      titularCargo: raw.titularCargo,
      tipoEquipo: raw.tipoEquipo,
      glpiComputerId: raw.tieneGlpi ? raw.glpiComputerId : null,
      antivirusVerificado: raw.antivirusVerificado,
      analisisAntivirusRealizado: raw.analisisAntivirusRealizado,
      hostActualizado: raw.tieneGlpi ? raw.hostActualizado : null,
    };
    const obs = this.vpn
      ? this.service.update(this.vpn.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }

  private applyTitularValidators(): void {
    const nombre = this.form.controls.titularNombre;
    const apellidos = this.form.controls.titularApellidos;
    const correo = this.form.controls.titularCorreo;
    const empresa = this.form.controls.titularEmpresa;
    const motivo = this.form.controls.titularMotivo;

    if (this.titularModo === 'interno-manual' || this.titularModo === 'externo') {
      nombre.setValidators(Validators.required);
      apellidos.setValidators(Validators.required);
      correo.setValidators(Validators.required);
    } else {
      nombre.clearValidators();
      apellidos.clearValidators();
      correo.clearValidators();
    }

    if (this.titularModo === 'externo') {
      empresa.setValidators(Validators.required);
      motivo.setValidators(Validators.required);
    } else {
      empresa.clearValidators();
      motivo.clearValidators();
    }

    nombre.updateValueAndValidity();
    apellidos.updateValueAndValidity();
    correo.updateValueAndValidity();
    empresa.updateValueAndValidity();
    motivo.updateValueAndValidity();
  }

  private resetAll(): void {
    this.selectedAdUserId = null;
    this.adUserSelected = null;
    this.adSearchTerm = '';
    this.adResults = [];
    this.adBusquedaRealizada = false;
    this.titularSedeId = null;
    this.titularDependenciaId = null;
    this.titularTipoContratoId = null;
    this.dependencias = [];
    this.equipoSeleccionado = null;
    this.equipoResults = [];
    this.titularModo = 'buscando';
    this.form.reset({
      tipoEquipo: 'PERSONAL',
      tieneGlpi: false,
      antivirusVerificado: false,
      analisisAntivirusRealizado: false,
      hostActualizado: false,
      titularCargo: '',
    });
    this.applyTitularValidators();
  }
}
