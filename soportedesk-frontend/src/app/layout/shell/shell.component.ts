import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { LayoutService } from '@soportedesk/core';
import { RealtimeService } from '@soportedesk/core';

@Component({
    selector: 'app-shell',
    imports: [RouterOutlet, SidebarComponent, HeaderComponent],
    templateUrl: './shell.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly layout = inject(LayoutService);
  private realtime = inject(RealtimeService);

  ngOnInit(): void {
    this.realtime.start();
  }

  ngOnDestroy(): void {
    this.realtime.stop();
  }
}
