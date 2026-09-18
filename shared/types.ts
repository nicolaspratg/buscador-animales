// The API contract. Types only: both sides import it with `import type`,
// so nothing here may exist at runtime.

export interface Animal {
  id: number;
  nombreComun: string;
  nombreCientifico: string;
  clase: string;
  habitat: string;
  dieta: string;
  pesoPromedioKg: number;
  esperanzaVidaAnios: number;
  continente: string;
  enPeligroExtincion: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface FiltrosDisponibles {
  clases: string[];
  dietas: string[];
  continentes: string[];
  habitats: string[];
  pesoMin: number;
  pesoMax: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { field: string; message: string }[] };
}

export interface AuthResponse {
  token: string;
  user: { id: number; email: string };
}

export interface HealthResponse {
  status: "ok";
  uptime: number;
}
