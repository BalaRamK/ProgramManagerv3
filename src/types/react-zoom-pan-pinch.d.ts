declare module 'react-zoom-pan-pinch' {
  import React from 'react';

  export interface TransformState {
    scale: number;
    positionX: number;
    positionY: number;
  }

  export interface TransformOptions {
    limitToBounds?: boolean;
    transformEnabled?: boolean;
    disabled?: boolean;
    limitToWrapper?: boolean;
  }

  export interface TransformComponentProps {
    children: React.ReactNode;
    wrapperClass?: string;
    contentClass?: string;
    wrapperStyle?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
    defaultScale?: number;
    defaultPositionX?: number;
    defaultPositionY?: number;
    positionX?: number;
    positionY?: number;
    scale?: number;
    options?: TransformOptions;
    onInit?: (state: TransformState) => void;
    onZoomChange?: (state: TransformState) => void;
    onPanningChange?: (state: TransformState) => void;
    onZoom?: (state: TransformState) => void;
    onPanning?: (state: TransformState) => void;
    onWheelStart?: (state: TransformState) => void;
    onWheelStop?: (state: TransformState) => void;
  }

  export const TransformWrapper: React.FC<TransformComponentProps>;
  export const TransformComponent: React.FC<any>;
  
  export function useTransformContext(): {
    state: TransformState;
    zoom: (scale: number, options?: TransformOptions) => void;
    zoomIn: (options?: TransformOptions) => void;
    zoomOut: (options?: TransformOptions) => void;
    setTransform: (positionX: number, positionY: number, scale: number, options?: TransformOptions) => void;
    resetTransform: (options?: TransformOptions) => void;
    centerView: (scale?: number, options?: TransformOptions) => void;
  };
} 