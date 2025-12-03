import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IconsComponent } from '../svg/icons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule, IconsComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);
  showWelcomeMessage = signal(false);
  userName = signal('');
  needsEmailConfirmation = signal(false);

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.needsEmailConfirmation.set(false);

    const formData = this.loginForm.value;

    this.authService.login(formData.email!, formData.password!).subscribe((result) => {
      this.isLoading.set(false);
      if (result.error) {
        // Check if error is due to unconfirmed email
        if (result.error.message?.includes('Email not confirmed')) {
          this.needsEmailConfirmation.set(true);
          this.errorMessage.set(
            'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
          );
        } else {
          this.errorMessage.set(result.error.message);
        }
      } else if (result.data?.session) {
        // Login successful - check email confirmation using session data directly
        // This avoids race condition with onAuthStateChange
        const user = result.data.session.user;
        const isConfirmed = user.email_confirmed_at !== null;

        if (isConfirmed) {
          // Navigate to stock-data-entry page
          this.router.navigate(['/stock-data-entry']);
        } else {
          this.needsEmailConfirmation.set(true);
          this.errorMessage.set(
            'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
          );
        }
      }
    });
  }

  resendConfirmationEmail() {
    this.authService.resendConfirmationEmail().subscribe((success) => {
      if (success) {
        this.errorMessage.set('Confirmation email resent! Please check your inbox.');
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
