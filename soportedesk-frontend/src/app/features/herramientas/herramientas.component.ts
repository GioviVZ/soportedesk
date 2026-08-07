import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  NgZone,
  ViewChild,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import QRCode from 'qrcode';
import SpeedTest, { Results as CloudflareSpeedResults } from '@cloudflare/speedtest';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { EquipoDatosResult, OrdenServicio, PingResult } from './herramientas.model';
import { HerramientasService } from './herramientas.service';

type ToolTab = 'equipo' | 'ping' | 'velocidad' | 'qr' | 'vencimientos' | 'gpu' | 'ram' | 'teclado' | 'mouse' | 'pantalla' | 'tactil' | 'sonido' | 'microfono' | 'camara';
type TestState = 'idle' | 'running' | 'done' | 'error';
type QrFormat = 'png' | 'jpg' | 'svg';
type ScreenResult = '' | 'Sin defectos' | 'Pixel muerto' | 'Pixel atascado' | 'Pixel brillante' | 'Requiere revision';
type TouchMode = 'multitouch' | 'zonas' | 'precision';
type SoundChannel = 'left' | 'both' | 'right';
type OscillatorWave = OscillatorType;

interface PixelPattern { label: string; color: string; textColor: string; }
interface TouchPoint { id: number; x: number; y: number; pressure: number; color: string; }

interface ToolTabItem {
  id: ToolTab;
  label: string;
  detail: string;
}

interface ReportEntry {
  label: string;
  value: string;
}

interface ClientInfo {
  navegador: string;
  plataforma: string;
  idioma: string;
  nucleos: string;
  memoria: string;
  pantalla: string;
  conexion: string;
}

interface GpuStats {
  status: TestState;
  fps: number;
  minFps: number;
  averageFps: number;
  score: number;
  objects: number;
  elapsedSeconds: number;
  progress: number;
  renderer: string;
  vendor: string;
  message: string;
}

interface RamStats {
  status: TestState;
  selectedMb: number;
  allocatedMb: number;
  elapsedMs: number;
  speedMbS: number;
  message: string;
}

interface MouseStats {
  left: boolean;
  middle: boolean;
  right: boolean;
  doubleClick: boolean;
  wheel: boolean;
  dragging: boolean;
  moves: number;
  x: number;
  y: number;
}

interface MicStats {
  status: TestState;
  level: number;
  peakLevel: number;
  message: string;
}

interface CamStats {
  status: TestState;
  message: string;
}

interface SpeedTestStats {
  status: TestState;
  phase: string;
  progress: number;
  latencyMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  message: string;
}

const KEY_ROWS = [
  ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
  ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
  ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
  ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'ControlRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'],
];

const KEY_LABELS: Record<string, string> = {
  Escape: 'Esc',
  Backquote: '`',
  Backspace: 'Back',
  Tab: 'Tab',
  CapsLock: 'Caps',
  Enter: 'Enter',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  MetaLeft: 'Win',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  Space: 'Space',
  ArrowLeft: 'Left',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowRight: 'Right',
};

@Component({
    selector: 'app-herramientas',
    imports: [CommonModule, FormsModule],
    templateUrl: './herramientas.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./herramientas.component.scss', './herramientas-tests.scss']
})
export class HerramientasComponent implements OnInit, AfterViewInit, OnDestroy {
  private service = inject(HerramientasService);
  private zone = inject(NgZone);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  @ViewChild('gpuCanvas') gpuCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('pixelStage') pixelStage?: ElementRef<HTMLElement>;
  @ViewChild('touchStage') touchStage?: ElementRef<HTMLElement>;

  readonly applicationTabs: ToolTabItem[] = [
    { id: 'equipo', label: 'Equipo', detail: 'Datos' },
    { id: 'ping', label: 'Ping', detail: 'Red' },
    { id: 'velocidad', label: 'Velocidad', detail: 'Navegador' },
    { id: 'qr', label: 'QR', detail: 'Link' },
    { id: 'vencimientos', label: 'Conteo de días', detail: 'Órdenes' },
  ];

  readonly equipmentTestTabs: ToolTabItem[] = [
    { id: 'gpu', label: 'GPU', detail: 'WebGL' },
    { id: 'ram', label: 'RAM', detail: 'Memoria web' },
    { id: 'teclado', label: 'Teclado', detail: 'Entrada' },
    { id: 'mouse', label: 'Mouse', detail: 'Botones' },
    { id: 'pantalla', label: 'Pantalla', detail: 'Pixeles' },
    { id: 'tactil', label: 'Tactil', detail: 'Toques' },
    { id: 'sonido', label: 'Sonido', detail: 'L / R' },
    { id: 'microfono', label: 'Micrófono', detail: 'Audio' },
    { id: 'camara', label: 'Cámara', detail: 'Video' },
  ];

  readonly tabs: ToolTabItem[] = [...this.applicationTabs, ...this.equipmentTestTabs];

  readonly keyRows = KEY_ROWS;

  activeTab: ToolTab = 'equipo';
  equipoReferencia = '';
  equipoState: TestState = 'idle';
  equipoDatos: EquipoDatosResult | null = null;
  equipoError = '';
  pingHost = '8.8.8.8';
  pingState: TestState = 'idle';
  pingResult: PingResult | null = null;
  pingError = '';
  speedStats: SpeedTestStats = {
    status: 'idle',
    phase: 'Lista para iniciar',
    progress: 0,
    latencyMs: 0,
    jitterMs: 0,
    downloadMbps: 0,
    uploadMbps: 0,
    message: 'Mide la conexión a Internet de este navegador.',
  };
  private activeSpeedTest: SpeedTest | null = null;

  get speedGaugeValue(): number {
    if (this.speedStats.phase.includes('subida')) return this.speedStats.uploadMbps;
    if (this.speedStats.phase.includes('descarga') || this.speedStats.status === 'done') return this.speedStats.downloadMbps;
    return this.speedStats.latencyMs;
  }

  get speedGaugeUnit(): string {
    return this.speedStats.phase.includes('latencia') ? 'ms' : 'Mbps';
  }

  get speedGaugeOffset(): number {
    const value = Math.max(0, this.speedGaugeValue);
    const normalized = this.speedGaugeUnit === 'ms'
      ? Math.min(value / 150, 1)
      : Math.min(Math.log10(value + 1) / Math.log10(1001), 1);
    return 283 - (283 * normalized);
  }

  qrLink = '';
  qrFormat: QrFormat = 'png';
  qrDataUrl = '';
  qrSvg = '';
  qrError = '';
  qrSize = 512;

