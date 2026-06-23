import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      level: number;
      xp: number;
      coins: number;
      equippedAvatar: string;
      equippedBorder: string;
      equippedTitle: string;
      equippedEmote: string;
      equippedVoteEffect: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    displayName: string;
    level: number;
    xp: number;
    coins: number;
    equippedAvatar: string;
    equippedBorder: string;
    equippedTitle: string;
    equippedEmote: string;
    equippedVoteEffect: string;
  }
}
