import path from "node:path";
import { z } from "zod";
import type { AuthResponse } from "@shared/types.js";
import { createJsonStore } from "./jsonStore.js";

const storedUserSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  passwordHash: z.string(),
  createdAt: z.string(),
});

type StoredUser = z.infer<typeof storedUserSchema>;
export type PublicUser = AuthResponse["user"];
export type UserCredentials = Pick<StoredUser, "id" | "email" | "passwordHash">;

// passwordHash is stripped here, at the lowest layer, so no future endpoint can leak it.
function toPublic(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email };
}

export interface UsersRepository {
  /** Returns null when the email is already registered. */
  create(email: string, passwordHash: string): Promise<PublicUser | null>;
  /** The only method that exposes the hash, for password verification. */
  findCredentialsByEmail(email: string): Promise<UserCredentials | undefined>;
}

export function createUsersRepository(dataDir: string): UsersRepository {
  const store = createJsonStore(path.join(dataDir, "users.json"), z.array(storedUserSchema), []);

  return {
    create(email, passwordHash) {
      // The duplicate check lives inside the serialised update, so two concurrent
      // signups with the same email cannot both pass it.
      return store.update((users) => {
        if (users.some((user) => user.email === email)) return { next: users, result: null };

        const id = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
        const user: StoredUser = { id, email, passwordHash, createdAt: new Date().toISOString() };
        return { next: [...users, user], result: toPublic(user) };
      });
    },

    async findCredentialsByEmail(email) {
      const users = await store.read();
      const user = users.find((candidate) => candidate.email === email);
      return user && { id: user.id, email: user.email, passwordHash: user.passwordHash };
    },
  };
}
