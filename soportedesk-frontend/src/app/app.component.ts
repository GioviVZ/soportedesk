import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './app.component.html'
})
export class AppComponent {
  private theme = inject(ThemeService);
}
