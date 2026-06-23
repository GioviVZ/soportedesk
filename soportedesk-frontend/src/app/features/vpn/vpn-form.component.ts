import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { Equipo } from '../equipos/equipo.model';
import { AuthService } from '../../core/auth/auth.service';
import { VpnPasswordGeneratorComponent } from './vpn-password-generator.component';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VpnPasswordGeneratorComponent],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);
  private authService = inject(AuthService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  usuariosRed: UsuarioRed[] = [];
  equiposConRed: Equipo[] = [];
  selectedAdUserId: number | null = null;

  form = this.fb.nonNullable.group({
    usuarioRedId: [null as number | null, Validators.required],
    equipoId: [null as number | null],
    ipAsignada: [''],
    vence: [''],
    estado: ['Activo', Validators.required],
    usuarioVpn: [''],
    credencialVpn: [''],
  });

  get canEditCredenciales(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('credenciales-vpn');
  }

  get adUserSelected(): UsuarioRed | null {
    if (!this.selectedAdUserId) return null;
    return this.usuariosRed.find((u) => u.id === this.selectedAdUserId) ?? null;
  }

  get equipoSeleccionado(): Equipo | null {
    const id = this.form.getRawValue().equipoId;
    return this.equiposConRed.find((e) => e.id === id) ?? null;
  }

  ngOnInit(): void {
    this.usuarioRedService.getAll().subscribe((data) => (this.usuariosRed = data));
    this.equipoService.getConRed().subscribe((data) => (this.equiposConRed = data));
  }

  ngOnChanges(): void {
    if (this.vpn) {
      this.selectedAdUserId = this.vpn.usuarioRed?.id ?? null;
      this.form.patchValue({
        usuarioRedId: this.vpn.usuarioRed?.id ?? null,
        equipoId: this.vpn.equipo?.id ?? null,
        ipAsignada: this.vpn.ipAsignada ?? '',
        vence: this.vpn.vence ?? '',
        estado: this.vpn.estado,
        usuarioVpn: this.vpn.usuarioVpn ?? '',
        credencialVpn: this.vpn.credencialVpn ?? '',
      });
    } else {
      this.selectedAdUserId = null;
      this.form.reset({ estado: 'Activo' });
    }
  }

  onAdUserSelected(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.selectedAdUserId = id;
    this.form.patchValue({ usuarioRedId: id, equipoId: null });
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const request = {
      usuarioRedId: raw.usuarioRedId!,
      equipoId: raw.equipoId,
      ipAsignada: raw.ipAsignada || '',
      vence: raw.vence || null,
      estado: raw.estado,
      usuarioVpn: raw.usuarioVpn || null,
      credencialVpn: raw.credencialVpn || null,
    };
    const obs = this.vpn
      ? this.service.update(this.vpn.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }

  useGeneratedPassword(password: string): void {
    this.form.patchValue({ credencialVpn: password });
  }
}
