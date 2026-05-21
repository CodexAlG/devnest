import { create } from "zustand";
import { supabase } from "../services/supabase";
import type { Channel, Message } from "../types/entities";

interface ChatState {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  loadingMessages: boolean;

  fetchChannels: (projectId?: string) => Promise<void>;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, isAiResponse?: boolean) => Promise<void>;
  setActiveChannel: (channel: Channel | null) => void;
  subscribeToChannel: (channelId: string) => ReturnType<typeof supabase.channel>;
  createProjectChannel: (projectId: string, name: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  loadingMessages: false,

  fetchChannels: async (projectId) => {
    try {
      const query = supabase.from("channels").select("*").order("created_at", { ascending: true });
      if (projectId) {
        query.or(`project_id.eq.${projectId},project_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      set({ channels: data || [] });
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  },

  fetchMessages: async (channelId) => {
    set({ loadingMessages: true });
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles(id, name, email, role)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      set({ messages: data || [], loadingMessages: false });
    } catch (err) {
      console.error("Error fetching messages:", err);
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (channelId, content, isAiResponse = false) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        sender_id: isAiResponse ? null : user.user?.id,
        content,
        is_ai_response: isAiResponse,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error sending message:", err);
    }
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel, messages: [] });
    if (channel) {
      get().fetchMessages(channel.id);
    }
  },

  subscribeToChannel: (channelId) => {
    const channel = supabase.channel(`public:messages:${channelId}`);
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const newMessage = payload.new as Message;
          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        }
      )
      .subscribe();
    return channel;
  },

  createProjectChannel: async (projectId, name) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("channels").insert({
        project_id: projectId,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: "project",
        created_by: user.user?.id,
      });
      if (error) throw error;
      get().fetchChannels(projectId);
    } catch (err) {
      console.error("Error creating channel:", err);
    }
  },
}));

export default useChatStore;
