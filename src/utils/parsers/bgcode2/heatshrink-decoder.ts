/**
 * Heatshrink LZSS decompressor implementation
 * Based on the Heatshrink compression library by Scott Vokes
 * https://github.com/atomicobject/heatshrink
 */

enum HSState {
  TAG_BIT,
  YIELD_LITERAL,
  BACKREF_INDEX_MSB,
  BACKREF_INDEX_LSB,
  BACKREF_COUNT_MSB,
  BACKREF_COUNT_LSB,
  YIELD_BACKREF,
}

export class HeatshrinkDecoder {
  private readonly windowBits: number;
  private readonly lookaheadBits: number;
  private readonly windowSize: number;

  private readonly window: Buffer;
  private head: number = 0;
  private state: HSState = HSState.TAG_BIT;

  private outputIndex: number = 0;
  private outputCount: number = 0;

  private inputBuffer: Buffer;
  private inputIndex: number = 0;
  private bitAccumulator: number = 0;
  private bitsAvailable: number = 0;

  constructor(windowBits: number, lookaheadBits: number) {
    this.windowBits = windowBits;
    this.lookaheadBits = lookaheadBits;
    this.windowSize = 1 << windowBits; // 2^windowBits

    this.window = Buffer.alloc(this.windowSize);
    this.inputBuffer = Buffer.alloc(0);
  }

  decompress(input: Buffer): Buffer {
    this.inputBuffer = input;
    this.inputIndex = 0;
    this.bitAccumulator = 0;
    this.bitsAvailable = 0;
    this.head = 0;
    this.state = HSState.TAG_BIT;

    const output: number[] = [];

    while (this.inputIndex < this.inputBuffer.length || this.bitsAvailable > 0) {
      const result = this.step();
      if (result === null) {
        break; // No more data
      }
      if (result >= 0) {
        output.push(result);
      }
    }

    return Buffer.from(output);
  }

  private step(): number | null {
    switch (this.state) {
      case HSState.TAG_BIT:
        return this.handleTagBit();
      case HSState.YIELD_LITERAL:
        return this.handleYieldLiteral();
      case HSState.BACKREF_INDEX_MSB:
        return this.handleBackrefIndexMSB();
      case HSState.BACKREF_INDEX_LSB:
        return this.handleBackrefIndexLSB();
      case HSState.BACKREF_COUNT_MSB:
        return this.handleBackrefCountMSB();
      case HSState.BACKREF_COUNT_LSB:
        return this.handleBackrefCountLSB();
      case HSState.YIELD_BACKREF:
        return this.handleYieldBackref();
      default:
        return null;
    }
  }

  private readBits(count: number): number | null {
    // Fill accumulator if needed
    while (this.bitsAvailable < count && this.inputIndex < this.inputBuffer.length) {
      this.bitAccumulator = (this.bitAccumulator << 8) | this.inputBuffer[this.inputIndex++];
      this.bitsAvailable += 8;
    }

    if (this.bitsAvailable < count) {
      return null; // Not enough bits
    }

    // Extract the requested bits
    this.bitsAvailable -= count;
    const result = (this.bitAccumulator >> this.bitsAvailable) & ((1 << count) - 1);
    this.bitAccumulator &= (1 << this.bitsAvailable) - 1;

    return result;
  }

  private handleTagBit(): number | null {
    const bit = this.readBits(1);
    if (bit === null) return null;

    if (bit === 1) {
      // Literal byte
      this.state = HSState.YIELD_LITERAL;
    } else {
      // Backref
      if (this.windowBits > 8) {
        this.state = HSState.BACKREF_INDEX_MSB;
      } else {
        this.outputIndex = 0;
        this.state = HSState.BACKREF_INDEX_LSB;
      }
    }
    return -1; // No output yet
  }

  private handleYieldLiteral(): number | null {
    const byte = this.readBits(8);
    if (byte === null) return null;

    this.pushByte(byte);
    this.state = HSState.TAG_BIT;
    return byte;
  }

  private handleBackrefIndexMSB(): number | null {
    const msb = this.readBits(this.windowBits - 8);
    if (msb === null) return null;

    this.outputIndex = msb << 8;
    this.state = HSState.BACKREF_INDEX_LSB;
    return -1;
  }

  private handleBackrefIndexLSB(): number | null {
    const bits = this.windowBits > 8 ? 8 : this.windowBits;
    const lsb = this.readBits(bits);
    if (lsb === null) return null;

    this.outputIndex |= lsb;
    this.outputCount = 0;

    if (this.lookaheadBits > 8) {
      this.state = HSState.BACKREF_COUNT_MSB;
    } else {
      this.state = HSState.BACKREF_COUNT_LSB;
    }
    return -1;
  }

  private handleBackrefCountMSB(): number | null {
    const msb = this.readBits(this.lookaheadBits - 8);
    if (msb === null) return null;

    this.outputCount = msb << 8;
    this.state = HSState.BACKREF_COUNT_LSB;
    return -1;
  }

  private handleBackrefCountLSB(): number | null {
    const bits = this.lookaheadBits > 8 ? 8 : this.lookaheadBits;
    const lsb = this.readBits(bits);
    if (lsb === null) return null;

    this.outputCount |= lsb;
    this.outputCount += 1; // Count is stored as length-1
    this.outputIndex += 1; // Index is stored as (actual_index - 1)

    this.state = HSState.YIELD_BACKREF;
    return -1;
  }

  private handleYieldBackref(): number | null {
    if (this.outputCount === 0) {
      this.state = HSState.TAG_BIT;
      return -1;
    }

    // Calculate the position in the window
    const pos = (this.head - this.outputIndex + this.windowSize) % this.windowSize;
    const byte = this.window[pos];

    this.pushByte(byte);
    this.outputCount--;

    if (this.outputCount === 0) {
      this.state = HSState.TAG_BIT;
    }

    return byte;
  }

  private pushByte(byte: number): void {
    this.window[this.head] = byte;
    this.head = (this.head + 1) % this.windowSize;
  }
}
