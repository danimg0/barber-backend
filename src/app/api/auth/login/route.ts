import { desincriptar } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
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
  rol: number[];
  token?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: Request): Promise<Response> {
  // Manejar preflight OPTIONS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parsear el cuerpo de la solicitud
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log("Login recibida en la api", email, password);

    // Validar los datos de entrada
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Correo electrónico y contraseña son requeridos",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Buscar usuario por nombre en la base de datos
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, password, name, rol")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Usuario no encontrado",
          userError,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Con Supabase, lo ideal es usar auth.signInWithPassword, pero para este ejemplo
    // estamos comparando passwords manualmente.
    // En un entorno real, deberías usar bcrypt para verificar las contraseñas

    let passwordDesencriptada = "";

    if (user.password === "dani") {
      passwordDesencriptada = "dani";
    } else {
      passwordDesencriptada = desincriptar(user.password);
    }

    console.log("contrasena desencript", passwordDesencriptada);

    if (passwordDesencriptada !== password) {
      // Esto es solo para el ejemplo, NO es seguro en producción
      return new Response(
        JSON.stringify({ success: false, message: "Contraseña incorrecta" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "12m",
    });
    // Devolver éxito y token
    const response: LoginResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      rol: user.rol,
      token: token,
    };

    console.log("Response de getUsuario:", JSON.stringify(response, null, 2));

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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
