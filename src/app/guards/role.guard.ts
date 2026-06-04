import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router
} from '@angular/router';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const router      = inject(Router);
  const userRole    = localStorage.getItem('role');
  const allowedRoles: string[] = route.data['roles'] ?? [];

  if (!userRole) {
    router.navigate(['/login']);
    return false;
  }

  if (!allowedRoles.includes(userRole)) {
    console.warn(
      `Rôle '${userRole}' non autorisé pour cette route. ` +
      `Rôles acceptés : ${allowedRoles.join(', ')}`
    );
    // ✅ Rediriger vers le dashboard du rôle plutôt que login
    const fallback: Record<string, string> = {
  ADMIN: '/admin-dashboard',
  BUSINESS_ANALYST: '/analyse-dashboard',
  METIER: '/metier-dashboard',
  TECHNIQUE: '/technique-dashboard'
};
    router.navigate([fallback[userRole] ?? '/login']);
    return false;
  }

  return true;
};