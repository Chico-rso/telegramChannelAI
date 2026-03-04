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
    const copyLabel = post.variant === 'list' ? '🧩 Сохраните подборку' : '👇 Скопируйте и вставьте';
    const exampleLabel = post.variant === 'list' ? '💡 Что получится' : '💡 Пример результата';

    return [
      `<b>❗ ${escapeHtml(post.title)}</b>`,
      '',
      `${escapeHtml(post.explanation)}`,
      '',
      `<b>${copyLabel}</b>`,
      `<pre>${escapeHtml(post.copyBlock)}</pre>`,
      '',
      `<b>${exampleLabel}</b>`,
      `${escapeHtml(post.exampleResult)}`,
      '',
      `🔁 ${escapeHtml(post.cta)}`,
    ].join('\n');
  }
}
