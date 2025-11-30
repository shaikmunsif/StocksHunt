import {
  Injectable,
  ComponentRef,
  Type,
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  Injector,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { DialogComponent } from './dialog.component';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private dialogComponentRef?: ComponentRef<DialogComponent>;
  private routerSubscription?: Subscription;

  constructor() {
    this.createDialogComponent();
    this.setupAuthListener();
    this.setupRouterListener();
  }

  private setupAuthListener() {
    // Close dialog when user logs out using Angular effect
    effect(() => {
      const user = this.authService.currentUser();
      if (!user && this.dialogComponentRef?.instance.isOpen()) {
        this.close();
      }
    });
  }

  /**
   * Sets up a listener to automatically close dialogs when route navigation starts.
   * This prevents dialogs from persisting across different views, maintaining proper context.
   */
  private setupRouterListener() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => {
        if (this.dialogComponentRef?.instance.isOpen()) {
          this.close();
        }
      });

    // Ensure cleanup on app destroy (for completeness)
    this.destroyRef.onDestroy(() => {
      this.routerSubscription?.unsubscribe();
    });
  }

  private createDialogComponent() {
    // Create the dialog component and attach it to the body
    this.dialogComponentRef = createComponent(DialogComponent, {
      environmentInjector: this.injector,
    });

    document.body.appendChild(this.dialogComponentRef.location.nativeElement);
    this.appRef.attachView(this.dialogComponentRef.hostView);
  }

  open<T extends object>(component: Type<T>, data?: Partial<T>) {
    if (!this.dialogComponentRef) {
      this.createDialogComponent();
    }
    return this.dialogComponentRef!.instance.open(component, data);
  }

  close() {
    this.dialogComponentRef?.instance.close();
  }

  // Note: Service providedIn: 'root' lives for app lifetime; explicit teardown is handled via DestroyRef
}
