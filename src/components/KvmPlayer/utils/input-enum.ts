// prettier-ignore
export const KEYS = new Map([ // https://gist.github.com/MightyPork/6da26e382a7ad91b5496ee55fdc73db2
  ["a",0x04,0],["A",0x04,1],["b",0x05,0],["B",0x05,1],["c",0x06,0],["C",0x06,1],["d",0x07,0],["D",0x07,1],["e",0x08,0],["E",0x08,1],["f",0x09,0],["F",0x09,1],["g",0x0a,0],["G",0x0a,1],["h",0x0b,0],["H",0x0b,1],["i",0x0c,0],["I",0x0c,1],["j",0x0d,0],["J",0x0d,1],["k",0x0e,0],["K",0x0e,1],["l",0x0f,0],["L",0x0f,1],["m",0x10,0],["M",0x10,1],["n",0x11,0],["N",0x11,1],["o",0x12,0],["O",0x12,1],["p",0x13,0],["P",0x13,1],["q",0x14,0],["Q",0x14,1],["r",0x15,0],["R",0x15,1],["s",0x16,0],["S",0x16,1],["t",0x17,0],["T",0x17,1],["u",0x18,0],["U",0x18,1],["v",0x19,0],["V",0x19,1],["w",0x1a,0],["W",0x1a,1],["x",0x1b,0],["X",0x1b,1],["y",0x1c,0],["Y",0x1c,1],["z",0x1d,0],["Z",0x1d,1],
  ["1",0x1e,0],["!",0x1e,1],["2",0x1f,0],["@",0x1f,1],["3",0x20,0],["#",0x20,1],["4",0x21,0],["$",0x21,1],["5",0x22,0],["%",0x22,1],["6",0x23,0],["^",0x23,1],["7",0x24,0],["&",0x24,1],["8",0x25,0],["*",0x25,1],["9",0x26,0],["(",0x26,1],["0",0x27,0],[")",0x27,1],
  ["Enter"    ,0x28,0],["\n",0x28,0],
  ["Escape"   ,0x29,0],
  ["Backspace",0x2a,0],["\b",0x2a,0],
  ["Tab"      ,0x2b,0],["\t",0x2b,0],
  ["Space"    ,0x2c,0],[" " ,0x2c,0],
  ["-",0x2d,0],["_",0x2d,1],["=",0x2e,0],["+",0x2e,1],["[",0x2F,0],["{",0x2F,1],["]",0x30,0],["}",0x30,1],["\\",0x31,0],["|",0x31,1],[";",0x33,0],[":",0x33,1],["'",0x34,0],['"',0x34,1],["`",0x35,0],["~",0x35,1],[",",0x36,0],["<",0x36,1],[".",0x37,0],[">",0x37,1],["/",0x38,0],["?",0x38,1],
  ["Pause",0x48,0],["Insert",0x49,0],["Home",0x4a,0],["PageUp",0x4b,0],["Delete",0x4c,0],["End",0x4d,0],["PageDown",0x4e,0],["ArrowRight",0x4f,0],["ArrowLeft",0x50,0],["ArrowDown",0x51,0],["ArrowUp",0x52,0],
  ["F1",0x3a,0],["F2",0x3b,0],["F3",0x3c,0],["F4",0x3d,0],["F5",0x3e,0],["F6",0x3f,0],["F7",0x40,0],["F8",0x41,0],["F9",0x42,0],["F10",0x43,0],["F11",0x44,0],["F12",0x45,0],
  ["Control",0xe0,0],["Shift",0xe1,0],["Alt",0xe2,0],["Meta",0xe3,0],
].map(([key, hidCode, shift]) => [key, [hidCode, shift]]));
