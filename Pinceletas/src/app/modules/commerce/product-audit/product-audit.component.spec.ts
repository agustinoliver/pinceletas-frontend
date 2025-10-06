import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAuditComponent } from './product-audit.component';

describe('ProductAuditComponent', () => {
  let component: ProductAuditComponent;
  let fixture: ComponentFixture<ProductAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAuditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
