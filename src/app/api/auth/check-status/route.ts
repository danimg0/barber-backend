import { supabase } from "@/lib/constants/supabase";
import { corsHeaders } from "@/utils/cors";
import jwt from "jsonwebtoken";
export const runtime = "nodejs";

type CheckStatusResponse = {
  id: string;
  email: string;
  name: string;
  rol: number;
  token: string;
};

export async function GET(request: Request): Promise<Response> {
  try {
    // Obtener el token del header Authorization
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Token no proporcionado",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Extraer el token
    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verificar y decodificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Token inválido o expirado: ${error}`,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Obtener información del usuario usando el ID del token
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, name, rol")
      .eq("id", decoded.userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Usuario no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generar un nuevo token (renovación)
    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "360d",
    });

    // Construir respuesta
    const response: CheckStatusResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      rol: user.rol,
      token: newToken,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en check-status:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
