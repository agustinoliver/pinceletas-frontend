import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
  isRainbow = false;
  isSpinning = false;

  activateRainbow() {
    this.isRainbow = true;
  }

  deactivateRainbow() {
    this.isRainbow = false;
  }

  toggleSpin() {
    this.isSpinning = !this.isSpinning;
  }
}