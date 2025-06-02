import { supabase } from "../constants/supabase";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";

//https://www.honeybadger.io/blog/encryption-and-decryption-in-typescript/
//Se usara cifrado simetrico
const algorithm = "aes-256-cbc"; //algoritmo de cifrado
// const key = crypto.randomBytes(32); //clave random de 32 bytes
//iv representa el vector de inicializacion, que se usa para aumentar la seguridad del proceso de cifrado
// const iv = crypto.randomBytes(16);
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "utf-8");
const iv = Buffer.from(process.env.ENCRYPTION_IV!, "utf-8");
// Funciones de autenticacion y helpers

export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");

  console.log("authHeader: ", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Token no proporcionado", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return { error: "JWT_SECRET not defined", status: 500 };
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
  } catch (error) {
    return { error: `Token inválido o expirado: ${error}`, status: 401 };
  }

  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .select("id,email,name,rol")
    .eq("id", decoded.userId)
    .single();

  if (userError || !user) {
    return { error: "Usuario no encontrado", status: 404 };
  }

  return { user };
}

/**
 * Crea un objeto cipher con el alhoritmo, clave y vector de inicializacion.
 * El cipher.update procesa la entrada en utf-8 y la codifica en hex
 * @param password
 * @returns
 */
export function encriptar(password: string) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, "utf-8", "hex");
  encrypted += cipher.final("hex");
  //devuelve el texto cifrado en formato hexadecimal
  return encrypted;
}
export function desincriptar(password: string) {
  console.log("Comenzando a desencriptar");
  console.log("key", key, "iv", iv);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(password, "hex", "utf-8");
  console.log("Decipher creado y update done");

  decrypted += decipher.final("utf-8");

  console.log("resutlado: ", decrypted);

  return decrypted;
}
