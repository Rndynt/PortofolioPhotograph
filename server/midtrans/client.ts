import * as midtransClient from 'midtrans-client';

/**
 * Transaction details for Midtrans Snap
 */
export interface SnapTransactionParams {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

/**
 * Response from Midtrans Snap transaction creation
 */
export interface SnapTransactionResponse {
  token: string;
  redirect_url: string;
}

/**
 * Creates a Midtrans Snap transaction and returns the payment token and redirect URL
 * @param params - The transaction parameters including transaction details, customer details, and item details
 * @returns Object containing token and redirect_url for payment
 * @throws Error if environment variables are missing or transaction creation fails
 */
export async function createSnapTransaction(
  params: SnapTransactionParams
): Promise<SnapTransactionResponse> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY environment variable is not set');
  }

  if (!clientKey) {
    throw new Error('MIDTRANS_CLIENT_KEY environment variable is not set');
  }

  try {
    const snap = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    const transaction = await snap.createTransaction(params);

    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create Midtrans transaction: ${error.message}`);
    }
    throw new Error('Failed to create Midtrans transaction: Unknown error');
  }
}
