import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerminosCondiciones } from '../../../models/config.model';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-terminos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminos-modal.component.html',
  styleUrls: ['./terminos-modal.component.css']
})
export class TerminosModalComponent {
  @Input() terminosConfig: TerminosCondiciones | null = null;
  @Input() showModal: boolean = false;
  @Output() modalClosed = new EventEmitter<boolean>();
  
  aceptado = false;

  // NUEVO MÉTODO: Formatear texto con saltos de línea
  formatearTexto(texto: string | undefined): string {
    if (!texto) {
      return 'Contenido no configurado';
    }
    return texto.replace(/\n/g, '<br>');
  }

  onAceptar() {
    if (this.aceptado) {
      this.modalClosed.emit(true);
    }
  }

  onRechazar() {
    this.modalClosed.emit(false);
  }

  closeModal() {
    this.modalClosed.emit(false);
  }
}