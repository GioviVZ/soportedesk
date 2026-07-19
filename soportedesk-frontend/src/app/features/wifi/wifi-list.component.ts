import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { WifiFormComponent } from './wifi-form.component';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';
import QRCode from 'qrcode';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-wifi-list',
    imports: [GenericTableComponent, ModalComponent, FieldComponent, WifiFormComponent],
    templateUrl: './wifi-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './wifi-list.component.scss'
})
export class WifiListComponent implements OnInit {
  private service = inject(WifiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  items: Wifi[] = [];
  columns: TableColumn[] = [
    { key: 'ssid', label: 'SSID' },
    { key: 'clave', label: 'Clave' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Wifi | null = null;
  editing: Wifi | null = null;
  formOpen = false;
  qrDataUrl: string | null = null;
  qrError: string | null = null;
  qrCopied = false;

  get activas(): number {
    return this.items.filter((item) => item.estado?.toLowerCase() === 'activa').length;
  }

  get inactivas(): number {
    return this.items.length - this.activas;
  }

  get canWrite(): boolean {
    return this.authService.canWrite('wifi');
  }

  get canManage(): boolean {
    return this.route.snapshot.data['mode'] === 'administracion' && this.canWrite;
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  async onView(item: Wifi): Promise<void> {
    this.viewing = item;
    await this.generateQr(item);
  }

  closeView(): void {
    this.viewing = null;
    this.qrDataUrl = null;
    this.qrError = null;
    this.qrCopied = false;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Wifi): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Wifi): void {
    if (!confirm(`¿Eliminar la red "${item.ssid}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  get wifiQrPayload(): string {
    return this.viewing ? this.buildWifiPayload(this.viewing) : '';
  }

  qrSecurityType(wifi: Wifi): string {
    const type = wifi.tipo?.trim().toUpperCase() ?? '';
    if (/(ABIERTA|OPEN|LIBRE|SIN CLAVE|SIN CONTRASENA|SIN CONTRASEÑA|NOPASS)/.test(type)) {
      return 'nopass';
    }
    if (type.includes('WEP')) {
      return 'WEP';
    }
    return 'WPA';
  }

  async copyQrPayload(): Promise<void> {
    if (!this.wifiQrPayload) {
      return;
    }

    await this.copyText(this.wifiQrPayload);
    this.qrCopied = true;
    setTimeout(() => (this.qrCopied = false), 1800);
  }

  downloadQr(): void {
    if (!this.viewing || !this.qrDataUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `wifi-${this.slugify(this.viewing.ssid)}.png`;
    link.click();
  }

  private async generateQr(wifi: Wifi): Promise<void> {
    this.qrDataUrl = null;
    this.qrError = null;
    this.qrCopied = false;

    try {
      this.qrDataUrl = await QRCode.toDataURL(this.buildWifiPayload(wifi), {
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 8,
        color: {
          dark: '#101a12',
          light: '#ffffff',
        },
      });
    } catch {
      this.qrError = 'No se pudo generar el QR para esta red.';
    }
  }

  private buildWifiPayload(wifi: Wifi): string {
    const security = this.qrSecurityType(wifi);
    const ssid = this.escapeWifiValue(wifi.ssid);

    if (security === 'nopass') {
      return `WIFI:T:nopass;S:${ssid};;`;
    }

    return `WIFI:T:${security};S:${ssid};P:${this.escapeWifiValue(wifi.clave)};;`;
  }

  private escapeWifiValue(value: string): string {
    return value.replace(/([\\;,":])/g, '\\$1');
  }

  private async copyText(value: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'red';
  }
}
