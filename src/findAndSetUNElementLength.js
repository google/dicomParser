/**
 * Internal helper functions for parsing DICOM elements
 */

/**
 * reads from the byte stream until it finds the magic number for the Sequence Delimitation
 * Item item and then sets the length of the element
 * @param byteStream
 * @param element
 */
export default function findAndSetUNElementLength (byteStream, element) {
  if (byteStream === undefined) {
    throw 'dicomParser.findAndSetUNElementLength: missing required parameter \'byteStream\'';
  }

  // group, element, length
  const itemDelimitationItemLength = 8;
  const maxPosition = byteStream.byteArray.length - itemDelimitationItemLength;

  while (byteStream.position <= maxPosition) {
    const groupNumber = byteStream.readUint16();

    if (groupNumber === 0xfffe) {
      const elementNumber = byteStream.readUint16();

      if (elementNumber === 0xe0dd) {
        // NOTE: It would be better to also check for the length to be 0 as part of the check above
        // but we will just log a warning for now
        const itemDelimiterLength = byteStream.readUint32();

        if (itemDelimiterLength !== 0) {
          byteStream.warnings(`encountered non zero length following item delimiter at position ${byteStream.position - 4} while reading element of undefined length with tag ${element.tag}`);
        }
        element.length = byteStream.position - element.dataOffset;

        return;
      }
    }
  }

  // No item delimitation item - silently set the length to the end
  // of the buffer and set the position past the end of the buffer
  element.length = byteStream.byteArray.length - element.dataOffset;
  byteStream.seek(byteStream.byteArray.length - byteStream.position);
}
