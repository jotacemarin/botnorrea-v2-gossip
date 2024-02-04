import {
  FormattingOptionsTg,
  GossipGroup,
  MessageTg,
  PhotoSizeTg,
  User,
  VideoTg,
} from "../../lib/models";
import { BotnorreaService } from "../../lib/services";

const sendTextMessage = async (
  group: GossipGroup | { id: string | number },
  text: string
) => {
  await BotnorreaService.sendMessage({
    chat_id: group?.id,
    text: `Anonymous: ${text}`,
    parse_mode: FormattingOptionsTg.HTML,
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
    parse_mode: FormattingOptionsTg.HTML,
  });
};

const sendVideo = async (
  group: GossipGroup | { id: string | number },
  video: VideoTg,
  text: string,
  spoiler: boolean
) => {
  await BotnorreaService.sendVideo({
    chat_id: group?.id,
    video: video?.file_id,
    caption: `Anonymous: ${text}`,
    has_spoiler: spoiler,
    parse_mode: FormattingOptionsTg.HTML,
  });
};

export const sendMessage = async (
  message: MessageTg,
  group: GossipGroup | { id: string | number },
  text: string,
  spoiler: boolean
) => {
  if (message?.text) {
    await sendTextMessage(group, text);
  }

  if (message?.photo) {
    const [bigPhoto] = message?.photo?.sort(
      (first, second) => first.file_size - second.file_size
    );

    await sendPhoto(group, bigPhoto, text, spoiler);
  }

  if (message?.video) {
    await sendVideo(group, message?.video, text, spoiler);
  }
};

export const getChats = async (user: User, chats: Array<string | number>) =>
  BotnorreaService.getChats({ user: user?.id, chats });
