import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { requiresAuth, AuthProps } from '../components/AuthContext';
import { UserPlaysV, AuthoredPuzzlesV } from '../helpers/dbtypes';
import { getFromSessionOrDB } from '../helpers/dbUtils';
import { timeString } from '../helpers/utils'
import { App } from '../helpers/firebase';
import { TopBar } from '../components/TopBar';

export const PlayListItem = (props: UserPlay) => {
  return (
    <li key={props.id}><Link href='/crosswords/[puzzleId]' as={`/crosswords/${props.id}`} passHref><a>{props.title}</a></Link> {props.didComplete ? "completed " + (props.didCheat ? "with helpers" : "without helpers") : "unfinished"} {timeString(props.playTime, false)}</li>
  );
}

export const AuthoredListItem = (props: AuthoredPuzzle) => {
  return (
    <li key={props.id}><Link href='/crosswords/[puzzleId]' as={`/crosswords/${props.id}`} passHref><a>{props.title}</a></Link></li>
  );
}

export const getDisplayName = (user: firebase.User) => {
  return user.displayName || "Anonymous Crossharer";
}

export const DisplayNameForm = ({ user, onChange, onCancel }: { user: firebase.User, onChange: (newName: string) => void, onCancel?: () => void }) => {
  function sanitize(input: string) {
    return input.replace(/[^0-9a-zA-Z ]/g, '');
  }
  const [newDisplayName, setNewDisplayName] = React.useState(sanitize(getDisplayName(user)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDisplayName.trim()) {
      user.updateProfile({ displayName: newDisplayName.trim() }).then(() => {
        if (!user.displayName) {
          throw new Error("something went wrong");
        }
        onChange(user.displayName);
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Update display name:
        <input css={{ margin: '0 0.5em', }} type="text" value={newDisplayName} onChange={e => setNewDisplayName(sanitize(e.target.value))} />
      </label>
      <input type="submit" value="Save" />
      {onCancel ?
        <button type="button" css={{ marginLeft: '0.5em' }} onClick={onCancel}>Cancel</button>
        : ''}
    </form>
  );
};

interface AuthoredPuzzle {
  id: string,
  createdAt: firebase.firestore.Timestamp,
  title: string,
}

interface UserPlay {
  id: string,
  updatedAt: firebase.firestore.Timestamp,
  playTime: number,
  didCheat: boolean,
  didComplete: boolean,
  title: string,
}

const AccountPage = requiresAuth(({ user }: AuthProps) => {
  const [authoredPuzzles, setAuthoredPuzzles] = React.useState<Array<AuthoredPuzzle> | null>(null);
  const [plays, setPlays] = React.useState<Array<UserPlay> | null>(null);
  const [error, setError] = React.useState(false);
  const [displayName, setDisplayName] = React.useState(getDisplayName(user));

  React.useEffect(() => {
    console.log("loading authored puzzles and plays");
    // TODO pagination on both of these
    Promise.all([
      getFromSessionOrDB('uc', user.uid, AuthoredPuzzlesV, -1),
      getFromSessionOrDB('up', user.uid, UserPlaysV, -1)
    ])
      .then(([authoredResult, playsResult]) => {
        if (authoredResult === null) {
          setAuthoredPuzzles([]);
        } else {
          const authored = Object.entries(authoredResult).map(([id, val]) => {
            const [createdAt, title] = val;
            return { id, createdAt, title };
          })
          // Sort in reverse order by createdAt
          authored.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
          setAuthoredPuzzles(authored);
        }
        if (playsResult === null) {
          setPlays([]);
        } else {
          const plays = Object.entries(playsResult).map(([id, val]) => {
            const [updatedAt, playTime, didCheat, didComplete, title] = val;
            return { id, updatedAt, playTime, didCheat, didComplete, title };
          })
          // Sort in reverse order by updatedAt
          plays.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
          setPlays(plays);
        }
      }).catch(reason => {
        console.error(reason);
        setError(true);
      });
  }, [user]);

  if (error) {
    return <div>Error loading plays / authored puzzles</div>;
  }
  return (
    <React.Fragment>
      <Head>
        <title>Account | Crosshare</title>
      </Head>
      <TopBar />
      <div css={{ margin: '1em', }}>
        <h4 css={{ borderBottom: '1px solid var(--black)' }}>Account</h4>
        <p>You're logged in as <b>{user.email}</b>. <button onClick={() => App.auth().signOut()}>Log out</button></p>
        <p>Your display name - <i>{displayName}</i> - is displayed next to any comments you make or puzzles you create.</p>
        <DisplayNameForm user={user} onChange={setDisplayName} />
        {plays && plays.length ?
          <React.Fragment>
            <h4 css={{ borderBottom: '1px solid var(--black)' }}>Recent Plays</h4>
            <ul>{plays.map(PlayListItem)}</ul>
          </React.Fragment>
          :
          ""
        }
        {authoredPuzzles && authoredPuzzles.length ?
          <React.Fragment>
            <h4 css={{ borderBottom: '1px solid var(--black)' }}>Authored Puzzles</h4>
            <ul>{authoredPuzzles.map(AuthoredListItem)}</ul>
          </React.Fragment>
          :
          ""
        }
      </div>
    </React.Fragment>
  );
});

export default AccountPage;
