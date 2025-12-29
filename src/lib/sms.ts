import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, body: string) {
    if (!client || !fromPhoneNumber) {
        console.warn("SMS Skipped: Twilio credentials not configured.");
        return { success: false, error: "Twilio not configured" };
    }

    try {
        const message = await client.messages.create({
            body,
            from: fromPhoneNumber,
            to,
        });
        console.log("SMS Sent:", message.sid);
        return { success: true, sid: message.sid };
    } catch (error: any) {
        console.error("SMS Error:", error.message);
        return { success: false, error: error.message };
    }
}
