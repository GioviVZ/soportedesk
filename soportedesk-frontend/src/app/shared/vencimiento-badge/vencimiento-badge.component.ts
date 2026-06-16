import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';

export type VencimientoStatus = 'vencido' | 'por-vencer' | null;

const DIAS_POR_VENCER = 30;

@Component({
  selector: 'app-vencimiento-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './vencimiento-badge.component.html',
  styleUrl: './vencimiento-badge.component.scss',
})
export class VencimientoBadgeComponent {
  @Input() fecha: string | null = null;

  get status(): VencimientoStatus {
    if (!this.fecha) {
      return null;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaFin = new Date(this.fecha);
    fechaFin.setHours(0, 0, 0, 0);

    const diffDias = (fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDias < 0) {
      return 'vencido';
    }
    if (diffDias <= DIAS_POR_VENCER) {
      return 'por-vencer';
    }
    return null;
  }
}
