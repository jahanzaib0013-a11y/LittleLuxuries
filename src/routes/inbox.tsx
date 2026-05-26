import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { useState, useEffect } from "react";
import {
  Search,
  Image as ImageIcon,
  Send,
  Sparkles,
  Instagram,
  MoreVertical,
  Bot,
  PackageSearch,
  AlertTriangle,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { instagramService, IGConversation } from "@/lib/instagram-service";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Social Inbox — Little Luxuries Admin" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      recipientId: search.recipientId as string | undefined,
      message: search.message as string | undefined,
      customerName: search.customerName as string | undefined,
    };
  },
  component: InboxPage,
});

const mockConversations = [
  {
    id: "1",
    recipientId: "mock1",
    name: "Victoria Chen",
    handle: "@victoria_c",
    platform: "Instagram",
    unread: true,
    lastMessage: "Does the cashmere set run true to size?",
    time: "2m",
    avatar: "V",
  },
  {
    id: "2",
    recipientId: "mock2",
    name: "Eleanor Vance",
    handle: "@ellie_vance",
    platform: "Instagram",
    unread: false,
    lastMessage: "Thank you so much! It arrived beautifully packaged.",
    time: "1h",
    avatar: "E",
  },
  {
    id: "3",
    recipientId: "mock3",
    name: "Sophia Laurent",
    handle: "@sophialoves",
    platform: "Instagram",
    unread: false,
    lastMessage: "Are you restocking the linen onesie in pearl?",
    time: "3h",
    avatar: "S",
  },
];

