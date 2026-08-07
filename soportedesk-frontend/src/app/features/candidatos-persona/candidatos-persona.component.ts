import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';

import { StatusBadgeComponent, BadgeTone } from '../../shared/status-badge/status-badge.component';
import { ClasificacionCandidato, PersonaCandidato } from './persona-candidato.model';
import { PersonaCandidatoService } from './persona-candidato.service';

@Component({
  selector: 'app-candidatos-persona',
  imports: [StatusBadgeComponent, DatePipe],
  templateUrl: './candidatos-persona.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './candidatos-persona.component.scss',
})
export class CandidatosPersonaComponent implements OnInit {
  private service = inject(PersonaCandidatoService);

  candidatos: PersonaCandidato[] = [];
  buscando = false;

  get sinClasificar(): number {
    return this.candidatos.filter((c) => !c.clasificacionSugerida).length;
  }

  countPor(clasificacion: ClasificacionCandidato): number {
    return this.candidatos.filter((c) => c.clasificacionSugerida === clasificacion).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getPendientes().subscribe((data) => (this.candidatos = data));
  }

  detectarAhora(): void {
    this.buscando = true;
    this.service.detectarAhora().subscribe({
      next: ({ nuevos }) => {
        this.buscando = false;
        this.load();
        alert(nuevos > 0 ? `${nuevos} cuenta(s) nueva(s) detectada(s).` : 'Sin cuentas nuevas, identidad al dia.');
      },
      error: (err) => {
        this.buscando = false;
        alert(err?.error?.message ?? 'Error al buscar cuentas nuevas');
      },
    });
  }

  tono(clasificacion: ClasificacionCandidato | null): BadgeTone {
    switch (clasificacion) {
      case 'PERSONAL':
        return 'success';
      case 'FUNCIONAL':
        return 'neutral';
      case 'SERVICIO':
        return 'warning';
      default:
        return 'danger';
    }
  }

  etiqueta(clasificacion: ClasificacionCandidato | null): string {
    switch (clasificacion) {
      case 'PERSONAL':
        return 'Personal';
      case 'FUNCIONAL':
        return 'Funcional';
      case 'SERVICIO':
        return 'Servicio';
      default:
        return 'Sin clasificar';
    }
  }

  confirmar(c: PersonaCandidato): void {
    if (!confirm(`¿Crear la persona "${c.nombres} ${c.apellidos}" (${c.samAccountName})?`)) return;
    this.service.confirmar(c.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Error al confirmar el candidato'),
    });
  }

  descartar(c: PersonaCandidato): void {
    if (!confirm(`¿Descartar la cuenta "${c.samAccountName}"? No se creara ninguna persona.`)) return;
    this.service.descartar(c.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Error al descartar el candidato'),
    });
  }
}
