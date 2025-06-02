export interface UsuarioDB {
  id?: number; // se autogenera en supabase
  name: string;
  email: string;
  phone: string;
  rol: number;
  password: string;
  notificaciones_actividas?: boolean;
}
