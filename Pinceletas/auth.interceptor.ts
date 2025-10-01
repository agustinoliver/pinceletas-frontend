import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b21hc2hlcnJhZG9AZ2FtaWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5MzU2MTkxLCJleHAiOjE3NTkzNTk3OTF9.3zQa8JVOXLvox4OoXhlrY5PP_bKu2la_EZ1qPXyRlrQ';
  // Clonar la request y agregar el header Authorization
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedRequest);
};