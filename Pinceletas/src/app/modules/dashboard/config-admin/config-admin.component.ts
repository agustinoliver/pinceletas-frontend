import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Politicas, Tienda } from '../../../models/config.model';
import { ConfigService } from '../../../services/config.service';


@Component({
  selector: 'app-config-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-admin.component.html',
  styleUrl: './config-admin.component.css'
})
export class ConfigAdminComponent implements OnInit {
  tiendas: Tienda[] = [];
  politicas: Politicas[] = [];
  
  tiendaSeleccionada: Tienda = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  };
  
  politicasSeleccionadas: Politicas = {
    politicaDevolucion: '',
    politicaPrivacidad: ''
  };
  
  modoEdicionTienda = false;
  modoEdicionPoliticas = false;
  mensaje = '';

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.configService.getTiendas().subscribe({
      next: (data) => {
        this.tiendas = data;
        if (data.length > 0) {
          this.tiendaSeleccionada = { ...data[0] };
          this.modoEdicionTienda = true;
        }
      },
      error: (error) => console.error('Error cargando tiendas:', error)
    });

    this.configService.getPoliticas().subscribe({
      next: (data) => {
        this.politicas = data;
        if (data.length > 0) {
          this.politicasSeleccionadas = { ...data[0] };
          this.modoEdicionPoliticas = true;
        }
      },
      error: (error) => console.error('Error cargando políticas:', error)
    });
  }

  guardarTienda(): void {
    if (this.modoEdicionTienda && this.tiendaSeleccionada.id) {
      this.configService.updateTienda(this.tiendaSeleccionada.id, this.tiendaSeleccionada).subscribe({
        next: (data) => {
          this.mensaje = 'Información de tienda actualizada correctamente';
          this.tiendaSeleccionada = data;
        },
        error: (error) => {
          console.error('Error actualizando tienda:', error);
          this.mensaje = 'Error al actualizar la información de tienda';
        }
      });
    } else {
      this.configService.createTienda(this.tiendaSeleccionada).subscribe({
        next: (data) => {
          this.mensaje = 'Información de tienda creada correctamente';
          this.tiendaSeleccionada = data;
          this.modoEdicionTienda = true;
          this.cargarDatos();
          this.recargarFooter();
        },
        error: (error) => {
          console.error('Error creando tienda:', error);
          this.mensaje = 'Error al crear la información de tienda';
        }
      });
    }
  }

  guardarPoliticas(): void {
    if (this.modoEdicionPoliticas && this.politicasSeleccionadas.id) {
      this.configService.updatePoliticas(this.politicasSeleccionadas.id, this.politicasSeleccionadas).subscribe({
        next: (data) => {
          this.mensaje = 'Políticas actualizadas correctamente';
          this.politicasSeleccionadas = data;
        },
        error: (error) => {
          console.error('Error actualizando políticas:', error);
          this.mensaje = 'Error al actualizar las políticas';
        }
      });
    } else {
      this.configService.createPoliticas(this.politicasSeleccionadas).subscribe({
        next: (data) => {
          this.mensaje = 'Políticas creadas correctamente';
          this.politicasSeleccionadas = data;
          this.modoEdicionPoliticas = true;
          this.cargarDatos();
          this.recargarFooter();
        },
        error: (error) => {
          console.error('Error creando políticas:', error);
          this.mensaje = 'Error al crear las políticas';
        }
      });
    }
  }

  limpiarMensaje(): void {
    this.mensaje = '';
  }

  // Agregar este método para recargar el footer después de guardar
 private recargarFooter(): void {
    // Esperar un poco para asegurar que la BD se actualizó
    setTimeout(() => {
      console.log('Disparando evento configUpdated...');
      window.dispatchEvent(new Event('configUpdated'));
    }, 1000);
  }
}