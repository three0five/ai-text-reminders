
/**
 * Service for sending SMS messages through Supabase edge function
 */

interface SendSmsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Sends an SMS message via the Supabase edge function
 * 
 * @param to - The recipient phone number (E.164 format, e.g. +1234567890)
 * @param message - The message content to send
 * @returns A promise that resolves to a SendSmsResponse object
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResponse> {
  try {
    // Validate phone number format (basic E.164 validation)
    if (!to.startsWith('+') || to.length < 8) {
      return {
        success: false,
        error: 'Invalid phone number format. Please use E.164 format (e.g. +1234567890)'
      };
    }

    // Validate message is not empty
    if (!message.trim()) {
      return {
        success: false,
        error: 'Message cannot be empty'
      };
    }

    const response = await fetch('https://wngbiquntzfxilvzrnza.functions.supabase.co/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        message
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: data.message || 'SMS sent successfully'
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to send SMS'
      };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Alias for send_sms to match the requested function name
export const send_sms = sendSms;
