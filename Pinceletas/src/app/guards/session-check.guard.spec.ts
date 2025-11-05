import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { sessionCheckGuard } from './session-check.guard';

describe('sessionCheckGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => sessionCheckGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
