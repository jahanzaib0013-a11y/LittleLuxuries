// SafePay Service for Pakistani Payment Integration
// This service handles SafePay API calls for payment processing

export interface SafePaySessionRequest {
  merchant_api_key: string;
  user?: string;
  intent: "CYBERSOURCE" | "EASYPAY";
  mode: "payment";
  entry_mode: "raw";
  currency: "PKR" | "USD";
  amount: number; // Amount in paisa (for PKR) or cents (for USD)
  metadata?: {
    order_id: string;
    customer_name?: string;
    customer_email?: string;
    [key: string]: any;
  };
}

export interface SafePaySessionResponse {
  success: boolean;
  data: {
    session_id: string;
    checkout_url: string;
    expires_at: string;
    merchant_api_key: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface EasyPaisaQRRequest {
  account_id: string;
  amount: number;
  order_id: string;
  merchant_id: string;
  expires_at?: string;
}

export interface EasyPaisaQRResponse {
  success: boolean;
  data: {
    qr_code: string;
    account_id: string;
    expires_at: string;
    payment_url?: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

class SafePayService {
  private apiKey: string;
  private secretKey: string;
  private environment: "sandbox" | "production";

  constructor(
    apiKey: string,
    secretKey: string,
    environment: "sandbox" | "production" = "sandbox",
  ) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.environment = environment;
  }

  private getBaseUrl(): string {
    return this.environment === "production"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";
  }

  /**
   * Create a SafePay payment session
   */
  async createPaymentSession(request: SafePaySessionRequest): Promise<SafePaySessionResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/payments/session/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          ...request,
          merchant_api_key: this.apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: {} as any,
          error: {
            message: data.message || "Failed to create SafePay session",
            code: data.code,
          },
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        data: {} as any,
        error: {
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  }

  /**
   * Create EasyPaisa QR code for payment
   */
  async createEasyPaisaQR(request: EasyPaisaQRRequest): Promise<EasyPaisaQRResponse> {
    try {
      // This would integrate with EasyPaisa API
      // For now, returning a mock response
      const mockResponse = {
        success: true,
        data: {
          qr_code: `https://api.easypaisa.com/qr/${Math.random().toString(36).substr(2, 9)}`,
          account_id: request.account_id,
          expires_at: request.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          payment_url: `https://easypaisa.com/pay/${Math.random().toString(36).substr(2, 9)}`,
        },
      };

      return mockResponse;
    } catch (error) {
      return {
        success: false,
        data: {} as any,
        error: {
          message: error instanceof Error ? error.message : "Failed to create EasyPaisa QR",
        },
      };
    }
  }

  /**
   * Verify payment status (webhook or polling)
   */
  async verifyPayment(
    sessionId: string,
  ): Promise<{ success: boolean; status: string; data?: any }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/payments/session/${sessionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: data.status || "unknown",
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        status: "error",
      };
    }
  }

  /**
   * Get payment methods available
   */
  getAvailablePaymentMethods() {
    return [
      {
        id: "safepay",
        name: "SafePay",
        description: "Credit/Debit cards & digital payments",
        icon: "credit-card",
        currencies: ["PKR"],
        fees: {
          PKR: "2.5% + Rs. 20",
        },
      },
      {
        id: "easypaisa",
        name: "EasyPaisa",
        description: "Mobile wallet QR payment",
        icon: "smartphone",
        currencies: ["PKR"],
        fees: {
          PKR: "1.5% + Rs. 10",
        },
      },
      {
        id: "jazzcash",
        name: "JazzCash",
        description: "Mobile wallet payment",
        icon: "smartphone",
        currencies: ["PKR"],
        fees: {
          PKR: "1.5% + Rs. 10",
        },
      },
      {
        id: "bank",
        name: "Bank Transfer",
        description: "HBL, Meezan, Allied Bank",
        icon: "building",
        currencies: ["PKR"],
        fees: {
          PKR: "Rs. 0 (Free)",
        },
      },
      {
        id: "cod",
        name: "Cash on Delivery",
        description: "Pay when you receive",
        icon: "wallet",
        currencies: ["PKR"],
        fees: {
          PKR: "Rs. 50 (Delivery charge)",
        },
      },
    ];
  }

  /**
   * Format amount for SafePay (in paisa for PKR)
   */
  formatAmount(amount: number, currency: "PKR" | "USD" = "PKR"): number {
    if (currency === "PKR") {
      return Math.round(amount * 100); // Convert to paisa
    }
    return Math.round(amount * 100); // Convert to cents
  }

  /**
   * Validate Pakistani phone number
   */
  validatePakistaniPhone(phone: string): boolean {
    const phoneRegex = /^03\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  }

  /**
   * Validate Pakistani CNIC
   */
  validatePakistaniCNIC(cnic: string): boolean {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  }
}

// Export singleton instance
export const safepayService = new SafePayService(
  process.env.VITE_SAFEPAY_API_KEY || "",
  process.env.VITE_SAFEPAY_SECRET_KEY || "",
  (process.env.VITE_SAFEPAY_ENVIRONMENT as "sandbox" | "production") || "sandbox",
);

// Mock service for testing without API keys
export const mockSafePayService = {
  async createPaymentSession(request: SafePaySessionRequest): Promise<SafePaySessionResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      data: {
        session_id: "sess_" + Math.random().toString(36).substr(2, 9),
        checkout_url:
          "https://checkout.sandbox.getsafepay.com/pay/" + Math.random().toString(36).substr(2, 9),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        merchant_api_key: request.merchant_api_key,
      },
    };
  },

  async createEasyPaisaQR(request: EasyPaisaQRRequest): Promise<EasyPaisaQRResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        qr_code: `https://api.easypaisa.com/qr/${Math.random().toString(36).substr(2, 9)}`,
        account_id: request.account_id,
        expires_at: request.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        payment_url: `https://easypaisa.com/pay/${Math.random().toString(36).substr(2, 9)}`,
      },
    };
  },

  getAvailablePaymentMethods() {
    return safepayService.getAvailablePaymentMethods();
  },

  formatAmount(amount: number, currency: "PKR" | "USD" = "PKR"): number {
    return safepayService.formatAmount(amount, currency);
  },

  validatePakistaniPhone(phone: string): boolean {
    return safepayService.validatePakistaniPhone(phone);
  },

  validatePakistaniCNIC(cnic: string): boolean {
    return safepayService.validatePakistaniCNIC(cnic);
  },
};

export default SafePayService;
