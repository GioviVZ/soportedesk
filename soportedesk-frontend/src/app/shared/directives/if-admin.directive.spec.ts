import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { IfAdminDirective } from './if-admin.directive';

@Component({
    imports: [IfAdminDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: '<div *ifAdmin class="admin-only">Solo admin</div>'
})
class HostComponent {}

describe('IfAdminDirective', () => {
  function createFixture(isAdminVal: boolean): ComponentFixture<HostComponent> {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);
    authSpy.isAdmin.and.returnValue(isAdminVal);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should show element for admin', () => {
    const fixture = createFixture(true);
    const el = fixture.nativeElement.querySelector('.admin-only');
    expect(el).not.toBeNull();
    expect(el.textContent.trim()).toBe('Solo admin');
  });

  it('should hide element for non-admin', () => {
    const fixture = createFixture(false);
    const el = fixture.nativeElement.querySelector('.admin-only');
    expect(el).toBeNull();
  });
});
