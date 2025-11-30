import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IconsComponent } from '../svg/icons';

@Component({
  selector: 'app-register',
  imports: [RouterModule, ReactiveFormsModule, IconsComponent],
  templateUrl: './register.html',
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  registrationForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage = signal<string | null>(null);
  registrationSuccess = signal(false);
  registeredEmail = signal('');
  isLoading = signal(false);

  onSubmit() {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.registrationForm.value;

    this.authService
      .register(formData.email!, formData.username!, formData.password!)
      .subscribe((result) => {
        this.isLoading.set(false);
        if (result.error) {
          this.errorMessage.set(result.error.message);
        } else {
          // Registration successful - show email confirmation message
          this.registrationSuccess.set(true);
          this.registeredEmail.set(formData.email!);
          this.errorMessage.set(null);
        }
      });
  }

  resendConfirmationEmail() {
    this.authService.resendConfirmationEmail().subscribe((success) => {
      if (success) {
        // Successfully resent - UI already shows success state
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
