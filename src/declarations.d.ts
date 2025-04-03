declare module 'draft-js';
declare module 'draft-convert';
declare module 'draft-js-plugins-editor';
declare module 'draft-js-plugins-editor/lib/pluginUtils/utils';
declare module 'draft-js-plugins-editor/lib/pluginUtils/modifiers';
declare module 'draft-js-plugins-editor/lib/pluginUtils/modifiers/handleKeyCommand';
declare module 'draft-js-plugins-editor/lib/pluginUtils/modifiers/handlePastedText';
declare module 'draft-js-plugins-editor/lib/pluginUtils/modifiers/handleBeforeInput';

declare module 'draft-js-export-html' {
  import { ContentState } from 'draft-js';
  export function stateToHTML(state: ContentState): string;
}

declare module 'draft-js-import-html' {
  import { ContentState } from 'draft-js';
  export function stateFromHTML(html: string): ContentState;
}