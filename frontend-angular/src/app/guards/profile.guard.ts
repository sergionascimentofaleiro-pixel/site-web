import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Profile as ProfileService } from '../services/profile';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const profileGuard: CanActivateFn = () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  return profileService.getMyProfile().pipe(
    map(() => {
      // Profile exists, allow access
      return true;
    }),
    catchError(() => {
      // Profile doesn't exist, redirect to profile page
      router.navigate(['/profile']);
      return of(false);
    })
  );
};
