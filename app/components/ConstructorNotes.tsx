import { Markdown } from './Markdown';

export const ConstructorNotes = (props: {
  isContest: boolean;
  notes: string;
}) => (
  <Markdown
    css={{
      backgroundColor: 'var(--secondary)',
      padding: '0.5em',
      borderRadius: '0.5em',
    }}
    text={`**${props.isContest ? 'Meta Prompt' : 'Constructor\'s Note'}:** ${
      props.notes
    }`}
  />
);
