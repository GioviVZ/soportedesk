import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { LayoutService } from '../../core/services/layout.service';
import { RealtimeService } from '../../core/services/realtime.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
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
