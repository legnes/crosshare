import { ReactNode } from 'react';
import { HUGE_AND_UP, MAX_WIDTH } from '../lib/style';

export function FeatureList(props: { children: ReactNode }) {
  return (
    <div
      css={{
        margin: '1em',
        [HUGE_AND_UP]: {
          maxWidth: MAX_WIDTH,
          margin: '1em auto',
        },
        columns: '3 300px',
        columnGap: '1em',
      }}
    >
      {props.children}
    </div>
  );
}

export function FeatureListItem(props: {
  icon: ReactNode;
  heading: string;
  text: string;
}) {
  return (
    <div
      css={{
        display: 'inline-block',
        margin: '0 0 1em',
        width: '100%',
      }}
    >
      <h3 className="textAlignCenter">{props.heading}</h3>
      <div
        css={{
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div css={{ marginRight: '0.5em', fontSize: '200%' }}>{props.icon}</div>
        <p className="flex1">{props.text}</p>
      </div>
    </div>
  );
}
