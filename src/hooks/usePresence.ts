import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";

const onlineUsers = new Set<string>();
const listeners = new Set<() => void>();

function notify() { listeners.forEach((fn) => fn()); }

let channel: ReturnType<typeof supabase.channel> | null = null;
let subscribed = false;

function ensureChannel(userId: string, userName: string) {
  if (channel) return;
  channel = supabase.channel("devnest-online", {
    config: { presence: { key: userId } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      if (!channel) return;
      const state = channel.presenceState();
      onlineUsers.clear();
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.user_id) onlineUsers.add(p.user_id);
        });
      });
      notify();
    })
    .on("presence", { event: "join" }, ({ key }) => {
      onlineUsers.add(key);
      notify();
    })
    .on("presence", { event: "leave" }, ({ key }) => {
      onlineUsers.delete(key);
      notify();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel?.track({ user_id: userId, name: userName, online_at: new Date().toISOString() });
        subscribed = true;
      }
    });
}

export function getOnlineUsers(): Set<string> {
  return onlineUsers;
}

export function usePresence() {
  const { user } = useAuthStore();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!user) return;

    ensureChannel(user.id, user.name);

    const fn = () => forceUpdate((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [user?.id]);

  return { onlineUsers: getOnlineUsers() };
}
