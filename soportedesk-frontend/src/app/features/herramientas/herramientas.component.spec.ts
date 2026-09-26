import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { HerramientasComponent } from './herramientas.component';
import { HerramientasService } from './herramientas.service';

describe('HerramientasComponent ping continuo', () => {
  let fixture: ComponentFixture<HerramientasComponent>;
  let component: HerramientasComponent;
  let service: jasmine.SpyObj<HerramientasService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<HerramientasService>('HerramientasService', [
      'ping',
      'pingSample',
      'getOrdenesServicio',
    ]);

    await TestBed.configureTestingModule({
      imports: [HerramientasComponent],
      providers: [
        { provide: HerramientasService, useValue: service },
        { provide: AuthService, useValue: { canWrite: () => true } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HerramientasComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => component.ngOnDestroy());

  it('requires a descriptive name before starting continuous monitoring', () => {
    component.setPingMode('continuous');
    component.pingHost = '10.0.0.10';
    component.pingMonitorName = '   ';

    component.startContinuousPing();

    expect(component.pingMonitoring).toBeFalse();
    expect(component.pingError).toContain('nombre');
    expect(service.pingSample).not.toHaveBeenCalled();
  });

  it('adds one lightweight sample to the live bar chart', () => {
    service.pingSample.and.returnValue(of({
      host: '10.0.0.10',
      reachable: true,
      packetsSent: 1,
      packetsReceived: 1,
      packetsLost: 0,
      averageLatencyMs: 24,
      status: 'Responde',
      output: ['ok'],
    }));
    component.setPingMode('continuous');
    component.pingHost = '10.0.0.10';
    component.pingMonitorName = 'Servidor principal';

    component.startContinuousPing();

    expect(service.pingSample).toHaveBeenCalledOnceWith('10.0.0.10');
    expect(component.pingMonitoring).toBeTrue();
    expect(component.pingSamples.length).toBe(1);
    expect(component.pingAverageLatency).toBe(24);
    expect(component.pingBarClass(component.pingSamples[0])).toBe('healthy');

    component.stopContinuousPing(false);
  });
});
