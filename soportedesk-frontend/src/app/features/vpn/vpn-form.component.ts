import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CARGOS_VPN, CARGOS_VPN_EXTERNO, Vpn, VpnUsuarioRedOption } from './vpn.model';
import { VpnService } from './vpn.service';
import { EquipoService } from '../equipos/equipo.service';
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
  private equipoService = inject(EquipoService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly cargos = CARGOS_VPN;
  readonly cargosExterno = CARGOS_VPN_EXTERNO;

  titularModo: TitularModo = 'buscando';
  adSearchTerm = '';
  adResults: VpnUsuarioRedOption[] = [];
  adBusquedaRealizada = false;
  private adSearchTimeout?: ReturnType<typeof setTimeout>;

  selectedAdSamAccountName: string | null = null;
  adUserSelected: VpnUsuarioRedOption | null = null;

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
    antivirusVerificado: [false, Validators.requiredTrue],
    analisisAntivirusRealizado: [false, Validators.requiredTrue],
    hostActualizado: [false],
    sistemaOperativoActualizado: [false, Validators.requiredTrue],
    forticlientInstalado: [false, Validators.requiredTrue],
    vencimientoAntivirus: [null as string | null],
  });

  get esInia(): boolean {
    return this.form.getRawValue().tipoEquipo === 'INIA';
  }

  get tieneGlpi(): boolean {
    return this.form.getRawValue().tieneGlpi;
  }

  get pasoSoActualizadoHabilitado(): boolean {
    const raw = this.form.getRawValue();
    return this.esInia ? raw.antivirusVerificado : (raw.antivirusVerificado && !!raw.vencimientoAntivirus);
  }

  get pasoForticlientHabilitado(): boolean {
    return this.pasoSoActualizadoHabilitado && this.form.getRawValue().sistemaOperativoActualizado;
  }

  get pasoGlpiHabilitado(): boolean {
    return this.pasoForticlientHabilitado && this.form.getRawValue().forticlientInstalado;
  }

  get pasoAnalisisHabilitado(): boolean {
    const raw = this.form.getRawValue();
    if (this.esInia) return raw.tieneGlpi && raw.hostActualizado;
    return this.pasoForticlientHabilitado && raw.forticlientInstalado;
  }

  get pasoVencimientoHabilitado(): boolean {
    return this.form.getRawValue().antivirusVerificado;
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
        sistemaOperativoActualizado: this.vpn.sistemaOperativoActualizado ?? false,
        forticlientInstalado: this.vpn.forticlientInstalado ?? false,
        vencimientoAntivirus: this.vpn.vencimientoAntivirus ?? null,
        titularCargo: this.vpn.titularCargo ?? '',
      });
      this.applyVerificacionValidators();
      if (this.vpn.glpiComputerId && this.vpn.glpiNombreEquipo) {
        this.equipoSeleccionado = {
          computerID: this.vpn.glpiComputerId,
          nombreEquipo: this.vpn.glpiNombreEquipo,
          ipEquipo: this.vpn.glpiIpEquipo,
        } as EquipoResumen;
      }
      if (this.vpn.adSamAccountName) {
        this.selectedAdSamAccountName = this.vpn.adSamAccountName;
        this.adUserSelected = {
          samAccountName: this.vpn.adSamAccountName,
          displayName: this.vpn.adDisplayName,
          mail: this.vpn.adMail,
          office: this.vpn.adOffice,
          organizationalUnit: this.vpn.adOrganizationalUnit,
          enabled: true,
        };
        this.setTitularModo('ad-seleccionado');
      } else if (this.vpn.usuarioRed) {
        this.selectedAdSamAccountName = this.vpn.usuarioRed.usuario;
        this.adUserSelected = {
          samAccountName: this.vpn.usuarioRed.usuario,
          displayName: this.vpn.usuarioRed.nombre,
          mail: null,
          office: null,
          organizationalUnit: null,
          enabled: true,
        };
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
      this.service.searchUsuariosRed(term).subscribe((data) => {
        this.adResults = data;
        this.adBusquedaRealizada = true;
      });
    }, 300);
  }

  onAdUserSelected(usuario: VpnUsuarioRedOption): void {
    this.selectedAdSamAccountName = usuario.samAccountName;
    this.adUserSelected = usuario;
    this.adResults = [];
    this.adSearchTerm = '';
    this.setTitularModo('ad-seleccionado');
  }

  onCambiarUsuario(): void {
    this.selectedAdSamAccountName = null;
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
    const cruzaFronteraExterno = (this.titularModo === 'externo') !== (modo === 'externo');
    this.titularModo = modo;
    if (cruzaFronteraExterno) {
      this.form.patchValue({ titularCargo: '' });
    }
    this.applyTitularValidators();
  }

  onTipoEquipoChange(): void {
    if (this.esInia) {
      this.form.patchValue({ vencimientoAntivirus: null });
    } else {
      this.form.patchValue({ tieneGlpi: false, glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
    this.applyVerificacionValidators();
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
      usuarioRedSamAccountName: this.titularModo === 'ad-seleccionado' ? this.selectedAdSamAccountName : null,
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
      sistemaOperativoActualizado: raw.sistemaOperativoActualizado,
      forticlientInstalado: raw.forticlientInstalado,
      vencimientoAntivirus: raw.tipoEquipo === 'PERSONAL' ? raw.vencimientoAntivirus : null,
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

  private applyVerificacionValidators(): void {
    const tieneGlpiCtrl = this.form.controls.tieneGlpi;
    const hostActualizadoCtrl = this.form.controls.hostActualizado;
    const vencimientoCtrl = this.form.controls.vencimientoAntivirus;

    if (this.esInia) {
      tieneGlpiCtrl.setValidators(Validators.requiredTrue);
      hostActualizadoCtrl.setValidators(Validators.requiredTrue);
      vencimientoCtrl.clearValidators();
    } else {
      tieneGlpiCtrl.clearValidators();
      hostActualizadoCtrl.clearValidators();
      vencimientoCtrl.setValidators(Validators.required);
    }

    tieneGlpiCtrl.updateValueAndValidity();
    hostActualizadoCtrl.updateValueAndValidity();
    vencimientoCtrl.updateValueAndValidity();
  }

  private resetAll(): void {
    this.selectedAdSamAccountName = null;
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
      sistemaOperativoActualizado: false,
      forticlientInstalado: false,
      vencimientoAntivirus: null,
      titularCargo: '',
    });
    this.applyTitularValidators();
    this.applyVerificacionValidators();
  }
}
