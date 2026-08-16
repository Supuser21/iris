import twilio from "twilio";

export function hasTwilioConfig() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export function getTwilioFrom() {
  return process.env.TWILIO_PHONE_NUMBER!;
}

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

export async function sendViaTwilio(to: string, body: string) {
  const truncated = body.length > 320 ? body.slice(0, 317) + "..." : body;
  return getClient().messages.create({
    body: truncated,
    from: getTwilioFrom(),
    to,
  });
}
