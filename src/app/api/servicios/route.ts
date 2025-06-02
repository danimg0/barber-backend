import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";

export async function GET(request: Request): Promise<Response> {
  try {
    const { status, error } = await getUserFromRequest(request);

    if (error) {
      return new Response(JSON.stringify({ succes: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error: newError } = await supabase
      .from("servicios")
      .select("*")
      .order("precio");

    if (newError)
      return new Response(JSON.stringify({ error: error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

///////////////////////////     METODO POST    ///////////////////////////
interface Servicio {
  nombre: string;
  descripcion: string;
  precio: number | string;
  duracion: number | string;
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/servicios");
    const body: Servicio = await request.json();

    console.log("POST /api/servicios", body);

    if (
      !body ||
      !body.nombre ||
      !body.descripcion ||
      body.precio === undefined ||
      body.duracion === undefined
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Datos incompletos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { status, error } = await getUserFromRequest(request);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error: newError } = await supabase
      .from("servicios")
      .insert({
        nombre: body.nombre,
        descripcion: body.descripcion,
        precio: Number(body.precio),
        duracion: Number(body.duracion),
      })
      .select("*")
      .single();

    console.log("Respuesta de la base de datos:", data, newError);

    if (newError) {
      return new Response(
        JSON.stringify({ success: false, message: newError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
