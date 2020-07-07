import { PuzzleInProgressT, ClueT } from './types';
import { fromCells, getClueMap } from './viewableGrid';

const EXTENSION_HEADER_LENGTH = 8;
const EXTENSION_NAME_LENGTH = 4;
const CIRCLED = 0x80;

function isPuz(bytes: Uint8Array) {
  const magic = 'ACROSS&DOWN';
  for (let i = 0; i < magic.length; i++) {
    if (bytes[2 + i] != magic.charCodeAt(i)) return false;
  }
  return bytes[2 + magic.length] == 0;
}

class PuzReader {
  public ix: number;
  public highlighted: Array<number>;
  public rebusMap: Uint8Array | null;
  public rebusKey: Record<number, string>;

  constructor(public buf: Uint8Array) {
    this.ix = 0;
    this.highlighted = [];
    this.rebusMap = null;
    this.rebusKey = {};
  }

  readShort(ix?: number) {
    if (ix === undefined) {
      const val = this.buf[this.ix] | (this.buf[this.ix + 1] << 8);
      this.ix += 2;
      return val;
    }
    return this.buf[ix] | (this.buf[ix + 1] << 8);
  }

  readString(length?: number) {
    const result = [];
    let count = 0;
    for (; ;) {
      if (length && count === length) {
        break;
      }
      const c = this.buf[this.ix++];
      count += 1;
      if (c === 0) break; // null terminated
      result.push(String.fromCodePoint(c));
    }
    return result.join('');
  }

  readBytes(length: number) {
    const res = this.buf.slice(this.ix, this.ix + length);
    this.ix += length;
    return res;
  }

  readExtension() {
    const remainingLength = this.buf.length - this.ix;

    if (remainingLength >= EXTENSION_HEADER_LENGTH) {
      const name = this.readString(EXTENSION_NAME_LENGTH);
      const length = this.readShort();
      this.readShort(); // checksum
      const extension = this.readBytes(length);
      this.ix += 1; // extensions have a trailing byte
      if (name === 'GEXT') {
        for (let i = 0; i < extension.length; i += 1) {
          if (extension[i] & CIRCLED) {
            this.highlighted.push(i);
          }
        }
      } else if (name === 'GRBS') {
        this.rebusMap = extension;
      } else if (name === 'RTBL') {
        const text = String.fromCodePoint.apply(null, Array.from(extension));
        for (const solutionPair of text.split(';')) {
          if (!solutionPair) {
            continue;
          }
          const pair = solutionPair.split(':');
          this.rebusKey[parseInt(pair[0], 10)] = pair[1];
        }
      }

      return true;
    }
    return false;
  }

  toCrosshare(): PuzzleInProgressT {
    const w = this.buf[0x2c];
    const h = this.buf[0x2d];
    if (w < 4 || h < 4) {
      throw new Error('all grids must have at least 4 rows+cols for now');
    }
    if (w > 25 || h > 25) {
      throw new Error('all grids must have max of 25 rows+cols for now');
    }
    const scrambled = this.readShort(0x32);
    if (scrambled & 0x0004) {
      throw new Error('no support for scrambled .puz files yet');
    }
    const grid = [];
    for (let i = 0; i < w * h; i++) {
      grid.push(String.fromCodePoint(this.buf[0x34 + i]));
    }
    const viewableGrid = fromCells({
      cells: grid, width: w, height: h,
      allowBlockEditing: false,
      highlighted: new Set<number>(), highlight: 'circle',
      mapper: (e) => e
    });

    this.ix = 0x34 + 2 * w * h;
    const title = this.readString();
    this.readString(); // author
    this.readString(); // copyright

    const clues: Array<ClueT> = [];
    let label = 1;
    for (let i = 0; i < w * h; i++) {
      if (grid[i] == '.') continue;
      let inc = 0;
      if (i % w == 0 || grid[i - 1] == '.') {
        clues.push({ num: label, clue: this.readString(), dir: 0 });
        inc = 1;
      }
      if (i < w || grid[i - w] == '.') {
        clues.push({ num: label, clue: this.readString(), dir: 1 });
        inc = 1;
      }
      label += inc;
    }

    this.readString(); // notes

    let tryAnotherExtension = true;
    while (tryAnotherExtension) {
      tryAnotherExtension = this.readExtension();
    }

    if (this.rebusKey && this.rebusMap) {
      for (let i = 0; i < this.rebusMap.length; i += 1) {
        if (this.rebusMap[i]) {
          grid[i] = this.rebusKey[this.rebusMap[i] - 1];
        }
      }
    }

    return {
      width: w, height: h,
      grid, title,
      clues: getClueMap(viewableGrid, clues),
      highlighted: this.highlighted, highlight: 'circle'
    };
  }
}

export function importFile(bytes: Uint8Array): PuzzleInProgressT | null {
  if (isPuz(bytes)) {
    return new PuzReader(bytes).toCrosshare();
  }
  return null;
}