declare module 'react-quill' {
  import React from 'react';
  
  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta: any, source: any, editor: any) => void;
    onChangeSelection?: (range: any, source: any, editor: any) => void;
    onFocus?: (range: any, source: any, editor: any) => void;
    onBlur?: (previousRange: any, source: any, editor: any) => void;
    onKeyPress?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
    modules?: any;
    formats?: string[];
    theme?: string;
    style?: React.CSSProperties;
    className?: string;
    readOnly?: boolean;
    placeholder?: string;
    preserveWhitespace?: boolean;
    scrollingContainer?: string | HTMLElement;
    bounds?: string | HTMLElement;
    id?: string;
    tabIndex?: number;
  }
  
  export default class ReactQuill extends React.Component<ReactQuillProps> {
    static Quill: any;
    getEditor(): any;
    focus(): void;
    blur(): void;
  }
} 