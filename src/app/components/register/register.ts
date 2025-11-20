import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IconsComponent } from '../svg/icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IconsComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
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
    console.log(formData);

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
        // Show success message or update UI
        console.log('Confirmation email resent successfully');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
