import { GossipGroup, User } from "../../lib/models";
import {
  MessageTg,
  PhotoSizeTg,
  ReplyToMessageTg,
} from "../../lib/models/telegram";
import { BotnorreaService } from "../../lib/services/botnorrea";

const sendTextMessage = async (
  group: GossipGroup | { id: string | number },
  text: string
) => {
  await BotnorreaService.sendMessage({
    chat_id: group?.id,
    text: `Anonymous: ${text}`,
  });
};

const sendPhoto = async (
  group: GossipGroup | { id: string | number },
  photo: PhotoSizeTg,
  text: string,
  spoiler: boolean
) => {
  await BotnorreaService.sendPhoto({
    chat_id: group?.id,
    photo: photo?.file_id,
    caption: `Anonymous: ${text}`,
    has_spoiler: spoiler,
  });
};

export const sendMessage = async (
  message: MessageTg | ReplyToMessageTg,
  group: GossipGroup | { id: string | number },
  text: string,
  spoiler: boolean
) => {
  if (message?.text) {
    await sendTextMessage(group, text);
  }

  if (message?.caption) {
    const [bigPhoto] = message?.photo?.sort(
      (first, second) => first.file_size - second.file_size
    );

    await sendPhoto(group, bigPhoto, text, spoiler);
  }
};

export const getChats = async (user: User, chats: Array<string | number>) =>
  BotnorreaService.getChats({ user: user?.id, chats });
