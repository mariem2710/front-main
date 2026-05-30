import { inject } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router
} from '@angular/router';

export const roleGuard: CanActivateFn = (

  route: ActivatedRouteSnapshot

) => {

  const router = inject(Router);

  const userRole =
    localStorage.getItem('role');

  const allowedRoles =
    route.data['roles'];

  if (!userRole) {

    router.navigate(['/login']);

    return false;
  }

  if (!allowedRoles.includes(userRole)) {

    router.navigate(['/login']);

    return false;
  }

  return true;
};