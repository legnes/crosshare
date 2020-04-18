/** @jsx jsx */
import { jsx } from '@emotion/core';

import * as React from 'react';
import createDetectElementResize from './vendor/detectElementResize';
import {
  TINY_COL_MIN_HEIGHT, SMALL_BREAKPOINT, LARGE_BREAKPOINT
} from './style';

interface SquareProps {
  contents: (size:number) => React.ReactNode,
  heightAdjust: number,
}
export const Square = (props: SquareProps) => {
  const [size, setSize] = React.useState(0);
  const squareElem = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const detectElementResize = createDetectElementResize(null);
    if (squareElem.current) {
      const parent = squareElem.current.parentNode;
      if (parent && parent instanceof HTMLElement) {
        const onResize = () => {
          const winHeight = window.innerHeight;
          const winWidth = window.innerWidth;
          let width = parent.offsetWidth || 0;
          let maxHeight = winHeight - TINY_COL_MIN_HEIGHT - props.heightAdjust;
          let maxWidth = winWidth;
          if (width >= LARGE_BREAKPOINT) {
            maxHeight = winHeight - props.heightAdjust;
            maxWidth = winWidth * 0.5;
          } else if (width >= SMALL_BREAKPOINT) {
            maxHeight = winHeight - props.heightAdjust;
            maxWidth = winWidth * 0.66;
          }
          width = Math.min(width, maxWidth);
          const height = Math.min(parent.offsetHeight || 0, maxHeight);
          const style = window.getComputedStyle(parent) || {};
          const paddingLeft = parseInt(style.paddingLeft, 10) || 0;
          const paddingRight = parseInt(style.paddingRight, 10) || 0;
          const paddingTop = parseInt(style.paddingTop, 10) || 0;
          const paddingBottom = parseInt(style.paddingBottom, 10) || 0;
          const newHeight = height - paddingTop - paddingBottom;
          const newWidth = width - paddingLeft - paddingRight;
          setSize(Math.min(newHeight, newWidth));
        }
        onResize();
        detectElementResize.addResizeListener(parent, onResize);
        return () => detectElementResize.removeResizeListener(parent, onResize);
      }
    }
  }, [props.heightAdjust]);

  return (
    <div ref={squareElem} css={{
      flex: 'none',
      width: size,
      height: size
    }}>{size !== 0 && props.contents(size)}</div>
  );
}