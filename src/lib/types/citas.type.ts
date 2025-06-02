export interface CitasPorIDClienteResponse {
  id_cita: number;
  id_cliente: number;
  fecha_cita: Date;
  hora_inicio: string;
  hora_fin: string;
  nombre_peluquero: string;
  foto_perfil: string;
  tipo_estado: string;
  servicios: string[];
}

// Si la respuesta es un array de citas:
export type CitasPorIDClienteArrayResponse = CitasPorIDClienteResponse[];
