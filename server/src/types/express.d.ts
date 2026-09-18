import type { PublicUser } from "../repositories/users.repository.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware on protected routes. */
      user?: PublicUser;
    }
  }
}
