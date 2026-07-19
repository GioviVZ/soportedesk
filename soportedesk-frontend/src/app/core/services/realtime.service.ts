import { Injectable, NgZone, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface RealtimeChange {
  modulo: string;
  accion: string;
  entidadId: string | null;
  usuario: string;
  fecha: string;
}

export const REALTIME_CHANGE_EVENT = 'soportedesk:data-change';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private controller: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    if (this.controller || !this.auth.getToken()) return;
    this.connect();
  }

  stop(): void {
    this.controller?.abort();
    this.controller = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private async connect(): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;
    this.controller = new AbortController();
    try {
      const response = await fetch(`${environment.apiUrl}/realtime/events`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: this.controller.signal,
      });
      if (!response.ok || !response.body) throw new Error('SSE no disponible');
      await this.readStream(response.body);
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') this.scheduleReconnect();
    } finally {
      this.controller = null;
    }
  }

  private async readStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        this.handleBlock(block);
      }
    }
    this.scheduleReconnect();
  }

  private handleBlock(block: string): void {
    if (!block.split('\n').some((line) => line === 'event:change')) return;
    const data = block.split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    try {
      const change = JSON.parse(data) as RealtimeChange;
      this.zone.run(() => window.dispatchEvent(new CustomEvent<RealtimeChange>(REALTIME_CHANGE_EVENT, { detail: change })));
    } catch {
      // Se ignoran mensajes incompletos; la conexion continua activa.
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.auth.getToken()) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.controller) this.connect();
    }, 3000);
  }
}
