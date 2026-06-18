import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { Equipo } from '../equipos/equipo.model';

@Component({
  selector: 'app-vpn-datos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-datos-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnDatosFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  usuariosRed: UsuarioRed[] = [];
  equiposConRed: Equipo[] = [];

  form = this.fb.nonNullable.group({
    usuarioRedId: [null as number | null, Validators.required],
    equipoId:     [null as number | null],
    ipAsignada:   [''],
    vence:        [''],
    estado:       ['Activo', Validators.required],
  });

  ngOnInit(): void {
    this.usuarioRedService.getAll().subscribe((data) => (this.usuariosRed = data));
    this.equipoService.getConRed().subscribe((data) => (this.equiposConRed = data));
  }

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        usuarioRedId: this.vpn.usuarioRed?.id ?? null,
        equipoId:     this.vpn.equipo?.id ?? null,
        ipAsignada:   this.vpn.ipAsignada ?? '',
        vence:        this.vpn.vence ?? '',
        estado:       this.vpn.estado,
      });
    } else {
      this.form.reset({ estado: 'Activo' });
    }
  }

  get equipoSeleccionado(): Equipo | null {
    const id = this.form.getRawValue().equipoId;
    return this.equiposConRed.find((e) => e.id === id) ?? null;
  }

  submit(): void {
    if (this.form.invalid || !this.vpn) return;
    const raw = this.form.getRawValue();
    this.service.update(this.vpn.id, {
      usuarioRedId:   raw.usuarioRedId!,
      equipoId:       raw.equipoId,
      ipAsignada:     raw.ipAsignada || '',
      vence:          raw.vence || null,
      estado:         raw.estado,
      usuarioVpn:     this.vpn.usuarioVpn,
      credencialVpn:  this.vpn.credencialVpn,
    }).subscribe(() => this.saved.emit());
  }
}
