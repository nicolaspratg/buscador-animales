import { z } from "zod";

export const credentialsSchema = z.object({
  // Normalised before validation, so "Nico@x.com " and "nico@x.com" are one account.
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Email inválido" })),
  // bcrypt only uses the first 72 bytes; longer passwords would be silently truncated.
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(6, { error: "La contraseña debe tener al menos 6 caracteres" })
    .max(72, { error: "La contraseña no puede superar los 72 caracteres" }),
});

export type Credentials = z.infer<typeof credentialsSchema>;
