import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentModalComponent } from './equipo-enrichment-modal.component';

@Component({
  selector: 'app-equipos-mantenimiento',
  standalone: true,
  imports: [CommonModule, EquipoEnrichmentModalComponent],
  templateUrl: './equipos-mantenimiento.component.html',
  styleUrl: './equipos.shared.scss',
})
export class EquiposMantenimientoComponent implements OnInit {
  private service = inject(EquipoService);

  salud = signal<EquipoSaludItem[]>([]);
  modalOpen = signal(false);
  selectedComputerId = signal(0);
  selectedNombreEquipo = signal('');

  saludKpis = computed(() => {
    const s = this.salud();
    const rojos = s.filter((x) => x.nivelAlerta === 'ROJO').length;
    const amarillos = s.filter((x) => x.nivelAlerta === 'AMARILLO').length;
    const sinPatrimonial = s.filter((x) => x.sinCodigoPatrimonial).length;
    const sinUsuario = s.filter((x) => x.sinUsuario).length;
    const sinSede = s.filter((x) => x.sinSede).length;
    return [
      { label: 'Críticos (Rojo)', value: rojos, tone: 'red' },
      { label: 'Advertencia (Amarillo)', value: amarillos, tone: 'yellow' },
      { label: 'Sin cód. patrimonial', value: sinPatrimonial, tone: 'orange' },
      { label: 'Sin usuario', value: sinUsuario, tone: 'gray' },
      { label: 'Sin sede', value: sinSede, tone: 'gray' },
    ];
  });

  ngOnInit(): void {
    this.loadSalud();
  }

  loadSalud(): void {
    this.service.getSalud().subscribe((data) => this.salud.set(data));
  }

  abrirModal(item: EquipoSaludItem): void {
    this.selectedComputerId.set(item.computerID);
    this.selectedNombreEquipo.set(item.nombreEquipo);
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
  }

  onGuardado(): void {
    this.loadSalud();
  }

  mesesLabel(val: number): string {
    if (val < 0) return 'Sin dato';
    if (val === 0) return 'Este mes';
    return `${val} mes${val === 1 ? '' : 'es'}`;
  }
}
