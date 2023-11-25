import Image from 'next/image';
import slateLogo from '../public/slate/Logo.png';

interface SlateHeaderProps {
  title: string;
  author: string;
  publishTime: number;
}

export const SlateHeader = (props: SlateHeaderProps) => {
  const publishDate = new Date(props.publishTime);

  return (
    <div css={{ width: '100%', textAlign: 'center' }}>
      <div
        css={{
          maxHeight: '3.115rem',
          width: '100%',
          overflow: 'hidden',
          marginBottom: '2.27rem',
        }}
      >
        <Image
          src={slateLogo}
          alt="Slate Crosswords"
          css={{ objectFit: 'contain', maxHeight: '2.89rem', maxWidth: '100%' }}
        />
      </div>
      <h1
        css={{
          fontSize: '1.647rem',
          fontWeight: 'bold',
          color: 'var(--slate-title)',
          marginBottom: '1.41rem',
        }}
      >
        {props.title}
      </h1>
      <h2
        css={{
          textTransform: 'uppercase',
          fontSize: '1rem',
          fontWeight: 'normal',
          color: 'var(--slate-subtitle)',
          letterSpacing: '0.08rem',
          marginBottom: '2.24rem',
        }}
      >
        By {props.author} &bull;{' '}
        {publishDate.toLocaleDateString('en-us', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        })}
        &emsp;&emsp;
        {publishDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'EST',
        })}
      </h2>
    </div>
  );
};
