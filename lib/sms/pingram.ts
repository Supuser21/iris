import { Pingram } from "pingram";

let client: Pingram | null = null;

function getClient() {
  if (!client) {
    client = new Pingram({ apiKey: process.env.PINGRAM_API_KEY! });
  }
  return client;
}

export function hasPingramConfig() {
  return Boolean(process.env.PINGRAM_API_KEY);
}

export function getPingramFrom() {
  return process.env.PINGRAM_FROM_NUMBER ?? "+16505093842";
}

export async function sendViaPingram(to: string, body: string) {
  const type = process.env.PINGRAM_NOTIFICATION_TYPE ?? "iris_sms";
  const userId = to.replace(/\D/g, "") || to;
  return getClient().send({
    type,
    to: { id: userId, number: to },
    sms: { message: body },
  });
}
