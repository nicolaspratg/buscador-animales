import bcrypt from "bcryptjs";
import type { AuthResponse } from "@shared/types.js";
import { AppError } from "../errors/AppError.js";
import type { UsersRepository } from "../repositories/users.repository.js";
import type { Credentials } from "../schemas/auth.schemas.js";
import { signToken } from "../utils/token.js";

const BCRYPT_COST = 10;
const INVALID_CREDENTIALS_MESSAGE = "Email o contraseña incorrectos";

// Compared against when the email is unknown, so that path costs the same bcrypt
// time as a wrong password. Otherwise response timing reveals which emails exist.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", BCRYPT_COST);

export interface AuthService {
  signup(credentials: Credentials): Promise<AuthResponse>;
  login(credentials: Credentials): Promise<AuthResponse>;
}

export function createAuthService(users: UsersRepository): AuthService {
  return {
    async signup({ email, password }) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      const user = await users.create(email, passwordHash);
      if (user === null) throw new AppError(409, "EMAIL_TAKEN", "Ya existe una cuenta con ese email");
      return { token: signToken(user), user };
    },

    async login({ email, password }) {
      const credentials = await users.findCredentialsByEmail(email);
      const matches = await bcrypt.compare(password, credentials?.passwordHash ?? DUMMY_HASH);
      if (credentials === undefined || !matches) {
        throw new AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
      }
      const user = { id: credentials.id, email: credentials.email };
      return { token: signToken(user), user };
    },
  };
}
