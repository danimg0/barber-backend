import { getUserFromRequest } from "@/lib/auth/authHelper";
import { generateICS } from "@/lib/calendar/generateICS";
import { supabase } from "@/lib/constants/supabase";
import { sendMail } from "@/lib/mails/emailSender";
// import { generateICS } from "@/lib/calendar/generateICS";
// import { sendMail } from "@/lib/mails/emailSender";

interface reqBody {
  id_cliente: number;
  id_peluquero: number;
  fecha_cita: Date;
  hora_inicio: string;
  hora_fin: string;
  estado: number;
  servicios: number[];
  nombreCliente?: string;
  telefono?: string;
}

export async function POST(request: Request): Promise<Response> {
  const body: reqBody = await request.json();
  // console.log("cita a crear en la api:", body);

  if (
    !body.id_cliente ||
    !body.id_peluquero ||
    !body.fecha_cita ||
    !body.hora_inicio ||
    !body.servicios ||
    !Array.isArray(body.servicios) ||
    body.servicios.length === 0
  ) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Faltan campos obligatorios en la solicitud.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { status, error } = await getUserFromRequest(request);

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

    //Si el body.id_cliente es -1, significa que tengo que coger
    // los datos tambien de nombreInv y telefonoInv, y el id_cliente seria null
    const p_id_cliente = body.id_cliente === -1 ? null : body.id_cliente;
    const p_invitado =
      body.id_cliente === -1
        ? {
            nombreInv: body.nombreCliente ?? "",
            telefonoInv: body.telefono ?? "",
          }
        : null;

    const { data, error: newError } = await supabase.rpc(
      "add_citas_con_servicio",
      {
        // Estos son los parametros que tiene la funcion de supabase
        p_id_cliente,
        p_id_peluquero: body.id_peluquero,
        p_fecha_cita: new Date(body.fecha_cita),
        p_hora_inicio: body.hora_inicio,
        p_hora_fin: body.hora_fin,
        p_estado: body.estado !== -1 ? body.estado : 1,
        p_servicios: body.servicios,
        p_invitado,
      }
    );

    if (body.id_cliente !== -1) {
      const { data: cliente, error: clienteError } = await supabase
        .from("usuarios")
        .select("name, email")
        .eq("id", body.id_cliente)
        .single();

      if (clienteError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Error al obtener datos del cliente: ${clienteError.message}`,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const { name: clienteName, email: clienteEmail } = cliente;

      //Esto habria que cambiarlo por la duracion real de la cita
      const defaultDurationMinutes = 30;

      const startDate = new Date(`${body.fecha_cita}T${body.hora_inicio}`);
      //Duracion falseada
      const endDate = new Date(
        startDate.getTime() + defaultDurationMinutes * 60 * 1000
      );

      const { value: icsContent } = await generateICS({
        title: "Tu cita en la barbería",
        description: `Tienes una cita el ${startDate.toLocaleDateString()} a las ${startDate.toLocaleTimeString()}`,
        location: "BarberShop Jerez",
        startDate,
        endDate,
        organizer: {
          name: "Barbería",
          email: "3dmartos@gmail.com",
        },
      });

      console.log("ICS Content:", icsContent);

      await sendMail({
        email: clienteEmail,
        sendTo: clienteEmail,
        subject: "Confirmación de cita",
        text: "Adjuntamos tu cita para añadir al calendario.",
        html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <p>Hola ${clienteName},</p>
    <p>Tu cita ha sido confirmada para el <strong>${startDate.toLocaleDateString()}</strong> a las <strong>${startDate.toLocaleTimeString()}</strong>.</p>
    
    <div style="margin: 20px 0; text-align: center;">
      <p style="margin-bottom: 15px;">Para añadir esta cita a tu calendario:</p>
      <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <strong>📱 En móvil:</strong> Abre el archivo adjunto "cita.ics" desde tu aplicación de email
      </p>
      <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <strong>💻 En ordenador:</strong> Descarga el archivo adjunto y ábrelo con tu aplicación de calendario
      </p>
    </div>
    
    <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #fafafa;">
      <h3 style="margin-top: 0;">Detalles de la cita:</h3>
      <p><strong>Fecha:</strong> ${startDate.toLocaleDateString()}</p>
      <p><strong>Hora:</strong> ${startDate.toLocaleTimeString()}</p>
      <p><strong>Lugar:</strong> BarberShop Jerez</p>
    </div>
    
    <p style="margin-top: 20px; font-size: 12px; color: #666;">
      Si tienes problemas para abrir el archivo, contacta con nosotros.
    </p>
  </div>
`,

        attachments: [
          {
            filename: "cita_barberia.ics",
            content: icsContent,
            // contentType: "text/calendar; charset=utf-8",
            // contentDisposition: "attachment", // Fuerza la descarga
            // cid: undefined, // Asegúrate de que no hay CID
          },
        ],
      });
    }

    if (newError)
      return new Response(JSON.stringify({ succes: false, error: newError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    let idCitaGenerada = data;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cita creada con id ${idCitaGenerada}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en check-status:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
