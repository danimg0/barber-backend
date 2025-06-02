//POST

import { encriptar } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { BarberoBackendResponse } from "@/lib/types/barbero.type";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, rol, horario } = body;

    // Validar campos obligatorios
    if (!name || !email || !password || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Faltan campos obligatorios: name, email, password o phone",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Encriptar la contraseña
    const hashedPassword = await encriptar(password);

    let barberoDB: BarberoBackendResponse = {
      name,
      email: email,
      password: password,
      phone: phone,
      horario: horario ?? {},
      rol: rol,
    };

    console.log(`Creando barbero con datos: ${JSON.stringify(barberoDB)}`);

    const { data, error } = await supabase.rpc("crear_barbero", {
      p_name: name,
      p_email: email,
      p_password: hashedPassword,
      p_phone: phone,
      p_rol: rol,
      p_horario: horario ?? null,
    });

    console.log(
      `Respuesta de la creación del barbero: ${JSON.stringify(data)}`
    );
    console.log(`Error al crear el barbero: ${JSON.stringify(error)}`);

    if (error) {
      console.error(`Retornando error: ${error.message}`);
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Barbero creado correctamente",
        id: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