  ordenNumero = '';
  ordenDescripcion = '';
  ordenProveedor = '';
  ordenFechaInicio = this.todayInputValue();
  ordenPlazoDias = 10;
  ordenesServicio: OrdenServicio[] = [];
  ordenesLoading = false;
  ordenesLoadFailed = false;
  ordenSaving = false;
  ordenError = '';

  clientInfo: ClientInfo = this.readClientInfo();

  gpuStats: GpuStats = {
    status: 'idle',
    fps: 0,
    minFps: 0,
    averageFps: 0,
    score: 0,
    objects: 0,
    elapsedSeconds: 0,
    progress: 0,
    renderer: '',
    vendor: '',
    message: 'Listo para iniciar',
  };
  gpuDurationSeconds = 10;
  gpuSphereCount = 300;

  ramStats: RamStats = {
    status: 'idle',
    selectedMb: 128,
    allocatedMb: 0,
    elapsedMs: 0,
    speedMbS: 0,
    message: 'Listo para reservar memoria controlada',
  };

  pressedKeys = new Set<string>();
  testedKeys = new Set<string>();
  lastKey = 'Sin actividad';

  mouseStats: MouseStats = {
    left: false,
    middle: false,
    right: false,
    doubleClick: false,
    wheel: false,
    dragging: false,
    moves: 0,
    x: 0,
    y: 0,
  };

  readonly pixelPatterns: PixelPattern[] = [
    { label: 'Rojo', color: '#ff0000', textColor: '#ffffff' },
    { label: 'Verde', color: '#00ff00', textColor: '#07140a' },
    { label: 'Azul', color: '#0000ff', textColor: '#ffffff' },
    { label: 'Blanco', color: '#ffffff', textColor: '#111827' },
    { label: 'Negro', color: '#000000', textColor: '#ffffff' },
    { label: 'Cian', color: '#00ffff', textColor: '#07140a' },
    { label: 'Magenta', color: '#ff00ff', textColor: '#ffffff' },
    { label: 'Amarillo', color: '#ffff00', textColor: '#111827' },
  ];
  pixelPatternIndex = 0;
  pixelTestActive = false;
  pixelResult: ScreenResult = '';
  pixelReviewed = new Set<number>();

  touchMode: TouchMode = 'multitouch';
  touchPoints: TouchPoint[] = [];
  touchMaxActive = 0;
  touchTotal = 0;
  touchPressureMax = 0;
  touchGestures: string[] = [];
  readonly touchGridColumns = 12;
  readonly touchGridRows = 8;
  touchGrid = Array.from({ length: 96 }, () => false);
  precisionTarget = { x: 50, y: 50 };
  precisionHits = 0;
  precisionErrors: number[] = [];
  private activeTouchPoints = new Map<number, TouchPoint>();
  private readonly touchColors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4f46e5', '#65a30d', '#ea580c'];

  soundPlaying = false;
  soundChannel: SoundChannel = 'both';
  soundFrequency = 440;
  soundVolume = 10;
  soundWave: OscillatorWave = 'sine';
  soundSweepActive = false;
  soundError = '';
  soundResult = '';
  private soundAudioContext: AudioContext | null = null;
  private soundOscillator: OscillatorNode | null = null;
  private soundGain: GainNode | null = null;
  private soundPanner: StereoPannerNode | null = null;
  private soundSweepTimer?: ReturnType<typeof setInterval>;
  private soundStartedAt = 0;

  micStats: MicStats = {
    status: 'idle',
    level: 0,
    peakLevel: 0,
    message: 'Selecciona un microfono e inicia la prueba.',
  };
  micDevices: MediaDeviceInfo[] = [];
  selectedMicId: string | null = null;

  camStats: CamStats = { status: 'idle', message: 'Selecciona una camara e inicia la prueba.' };
  camDevices: MediaDeviceInfo[] = [];
  selectedCamId: string | null = null;

  reportEntries: ReportEntry[] = [];
  reportCopied = false;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private sphereGroup?: THREE.Group;
  private animationFrame = 0;
  private gpuFrameCount = 0;
  private gpuFrameSamples: number[] = [];
  private gpuStartedAt = 0;
  private gpuLastFrameAt = 0;
  // Se conserva mientras dura la prueba para evitar que el recolector libere la memoria medida.
  private ramBuffer: Uint8Array | null = null;
  private micStream: MediaStream | null = null;
  private micAudioContext: AudioContext | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micAnimationFrame = 0;
  private camStream: MediaStream | null = null;

  get testedKeysCount(): number {
    return this.testedKeys.size;
  }

  get keyboardTotal(): number {
    return KEY_ROWS.reduce((total, row) => total + row.length, 0);
  }

  get canManageOrders(): boolean {
    return this.authService.canWrite('herramientas');
  }

  get ordenesActivasCount(): number {
    return this.ordenesServicio.filter((orden) => !orden.finalizada).length;
  }

  get currentPixelPattern(): PixelPattern {
    return this.pixelPatterns[this.pixelPatternIndex];
  }

  get pixelProgress(): number {
    return Math.round((this.pixelReviewed.size / this.pixelPatterns.length) * 100);
  }

  get touchGridCoverage(): number {
    return Math.round((this.touchGrid.filter(Boolean).length / this.touchGrid.length) * 100);
  }

  get precisionAverageError(): number {
    return this.precisionErrors.length ? Math.round(this.average(this.precisionErrors)) : 0;
  }

