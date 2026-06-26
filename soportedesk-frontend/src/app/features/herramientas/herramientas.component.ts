import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import {
  InstalledProgramInfo,
  PingResult,
  SystemInventoryResponse,
} from './herramientas.model';
import { HerramientasService } from './herramientas.service';

type ToolTab = 'ping' | 'inventario' | 'gpu' | 'ram' | 'teclado' | 'mouse';
type TestState = 'idle' | 'running' | 'done' | 'error';

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
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './herramientas.component.html',
  styleUrl: './herramientas.component.scss',
})
export class HerramientasComponent implements AfterViewInit, OnDestroy {
  private service = inject(HerramientasService);

  @ViewChild('gpuCanvas') gpuCanvas?: ElementRef<HTMLCanvasElement>;

  readonly tabs: ToolTabItem[] = [
    { id: 'ping', label: 'Ping', detail: 'Red' },
    { id: 'inventario', label: 'Inventario', detail: 'Sistema' },
    { id: 'gpu', label: 'GPU', detail: 'WebGL' },
    { id: 'ram', label: 'RAM', detail: 'Memoria web' },
    { id: 'teclado', label: 'Teclado', detail: 'Entrada' },
    { id: 'mouse', label: 'Mouse', detail: 'Botones' },
  ];

  readonly keyRows = KEY_ROWS;

  activeTab: ToolTab = 'ping';
  pingHost = '8.8.8.8';
  pingState: TestState = 'idle';
  pingResult: PingResult | null = null;
  pingError = '';

  inventoryState: TestState = 'idle';
  inventory: SystemInventoryResponse | null = null;
  inventoryError = '';
  programSearch = '';

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
  keyboardCapture = false;

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
  private ramBuffer: Uint8Array | null = null;

  get filteredPrograms(): InstalledProgramInfo[] {
    const programs = this.inventory?.installedPrograms ?? [];
    const term = this.programSearch.trim().toLowerCase();
    if (!term) {
      return programs;
    }
    return programs.filter((program) =>
      [program.name, program.version, program.publisher, program.installDate]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }

  get testedKeysCount(): number {
    return this.testedKeys.size;
  }

  get keyboardTotal(): number {
    return KEY_ROWS.reduce((total, row) => total + row.length, 0);
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => this.setupGpuScene(), 0);
  }

  ngOnDestroy(): void {
    this.stopGpuTest();
    this.renderer?.dispose();
    this.ramBuffer = null;
  }

  selectTab(tab: ToolTab): void {
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'inventario' && this.inventoryState === 'idle') {
      this.loadInventory();
    }
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
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

  loadInventory(): void {
    this.inventoryState = 'running';
    this.inventoryError = '';
    this.service.inventory().subscribe({
      next: (data) => {
        this.inventory = data;
        this.inventoryState = 'done';
        this.addReport('Inventario', `${data.computerName || 'Equipo'} - ${data.operatingSystem || 'SO no detectado'}`);
      },
      error: (err) => {
        this.inventoryState = 'error';
        this.inventoryError = err?.error?.message ?? 'No se pudo cargar el inventario.';
      },
    });
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
    this.ramBuffer = null;
    this.ramStats = {
      ...this.ramStats,
      status: 'idle',
      allocatedMb: 0,
      message: 'Memoria liberada',
    };
  }

  enableKeyboardCapture(): void {
    this.keyboardCapture = true;
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
    anchor.download = `reporte-herramientas-${new Date().toISOString().slice(0, 10)}.txt`;
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

  @HostListener('window:resize')
  onResize(): void {
    this.resizeGpu();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.keyboardCapture || this.activeTab !== 'teclado') {
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
    if (!this.keyboardCapture || this.activeTab !== 'teclado') {
      return;
    }
    event.preventDefault();
    this.pressedKeys.delete(event.code);
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
      'Reporte de herramientas - SoporteDesk INIA',
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

    if (this.inventory) {
      lines.push(
        '',
        'Inventario backend',
        `Equipo: ${this.inventory.computerName || '-'}`,
        `SO: ${this.inventory.operatingSystem || '-'} ${this.inventory.osVersion || ''}`.trim(),
        `CPU: ${this.inventory.availableProcessors || '-'} nucleos`,
        `Disco libre: ${this.formatBytes(this.inventory.freeDiskBytes)}`,
        `Programas detectados: ${this.inventory.installedPrograms?.length ?? 0}`,
      );
    }

    return lines.join('\n');
  }
}
