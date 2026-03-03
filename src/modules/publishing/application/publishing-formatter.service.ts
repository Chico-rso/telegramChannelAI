import { Injectable } from '@nestjs/common';
import { StructuredTelegramPost } from '../../../core/domain/content.types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class PublishingFormatterService {
  toTelegramMessage(post: StructuredTelegramPost): string {
    return [
      `<b>${escapeHtml(post.title)}</b>`,
      '',
      `${escapeHtml(post.explanation)}`,
      '',
      '<b>Скопируйте и вставьте:</b>',
      `<pre>${escapeHtml(post.copyBlock)}</pre>`,
      '',
      '<b>Пример результата:</b>',
      `${escapeHtml(post.exampleResult)}`,
      '',
      `${escapeHtml(post.cta)}`,
    ].join('\n');
  }
}
