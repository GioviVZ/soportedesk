import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '@soportedesk/core';
import { environment } from '../../../environments/environment';
import { MonitorPingEvent } from './herramientas.model';

@Injectable({ providedIn: 'root' })
export class MonitorPingStreamService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);

  events(): Observable<MonitorPingEvent> {
    return new Observable<MonitorPingEvent>((subscriber) => {
      let controller: AbortController | null = null;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      let closed = false;

      const scheduleReconnect = (): void => {
        if (closed || reconnectTimer || !this.auth.getToken()) return;
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          void connect();
        }, 3000);
      };

      const handleBlock = (block: string): void => {
        if (!block.split('\n').some((line) => line === 'event:sample')) return;
        const data = block.split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        try {
          const event = JSON.parse(data) as MonitorPingEvent;
          this.zone.run(() => subscriber.next(event));
        } catch {
          // Un evento incompleto no debe interrumpir el canal.
        }
      };

      const readStream = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            handleBlock(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
          }
        }
      };

      const connect = async (): Promise<void> => {
        const token = this.auth.getToken();
        if (!token || closed) return;
        controller = new AbortController();
        try {
          const response = await fetch(`${environment.apiUrl}/herramientas/monitores-ping/events`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) throw new Error('Canal de monitoreo no disponible');
          await readStream(response.body);
        } catch (error) {
          if ((error as DOMException)?.name !== 'AbortError') scheduleReconnect();
        } finally {
          controller = null;
          if (!closed) scheduleReconnect();
        }
      };

      void connect();

      return () => {
        closed = true;
        controller?.abort();
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };
    });
  }
}
