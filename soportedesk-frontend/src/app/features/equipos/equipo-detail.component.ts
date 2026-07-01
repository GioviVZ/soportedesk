import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipoDetalle, EquipoSoftware, EquipoTeclado } from './equipo.model';
import { EquipoService } from './equipo.service';

interface MonitorRow {
  nombre: string;
  modelo: string;
  fabricante: string;
  serial: string;
}

@Component({
  selector: 'app-equipo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-detail.component.html',
  styleUrl: './equipo-detail.component.scss',
})
export class EquipoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EquipoService);

  equipo = signal<EquipoDetalle | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  softwareFilter = signal('');

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) {
      return this.software();
    }
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(id).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
    });
  }

  back(): void {
    this.router.navigate(['/equipos']);
  }

  stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  gbLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} GB`;
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  private parseMonitores(equipo: EquipoDetalle | null): MonitorRow[] {
    if (!equipo || !equipo.monCantidad) {
      return [];
    }

    const nombres = this.splitPipe(equipo.monNombres);
    const modelos = this.splitPipe(equipo.monModelos);
    const fabricantes = this.splitPipe(equipo.monFabricantes);
    const seriales = this.splitPipe(equipo.monSeriales);
    const count = Math.max(equipo.monCantidad, nombres.length, modelos.length, fabricantes.length, seriales.length);

    return Array.from({ length: count }, (_, index) => ({
      nombre: nombres[index] ?? '-',
      modelo: modelos[index] ?? '-',
      fabricante: fabricantes[index] ?? '-',
      serial: seriales[index] ?? '-',
    }));
  }

  private splitPipe(value: string | null | undefined): string[] {
    return (value ?? '')
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean);
  }
}
