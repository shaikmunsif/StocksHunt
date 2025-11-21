import { Injectable, signal, OnDestroy } from '@angular/core';
import { AuthResponse, createClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { from, Observable, of, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  currentUser = signal<{ email: string; username: string } | null>(null);
  isEmailConfirmed = signal(false);

  private authStateSubject = new BehaviorSubject<User | null>(null);
  private authState$ = this.authStateSubject.asObservable().pipe(distinctUntilChanged());

  constructor() {
    // Check for existing session on service initialization
    this.checkExistingSession();

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      this.updateUserState(session?.user || null);
      this.authStateSubject.next(session?.user || null);
    });
  }

  ngOnDestroy() {
    this.authStateSubject.complete();
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
        console.log('Found existing session for:', session.user.email);
        this.updateUserState(session.user);
        this.authStateSubject.next(session.user);
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
    const promise = this.supabase.auth.signUp({
      email,
      password,
      options: {
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

  // Check if user's email is confirmed (cached version)
  checkEmailConfirmation(): Observable<boolean> {
    return this.authState$.pipe(
      map((user) => {
        if (user) {
          this.isEmailConfirmed.set(user.email_confirmed_at !== null);
          return user.email_confirmed_at !== null;
        }
        return false;
      })
    );
  }

  // Get current user session (cached version)
  getCurrentUser(): Observable<User | null> {
    return this.authState$;
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
