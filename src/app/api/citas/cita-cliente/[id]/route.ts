import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";

interface Params {
  id: string;
}
export async function DELETE(request: Request, { id }: Params) {
  try {
    const { user, error, status } = await getUserFromRequest(request);

    if (error) {
      return new Response(
        JSON.stringify({
          succes: false,
          message: `Error al verificar usuario: ${error}`,
        }),
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id_cita = Number(id);

    const { error: error2 } = await supabase
      .from("citas_r_cliente_empleado")
      .delete()
      .eq("id", id_cita);

    if (error2) {
      return new Response(
        JSON.stringify({
          succes: false,
          message: `Error al eliminar la cita: ${error2.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        succes: true,
        message: "Cita eliminada correctamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        succes: false,
        message: `Error inesperado: ${error}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
