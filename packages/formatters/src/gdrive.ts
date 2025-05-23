import { ParsedStream } from '@aiostreams/types';
import { formatDuration, formatSize, languageToEmoji } from './utils';
import { serviceDetails } from '@aiostreams/utils';

export function gdriveFormat(
  stream: ParsedStream,
  minimalistic: boolean = false
): {
  name: string;
  description: string;
} {
  let name: string = '';

  if (stream.provider) {
    const cacheStatus = stream.provider.cached
      ? '⚡'
      : stream.provider.cached === undefined
        ? '❓'
        : '⏳';
    const serviceShortName =
      serviceDetails.find((service) => service.id === stream.provider!.id)
        ?.shortName || stream.provider.id;
    name += `[${serviceShortName}${cacheStatus}]\n`;
  }

  if (stream.torrent?.infoHash) {
    name += `[P2P]\n`;
  }

  name += `${stream.addon.name} ${stream.personal ? '(Your Media) ' : ''}`;
  if (!minimalistic) {
    name += stream.resolution === '2160p' ? '4K' : stream.resolution;
  } else {
    name += stream.resolution !== 'Unknown' ? stream.resolution + '' : '';
  }

  let description: string = '';

  const title = `${stream.filename ?? ''} ${stream.folderName ?? ''}`;

  const cutTypes = [
    { name: 'Theatrical Cut', regex: /\bTheatrical\b/i },
    { name: 'Directors Cut', regex: /\b(extended|uncut|directors|special|unrated|uncensored|cut|version|edition)(\b|\d)/i },
    { name: 'IMAX Enhanced', regex: /\b(IMAX[ ._-]Enhanced)\b/i },
    { name: 'IMAX', regex: /\b((?<!NON[ ._-])IMAX)\b/i },
    { name: 'Open Matte', regex: /\b(Open[ ._-]?Matte)\b/i },
  ];

  for (const cut of cutTypes) {
    if (cut.regex.test(title)) {
      description += `❗ ${cut.name}\n`;
      break;
    }
  }

  if (stream.quality || stream.encode) {
    description += stream.quality !== 'Unknown' ? `🎥 ${stream.quality} ` : '';
    description += stream.encode !== 'Unknown' ? `🎞️ ${stream.encode} ` : '';
    description += '\n';
  }

  if (stream.visualTags.length > 0 || stream.audioTags.length > 0) {
    description +=
      stream.visualTags.length > 0
        ? `📺 ${stream.visualTags.join(' | ')}   `
        : '';
    description +=
      stream.audioTags.length > 0 ? `🎧 ${stream.audioTags.join(' | ')}` : '';
    description += '\n';
  }

  if (
    stream.size ||
    (stream.torrent?.seeders && !minimalistic) ||
    (minimalistic && stream.torrent?.seeders && !stream.provider?.cached) ||
    stream.usenet?.age ||
    stream.duration
  ) {
    description += `📦 ${formatSize(stream.size || 0)} `;
    description += stream.duration
      ? `⏱️ ${formatDuration(stream.duration)} `
      : '';
    description +=
      (stream.torrent?.seeders !== undefined && !minimalistic) ||
      (minimalistic && stream.torrent?.seeders && !stream.provider?.cached)
        ? `👥 ${stream.torrent.seeders} `
        : '';
    description += stream.usenet?.age ? `📅 ${stream.usenet.age} ` : '';
    description += '\n';
  }

  if (stream.languages.length !== 0) {
    let languages = stream.languages;
    if (minimalistic) {
      languages = languages.map(
        (language) => languageToEmoji(language) || language
      );
    }
    description += `🔊 ${languages.join(' | ')}`;
    description += '\n';
  }

  if (stream.message) {
    description += `📢 ${stream.message}`;
  }

  description = description.trim();
  name = name.trim();
  return { name, description };
}
