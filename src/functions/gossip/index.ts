import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import {
  BAD_REQUEST,
  OK,
  NOT_FOUND,
  NO_CONTENT,
  INTERNAL_SERVER_ERROR,
} from "http-status";
import {
  ChatTypeTg,
  FormattingOptionsTg,
  UpdateTg,
  User,
} from "../../lib/models";
import { getTextCommand } from "../../lib/utils/telegramHelper";
import {
  BotnorreaService,
  InlineKeyboardMarkup,
  SendMessageParams,
} from "../../lib/services/botnorrea";
import { UserDao } from "../../lib/dao/userDao";
import { GossipGroupDao } from "../../lib/dao/gossipGroupDao";
import { MessageTg } from "../../lib/models/telegram";

const replyMessage = async (
  body: UpdateTg,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<void> => {
  const params: SendMessageParams = {
    chat_id: body?.message!.chat?.id,
    text,
    reply_to_message_id: body?.message!.message_id,
    parse_mode: FormattingOptionsTg?.HTML,
    reply_markup: replyMarkup,
  };

  if (replyMarkup) {
    params.reply_markup = replyMarkup;
  }

  await BotnorreaService.sendMessage(params);
  return;
};

const replyCallback = async (body: UpdateTg, text: string): Promise<void> => {
  const params: SendMessageParams = {
    chat_id: body?.callback_query!.message?.chat?.id,
    text,
    reply_to_message_id: body?.callback_query!.message?.message_id,
    parse_mode: FormattingOptionsTg?.HTML,
  };

  await BotnorreaService.sendMessage(params);
  return;
};

const cleanGossipText = (body: UpdateTg): string => {
  const command = getTextCommand(body);
  return body?.message!.text?.replace(String(command), "")?.trim();
};

const getGroupFromCallback = (
  body: UpdateTg,
  groupId: number | string
): string | undefined => {
  try {
    return body.callback_query!.message?.reply_markup?.inline_keyboard[0]?.find(
      (keyboardButtom) => keyboardButtom?.callback_data === String(groupId)
    )?.text;
  } catch {
    return undefined;
  }
};

const buildPrivateReply = (
  body: UpdateTg,
  groupId: number | string,
  message: string
): string => {
  const groupName = getGroupFromCallback(body, groupId);
  return [
    `Gossip: ${message}`,
    groupName ? `\n\nto: <b>${groupName}</b> ` : ``,
  ].join("");
};

const getUser = async (body: UpdateTg): Promise<User | null> => {
  return UserDao.findByTelegramId(Number(body?.message?.from?.id));
};

const getGroups = async (user: User) => {
  const groups = await GossipGroupDao.findAll();
  const chatsId = groups?.map((group) => group?.id);

  const chats = await BotnorreaService.getChats({
    user: user?.id,
    chats: chatsId,
  });

  return chats?.data?.map((chat) => chat?.group);
};

const editMessage = async (body: UpdateTg, text: string): Promise<void> => {
  const {
    chat: { id: chatId },
    message_id: messageId,
  } = body?.callback_query!.message;
  await BotnorreaService.editMessage({
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: { inline_keyboard: [] },
  });
};

const executeMessage = async (
  body: UpdateTg
): Promise<{
  statusCode: number;
  text: string;
  replyMarkup?: InlineKeyboardMarkup;
}> => {
  if (body?.message?.chat?.type !== ChatTypeTg.PRIVATE) {
    return {
      statusCode: BAD_REQUEST,
      text: "Is not allowed in group chat",
    };
  }

  const user = await getUser(body);
  if (!user) {
    return { statusCode: NOT_FOUND, text: "User not found" };
  }

  const groups = await getGroups(user);
  if (!groups.length) {
    return { text: "Crews not found", statusCode: NOT_FOUND };
  }

  return {
    text: `Please select chat to send the gossip:`,
    replyMarkup: {
      inline_keyboard: [
        ...groups.map((group) => [
          {
            text: group?.title,
            callback_data: String(group?.id),
          },
        ]),
      ],
    },
    statusCode: OK,
  };
};

const executeCallback = async (
  body: UpdateTg
): Promise<{
  statusCode: number;
  text: string;
}> => {
  const groupId = body?.callback_query!.data;

  const group = await GossipGroupDao.findById(groupId);
  if (!group) {
    return {
      statusCode: NOT_FOUND,
      text: "Group not found",
    };
  }

  const message = cleanGossipText({
    update_id: body.update_id,
    message: body?.callback_query!.message?.reply_to_message as MessageTg,
  });

  await Promise.all([
    BotnorreaService.sendMessage({
      chat_id: group?.id,
      text: `Anonymous: ${message}`,
    }),
    editMessage(body, `Gossip sent!`),
  ]);

  const privateReply = buildPrivateReply(body, group?.id, message);

  return {
    statusCode: OK,
    text: privateReply,
  };
};

const execute = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  BotnorreaService.initInstance();
  await UserDao.initInstance();
  await GossipGroupDao.initInstance();

  if (body?.message) {
    const { statusCode, text, replyMarkup } = await executeMessage(body);
    await replyMessage(body, text, replyMarkup);
    return { statusCode };
  }

  if (body?.callback_query) {
    const { statusCode, text } = await executeCallback(body);
    await replyCallback(body, text);
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
