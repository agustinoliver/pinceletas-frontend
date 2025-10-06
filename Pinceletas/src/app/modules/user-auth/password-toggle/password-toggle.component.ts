import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-toggle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-toggle.component.html',
  styleUrl: './password-toggle.component.css'
})
export class PasswordToggleComponent {
  @Input() control!: FormControl;
  @Input() placeholder: string = '';
  
  showPassword = false;
  
  get type(): string {
    return this.showPassword ? 'text' : 'password';
  }
  
  get iconClass(): string {
    return this.showPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  }
  
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
