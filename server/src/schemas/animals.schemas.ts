import { z } from "zod";

// An empty param (`?clase=`) means "no filter", the same as leaving it out.
const textParam = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

// Repeatable param (`?continente=África&continente=Asia`): values are OR-ed.
// Express parses one occurrence as a string and several as an array; both
// normalise to a non-empty list, or undefined for "no filter".
const multiParam = z
  .union([z.string(), z.array(z.string())], { error: "Debe ser texto" })
  .transform((value) => {
    const values = (Array.isArray(value) ? value : [value]).map((v) => v.trim()).filter((v) => v !== "");
    return values.length > 0 ? values : undefined;
  })
  .optional();

// Not z.coerce.number() alone: it turns "" into 0, which would silently apply a filter.
const weightParam = z
  .string()
  .trim()
  .min(1, { error: "Debe ser un número" })
  .pipe(z.coerce.number<string>({ error: "Debe ser un número" }).nonnegative({ error: "No puede ser negativo" }))
  .optional();

const positiveIntParam = z.coerce
  .number<string>({ error: "Debe ser un número" })
  .int({ error: "Debe ser un número entero" })
  .positive({ error: "Debe ser mayor que 0" });

export const animalsQuerySchema = z
  .object({
    nombre: textParam,
    clase: multiParam,
    dieta: multiParam,
    continente: multiParam,
    habitat: multiParam,
    pesoMin: weightParam,
    pesoMax: weightParam,
    // Not z.coerce.boolean(): it maps the string "false" to true.
    enPeligro: z
      .enum(["true", "false"], { error: "Debe ser true o false" })
      .transform((value) => value === "true")
      .optional(),
    orderBy: z
      .enum(["nombreComun", "pesoPromedioKg", "esperanzaVidaAnios"], { error: "Campo de orden inválido" })
      .optional(),
    order: z.enum(["asc", "desc"], { error: "Debe ser asc o desc" }).default("asc"),
    page: positiveIntParam.default(1),
    limit: positiveIntParam.max(100, { error: "El máximo es 100" }).default(10),
  })
  .refine((q) => q.pesoMin === undefined || q.pesoMax === undefined || q.pesoMin <= q.pesoMax, {
    error: "pesoMin no puede ser mayor que pesoMax",
    path: ["pesoMin"],
  });

export type AnimalsQuery = z.infer<typeof animalsQuerySchema>;
