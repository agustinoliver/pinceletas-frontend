import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionEnvio, ConfiguracionEnvioRequest, TerminosCondiciones, Tienda } from '../../../models/config.model';
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
  terminosCondiciones: TerminosCondiciones[] = [];
  configuracionesEnvio: ConfiguracionEnvio[] = [];
  
  tiendaSeleccionada: Tienda = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  };
  
  terminosSeleccionados: TerminosCondiciones = {
    terminosServicio: '',
    politicaPrivacidad: ''
  };
  
  configuracionEnvioSeleccionada: ConfiguracionEnvioRequest = {
    nombre: '',
    costo: undefined as any,
    montoMinimoEnvioGratis: undefined as any,
    activo: true
  };
  
  modoEdicionTienda = false;
  modoEdicionTerminos = false;
  modoEdicionEnvio = false;
  configuracionEnvioIdEdicion: number | null = null;
  mensaje = '';

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cargar tiendas
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

    // Cargar términos y condiciones
    this.configService.getTerminosCondiciones().subscribe({
      next: (data) => {
        this.terminosCondiciones = data;
        if (data.length > 0) {
          this.terminosSeleccionados = { ...data[0] };
          this.modoEdicionTerminos = true;
        }
      },
      error: (error) => console.error('Error cargando términos y condiciones:', error)
    });

    // Cargar configuraciones de envío
    this.configService.getConfiguracionesEnvio().subscribe({
      next: (data) => {
        this.configuracionesEnvio = data;
      },
      error: (error) => console.error('Error cargando configuraciones de envío:', error)
    });
  }

  seleccionarConfiguracionEnvio(configuracion: ConfiguracionEnvio): void {
    this.configuracionEnvioSeleccionada = {
      nombre: configuracion.nombre,
      costo: configuracion.costo,
      montoMinimoEnvioGratis: configuracion.montoMinimoEnvioGratis,
      activo: configuracion.activo
    };
    this.configuracionEnvioIdEdicion = configuracion.id!;
    this.modoEdicionEnvio = true;
  }

  nuevaConfiguracionEnvio(): void {
    this.configuracionEnvioSeleccionada = {
      nombre: '',
      costo: 2500,
      montoMinimoEnvioGratis: 50000,
      activo: true
    };
    this.configuracionEnvioIdEdicion = null;
    this.modoEdicionEnvio = false;
  }

  guardarConfiguracionEnvio(): void {
      const payload: ConfiguracionEnvioRequest = {
      ...this.configuracionEnvioSeleccionada,
      costo: this.configuracionEnvioSeleccionada.costo || 0,
      montoMinimoEnvioGratis: this.configuracionEnvioSeleccionada.montoMinimoEnvioGratis || 0
    };
  
    if (this.modoEdicionEnvio && this.configuracionEnvioIdEdicion) {
      this.configService.updateConfiguracionEnvio(this.configuracionEnvioIdEdicion, payload)
        .subscribe({
          next: () => {
            this.mensaje = 'Configuración de envío actualizada correctamente';
            this.cargarDatos();
            this.nuevaConfiguracionEnvio();
          },
          error: (error) => {
            console.error('Error actualizando configuración de envío:', error);
            this.mensaje = 'Error al actualizar la configuración de envío';
          }
        });
    } else {
      this.configService.createConfiguracionEnvio(payload)
        .subscribe({
          next: () => {
            this.mensaje = 'Configuración de envío creada correctamente';
            this.cargarDatos();
            this.nuevaConfiguracionEnvio();
          },
          error: (error) => {
            console.error('Error creando configuración de envío:', error);
            this.mensaje = 'Error al crear la configuración de envío';
          }
        });
    }
  }

  eliminarConfiguracionEnvio(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta configuración de envío?')) {
      this.configService.deleteConfiguracionEnvio(id).subscribe({
        next: () => {
          this.mensaje = 'Configuración de envío eliminada correctamente';
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error eliminando configuración de envío:', error);
          this.mensaje = 'Error al eliminar la configuración de envío';
        }
      });
    }
  }

  // Los métodos existentes para tienda y términos se mantienen igual...
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

  guardarTerminosCondiciones(): void {
    if (this.modoEdicionTerminos && this.terminosSeleccionados.id) {
      this.configService.updateTerminosCondiciones(this.terminosSeleccionados.id, this.terminosSeleccionados).subscribe({
        next: (data) => {
          this.mensaje = 'Términos y condiciones actualizados correctamente';
          this.terminosSeleccionados = data;
        },
        error: (error) => {
          console.error('Error actualizando términos y condiciones:', error);
          this.mensaje = 'Error al actualizar los términos y condiciones';
        }
      });
    } else {
      this.configService.createTerminosCondiciones(this.terminosSeleccionados).subscribe({
        next: (data) => {
          this.mensaje = 'Términos y condiciones creados correctamente';
          this.terminosSeleccionados = data;
          this.modoEdicionTerminos = true;
          this.cargarDatos();
          this.recargarFooter();
        },
        error: (error) => {
          console.error('Error creando términos y condiciones:', error);
          this.mensaje = 'Error al crear los términos y condiciones';
        }
      });
    }
  }

  limpiarMensaje(): void {
    this.mensaje = '';
  }

  private recargarFooter(): void {
    setTimeout(() => {
      console.log('Disparando evento configUpdated...');
      window.dispatchEvent(new Event('configUpdated'));
    }, 1000);
  }
}