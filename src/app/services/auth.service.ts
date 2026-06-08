import { Injectable, signal } from '@angular/core';
import { AuthResponse, createClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
    auth: {
      storageKey: 'sb-auth-token',
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  currentUser = signal<{ email: string; username: string } | null>(null);
  isEmailConfirmed = signal(false);

  constructor() {
    this.checkExistingSession();

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.updateUserState(session?.user || null);
    });
  }

  private async checkExistingSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      if (session?.user) {
        this.updateUserState(session.user);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  }

  private updateUserState(user: User | null) {
    if (user) {
      this.currentUser.set({
        email: user.email || '',
        username: user.user_metadata?.['username'] || 'User',
      });
      this.isEmailConfirmed.set(user.email_confirmed_at !== null);
    } else {
      this.currentUser.set(null);
      this.isEmailConfirmed.set(false);
    }
  }

  register(email: string, username: string, password: string): Observable<AuthResponse> {
    const redirectUrl = window.location.origin + '/login';
    const promise = this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
        },
      },
    });
    return from(promise);
  }

  login(email: string, password: string) {
    const promise = this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    return from(promise);
  }

  logout() {
    const promise = this.supabase.auth.signOut();
    return from(promise);
  }

  // Resend confirmation email
  resendConfirmationEmail(): Observable<boolean> {
    const promise = this.supabase.auth.resend({
      type: 'signup',
      email: this.currentUser()?.email || '',
    });
    return from(promise).pipe(map(({ error }) => !error));
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
