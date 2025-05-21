
export const sendCode = (phone: string) =>
  fetch("/functions/v1/send-verification",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }) });

export const confirmCode = (phone: string, code: string) =>
  fetch("/functions/v1/confirm-verification",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code }) });
