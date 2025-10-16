import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-pending.component.html',
  styleUrl: './payment-pending.component.css'
})
export class PaymentPendingComponent implements OnInit{
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Pago pendiente');
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }
}
