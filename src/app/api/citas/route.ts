import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
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
  console.log("cita a crear en la api:", body);

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

    if (newError)
      return new Response(JSON.stringify({ succes: false, error: newError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    let idCitaGenerada = data;

    const startDate = new Date(`${body.fecha_cita}T${body.hora_inicio}`);
    const endDate = new Date(`${body.fecha_cita}T${body.hora_fin}`);

    // const { value: icsContent } = await generateICS({
    //   title: "Tu cita en la barbería",
    //   description: `Tienes una cita el ${startDate.toLocaleDateString()} a las ${startDate.toLocaleTimeString()}`,
    //   location: "Barbería Ejemplo, Calle Ficticia 123",
    //   startDate,
    //   endDate,
    //   organizer: {
    //     name: "Barbería Ejemplo",
    //     email: "no-reply@tubarberia.com",
    //   },
    // });

    // Enviar el correo al cliente
    //   await sendMail({
    //     email: "no-reply@tubarberia.com",
    //     sendTo: body.telefono
    //       ? `${body.telefono}@sms.com`
    //       : "cliente@ejemplo.com", // ajusta el destino real
    //     subject: "Confirmación de cita",
    //     text: "Adjuntamos tu cita para añadir al calendario.",
    //     html: `
    //   <p>Hola ${body.nombreCliente ?? "cliente"},</p>
    //   <p>Tu cita ha sido confirmada para el ${startDate.toLocaleDateString()} a las ${startDate.toLocaleTimeString()}.</p>
    //   <p><a href="cid:cita.ics" download="cita.ics" style="padding:10px 20px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:5px;">Añadir al calendario</a></p>
    //   <p>También puedes abrir el archivo adjunto con tu app de calendario.</p>
    // `,
    //     attachments: [
    //       {
    //         filename: "cita.ics",
    //         content: icsContent,
    //         contentType: "text/calendar",
    //       },
    //     ],
    //   });

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
