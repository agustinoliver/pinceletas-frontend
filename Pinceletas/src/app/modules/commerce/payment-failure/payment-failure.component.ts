import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-failure.component.html',
  styleUrl: './payment-failure.component.css'
})
export class PaymentFailureComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Pago fallido');
  }

  reintentarPago(): void {
    this.router.navigate(['/carrito']);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }
}
