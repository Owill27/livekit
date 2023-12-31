import { User } from "@/lib/types";
import { createContext } from "react";

export type AppContextType = {
  user: User | null;
  socket: WebSocket | null;
};

export const AppContext = createContext<AppContextType>({
  user: null,
  socket: null,
});
