import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";

interface citaDia {
  id_cita: number;
  hora_inicio: string;
  duracion_total: number;
  tipo_estado: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id_barbero = Number(url.searchParams.get("id_barbero"));
  const servicios = url.searchParams.get("servicios");
  const dia = url.searchParams.get("dia");

  //Comprobar usuario beare

  const { status, error } = await getUserFromRequest(request);
  if (error) {
    return new Response(JSON.stringify({ success: false, message: error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  //console.log("Params recibidos en horas:", id_barbero, servicios, dia);

  if (!id_barbero || !servicios || !dia) {
    return new Response(
      JSON.stringify({ success: false, error: "Faltan parámetros" }),
      { status: 400 }
    );
  }

  const arrServicios = servicios
    .split(",")
    .map((ser) => Number(ser))
    .filter((n) => !isNaN(n));

  if (arrServicios.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: "No hay servicios válidos" }),
      { status: 400 }
    );
  }

  if (arrServicios.length > 10) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Demasiados servicios seleccionados",
      }),
      { status: 400 }
    );
  }

  // console.log("DEBUG: Servicios seleccionados:", arrServicios);

  const { data: duracionServicios, error: errorDuracion } = await supabase
    .from("servicios")
    .select("duracion")
    .in("id", arrServicios);

  if (errorDuracion) {
    console.error("Error en consulta de servicios:", errorDuracion);
    return new Response(
      JSON.stringify({ success: false, error: errorDuracion.message }),
      { status: 500 }
    );
  }

  // console.log("DEBUG: Duración de servicios:", duracionServicios);

  const { data: horarioPeluquero } = await supabase
    .from("barberos_con_horarios")
    .select("horario")
    .eq("id", id_barbero);

  // console.log("DEBUG: Horario del peluquero:", horarioPeluquero);

  const duracionTotal =
    //DuracionServicios es el array de objetos duracion ([{duracion: 20}, {duracion: 30}])
    //Reduce es un metodo de arrays para reducir el array a un solo valor
    //El acumulador empieza en 0, servicio es cada elemento del array
    //Si existe duracion,
    duracionServicios?.reduce(
      (acumulador, servicio) => acumulador + servicio.duracion, // Se va sumando cada elemento al acumulador
      0 // Este es el valor inicial del acumulador
    );
  const fechaObj = new Date(dia);
  const diaStr = fechaObj.toISOString().split("T")[0];

  const { data: citas, error: errorCitas } = await supabase
    .from("citas_disponibilidad")
    .select("id_cita, hora_inicio, duracion_total, tipo_estado")
    .eq("tipo_estado", "pendiente") // es una view y esta asi
    .eq("fecha_cita", diaStr)
    .eq("id_peluquero", id_barbero);

  // console.log("DEBUG: Citas recuperadas:", citas);

  if (errorCitas) {
    console.error("Error en consulta de citas:", {
      message: errorCitas.message,
      details: errorCitas.details,
      hint: errorCitas.hint,
      code: errorCitas.code,
      raw: errorCitas,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: errorCitas.message,
          details: errorCitas.details,
          hint: errorCitas.hint,
          code: errorCitas.code,
        },
      }),
      { status: 500 }
    );
  }
  //console.log("Citas recuperadas para el día", dia, citas);
  const citasDelDia = citas?.map((cita): citaDia => {
    return {
      id_cita: cita.id_cita,
      tipo_estado: cita.tipo_estado,
      hora_inicio: cita.hora_inicio,
      duracion_total: cita.duracion_total,
    };
  });

  const diasSemana = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];

  const horarioObj = horarioPeluquero?.[0]?.horario ?? {};
  // Asegura que todas las claves existen
  diasSemana.forEach((dia) => {
    if (!horarioObj[dia]) horarioObj[dia] = [];
  });
  const diaSemana = diasSemana[fechaObj.getDay()];
  const tramos = horarioObj[diaSemana] ?? [];

  if (!tramos.length) {
    return new Response(
      JSON.stringify({ success: true, horasDisponibles: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  let horasDisponibles: string[] = [];
  for (const tramo of tramos) {
    horasDisponibles = horasDisponibles.concat(
      calculaHorasDisponibles(
        duracionTotal ?? 20,
        citasDelDia ?? [],
        tramo.hora_inicio,
        tramo.hora_fin,
        fechaObj
      )
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      horasDisponibles,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

//todo: cambiar en la pagina de reserva que primero elija fecha y servicios
function calculaHorasDisponibles(
  duracionServicios: number,
  citasCogidas: citaDia[],
  inicioTramo: string, // Formato "HH:mm"
  finTramo: string, // Formato "HH:mm"
  dia: Date // El día seleccionado para la cita
) {
  const dateActual = new Date(); // Momento actual
  const horaMinimaReserva = new Date(dateActual.getTime() + 3 * 60 * 60 * 1000); // Momento actual + 3 horas

  // Convierte una hora "HH:mm:ss" o "HH:mm" a minutos desde medianoche
  // Ignora los segundos para los cálculos basados en minutos.
  function horaToMinutos(hora: string): number {
    const partes = hora.split(":");
    const h = Number(partes[0]);
    const m = Number(partes[1]);
    // const s = Number(partes[2] || 0); // Segundos son ignorados en este contexto
    return h * 60 + m;
  }

  function minutosToHora(minutos: number): string {
    const h = Math.floor(minutos / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutos % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  const inicioMin = horaToMinutos(inicioTramo);
  const finMin = horaToMinutos(finTramo);

  let actual = inicioMin; // Por defecto, comenzamos al inicio del tramo

  if (esHoy(dia, dateActual)) {
    // ¿El día de la cita es hoy?
    // Sí, la cita es para hoy. Aplicar la regla de las 3 horas.

    // Obtener HH:MM de horaMinimaReserva para convertir a minutos
    const horaMinimaReservaStr =
      horaMinimaReserva.getHours().toString().padStart(2, "0") +
      ":" +
      horaMinimaReserva.getMinutes().toString().padStart(2, "0");
    const horaMinimaReservaAbsolutaEnMinutos =
      horaToMinutos(horaMinimaReservaStr);

    if (horaMinimaReserva.getDate() === dia.getDate()) {
      // Sí, (actual + 3h) sigue siendo hoy.
      let earliestStartTimeBasedOn3HrRule = horaMinimaReservaAbsolutaEnMinutos;

      // AJUSTE: Redondear hacia ARRIBA la hora de inicio calculada por la regla de 3h
      // al próximo múltiplo de duracionServicios.
      // Esto asegura que si la regla de 3h determina el inicio, este sea "limpio".
      if (earliestStartTimeBasedOn3HrRule % duracionServicios !== 0) {
        earliestStartTimeBasedOn3HrRule =
          Math.ceil(earliestStartTimeBasedOn3HrRule / duracionServicios) *
          duracionServicios;
      }

      // El punto de partida 'actual' debe ser el más tardío entre:
      // 1. El inicio del tramo del barbero (`inicioMin`)
      // 2. La hora mínima de reserva ajustada (`earliestStartTimeBasedOn3HrRule`)
      actual = Math.max(inicioMin, earliestStartTimeBasedOn3HrRule);
    } else {
      // No, (actual + 3h) ha pasado a mañana (o más tarde).
      // No hay huecos válidos hoy que cumplan la antelación.
      actual = finMin + 1;
    }
  }

  const citasOrdenadas = [...citasCogidas].sort(
    (a, b) => horaToMinutos(a.hora_inicio) - horaToMinutos(b.hora_inicio)
  );

  const horasDisponibles: string[] = [];

  while (actual + duracionServicios <= finMin) {
    const intervaloFin = actual + duracionServicios;
    const citaSolapada = citasOrdenadas.find((cita) => {
      const citaInicio = horaToMinutos(cita.hora_inicio);
      const citaFin = citaInicio + cita.duracion_total;
      return actual < citaFin && intervaloFin > citaInicio;
    });

    if (citaSolapada) {
      const citaFin =
        horaToMinutos(citaSolapada.hora_inicio) + citaSolapada.duracion_total;
      actual = citaFin;
    } else {
      horasDisponibles.push(minutosToHora(actual));
      actual += duracionServicios;
    }
  }
  return horasDisponibles;
}

function esHoy(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
