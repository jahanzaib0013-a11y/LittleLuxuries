/**
 * Instagram Graph API Service
 *
 * To make this work, you need:
 * 1. An Instagram Business/Creator Account linked to a Facebook Page
 * 2. A Meta Developer App with "Instagram Graph API" and "Messenger" products enabled
 * 3. An Access Token with the following permissions:
 *    - instagram_basic
 *    - instagram_manage_messages
 *    - pages_manage_metadata
 *    - pages_read_engagement
 */

const API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// These should be configured in your .env file
const ENV_ACCESS_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN || "";
const ENV_IG_ACCOUNT_ID = import.meta.env.VITE_IG_ACCOUNT_ID || "";

// Mutable state for runtime authentication
let activeToken = ENV_ACCESS_TOKEN;
let activeAccountId = ENV_IG_ACCOUNT_ID;

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export interface IGMessage {
  id: string;
  message: string;
  from: { id: string; username?: string };
  created_time: string;
}

export interface IGConversation {
  id: string;
  updated_time: string;
  participants: { data: { id: string; username: string }[] };
  messages: { data: IGMessage[] };
}

export const instagramService = {
  /**
   * Check if the Instagram API is configured
   */
  isConfigured(): boolean {
    return Boolean(activeToken && activeAccountId);
  },

  /**
   * Set runtime credentials after OAuth
   */
  setCredentials(token: string, accountId: string) {
    activeToken = token;
    activeAccountId = accountId;
  },

  /**
   * Load the Facebook SDK
   */
  initSDK(appId: string = "YOUR_META_APP_ID"): Promise<void> {
    return new Promise((resolve) => {
      if (window.FB) {
        resolve();
        return;
      }

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: API_VERSION,
        });
        resolve();
      };

      (function (d, s, id) {
        let js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s) as any;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs?.parentNode?.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    });
  },

  /**
   * Trigger the Meta OAuth Login flow
   */
  login(): Promise<{ accessToken: string; userID: string } | null> {
    return new Promise((resolve) => {
      if (!window.FB) {
        console.error("Facebook SDK not loaded");
        resolve(null);
        return;
      }

      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            resolve({
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID,
            });
          } else {
            resolve(null);
          }
        },
        {
          scope:
            "instagram_basic,instagram_manage_messages,instagram_content_publish,pages_manage_metadata,pages_read_engagement,pages_show_list",
        },
      );
    });
  },

  /**
   * Fetch all Instagram Direct Message conversations
   */
  async getConversations(): Promise<IGConversation[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(
        `${BASE_URL}/${activeAccountId}/conversations?platform=instagram&fields=participants,updated_time,messages.limit(1){message,from,created_time}&access_token=${activeToken}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch conversations");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching IG conversations:", error);
      return [];
    }
  },

  /**
   * Fetch full message history for a specific conversation
   */
  async getMessages(conversationId: string): Promise<IGMessage[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(
        `${BASE_URL}/${conversationId}?fields=messages{message,from,created_time}&access_token=${activeToken}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      return data.messages?.data || [];
    } catch (error) {
      console.error("Error fetching IG messages:", error);
      return [];
    }
  },

  /**
   * Send a direct message to a user
   */
  async sendMessage(recipientId: string, text: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const response = await fetch(
        `${BASE_URL}/${activeAccountId}/messages?access_token=${activeToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text },
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("IG API Error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending IG message:", error);
      return false;
    }
  },

  /**
   * Publish a photo to the Instagram Feed
   * Note: The Instagram Content Publishing API requires the image to be on a public, accessible URL.
   */
  async publishPost(imageUrl: string, caption: string): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn("Sandbox Mode: Would have posted to Instagram:", { imageUrl, caption });
      return "mock_post_id_123";
    }

    try {
      // Step 1: Create the media container
      const containerResponse = await fetch(
        `${BASE_URL}/${activeAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${activeToken}`,
        { method: "POST" },
      );

      if (!containerResponse.ok) {
        const error = await containerResponse.json();
        console.error("IG Media Container Error:", error);
        return null;
      }

      const containerData = await containerResponse.json();
      const creationId = containerData.id;

      // Step 2: Publish the media container
      const publishResponse = await fetch(
        `${BASE_URL}/${activeAccountId}/media_publish?creation_id=${creationId}&access_token=${activeToken}`,
        { method: "POST" },
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        console.error("IG Media Publish Error:", error);
        return null;
      }

      const publishData = await publishResponse.json();
      return publishData.id; // The ID of the live Instagram post
    } catch (error) {
      console.error("Error publishing to IG:", error);
      return null;
    }
  },
};