function InboxPage() {
  const { recipientId, message: initialMessage, customerName } = useSearch({ from: "/inbox" });
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState<any[]>(mockConversations);
  const [activeChat, setActiveChat] = useState<any>(mockConversations[0]);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | undefined>();
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // Handle incoming concierge deep links
  useEffect(() => {
    if (recipientId) {
      // Find if we already have this conversation
      const existing = conversations.find(
        (c) => c.recipientId === recipientId || c.id === recipientId,
      );
      if (existing) {
        setActiveChat(existing);
        if (isMobile) setMobileShowChat(true);
      } else if (customerName) {
        // Create a temporary "new" conversation for this VIP
        const newChat = {
          id: `temp-${recipientId}`,
          recipientId,
          name: customerName,
          handle: `@${customerName.toLowerCase().replace(/\s/g, "_")}`,
          platform: "Instagram",
          unread: false,
          lastMessage: "Starting new concierge thread...",
          time: "Now",
          avatar: customerName[0].toUpperCase(),
        };
        setConversations((prev) => [newChat, ...prev]);
        setActiveChat(newChat);
        if (isMobile) setMobileShowChat(true);
      }
    }

    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [recipientId, initialMessage, customerName, isMobile]);

  const selectChat = (chat: (typeof mockConversations)[0]) => {
    setActiveChat(chat);
    if (isMobile) setMobileShowChat(true);
  };

  const isRealApiConnected = instagramService.isConfigured();

  useEffect(() => {
    if (isRealApiConnected) {
      loadRealConversations();
    }
  }, [isRealApiConnected, forceRender]);

  const handleConnectInstagram = async () => {
    setIsConnecting(true);
    try {
      // In production, VITE_META_APP_ID must be set in .env
      const appId = import.meta.env.VITE_META_APP_ID || "123456789";
      await instagramService.initSDK(appId);

      const result = await instagramService.login();
      if (result) {
        toast.success("Successfully authenticated with Instagram!");
        // We simulate storing the token and picking an IG Account ID
        // In a real app, we'd fetch the user's Pages and pick the linked IG Account here.
        instagramService.setCredentials(result.accessToken, result.userID);
        setForceRender((prev) => prev + 1);
      } else {
        toast.error("Authentication cancelled or failed.");
      }
    } catch (e) {
      toast.error("Failed to initialize Facebook SDK.");
    } finally {
      setIsConnecting(false);
    }
  };

  const loadRealConversations = async () => {
    setIsLoading(true);
    try {
      const realConvos = await instagramService.getConversations();
      if (realConvos.length > 0) {
        // Map real API data to our UI format
        const mappedConvos = realConvos.map((c) => {
          const latestMessage = c.messages?.data?.[0];
          const participant =
            c.participants?.data?.find((p) => p.id !== import.meta.env.VITE_IG_ACCOUNT_ID) ||
            c.participants?.data?.[0];

          return {
            id: c.id,
            recipientId: participant?.id,
            name: participant?.username || "Unknown User",
            handle: `@${participant?.username}`,
            platform: "Instagram",
            unread: false, // Would need webhooks to track accurately
            lastMessage: latestMessage?.message || "Attachment",
            time: new Date(c.updated_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            avatar: participant?.username?.[0]?.toUpperCase() || "U",
          };
        });
        setConversations(mappedConvos);
        setActiveChat(mappedConvos[0]);
      }
    } catch (error) {
      toast.error("Failed to load real Instagram conversations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setMessageError("Type a message before sending.");
      return;
    }
    setMessageError(undefined);

    if (isRealApiConnected && activeChat.recipientId) {
      setIsSending(true);
      const success = await instagramService.sendMessage(activeChat.recipientId, message);
      setIsSending(false);

      if (success) {
        toast.success("Message sent via Instagram API");
        setMessage("");
        // In a full implementation, we'd append this to local chat state immediately
      } else {
        toast.error("Failed to send message to Instagram");
      }
    } else {
      // Sandbox mode
      toast.success("Sandbox mode: Message sent (simulated)");
      setMessage("");
    }
  };

  return (
    <AdminLayout searchPlaceholder="Search messages or customers…">
      {!isRealApiConnected && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-5 py-3 rounded-xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-700">Sandbox Mode Active</h4>
              <p className="mt-0.5">
                The Instagram API is currently not connected. You are viewing simulated mock data.
              </p>
            </div>
          </div>
          <Button
            onClick={handleConnectInstagram}
            disabled={isConnecting}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm whitespace-nowrap"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Instagram className="h-4 w-4 mr-2" />
            )}
            Connect Instagram
          </Button>
        </div>
      )}
      <div className="min-h-[calc(100dvh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-6 mt-2">
        {/* Left Sidebar - Conversations */}
        <div
          className={`w-full lg:w-80 lg:shrink-0 flex flex-col bg-card rounded-2xl shadow-(--shadow-card) overflow-hidden border border-border min-h-[280px] lg:min-h-0 ${
            mobileShowChat ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
          }`}
        >
          <div className="p-4 border-b border-border/50">
            <h2 className="font-serif text-xl font-medium flex items-center justify-between text-foreground">
              Inbox
              <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                1 Unread
              </span>
            </h2>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Instagram DMs..."
                className="w-full pl-9 pr-4 py-2.5 bg-muted/40 rounded-full text-sm border-transparent focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`w-full text-left p-4 border-b border-border/30 transition-colors ${activeChat.id === chat.id ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gold/20 text-(--color-gold-foreground) grid place-items-center font-serif text-lg border border-gold/30">
                      {chat.avatar}
                    </div>
                    {chat.unread && (
                      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                    )}
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-white rounded-full grid place-items-center shadow-sm">
                      <Instagram className="h-2.5 w-2.5 text-pink-500" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-sm truncate ${chat.unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}
                      >
                        {chat.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                    </div>
                    <p
                      className={`text-xs truncate ${chat.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Area - Active Chat */}
        <div
          className={`flex-1 flex flex-col bg-card rounded-2xl shadow-(--shadow-card) overflow-hidden border border-border min-h-[400px] lg:min-h-0 ${
            mobileShowChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Chat Header */}
          <div className="min-h-16 px-4 sm:px-6 py-2 border-b border-border/50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0 lg:hidden"
                onClick={() => setMobileShowChat(false)}
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-full bg-gold/20 text-(--color-gold-foreground) grid place-items-center font-serif text-lg border border-gold/30">
                {activeChat.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground leading-none truncate">
                  {activeChat.name}
                </h3>
                <span className="text-[11px] text-muted-foreground truncate block">
                  {activeChat.handle} • Instagram Direct
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs px-2 sm:px-3"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
              >
                <Bot
                  className={`h-3 w-3 sm:mr-1.5 ${autoReplyEnabled ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="hidden sm:inline">
                  {autoReplyEnabled ? "AI Concierge: ON" : "AI Concierge: OFF"}
                </span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[oklch(0.98_0.005_300)]">
            <div className="flex justify-center">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground bg-border/40 px-3 py-1 rounded-full">
                Today
              </span>
            </div>

            {/* Incoming */}
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gold/20 text-(--color-gold-foreground) grid place-items-center font-serif text-sm border border-gold/30">
                {activeChat.avatar}
              </div>
              <div className="bg-white border border-border/50 rounded-2xl rounded-tl-none p-4 max-w-[70%] shadow-sm text-sm text-foreground">
                <div className="aspect-square w-full max-w-48 bg-muted rounded-xl mb-3 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400&h=400"
                    className="w-full h-full object-cover"
                    alt="Product reference"
                  />
                </div>
                {activeChat.lastMessage}
              </div>
            </div>

            {/* AI Auto Reply Suggestion */}
            {autoReplyEnabled && activeChat.unread && (
              <div className="flex justify-center animate-in fade-in zoom-in duration-300">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 max-w-[80%] flex gap-3 shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                      AI Concierge Draft
                    </div>
                    <p className="text-xs text-foreground/80 mb-2 leading-relaxed">
                      "Hi Victoria! Yes, our Cashmere Sleep Set is designed to fit true to size with
                      a little extra room for growth. If your little one is between sizes, we
                      recommend sizing up so they can enjoy it longer! ✨ Would you like me to send
                      you the sizing chart?"
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-3 rounded-full bg-primary hover:bg-primary/90"
                      >
                        Send Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-3 rounded-full"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-4 border-t border-border/50 bg-card shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex gap-1 pb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors"
                >
                  <PackageSearch className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setMessageError(undefined);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isRealApiConnected
                      ? "Type a message to send via Instagram API..."
                      : "Type a message (Sandbox Mode)..."
                  }
                  aria-invalid={Boolean(messageError)}
                  className={`w-full max-h-32 min-h-[44px] bg-muted/30 border rounded-2xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-1 transition-all text-foreground placeholder:text-muted-foreground ${
                    messageError
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-border focus:border-primary focus:ring-primary"
                  }`}
                  rows={1}
                />
                {messageError && (
                  <p className="absolute -bottom-5 left-0 text-[10px] text-destructive" role="alert">
                    {messageError}
                  </p>
                )}
              </div>
              <Button
                size="icon"
                className="h-11 w-11 rounded-full shrink-0"
                onClick={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
