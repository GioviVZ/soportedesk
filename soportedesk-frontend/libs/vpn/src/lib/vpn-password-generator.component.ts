
import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Strength = 'Media' | 'Fuerte' | 'Muy fuerte';

@Component({
    selector: 'app-vpn-password-generator',
    imports: [FormsModule],
    templateUrl: './vpn-password-generator.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vpn-password-generator.component.scss'
})
export class VpnPasswordGeneratorComponent implements OnInit {
  @Output() passwordSelected = new EventEmitter<string>();

  readonly minLength = 17;
  readonly maxLength = 64;

  length = 20;
  includeUppercase = true;
  includeLowercase = true;
  includeNumbers = true;
  includeSymbols = true;
  avoidAmbiguous = true;
  generatedPassword = '';
  copied = false;

  private readonly groups = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?/',
  };

  private readonly ambiguous = new Set(['I', 'l', '1', 'O', '0']);

  ngOnInit(): void {
    this.generate();
  }

  get strength(): Strength {
    const selectedGroups = this.selectedGroups.length;
    if (this.length >= 25 && selectedGroups >= 3) return 'Muy fuerte';
    if (this.length >= 16 && selectedGroups >= 3) return 'Fuerte';
    if (this.length >= 20 && selectedGroups >= 2) return 'Fuerte';
    return 'Media';
  }

  get strengthClass(): string {
    return this.strength.toLowerCase().replace(' ', '-');
  }

  get hasSelectedGroup(): boolean {
    return this.selectedGroups.length > 0;
  }

  onLengthChange(): void {
    this.generate();
  }

  onOptionChange(): void {
    if (!this.hasSelectedGroup) {
      this.includeLowercase = true;
    }
    this.generate();
  }

  generate(): void {
    const groups = this.selectedGroups;
    if (groups.length === 0) return;

    const pool = groups.join('');
    const required = groups.map((group) => this.randomChar(group));
    const remainingLength = Math.max(this.length - required.length, 0);
    const chars = [
      ...required,
      ...Array.from({ length: remainingLength }, () => this.randomChar(pool)),
    ];

    this.generatedPassword = this.shuffle(chars).join('');
    this.copied = false;
    this.passwordSelected.emit(this.generatedPassword);
  }

  usePassword(): void {
    this.passwordSelected.emit(this.generatedPassword);
  }

  async copy(): Promise<void> {
    if (!this.generatedPassword || !navigator.clipboard) return;
    await navigator.clipboard.writeText(this.generatedPassword);
    this.copied = true;
  }

  private get selectedGroups(): string[] {
    const groups: string[] = [];
    if (this.includeUppercase) groups.push(this.filterAmbiguous(this.groups.uppercase));
    if (this.includeLowercase) groups.push(this.filterAmbiguous(this.groups.lowercase));
    if (this.includeNumbers) groups.push(this.filterAmbiguous(this.groups.numbers));
    if (this.includeSymbols) groups.push(this.groups.symbols);
    return groups.filter(Boolean);
  }

  private filterAmbiguous(value: string): string {
    if (!this.avoidAmbiguous) return value;
    return Array.from(value).filter((char) => !this.ambiguous.has(char)).join('');
  }

  private randomChar(pool: string): string {
    return pool[this.randomInt(pool.length)];
  }

  private shuffle(chars: string[]): string[] {
    const result = [...chars];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private randomInt(maxExclusive: number): number {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % maxExclusive;
  }
}
