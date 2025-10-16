import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEstadoPedidoModalComponent } from './editar-estado-pedido-modal.component';

describe('EditarEstadoPedidoModalComponent', () => {
  let component: EditarEstadoPedidoModalComponent;
  let fixture: ComponentFixture<EditarEstadoPedidoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEstadoPedidoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEstadoPedidoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
