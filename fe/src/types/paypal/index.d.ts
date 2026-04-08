declare module "@paypal/react-paypal-js" {
  import React from "react";

  export interface PayPalScriptProviderProps {
    options: {
      clientId: string;
      currency?: string;
      intent?: string;
      [key: string]: unknown;
    };
    children: React.ReactNode;
  }

  export interface PayPalButtonsProps {
    style?: {
      layout?: "vertical" | "horizontal";
      color?: string;
      shape?: string;
      label?: string;
      height?: number;
    };
    forceReRender?: unknown[];
    createOrder?: () => Promise<string>;
    onApprove?: (data: { orderID: string }) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
  }

  export const PayPalScriptProvider: React.FC<PayPalScriptProviderProps>;
  export const PayPalButtons: React.FC<PayPalButtonsProps>;
}
