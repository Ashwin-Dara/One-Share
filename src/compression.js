const fs = require("fs");
const path = require("path");

class BitCompressionMap {
  /** Variables:
   *  - decodeMapping: hashmap representing a single encoding for a single file/collection.
   * The key will be the bitString and then the value will be the corresponding character.
   *
   * An example decodeMapping may look like the following:
   *  { 00: 'A',
   *    01: 'B',
   *    0110: 'C' }
   */
  constructor() {
    this.decodeMapping = new Map();
    this.encodeMapping = new Map(); 
  }

  /** Adds the node into the BitCompressionMap. Typically, one file will have one single
   * BitCompressionMap associated with it. The map itself can be stored as text but will follow
   * a JSON-esque format.
   */
  setBitNode(node) {
    this.decodeMapping.set(node.getBitString(), node.getCharacter());
    this.encodeMapping.set(node.getCharacter(), node.getBitString());
    console.log("Bitstring", node.getBitString(), this.decodeMapping.has(node.getBitString()));
  }

  /** Returns the JSON representation of the BitCompressionMap.
   * This is what the key:value structure will look like. Keys will be the letter,
   * and values will be the binary number representation that letter (bitstring).
   * An example mapping may look like the following:
   *    { A:1010,
   *      B:0001 }
   */
  getDecodeMap() {
    const obj = Object.fromEntries(this.decodeMapping);
    return obj;
  }

  getEncodeMap() {
    const obj = Object.fromEntries(this.encodeMapping);
    return obj;
  }
 
}

class BitNode {
  /** Variables:
   *  - bitString: represents the compressed bit sequence associated with the letter.
   *  - frequency: number of times this sequence has shown up within the .bin file.
   *  - character: this is the character that the BitNode represents.
   *  - left and right: children of the tree.
   */
  constructor() {
    this.bitString = "";
    this.frequency = 0;
    this.character = "";
    this.left = null;
    this.right = null;
  }

  /** Returns the characters associated with the BitNode object.
   * Examples: 'A', 'B - A', 'B', 'C', 'A - B - C'
   */
  getCharacter() {
    return this.character;
  }

  /** Returns the bitString associated with this particular BitNode object.
   * Note that this value will not be accurate for parent nodes that were
   * created through merging.
   */
  getBitString() {
    return this.bitString;
  }

  /** Gets the frequency associated with the characters in this BitNode. */
  getFreq() {
    return this.frequency;
  }

  /** Returns true is the BitNode is a leaf. */
  isLeaf() {
    return this.left == null && this.right == null;
  }
}

/** Takes in a file path, reads all of the contents, and then returns a frequency map
 * containing the frequency of every single character within the specified file.
 */
function getFrequencyCounter(filePath) {
  /* Reading the specified file and converting it into a string. */
  const data = fs.readFileSync(filePath).toString();

  /* Object holds the frequency of the different characters. */
  let freq = {};

  for (let i = 0; i < data.length; ++i) {
    let c = data.charAt(i);
    if (freq[c]) {
      freq[c]++;
    } else {
      freq[c] = 1;
    }
  }

  /* Returning a javascript object containing the frequency of every single letter 
  found within the specified file. */
  return freq;
}

/** Input: freqMap - javascript object that contains the frequency of every character within a particular file.
 * This will typically be generated using the "getFrequencyCounter" function.
 *
 * Output: min-heap priority queue containing "BitNode" objects within the pq.
 */
function getFreqPQ(freqMap) {
  /* Creating empty priority queue. */
  let pq = [];

  for (let x in freqMap) {
    let node = new BitNode();
    node.character =  x;
    node.frequency = freqMap[x];
    pq.push(node);
  }

  /* Sorting priority queue based on the Node_Object.frequency value. */
  pq.sort((first, second) => {
    return first.frequency - second.frequency;
  });
  return pq;
}

/** Input: prioQ - priority queue containing BitNodes, which should be sorted in min-heap fashion.
 *
 * Output: root - BitNode which is the root of a well-constructed Huffman tree.
 */
function getHuffmanTree(prioQ) {
  let treeRoot = null;

  while (prioQ.length > 1) {
    /* Pop the first two elements and then shift the priority queue as appropriate. */
    let first = prioQ.shift();
    let second = prioQ.shift();

    /* Creating the parent BitNode by merging the two node's with the smallest frequency. Typically, 
    we want to do this in order to have the nodes with the furthest depth be the ones that show up 
    the least often within our file. The reason for this is that we want to represent letters that 
    show up more frequency with a smaller bit sequence to preserve space. */
    const parent = new BitNode();
    parent.frequency = first.getFreq() + second.getFreq();

    /* Setting children of parent node appropriately. */
    parent.left = first;
    parent.right = second;
    treeRoot = parent;

    /* Readding the parent into the priority queue and then re-sorting the priority queue. */
    prioQ.push(parent);
    prioQ.sort((first, second) => {
      return first.frequency - second.frequency;
    });
  }
  return treeRoot;
}

/**
 * Input: Huffman Tree.
 * Output: void. 
 *
 * Side Effects: mutates the entered bitMap.
 * 
 * Takes in the root of a Huffman tree and converts it into a valid CompressionMap object.
 * The typical workflow for generating a valid compression encoding would first be to read the
 * file, then it would be to
 */
function getCompressionMap(root, bitString, bitMap) {
  if (root == null) {
    return;
  }
  if (root.isLeaf()) {
    root.bitString = Number(bitString);
    bitMap.setBitNode(root);
    return;
  }
    getCompressionMap(root.left, bitString + "0", bitMap);
    getCompressionMap(root.right, bitString + "1", bitMap);
}

function generateCompMap(root, bitString, map) {
  if (root == null) {
    return; 
  }
  if (root.left == null && root.right == null) {
    root.bitString = bitString;
    map.setBitNode(root);
  }
  generateCompMap(root.left,  bitString + "0", map);
  generateCompMap(root.right, bitString + "1", map);
}

exports.BitCompressionMap = BitCompressionMap; 
exports.BitNode = BitNode; 
exports.getFrequencyCounter = getFrequencyCounter; 
exports.getFreqPQ = getFreqPQ; 
exports.getHuffmanTree = getHuffmanTree;
exports.generateCompMap = generateCompMap; 
exports.getCompressionMap = getCompressionMap; 
