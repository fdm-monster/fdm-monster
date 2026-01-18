/**
 * MeatPack G-code decoder
 * MeatPack is a bit-packing format that encodes common G-code characters
 *
 * Based on: https://github.com/scottmudge/OctoPrint-MeatPack
 */

export class MeatPackDecoder {
  // Character set for packing - from Marlin firmware
  // https://github.com/MarlinFirmware/Marlin/blob/bugfix-2.1.x/Marlin/src/feature/meatpack.cpp
  private static readonly PACK_CHARS = [
    '0',  // 0x0
    '1',  // 0x1
    '2',  // 0x2
    '3',  // 0x3
    '4',  // 0x4
    '5',  // 0x5
    '6',  // 0x6
    '7',  // 0x7
    '8',  // 0x8
    '9',  // 0x9
    '.',  // 0xA
    ' ',  // 0xB
    '\n', // 0xC
    'G',  // 0xD
    'X',  // 0xE
    // 0xF is used as signal: literal character follows
  ];

  // Command bytes (from Prusa libbgcode implementation)
  private static readonly SIGNAL_BYTE = 0xFF;
  private static readonly CMD_ENABLE_PACKING = 251;   // 0xFB
  private static readonly CMD_DISABLE_PACKING = 250;  // 0xFA
  private static readonly CMD_RESET_ALL = 249;        // 0xF9
  private static readonly CMD_ENABLE_NO_SPACES = 247; // 0xF7
  private static readonly CMD_DISABLE_NO_SPACES = 246; // 0xF6

  decode(input: Buffer): string {
    const output: string[] = [];
    let i = 0;
    let packingEnabled = false;
    let noSpacesEnabled = false;

    while (i < input.length) {
      const byte = input[i++];

      // Check for command sequence: 0xFF 0xFF <command>
      if (byte === MeatPackDecoder.SIGNAL_BYTE && i < input.length) {
        const nextByte = input[i];
        if (nextByte === MeatPackDecoder.SIGNAL_BYTE) {
          // This is a command sequence
          i++; // Skip second 0xFF
          if (i < input.length) {
            const command = input[i++];
            switch (command) {
              case MeatPackDecoder.CMD_ENABLE_PACKING:
                packingEnabled = true;
                break;
              case MeatPackDecoder.CMD_DISABLE_PACKING:
                packingEnabled = false;
                break;
              case MeatPackDecoder.CMD_ENABLE_NO_SPACES:
                noSpacesEnabled = true;
                break;
              case MeatPackDecoder.CMD_DISABLE_NO_SPACES:
                noSpacesEnabled = false;
                break;
              case MeatPackDecoder.CMD_RESET_ALL:
                packingEnabled = false;
                noSpacesEnabled = false;
                break;
            }
          }
          continue;
        }
      }

      // If packing is disabled, pass through as literal
      if (!packingEnabled) {
        output.push(String.fromCharCode(byte));
        continue;
      }

      // Packed byte: two 4-bit indices
      // IMPORTANT: LOW nibble is decoded FIRST, then HIGH nibble
      const high = (byte >> 4) & 0x0F;
      const low = byte & 0x0F;

      // Decode LOW nibble FIRST (this produces the first character)
      if (low === 0x0F) {
        // 0xF signals that next byte is a literal
        if (i < input.length) {
          output.push(String.fromCharCode(input[i++]));
        }
      } else if (low < MeatPackDecoder.PACK_CHARS.length) {
        let char = MeatPackDecoder.PACK_CHARS[low];
        // If no-spaces mode is enabled, space (0xB) becomes 'E'
        if (noSpacesEnabled && low === 0x0B) {
          char = 'E';
        }
        output.push(char);
      }

      // Decode HIGH nibble SECOND (this produces the second character)
      if (high === 0x0F) {
        // 0xF signals that next byte is a literal
        if (i < input.length) {
          output.push(String.fromCharCode(input[i++]));
        }
      } else if (high < MeatPackDecoder.PACK_CHARS.length) {
        let char = MeatPackDecoder.PACK_CHARS[high];
        // If no-spaces mode is enabled, space (0xB) becomes 'E'
        if (noSpacesEnabled && high === 0x0B) {
          char = 'E';
        }
        output.push(char);
      }
    }

    return output.join('');
  }
}
