import { useEffect, useRef } from "react";
import { supabase } from "../services/supabase";
import { useChatStore } from "../store/chatStore";

export function useRealtimeChannel(channelId: string | null) {
  const { subscribeToChannel } = useChatStore();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const subscription = subscribeToChannel(channelId);
    subscriptionRef.current = subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, [channelId, subscribeToChannel]);
}
