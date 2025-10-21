import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoAuditComponent } from './pedido-audit.component';

describe('PedidoAuditComponent', () => {
  let component: PedidoAuditComponent;
  let fixture: ComponentFixture<PedidoAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoAuditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidoAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
