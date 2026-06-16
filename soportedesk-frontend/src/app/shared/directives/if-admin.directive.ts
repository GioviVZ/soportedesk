import { Directive, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Directive({
  selector: '[ifAdmin]',
  standalone: true,
})
export class IfAdminDirective implements OnInit {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
