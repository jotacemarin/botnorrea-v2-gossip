import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { OK, BAD_REQUEST } from "http-status";
import {
  SendMessageParams,
  TelegramService,
} from "../../lib/services/telegram";

const execute = async (
  body: SendMessageParams
): Promise<{ statusCode: number; body?: string }> => {
  if (!body?.chat_id) {
    return {
      statusCode: BAD_REQUEST,
      body: JSON.stringify({ error: "chat_id is missing" }),
    };
  }

  if (!body?.text) {
    return {
      statusCode: BAD_REQUEST,
      body: JSON.stringify({ error: "text is missing" }),
    };
  }

  TelegramService.initInstance();
  const sendMessageResponse = await TelegramService.sendMessage(body);

  return { statusCode: OK, body: JSON.stringify(sendMessageResponse?.data) };
};

export const telegramSendMessage = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);
  const response = await execute(body);
  return callback(null, response);
};
