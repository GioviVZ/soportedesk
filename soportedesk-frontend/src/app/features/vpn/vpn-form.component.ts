import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CARGOS_VPN, Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { EquipoResumen } from '../equipos/equipo.model';

type TitularModo = 'buscando' | 'ad-seleccionado' | 'externo';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);

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

  onElegirExterno(): void {
    this.setTitularModo('externo');
  }

  onVolverABuscar(): void {
    this.setTitularModo('buscando');
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
      alert('Debe seleccionar un usuario de red o indicar los datos del tercero externo.');
      return;
    }
    const raw = this.form.getRawValue();
    const esExterno = this.titularModo === 'externo';
    const request = {
      usuarioRedId: this.titularModo === 'ad-seleccionado' ? this.selectedAdUserId : null,
      titularTipo: esExterno ? ('EXTERNO' as const) : null,
      titularNombre: esExterno ? raw.titularNombre : null,
      titularApellidos: esExterno ? raw.titularApellidos : null,
      titularCorreo: esExterno ? raw.titularCorreo : null,
      titularEmpresa: esExterno ? raw.titularEmpresa : null,
      titularMotivo: esExterno ? raw.titularMotivo : null,
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

    if (this.titularModo === 'externo') {
      nombre.setValidators(Validators.required);
      apellidos.setValidators(Validators.required);
      correo.setValidators(Validators.required);
      empresa.setValidators(Validators.required);
      motivo.setValidators(Validators.required);
    } else {
      nombre.clearValidators();
      apellidos.clearValidators();
      correo.clearValidators();
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
