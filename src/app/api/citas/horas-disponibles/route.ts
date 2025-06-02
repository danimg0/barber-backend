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

  console.log("DEBUG: Servicios seleccionados:", arrServicios);

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

  console.log("DEBUG: Duración de servicios:", duracionServicios);

  const { data: horarioPeluquero } = await supabase
    .from("barberos_con_horarios")
    .select("horario")
    .eq("id", id_barbero);

  console.log("DEBUG: Horario del peluquero:", horarioPeluquero);

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
  // console.log("fecha", diaStr);

  // const { data: citas, error: errorCitas } = await supabase
  //   .from("citas_con_servicios")
  //   .select("id_cita, hora_inicio, duracion_total, tipo_estado")
  //   .eq("fecha_cita", diaStr)
  //   .eq("id_peluquero", id_barbero);
  const { data: citas, error: errorCitas } = await supabase
    .from("citas_disponibilidad")
    .select("id_cita, hora_inicio, duracion_total, tipo_estado")
    .eq("fecha_cita", diaStr)
    .eq("id_peluquero", id_barbero);

  console.log("DEBUG: Citas recuperadas:", citas);

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
  inicioTramo: string,
  finTramo: string,
  dia: Date
) {
  const dateActual = new Date();
  //3 horas de antelacion para reservar
  const horaMinimaReserva = new Date(dateActual.getTime() + 3 * 60 * 60 * 1000);
  const horaMinima =
    horaMinimaReserva.getHours().toString().padStart(2, "0") +
    ":" +
    horaMinimaReserva.getMinutes().toString().padStart(2, "0");

  // Convierte una hora "HH:mm:ss" a minutos desde medianoche
  // Para hacer las comparaciones
  function horaToMinutos(hora: string): number {
    const [h, m, s] = hora.split(":").map(Number);
    return h * 60 + m + Math.floor((s || 0) / 60);
  }
  function minutosToHora(minutos: number): string {
    const h = Math.floor(minutos / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutos % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  //Coger los minutos del inicio y el final del horario
  const inicioMin = horaToMinutos(inicioTramo);
  const finMin = horaToMinutos(finTramo);
  const horaMinimaMin = horaToMinutos(horaMinima);

  //Se ordenan las citas por hora
  const citasOrdenadas = [...citasCogidas].sort(
    (a, b) => horaToMinutos(a.hora_inicio) - horaToMinutos(b.hora_inicio)
  );

  const horasDisponibles: string[] = [];
  //Hora de apertura, inicioHorario
  let actual = inicioMin;

  while (actual + duracionServicios <= finMin) {
    if (actual < horaMinimaMin && esHoy(dia, dateActual)) {
      actual += duracionServicios;
      continue;
    }
    //Se comprueba si la franja elegida choca con alguna cita yas cogida
    const citaSolapada = citasOrdenadas.find((cita) => {
      //En las citas que hay, se coge para cada cita, la hora de inicio
      const citaInicio = horaToMinutos(cita.hora_inicio);
      //La hora de fin de esa cita
      const citaFin = citaInicio + cita.duracion_total;
      //Final del hueco de tiempo a evaluar
      const intervaloFin = actual + duracionServicios;
      //actual es el minuto actual (dede medianoche ) que se esta evaluando
      //Se comprueba si el hueco de tiempo a evaluar (actual + intervaloFin) se solapa con cita existente (citaInicio y citaFin)
      return actual < citaFin && intervaloFin > citaInicio;
    });

    //Si hay solape, se salta al final de esa cita
    if (citaSolapada) {
      const citaFin =
        horaToMinutos(citaSolapada.hora_inicio) + citaSolapada.duracion_total;
      actual = citaFin;
    } else {
      //Si no lo hay, se anade la hora a las horas disponibles y se suma la duracion de los servicios al horario
      horasDisponibles.push(minutosToHora(actual));
      actual += duracionServicios;
    }
  }
  //console.log("Horas disponibles", horasDisponibles);
  return horasDisponibles;
}

function esHoy(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
