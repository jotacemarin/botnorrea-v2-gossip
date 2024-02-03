import { BAD_REQUEST, NOT_FOUND, OK } from "http-status";
import { ChatTypeTg, UpdateTg, User } from "../../lib/models";
import { InlineKeyboardMarkup } from "../../lib/services";
import { GossipGroupDao, UserDao } from "../../lib/dao";
import { getChats, sendMessage } from "./botnorreaHelper";

const getUser = async (body: UpdateTg): Promise<User | null> => {
  return UserDao.findByTelegramId(Number(body?.message?.from?.id));
};

const getGroups = async (user: User) => {
  const groups = await GossipGroupDao.findAll();
  const ids = groups?.map((group) => group?.id);

  const chats = await getChats(user, ids);

  return chats?.data?.map((chat) => chat?.group);
};

const executeMessage = async (
  body: UpdateTg,
  cleanGossipText: (body: UpdateTg) => { text: string; spoiler: boolean }
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

  if (groups.length === 1) {
    const [group] = groups;
    const { text, spoiler } = cleanGossipText(body);

    await sendMessage(body?.message, group, text, spoiler);

    return {
      text: `A gossip was sent to: <b>${group?.title}</b>`,
      statusCode: OK,
    };
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

export default executeMessage;
