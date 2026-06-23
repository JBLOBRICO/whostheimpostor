import { create } from "zustand";
import { RoomState, ChatMessage, GameState, DailyEvent } from "@/types/game";

interface GameStore {
  // Room state
  roomState: RoomState | null;
  setRoomState: (state: RoomState | null) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  lastMessageTimestamp: number;
  setLastMessageTimestamp: (ts: number) => void;

  // Daily event
  dailyEvent: DailyEvent | null;
  setDailyEvent: (event: DailyEvent | null) => void;

  // UI state
  isMuted: boolean;
  toggleMute: () => void;
  musicEnabled: boolean;
  toggleMusic: () => void;
  volume: number;
  setVolume: (v: number) => void;

  // Polling
  pollInterval: NodeJS.Timeout | null;
  setPollInterval: (interval: NodeJS.Timeout | null) => void;
  lastPollTime: number;
  setLastPollTime: (t: number) => void;

  // Game phase transitions
  previousStatus: string | null;
  setPreviousStatus: (s: string | null) => void;

  // Ability UI
  abilityPending: boolean;
  setAbilityPending: (v: boolean) => void;
  pendingAbilityTarget: string | null;
  setPendingAbilityTarget: (id: string | null) => void;

  // Animations
  showTwistReveal: boolean;
  setShowTwistReveal: (v: boolean) => void;
  showRoleReveal: boolean;
  setShowRoleReveal: (v: boolean) => void;
  eliminationTarget: string | null;
  setEliminationTarget: (id: string | null) => void;

  // Reset
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  roomState: null,
  setRoomState: (state) => {
    const prev = get().roomState;
    const prevStatus = prev?.currentGame?.status ?? prev?.status;
    const nextStatus = state?.currentGame?.status ?? state?.status;

    if (prevStatus !== nextStatus) {
      set({ previousStatus: prevStatus ?? null });

      // Trigger animations on phase transitions
      if (nextStatus === "assigning") {
        set({ showRoleReveal: true, showTwistReveal: false });
      } else if (nextStatus === "discussion" && prevStatus === "assigning") {
        set({ showTwistReveal: true });
        setTimeout(() => set({ showTwistReveal: false }), 4000);
      } else if (nextStatus === "revealing") {
        set({ showRoleReveal: false });
      }
    }

    set({ roomState: state });
  },

  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-100), msg],
    })),
  setMessages: (msgs) => set({ messages: msgs }),
  lastMessageTimestamp: 0,
  setLastMessageTimestamp: (ts) => set({ lastMessageTimestamp: ts }),

  dailyEvent: null,
  setDailyEvent: (event) => set({ dailyEvent: event }),

  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  musicEnabled: true,
  toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
  volume: 0.5,
  setVolume: (v) => set({ volume: v }),

  pollInterval: null,
  setPollInterval: (interval) => {
    const prev = get().pollInterval;
    if (prev) clearInterval(prev);
    set({ pollInterval: interval });
  },
  lastPollTime: 0,
  setLastPollTime: (t) => set({ lastPollTime: t }),

  previousStatus: null,
  setPreviousStatus: (s) => set({ previousStatus: s }),

  abilityPending: false,
  setAbilityPending: (v) => set({ abilityPending: v }),
  pendingAbilityTarget: null,
  setPendingAbilityTarget: (id) => set({ pendingAbilityTarget: id }),

  showTwistReveal: false,
  setShowTwistReveal: (v) => set({ showTwistReveal: v }),
  showRoleReveal: false,
  setShowRoleReveal: (v) => set({ showRoleReveal: v }),
  eliminationTarget: null,
  setEliminationTarget: (id) => set({ eliminationTarget: id }),

  reset: () =>
    set({
      roomState: null,
      messages: [],
      lastMessageTimestamp: 0,
      pollInterval: null,
      previousStatus: null,
      abilityPending: false,
      pendingAbilityTarget: null,
      showTwistReveal: false,
      showRoleReveal: false,
      eliminationTarget: null,
    }),
}));
