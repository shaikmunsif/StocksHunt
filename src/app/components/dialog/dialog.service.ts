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
  OnDestroy,
} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DialogComponent } from './dialog.component';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService implements OnDestroy {
  private dialogComponentRef?: ComponentRef<DialogComponent>;
  private authService = inject(AuthService);
  private router = inject(Router);
  private routerSubscription?: any;

  constructor(private appRef: ApplicationRef, private injector: EnvironmentInjector) {
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
  }

  private createDialogComponent() {
    // Create the dialog component and attach it to the body
    this.dialogComponentRef = createComponent(DialogComponent, {
      environmentInjector: this.injector,
    });

    document.body.appendChild(this.dialogComponentRef.location.nativeElement);
    this.appRef.attachView(this.dialogComponentRef.hostView);
  }

  open<T>(component: Type<T>, data?: any) {
    if (!this.dialogComponentRef) {
      this.createDialogComponent();
    }
    return this.dialogComponentRef!.instance.open(component, data);
  }

  close() {
    this.dialogComponentRef?.instance.close();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
