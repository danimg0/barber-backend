import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";

export async function GET(request: Request) {
  try {
    //Params posibles
    const url = new URL(request.url);
    const params = url.searchParams;
    const idBarbero = params.get("idBarbero");
    const estado = params.get("estado");
    const fecha = params.get("fecha");
    const rol = params.get("rol");
    // const fechaMax = params.get("fecha");
    // const fechaMin = params.get("fecha");

    // console.log("Params recibidos:", {
    //   idBarbero,
    //   estado,
    //   fecha,
    // });

    // console.log("Estado recibido en la api:", estado);

    let query = supabase
      .from("citas_r_cliente_empleado")
      .select(
        `
      id,
      id_peluquero,
      fecha_cita,
      hora_inicio,
      estado:estado_cita (id, tipo_estado),
      cliente:clientes (
          id,
        usuario:usuarios (
          id,
          name,
          phone
        )  
      ),
      servicios:r_cita_servicio (
        servicio:servicios ( id, nombre, precio, duracion )
      ),
      invitado
      `
      )
      .order("fecha_cita");

    if (!idBarbero) {
      const { user, status, error } = await getUserFromRequest(request);

      //si no hay param de idBarbero, se busca por la del propio barbero que hace la peticion
      query = query.eq("id_peluquero", user?.id);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: error }),
          {
            status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      query = query.eq("id_peluquero", idBarbero);
    }

    //Anado params si existen
    if (estado) query = query.eq("estado", Number(estado));
    if (fecha) query = query.eq("fecha_cita", fecha);

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error en supabase: ${error.message}`,
        }),
        { status: 400 }
      );
    }

    // console.log("Devolviendo citas de la api:", JSON.stringify(data, null, 2));
    return new Response(JSON.stringify(data));
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Pete en la peticion ${error} `,
      }),
      { status: 500 }
    );
  }
}
