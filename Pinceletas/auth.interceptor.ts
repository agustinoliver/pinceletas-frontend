import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserAuthService } from './src/app/services/user-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(UserAuthService);
  // const token = authService.getToken();
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b21hc2hlcnJhZG9AZ2FtaWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5NTE5ODUzLCJleHAiOjE3NTk1MjM0NTN9.Vla_2QAEOCndfWpNMB_OYnIpPL6w7Mf2HzV0n3IBRtA';

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};