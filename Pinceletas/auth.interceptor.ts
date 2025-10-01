import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b21hc2hlcnJhZG9AZ2FtaWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5MzQ5Nzc0LCJleHAiOjE3NTkzNTMzNzR9.SlsBkw1EDsFJGHThLcxUFQebRFcus1HBJp-uuxgiAgw';
  
  // Clonar la request y agregar el header Authorization
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedRequest);
};