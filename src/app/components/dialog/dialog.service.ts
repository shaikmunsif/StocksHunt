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
} from '@angular/core';
import { DialogComponent } from './dialog.component';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialogComponentRef?: ComponentRef<DialogComponent>;
  private authService = inject(AuthService);

  constructor(private appRef: ApplicationRef, private injector: EnvironmentInjector) {
    this.createDialogComponent();
    this.setupAuthListener();
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
}
