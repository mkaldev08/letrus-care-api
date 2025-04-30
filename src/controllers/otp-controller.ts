import { Twilio } from "twilio";

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function generateVerificationCode() {
  const min = 100000; // valor mínimo (6 dígitos)
  const max = 999999; // valor máximo (6 dígitos)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function sendSMSVerification(
  phoneNumber: string
): Promise<number> {
  try {
    const newCode = generateVerificationCode();
    client.messages.create({
      body: `Your Letrus Care Code: ${newCode}`,
      to: phoneNumber,
      from: process.env.MY_PHONE_NUMBER as string,
    });
    return newCode;
  } catch (error) {
    throw error;
  }
}
