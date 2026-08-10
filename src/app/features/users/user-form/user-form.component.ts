import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AppError } from '../../../core/models/problem-details.models';
import { UserSummary } from '../models/user.model';
import { UsersApiService } from '../users-api.service';

@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(UsersApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  protected readonly isCreate = this.routeId === null;
  protected readonly loading = signal(this.routeId !== null);
  protected readonly saving = signal(false);
  protected readonly generalError = signal<string | null>(null);

  protected readonly availableRoles = signal<string[]>([]);
  protected readonly user = signal<UserSummary | null>(null);
  protected readonly selectedInitialRoles = signal<string[]>([]);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', this.isCreate ? [Validators.required, Validators.minLength(8)] : []),
    firstName: this.fb.control(''),
    lastName: this.fb.control(''),
  });

  ngOnInit(): void {
    this.api.roles().subscribe((roles) => this.availableRoles.set(roles));

    if (this.routeId) {
      this.api.getById(this.routeId).subscribe({
        next: (user) => {
          this.user.set(user);
          this.form.patchValue(user);
          this.form.get('password')?.clearValidators();
          this.form.get('password')?.updateValueAndValidity();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  toggleInitialRole(role: string, event: MatCheckboxChange): void {
    this.selectedInitialRoles.update((current) =>
      event.checked ? [...current, role] : current.filter((r) => r !== role),
    );
  }

  hasRole(role: string): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  toggleUserRole(role: string, event: MatCheckboxChange): void {
    const userId = this.routeId!;
    const request = event.checked ? this.api.assignRole(userId, role) : this.api.removeRole(userId, role);
    request.subscribe({
      next: () => this.api.getById(userId).subscribe((user) => this.user.set(user)),
      error: (error: AppError) => {
        // The checkbox already flipped visually on click; re-read the real server state so it
        // doesn't keep showing a role change that never actually happened.
        this.api.getById(userId).subscribe((user) => this.user.set(user));
        this.snackBar.open(error.title, 'Dismiss', { duration: 5000 });
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.generalError.set(null);
    this.saving.set(true);
    const value = this.form.getRawValue();

    if (this.isCreate) {
      this.api
        .create({
          email: value.email ?? '',
          password: value.password ?? '',
          firstName: value.firstName || null,
          lastName: value.lastName || null,
          roles: this.selectedInitialRoles(),
        })
        .subscribe({
          next: (user) => {
            this.saving.set(false);
            this.snackBar.open('User created', 'Dismiss', { duration: 3000 });
            this.router.navigate(['..', user.id], { relativeTo: this.route });
          },
          error: (error: AppError) => {
            this.saving.set(false);
            this.applyError(error);
          },
        });
      return;
    }

    this.api
      .update(this.routeId!, {
        email: value.email,
        firstName: value.firstName || null,
        lastName: value.lastName || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Saved', 'Dismiss', { duration: 3000 });
        },
        error: (error: AppError) => {
          this.saving.set(false);
          this.applyError(error);
        },
      });
  }

  private applyError(error: AppError): void {
    if (error.fieldErrors) {
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        const controlKey = field.charAt(0).toLowerCase() + field.slice(1);
        this.form.get(controlKey)?.setErrors({ server: messages.join(' ') });
      }
    } else {
      this.generalError.set(error.detail ?? error.title);
    }
  }
}
