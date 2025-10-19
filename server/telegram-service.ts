import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import type { IStorage } from "./storage";

export class TelegramService {
  private client: TelegramClient | null = null;
  private storage: IStorage;
  private isConnected: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async initializeClient(apiId: number, apiHash: string, sessionString: string = ""): Promise<void> {
    try {
      const session = new StringSession(sessionString);
      
      this.client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
      });

      if (!sessionString) {
        console.log("No session found. Client needs to be authenticated via phone number.");
      } else {
        await this.client.connect();
        this.isConnected = true;
        console.log("Telegram client connected successfully!");
      }
    } catch (error: any) {
      console.error("Failed to initialize Telegram client:", error.message);
      throw new Error(`Telegram initialization failed: ${error.message}`);
    }
  }

  async getSessionString(): Promise<string> {
    if (!this.client) {
      throw new Error("Telegram client not initialized");
    }
    return (this.client.session as StringSession).save();
  }

  async authenticateWithPhoneCode(
    phoneNumber: string,
    phoneCode: string,
    phoneCodeHash: string,
    password?: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error("Telegram client not initialized");
    }

    try {
      await this.client.start({
        phoneNumber: async () => phoneNumber,
        phoneCode: async () => phoneCode,
        password: password ? async () => password : undefined,
        onError: (err) => {
          throw err;
        },
      });

      this.isConnected = true;
      return this.getSessionString();
    } catch (error: any) {
      console.error("Authentication failed:", error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async sendPhoneCode(phoneNumber: string): Promise<{ phoneCodeHash: string }> {
    if (!this.client) {
      throw new Error("Telegram client not initialized");
    }

    try {
      await this.client.connect();
      const result = await this.client.sendCode(
        {
          apiId: this.client.apiId,
          apiHash: this.client.apiHash,
        },
        phoneNumber
      );

      return { phoneCodeHash: result.phoneCodeHash };
    } catch (error: any) {
      console.error("Failed to send phone code:", error.message);
      throw new Error(`Failed to send verification code: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log("Telegram client disconnected");
    }
  }

  async joinGroupAndVerify(groupLink: string, groupId?: string): Promise<{
    success: boolean;
    message: string;
    username?: string;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        success: false,
        message: "Telegram client not connected. Please configure API credentials first.",
      };
    }

    try {
      const logId = await this.createJoinLog(groupLink, groupId, "joining");

      const inviteHash = this.extractInviteHash(groupLink);
      if (!inviteHash) {
        await this.updateJoinLog(logId, "failed", "Invalid group link format");
        return {
          success: false,
          message: "Invalid Telegram group link",
        };
      }

      let chatEntity;
      try {
        const updates = await this.client.invoke(
          new Api.messages.ImportChatInvite({
            hash: inviteHash,
          })
        );

        if ("chats" in updates && updates.chats && updates.chats.length > 0) {
          chatEntity = updates.chats[0];
        }
        
        if (chatEntity) {
          await this.updateJoinLog(logId, "joined", undefined, new Date());
        }
      } catch (error: any) {
        if (error.message.includes("INVITE_HASH_EXPIRED")) {
          await this.updateJoinLog(logId, "failed", "Invite link has expired");
          return { success: false, message: "Invite link has expired" };
        } else if (error.message.includes("USER_ALREADY_PARTICIPANT")) {
          chatEntity = await this.client.getEntity(inviteHash);
          await this.updateJoinLog(logId, "joined", undefined, new Date());
        } else {
          throw error;
        }
      }

      await this.updateJoinLog(logId, "verified", undefined, undefined, new Date());

      await this.client.sendMessage(chatEntity, { message: "A" });
      await this.updateJoinLog(logId, "message_sent", undefined, undefined, undefined, new Date());

      const me = await this.client.getMe();
      const username = me.username || `${me.firstName || ""} ${me.lastName || ""}`.trim() || "Unknown";

      return {
        success: true,
        message: "Successfully joined group, verified membership, and sent confirmation message 'A'",
        username,
      };
    } catch (error: any) {
      console.error("Error in joinGroupAndVerify:", error);
      return {
        success: false,
        message: error.message || "Failed to join group",
      };
    }
  }

  private extractInviteHash(groupLink: string): string | null {
    const patterns = [
      /t\.me\/\+([A-Za-z0-9_-]+)/,
      /t\.me\/joinchat\/([A-Za-z0-9_-]+)/,
      /telegram\.me\/\+([A-Za-z0-9_-]+)/,
      /telegram\.me\/joinchat\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = groupLink.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private async createJoinLog(
    groupLink: string,
    groupId: string | undefined,
    status: string
  ): Promise<string> {
    const log = await this.storage.createTelegramJoinLog({
      groupId: groupId || null,
      groupLink,
      joinStatus: status,
      errorMessage: null,
      joinedAt: null,
      verifiedAt: null,
      messageSentAt: null,
    });
    return log.id;
  }

  private async updateJoinLog(
    logId: string,
    status: string,
    errorMessage?: string,
    joinedAt?: Date,
    verifiedAt?: Date,
    messageSentAt?: Date
  ): Promise<void> {
    await this.storage.updateTelegramJoinLog(logId, {
      joinStatus: status,
      errorMessage: errorMessage || undefined,
      joinedAt: joinedAt || undefined,
      verifiedAt: verifiedAt || undefined,
      messageSentAt: messageSentAt || undefined,
    });
  }

  async getCurrentUser(): Promise<{ username: string; phoneNumber: string }> {
    if (!this.client || !this.isConnected) {
      throw new Error("Telegram client not connected");
    }

    try {
      const me = await this.client.getMe();
      return {
        username: me.username || `${me.firstName || ""} ${me.lastName || ""}`.trim() || "Unknown",
        phoneNumber: me.phone || "Not available",
      };
    } catch (error: any) {
      console.error("Failed to get current user:", error);
      throw new Error("Failed to get user information");
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}
