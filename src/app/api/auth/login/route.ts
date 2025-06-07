import { desincriptar } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { corsHeaders } from "@/utils/cors";
import jwt from "jsonwebtoken";
export const runtime = "nodejs";

// Tipos para la solicitud y respuesta
type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  id: string;
  email: string;
  name: string;
  phone: string;
  notificacions?: boolean;
  rol: number[];
  token?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    // Parsear el cuerpo de la solicitud
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validar los datos de entrada
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Correo electrónico y contraseña son requeridos",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Buscar usuario por nombre en la base de datos
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, password, phone, notificaciones_activadas, name, rol")
      .eq("email", email)
      .single();

    if (userError?.code === "PGRST116" || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Usuario no encontrado",
          userError,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Con Supabase, lo ideal es usar auth.signInWithPassword, pero para este ejemplo
    // estamos comparando passwords manualmente.
    // En un entorno real, deberías usar bcrypt para verificar las contraseñas

    let passwordDesencriptada = "";

    //Esto es porque tengo las contrasenas creadas antes del sistema de encriptacion
    if (user.password === "dani") {
      passwordDesencriptada = "dani";
    } else {
      passwordDesencriptada = desincriptar(user.password);
    }

    if (passwordDesencriptada !== password) {
      // Esto es solo para el ejemplo, NO es seguro en producción
      return new Response(
        JSON.stringify({ success: false, message: "Contraseña incorrecta" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "360d",
    });
    // Devolver éxito y token
    const response: LoginResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      notificacions: user.notificaciones_activadas,
      rol: user.rol,
      token: token,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
