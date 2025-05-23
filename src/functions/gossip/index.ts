import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { BAD_REQUEST, NO_CONTENT, INTERNAL_SERVER_ERROR } from "http-status";
import { FormattingOptionsTg, UpdateTg } from "../../lib/models";
import {
  BotnorreaService,
  InlineKeyboardMarkup,
  SendMessageParams,
} from "../../lib/services/botnorrea";
import { UserDao, GossipGroupDao } from "../../lib/dao";
import { getTextCommand } from "../../lib/utils/telegramHelper";
import executeMessage from "./message";
import executeCallback from "./callback";

const cleanGossipText = (
  body: UpdateTg
): { text: string; spoiler: boolean } => {
  const command = getTextCommand(body);
  let result = "";

  if (body?.message?.text) {
    result = body?.message?.text;
  }

  if (body?.message?.caption) {
    result = body?.message?.caption;
  }

  const text = result?.replace(String(command), "")?.trim();

  return { text: `<tg-spoiler>${text}</tg-spoiler>`, spoiler: true };
};

const replyMessage = async (
  body: UpdateTg,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<void> => {
  const params: SendMessageParams = {
    chat_id: body?.message!.chat?.id,
    text,
    reply_to_message_id: body?.message!.message_id,
    parse_mode: FormattingOptionsTg.HTML,
    reply_markup: replyMarkup,
  };

  if (replyMarkup) {
    params.reply_markup = replyMarkup;
  }

  await BotnorreaService.sendMessage(params);
};

const replyCallback = async (body: UpdateTg, text: string): Promise<void> => {
  const params: SendMessageParams = {
    chat_id: body?.callback_query!.message?.chat?.id,
    text,
    reply_to_message_id: body?.callback_query!.message?.message_id,
    parse_mode: FormattingOptionsTg.HTML,
  };

  await BotnorreaService.sendMessage(params);
  return;
};

const execute = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  BotnorreaService.initInstance();
  await UserDao.initInstance();
  await GossipGroupDao.initInstance();

  if (body?.message) {
    const { statusCode, text, replyMarkup } = await executeMessage(
      body,
      cleanGossipText
    );
    await replyMessage(body, text, replyMarkup);
    return { statusCode };
  }

  if (body?.callback_query) {
    const { statusCode, text } = await executeCallback(body, cleanGossipText);

    if (text) {
      await replyCallback(body, text);
    }

    return { statusCode };
  }

  return { statusCode: NO_CONTENT };
};

export const gossip = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);

  try {
    const response = await execute(body);
    return callback(null, response);
  } catch (error) {
    return callback(error, { statusCode: INTERNAL_SERVER_ERROR });
  }
};
