import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { MonitorPing, MonitorPingEvent, MonitorPingHistorial } from './herramientas.model';
import { HerramientasService } from './herramientas.service';
import { MonitorPingStreamService } from './monitor-ping-stream.service';
import { PingMonitoringComponent } from './ping-monitoring.component';

describe('PingMonitoringComponent', () => {
  let component: PingMonitoringComponent;
  let service: jasmine.SpyObj<HerramientasService>;
  let events: Subject<MonitorPingEvent>;

  beforeEach(() => {
    service = jasmine.createSpyObj<HerramientasService>('HerramientasService', [
      'ping',
      'getMonitoresPing',
      'getMonitorPingHistorial',
      'createMonitorPing',
      'updateMonitorPing',
      'setMonitorPingEstado',
      'deleteMonitorPing',
    ]);
    events = new Subject<MonitorPingEvent>();
    service.getMonitoresPing.and.returnValue(of([monitor(1, 'Gateway'), monitor(2, 'Servidor AD')]));
    service.getMonitorPingHistorial.and.returnValue(of(history(1)));

    TestBed.configureTestingModule({
      imports: [PingMonitoringComponent],
      providers: [
        { provide: HerramientasService, useValue: service },
        { provide: MonitorPingStreamService, useValue: { events: () => events.asObservable() } },
        { provide: AuthService, useValue: { canWrite: () => true, isAdmin: () => false } },
      ],
    });

    component = TestBed.createComponent(PingMonitoringComponent).componentInstance;
  });

  afterEach(() => component.ngOnDestroy());

  it('carga y permite seleccionar varios monitores persistentes', () => {
    component.ngOnInit();

    expect(component.monitors.length).toBe(2);
    expect(component.selectedId).toBe(1);
    component.selectMonitor(2);
    expect(component.selectedMonitor?.nombre).toBe('Servidor AD');
    expect(service.getMonitorPingHistorial).toHaveBeenCalled();
  });

  it('crea un monitor con nombre, host e intervalo', () => {
    const created = monitor(8, 'Router principal');
    service.createMonitorPing.and.returnValue(of(created));
    component.ngOnInit();
    component.openCreate();
    component.form = { nombre: ' Router principal ', host: ' 10.0.0.1 ', intervaloSegundos: 10 };

    component.saveMonitor();

    expect(service.createMonitorPing).toHaveBeenCalledWith({
      nombre: 'Router principal',
      host: '10.0.0.1',
      intervaloSegundos: 10,
    });
    expect(component.selectedId).toBe(8);
    expect(component.feedback).toContain('servidor');
  });

  it('incorpora las muestras SSE al grafico sin depender de la sesion que creo el monitor', () => {
    component.ngOnInit();
    events.next({
      monitorId: 1,
      fecha: new Date().toISOString(),
      disponible: true,
      latenciaMs: 24,
      salud: 'DISPONIBLE',
      totalMuestras: 5,
      totalFallidas: 0,
      perdidaPorcentaje: 0,
    });

    expect(component.selectedMonitor?.ultimaLatenciaMs).toBe(24);
    expect(component.history?.puntos.length).toBe(1);
    expect(component.chartData.datasets[0].data).toEqual([24]);
  });

  function monitor(id: number, nombre: string): MonitorPing {
    const now = new Date().toISOString();
    return {
      id,
      nombre,
      host: `10.0.0.${id}`,
      intervaloSegundos: 10,
      estado: 'ACTIVO',
      salud: 'PENDIENTE',
      creadoPor: 'admin',
      actualizadoPor: 'admin',
      fechaCreacion: now,
      fechaActualizacion: now,
      ultimaMedicion: null,
      proximaMedicion: now,
      ultimaDisponible: null,
      ultimaLatenciaMs: null,
      fallosConsecutivos: 0,
      totalMuestras: 0,
      totalFallidas: 0,
      perdidaPorcentaje: 0,
    };
  }

  function history(monitorId: number): MonitorPingHistorial {
    const now = new Date().toISOString();
    return {
      monitorId,
      desde: now,
      hasta: now,
      resolucion: 'DETALLE',
      puntos: [],
      estadisticas: {
        muestras: 0,
        disponibles: 0,
        latenciaPromedioMs: null,
        latenciaMinimaMs: null,
        latenciaMaximaMs: null,
        disponibilidadPorcentaje: 0,
        perdidaPorcentaje: 0,
      },
    };
  }
});
