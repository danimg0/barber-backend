import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { CitasPorIDClienteArrayResponse } from "@/lib/types/citas.type";

export async function GET(request: Request): Promise<Response> {
  try {
    const { user, status, error } = await getUserFromRequest(request);

    if (error) {
      return new Response(JSON.stringify({ succes: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    let hoy = new Date();
    hoy.setHours(hoy.getHours() + 2);

    const { data, error: newError } = await supabase
      .from("citas_con_servicios")
      .select("*")
      .eq("id_cliente", user?.id)
      .eq("tipo_estado", "pendiente")
      .gt("fecha_cita", hoy.toISOString())
      .order("fecha_cita", { ascending: true })
      .order("hora_inicio", { ascending: true });

    console.log("data:", JSON.stringify(data));

    if (newError)
      return new Response(JSON.stringify({ error: error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    let response: CitasPorIDClienteArrayResponse = data;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en check-status:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