  ngOnInit(): void {
    const requestedTab = this.route.snapshot.queryParamMap.get('tab') as ToolTab | null;
    if (requestedTab && this.tabs.some((tab) => tab.id === requestedTab)) {
      this.activeTab = requestedTab;
    }
    this.loadOrdenesServicio();
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => this.setupGpuScene(), 0);
  }

  ngOnDestroy(): void {
    this.activeSpeedTest?.pause();
    this.stopPixelTest();
    this.stopSoundTest();
    this.stopGpuTest();
    this.renderer?.dispose();
    this.ramBuffer = null;
    this.stopMicTest();
    this.stopCameraTest();
  }

  selectTab(tab: ToolTab): void {
    if (this.activeTab === 'pantalla' && tab !== 'pantalla') {
      this.stopPixelTest();
    }
    if (this.activeTab === 'sonido' && tab !== 'sonido') {
      this.stopSoundTest();
    }
    if (this.activeTab === 'microfono' && tab !== 'microfono') {
      this.stopMicTest();
    }
    if (this.activeTab === 'camara' && tab !== 'camara') {
      this.stopCameraTest();
    }
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
    if (tab === 'microfono') {
      this.loadMicDevices();
    }
    if (tab === 'camara') {
      this.loadCamDevices();
    }
  }

  async startPixelTest(): Promise<void> {
    this.pixelTestActive = true;
    this.pixelReviewed.add(this.pixelPatternIndex);
    try {
      await this.pixelStage?.nativeElement.requestFullscreen();
    } catch {
      // La prueba sigue disponible en modo expandido cuando el navegador bloquea fullscreen.
    }
  }

  stopPixelTest(): void {
    this.pixelTestActive = false;
    if (document.fullscreenElement === this.pixelStage?.nativeElement) {
      void document.exitFullscreen();
    }
  }

  changePixelPattern(offset: number): void {
    this.pixelPatternIndex = (this.pixelPatternIndex + offset + this.pixelPatterns.length) % this.pixelPatterns.length;
    this.pixelReviewed.add(this.pixelPatternIndex);
  }

  selectPixelPattern(index: number): void {
    this.pixelPatternIndex = index;
    this.pixelReviewed.add(index);
  }

  savePixelResult(): void {
    if (!this.pixelResult) return;
    this.addReport('Pantalla', `${this.pixelProgress}% de patrones revisados; resultado: ${this.pixelResult}; ${this.clientInfo.pantalla}`);
  }

  setTouchMode(mode: TouchMode): void {
    this.touchMode = mode;
    this.touchPoints = [];
    this.activeTouchPoints.clear();
  }

  async enterTouchFullscreen(): Promise<void> {
    try {
      await this.touchStage?.nativeElement.requestFullscreen();
    } catch {
      // El área conserva su tamaño normal si fullscreen no está permitido.
    }
  }

  onTouchPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.touchTotal++;
    this.updateTouchPoint(event);
    this.touchMaxActive = Math.max(this.touchMaxActive, this.activeTouchPoints.size);
    if (this.touchMode === 'precision') this.registerPrecisionHit(event);
  }

  onTouchPointerMove(event: PointerEvent): void {
    if (!this.activeTouchPoints.has(event.pointerId)) return;
    event.preventDefault();
    this.updateTouchPoint(event);
  }

  onTouchPointerUp(event: PointerEvent): void {
    if (!this.activeTouchPoints.has(event.pointerId)) return;
    event.preventDefault();
    this.activeTouchPoints.delete(event.pointerId);
    this.touchPoints = [...this.activeTouchPoints.values()];
    if (!this.activeTouchPoints.size) this.pushGesture('Toque o trazo completado');
  }

  resetTouchTest(): void {
    this.activeTouchPoints.clear();
    this.touchPoints = [];
    this.touchMaxActive = 0;
    this.touchTotal = 0;
    this.touchPressureMax = 0;
    this.touchGestures = [];
    this.touchGrid = Array.from({ length: this.touchGridColumns * this.touchGridRows }, () => false);
    this.precisionHits = 0;
    this.precisionErrors = [];
    this.precisionTarget = { x: 50, y: 50 };
  }

  saveTouchResult(): void {
    const details = this.touchMode === 'zonas'
      ? `cobertura ${this.touchGridCoverage}%`
      : this.touchMode === 'precision'
        ? `${this.precisionHits} objetivos, error medio ${this.precisionAverageError}px`
        : `máximo ${this.touchMaxActive} contactos simultáneos`;
    this.addReport('Pantalla tactil', `${details}; ${this.touchTotal} contactos; presión máxima ${Math.round(this.touchPressureMax * 100)}%`);
  }

  private updateTouchPoint(event: PointerEvent): void {
    const stage = this.touchStage?.nativeElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    const pressure = event.pressure || (event.buttons ? .5 : 0);
    const point: TouchPoint = {
      id: event.pointerId,
      x,
      y,
      pressure,
      color: this.touchColors[Math.abs(event.pointerId) % this.touchColors.length],
    };
    this.activeTouchPoints.set(event.pointerId, point);
    this.touchPoints = [...this.activeTouchPoints.values()];
    this.touchPressureMax = Math.max(this.touchPressureMax, pressure);
    if (this.activeTouchPoints.size === 2) this.pushGesture('Multitouch: 2 contactos');
    if (this.touchMode === 'zonas') {
      const column = Math.min(Math.floor((x / Math.max(rect.width, 1)) * this.touchGridColumns), this.touchGridColumns - 1);
      const row = Math.min(Math.floor((y / Math.max(rect.height, 1)) * this.touchGridRows), this.touchGridRows - 1);
      this.touchGrid[row * this.touchGridColumns + column] = true;
    }
  }

  private registerPrecisionHit(event: PointerEvent): void {
    const stage = this.touchStage?.nativeElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const targetX = rect.width * this.precisionTarget.x / 100;
    const targetY = rect.height * this.precisionTarget.y / 100;
    const actualX = event.clientX - rect.left;
    const actualY = event.clientY - rect.top;
    this.precisionErrors.push(Math.hypot(actualX - targetX, actualY - targetY));
    this.precisionHits++;
    const sequence = [[14, 16], [86, 16], [86, 84], [14, 84], [50, 50], [50, 12], [88, 50], [50, 88], [12, 50]];
    const next = sequence[this.precisionHits % sequence.length];
    this.precisionTarget = { x: next[0], y: next[1] };
  }

  private pushGesture(label: string): void {
    if (this.touchGestures[0] === label) return;
    this.touchGestures = [label, ...this.touchGestures].slice(0, 5);
  }

  async startSoundTest(channel: SoundChannel = this.soundChannel): Promise<void> {
    this.stopSoundTest();
    this.soundError = '';
    this.soundChannel = channel;
    try {
      const context = new AudioContext();
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      oscillator.type = this.soundWave;
      oscillator.frequency.value = this.clampSoundFrequency(this.soundFrequency);
      gain.gain.value = this.clampSoundVolume(this.soundVolume) / 100;
      panner.pan.value = channel === 'left' ? -1 : channel === 'right' ? 1 : 0;
      oscillator.connect(gain).connect(panner).connect(context.destination);
      oscillator.start();
      this.soundAudioContext = context;
      this.soundOscillator = oscillator;
      this.soundGain = gain;
      this.soundPanner = panner;
      this.soundPlaying = true;
    } catch {
      this.soundError = 'El navegador no pudo iniciar la salida de audio. Revise el dispositivo de reproducción.';
      this.stopSoundTest();
    }
  }

  stopSoundTest(): void {
    if (this.soundSweepTimer) clearInterval(this.soundSweepTimer);
    this.soundSweepTimer = undefined;
    this.soundSweepActive = false;
    try { this.soundOscillator?.stop(); } catch { /* ya estaba detenido */ }
    this.soundOscillator?.disconnect();
    this.soundGain?.disconnect();
    this.soundPanner?.disconnect();
    void this.soundAudioContext?.close();
    this.soundOscillator = null;
    this.soundGain = null;
    this.soundPanner = null;
    this.soundAudioContext = null;
    this.soundPlaying = false;
  }

  updateSoundFrequency(value: number): void {
    this.soundFrequency = this.clampSoundFrequency(value);
    this.soundOscillator?.frequency.setValueAtTime(this.soundFrequency, this.soundAudioContext?.currentTime ?? 0);
  }

  updateSoundVolume(value: number): void {
    this.soundVolume = this.clampSoundVolume(value);
    this.soundGain?.gain.setValueAtTime(this.soundVolume / 100, this.soundAudioContext?.currentTime ?? 0);
  }

  updateSoundWave(wave: OscillatorWave): void {
    this.soundWave = wave;
    if (this.soundOscillator) this.soundOscillator.type = wave;
  }

  async startSoundSweep(): Promise<void> {
    await this.startSoundTest('both');
    if (!this.soundPlaying || !this.soundOscillator || !this.soundAudioContext) return;
    this.soundSweepActive = true;
    this.soundStartedAt = performance.now();
    const durationSeconds = 12;
    this.soundOscillator.frequency.cancelScheduledValues(this.soundAudioContext.currentTime);
    this.soundOscillator.frequency.setValueAtTime(40, this.soundAudioContext.currentTime);
    this.soundOscillator.frequency.exponentialRampToValueAtTime(16000, this.soundAudioContext.currentTime + durationSeconds);
    this.soundSweepTimer = setInterval(() => {
      const progress = Math.min((performance.now() - this.soundStartedAt) / (durationSeconds * 1000), 1);
      this.soundFrequency = Math.round(40 * Math.pow(16000 / 40, progress));
      if (progress >= 1) this.stopSoundTest();
    }, 100);
  }

  saveSoundResult(): void {
    if (!this.soundResult) return;
    this.addReport('Sonido', `${this.soundResult}; canales ${this.soundChannel}; frecuencia probada ${this.soundFrequency} Hz`);
  }

  private clampSoundFrequency(value: number): number {
    return Math.max(20, Math.min(Number(value) || 440, 20000));
  }

  private clampSoundVolume(value: number): number {
    return Math.max(0, Math.min(Number(value) || 0, 50));
  }

  runPing(): void {
    const host = this.pingHost.trim();
    if (!host) {
      this.pingError = 'Ingresa una IP o dominio.';
      return;
    }

    this.pingState = 'running';
    this.pingError = '';
    this.pingResult = null;
    this.service.ping(host).subscribe({
      next: (result) => {
        this.pingState = 'done';
        this.pingResult = result;
        this.addReport('Ping', `${result.host}: ${result.status}${result.averageLatencyMs ? `, ${result.averageLatencyMs} ms` : ''}`);
      },
      error: (err) => {
        this.pingState = 'error';
        this.pingError = err?.error?.message ?? 'No se pudo ejecutar la prueba.';
      },
    });
  }

  async runSpeedTest(): Promise<void> {
    if (this.speedStats.status === 'running') return;
    this.speedStats = {
      status: 'running',
      phase: 'Midiendo latencia',
      progress: 5,
      latencyMs: 0,
      jitterMs: 0,
      downloadMbps: 0,
      uploadMbps: 0,
      message: 'Midiendo desde este navegador hacia Internet. No cierres la pestaña.',
    };

    try {
      if (!navigator.onLine) throw new Error('Sin conexión a Internet');
      const measurements = [
        { type: 'latency' as const, numPackets: 10 },
        { type: 'download' as const, bytes: 100_000, count: 5, bypassMinDuration: true },
        { type: 'download' as const, bytes: 1_000_000, count: 5 },
        { type: 'download' as const, bytes: 10_000_000, count: 3 },
        { type: 'download' as const, bytes: 25_000_000, count: 2 },
        { type: 'upload' as const, bytes: 100_000, count: 5, bypassMinDuration: true },
        { type: 'upload' as const, bytes: 1_000_000, count: 4 },
        { type: 'upload' as const, bytes: 10_000_000, count: 2 },
      ];
      const test = new SpeedTest({
        autoStart: false,
        measurements,
        logAimApiUrl: null,
        measureDownloadLoadedLatency: true,
        measureUploadLoadedLatency: true,
      });
      this.activeSpeedTest = test;

      await new Promise<void>((resolve, reject) => {
        test.onPhaseChange = ({ measurementId, measurement }) => {
          this.zone.run(() => {
            this.speedStats.phase = measurement.type === 'latency' ? 'Midiendo latencia'
              : measurement.type === 'download' ? 'Midiendo descarga'
              : 'Midiendo subida';
            this.speedStats.progress = Math.max(5, Math.round((measurementId / measurements.length) * 95));
            this.updateSpeedResults(test.results);
          });
        };
        test.onResultsChange = () => this.zone.run(() => this.updateSpeedResults(test.results));
        test.onFinish = (results) => {
          this.zone.run(() => {
            this.updateSpeedResults(results);
            resolve();
          });
        };
        test.onError = (message) => this.zone.run(() => reject(new Error(message)));
        test.play();
      });

      this.speedStats.status = 'done';
      this.speedStats.phase = 'Prueba completada';
      this.speedStats.progress = 100;
      this.speedStats.message = 'Resultado de la conexión navegador ↔ red perimetral de Cloudflare.';
      this.addReport(
        'Velocidad de red',
        `${this.speedStats.latencyMs} ms; descarga ${this.speedStats.downloadMbps} Mbps; subida ${this.speedStats.uploadMbps} Mbps`,
      );
    } catch (error) {
      this.speedStats.status = 'error';
      this.speedStats.phase = 'No se pudo completar';
      const detail = error instanceof Error ? error.message.trim() : '';
      this.speedStats.message = detail
        ? `La red bloqueó la medición: ${detail}`
        : 'Revisa la conexión, VPN, proxy o firewall e inténtalo nuevamente.';
    } finally {
      this.activeSpeedTest = null;
    }
  }

  private updateSpeedResults(results: CloudflareSpeedResults): void {
    const summary = results.getSummary();
    if (typeof summary.latency === 'number') this.speedStats.latencyMs = this.roundOne(summary.latency);
    if (typeof summary.jitter === 'number') this.speedStats.jitterMs = this.roundOne(summary.jitter);
    if (typeof summary.download === 'number') this.speedStats.downloadMbps = this.roundOne(summary.download / 1_000_000);
    if (typeof summary.upload === 'number') this.speedStats.uploadMbps = this.roundOne(summary.upload / 1_000_000);
  }

  private roundOne(value: number): number {
    return Math.round(value * 10) / 10;
  }

  capturarDatosEquipo(): void {
    this.equipoState = 'running';
    this.equipoError = '';
    this.service.datosEquipo(this.equipoReferencia).subscribe({
      next: (result) => {
        this.equipoState = 'done';
        this.equipoDatos = result;
        this.addReport('Datos equipo', `${result.host} / ${result.ip} / ${result.modelo} / serie ${result.serie} / ${result.capturadoEn}`);
      },
      error: (err) => {
        this.equipoState = 'error';
        this.equipoError = err?.error?.message ?? 'No se pudieron capturar los datos del equipo.';
      },
    });
  }

  async generateQr(): Promise<void> {
    const link = this.qrLink.trim();
    if (!link) {
      this.qrError = 'Ingresa un link para generar el QR.';
      this.qrDataUrl = '';
      this.qrSvg = '';
      return;
    }

    this.qrError = '';
    try {
      this.qrSvg = await QRCode.toString(link, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: this.qrSize,
        color: {
          dark: '#101a12',
          light: '#ffffff',
        },
      });
      this.qrDataUrl = await QRCode.toDataURL(link, {
        type: 'image/png',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: this.qrSize,
        color: {
          dark: '#101a12',
          light: '#ffffff',
        },
      });
      this.addReport('QR', `QR generado para ${link}`);
    } catch {
      this.qrError = 'No se pudo generar el QR para este link.';
      this.qrDataUrl = '';
      this.qrSvg = '';
    }
  }

  clearQr(): void {
    this.qrLink = '';
    this.qrDataUrl = '';
    this.qrSvg = '';
    this.qrError = '';
  }

  get ordenFechaVencimiento(): string {
    return this.calculateDeadlineDate(this.ordenFechaInicio, this.ordenPlazoDias);
  }

  get ordenesOrdenadas(): OrdenServicio[] {
    return [...this.ordenesServicio].sort((a, b) => {
      if (a.finalizada !== b.finalizada) {
        return a.finalizada ? 1 : -1;
      }
      return a.fechaVencimiento.localeCompare(b.fechaVencimiento);
    });
  }

  calcularOrdenVencimiento(): void {
    this.ordenError = this.ordenFechaVencimiento ? '' : 'Selecciona una fecha válida e ingresa un plazo en días.';
  }

  loadOrdenesServicio(): void {
    this.ordenesLoading = true;
    this.ordenesLoadFailed = false;
    this.ordenError = '';
    this.service.getOrdenesServicio().subscribe({
      next: (ordenes) => {
        this.ordenesServicio = Array.isArray(ordenes) ? ordenes : [];
        this.ordenesLoading = false;
      },
      error: (err) => {
        this.ordenesServicio = [];
        this.ordenesLoadFailed = true;
        this.ordenError = err?.error?.message ?? 'No se pudieron cargar las órdenes de servicio.';
        this.ordenesLoading = false;
      },
    });
  }

  guardarOrdenServicio(): void {
    const plazoDias = Number(this.ordenPlazoDias);
    if (!this.ordenNumero.trim() || !this.ordenDescripcion.trim()) {
      this.ordenError = 'Ingresa el número de orden y la descripción del servicio.';
      return;
    }
    if (!this.ordenFechaVencimiento || !Number.isFinite(plazoDias) || plazoDias < 0) {
      this.ordenError = 'Selecciona una fecha válida e ingresa un plazo en días.';
      return;
    }

    this.ordenSaving = true;
    this.ordenError = '';
    this.service.createOrdenServicio({
      numeroOrden: this.ordenNumero.trim(),
      descripcion: this.ordenDescripcion.trim(),
      proveedor: this.ordenProveedor.trim(),
      fechaInicio: this.ordenFechaInicio,
      plazoDias: Math.round(plazoDias),
    }).subscribe({
      next: (orden) => {
        this.ordenesServicio = [orden, ...this.ordenesServicio];
        this.addReport('Orden de servicio', `${orden.numeroOrden}: vence el ${this.formatDate(orden.fechaVencimiento)}`);
        this.limpiarOrdenForm();
        this.ordenSaving = false;
      },
      error: (err) => {
        this.ordenError = err?.error?.message ?? 'No se pudo guardar la orden de servicio.';
        this.ordenSaving = false;
      },
    });
  }

  cambiarEstadoOrden(orden: OrdenServicio): void {
    this.ordenError = '';
    this.service.setOrdenFinalizada(orden.id, !orden.finalizada).subscribe({
      next: (updated) => {
        this.ordenesServicio = this.ordenesServicio.map((item) => item.id === updated.id ? updated : item);
      },
      error: (err) => {
        this.ordenError = err?.error?.message ?? 'No se pudo actualizar la orden.';
      },
    });
  }

  eliminarOrden(orden: OrdenServicio): void {
    if (!window.confirm(`¿Eliminar la orden de servicio ${orden.numeroOrden}?`)) {
      return;
    }
    this.ordenError = '';
    this.service.deleteOrdenServicio(orden.id).subscribe({
      next: () => {
        this.ordenesServicio = this.ordenesServicio.filter((item) => item.id !== orden.id);
      },
      error: (err) => {
        this.ordenError = err?.error?.message ?? 'No se pudo eliminar la orden.';
      },
    });
  }

  limpiarOrdenForm(): void {
    this.ordenNumero = '';
    this.ordenDescripcion = '';
    this.ordenProveedor = '';
    this.ordenFechaInicio = this.todayInputValue();
    this.ordenPlazoDias = 10;
    this.ordenError = '';
  }

  ordenStatus(orden: OrdenServicio): string {
    if (orden.finalizada) {
      return 'Finalizada';
    }
    const days = orden.diasRestantes;
    if (days > 1) {
      return `Faltan ${days} días`;
    }
    if (days === 1) {
      return 'Falta 1 día';
    }
    if (days === 0) {
      return 'Vence hoy';
    }
    if (days === -1) {
      return 'Venció ayer';
    }
    return `Vencida hace ${Math.abs(days)} días`;
  }

  ordenConteoValor(orden: OrdenServicio): number {
    return Math.abs(orden.diasRestantes);
  }

  ordenStatusClass(orden: OrdenServicio): 'ok' | 'warn' | 'bad' | 'done' {
    if (orden.finalizada) {
      return 'done';
    }
    const days = orden.diasRestantes;
    if (days < 0) {
      return 'bad';
    }
    if (days <= 5) {
      return 'warn';
    }
    return 'ok';
  }

  formatDate(dateValue: string): string {
    const date = this.parseInputDate(dateValue);
    if (!date) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  onQrLinkChange(value: string): void {
    this.qrLink = value;
    this.qrDataUrl = '';
    this.qrSvg = '';
    this.qrError = '';
  }

  async downloadQr(): Promise<void> {
    const link = this.qrLink.trim();
    if (!link || (!this.qrDataUrl && !this.qrSvg)) {
      await this.generateQr();
    }
    if (this.qrError || (!this.qrDataUrl && !this.qrSvg)) {
      return;
    }

    const filename = `qr-${this.safeFileName(this.qrLink)}.${this.qrFormat}`;
    if (this.qrFormat === 'svg') {
      this.downloadBlob(new Blob([this.qrSvg], { type: 'image/svg+xml;charset=utf-8' }), filename);
      return;
    }

    if (this.qrFormat === 'png') {
      const blob = await (await fetch(this.qrDataUrl)).blob();
      this.downloadBlob(blob, filename);
      return;
    }

    const jpgBlob = await this.pngDataUrlToJpegBlob(this.qrDataUrl);
    this.downloadBlob(jpgBlob, filename);
  }

  startGpuTest(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.sphereGroup) {
      this.setupGpuScene();
    }
    if (!this.renderer || !this.scene || !this.camera || !this.sphereGroup) {
      this.gpuStats = { ...this.gpuStats, status: 'error', message: 'WebGL no esta disponible en este navegador.' };
      return;
    }

    this.stopGpuTest();
    const duration = this.clampGpuDuration(this.gpuDurationSeconds);
    const sphereCount = this.clampGpuSphereCount(this.gpuSphereCount);
    this.gpuDurationSeconds = duration;
    this.gpuSphereCount = sphereCount;
    this.gpuFrameCount = 0;
    this.gpuFrameSamples = [];
    this.gpuStartedAt = performance.now();
    this.gpuLastFrameAt = this.gpuStartedAt;
    this.gpuStats = {
      ...this.gpuStats,
      status: 'running',
      fps: 0,
      minFps: 0,
      averageFps: 0,
      score: 0,
      objects: sphereCount,
      elapsedSeconds: 0,
      progress: 0,
      message: `Prueba en ejecucion por ${duration} segundos`,
    };
    this.populateSpheres(this.gpuStats.objects);
    this.animateGpu();
  }

  stopGpuTest(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    if (this.gpuStats.status === 'running') {
      this.finishGpuTest();
    }
  }

  runRamTest(): void {
    const selectedMb = Number(this.ramStats.selectedMb);
    const safeMb = Math.max(32, Math.min(selectedMb, 512));
    const bytes = safeMb * 1024 * 1024;

    this.ramStats = {
      ...this.ramStats,
      selectedMb: safeMb,
      status: 'running',
      allocatedMb: 0,
      elapsedMs: 0,
      speedMbS: 0,
      message: 'Reservando y escribiendo memoria',
    };

    window.setTimeout(() => {
      try {
        const started = performance.now();
        const buffer = new Uint8Array(bytes);
        for (let i = 0; i < buffer.length; i += 4096) {
          buffer[i] = (i / 4096) % 255;
        }
        let checksum = 0;
        for (let i = 0; i < buffer.length; i += 8192) {
          checksum = (checksum + buffer[i]) % 100000;
        }
        const elapsed = Math.max(performance.now() - started, 1);
        this.ramBuffer = buffer;
        this.ramStats = {
          ...this.ramStats,
          status: 'done',
          allocatedMb: safeMb,
          elapsedMs: Math.round(elapsed),
          speedMbS: Math.round((safeMb / (elapsed / 1000)) * 10) / 10,
          message: `Prueba completada. Checksum ${checksum}.`,
        };
        this.addReport('RAM web', `${safeMb} MB en ${Math.round(elapsed)} ms`);
      } catch {
        this.ramBuffer = null;
        this.ramStats = {
          ...this.ramStats,
          status: 'error',
          allocatedMb: 0,
          message: 'El navegador bloqueo o no pudo reservar esa cantidad de memoria.',
        };
      }
    }, 50);
  }

  releaseRam(): void {
    const releasedMb = this.ramBuffer ? Math.round(this.ramBuffer.byteLength / (1024 * 1024)) : 0;
    this.ramBuffer = null;
    this.ramStats = {
      ...this.ramStats,
      status: 'idle',
      allocatedMb: 0,
      message: releasedMb > 0 ? `Memoria liberada (${releasedMb} MB)` : 'Memoria liberada',
    };
  }

  loadMicDevices(): void {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.micDevices = devices.filter((device) => device.kind === 'audioinput');
      if (!this.selectedMicId && this.micDevices.length) {
        this.selectedMicId = this.micDevices[0].deviceId;
      }
    });
  }

  micDeviceLabel(device: MediaDeviceInfo, index: number): string {
    return device.label || `Microfono ${index + 1}`;
  }

  startMicTest(): void {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.micStats = {
        ...this.micStats,
        status: 'error',
        message: 'Este navegador o esta conexion no permite acceder al microfono (revisa que estes en HTTPS o localhost).',
      };
      return;
    }

    this.stopMicTest();
    this.micStats = { status: 'running', level: 0, peakLevel: 0, message: 'Escuchando...' };

    const constraints: MediaStreamConstraints = {
      audio: this.selectedMicId ? { deviceId: { exact: this.selectedMicId } } : true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        this.micStream = stream;
        this.micAudioContext = new AudioContext();
        const source = this.micAudioContext.createMediaStreamSource(stream);
        this.micAnalyser = this.micAudioContext.createAnalyser();
        this.micAnalyser.fftSize = 2048;
        source.connect(this.micAnalyser);
        this.loadMicDevices();
        this.animateMic();
      },
      () => {
        this.micStats = {
          ...this.micStats,
          status: 'error',
          message: 'Permiso de microfono denegado o no disponible.',
        };
      },
    );
  }

  stopMicTest(): void {
    if (this.micAnimationFrame) {
      cancelAnimationFrame(this.micAnimationFrame);
      this.micAnimationFrame = 0;
    }
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.micAudioContext?.close();
    this.micAudioContext = null;
    this.micAnalyser = null;

    if (this.micStats.status === 'running') {
      if (this.micStats.peakLevel > 0) {
        const device = this.micDevices.find((d) => d.deviceId === this.selectedMicId);
        const label = device ? this.micDeviceLabel(device, this.micDevices.indexOf(device)) : 'Microfono';
        this.addReport('Microfono', `Nivel pico detectado: ${this.micStats.peakLevel}% - dispositivo: ${label}`);
      }
      this.micStats = { ...this.micStats, status: 'done', message: 'Prueba detenida.' };
    }
  }

  onMicDeviceChange(deviceId: string): void {
    this.selectedMicId = deviceId;
    if (this.micStats.status === 'running') {
      this.startMicTest();
    }
  }

  loadCamDevices(): void {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.camDevices = devices.filter((device) => device.kind === 'videoinput');
      if (!this.selectedCamId && this.camDevices.length) {
        this.selectedCamId = this.camDevices[0].deviceId;
      }
    });
  }

  camDeviceLabel(device: MediaDeviceInfo, index: number): string {
    return device.label || `Camara ${index + 1}`;
  }

  startCameraTest(): void {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.camStats = {
        status: 'error',
        message: 'Este navegador o esta conexion no permite acceder a la camara (revisa que estes en HTTPS o localhost).',
      };
      return;
    }

    this.stopCameraTest();
    this.camStats = { status: 'running', message: 'Iniciando camara...' };

    const constraints: MediaStreamConstraints = {
      video: this.selectedCamId ? { deviceId: { exact: this.selectedCamId } } : true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        this.camStream = stream;
        if (this.cameraVideo) {
          this.cameraVideo.nativeElement.srcObject = stream;
        }
        this.loadCamDevices();
        const device = this.camDevices.find((d) => d.deviceId === this.selectedCamId);
        const label = device ? this.camDeviceLabel(device, this.camDevices.indexOf(device)) : 'Camara';
        this.camStats = { status: 'running', message: 'Vista previa activa.' };
        this.addReport('Camara', `Vista previa activa - dispositivo: ${label}`);
      },
      (err) => {
        const notFound = err?.name === 'NotFoundError';
        this.camStats = {
          status: 'error',
          message: notFound ? 'No se detecto ninguna camara.' : 'Permiso de camara denegado o no disponible.',
        };
      },
    );
  }

  stopCameraTest(): void {
    this.camStream?.getTracks().forEach((track) => track.stop());
    this.camStream = null;
    if (this.cameraVideo) {
      this.cameraVideo.nativeElement.srcObject = null;
    }
    if (this.camStats.status === 'running') {
      this.camStats = { status: 'idle', message: 'Prueba detenida.' };
    }
  }

  onCameraDeviceChange(deviceId: string): void {
    this.selectedCamId = deviceId;
    if (this.camStats.status === 'running') {
      this.startCameraTest();
    }
  }

  private animateMic(): void {
    if (!this.micAnalyser) {
      return;
    }
    const buffer = new Uint8Array(this.micAnalyser.fftSize);
    this.micAnalyser.getByteTimeDomainData(buffer);

    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = buffer[i] / 128 - 1;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const level = Math.min(100, Math.round(rms * 100 * 3));

    this.micStats = {
      ...this.micStats,
      level,
      peakLevel: Math.max(this.micStats.peakLevel, level),
    };

    if (this.micStats.status === 'running') {
      this.micAnimationFrame = requestAnimationFrame(() => this.animateMic());
    }
  }

  resetKeyboard(): void {
    this.pressedKeys.clear();
    this.testedKeys.clear();
    this.lastKey = 'Sin actividad';
  }

  keyLabel(code: string): string {
    if (KEY_LABELS[code]) {
      return KEY_LABELS[code];
    }
    if (code.startsWith('Key')) {
      return code.slice(3);
    }
    if (code.startsWith('Digit')) {
      return code.slice(5);
    }
    if (code.startsWith('F')) {
      return code;
    }
    return code;
  }

  isKeyDown(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  wasKeyTested(code: string): boolean {
    return this.testedKeys.has(code);
  }

  resetMouse(): void {
    this.mouseStats = {
      left: false,
      middle: false,
      right: false,
      doubleClick: false,
      wheel: false,
      dragging: false,
      moves: 0,
      x: 0,
      y: 0,
    };
  }

  onMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.mouseStats = {
      ...this.mouseStats,
      moves: this.mouseStats.moves + 1,
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    };
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.mouseStats = {
      ...this.mouseStats,
      left: this.mouseStats.left || event.button === 0,
      middle: this.mouseStats.middle || event.button === 1,
      right: this.mouseStats.right || event.button === 2,
      dragging: true,
    };
  }

  onMouseUp(): void {
    this.mouseStats = { ...this.mouseStats, dragging: false };
  }

  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    this.mouseStats = { ...this.mouseStats, wheel: true };
  }

  onDoubleClick(): void {
    this.mouseStats = { ...this.mouseStats, doubleClick: true };
  }

  statusText(value: boolean): string {
    return value ? 'Detectado' : 'Pendiente';
  }

  formatBytes(value?: number | null): string {
    if (!value) {
      return '-';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  formatUptime(seconds?: number | null): string {
    if (!seconds) {
      return '-';
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  exportReport(): void {
    const text = this.buildReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reporte-aplicaciones-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  copyReport(): void {
    const text = this.buildReport();
    navigator.clipboard?.writeText(text).then(() => {
      this.reportCopied = true;
      window.setTimeout(() => (this.reportCopied = false), 1800);
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private pngDataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas no disponible'));
          return;
        }
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo crear JPG'));
          }
        }, 'image/jpeg', 0.95);
      };
      image.onerror = () => reject(new Error('No se pudo cargar el QR'));
      image.src = dataUrl;
    });
  }

  private safeFileName(value: string): string {
    return (value.trim().toLowerCase() || 'link')
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'link';
  }

  private calculateDeadlineDate(startDate: string, days: number): string {
    const start = this.parseInputDate(startDate);
    const safeDays = Number(days);
    if (!start || !Number.isFinite(safeDays) || safeDays < 0) {
      return '';
    }
    const result = new Date(start);
    result.setDate(result.getDate() + Math.round(safeDays));
    return this.toInputDate(result);
  }

  private todayInputValue(): string {
    return this.toInputDate(new Date());
  }

  private parseInputDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return this.dateOnly(date);
  }

  private dateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeGpu();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.activeTab === 'pantalla' && this.pixelTestActive) {
      if (event.code === 'ArrowRight' || event.code === 'Space') {
        event.preventDefault();
        this.changePixelPattern(1);
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        this.changePixelPattern(-1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void this.startPixelTest();
      } else if (event.code === 'Escape') {
        this.stopPixelTest();
      }
      return;
    }
    if (this.activeTab !== 'teclado') {
      return;
    }
    event.preventDefault();
    this.pressedKeys.add(event.code);
    this.testedKeys.add(event.code);
    this.lastKey = `${event.key || event.code} (${event.code})`;
    this.addReport('Teclado', `${this.testedKeys.size} teclas detectadas`);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (this.activeTab !== 'teclado') {
      return;
    }
    event.preventDefault();
    this.pressedKeys.delete(event.code);
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement && this.pixelTestActive) {
      this.pixelTestActive = false;
    }
  }

  private setupGpuScene(): void {
    const canvas = this.gpuCanvas?.nativeElement;
    if (!canvas || this.renderer) {
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf8fafc);
      this.camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 200);
      this.camera.position.set(0, 1.6, 13);
      this.sphereGroup = new THREE.Group();
      this.scene.add(this.sphereGroup);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 8, 8);
      this.scene.add(light);
      this.readGpuInfo();
      this.populateSpheres(80);
      this.resizeGpu();
      this.renderer.render(this.scene, this.camera);
    } catch {
      this.gpuStats = { ...this.gpuStats, status: 'error', message: 'No se pudo iniciar WebGL.' };
    }
  }

  private populateSpheres(count: number): void {
    if (!this.sphereGroup) {
      return;
    }
    this.sphereGroup.clear();
    const geometry = new THREE.SphereGeometry(0.18, 24, 16);
    const colors = [0x16a34a, 0x2563eb, 0xd97706, 0x7c3aed, 0x0f766e];

    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.45,
        metalness: 0.18,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const radius = 2 + (i % 9) * 0.24;
      const angle = i * 0.42;
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(i * 0.23) * 2.2,
        Math.sin(angle) * radius,
      );
      this.sphereGroup.add(mesh);
    }
  }

  private animateGpu(): void {
    const now = performance.now();
    const delta = now - this.gpuLastFrameAt;
    this.gpuLastFrameAt = now;
    const fps = delta > 0 ? 1000 / delta : 0;
    this.gpuFrameSamples.push(fps);
    this.gpuFrameCount++;

    if (this.sphereGroup) {
      this.sphereGroup.rotation.y += 0.012;
      this.sphereGroup.rotation.x = Math.sin(now / 1200) * 0.18;
      this.sphereGroup.children.forEach((child, index) => {
        child.position.y += Math.sin(now / 300 + index) * 0.0025;
      });
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    const elapsed = now - this.gpuStartedAt;
    const durationMs = this.clampGpuDuration(this.gpuDurationSeconds) * 1000;
    const recentSamples = this.gpuFrameSamples.slice(-30);
    const average = this.average(recentSamples);
    const min = Math.min(...this.gpuFrameSamples.filter((sample) => Number.isFinite(sample)));
    this.gpuStats = {
      ...this.gpuStats,
      fps: Math.round(fps),
      averageFps: Math.round(average),
      minFps: Number.isFinite(min) ? Math.round(min) : 0,
      score: Math.round((this.gpuStats.objects * Math.max(average, 1)) / 10),
      elapsedSeconds: Math.min(Math.round(elapsed / 100) / 10, this.gpuDurationSeconds),
      progress: Math.min(Math.round((elapsed / durationMs) * 100), 100),
    };

    if (elapsed >= durationMs) {
      this.finishGpuTest();
      return;
    }
    this.animationFrame = requestAnimationFrame(() => this.animateGpu());
  }

  private finishGpuTest(): void {
    const average = this.average(this.gpuFrameSamples);
    const score = Math.round((this.gpuStats.objects * Math.max(average, 1)) / 10);
    this.gpuStats = {
      ...this.gpuStats,
      status: 'done',
      averageFps: Math.round(average),
      elapsedSeconds: this.clampGpuDuration(this.gpuDurationSeconds),
      progress: 100,
      score,
      message: 'Prueba completada',
    };
    this.addReport(
      'GPU web',
      `${this.gpuStats.objects} esferas, ${this.gpuStats.elapsedSeconds}s, ${this.gpuStats.averageFps} FPS promedio, puntaje ${score}`,
    );
    this.animationFrame = 0;
  }

  private clampGpuDuration(value: number): number {
    return Math.max(5, Math.min(Number(value) || 10, 60));
  }

  private clampGpuSphereCount(value: number): number {
    return Math.max(50, Math.min(Number(value) || 300, 2000));
  }

  private resizeGpu(): void {
    if (!this.renderer || !this.camera || !this.gpuCanvas) {
      return;
    }
    const canvas = this.gpuCanvas.nativeElement;
    const width = Math.max(canvas.clientWidth, 320);
    const height = Math.max(canvas.clientHeight, 260);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.scene) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private readGpuInfo(): void {
    const canvas = this.gpuCanvas?.nativeElement;
    const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
    if (!gl) {
      return;
    }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    this.gpuStats = {
      ...this.gpuStats,
      renderer: debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : 'WebGL disponible',
      vendor: debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : 'No expuesto',
    };
  }

  private average(values: number[]): number {
    const finite = values.filter((value) => Number.isFinite(value));
    if (!finite.length) {
      return 0;
    }
    return finite.reduce((sum, value) => sum + value, 0) / finite.length;
  }

  private readClientInfo(): ClientInfo {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { effectiveType?: string; downlink?: number };
    };
    return {
      navegador: nav.userAgent,
      plataforma: nav.platform || '-',
      idioma: nav.language || '-',
      nucleos: nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : '-',
      memoria: nav.deviceMemory ? `${nav.deviceMemory} GB aprox.` : 'No disponible',
      pantalla: `${window.screen.width} x ${window.screen.height}`,
      conexion: nav.connection?.effectiveType
        ? `${nav.connection.effectiveType}${nav.connection.downlink ? `, ${nav.connection.downlink} Mbps` : ''}`
        : 'No disponible',
    };
  }

  private addReport(label: string, value: string): void {
    const index = this.reportEntries.findIndex((entry) => entry.label === label);
    const entry = { label, value };
    if (index >= 0) {
      this.reportEntries[index] = entry;
    } else {
      this.reportEntries.push(entry);
    }
  }

  private buildReport(): string {
    const lines = [
      'Reporte de aplicaciones - Sistema Gestión de Soporte Informático INIA',
      `Fecha: ${new Date().toLocaleString()}`,
      '',
      'Equipo cliente',
      `Plataforma: ${this.clientInfo.plataforma}`,
      `Navegador: ${this.clientInfo.navegador}`,
      `Pantalla: ${this.clientInfo.pantalla}`,
      '',
      'Resultados',
      ...this.reportEntries.map((entry) => `${entry.label}: ${entry.value}`),
    ];

    return lines.join('\n');
  }
}
