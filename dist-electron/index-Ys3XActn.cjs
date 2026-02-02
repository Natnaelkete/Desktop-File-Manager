"use strict";
const main = require("./main-C9OescaO.cjs");
const require$$1 = require("util");
const require$$3 = require("stream");
const require$$0 = require("fs");
const require$$0$2 = require("os");
const require$$2 = require("path");
const require$$0$1 = require("child_process");
const require$$2$1 = require("events");
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
const defined = function(val) {
  return typeof val !== "undefined" && val !== null;
};
const object = function(val) {
  return typeof val === "object";
};
const plainObject = function(val) {
  return Object.prototype.toString.call(val) === "[object Object]";
};
const fn = function(val) {
  return typeof val === "function";
};
const bool$1 = function(val) {
  return typeof val === "boolean";
};
const buffer = function(val) {
  return val instanceof Buffer;
};
const typedArray = function(val) {
  if (defined(val)) {
    switch (val.constructor) {
      case Uint8Array:
      case Uint8ClampedArray:
      case Int8Array:
      case Uint16Array:
      case Int16Array:
      case Uint32Array:
      case Int32Array:
      case Float32Array:
      case Float64Array:
        return true;
    }
  }
  return false;
};
const arrayBuffer = function(val) {
  return val instanceof ArrayBuffer;
};
const string = function(val) {
  return typeof val === "string" && val.length > 0;
};
const number = function(val) {
  return typeof val === "number" && !Number.isNaN(val);
};
const integer = function(val) {
  return Number.isInteger(val);
};
const inRange = function(val, min, max) {
  return val >= min && val <= max;
};
const inArray = function(val, list) {
  return list.includes(val);
};
const invalidParameterError = function(name, expected, actual) {
  return new Error(
    `Expected ${expected} for ${name} but received ${actual} of type ${typeof actual}`
  );
};
var is$9 = {
  defined,
  object,
  plainObject,
  fn,
  bool: bool$1,
  buffer,
  typedArray,
  arrayBuffer,
  string,
  number,
  integer,
  inRange,
  inArray,
  invalidParameterError
};
const debug$1 = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
};
var debug_1 = debug$1;
const MAX_LENGTH$2 = 256;
const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991;
const MAX_SAFE_COMPONENT_LENGTH = 16;
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$2 - 6;
var constants = {
  MAX_LENGTH: MAX_LENGTH$2,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1
};
var re$2 = { exports: {} };
(function(module2, exports$1) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: MAX_SAFE_COMPONENT_LENGTH2,
    MAX_SAFE_BUILD_LENGTH: MAX_SAFE_BUILD_LENGTH2,
    MAX_LENGTH: MAX_LENGTH2
  } = constants;
  const debug2 = debug_1;
  exports$1 = module2.exports = {};
  const re2 = exports$1.re = [];
  const safeRe = exports$1.safeRe = [];
  const src = exports$1.src = [];
  const safeSrc = exports$1.safeSrc = [];
  const t2 = exports$1.t = {};
  let R = 0;
  const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
  const safeRegexReplacements = [
    ["\\s", 1],
    ["\\d", MAX_LENGTH2],
    [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH2]
  ];
  const makeSafeRegex = (value) => {
    for (const [token, max] of safeRegexReplacements) {
      value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
    }
    return value;
  };
  const createToken = (name, value, isGlobal) => {
    const safe = makeSafeRegex(value);
    const index2 = R++;
    debug2(name, index2, value);
    t2[name] = index2;
    src[index2] = value;
    safeSrc[index2] = safe;
    re2[index2] = new RegExp(value, isGlobal ? "g" : void 0);
    safeRe[index2] = new RegExp(safe, isGlobal ? "g" : void 0);
  };
  createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
  createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
  createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
  createToken("MAINVERSION", `(${src[t2.NUMERICIDENTIFIER]})\\.(${src[t2.NUMERICIDENTIFIER]})\\.(${src[t2.NUMERICIDENTIFIER]})`);
  createToken("MAINVERSIONLOOSE", `(${src[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src[t2.NUMERICIDENTIFIERLOOSE]})`);
  createToken("PRERELEASEIDENTIFIER", `(?:${src[t2.NONNUMERICIDENTIFIER]}|${src[t2.NUMERICIDENTIFIER]})`);
  createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t2.NONNUMERICIDENTIFIER]}|${src[t2.NUMERICIDENTIFIERLOOSE]})`);
  createToken("PRERELEASE", `(?:-(${src[t2.PRERELEASEIDENTIFIER]}(?:\\.${src[t2.PRERELEASEIDENTIFIER]})*))`);
  createToken("PRERELEASELOOSE", `(?:-?(${src[t2.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t2.PRERELEASEIDENTIFIERLOOSE]})*))`);
  createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
  createToken("BUILD", `(?:\\+(${src[t2.BUILDIDENTIFIER]}(?:\\.${src[t2.BUILDIDENTIFIER]})*))`);
  createToken("FULLPLAIN", `v?${src[t2.MAINVERSION]}${src[t2.PRERELEASE]}?${src[t2.BUILD]}?`);
  createToken("FULL", `^${src[t2.FULLPLAIN]}$`);
  createToken("LOOSEPLAIN", `[v=\\s]*${src[t2.MAINVERSIONLOOSE]}${src[t2.PRERELEASELOOSE]}?${src[t2.BUILD]}?`);
  createToken("LOOSE", `^${src[t2.LOOSEPLAIN]}$`);
  createToken("GTLT", "((?:<|>)?=?)");
  createToken("XRANGEIDENTIFIERLOOSE", `${src[t2.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
  createToken("XRANGEIDENTIFIER", `${src[t2.NUMERICIDENTIFIER]}|x|X|\\*`);
  createToken("XRANGEPLAIN", `[v=\\s]*(${src[t2.XRANGEIDENTIFIER]})(?:\\.(${src[t2.XRANGEIDENTIFIER]})(?:\\.(${src[t2.XRANGEIDENTIFIER]})(?:${src[t2.PRERELEASE]})?${src[t2.BUILD]}?)?)?`);
  createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t2.XRANGEIDENTIFIERLOOSE]})(?:${src[t2.PRERELEASELOOSE]})?${src[t2.BUILD]}?)?)?`);
  createToken("XRANGE", `^${src[t2.GTLT]}\\s*${src[t2.XRANGEPLAIN]}$`);
  createToken("XRANGELOOSE", `^${src[t2.GTLT]}\\s*${src[t2.XRANGEPLAINLOOSE]}$`);
  createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH2}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH2}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH2}}))?`);
  createToken("COERCE", `${src[t2.COERCEPLAIN]}(?:$|[^\\d])`);
  createToken("COERCEFULL", src[t2.COERCEPLAIN] + `(?:${src[t2.PRERELEASE]})?(?:${src[t2.BUILD]})?(?:$|[^\\d])`);
  createToken("COERCERTL", src[t2.COERCE], true);
  createToken("COERCERTLFULL", src[t2.COERCEFULL], true);
  createToken("LONETILDE", "(?:~>?)");
  createToken("TILDETRIM", `(\\s*)${src[t2.LONETILDE]}\\s+`, true);
  exports$1.tildeTrimReplace = "$1~";
  createToken("TILDE", `^${src[t2.LONETILDE]}${src[t2.XRANGEPLAIN]}$`);
  createToken("TILDELOOSE", `^${src[t2.LONETILDE]}${src[t2.XRANGEPLAINLOOSE]}$`);
  createToken("LONECARET", "(?:\\^)");
  createToken("CARETTRIM", `(\\s*)${src[t2.LONECARET]}\\s+`, true);
  exports$1.caretTrimReplace = "$1^";
  createToken("CARET", `^${src[t2.LONECARET]}${src[t2.XRANGEPLAIN]}$`);
  createToken("CARETLOOSE", `^${src[t2.LONECARET]}${src[t2.XRANGEPLAINLOOSE]}$`);
  createToken("COMPARATORLOOSE", `^${src[t2.GTLT]}\\s*(${src[t2.LOOSEPLAIN]})$|^$`);
  createToken("COMPARATOR", `^${src[t2.GTLT]}\\s*(${src[t2.FULLPLAIN]})$|^$`);
  createToken("COMPARATORTRIM", `(\\s*)${src[t2.GTLT]}\\s*(${src[t2.LOOSEPLAIN]}|${src[t2.XRANGEPLAIN]})`, true);
  exports$1.comparatorTrimReplace = "$1$2$3";
  createToken("HYPHENRANGE", `^\\s*(${src[t2.XRANGEPLAIN]})\\s+-\\s+(${src[t2.XRANGEPLAIN]})\\s*$`);
  createToken("HYPHENRANGELOOSE", `^\\s*(${src[t2.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t2.XRANGEPLAINLOOSE]})\\s*$`);
  createToken("STAR", "(<|>)?=?\\s*\\*");
  createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
  createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(re$2, re$2.exports);
var reExports = re$2.exports;
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({});
const parseOptions$1 = (options) => {
  if (!options) {
    return emptyOpts;
  }
  if (typeof options !== "object") {
    return looseOption;
  }
  return options;
};
var parseOptions_1 = parseOptions$1;
const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  if (typeof a === "number" && typeof b === "number") {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  const anum = numeric.test(a);
  const bnum = numeric.test(b);
  if (anum && bnum) {
    a = +a;
    b = +b;
  }
  return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
};
var identifiers = {
  compareIdentifiers: compareIdentifiers$1
};
const debug = debug_1;
const { MAX_LENGTH: MAX_LENGTH$1, MAX_SAFE_INTEGER } = constants;
const { safeRe: re$1, t: t$1 } = reExports;
const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers;
let SemVer$3 = class SemVer {
  constructor(version2, options) {
    options = parseOptions(options);
    if (version2 instanceof SemVer) {
      if (version2.loose === !!options.loose && version2.includePrerelease === !!options.includePrerelease) {
        return version2;
      } else {
        version2 = version2.version;
      }
    } else if (typeof version2 !== "string") {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version2}".`);
    }
    if (version2.length > MAX_LENGTH$1) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH$1} characters`
      );
    }
    debug("SemVer", version2, options);
    this.options = options;
    this.loose = !!options.loose;
    this.includePrerelease = !!options.includePrerelease;
    const m = version2.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);
    if (!m) {
      throw new TypeError(`Invalid Version: ${version2}`);
    }
    this.raw = version2;
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];
    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError("Invalid major version");
    }
    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError("Invalid minor version");
    }
    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError("Invalid patch version");
    }
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split(".").map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num;
          }
        }
        return id;
      });
    }
    this.build = m[5] ? m[5].split(".") : [];
    this.format();
  }
  format() {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join(".")}`;
    }
    return this.version;
  }
  toString() {
    return this.version;
  }
  compare(other) {
    debug("SemVer.compare", this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === "string" && other === this.version) {
        return 0;
      }
      other = new SemVer(other, this.options);
    }
    if (other.version === this.version) {
      return 0;
    }
    return this.compareMain(other) || this.comparePre(other);
  }
  compareMain(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    if (this.major < other.major) {
      return -1;
    }
    if (this.major > other.major) {
      return 1;
    }
    if (this.minor < other.minor) {
      return -1;
    }
    if (this.minor > other.minor) {
      return 1;
    }
    if (this.patch < other.patch) {
      return -1;
    }
    if (this.patch > other.patch) {
      return 1;
    }
    return 0;
  }
  comparePre(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    if (this.prerelease.length && !other.prerelease.length) {
      return -1;
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1;
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0;
    }
    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug("prerelease compare", i, a, b);
      if (a === void 0 && b === void 0) {
        return 0;
      } else if (b === void 0) {
        return 1;
      } else if (a === void 0) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  compareBuild(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug("build compare", i, a, b);
      if (a === void 0 && b === void 0) {
        return 0;
      } else if (b === void 0) {
        return 1;
      } else if (a === void 0) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(release, identifier, identifierBase) {
    if (release.startsWith("pre")) {
      if (!identifier && identifierBase === false) {
        throw new Error("invalid increment argument: identifier is empty");
      }
      if (identifier) {
        const match = `-${identifier}`.match(this.options.loose ? re$1[t$1.PRERELEASELOOSE] : re$1[t$1.PRERELEASE]);
        if (!match || match[1] !== identifier) {
          throw new Error(`invalid identifier: ${identifier}`);
        }
      }
    }
    switch (release) {
      case "premajor":
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc("pre", identifier, identifierBase);
        break;
      case "preminor":
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc("pre", identifier, identifierBase);
        break;
      case "prepatch":
        this.prerelease.length = 0;
        this.inc("patch", identifier, identifierBase);
        this.inc("pre", identifier, identifierBase);
        break;
      case "prerelease":
        if (this.prerelease.length === 0) {
          this.inc("patch", identifier, identifierBase);
        }
        this.inc("pre", identifier, identifierBase);
        break;
      case "release":
        if (this.prerelease.length === 0) {
          throw new Error(`version ${this.raw} is not a prerelease`);
        }
        this.prerelease.length = 0;
        break;
      case "major":
        if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break;
      case "minor":
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break;
      case "patch":
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break;
      case "pre": {
        const base = Number(identifierBase) ? 1 : 0;
        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === "number") {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            if (identifier === this.prerelease.join(".") && identifierBase === false) {
              throw new Error("invalid increment argument: identifier already exists");
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          let prerelease = [identifier, base];
          if (identifierBase === false) {
            prerelease = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease;
            }
          } else {
            this.prerelease = prerelease;
          }
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${release}`);
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join(".")}`;
    }
    return this;
  }
};
var semver = SemVer$3;
const SemVer$2 = semver;
const parse$1 = (version2, options, throwErrors = false) => {
  if (version2 instanceof SemVer$2) {
    return version2;
  }
  try {
    return new SemVer$2(version2, options);
  } catch (er) {
    if (!throwErrors) {
      return null;
    }
    throw er;
  }
};
var parse_1 = parse$1;
const SemVer$1 = semver;
const parse = parse_1;
const { safeRe: re, t } = reExports;
const coerce = (version2, options) => {
  if (version2 instanceof SemVer$1) {
    return version2;
  }
  if (typeof version2 === "number") {
    version2 = String(version2);
  }
  if (typeof version2 !== "string") {
    return null;
  }
  options = options || {};
  let match = null;
  if (!options.rtl) {
    match = version2.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
  } else {
    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
    let next;
    while ((next = coerceRtlRegex.exec(version2)) && (!match || match.index + match[0].length !== version2.length)) {
      if (!match || next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
    }
    coerceRtlRegex.lastIndex = -1;
  }
  if (match === null) {
    return null;
  }
  const major = match[2];
  const minor = match[3] || "0";
  const patch = match[4] || "0";
  const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
  const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
  return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
};
var coerce_1 = coerce;
const SemVer2 = semver;
const compare$1 = (a, b, loose) => new SemVer2(a, loose).compare(new SemVer2(b, loose));
var compare_1 = compare$1;
const compare = compare_1;
const gte = (a, b, loose) => compare(a, b, loose) >= 0;
var gte_1 = gte;
const isLinux$1 = () => process.platform === "linux";
let report = null;
const getReport$1 = () => {
  if (!report) {
    if (isLinux$1() && process.report) {
      const orig = process.report.excludeNetwork;
      process.report.excludeNetwork = true;
      report = process.report.getReport();
      process.report.excludeNetwork = orig;
    } else {
      report = {};
    }
  }
  return report;
};
var process_1 = { isLinux: isLinux$1, getReport: getReport$1 };
const fs$2 = require$$0;
const LDD_PATH$1 = "/usr/bin/ldd";
const SELF_PATH$1 = "/proc/self/exe";
const MAX_LENGTH = 2048;
const readFileSync$1 = (path2) => {
  const fd = fs$2.openSync(path2, "r");
  const buffer2 = Buffer.alloc(MAX_LENGTH);
  const bytesRead = fs$2.readSync(fd, buffer2, 0, MAX_LENGTH, 0);
  fs$2.close(fd, () => {
  });
  return buffer2.subarray(0, bytesRead);
};
const readFile$1 = (path2) => new Promise((resolve, reject) => {
  fs$2.open(path2, "r", (err, fd) => {
    if (err) {
      reject(err);
    } else {
      const buffer2 = Buffer.alloc(MAX_LENGTH);
      fs$2.read(fd, buffer2, 0, MAX_LENGTH, 0, (_, bytesRead) => {
        resolve(buffer2.subarray(0, bytesRead));
        fs$2.close(fd, () => {
        });
      });
    }
  });
});
var filesystem = {
  LDD_PATH: LDD_PATH$1,
  SELF_PATH: SELF_PATH$1,
  readFileSync: readFileSync$1,
  readFile: readFile$1
};
const interpreterPath$1 = (elf2) => {
  if (elf2.length < 64) {
    return null;
  }
  if (elf2.readUInt32BE(0) !== 2135247942) {
    return null;
  }
  if (elf2.readUInt8(4) !== 2) {
    return null;
  }
  if (elf2.readUInt8(5) !== 1) {
    return null;
  }
  const offset = elf2.readUInt32LE(32);
  const size = elf2.readUInt16LE(54);
  const count = elf2.readUInt16LE(56);
  for (let i = 0; i < count; i++) {
    const headerOffset = offset + i * size;
    const type = elf2.readUInt32LE(headerOffset);
    if (type === 3) {
      const fileOffset = elf2.readUInt32LE(headerOffset + 8);
      const fileSize = elf2.readUInt32LE(headerOffset + 32);
      return elf2.subarray(fileOffset, fileOffset + fileSize).toString().replace(/\0.*$/g, "");
    }
  }
  return null;
};
var elf = {
  interpreterPath: interpreterPath$1
};
const childProcess = require$$0$1;
const { isLinux, getReport } = process_1;
const { LDD_PATH, SELF_PATH, readFile, readFileSync } = filesystem;
const { interpreterPath } = elf;
let cachedFamilyInterpreter;
let cachedFamilyFilesystem;
let cachedVersionFilesystem;
const command = "getconf GNU_LIBC_VERSION 2>&1 || true; ldd --version 2>&1 || true";
let commandOut = "";
const safeCommand = () => {
  if (!commandOut) {
    return new Promise((resolve) => {
      childProcess.exec(command, (err, out) => {
        commandOut = err ? " " : out;
        resolve(commandOut);
      });
    });
  }
  return commandOut;
};
const safeCommandSync = () => {
  if (!commandOut) {
    try {
      commandOut = childProcess.execSync(command, { encoding: "utf8" });
    } catch (_err) {
      commandOut = " ";
    }
  }
  return commandOut;
};
const GLIBC = "glibc";
const RE_GLIBC_VERSION = /LIBC[a-z0-9 \-).]*?(\d+\.\d+)/i;
const MUSL = "musl";
const isFileMusl = (f) => f.includes("libc.musl-") || f.includes("ld-musl-");
const familyFromReport = () => {
  const report2 = getReport();
  if (report2.header && report2.header.glibcVersionRuntime) {
    return GLIBC;
  }
  if (Array.isArray(report2.sharedObjects)) {
    if (report2.sharedObjects.some(isFileMusl)) {
      return MUSL;
    }
  }
  return null;
};
const familyFromCommand = (out) => {
  const [getconf, ldd1] = out.split(/[\r\n]+/);
  if (getconf && getconf.includes(GLIBC)) {
    return GLIBC;
  }
  if (ldd1 && ldd1.includes(MUSL)) {
    return MUSL;
  }
  return null;
};
const familyFromInterpreterPath = (path2) => {
  if (path2) {
    if (path2.includes("/ld-musl-")) {
      return MUSL;
    } else if (path2.includes("/ld-linux-")) {
      return GLIBC;
    }
  }
  return null;
};
const getFamilyFromLddContent = (content) => {
  content = content.toString();
  if (content.includes("musl")) {
    return MUSL;
  }
  if (content.includes("GNU C Library")) {
    return GLIBC;
  }
  return null;
};
const familyFromFilesystem = async () => {
  if (cachedFamilyFilesystem !== void 0) {
    return cachedFamilyFilesystem;
  }
  cachedFamilyFilesystem = null;
  try {
    const lddContent = await readFile(LDD_PATH);
    cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
  } catch (e) {
  }
  return cachedFamilyFilesystem;
};
const familyFromFilesystemSync = () => {
  if (cachedFamilyFilesystem !== void 0) {
    return cachedFamilyFilesystem;
  }
  cachedFamilyFilesystem = null;
  try {
    const lddContent = readFileSync(LDD_PATH);
    cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
  } catch (e) {
  }
  return cachedFamilyFilesystem;
};
const familyFromInterpreter = async () => {
  if (cachedFamilyInterpreter !== void 0) {
    return cachedFamilyInterpreter;
  }
  cachedFamilyInterpreter = null;
  try {
    const selfContent = await readFile(SELF_PATH);
    const path2 = interpreterPath(selfContent);
    cachedFamilyInterpreter = familyFromInterpreterPath(path2);
  } catch (e) {
  }
  return cachedFamilyInterpreter;
};
const familyFromInterpreterSync = () => {
  if (cachedFamilyInterpreter !== void 0) {
    return cachedFamilyInterpreter;
  }
  cachedFamilyInterpreter = null;
  try {
    const selfContent = readFileSync(SELF_PATH);
    const path2 = interpreterPath(selfContent);
    cachedFamilyInterpreter = familyFromInterpreterPath(path2);
  } catch (e) {
  }
  return cachedFamilyInterpreter;
};
const family = async () => {
  let family2 = null;
  if (isLinux()) {
    family2 = await familyFromInterpreter();
    if (!family2) {
      family2 = await familyFromFilesystem();
      if (!family2) {
        family2 = familyFromReport();
      }
      if (!family2) {
        const out = await safeCommand();
        family2 = familyFromCommand(out);
      }
    }
  }
  return family2;
};
const familySync = () => {
  let family2 = null;
  if (isLinux()) {
    family2 = familyFromInterpreterSync();
    if (!family2) {
      family2 = familyFromFilesystemSync();
      if (!family2) {
        family2 = familyFromReport();
      }
      if (!family2) {
        const out = safeCommandSync();
        family2 = familyFromCommand(out);
      }
    }
  }
  return family2;
};
const isNonGlibcLinux = async () => isLinux() && await family() !== GLIBC;
const isNonGlibcLinuxSync = () => isLinux() && familySync() !== GLIBC;
const versionFromFilesystem = async () => {
  if (cachedVersionFilesystem !== void 0) {
    return cachedVersionFilesystem;
  }
  cachedVersionFilesystem = null;
  try {
    const lddContent = await readFile(LDD_PATH);
    const versionMatch = lddContent.match(RE_GLIBC_VERSION);
    if (versionMatch) {
      cachedVersionFilesystem = versionMatch[1];
    }
  } catch (e) {
  }
  return cachedVersionFilesystem;
};
const versionFromFilesystemSync = () => {
  if (cachedVersionFilesystem !== void 0) {
    return cachedVersionFilesystem;
  }
  cachedVersionFilesystem = null;
  try {
    const lddContent = readFileSync(LDD_PATH);
    const versionMatch = lddContent.match(RE_GLIBC_VERSION);
    if (versionMatch) {
      cachedVersionFilesystem = versionMatch[1];
    }
  } catch (e) {
  }
  return cachedVersionFilesystem;
};
const versionFromReport = () => {
  const report2 = getReport();
  if (report2.header && report2.header.glibcVersionRuntime) {
    return report2.header.glibcVersionRuntime;
  }
  return null;
};
const versionSuffix = (s) => s.trim().split(/\s+/)[1];
const versionFromCommand = (out) => {
  const [getconf, ldd1, ldd2] = out.split(/[\r\n]+/);
  if (getconf && getconf.includes(GLIBC)) {
    return versionSuffix(getconf);
  }
  if (ldd1 && ldd2 && ldd1.includes(MUSL)) {
    return versionSuffix(ldd2);
  }
  return null;
};
const version$1 = async () => {
  let version2 = null;
  if (isLinux()) {
    version2 = await versionFromFilesystem();
    if (!version2) {
      version2 = versionFromReport();
    }
    if (!version2) {
      const out = await safeCommand();
      version2 = versionFromCommand(out);
    }
  }
  return version2;
};
const versionSync = () => {
  let version2 = null;
  if (isLinux()) {
    version2 = versionFromFilesystemSync();
    if (!version2) {
      version2 = versionFromReport();
    }
    if (!version2) {
      const out = safeCommandSync();
      version2 = versionFromCommand(out);
    }
  }
  return version2;
};
var detectLibc$2 = {
  GLIBC,
  MUSL,
  family,
  familySync,
  isNonGlibcLinux,
  isNonGlibcLinuxSync,
  version: version$1,
  versionSync
};
const detectLibc$1 = detectLibc$2;
const env$1 = process.env;
var platform$1 = function() {
  const arch = env$1.npm_config_arch || process.arch;
  const platform2 = env$1.npm_config_platform || process.platform;
  const libc = process.env.npm_config_libc || /* istanbul ignore next */
  (detectLibc$1.isNonGlibcLinuxSync() ? detectLibc$1.familySync() : "");
  const libcId = platform2 !== "linux" || libc === detectLibc$1.GLIBC ? "" : libc;
  const platformId = [`${platform2}${libcId}`];
  if (arch === "arm") {
    const fallback = process.versions.electron ? "7" : "6";
    platformId.push(`armv${env$1.npm_config_arm_version || process.config.variables.arm_version || fallback}`);
  } else if (arch === "arm64") {
    platformId.push(`arm64v${env$1.npm_config_arm_version || "8"}`);
  } else {
    platformId.push(arch);
  }
  return platformId.join("-");
};
const version = "0.32.6";
const config$1 = {
  libvips: "8.14.5",
  integrity: {
    "darwin-arm64v8": "sha512-1QZzICfCJd4wAO0P6qmYI5e5VFMt9iCE4QgefI8VMMbdSzjIXA9L/ARN6pkMQPZ3h20Y9RtJ2W1skgCsvCIccw==",
    "darwin-x64": "sha512-sMIKMYXsdU9FlIfztj6Kt/SfHlhlDpP0Ups7ftVFqwjaszmYmpI9y/d/q3mLb4jrzuSiSUEislSWCwBnW7MPTw==",
    "linux-arm64v8": "sha512-CD8owELzkDumaom+O3jJ8fKamILAQdj+//KK/VNcHK3sngUcFpdjx36C8okwbux9sml/T7GTB/gzpvReDrAejQ==",
    "linux-armv6": "sha512-wk6IPHatDFVWKJy7lI1TJezHGHPQut1wF2bwx256KlZwXUQU3fcVcMpV1zxXjgLFewHq2+uhyMkoSGBPahWzlA==",
    "linux-armv7": "sha512-HEZC9KYtkmBK5rUR2MqBhrVarnQVZ/TwLUeLkKq0XuoM2pc/eXI6N0Fh5NGEFwdXI2XE8g1ySf+OYS6DDi+xCQ==",
    "linux-x64": "sha512-SlFWrITSW5XVUkaFPQOySAaSGXnhkGJCj8X2wGYYta9hk5piZldQyMp4zwy0z6UeRu1qKTKtZvmq28W3Gnh9xA==",
    "linuxmusl-arm64v8": "sha512-ga9iX7WUva3sG/VsKkOD318InLlCfPIztvzCZKZ2/+izQXRbQi8VoXWMHgEN4KHACv45FTl7mJ/8CRqUzhS8wQ==",
    "linuxmusl-x64": "sha512-yeaHnpfee1hrZLok2l4eFceHzlfq8gN3QOu0R4Mh8iMK5O5vAUu97bdtxeZZeJJvHw8tfh2/msGi0qysxKN8bw==",
    "win32-arm64v8": "sha512-kR91hy9w1+GEXK56hLh51+hBCBo7T+ijM4Slkmvb/2PsYZySq5H7s61n99iDYl6kTJP2y9sW5Xcvm3uuXDaDgg==",
    "win32-ia32": "sha512-HrnofEbzHNpHJ0vVnjsTj5yfgVdcqdWshXuwFO2zc8xlEjA83BvXZ0lVj9MxPxkxJ2ta+/UlLr+CFzc5bOceMw==",
    "win32-x64": "sha512-BwKckinJZ0Fu/EcunqiLPwOLEBWp4xf8GV7nvmVuKKz5f6B+GxoA2k9aa2wueqv4r4RJVgV/aWXZWFKOIjre/Q=="
  }
};
const require$$7 = {
  version,
  config: config$1
};
const fs$1 = require$$0;
const os = require$$0$2;
const path$2 = require$$2;
const spawnSync = require$$0$1.spawnSync;
const semverCoerce = coerce_1;
const semverGreaterThanOrEqualTo = gte_1;
const platform = platform$1;
const { config } = require$$7;
const env = process.env;
const minimumLibvipsVersionLabelled = env.npm_package_config_libvips || /* istanbul ignore next */
config.libvips;
const minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;
const spawnSyncOptions = {
  encoding: "utf8",
  shell: true
};
const vendorPath = path$2.join(__dirname, "..", "vendor", minimumLibvipsVersion, platform());
const mkdirSync = function(dirPath) {
  try {
    fs$1.mkdirSync(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
};
const cachePath = function() {
  const npmCachePath = env.npm_config_cache || /* istanbul ignore next */
  (env.APPDATA ? path$2.join(env.APPDATA, "npm-cache") : path$2.join(os.homedir(), ".npm"));
  mkdirSync(npmCachePath);
  const libvipsCachePath = path$2.join(npmCachePath, "_libvips");
  mkdirSync(libvipsCachePath);
  return libvipsCachePath;
};
const integrity = function(platformAndArch2) {
  return env[`npm_package_config_integrity_${platformAndArch2.replace("-", "_")}`] || config.integrity[platformAndArch2];
};
const log = function(item) {
  if (item instanceof Error) {
    console.error(`sharp: Installation error: ${item.message}`);
  } else {
    console.log(`sharp: ${item}`);
  }
};
const isRosetta = function() {
  if (process.platform === "darwin" && process.arch === "x64") {
    const translated = spawnSync("sysctl sysctl.proc_translated", spawnSyncOptions).stdout;
    return (translated || "").trim() === "sysctl.proc_translated: 1";
  }
  return false;
};
const globalLibvipsVersion = function() {
  if (process.platform !== "win32") {
    const globalLibvipsVersion2 = spawnSync("pkg-config --modversion vips-cpp", {
      ...spawnSyncOptions,
      env: {
        ...env,
        PKG_CONFIG_PATH: pkgConfigPath()
      }
    }).stdout;
    return (globalLibvipsVersion2 || "").trim();
  } else {
    return "";
  }
};
const hasVendoredLibvips = function() {
  return fs$1.existsSync(vendorPath);
};
const removeVendoredLibvips = function() {
  fs$1.rmSync(vendorPath, { recursive: true, maxRetries: 3, force: true });
};
const pkgConfigPath = function() {
  if (process.platform !== "win32") {
    const brewPkgConfigPath = spawnSync(
      'which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2',
      spawnSyncOptions
    ).stdout || "";
    return [
      brewPkgConfigPath.trim(),
      env.PKG_CONFIG_PATH,
      "/usr/local/lib/pkgconfig",
      "/usr/lib/pkgconfig",
      "/usr/local/libdata/pkgconfig",
      "/usr/libdata/pkgconfig"
    ].filter(Boolean).join(":");
  } else {
    return "";
  }
};
const useGlobalLibvips = function() {
  if (Boolean(env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
    return false;
  }
  if (isRosetta()) {
    log("Detected Rosetta, skipping search for globally-installed libvips");
    return false;
  }
  const globalVipsVersion = globalLibvipsVersion();
  return !!globalVipsVersion && /* istanbul ignore next */
  semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
};
var libvips = {
  minimumLibvipsVersion,
  minimumLibvipsVersionLabelled,
  cachePath,
  integrity,
  log,
  globalLibvipsVersion,
  hasVendoredLibvips,
  removeVendoredLibvips,
  pkgConfigPath,
  useGlobalLibvips,
  mkdirSync
};
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var sharp$3 = { exports: {} };
const platformAndArch$1 = platform$1();
try {
  sharp$3.exports = commonjsRequire(`../build/Release/sharp-${platformAndArch$1}.node`);
} catch (err) {
  const help = ["", 'Something went wrong installing the "sharp" module', "", err.message, "", "Possible solutions:"];
  if (/dylib/.test(err.message) && /Incompatible library version/.test(err.message)) {
    help.push('- Update Homebrew: "brew update && brew upgrade vips"');
  } else {
    const [platform2, arch] = platformAndArch$1.split("-");
    if (platform2 === "linux" && /Module did not self-register/.test(err.message)) {
      help.push("- Using worker threads? See https://sharp.pixelplumbing.com/install#worker-threads");
    }
    help.push(
      '- Install with verbose logging and look for errors: "npm install --ignore-scripts=false --foreground-scripts --verbose sharp"',
      `- Install for the current ${platformAndArch$1} runtime: "npm install --platform=${platform2} --arch=${arch} sharp"`
    );
  }
  help.push(
    "- Consult the installation documentation: https://sharp.pixelplumbing.com/install"
  );
  if (process.platform === "win32" || /symbol/.test(err.message)) {
    const loadedModule = Object.keys(require.cache).find((i) => /[\\/]build[\\/]Release[\\/]sharp(.*)\.node$/.test(i));
    if (loadedModule) {
      const [, loadedPackage] = loadedModule.match(/node_modules[\\/]([^\\/]+)[\\/]/);
      help.push(`- Ensure the version of sharp aligns with the ${loadedPackage} package: "npm ls sharp"`);
    }
  }
  throw new Error(help.join("\n"));
}
var sharpExports = sharp$3.exports;
const util = require$$1;
const stream = require$$3;
const is$8 = is$9;
libvips.hasVendoredLibvips();
const debuglog = util.debuglog("sharp");
const Sharp$1 = function(input2, options) {
  if (arguments.length === 1 && !is$8.defined(input2)) {
    throw new Error("Invalid input");
  }
  if (!(this instanceof Sharp$1)) {
    return new Sharp$1(input2, options);
  }
  stream.Duplex.call(this);
  this.options = {
    // resize options
    topOffsetPre: -1,
    leftOffsetPre: -1,
    widthPre: -1,
    heightPre: -1,
    topOffsetPost: -1,
    leftOffsetPost: -1,
    widthPost: -1,
    heightPost: -1,
    width: -1,
    height: -1,
    canvas: "crop",
    position: 0,
    resizeBackground: [0, 0, 0, 255],
    useExifOrientation: false,
    angle: 0,
    rotationAngle: 0,
    rotationBackground: [0, 0, 0, 255],
    rotateBeforePreExtract: false,
    flip: false,
    flop: false,
    extendTop: 0,
    extendBottom: 0,
    extendLeft: 0,
    extendRight: 0,
    extendBackground: [0, 0, 0, 255],
    extendWith: "background",
    withoutEnlargement: false,
    withoutReduction: false,
    affineMatrix: [],
    affineBackground: [0, 0, 0, 255],
    affineIdx: 0,
    affineIdy: 0,
    affineOdx: 0,
    affineOdy: 0,
    affineInterpolator: this.constructor.interpolators.bilinear,
    kernel: "lanczos3",
    fastShrinkOnLoad: true,
    // operations
    tintA: 128,
    tintB: 128,
    flatten: false,
    flattenBackground: [0, 0, 0],
    unflatten: false,
    negate: false,
    negateAlpha: true,
    medianSize: 0,
    blurSigma: 0,
    sharpenSigma: 0,
    sharpenM1: 1,
    sharpenM2: 2,
    sharpenX1: 2,
    sharpenY2: 10,
    sharpenY3: 20,
    threshold: 0,
    thresholdGrayscale: true,
    trimBackground: [],
    trimThreshold: 0,
    gamma: 0,
    gammaOut: 0,
    greyscale: false,
    normalise: false,
    normaliseLower: 1,
    normaliseUpper: 99,
    claheWidth: 0,
    claheHeight: 0,
    claheMaxSlope: 3,
    brightness: 1,
    saturation: 1,
    hue: 0,
    lightness: 0,
    booleanBufferIn: null,
    booleanFileIn: "",
    joinChannelIn: [],
    extractChannel: -1,
    removeAlpha: false,
    ensureAlpha: -1,
    colourspace: "srgb",
    colourspaceInput: "last",
    composite: [],
    // output
    fileOut: "",
    formatOut: "input",
    streamOut: false,
    withMetadata: false,
    withMetadataOrientation: -1,
    withMetadataDensity: 0,
    withMetadataIcc: "",
    withMetadataStrs: {},
    resolveWithObject: false,
    // output format
    jpegQuality: 80,
    jpegProgressive: false,
    jpegChromaSubsampling: "4:2:0",
    jpegTrellisQuantisation: false,
    jpegOvershootDeringing: false,
    jpegOptimiseScans: false,
    jpegOptimiseCoding: true,
    jpegQuantisationTable: 0,
    pngProgressive: false,
    pngCompressionLevel: 6,
    pngAdaptiveFiltering: false,
    pngPalette: false,
    pngQuality: 100,
    pngEffort: 7,
    pngBitdepth: 8,
    pngDither: 1,
    jp2Quality: 80,
    jp2TileHeight: 512,
    jp2TileWidth: 512,
    jp2Lossless: false,
    jp2ChromaSubsampling: "4:4:4",
    webpQuality: 80,
    webpAlphaQuality: 100,
    webpLossless: false,
    webpNearLossless: false,
    webpSmartSubsample: false,
    webpPreset: "default",
    webpEffort: 4,
    webpMinSize: false,
    webpMixed: false,
    gifBitdepth: 8,
    gifEffort: 7,
    gifDither: 1,
    gifInterFrameMaxError: 0,
    gifInterPaletteMaxError: 3,
    gifReuse: true,
    gifProgressive: false,
    tiffQuality: 80,
    tiffCompression: "jpeg",
    tiffPredictor: "horizontal",
    tiffPyramid: false,
    tiffBitdepth: 8,
    tiffTile: false,
    tiffTileHeight: 256,
    tiffTileWidth: 256,
    tiffXres: 1,
    tiffYres: 1,
    tiffResolutionUnit: "inch",
    heifQuality: 50,
    heifLossless: false,
    heifCompression: "av1",
    heifEffort: 4,
    heifChromaSubsampling: "4:4:4",
    jxlDistance: 1,
    jxlDecodingTier: 0,
    jxlEffort: 7,
    jxlLossless: false,
    rawDepth: "uchar",
    tileSize: 256,
    tileOverlap: 0,
    tileContainer: "fs",
    tileLayout: "dz",
    tileFormat: "last",
    tileDepth: "last",
    tileAngle: 0,
    tileSkipBlanks: -1,
    tileBackground: [255, 255, 255, 255],
    tileCentre: false,
    tileId: "https://example.com/iiif",
    tileBasename: "",
    timeoutSeconds: 0,
    linearA: [],
    linearB: [],
    // Function to notify of libvips warnings
    debuglog: (warning) => {
      this.emit("warning", warning);
      debuglog(warning);
    },
    // Function to notify of queue length changes
    queueListener: function(queueLength) {
      Sharp$1.queue.emit("change", queueLength);
    }
  };
  this.options.input = this._createInputDescriptor(input2, options, { allowStream: true });
  return this;
};
Object.setPrototypeOf(Sharp$1.prototype, stream.Duplex.prototype);
Object.setPrototypeOf(Sharp$1, stream.Duplex);
function clone() {
  const clone2 = this.constructor.call();
  clone2.options = Object.assign({}, this.options);
  if (this._isStreamInput()) {
    this.on("finish", () => {
      this._flattenBufferIn();
      clone2.options.bufferIn = this.options.bufferIn;
      clone2.emit("finish");
    });
  }
  return clone2;
}
Object.assign(Sharp$1.prototype, { clone });
var constructor = Sharp$1;
var colorString$1 = { exports: {} };
var colorName = {
  "aliceblue": [240, 248, 255],
  "antiquewhite": [250, 235, 215],
  "aqua": [0, 255, 255],
  "aquamarine": [127, 255, 212],
  "azure": [240, 255, 255],
  "beige": [245, 245, 220],
  "bisque": [255, 228, 196],
  "black": [0, 0, 0],
  "blanchedalmond": [255, 235, 205],
  "blue": [0, 0, 255],
  "blueviolet": [138, 43, 226],
  "brown": [165, 42, 42],
  "burlywood": [222, 184, 135],
  "cadetblue": [95, 158, 160],
  "chartreuse": [127, 255, 0],
  "chocolate": [210, 105, 30],
  "coral": [255, 127, 80],
  "cornflowerblue": [100, 149, 237],
  "cornsilk": [255, 248, 220],
  "crimson": [220, 20, 60],
  "cyan": [0, 255, 255],
  "darkblue": [0, 0, 139],
  "darkcyan": [0, 139, 139],
  "darkgoldenrod": [184, 134, 11],
  "darkgray": [169, 169, 169],
  "darkgreen": [0, 100, 0],
  "darkgrey": [169, 169, 169],
  "darkkhaki": [189, 183, 107],
  "darkmagenta": [139, 0, 139],
  "darkolivegreen": [85, 107, 47],
  "darkorange": [255, 140, 0],
  "darkorchid": [153, 50, 204],
  "darkred": [139, 0, 0],
  "darksalmon": [233, 150, 122],
  "darkseagreen": [143, 188, 143],
  "darkslateblue": [72, 61, 139],
  "darkslategray": [47, 79, 79],
  "darkslategrey": [47, 79, 79],
  "darkturquoise": [0, 206, 209],
  "darkviolet": [148, 0, 211],
  "deeppink": [255, 20, 147],
  "deepskyblue": [0, 191, 255],
  "dimgray": [105, 105, 105],
  "dimgrey": [105, 105, 105],
  "dodgerblue": [30, 144, 255],
  "firebrick": [178, 34, 34],
  "floralwhite": [255, 250, 240],
  "forestgreen": [34, 139, 34],
  "fuchsia": [255, 0, 255],
  "gainsboro": [220, 220, 220],
  "ghostwhite": [248, 248, 255],
  "gold": [255, 215, 0],
  "goldenrod": [218, 165, 32],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenyellow": [173, 255, 47],
  "grey": [128, 128, 128],
  "honeydew": [240, 255, 240],
  "hotpink": [255, 105, 180],
  "indianred": [205, 92, 92],
  "indigo": [75, 0, 130],
  "ivory": [255, 255, 240],
  "khaki": [240, 230, 140],
  "lavender": [230, 230, 250],
  "lavenderblush": [255, 240, 245],
  "lawngreen": [124, 252, 0],
  "lemonchiffon": [255, 250, 205],
  "lightblue": [173, 216, 230],
  "lightcoral": [240, 128, 128],
  "lightcyan": [224, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210],
  "lightgray": [211, 211, 211],
  "lightgreen": [144, 238, 144],
  "lightgrey": [211, 211, 211],
  "lightpink": [255, 182, 193],
  "lightsalmon": [255, 160, 122],
  "lightseagreen": [32, 178, 170],
  "lightskyblue": [135, 206, 250],
  "lightslategray": [119, 136, 153],
  "lightslategrey": [119, 136, 153],
  "lightsteelblue": [176, 196, 222],
  "lightyellow": [255, 255, 224],
  "lime": [0, 255, 0],
  "limegreen": [50, 205, 50],
  "linen": [250, 240, 230],
  "magenta": [255, 0, 255],
  "maroon": [128, 0, 0],
  "mediumaquamarine": [102, 205, 170],
  "mediumblue": [0, 0, 205],
  "mediumorchid": [186, 85, 211],
  "mediumpurple": [147, 112, 219],
  "mediumseagreen": [60, 179, 113],
  "mediumslateblue": [123, 104, 238],
  "mediumspringgreen": [0, 250, 154],
  "mediumturquoise": [72, 209, 204],
  "mediumvioletred": [199, 21, 133],
  "midnightblue": [25, 25, 112],
  "mintcream": [245, 255, 250],
  "mistyrose": [255, 228, 225],
  "moccasin": [255, 228, 181],
  "navajowhite": [255, 222, 173],
  "navy": [0, 0, 128],
  "oldlace": [253, 245, 230],
  "olive": [128, 128, 0],
  "olivedrab": [107, 142, 35],
  "orange": [255, 165, 0],
  "orangered": [255, 69, 0],
  "orchid": [218, 112, 214],
  "palegoldenrod": [238, 232, 170],
  "palegreen": [152, 251, 152],
  "paleturquoise": [175, 238, 238],
  "palevioletred": [219, 112, 147],
  "papayawhip": [255, 239, 213],
  "peachpuff": [255, 218, 185],
  "peru": [205, 133, 63],
  "pink": [255, 192, 203],
  "plum": [221, 160, 221],
  "powderblue": [176, 224, 230],
  "purple": [128, 0, 128],
  "rebeccapurple": [102, 51, 153],
  "red": [255, 0, 0],
  "rosybrown": [188, 143, 143],
  "royalblue": [65, 105, 225],
  "saddlebrown": [139, 69, 19],
  "salmon": [250, 128, 114],
  "sandybrown": [244, 164, 96],
  "seagreen": [46, 139, 87],
  "seashell": [255, 245, 238],
  "sienna": [160, 82, 45],
  "silver": [192, 192, 192],
  "skyblue": [135, 206, 235],
  "slateblue": [106, 90, 205],
  "slategray": [112, 128, 144],
  "slategrey": [112, 128, 144],
  "snow": [255, 250, 250],
  "springgreen": [0, 255, 127],
  "steelblue": [70, 130, 180],
  "tan": [210, 180, 140],
  "teal": [0, 128, 128],
  "thistle": [216, 191, 216],
  "tomato": [255, 99, 71],
  "turquoise": [64, 224, 208],
  "violet": [238, 130, 238],
  "wheat": [245, 222, 179],
  "white": [255, 255, 255],
  "whitesmoke": [245, 245, 245],
  "yellow": [255, 255, 0],
  "yellowgreen": [154, 205, 50]
};
var simpleSwizzle = { exports: {} };
var isArrayish$1 = function isArrayish(obj) {
  if (!obj || typeof obj === "string") {
    return false;
  }
  return obj instanceof Array || Array.isArray(obj) || obj.length >= 0 && (obj.splice instanceof Function || Object.getOwnPropertyDescriptor(obj, obj.length - 1) && obj.constructor.name !== "String");
};
var isArrayish2 = isArrayish$1;
var concat = Array.prototype.concat;
var slice = Array.prototype.slice;
var swizzle$1 = simpleSwizzle.exports = function swizzle(args) {
  var results = [];
  for (var i = 0, len = args.length; i < len; i++) {
    var arg = args[i];
    if (isArrayish2(arg)) {
      results = concat.call(results, slice.call(arg));
    } else {
      results.push(arg);
    }
  }
  return results;
};
swizzle$1.wrap = function(fn2) {
  return function() {
    return fn2(swizzle$1(arguments));
  };
};
var simpleSwizzleExports = simpleSwizzle.exports;
var colorNames = colorName;
var swizzle2 = simpleSwizzleExports;
var hasOwnProperty = Object.hasOwnProperty;
var reverseNames = /* @__PURE__ */ Object.create(null);
for (var name in colorNames) {
  if (hasOwnProperty.call(colorNames, name)) {
    reverseNames[colorNames[name]] = name;
  }
}
var cs = colorString$1.exports = {
  to: {},
  get: {}
};
cs.get = function(string2) {
  var prefix = string2.substring(0, 3).toLowerCase();
  var val;
  var model;
  switch (prefix) {
    case "hsl":
      val = cs.get.hsl(string2);
      model = "hsl";
      break;
    case "hwb":
      val = cs.get.hwb(string2);
      model = "hwb";
      break;
    default:
      val = cs.get.rgb(string2);
      model = "rgb";
      break;
  }
  if (!val) {
    return null;
  }
  return { model, value: val };
};
cs.get.rgb = function(string2) {
  if (!string2) {
    return null;
  }
  var abbr = /^#([a-f0-9]{3,4})$/i;
  var hex = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i;
  var rgba = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/;
  var per = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/;
  var keyword = /^(\w+)$/;
  var rgb = [0, 0, 0, 1];
  var match;
  var i;
  var hexAlpha;
  if (match = string2.match(hex)) {
    hexAlpha = match[2];
    match = match[1];
    for (i = 0; i < 3; i++) {
      var i2 = i * 2;
      rgb[i] = parseInt(match.slice(i2, i2 + 2), 16);
    }
    if (hexAlpha) {
      rgb[3] = parseInt(hexAlpha, 16) / 255;
    }
  } else if (match = string2.match(abbr)) {
    match = match[1];
    hexAlpha = match[3];
    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(match[i] + match[i], 16);
    }
    if (hexAlpha) {
      rgb[3] = parseInt(hexAlpha + hexAlpha, 16) / 255;
    }
  } else if (match = string2.match(rgba)) {
    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(match[i + 1], 0);
    }
    if (match[4]) {
      if (match[5]) {
        rgb[3] = parseFloat(match[4]) * 0.01;
      } else {
        rgb[3] = parseFloat(match[4]);
      }
    }
  } else if (match = string2.match(per)) {
    for (i = 0; i < 3; i++) {
      rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
    }
    if (match[4]) {
      if (match[5]) {
        rgb[3] = parseFloat(match[4]) * 0.01;
      } else {
        rgb[3] = parseFloat(match[4]);
      }
    }
  } else if (match = string2.match(keyword)) {
    if (match[1] === "transparent") {
      return [0, 0, 0, 0];
    }
    if (!hasOwnProperty.call(colorNames, match[1])) {
      return null;
    }
    rgb = colorNames[match[1]];
    rgb[3] = 1;
    return rgb;
  } else {
    return null;
  }
  for (i = 0; i < 3; i++) {
    rgb[i] = clamp(rgb[i], 0, 255);
  }
  rgb[3] = clamp(rgb[3], 0, 1);
  return rgb;
};
cs.get.hsl = function(string2) {
  if (!string2) {
    return null;
  }
  var hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
  var match = string2.match(hsl);
  if (match) {
    var alpha = parseFloat(match[4]);
    var h = (parseFloat(match[1]) % 360 + 360) % 360;
    var s = clamp(parseFloat(match[2]), 0, 100);
    var l = clamp(parseFloat(match[3]), 0, 100);
    var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);
    return [h, s, l, a];
  }
  return null;
};
cs.get.hwb = function(string2) {
  if (!string2) {
    return null;
  }
  var hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
  var match = string2.match(hwb);
  if (match) {
    var alpha = parseFloat(match[4]);
    var h = (parseFloat(match[1]) % 360 + 360) % 360;
    var w = clamp(parseFloat(match[2]), 0, 100);
    var b = clamp(parseFloat(match[3]), 0, 100);
    var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);
    return [h, w, b, a];
  }
  return null;
};
cs.to.hex = function() {
  var rgba = swizzle2(arguments);
  return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : "");
};
cs.to.rgb = function() {
  var rgba = swizzle2(arguments);
  return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ")" : "rgba(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ", " + rgba[3] + ")";
};
cs.to.rgb.percent = function() {
  var rgba = swizzle2(arguments);
  var r = Math.round(rgba[0] / 255 * 100);
  var g = Math.round(rgba[1] / 255 * 100);
  var b = Math.round(rgba[2] / 255 * 100);
  return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + r + "%, " + g + "%, " + b + "%)" : "rgba(" + r + "%, " + g + "%, " + b + "%, " + rgba[3] + ")";
};
cs.to.hsl = function() {
  var hsla = swizzle2(arguments);
  return hsla.length < 4 || hsla[3] === 1 ? "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)" : "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + hsla[3] + ")";
};
cs.to.hwb = function() {
  var hwba = swizzle2(arguments);
  var a = "";
  if (hwba.length >= 4 && hwba[3] !== 1) {
    a = ", " + hwba[3];
  }
  return "hwb(" + hwba[0] + ", " + hwba[1] + "%, " + hwba[2] + "%" + a + ")";
};
cs.to.keyword = function(rgb) {
  return reverseNames[rgb.slice(0, 3)];
};
function clamp(num, min, max) {
  return Math.min(Math.max(min, num), max);
}
function hexDouble(num) {
  var str = Math.round(num).toString(16).toUpperCase();
  return str.length < 2 ? "0" + str : str;
}
var colorStringExports = colorString$1.exports;
const cssKeywords = colorName;
const reverseKeywords = {};
for (const key of Object.keys(cssKeywords)) {
  reverseKeywords[cssKeywords[key]] = key;
}
const convert$2 = {
  rgb: { channels: 3, labels: "rgb" },
  hsl: { channels: 3, labels: "hsl" },
  hsv: { channels: 3, labels: "hsv" },
  hwb: { channels: 3, labels: "hwb" },
  cmyk: { channels: 4, labels: "cmyk" },
  xyz: { channels: 3, labels: "xyz" },
  lab: { channels: 3, labels: "lab" },
  lch: { channels: 3, labels: "lch" },
  hex: { channels: 1, labels: ["hex"] },
  keyword: { channels: 1, labels: ["keyword"] },
  ansi16: { channels: 1, labels: ["ansi16"] },
  ansi256: { channels: 1, labels: ["ansi256"] },
  hcg: { channels: 3, labels: ["h", "c", "g"] },
  apple: { channels: 3, labels: ["r16", "g16", "b16"] },
  gray: { channels: 1, labels: ["gray"] }
};
var conversions$2 = convert$2;
for (const model of Object.keys(convert$2)) {
  if (!("channels" in convert$2[model])) {
    throw new Error("missing channels property: " + model);
  }
  if (!("labels" in convert$2[model])) {
    throw new Error("missing channel labels property: " + model);
  }
  if (convert$2[model].labels.length !== convert$2[model].channels) {
    throw new Error("channel and label counts mismatch: " + model);
  }
  const { channels, labels } = convert$2[model];
  delete convert$2[model].channels;
  delete convert$2[model].labels;
  Object.defineProperty(convert$2[model], "channels", { value: channels });
  Object.defineProperty(convert$2[model], "labels", { value: labels });
}
convert$2.rgb.hsl = function(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  let h;
  let s;
  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) {
    h += 360;
  }
  const l = (min + max) / 2;
  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }
  return [h, s * 100, l * 100];
};
convert$2.rgb.hsv = function(rgb) {
  let rdif;
  let gdif;
  let bdif;
  let h;
  let s;
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const v = Math.max(r, g, b);
  const diff = v - Math.min(r, g, b);
  const diffc = function(c) {
    return (v - c) / 6 / diff + 1 / 2;
  };
  if (diff === 0) {
    h = 0;
    s = 0;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);
    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  return [
    h * 360,
    s * 100,
    v * 100
  ];
};
convert$2.rgb.hwb = function(rgb) {
  const r = rgb[0];
  const g = rgb[1];
  let b = rgb[2];
  const h = convert$2.rgb.hsl(rgb)[0];
  const w = 1 / 255 * Math.min(r, Math.min(g, b));
  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
  return [h, w * 100, b * 100];
};
convert$2.rgb.cmyk = function(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const k = Math.min(1 - r, 1 - g, 1 - b);
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
};
function comparativeDistance(x, y) {
  return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
}
convert$2.rgb.keyword = function(rgb) {
  const reversed = reverseKeywords[rgb];
  if (reversed) {
    return reversed;
  }
  let currentClosestDistance = Infinity;
  let currentClosestKeyword;
  for (const keyword of Object.keys(cssKeywords)) {
    const value = cssKeywords[keyword];
    const distance = comparativeDistance(rgb, value);
    if (distance < currentClosestDistance) {
      currentClosestDistance = distance;
      currentClosestKeyword = keyword;
    }
  }
  return currentClosestKeyword;
};
convert$2.keyword.rgb = function(keyword) {
  return cssKeywords[keyword];
};
convert$2.rgb.xyz = function(rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;
  r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
  g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
  b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
};
convert$2.rgb.lab = function(rgb) {
  const xyz = convert$2.rgb.xyz(rgb);
  let x = xyz[0];
  let y = xyz[1];
  let z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return [l, a, b];
};
convert$2.hsl.rgb = function(hsl) {
  const h = hsl[0] / 360;
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  let t2;
  let t3;
  let val;
  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }
  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }
  const t1 = 2 * l - t2;
  const rgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);
    if (t3 < 0) {
      t3++;
    }
    if (t3 > 1) {
      t3--;
    }
    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }
    rgb[i] = val * 255;
  }
  return rgb;
};
convert$2.hsl.hsv = function(hsl) {
  const h = hsl[0];
  let s = hsl[1] / 100;
  let l = hsl[2] / 100;
  let smin = s;
  const lmin = Math.max(l, 0.01);
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  const v = (l + s) / 2;
  const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
  return [h, sv * 100, v * 100];
};
convert$2.hsv.rgb = function(hsv) {
  const h = hsv[0] / 60;
  const s = hsv[1] / 100;
  let v = hsv[2] / 100;
  const hi = Math.floor(h) % 6;
  const f = h - Math.floor(h);
  const p = 255 * v * (1 - s);
  const q = 255 * v * (1 - s * f);
  const t2 = 255 * v * (1 - s * (1 - f));
  v *= 255;
  switch (hi) {
    case 0:
      return [v, t2, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t2];
    case 3:
      return [p, q, v];
    case 4:
      return [t2, p, v];
    case 5:
      return [v, p, q];
  }
};
convert$2.hsv.hsl = function(hsv) {
  const h = hsv[0];
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;
  const vmin = Math.max(v, 0.01);
  let sl;
  let l;
  l = (2 - s) * v;
  const lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
};
convert$2.hwb.rgb = function(hwb) {
  const h = hwb[0] / 360;
  let wh = hwb[1] / 100;
  let bl = hwb[2] / 100;
  const ratio = wh + bl;
  let f;
  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }
  const i = Math.floor(6 * h);
  const v = 1 - bl;
  f = 6 * h - i;
  if ((i & 1) !== 0) {
    f = 1 - f;
  }
  const n = wh + f * (v - wh);
  let r;
  let g;
  let b;
  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;
    case 1:
      r = n;
      g = v;
      b = wh;
      break;
    case 2:
      r = wh;
      g = v;
      b = n;
      break;
    case 3:
      r = wh;
      g = n;
      b = v;
      break;
    case 4:
      r = n;
      g = wh;
      b = v;
      break;
    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }
  return [r * 255, g * 255, b * 255];
};
convert$2.cmyk.rgb = function(cmyk) {
  const c = cmyk[0] / 100;
  const m = cmyk[1] / 100;
  const y = cmyk[2] / 100;
  const k = cmyk[3] / 100;
  const r = 1 - Math.min(1, c * (1 - k) + k);
  const g = 1 - Math.min(1, m * (1 - k) + k);
  const b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
};
convert$2.xyz.rgb = function(xyz) {
  const x = xyz[0] / 100;
  const y = xyz[1] / 100;
  const z = xyz[2] / 100;
  let r;
  let g;
  let b;
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.204 + z * 1.057;
  r = r > 31308e-7 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
  g = g > 31308e-7 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
  b = b > 31308e-7 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r * 255, g * 255, b * 255];
};
convert$2.xyz.lab = function(xyz) {
  let x = xyz[0];
  let y = xyz[1];
  let z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return [l, a, b];
};
convert$2.lab.xyz = function(lab) {
  const l = lab[0];
  const a = lab[1];
  const b = lab[2];
  let x;
  let y;
  let z;
  y = (l + 16) / 116;
  x = a / 500 + y;
  z = y - b / 200;
  const y2 = y ** 3;
  const x2 = x ** 3;
  const z2 = z ** 3;
  y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
  x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
  z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
  x *= 95.047;
  y *= 100;
  z *= 108.883;
  return [x, y, z];
};
convert$2.lab.lch = function(lab) {
  const l = lab[0];
  const a = lab[1];
  const b = lab[2];
  let h;
  const hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  const c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};
convert$2.lch.lab = function(lch) {
  const l = lch[0];
  const c = lch[1];
  const h = lch[2];
  const hr = h / 360 * 2 * Math.PI;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  return [l, a, b];
};
convert$2.rgb.ansi16 = function(args, saturation = null) {
  const [r, g, b] = args;
  let value = saturation === null ? convert$2.rgb.hsv(args)[2] : saturation;
  value = Math.round(value / 50);
  if (value === 0) {
    return 30;
  }
  let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
  if (value === 2) {
    ansi += 60;
  }
  return ansi;
};
convert$2.hsv.ansi16 = function(args) {
  return convert$2.rgb.ansi16(convert$2.hsv.rgb(args), args[2]);
};
convert$2.rgb.ansi256 = function(args) {
  const r = args[0];
  const g = args[1];
  const b = args[2];
  if (r === g && g === b) {
    if (r < 8) {
      return 16;
    }
    if (r > 248) {
      return 231;
    }
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
  return ansi;
};
convert$2.ansi16.rgb = function(args) {
  let color2 = args % 10;
  if (color2 === 0 || color2 === 7) {
    if (args > 50) {
      color2 += 3.5;
    }
    color2 = color2 / 10.5 * 255;
    return [color2, color2, color2];
  }
  const mult = (~~(args > 50) + 1) * 0.5;
  const r = (color2 & 1) * mult * 255;
  const g = (color2 >> 1 & 1) * mult * 255;
  const b = (color2 >> 2 & 1) * mult * 255;
  return [r, g, b];
};
convert$2.ansi256.rgb = function(args) {
  if (args >= 232) {
    const c = (args - 232) * 10 + 8;
    return [c, c, c];
  }
  args -= 16;
  let rem;
  const r = Math.floor(args / 36) / 5 * 255;
  const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
  const b = rem % 6 / 5 * 255;
  return [r, g, b];
};
convert$2.rgb.hex = function(args) {
  const integer2 = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
  const string2 = integer2.toString(16).toUpperCase();
  return "000000".substring(string2.length) + string2;
};
convert$2.hex.rgb = function(args) {
  const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
  if (!match) {
    return [0, 0, 0];
  }
  let colorString2 = match[0];
  if (match[0].length === 3) {
    colorString2 = colorString2.split("").map((char) => {
      return char + char;
    }).join("");
  }
  const integer2 = parseInt(colorString2, 16);
  const r = integer2 >> 16 & 255;
  const g = integer2 >> 8 & 255;
  const b = integer2 & 255;
  return [r, g, b];
};
convert$2.rgb.hcg = function(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(Math.max(r, g), b);
  const min = Math.min(Math.min(r, g), b);
  const chroma = max - min;
  let grayscale2;
  let hue;
  if (chroma < 1) {
    grayscale2 = min / (1 - chroma);
  } else {
    grayscale2 = 0;
  }
  if (chroma <= 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / chroma % 6;
  } else if (max === g) {
    hue = 2 + (b - r) / chroma;
  } else {
    hue = 4 + (r - g) / chroma;
  }
  hue /= 6;
  hue %= 1;
  return [hue * 360, chroma * 100, grayscale2 * 100];
};
convert$2.hsl.hcg = function(hsl) {
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
  let f = 0;
  if (c < 1) {
    f = (l - 0.5 * c) / (1 - c);
  }
  return [hsl[0], c * 100, f * 100];
};
convert$2.hsv.hcg = function(hsv) {
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;
  const c = s * v;
  let f = 0;
  if (c < 1) {
    f = (v - c) / (1 - c);
  }
  return [hsv[0], c * 100, f * 100];
};
convert$2.hcg.rgb = function(hcg) {
  const h = hcg[0] / 360;
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  if (c === 0) {
    return [g * 255, g * 255, g * 255];
  }
  const pure = [0, 0, 0];
  const hi = h % 1 * 6;
  const v = hi % 1;
  const w = 1 - v;
  let mg = 0;
  switch (Math.floor(hi)) {
    case 0:
      pure[0] = 1;
      pure[1] = v;
      pure[2] = 0;
      break;
    case 1:
      pure[0] = w;
      pure[1] = 1;
      pure[2] = 0;
      break;
    case 2:
      pure[0] = 0;
      pure[1] = 1;
      pure[2] = v;
      break;
    case 3:
      pure[0] = 0;
      pure[1] = w;
      pure[2] = 1;
      break;
    case 4:
      pure[0] = v;
      pure[1] = 0;
      pure[2] = 1;
      break;
    default:
      pure[0] = 1;
      pure[1] = 0;
      pure[2] = w;
  }
  mg = (1 - c) * g;
  return [
    (c * pure[0] + mg) * 255,
    (c * pure[1] + mg) * 255,
    (c * pure[2] + mg) * 255
  ];
};
convert$2.hcg.hsv = function(hcg) {
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  const v = c + g * (1 - c);
  let f = 0;
  if (v > 0) {
    f = c / v;
  }
  return [hcg[0], f * 100, v * 100];
};
convert$2.hcg.hsl = function(hcg) {
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  const l = g * (1 - c) + 0.5 * c;
  let s = 0;
  if (l > 0 && l < 0.5) {
    s = c / (2 * l);
  } else if (l >= 0.5 && l < 1) {
    s = c / (2 * (1 - l));
  }
  return [hcg[0], s * 100, l * 100];
};
convert$2.hcg.hwb = function(hcg) {
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  const v = c + g * (1 - c);
  return [hcg[0], (v - c) * 100, (1 - v) * 100];
};
convert$2.hwb.hcg = function(hwb) {
  const w = hwb[1] / 100;
  const b = hwb[2] / 100;
  const v = 1 - b;
  const c = v - w;
  let g = 0;
  if (c < 1) {
    g = (v - c) / (1 - c);
  }
  return [hwb[0], c * 100, g * 100];
};
convert$2.apple.rgb = function(apple) {
  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
};
convert$2.rgb.apple = function(rgb) {
  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
};
convert$2.gray.rgb = function(args) {
  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};
convert$2.gray.hsl = function(args) {
  return [0, 0, args[0]];
};
convert$2.gray.hsv = convert$2.gray.hsl;
convert$2.gray.hwb = function(gray) {
  return [0, 100, gray[0]];
};
convert$2.gray.cmyk = function(gray) {
  return [0, 0, 0, gray[0]];
};
convert$2.gray.lab = function(gray) {
  return [gray[0], 0, 0];
};
convert$2.gray.hex = function(gray) {
  const val = Math.round(gray[0] / 100 * 255) & 255;
  const integer2 = (val << 16) + (val << 8) + val;
  const string2 = integer2.toString(16).toUpperCase();
  return "000000".substring(string2.length) + string2;
};
convert$2.rgb.gray = function(rgb) {
  const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [val / 255 * 100];
};
const conversions$1 = conversions$2;
function buildGraph() {
  const graph = {};
  const models2 = Object.keys(conversions$1);
  for (let len = models2.length, i = 0; i < len; i++) {
    graph[models2[i]] = {
      // http://jsperf.com/1-vs-infinity
      // micro-opt, but this is simple.
      distance: -1,
      parent: null
    };
  }
  return graph;
}
function deriveBFS(fromModel) {
  const graph = buildGraph();
  const queue2 = [fromModel];
  graph[fromModel].distance = 0;
  while (queue2.length) {
    const current = queue2.pop();
    const adjacents = Object.keys(conversions$1[current]);
    for (let len = adjacents.length, i = 0; i < len; i++) {
      const adjacent = adjacents[i];
      const node = graph[adjacent];
      if (node.distance === -1) {
        node.distance = graph[current].distance + 1;
        node.parent = current;
        queue2.unshift(adjacent);
      }
    }
  }
  return graph;
}
function link(from, to) {
  return function(args) {
    return to(from(args));
  };
}
function wrapConversion(toModel, graph) {
  const path2 = [graph[toModel].parent, toModel];
  let fn2 = conversions$1[graph[toModel].parent][toModel];
  let cur = graph[toModel].parent;
  while (graph[cur].parent) {
    path2.unshift(graph[cur].parent);
    fn2 = link(conversions$1[graph[cur].parent][cur], fn2);
    cur = graph[cur].parent;
  }
  fn2.conversion = path2;
  return fn2;
}
var route$1 = function(fromModel) {
  const graph = deriveBFS(fromModel);
  const conversion = {};
  const models2 = Object.keys(graph);
  for (let len = models2.length, i = 0; i < len; i++) {
    const toModel = models2[i];
    const node = graph[toModel];
    if (node.parent === null) {
      continue;
    }
    conversion[toModel] = wrapConversion(toModel, graph);
  }
  return conversion;
};
const conversions = conversions$2;
const route = route$1;
const convert$1 = {};
const models = Object.keys(conversions);
function wrapRaw(fn2) {
  const wrappedFn = function(...args) {
    const arg0 = args[0];
    if (arg0 === void 0 || arg0 === null) {
      return arg0;
    }
    if (arg0.length > 1) {
      args = arg0;
    }
    return fn2(args);
  };
  if ("conversion" in fn2) {
    wrappedFn.conversion = fn2.conversion;
  }
  return wrappedFn;
}
function wrapRounded(fn2) {
  const wrappedFn = function(...args) {
    const arg0 = args[0];
    if (arg0 === void 0 || arg0 === null) {
      return arg0;
    }
    if (arg0.length > 1) {
      args = arg0;
    }
    const result = fn2(args);
    if (typeof result === "object") {
      for (let len = result.length, i = 0; i < len; i++) {
        result[i] = Math.round(result[i]);
      }
    }
    return result;
  };
  if ("conversion" in fn2) {
    wrappedFn.conversion = fn2.conversion;
  }
  return wrappedFn;
}
models.forEach((fromModel) => {
  convert$1[fromModel] = {};
  Object.defineProperty(convert$1[fromModel], "channels", { value: conversions[fromModel].channels });
  Object.defineProperty(convert$1[fromModel], "labels", { value: conversions[fromModel].labels });
  const routes = route(fromModel);
  const routeModels = Object.keys(routes);
  routeModels.forEach((toModel) => {
    const fn2 = routes[toModel];
    convert$1[fromModel][toModel] = wrapRounded(fn2);
    convert$1[fromModel][toModel].raw = wrapRaw(fn2);
  });
});
var colorConvert = convert$1;
const colorString = colorStringExports;
const convert = colorConvert;
const skippedModels = [
  // To be honest, I don't really feel like keyword belongs in color convert, but eh.
  "keyword",
  // Gray conflicts with some method names, and has its own method defined.
  "gray",
  // Shouldn't really be in color-convert either...
  "hex"
];
const hashedModelKeys = {};
for (const model of Object.keys(convert)) {
  hashedModelKeys[[...convert[model].labels].sort().join("")] = model;
}
const limiters = {};
function Color(object2, model) {
  if (!(this instanceof Color)) {
    return new Color(object2, model);
  }
  if (model && model in skippedModels) {
    model = null;
  }
  if (model && !(model in convert)) {
    throw new Error("Unknown model: " + model);
  }
  let i;
  let channels;
  if (object2 == null) {
    this.model = "rgb";
    this.color = [0, 0, 0];
    this.valpha = 1;
  } else if (object2 instanceof Color) {
    this.model = object2.model;
    this.color = [...object2.color];
    this.valpha = object2.valpha;
  } else if (typeof object2 === "string") {
    const result = colorString.get(object2);
    if (result === null) {
      throw new Error("Unable to parse color from string: " + object2);
    }
    this.model = result.model;
    channels = convert[this.model].channels;
    this.color = result.value.slice(0, channels);
    this.valpha = typeof result.value[channels] === "number" ? result.value[channels] : 1;
  } else if (object2.length > 0) {
    this.model = model || "rgb";
    channels = convert[this.model].channels;
    const newArray = Array.prototype.slice.call(object2, 0, channels);
    this.color = zeroArray(newArray, channels);
    this.valpha = typeof object2[channels] === "number" ? object2[channels] : 1;
  } else if (typeof object2 === "number") {
    this.model = "rgb";
    this.color = [
      object2 >> 16 & 255,
      object2 >> 8 & 255,
      object2 & 255
    ];
    this.valpha = 1;
  } else {
    this.valpha = 1;
    const keys = Object.keys(object2);
    if ("alpha" in object2) {
      keys.splice(keys.indexOf("alpha"), 1);
      this.valpha = typeof object2.alpha === "number" ? object2.alpha : 0;
    }
    const hashedKeys = keys.sort().join("");
    if (!(hashedKeys in hashedModelKeys)) {
      throw new Error("Unable to parse color from object: " + JSON.stringify(object2));
    }
    this.model = hashedModelKeys[hashedKeys];
    const { labels } = convert[this.model];
    const color2 = [];
    for (i = 0; i < labels.length; i++) {
      color2.push(object2[labels[i]]);
    }
    this.color = zeroArray(color2);
  }
  if (limiters[this.model]) {
    channels = convert[this.model].channels;
    for (i = 0; i < channels; i++) {
      const limit = limiters[this.model][i];
      if (limit) {
        this.color[i] = limit(this.color[i]);
      }
    }
  }
  this.valpha = Math.max(0, Math.min(1, this.valpha));
  if (Object.freeze) {
    Object.freeze(this);
  }
}
Color.prototype = {
  toString() {
    return this.string();
  },
  toJSON() {
    return this[this.model]();
  },
  string(places) {
    let self = this.model in colorString.to ? this : this.rgb();
    self = self.round(typeof places === "number" ? places : 1);
    const args = self.valpha === 1 ? self.color : [...self.color, this.valpha];
    return colorString.to[self.model](args);
  },
  percentString(places) {
    const self = this.rgb().round(typeof places === "number" ? places : 1);
    const args = self.valpha === 1 ? self.color : [...self.color, this.valpha];
    return colorString.to.rgb.percent(args);
  },
  array() {
    return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha];
  },
  object() {
    const result = {};
    const { channels } = convert[this.model];
    const { labels } = convert[this.model];
    for (let i = 0; i < channels; i++) {
      result[labels[i]] = this.color[i];
    }
    if (this.valpha !== 1) {
      result.alpha = this.valpha;
    }
    return result;
  },
  unitArray() {
    const rgb = this.rgb().color;
    rgb[0] /= 255;
    rgb[1] /= 255;
    rgb[2] /= 255;
    if (this.valpha !== 1) {
      rgb.push(this.valpha);
    }
    return rgb;
  },
  unitObject() {
    const rgb = this.rgb().object();
    rgb.r /= 255;
    rgb.g /= 255;
    rgb.b /= 255;
    if (this.valpha !== 1) {
      rgb.alpha = this.valpha;
    }
    return rgb;
  },
  round(places) {
    places = Math.max(places || 0, 0);
    return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model);
  },
  alpha(value) {
    if (value !== void 0) {
      return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model);
    }
    return this.valpha;
  },
  // Rgb
  red: getset("rgb", 0, maxfn(255)),
  green: getset("rgb", 1, maxfn(255)),
  blue: getset("rgb", 2, maxfn(255)),
  hue: getset(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, (value) => (value % 360 + 360) % 360),
  saturationl: getset("hsl", 1, maxfn(100)),
  lightness: getset("hsl", 2, maxfn(100)),
  saturationv: getset("hsv", 1, maxfn(100)),
  value: getset("hsv", 2, maxfn(100)),
  chroma: getset("hcg", 1, maxfn(100)),
  gray: getset("hcg", 2, maxfn(100)),
  white: getset("hwb", 1, maxfn(100)),
  wblack: getset("hwb", 2, maxfn(100)),
  cyan: getset("cmyk", 0, maxfn(100)),
  magenta: getset("cmyk", 1, maxfn(100)),
  yellow: getset("cmyk", 2, maxfn(100)),
  black: getset("cmyk", 3, maxfn(100)),
  x: getset("xyz", 0, maxfn(95.047)),
  y: getset("xyz", 1, maxfn(100)),
  z: getset("xyz", 2, maxfn(108.833)),
  l: getset("lab", 0, maxfn(100)),
  a: getset("lab", 1),
  b: getset("lab", 2),
  keyword(value) {
    if (value !== void 0) {
      return new Color(value);
    }
    return convert[this.model].keyword(this.color);
  },
  hex(value) {
    if (value !== void 0) {
      return new Color(value);
    }
    return colorString.to.hex(this.rgb().round().color);
  },
  hexa(value) {
    if (value !== void 0) {
      return new Color(value);
    }
    const rgbArray = this.rgb().round().color;
    let alphaHex = Math.round(this.valpha * 255).toString(16).toUpperCase();
    if (alphaHex.length === 1) {
      alphaHex = "0" + alphaHex;
    }
    return colorString.to.hex(rgbArray) + alphaHex;
  },
  rgbNumber() {
    const rgb = this.rgb().color;
    return (rgb[0] & 255) << 16 | (rgb[1] & 255) << 8 | rgb[2] & 255;
  },
  luminosity() {
    const rgb = this.rgb().color;
    const lum = [];
    for (const [i, element] of rgb.entries()) {
      const chan = element / 255;
      lum[i] = chan <= 0.04045 ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4;
    }
    return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
  },
  contrast(color2) {
    const lum1 = this.luminosity();
    const lum2 = color2.luminosity();
    if (lum1 > lum2) {
      return (lum1 + 0.05) / (lum2 + 0.05);
    }
    return (lum2 + 0.05) / (lum1 + 0.05);
  },
  level(color2) {
    const contrastRatio = this.contrast(color2);
    if (contrastRatio >= 7) {
      return "AAA";
    }
    return contrastRatio >= 4.5 ? "AA" : "";
  },
  isDark() {
    const rgb = this.rgb().color;
    const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 1e4;
    return yiq < 128;
  },
  isLight() {
    return !this.isDark();
  },
  negate() {
    const rgb = this.rgb();
    for (let i = 0; i < 3; i++) {
      rgb.color[i] = 255 - rgb.color[i];
    }
    return rgb;
  },
  lighten(ratio) {
    const hsl = this.hsl();
    hsl.color[2] += hsl.color[2] * ratio;
    return hsl;
  },
  darken(ratio) {
    const hsl = this.hsl();
    hsl.color[2] -= hsl.color[2] * ratio;
    return hsl;
  },
  saturate(ratio) {
    const hsl = this.hsl();
    hsl.color[1] += hsl.color[1] * ratio;
    return hsl;
  },
  desaturate(ratio) {
    const hsl = this.hsl();
    hsl.color[1] -= hsl.color[1] * ratio;
    return hsl;
  },
  whiten(ratio) {
    const hwb = this.hwb();
    hwb.color[1] += hwb.color[1] * ratio;
    return hwb;
  },
  blacken(ratio) {
    const hwb = this.hwb();
    hwb.color[2] += hwb.color[2] * ratio;
    return hwb;
  },
  grayscale() {
    const rgb = this.rgb().color;
    const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
    return Color.rgb(value, value, value);
  },
  fade(ratio) {
    return this.alpha(this.valpha - this.valpha * ratio);
  },
  opaquer(ratio) {
    return this.alpha(this.valpha + this.valpha * ratio);
  },
  rotate(degrees) {
    const hsl = this.hsl();
    let hue = hsl.color[0];
    hue = (hue + degrees) % 360;
    hue = hue < 0 ? 360 + hue : hue;
    hsl.color[0] = hue;
    return hsl;
  },
  mix(mixinColor, weight) {
    if (!mixinColor || !mixinColor.rgb) {
      throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
    }
    const color1 = mixinColor.rgb();
    const color2 = this.rgb();
    const p = weight === void 0 ? 0.5 : weight;
    const w = 2 * p - 1;
    const a = color1.alpha() - color2.alpha();
    const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
    const w2 = 1 - w1;
    return Color.rgb(
      w1 * color1.red() + w2 * color2.red(),
      w1 * color1.green() + w2 * color2.green(),
      w1 * color1.blue() + w2 * color2.blue(),
      color1.alpha() * p + color2.alpha() * (1 - p)
    );
  }
};
for (const model of Object.keys(convert)) {
  if (skippedModels.includes(model)) {
    continue;
  }
  const { channels } = convert[model];
  Color.prototype[model] = function(...args) {
    if (this.model === model) {
      return new Color(this);
    }
    if (args.length > 0) {
      return new Color(args, model);
    }
    return new Color([...assertArray(convert[this.model][model].raw(this.color)), this.valpha], model);
  };
  Color[model] = function(...args) {
    let color2 = args[0];
    if (typeof color2 === "number") {
      color2 = zeroArray(args, channels);
    }
    return new Color(color2, model);
  };
}
function roundTo(number2, places) {
  return Number(number2.toFixed(places));
}
function roundToPlace(places) {
  return function(number2) {
    return roundTo(number2, places);
  };
}
function getset(model, channel2, modifier) {
  model = Array.isArray(model) ? model : [model];
  for (const m of model) {
    (limiters[m] || (limiters[m] = []))[channel2] = modifier;
  }
  model = model[0];
  return function(value) {
    let result;
    if (value !== void 0) {
      if (modifier) {
        value = modifier(value);
      }
      result = this[model]();
      result.color[channel2] = value;
      return result;
    }
    result = this[model]().color[channel2];
    if (modifier) {
      result = modifier(result);
    }
    return result;
  };
}
function maxfn(max) {
  return function(v) {
    return Math.max(0, Math.min(max, v));
  };
}
function assertArray(value) {
  return Array.isArray(value) ? value : [value];
}
function zeroArray(array, length) {
  for (let i = 0; i < length; i++) {
    if (typeof array[i] !== "number") {
      array[i] = 0;
    }
  }
  return array;
}
var color$3 = Color;
const color$2 = color$3;
const is$7 = is$9;
const sharp$2 = sharpExports;
const align = {
  left: "low",
  center: "centre",
  centre: "centre",
  right: "high"
};
function _inputOptionsFromObject(obj) {
  const { raw: raw2, density, limitInputPixels, ignoreIcc, unlimited, sequentialRead, failOn, failOnError, animated, page, pages, subifd } = obj;
  return [raw2, density, limitInputPixels, ignoreIcc, unlimited, sequentialRead, failOn, failOnError, animated, page, pages, subifd].some(is$7.defined) ? { raw: raw2, density, limitInputPixels, ignoreIcc, unlimited, sequentialRead, failOn, failOnError, animated, page, pages, subifd } : void 0;
}
function _createInputDescriptor(input2, inputOptions, containerOptions) {
  const inputDescriptor = {
    failOn: "warning",
    limitInputPixels: Math.pow(16383, 2),
    ignoreIcc: false,
    unlimited: false,
    sequentialRead: true
  };
  if (is$7.string(input2)) {
    inputDescriptor.file = input2;
  } else if (is$7.buffer(input2)) {
    if (input2.length === 0) {
      throw Error("Input Buffer is empty");
    }
    inputDescriptor.buffer = input2;
  } else if (is$7.arrayBuffer(input2)) {
    if (input2.byteLength === 0) {
      throw Error("Input bit Array is empty");
    }
    inputDescriptor.buffer = Buffer.from(input2, 0, input2.byteLength);
  } else if (is$7.typedArray(input2)) {
    if (input2.length === 0) {
      throw Error("Input Bit Array is empty");
    }
    inputDescriptor.buffer = Buffer.from(input2.buffer, input2.byteOffset, input2.byteLength);
  } else if (is$7.plainObject(input2) && !is$7.defined(inputOptions)) {
    inputOptions = input2;
    if (_inputOptionsFromObject(inputOptions)) {
      inputDescriptor.buffer = [];
    }
  } else if (!is$7.defined(input2) && !is$7.defined(inputOptions) && is$7.object(containerOptions) && containerOptions.allowStream) {
    inputDescriptor.buffer = [];
  } else {
    throw new Error(`Unsupported input '${input2}' of type ${typeof input2}${is$7.defined(inputOptions) ? ` when also providing options of type ${typeof inputOptions}` : ""}`);
  }
  if (is$7.object(inputOptions)) {
    if (is$7.defined(inputOptions.failOnError)) {
      if (is$7.bool(inputOptions.failOnError)) {
        inputDescriptor.failOn = inputOptions.failOnError ? "warning" : "none";
      } else {
        throw is$7.invalidParameterError("failOnError", "boolean", inputOptions.failOnError);
      }
    }
    if (is$7.defined(inputOptions.failOn)) {
      if (is$7.string(inputOptions.failOn) && is$7.inArray(inputOptions.failOn, ["none", "truncated", "error", "warning"])) {
        inputDescriptor.failOn = inputOptions.failOn;
      } else {
        throw is$7.invalidParameterError("failOn", "one of: none, truncated, error, warning", inputOptions.failOn);
      }
    }
    if (is$7.defined(inputOptions.density)) {
      if (is$7.inRange(inputOptions.density, 1, 1e5)) {
        inputDescriptor.density = inputOptions.density;
      } else {
        throw is$7.invalidParameterError("density", "number between 1 and 100000", inputOptions.density);
      }
    }
    if (is$7.defined(inputOptions.ignoreIcc)) {
      if (is$7.bool(inputOptions.ignoreIcc)) {
        inputDescriptor.ignoreIcc = inputOptions.ignoreIcc;
      } else {
        throw is$7.invalidParameterError("ignoreIcc", "boolean", inputOptions.ignoreIcc);
      }
    }
    if (is$7.defined(inputOptions.limitInputPixels)) {
      if (is$7.bool(inputOptions.limitInputPixels)) {
        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels ? Math.pow(16383, 2) : 0;
      } else if (is$7.integer(inputOptions.limitInputPixels) && is$7.inRange(inputOptions.limitInputPixels, 0, Number.MAX_SAFE_INTEGER)) {
        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels;
      } else {
        throw is$7.invalidParameterError("limitInputPixels", "positive integer", inputOptions.limitInputPixels);
      }
    }
    if (is$7.defined(inputOptions.unlimited)) {
      if (is$7.bool(inputOptions.unlimited)) {
        inputDescriptor.unlimited = inputOptions.unlimited;
      } else {
        throw is$7.invalidParameterError("unlimited", "boolean", inputOptions.unlimited);
      }
    }
    if (is$7.defined(inputOptions.sequentialRead)) {
      if (is$7.bool(inputOptions.sequentialRead)) {
        inputDescriptor.sequentialRead = inputOptions.sequentialRead;
      } else {
        throw is$7.invalidParameterError("sequentialRead", "boolean", inputOptions.sequentialRead);
      }
    }
    if (is$7.defined(inputOptions.raw)) {
      if (is$7.object(inputOptions.raw) && is$7.integer(inputOptions.raw.width) && inputOptions.raw.width > 0 && is$7.integer(inputOptions.raw.height) && inputOptions.raw.height > 0 && is$7.integer(inputOptions.raw.channels) && is$7.inRange(inputOptions.raw.channels, 1, 4)) {
        inputDescriptor.rawWidth = inputOptions.raw.width;
        inputDescriptor.rawHeight = inputOptions.raw.height;
        inputDescriptor.rawChannels = inputOptions.raw.channels;
        inputDescriptor.rawPremultiplied = !!inputOptions.raw.premultiplied;
        switch (input2.constructor) {
          case Uint8Array:
          case Uint8ClampedArray:
            inputDescriptor.rawDepth = "uchar";
            break;
          case Int8Array:
            inputDescriptor.rawDepth = "char";
            break;
          case Uint16Array:
            inputDescriptor.rawDepth = "ushort";
            break;
          case Int16Array:
            inputDescriptor.rawDepth = "short";
            break;
          case Uint32Array:
            inputDescriptor.rawDepth = "uint";
            break;
          case Int32Array:
            inputDescriptor.rawDepth = "int";
            break;
          case Float32Array:
            inputDescriptor.rawDepth = "float";
            break;
          case Float64Array:
            inputDescriptor.rawDepth = "double";
            break;
          default:
            inputDescriptor.rawDepth = "uchar";
            break;
        }
      } else {
        throw new Error("Expected width, height and channels for raw pixel input");
      }
    }
    if (is$7.defined(inputOptions.animated)) {
      if (is$7.bool(inputOptions.animated)) {
        inputDescriptor.pages = inputOptions.animated ? -1 : 1;
      } else {
        throw is$7.invalidParameterError("animated", "boolean", inputOptions.animated);
      }
    }
    if (is$7.defined(inputOptions.pages)) {
      if (is$7.integer(inputOptions.pages) && is$7.inRange(inputOptions.pages, -1, 1e5)) {
        inputDescriptor.pages = inputOptions.pages;
      } else {
        throw is$7.invalidParameterError("pages", "integer between -1 and 100000", inputOptions.pages);
      }
    }
    if (is$7.defined(inputOptions.page)) {
      if (is$7.integer(inputOptions.page) && is$7.inRange(inputOptions.page, 0, 1e5)) {
        inputDescriptor.page = inputOptions.page;
      } else {
        throw is$7.invalidParameterError("page", "integer between 0 and 100000", inputOptions.page);
      }
    }
    if (is$7.defined(inputOptions.level)) {
      if (is$7.integer(inputOptions.level) && is$7.inRange(inputOptions.level, 0, 256)) {
        inputDescriptor.level = inputOptions.level;
      } else {
        throw is$7.invalidParameterError("level", "integer between 0 and 256", inputOptions.level);
      }
    }
    if (is$7.defined(inputOptions.subifd)) {
      if (is$7.integer(inputOptions.subifd) && is$7.inRange(inputOptions.subifd, -1, 1e5)) {
        inputDescriptor.subifd = inputOptions.subifd;
      } else {
        throw is$7.invalidParameterError("subifd", "integer between -1 and 100000", inputOptions.subifd);
      }
    }
    if (is$7.defined(inputOptions.create)) {
      if (is$7.object(inputOptions.create) && is$7.integer(inputOptions.create.width) && inputOptions.create.width > 0 && is$7.integer(inputOptions.create.height) && inputOptions.create.height > 0 && is$7.integer(inputOptions.create.channels)) {
        inputDescriptor.createWidth = inputOptions.create.width;
        inputDescriptor.createHeight = inputOptions.create.height;
        inputDescriptor.createChannels = inputOptions.create.channels;
        if (is$7.defined(inputOptions.create.noise)) {
          if (!is$7.object(inputOptions.create.noise)) {
            throw new Error("Expected noise to be an object");
          }
          if (!is$7.inArray(inputOptions.create.noise.type, ["gaussian"])) {
            throw new Error("Only gaussian noise is supported at the moment");
          }
          if (!is$7.inRange(inputOptions.create.channels, 1, 4)) {
            throw is$7.invalidParameterError("create.channels", "number between 1 and 4", inputOptions.create.channels);
          }
          inputDescriptor.createNoiseType = inputOptions.create.noise.type;
          if (is$7.number(inputOptions.create.noise.mean) && is$7.inRange(inputOptions.create.noise.mean, 0, 1e4)) {
            inputDescriptor.createNoiseMean = inputOptions.create.noise.mean;
          } else {
            throw is$7.invalidParameterError("create.noise.mean", "number between 0 and 10000", inputOptions.create.noise.mean);
          }
          if (is$7.number(inputOptions.create.noise.sigma) && is$7.inRange(inputOptions.create.noise.sigma, 0, 1e4)) {
            inputDescriptor.createNoiseSigma = inputOptions.create.noise.sigma;
          } else {
            throw is$7.invalidParameterError("create.noise.sigma", "number between 0 and 10000", inputOptions.create.noise.sigma);
          }
        } else if (is$7.defined(inputOptions.create.background)) {
          if (!is$7.inRange(inputOptions.create.channels, 3, 4)) {
            throw is$7.invalidParameterError("create.channels", "number between 3 and 4", inputOptions.create.channels);
          }
          const background = color$2(inputOptions.create.background);
          inputDescriptor.createBackground = [
            background.red(),
            background.green(),
            background.blue(),
            Math.round(background.alpha() * 255)
          ];
        } else {
          throw new Error("Expected valid noise or background to create a new input image");
        }
        delete inputDescriptor.buffer;
      } else {
        throw new Error("Expected valid width, height and channels to create a new input image");
      }
    }
    if (is$7.defined(inputOptions.text)) {
      if (is$7.object(inputOptions.text) && is$7.string(inputOptions.text.text)) {
        inputDescriptor.textValue = inputOptions.text.text;
        if (is$7.defined(inputOptions.text.height) && is$7.defined(inputOptions.text.dpi)) {
          throw new Error("Expected only one of dpi or height");
        }
        if (is$7.defined(inputOptions.text.font)) {
          if (is$7.string(inputOptions.text.font)) {
            inputDescriptor.textFont = inputOptions.text.font;
          } else {
            throw is$7.invalidParameterError("text.font", "string", inputOptions.text.font);
          }
        }
        if (is$7.defined(inputOptions.text.fontfile)) {
          if (is$7.string(inputOptions.text.fontfile)) {
            inputDescriptor.textFontfile = inputOptions.text.fontfile;
          } else {
            throw is$7.invalidParameterError("text.fontfile", "string", inputOptions.text.fontfile);
          }
        }
        if (is$7.defined(inputOptions.text.width)) {
          if (is$7.number(inputOptions.text.width)) {
            inputDescriptor.textWidth = inputOptions.text.width;
          } else {
            throw is$7.invalidParameterError("text.textWidth", "number", inputOptions.text.width);
          }
        }
        if (is$7.defined(inputOptions.text.height)) {
          if (is$7.number(inputOptions.text.height)) {
            inputDescriptor.textHeight = inputOptions.text.height;
          } else {
            throw is$7.invalidParameterError("text.height", "number", inputOptions.text.height);
          }
        }
        if (is$7.defined(inputOptions.text.align)) {
          if (is$7.string(inputOptions.text.align) && is$7.string(this.constructor.align[inputOptions.text.align])) {
            inputDescriptor.textAlign = this.constructor.align[inputOptions.text.align];
          } else {
            throw is$7.invalidParameterError("text.align", "valid alignment", inputOptions.text.align);
          }
        }
        if (is$7.defined(inputOptions.text.justify)) {
          if (is$7.bool(inputOptions.text.justify)) {
            inputDescriptor.textJustify = inputOptions.text.justify;
          } else {
            throw is$7.invalidParameterError("text.justify", "boolean", inputOptions.text.justify);
          }
        }
        if (is$7.defined(inputOptions.text.dpi)) {
          if (is$7.number(inputOptions.text.dpi) && is$7.inRange(inputOptions.text.dpi, 1, 1e5)) {
            inputDescriptor.textDpi = inputOptions.text.dpi;
          } else {
            throw is$7.invalidParameterError("text.dpi", "number between 1 and 100000", inputOptions.text.dpi);
          }
        }
        if (is$7.defined(inputOptions.text.rgba)) {
          if (is$7.bool(inputOptions.text.rgba)) {
            inputDescriptor.textRgba = inputOptions.text.rgba;
          } else {
            throw is$7.invalidParameterError("text.rgba", "bool", inputOptions.text.rgba);
          }
        }
        if (is$7.defined(inputOptions.text.spacing)) {
          if (is$7.number(inputOptions.text.spacing)) {
            inputDescriptor.textSpacing = inputOptions.text.spacing;
          } else {
            throw is$7.invalidParameterError("text.spacing", "number", inputOptions.text.spacing);
          }
        }
        if (is$7.defined(inputOptions.text.wrap)) {
          if (is$7.string(inputOptions.text.wrap) && is$7.inArray(inputOptions.text.wrap, ["word", "char", "wordChar", "none"])) {
            inputDescriptor.textWrap = inputOptions.text.wrap;
          } else {
            throw is$7.invalidParameterError("text.wrap", "one of: word, char, wordChar, none", inputOptions.text.wrap);
          }
        }
        delete inputDescriptor.buffer;
      } else {
        throw new Error("Expected a valid string to create an image with text.");
      }
    }
  } else if (is$7.defined(inputOptions)) {
    throw new Error("Invalid input options " + inputOptions);
  }
  return inputDescriptor;
}
function _write(chunk, encoding, callback) {
  if (Array.isArray(this.options.input.buffer)) {
    if (is$7.buffer(chunk)) {
      if (this.options.input.buffer.length === 0) {
        this.on("finish", () => {
          this.streamInFinished = true;
        });
      }
      this.options.input.buffer.push(chunk);
      callback();
    } else {
      callback(new Error("Non-Buffer data on Writable Stream"));
    }
  } else {
    callback(new Error("Unexpected data on Writable Stream"));
  }
}
function _flattenBufferIn() {
  if (this._isStreamInput()) {
    this.options.input.buffer = Buffer.concat(this.options.input.buffer);
  }
}
function _isStreamInput() {
  return Array.isArray(this.options.input.buffer);
}
function metadata(callback) {
  if (is$7.fn(callback)) {
    if (this._isStreamInput()) {
      this.on("finish", () => {
        this._flattenBufferIn();
        sharp$2.metadata(this.options, callback);
      });
    } else {
      sharp$2.metadata(this.options, callback);
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        const finished = () => {
          this._flattenBufferIn();
          sharp$2.metadata(this.options, (err, metadata2) => {
            if (err) {
              reject(err);
            } else {
              resolve(metadata2);
            }
          });
        };
        if (this.writableFinished) {
          finished();
        } else {
          this.once("finish", finished);
        }
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp$2.metadata(this.options, (err, metadata2) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata2);
          }
        });
      });
    }
  }
}
function stats(callback) {
  if (is$7.fn(callback)) {
    if (this._isStreamInput()) {
      this.on("finish", () => {
        this._flattenBufferIn();
        sharp$2.stats(this.options, callback);
      });
    } else {
      sharp$2.stats(this.options, callback);
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this.on("finish", function() {
          this._flattenBufferIn();
          sharp$2.stats(this.options, (err, stats2) => {
            if (err) {
              reject(err);
            } else {
              resolve(stats2);
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp$2.stats(this.options, (err, stats2) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats2);
          }
        });
      });
    }
  }
}
var input = function(Sharp2) {
  Object.assign(Sharp2.prototype, {
    // Private
    _inputOptionsFromObject,
    _createInputDescriptor,
    _write,
    _flattenBufferIn,
    _isStreamInput,
    // Public
    metadata,
    stats
  });
  Sharp2.align = align;
};
const is$6 = is$9;
const gravity = {
  center: 0,
  centre: 0,
  north: 1,
  east: 2,
  south: 3,
  west: 4,
  northeast: 5,
  southeast: 6,
  southwest: 7,
  northwest: 8
};
const position = {
  top: 1,
  right: 2,
  bottom: 3,
  left: 4,
  "right top": 5,
  "right bottom": 6,
  "left bottom": 7,
  "left top": 8
};
const extendWith = {
  background: "background",
  copy: "copy",
  repeat: "repeat",
  mirror: "mirror"
};
const strategy = {
  entropy: 16,
  attention: 17
};
const kernel = {
  nearest: "nearest",
  cubic: "cubic",
  mitchell: "mitchell",
  lanczos2: "lanczos2",
  lanczos3: "lanczos3"
};
const fit = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
  inside: "inside",
  outside: "outside"
};
const mapFitToCanvas = {
  contain: "embed",
  cover: "crop",
  fill: "ignore_aspect",
  inside: "max",
  outside: "min"
};
function isRotationExpected(options) {
  return options.angle % 360 !== 0 || options.useExifOrientation === true || options.rotationAngle !== 0;
}
function isResizeExpected(options) {
  return options.width !== -1 || options.height !== -1;
}
function resize(widthOrOptions, height, options) {
  if (isResizeExpected(this.options)) {
    this.options.debuglog("ignoring previous resize options");
  }
  if (is$6.defined(widthOrOptions)) {
    if (is$6.object(widthOrOptions) && !is$6.defined(options)) {
      options = widthOrOptions;
    } else if (is$6.integer(widthOrOptions) && widthOrOptions > 0) {
      this.options.width = widthOrOptions;
    } else {
      throw is$6.invalidParameterError("width", "positive integer", widthOrOptions);
    }
  } else {
    this.options.width = -1;
  }
  if (is$6.defined(height)) {
    if (is$6.integer(height) && height > 0) {
      this.options.height = height;
    } else {
      throw is$6.invalidParameterError("height", "positive integer", height);
    }
  } else {
    this.options.height = -1;
  }
  if (is$6.object(options)) {
    if (is$6.defined(options.width)) {
      if (is$6.integer(options.width) && options.width > 0) {
        this.options.width = options.width;
      } else {
        throw is$6.invalidParameterError("width", "positive integer", options.width);
      }
    }
    if (is$6.defined(options.height)) {
      if (is$6.integer(options.height) && options.height > 0) {
        this.options.height = options.height;
      } else {
        throw is$6.invalidParameterError("height", "positive integer", options.height);
      }
    }
    if (is$6.defined(options.fit)) {
      const canvas = mapFitToCanvas[options.fit];
      if (is$6.string(canvas)) {
        this.options.canvas = canvas;
      } else {
        throw is$6.invalidParameterError("fit", "valid fit", options.fit);
      }
    }
    if (is$6.defined(options.position)) {
      const pos = is$6.integer(options.position) ? options.position : strategy[options.position] || position[options.position] || gravity[options.position];
      if (is$6.integer(pos) && (is$6.inRange(pos, 0, 8) || is$6.inRange(pos, 16, 17))) {
        this.options.position = pos;
      } else {
        throw is$6.invalidParameterError("position", "valid position/gravity/strategy", options.position);
      }
    }
    this._setBackgroundColourOption("resizeBackground", options.background);
    if (is$6.defined(options.kernel)) {
      if (is$6.string(kernel[options.kernel])) {
        this.options.kernel = kernel[options.kernel];
      } else {
        throw is$6.invalidParameterError("kernel", "valid kernel name", options.kernel);
      }
    }
    if (is$6.defined(options.withoutEnlargement)) {
      this._setBooleanOption("withoutEnlargement", options.withoutEnlargement);
    }
    if (is$6.defined(options.withoutReduction)) {
      this._setBooleanOption("withoutReduction", options.withoutReduction);
    }
    if (is$6.defined(options.fastShrinkOnLoad)) {
      this._setBooleanOption("fastShrinkOnLoad", options.fastShrinkOnLoad);
    }
  }
  if (isRotationExpected(this.options) && isResizeExpected(this.options)) {
    this.options.rotateBeforePreExtract = true;
  }
  return this;
}
function extend(extend2) {
  if (is$6.integer(extend2) && extend2 > 0) {
    this.options.extendTop = extend2;
    this.options.extendBottom = extend2;
    this.options.extendLeft = extend2;
    this.options.extendRight = extend2;
  } else if (is$6.object(extend2)) {
    if (is$6.defined(extend2.top)) {
      if (is$6.integer(extend2.top) && extend2.top >= 0) {
        this.options.extendTop = extend2.top;
      } else {
        throw is$6.invalidParameterError("top", "positive integer", extend2.top);
      }
    }
    if (is$6.defined(extend2.bottom)) {
      if (is$6.integer(extend2.bottom) && extend2.bottom >= 0) {
        this.options.extendBottom = extend2.bottom;
      } else {
        throw is$6.invalidParameterError("bottom", "positive integer", extend2.bottom);
      }
    }
    if (is$6.defined(extend2.left)) {
      if (is$6.integer(extend2.left) && extend2.left >= 0) {
        this.options.extendLeft = extend2.left;
      } else {
        throw is$6.invalidParameterError("left", "positive integer", extend2.left);
      }
    }
    if (is$6.defined(extend2.right)) {
      if (is$6.integer(extend2.right) && extend2.right >= 0) {
        this.options.extendRight = extend2.right;
      } else {
        throw is$6.invalidParameterError("right", "positive integer", extend2.right);
      }
    }
    this._setBackgroundColourOption("extendBackground", extend2.background);
    if (is$6.defined(extend2.extendWith)) {
      if (is$6.string(extendWith[extend2.extendWith])) {
        this.options.extendWith = extendWith[extend2.extendWith];
      } else {
        throw is$6.invalidParameterError("extendWith", "one of: background, copy, repeat, mirror", extend2.extendWith);
      }
    }
  } else {
    throw is$6.invalidParameterError("extend", "integer or object", extend2);
  }
  return this;
}
function extract(options) {
  const suffix = isResizeExpected(this.options) || this.options.widthPre !== -1 ? "Post" : "Pre";
  if (this.options[`width${suffix}`] !== -1) {
    this.options.debuglog("ignoring previous extract options");
  }
  ["left", "top", "width", "height"].forEach(function(name) {
    const value = options[name];
    if (is$6.integer(value) && value >= 0) {
      this.options[name + (name === "left" || name === "top" ? "Offset" : "") + suffix] = value;
    } else {
      throw is$6.invalidParameterError(name, "integer", value);
    }
  }, this);
  if (isRotationExpected(this.options) && !isResizeExpected(this.options)) {
    if (this.options.widthPre === -1 || this.options.widthPost === -1) {
      this.options.rotateBeforePreExtract = true;
    }
  }
  return this;
}
function trim(trim2) {
  if (!is$6.defined(trim2)) {
    this.options.trimThreshold = 10;
  } else if (is$6.string(trim2)) {
    this._setBackgroundColourOption("trimBackground", trim2);
    this.options.trimThreshold = 10;
  } else if (is$6.number(trim2)) {
    if (trim2 >= 0) {
      this.options.trimThreshold = trim2;
    } else {
      throw is$6.invalidParameterError("threshold", "positive number", trim2);
    }
  } else if (is$6.object(trim2)) {
    this._setBackgroundColourOption("trimBackground", trim2.background);
    if (!is$6.defined(trim2.threshold)) {
      this.options.trimThreshold = 10;
    } else if (is$6.number(trim2.threshold) && trim2.threshold >= 0) {
      this.options.trimThreshold = trim2.threshold;
    } else {
      throw is$6.invalidParameterError("threshold", "positive number", trim2);
    }
  } else {
    throw is$6.invalidParameterError("trim", "string, number or object", trim2);
  }
  if (isRotationExpected(this.options)) {
    this.options.rotateBeforePreExtract = true;
  }
  return this;
}
var resize_1 = function(Sharp2) {
  Object.assign(Sharp2.prototype, {
    resize,
    extend,
    extract,
    trim
  });
  Sharp2.gravity = gravity;
  Sharp2.strategy = strategy;
  Sharp2.kernel = kernel;
  Sharp2.fit = fit;
  Sharp2.position = position;
};
const is$5 = is$9;
const blend = {
  clear: "clear",
  source: "source",
  over: "over",
  in: "in",
  out: "out",
  atop: "atop",
  dest: "dest",
  "dest-over": "dest-over",
  "dest-in": "dest-in",
  "dest-out": "dest-out",
  "dest-atop": "dest-atop",
  xor: "xor",
  add: "add",
  saturate: "saturate",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
  "colour-dodge": "colour-dodge",
  "color-dodge": "colour-dodge",
  "colour-burn": "colour-burn",
  "color-burn": "colour-burn",
  "hard-light": "hard-light",
  "soft-light": "soft-light",
  difference: "difference",
  exclusion: "exclusion"
};
function composite(images) {
  if (!Array.isArray(images)) {
    throw is$5.invalidParameterError("images to composite", "array", images);
  }
  this.options.composite = images.map((image) => {
    if (!is$5.object(image)) {
      throw is$5.invalidParameterError("image to composite", "object", image);
    }
    const inputOptions = this._inputOptionsFromObject(image);
    const composite2 = {
      input: this._createInputDescriptor(image.input, inputOptions, { allowStream: false }),
      blend: "over",
      tile: false,
      left: 0,
      top: 0,
      hasOffset: false,
      gravity: 0,
      premultiplied: false
    };
    if (is$5.defined(image.blend)) {
      if (is$5.string(blend[image.blend])) {
        composite2.blend = blend[image.blend];
      } else {
        throw is$5.invalidParameterError("blend", "valid blend name", image.blend);
      }
    }
    if (is$5.defined(image.tile)) {
      if (is$5.bool(image.tile)) {
        composite2.tile = image.tile;
      } else {
        throw is$5.invalidParameterError("tile", "boolean", image.tile);
      }
    }
    if (is$5.defined(image.left)) {
      if (is$5.integer(image.left)) {
        composite2.left = image.left;
      } else {
        throw is$5.invalidParameterError("left", "integer", image.left);
      }
    }
    if (is$5.defined(image.top)) {
      if (is$5.integer(image.top)) {
        composite2.top = image.top;
      } else {
        throw is$5.invalidParameterError("top", "integer", image.top);
      }
    }
    if (is$5.defined(image.top) !== is$5.defined(image.left)) {
      throw new Error("Expected both left and top to be set");
    } else {
      composite2.hasOffset = is$5.integer(image.top) && is$5.integer(image.left);
    }
    if (is$5.defined(image.gravity)) {
      if (is$5.integer(image.gravity) && is$5.inRange(image.gravity, 0, 8)) {
        composite2.gravity = image.gravity;
      } else if (is$5.string(image.gravity) && is$5.integer(this.constructor.gravity[image.gravity])) {
        composite2.gravity = this.constructor.gravity[image.gravity];
      } else {
        throw is$5.invalidParameterError("gravity", "valid gravity", image.gravity);
      }
    }
    if (is$5.defined(image.premultiplied)) {
      if (is$5.bool(image.premultiplied)) {
        composite2.premultiplied = image.premultiplied;
      } else {
        throw is$5.invalidParameterError("premultiplied", "boolean", image.premultiplied);
      }
    }
    return composite2;
  });
  return this;
}
var composite_1 = function(Sharp2) {
  Sharp2.prototype.composite = composite;
  Sharp2.blend = blend;
};
const color$1 = color$3;
const is$4 = is$9;
function rotate(angle, options) {
  if (this.options.useExifOrientation || this.options.angle || this.options.rotationAngle) {
    this.options.debuglog("ignoring previous rotate options");
  }
  if (!is$4.defined(angle)) {
    this.options.useExifOrientation = true;
  } else if (is$4.integer(angle) && !(angle % 90)) {
    this.options.angle = angle;
  } else if (is$4.number(angle)) {
    this.options.rotationAngle = angle;
    if (is$4.object(options) && options.background) {
      const backgroundColour = color$1(options.background);
      this.options.rotationBackground = [
        backgroundColour.red(),
        backgroundColour.green(),
        backgroundColour.blue(),
        Math.round(backgroundColour.alpha() * 255)
      ];
    }
  } else {
    throw is$4.invalidParameterError("angle", "numeric", angle);
  }
  return this;
}
function flip(flip2) {
  this.options.flip = is$4.bool(flip2) ? flip2 : true;
  return this;
}
function flop(flop2) {
  this.options.flop = is$4.bool(flop2) ? flop2 : true;
  return this;
}
function affine(matrix, options) {
  const flatMatrix = [].concat(...matrix);
  if (flatMatrix.length === 4 && flatMatrix.every(is$4.number)) {
    this.options.affineMatrix = flatMatrix;
  } else {
    throw is$4.invalidParameterError("matrix", "1x4 or 2x2 array", matrix);
  }
  if (is$4.defined(options)) {
    if (is$4.object(options)) {
      this._setBackgroundColourOption("affineBackground", options.background);
      if (is$4.defined(options.idx)) {
        if (is$4.number(options.idx)) {
          this.options.affineIdx = options.idx;
        } else {
          throw is$4.invalidParameterError("options.idx", "number", options.idx);
        }
      }
      if (is$4.defined(options.idy)) {
        if (is$4.number(options.idy)) {
          this.options.affineIdy = options.idy;
        } else {
          throw is$4.invalidParameterError("options.idy", "number", options.idy);
        }
      }
      if (is$4.defined(options.odx)) {
        if (is$4.number(options.odx)) {
          this.options.affineOdx = options.odx;
        } else {
          throw is$4.invalidParameterError("options.odx", "number", options.odx);
        }
      }
      if (is$4.defined(options.ody)) {
        if (is$4.number(options.ody)) {
          this.options.affineOdy = options.ody;
        } else {
          throw is$4.invalidParameterError("options.ody", "number", options.ody);
        }
      }
      if (is$4.defined(options.interpolator)) {
        if (is$4.inArray(options.interpolator, Object.values(this.constructor.interpolators))) {
          this.options.affineInterpolator = options.interpolator;
        } else {
          throw is$4.invalidParameterError("options.interpolator", "valid interpolator name", options.interpolator);
        }
      }
    } else {
      throw is$4.invalidParameterError("options", "object", options);
    }
  }
  return this;
}
function sharpen(options, flat, jagged) {
  if (!is$4.defined(options)) {
    this.options.sharpenSigma = -1;
  } else if (is$4.bool(options)) {
    this.options.sharpenSigma = options ? -1 : 0;
  } else if (is$4.number(options) && is$4.inRange(options, 0.01, 1e4)) {
    this.options.sharpenSigma = options;
    if (is$4.defined(flat)) {
      if (is$4.number(flat) && is$4.inRange(flat, 0, 1e4)) {
        this.options.sharpenM1 = flat;
      } else {
        throw is$4.invalidParameterError("flat", "number between 0 and 10000", flat);
      }
    }
    if (is$4.defined(jagged)) {
      if (is$4.number(jagged) && is$4.inRange(jagged, 0, 1e4)) {
        this.options.sharpenM2 = jagged;
      } else {
        throw is$4.invalidParameterError("jagged", "number between 0 and 10000", jagged);
      }
    }
  } else if (is$4.plainObject(options)) {
    if (is$4.number(options.sigma) && is$4.inRange(options.sigma, 1e-6, 10)) {
      this.options.sharpenSigma = options.sigma;
    } else {
      throw is$4.invalidParameterError("options.sigma", "number between 0.000001 and 10", options.sigma);
    }
    if (is$4.defined(options.m1)) {
      if (is$4.number(options.m1) && is$4.inRange(options.m1, 0, 1e6)) {
        this.options.sharpenM1 = options.m1;
      } else {
        throw is$4.invalidParameterError("options.m1", "number between 0 and 1000000", options.m1);
      }
    }
    if (is$4.defined(options.m2)) {
      if (is$4.number(options.m2) && is$4.inRange(options.m2, 0, 1e6)) {
        this.options.sharpenM2 = options.m2;
      } else {
        throw is$4.invalidParameterError("options.m2", "number between 0 and 1000000", options.m2);
      }
    }
    if (is$4.defined(options.x1)) {
      if (is$4.number(options.x1) && is$4.inRange(options.x1, 0, 1e6)) {
        this.options.sharpenX1 = options.x1;
      } else {
        throw is$4.invalidParameterError("options.x1", "number between 0 and 1000000", options.x1);
      }
    }
    if (is$4.defined(options.y2)) {
      if (is$4.number(options.y2) && is$4.inRange(options.y2, 0, 1e6)) {
        this.options.sharpenY2 = options.y2;
      } else {
        throw is$4.invalidParameterError("options.y2", "number between 0 and 1000000", options.y2);
      }
    }
    if (is$4.defined(options.y3)) {
      if (is$4.number(options.y3) && is$4.inRange(options.y3, 0, 1e6)) {
        this.options.sharpenY3 = options.y3;
      } else {
        throw is$4.invalidParameterError("options.y3", "number between 0 and 1000000", options.y3);
      }
    }
  } else {
    throw is$4.invalidParameterError("sigma", "number between 0.01 and 10000", options);
  }
  return this;
}
function median(size) {
  if (!is$4.defined(size)) {
    this.options.medianSize = 3;
  } else if (is$4.integer(size) && is$4.inRange(size, 1, 1e3)) {
    this.options.medianSize = size;
  } else {
    throw is$4.invalidParameterError("size", "integer between 1 and 1000", size);
  }
  return this;
}
function blur(sigma) {
  if (!is$4.defined(sigma)) {
    this.options.blurSigma = -1;
  } else if (is$4.bool(sigma)) {
    this.options.blurSigma = sigma ? -1 : 0;
  } else if (is$4.number(sigma) && is$4.inRange(sigma, 0.3, 1e3)) {
    this.options.blurSigma = sigma;
  } else {
    throw is$4.invalidParameterError("sigma", "number between 0.3 and 1000", sigma);
  }
  return this;
}
function flatten(options) {
  this.options.flatten = is$4.bool(options) ? options : true;
  if (is$4.object(options)) {
    this._setBackgroundColourOption("flattenBackground", options.background);
  }
  return this;
}
function unflatten() {
  this.options.unflatten = true;
  return this;
}
function gamma(gamma2, gammaOut) {
  if (!is$4.defined(gamma2)) {
    this.options.gamma = 2.2;
  } else if (is$4.number(gamma2) && is$4.inRange(gamma2, 1, 3)) {
    this.options.gamma = gamma2;
  } else {
    throw is$4.invalidParameterError("gamma", "number between 1.0 and 3.0", gamma2);
  }
  if (!is$4.defined(gammaOut)) {
    this.options.gammaOut = this.options.gamma;
  } else if (is$4.number(gammaOut) && is$4.inRange(gammaOut, 1, 3)) {
    this.options.gammaOut = gammaOut;
  } else {
    throw is$4.invalidParameterError("gammaOut", "number between 1.0 and 3.0", gammaOut);
  }
  return this;
}
function negate(options) {
  this.options.negate = is$4.bool(options) ? options : true;
  if (is$4.plainObject(options) && "alpha" in options) {
    if (!is$4.bool(options.alpha)) {
      throw is$4.invalidParameterError("alpha", "should be boolean value", options.alpha);
    } else {
      this.options.negateAlpha = options.alpha;
    }
  }
  return this;
}
function normalise(options) {
  if (is$4.plainObject(options)) {
    if (is$4.defined(options.lower)) {
      if (is$4.number(options.lower) && is$4.inRange(options.lower, 0, 99)) {
        this.options.normaliseLower = options.lower;
      } else {
        throw is$4.invalidParameterError("lower", "number between 0 and 99", options.lower);
      }
    }
    if (is$4.defined(options.upper)) {
      if (is$4.number(options.upper) && is$4.inRange(options.upper, 1, 100)) {
        this.options.normaliseUpper = options.upper;
      } else {
        throw is$4.invalidParameterError("upper", "number between 1 and 100", options.upper);
      }
    }
  }
  if (this.options.normaliseLower >= this.options.normaliseUpper) {
    throw is$4.invalidParameterError(
      "range",
      "lower to be less than upper",
      `${this.options.normaliseLower} >= ${this.options.normaliseUpper}`
    );
  }
  this.options.normalise = true;
  return this;
}
function normalize(options) {
  return this.normalise(options);
}
function clahe(options) {
  if (is$4.plainObject(options)) {
    if (is$4.integer(options.width) && options.width > 0) {
      this.options.claheWidth = options.width;
    } else {
      throw is$4.invalidParameterError("width", "integer greater than zero", options.width);
    }
    if (is$4.integer(options.height) && options.height > 0) {
      this.options.claheHeight = options.height;
    } else {
      throw is$4.invalidParameterError("height", "integer greater than zero", options.height);
    }
    if (is$4.defined(options.maxSlope)) {
      if (is$4.integer(options.maxSlope) && is$4.inRange(options.maxSlope, 0, 100)) {
        this.options.claheMaxSlope = options.maxSlope;
      } else {
        throw is$4.invalidParameterError("maxSlope", "integer between 0 and 100", options.maxSlope);
      }
    }
  } else {
    throw is$4.invalidParameterError("options", "plain object", options);
  }
  return this;
}
function convolve(kernel2) {
  if (!is$4.object(kernel2) || !Array.isArray(kernel2.kernel) || !is$4.integer(kernel2.width) || !is$4.integer(kernel2.height) || !is$4.inRange(kernel2.width, 3, 1001) || !is$4.inRange(kernel2.height, 3, 1001) || kernel2.height * kernel2.width !== kernel2.kernel.length) {
    throw new Error("Invalid convolution kernel");
  }
  if (!is$4.integer(kernel2.scale)) {
    kernel2.scale = kernel2.kernel.reduce(function(a, b) {
      return a + b;
    }, 0);
  }
  if (kernel2.scale < 1) {
    kernel2.scale = 1;
  }
  if (!is$4.integer(kernel2.offset)) {
    kernel2.offset = 0;
  }
  this.options.convKernel = kernel2;
  return this;
}
function threshold(threshold2, options) {
  if (!is$4.defined(threshold2)) {
    this.options.threshold = 128;
  } else if (is$4.bool(threshold2)) {
    this.options.threshold = threshold2 ? 128 : 0;
  } else if (is$4.integer(threshold2) && is$4.inRange(threshold2, 0, 255)) {
    this.options.threshold = threshold2;
  } else {
    throw is$4.invalidParameterError("threshold", "integer between 0 and 255", threshold2);
  }
  if (!is$4.object(options) || options.greyscale === true || options.grayscale === true) {
    this.options.thresholdGrayscale = true;
  } else {
    this.options.thresholdGrayscale = false;
  }
  return this;
}
function boolean(operand, operator, options) {
  this.options.boolean = this._createInputDescriptor(operand, options);
  if (is$4.string(operator) && is$4.inArray(operator, ["and", "or", "eor"])) {
    this.options.booleanOp = operator;
  } else {
    throw is$4.invalidParameterError("operator", "one of: and, or, eor", operator);
  }
  return this;
}
function linear(a, b) {
  if (!is$4.defined(a) && is$4.number(b)) {
    a = 1;
  } else if (is$4.number(a) && !is$4.defined(b)) {
    b = 0;
  }
  if (!is$4.defined(a)) {
    this.options.linearA = [];
  } else if (is$4.number(a)) {
    this.options.linearA = [a];
  } else if (Array.isArray(a) && a.length && a.every(is$4.number)) {
    this.options.linearA = a;
  } else {
    throw is$4.invalidParameterError("a", "number or array of numbers", a);
  }
  if (!is$4.defined(b)) {
    this.options.linearB = [];
  } else if (is$4.number(b)) {
    this.options.linearB = [b];
  } else if (Array.isArray(b) && b.length && b.every(is$4.number)) {
    this.options.linearB = b;
  } else {
    throw is$4.invalidParameterError("b", "number or array of numbers", b);
  }
  if (this.options.linearA.length !== this.options.linearB.length) {
    throw new Error("Expected a and b to be arrays of the same length");
  }
  return this;
}
function recomb(inputMatrix) {
  if (!Array.isArray(inputMatrix) || inputMatrix.length !== 3 || inputMatrix[0].length !== 3 || inputMatrix[1].length !== 3 || inputMatrix[2].length !== 3) {
    throw new Error("Invalid recombination matrix");
  }
  this.options.recombMatrix = [
    inputMatrix[0][0],
    inputMatrix[0][1],
    inputMatrix[0][2],
    inputMatrix[1][0],
    inputMatrix[1][1],
    inputMatrix[1][2],
    inputMatrix[2][0],
    inputMatrix[2][1],
    inputMatrix[2][2]
  ].map(Number);
  return this;
}
function modulate(options) {
  if (!is$4.plainObject(options)) {
    throw is$4.invalidParameterError("options", "plain object", options);
  }
  if ("brightness" in options) {
    if (is$4.number(options.brightness) && options.brightness >= 0) {
      this.options.brightness = options.brightness;
    } else {
      throw is$4.invalidParameterError("brightness", "number above zero", options.brightness);
    }
  }
  if ("saturation" in options) {
    if (is$4.number(options.saturation) && options.saturation >= 0) {
      this.options.saturation = options.saturation;
    } else {
      throw is$4.invalidParameterError("saturation", "number above zero", options.saturation);
    }
  }
  if ("hue" in options) {
    if (is$4.integer(options.hue)) {
      this.options.hue = options.hue % 360;
    } else {
      throw is$4.invalidParameterError("hue", "number", options.hue);
    }
  }
  if ("lightness" in options) {
    if (is$4.number(options.lightness)) {
      this.options.lightness = options.lightness;
    } else {
      throw is$4.invalidParameterError("lightness", "number", options.lightness);
    }
  }
  return this;
}
var operation = function(Sharp2) {
  Object.assign(Sharp2.prototype, {
    rotate,
    flip,
    flop,
    affine,
    sharpen,
    median,
    blur,
    flatten,
    unflatten,
    gamma,
    negate,
    normalise,
    normalize,
    clahe,
    convolve,
    threshold,
    boolean,
    linear,
    recomb,
    modulate
  });
};
const color = color$3;
const is$3 = is$9;
const colourspace = {
  multiband: "multiband",
  "b-w": "b-w",
  bw: "b-w",
  cmyk: "cmyk",
  srgb: "srgb"
};
function tint(rgb) {
  const colour2 = color(rgb);
  this.options.tintA = colour2.a();
  this.options.tintB = colour2.b();
  return this;
}
function greyscale(greyscale2) {
  this.options.greyscale = is$3.bool(greyscale2) ? greyscale2 : true;
  return this;
}
function grayscale(grayscale2) {
  return this.greyscale(grayscale2);
}
function pipelineColourspace(colourspace2) {
  if (!is$3.string(colourspace2)) {
    throw is$3.invalidParameterError("colourspace", "string", colourspace2);
  }
  this.options.colourspaceInput = colourspace2;
  return this;
}
function pipelineColorspace(colorspace) {
  return this.pipelineColourspace(colorspace);
}
function toColourspace(colourspace2) {
  if (!is$3.string(colourspace2)) {
    throw is$3.invalidParameterError("colourspace", "string", colourspace2);
  }
  this.options.colourspace = colourspace2;
  return this;
}
function toColorspace(colorspace) {
  return this.toColourspace(colorspace);
}
function _setBackgroundColourOption(key, value) {
  if (is$3.defined(value)) {
    if (is$3.object(value) || is$3.string(value)) {
      const colour2 = color(value);
      this.options[key] = [
        colour2.red(),
        colour2.green(),
        colour2.blue(),
        Math.round(colour2.alpha() * 255)
      ];
    } else {
      throw is$3.invalidParameterError("background", "object or string", value);
    }
  }
}
var colour = function(Sharp2) {
  Object.assign(Sharp2.prototype, {
    // Public
    tint,
    greyscale,
    grayscale,
    pipelineColourspace,
    pipelineColorspace,
    toColourspace,
    toColorspace,
    // Private
    _setBackgroundColourOption
  });
  Sharp2.colourspace = colourspace;
  Sharp2.colorspace = colourspace;
};
const is$2 = is$9;
const bool = {
  and: "and",
  or: "or",
  eor: "eor"
};
function removeAlpha() {
  this.options.removeAlpha = true;
  return this;
}
function ensureAlpha(alpha) {
  if (is$2.defined(alpha)) {
    if (is$2.number(alpha) && is$2.inRange(alpha, 0, 1)) {
      this.options.ensureAlpha = alpha;
    } else {
      throw is$2.invalidParameterError("alpha", "number between 0 and 1", alpha);
    }
  } else {
    this.options.ensureAlpha = 1;
  }
  return this;
}
function extractChannel(channel2) {
  const channelMap = { red: 0, green: 1, blue: 2, alpha: 3 };
  if (Object.keys(channelMap).includes(channel2)) {
    channel2 = channelMap[channel2];
  }
  if (is$2.integer(channel2) && is$2.inRange(channel2, 0, 4)) {
    this.options.extractChannel = channel2;
  } else {
    throw is$2.invalidParameterError("channel", "integer or one of: red, green, blue, alpha", channel2);
  }
  return this;
}
function joinChannel(images, options) {
  if (Array.isArray(images)) {
    images.forEach(function(image) {
      this.options.joinChannelIn.push(this._createInputDescriptor(image, options));
    }, this);
  } else {
    this.options.joinChannelIn.push(this._createInputDescriptor(images, options));
  }
  return this;
}
function bandbool(boolOp) {
  if (is$2.string(boolOp) && is$2.inArray(boolOp, ["and", "or", "eor"])) {
    this.options.bandBoolOp = boolOp;
  } else {
    throw is$2.invalidParameterError("boolOp", "one of: and, or, eor", boolOp);
  }
  return this;
}
var channel = function(Sharp2) {
  Object.assign(Sharp2.prototype, {
    // Public instance functions
    removeAlpha,
    ensureAlpha,
    extractChannel,
    joinChannel,
    bandbool
  });
  Sharp2.bool = bool;
};
const path$1 = require$$2;
const is$1 = is$9;
const sharp$1 = sharpExports;
const formats = /* @__PURE__ */ new Map([
  ["heic", "heif"],
  ["heif", "heif"],
  ["avif", "avif"],
  ["jpeg", "jpeg"],
  ["jpg", "jpeg"],
  ["jpe", "jpeg"],
  ["tile", "tile"],
  ["dz", "tile"],
  ["png", "png"],
  ["raw", "raw"],
  ["tiff", "tiff"],
  ["tif", "tiff"],
  ["webp", "webp"],
  ["gif", "gif"],
  ["jp2", "jp2"],
  ["jpx", "jp2"],
  ["j2k", "jp2"],
  ["j2c", "jp2"],
  ["jxl", "jxl"]
]);
const jp2Regex = /\.(jp[2x]|j2[kc])$/i;
const errJp2Save = () => new Error("JP2 output requires libvips with support for OpenJPEG");
const bitdepthFromColourCount = (colours) => 1 << 31 - Math.clz32(Math.ceil(Math.log2(colours)));
function toFile(fileOut, callback) {
  let err;
  if (!is$1.string(fileOut)) {
    err = new Error("Missing output file path");
  } else if (is$1.string(this.options.input.file) && path$1.resolve(this.options.input.file) === path$1.resolve(fileOut)) {
    err = new Error("Cannot use same file for input and output");
  } else if (jp2Regex.test(path$1.extname(fileOut)) && !this.constructor.format.jp2k.output.file) {
    err = errJp2Save();
  }
  if (err) {
    if (is$1.fn(callback)) {
      callback(err);
    } else {
      return Promise.reject(err);
    }
  } else {
    this.options.fileOut = fileOut;
    return this._pipeline(callback);
  }
  return this;
}
function toBuffer(options, callback) {
  if (is$1.object(options)) {
    this._setBooleanOption("resolveWithObject", options.resolveWithObject);
  } else if (this.options.resolveWithObject) {
    this.options.resolveWithObject = false;
  }
  this.options.fileOut = "";
  return this._pipeline(is$1.fn(options) ? options : callback);
}
function withMetadata(options) {
  this.options.withMetadata = is$1.bool(options) ? options : true;
  if (is$1.object(options)) {
    if (is$1.defined(options.orientation)) {
      if (is$1.integer(options.orientation) && is$1.inRange(options.orientation, 1, 8)) {
        this.options.withMetadataOrientation = options.orientation;
      } else {
        throw is$1.invalidParameterError("orientation", "integer between 1 and 8", options.orientation);
      }
    }
    if (is$1.defined(options.density)) {
      if (is$1.number(options.density) && options.density > 0) {
        this.options.withMetadataDensity = options.density;
      } else {
        throw is$1.invalidParameterError("density", "positive number", options.density);
      }
    }
    if (is$1.defined(options.icc)) {
      if (is$1.string(options.icc)) {
        this.options.withMetadataIcc = options.icc;
      } else {
        throw is$1.invalidParameterError("icc", "string filesystem path to ICC profile", options.icc);
      }
    }
    if (is$1.defined(options.exif)) {
      if (is$1.object(options.exif)) {
        for (const [ifd, entries] of Object.entries(options.exif)) {
          if (is$1.object(entries)) {
            for (const [k, v] of Object.entries(entries)) {
              if (is$1.string(v)) {
                this.options.withMetadataStrs[`exif-${ifd.toLowerCase()}-${k}`] = v;
              } else {
                throw is$1.invalidParameterError(`exif.${ifd}.${k}`, "string", v);
              }
            }
          } else {
            throw is$1.invalidParameterError(`exif.${ifd}`, "object", entries);
          }
        }
      } else {
        throw is$1.invalidParameterError("exif", "object", options.exif);
      }
    }
  }
  return this;
}
function toFormat(format2, options) {
  const actualFormat = formats.get((is$1.object(format2) && is$1.string(format2.id) ? format2.id : format2).toLowerCase());
  if (!actualFormat) {
    throw is$1.invalidParameterError("format", `one of: ${[...formats.keys()].join(", ")}`, format2);
  }
  return this[actualFormat](options);
}
function jpeg(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.quality)) {
      if (is$1.integer(options.quality) && is$1.inRange(options.quality, 1, 100)) {
        this.options.jpegQuality = options.quality;
      } else {
        throw is$1.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is$1.defined(options.progressive)) {
      this._setBooleanOption("jpegProgressive", options.progressive);
    }
    if (is$1.defined(options.chromaSubsampling)) {
      if (is$1.string(options.chromaSubsampling) && is$1.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
        this.options.jpegChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is$1.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
      }
    }
    const optimiseCoding = is$1.bool(options.optimizeCoding) ? options.optimizeCoding : options.optimiseCoding;
    if (is$1.defined(optimiseCoding)) {
      this._setBooleanOption("jpegOptimiseCoding", optimiseCoding);
    }
    if (is$1.defined(options.mozjpeg)) {
      if (is$1.bool(options.mozjpeg)) {
        if (options.mozjpeg) {
          this.options.jpegTrellisQuantisation = true;
          this.options.jpegOvershootDeringing = true;
          this.options.jpegOptimiseScans = true;
          this.options.jpegProgressive = true;
          this.options.jpegQuantisationTable = 3;
        }
      } else {
        throw is$1.invalidParameterError("mozjpeg", "boolean", options.mozjpeg);
      }
    }
    const trellisQuantisation = is$1.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
    if (is$1.defined(trellisQuantisation)) {
      this._setBooleanOption("jpegTrellisQuantisation", trellisQuantisation);
    }
    if (is$1.defined(options.overshootDeringing)) {
      this._setBooleanOption("jpegOvershootDeringing", options.overshootDeringing);
    }
    const optimiseScans = is$1.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
    if (is$1.defined(optimiseScans)) {
      this._setBooleanOption("jpegOptimiseScans", optimiseScans);
      if (optimiseScans) {
        this.options.jpegProgressive = true;
      }
    }
    const quantisationTable = is$1.number(options.quantizationTable) ? options.quantizationTable : options.quantisationTable;
    if (is$1.defined(quantisationTable)) {
      if (is$1.integer(quantisationTable) && is$1.inRange(quantisationTable, 0, 8)) {
        this.options.jpegQuantisationTable = quantisationTable;
      } else {
        throw is$1.invalidParameterError("quantisationTable", "integer between 0 and 8", quantisationTable);
      }
    }
  }
  return this._updateFormatOut("jpeg", options);
}
function png(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.progressive)) {
      this._setBooleanOption("pngProgressive", options.progressive);
    }
    if (is$1.defined(options.compressionLevel)) {
      if (is$1.integer(options.compressionLevel) && is$1.inRange(options.compressionLevel, 0, 9)) {
        this.options.pngCompressionLevel = options.compressionLevel;
      } else {
        throw is$1.invalidParameterError("compressionLevel", "integer between 0 and 9", options.compressionLevel);
      }
    }
    if (is$1.defined(options.adaptiveFiltering)) {
      this._setBooleanOption("pngAdaptiveFiltering", options.adaptiveFiltering);
    }
    const colours = options.colours || options.colors;
    if (is$1.defined(colours)) {
      if (is$1.integer(colours) && is$1.inRange(colours, 2, 256)) {
        this.options.pngBitdepth = bitdepthFromColourCount(colours);
      } else {
        throw is$1.invalidParameterError("colours", "integer between 2 and 256", colours);
      }
    }
    if (is$1.defined(options.palette)) {
      this._setBooleanOption("pngPalette", options.palette);
    } else if ([options.quality, options.effort, options.colours, options.colors, options.dither].some(is$1.defined)) {
      this._setBooleanOption("pngPalette", true);
    }
    if (this.options.pngPalette) {
      if (is$1.defined(options.quality)) {
        if (is$1.integer(options.quality) && is$1.inRange(options.quality, 0, 100)) {
          this.options.pngQuality = options.quality;
        } else {
          throw is$1.invalidParameterError("quality", "integer between 0 and 100", options.quality);
        }
      }
      if (is$1.defined(options.effort)) {
        if (is$1.integer(options.effort) && is$1.inRange(options.effort, 1, 10)) {
          this.options.pngEffort = options.effort;
        } else {
          throw is$1.invalidParameterError("effort", "integer between 1 and 10", options.effort);
        }
      }
      if (is$1.defined(options.dither)) {
        if (is$1.number(options.dither) && is$1.inRange(options.dither, 0, 1)) {
          this.options.pngDither = options.dither;
        } else {
          throw is$1.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
        }
      }
    }
  }
  return this._updateFormatOut("png", options);
}
function webp(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.quality)) {
      if (is$1.integer(options.quality) && is$1.inRange(options.quality, 1, 100)) {
        this.options.webpQuality = options.quality;
      } else {
        throw is$1.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is$1.defined(options.alphaQuality)) {
      if (is$1.integer(options.alphaQuality) && is$1.inRange(options.alphaQuality, 0, 100)) {
        this.options.webpAlphaQuality = options.alphaQuality;
      } else {
        throw is$1.invalidParameterError("alphaQuality", "integer between 0 and 100", options.alphaQuality);
      }
    }
    if (is$1.defined(options.lossless)) {
      this._setBooleanOption("webpLossless", options.lossless);
    }
    if (is$1.defined(options.nearLossless)) {
      this._setBooleanOption("webpNearLossless", options.nearLossless);
    }
    if (is$1.defined(options.smartSubsample)) {
      this._setBooleanOption("webpSmartSubsample", options.smartSubsample);
    }
    if (is$1.defined(options.preset)) {
      if (is$1.string(options.preset) && is$1.inArray(options.preset, ["default", "photo", "picture", "drawing", "icon", "text"])) {
        this.options.webpPreset = options.preset;
      } else {
        throw is$1.invalidParameterError("preset", "one of: default, photo, picture, drawing, icon, text", options.preset);
      }
    }
    if (is$1.defined(options.effort)) {
      if (is$1.integer(options.effort) && is$1.inRange(options.effort, 0, 6)) {
        this.options.webpEffort = options.effort;
      } else {
        throw is$1.invalidParameterError("effort", "integer between 0 and 6", options.effort);
      }
    }
    if (is$1.defined(options.minSize)) {
      this._setBooleanOption("webpMinSize", options.minSize);
    }
    if (is$1.defined(options.mixed)) {
      this._setBooleanOption("webpMixed", options.mixed);
    }
  }
  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut("webp", options);
}
function gif(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.reuse)) {
      this._setBooleanOption("gifReuse", options.reuse);
    }
    if (is$1.defined(options.progressive)) {
      this._setBooleanOption("gifProgressive", options.progressive);
    }
    const colours = options.colours || options.colors;
    if (is$1.defined(colours)) {
      if (is$1.integer(colours) && is$1.inRange(colours, 2, 256)) {
        this.options.gifBitdepth = bitdepthFromColourCount(colours);
      } else {
        throw is$1.invalidParameterError("colours", "integer between 2 and 256", colours);
      }
    }
    if (is$1.defined(options.effort)) {
      if (is$1.number(options.effort) && is$1.inRange(options.effort, 1, 10)) {
        this.options.gifEffort = options.effort;
      } else {
        throw is$1.invalidParameterError("effort", "integer between 1 and 10", options.effort);
      }
    }
    if (is$1.defined(options.dither)) {
      if (is$1.number(options.dither) && is$1.inRange(options.dither, 0, 1)) {
        this.options.gifDither = options.dither;
      } else {
        throw is$1.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
      }
    }
    if (is$1.defined(options.interFrameMaxError)) {
      if (is$1.number(options.interFrameMaxError) && is$1.inRange(options.interFrameMaxError, 0, 32)) {
        this.options.gifInterFrameMaxError = options.interFrameMaxError;
      } else {
        throw is$1.invalidParameterError("interFrameMaxError", "number between 0.0 and 32.0", options.interFrameMaxError);
      }
    }
    if (is$1.defined(options.interPaletteMaxError)) {
      if (is$1.number(options.interPaletteMaxError) && is$1.inRange(options.interPaletteMaxError, 0, 256)) {
        this.options.gifInterPaletteMaxError = options.interPaletteMaxError;
      } else {
        throw is$1.invalidParameterError("interPaletteMaxError", "number between 0.0 and 256.0", options.interPaletteMaxError);
      }
    }
  }
  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut("gif", options);
}
function jp2(options) {
  if (!this.constructor.format.jp2k.output.buffer) {
    throw errJp2Save();
  }
  if (is$1.object(options)) {
    if (is$1.defined(options.quality)) {
      if (is$1.integer(options.quality) && is$1.inRange(options.quality, 1, 100)) {
        this.options.jp2Quality = options.quality;
      } else {
        throw is$1.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is$1.defined(options.lossless)) {
      if (is$1.bool(options.lossless)) {
        this.options.jp2Lossless = options.lossless;
      } else {
        throw is$1.invalidParameterError("lossless", "boolean", options.lossless);
      }
    }
    if (is$1.defined(options.tileWidth)) {
      if (is$1.integer(options.tileWidth) && is$1.inRange(options.tileWidth, 1, 32768)) {
        this.options.jp2TileWidth = options.tileWidth;
      } else {
        throw is$1.invalidParameterError("tileWidth", "integer between 1 and 32768", options.tileWidth);
      }
    }
    if (is$1.defined(options.tileHeight)) {
      if (is$1.integer(options.tileHeight) && is$1.inRange(options.tileHeight, 1, 32768)) {
        this.options.jp2TileHeight = options.tileHeight;
      } else {
        throw is$1.invalidParameterError("tileHeight", "integer between 1 and 32768", options.tileHeight);
      }
    }
    if (is$1.defined(options.chromaSubsampling)) {
      if (is$1.string(options.chromaSubsampling) && is$1.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
        this.options.jp2ChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is$1.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
      }
    }
  }
  return this._updateFormatOut("jp2", options);
}
function trySetAnimationOptions(source, target) {
  if (is$1.object(source) && is$1.defined(source.loop)) {
    if (is$1.integer(source.loop) && is$1.inRange(source.loop, 0, 65535)) {
      target.loop = source.loop;
    } else {
      throw is$1.invalidParameterError("loop", "integer between 0 and 65535", source.loop);
    }
  }
  if (is$1.object(source) && is$1.defined(source.delay)) {
    if (is$1.integer(source.delay) && is$1.inRange(source.delay, 0, 65535)) {
      target.delay = [source.delay];
    } else if (Array.isArray(source.delay) && source.delay.every(is$1.integer) && source.delay.every((v) => is$1.inRange(v, 0, 65535))) {
      target.delay = source.delay;
    } else {
      throw is$1.invalidParameterError("delay", "integer or an array of integers between 0 and 65535", source.delay);
    }
  }
}
function tiff(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.quality)) {
      if (is$1.integer(options.quality) && is$1.inRange(options.quality, 1, 100)) {
        this.options.tiffQuality = options.quality;
      } else {
        throw is$1.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is$1.defined(options.bitdepth)) {
      if (is$1.integer(options.bitdepth) && is$1.inArray(options.bitdepth, [1, 2, 4, 8])) {
        this.options.tiffBitdepth = options.bitdepth;
      } else {
        throw is$1.invalidParameterError("bitdepth", "1, 2, 4 or 8", options.bitdepth);
      }
    }
    if (is$1.defined(options.tile)) {
      this._setBooleanOption("tiffTile", options.tile);
    }
    if (is$1.defined(options.tileWidth)) {
      if (is$1.integer(options.tileWidth) && options.tileWidth > 0) {
        this.options.tiffTileWidth = options.tileWidth;
      } else {
        throw is$1.invalidParameterError("tileWidth", "integer greater than zero", options.tileWidth);
      }
    }
    if (is$1.defined(options.tileHeight)) {
      if (is$1.integer(options.tileHeight) && options.tileHeight > 0) {
        this.options.tiffTileHeight = options.tileHeight;
      } else {
        throw is$1.invalidParameterError("tileHeight", "integer greater than zero", options.tileHeight);
      }
    }
    if (is$1.defined(options.pyramid)) {
      this._setBooleanOption("tiffPyramid", options.pyramid);
    }
    if (is$1.defined(options.xres)) {
      if (is$1.number(options.xres) && options.xres > 0) {
        this.options.tiffXres = options.xres;
      } else {
        throw is$1.invalidParameterError("xres", "number greater than zero", options.xres);
      }
    }
    if (is$1.defined(options.yres)) {
      if (is$1.number(options.yres) && options.yres > 0) {
        this.options.tiffYres = options.yres;
      } else {
        throw is$1.invalidParameterError("yres", "number greater than zero", options.yres);
      }
    }
    if (is$1.defined(options.compression)) {
      if (is$1.string(options.compression) && is$1.inArray(options.compression, ["none", "jpeg", "deflate", "packbits", "ccittfax4", "lzw", "webp", "zstd", "jp2k"])) {
        this.options.tiffCompression = options.compression;
      } else {
        throw is$1.invalidParameterError("compression", "one of: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k", options.compression);
      }
    }
    if (is$1.defined(options.predictor)) {
      if (is$1.string(options.predictor) && is$1.inArray(options.predictor, ["none", "horizontal", "float"])) {
        this.options.tiffPredictor = options.predictor;
      } else {
        throw is$1.invalidParameterError("predictor", "one of: none, horizontal, float", options.predictor);
      }
    }
    if (is$1.defined(options.resolutionUnit)) {
      if (is$1.string(options.resolutionUnit) && is$1.inArray(options.resolutionUnit, ["inch", "cm"])) {
        this.options.tiffResolutionUnit = options.resolutionUnit;
      } else {
        throw is$1.invalidParameterError("resolutionUnit", "one of: inch, cm", options.resolutionUnit);
      }
    }
  }
  return this._updateFormatOut("tiff", options);
}
function avif(options) {
  return this.heif({ ...options, compression: "av1" });
}
function heif(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.quality)) {
      if (is$1.integer(options.quality) && is$1.inRange(options.quality, 1, 100)) {
        this.options.heifQuality = options.quality;
      } else {
        throw is$1.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is$1.defined(options.lossless)) {
      if (is$1.bool(options.lossless)) {
        this.options.heifLossless = options.lossless;
      } else {
        throw is$1.invalidParameterError("lossless", "boolean", options.lossless);
      }
    }
    if (is$1.defined(options.compression)) {
      if (is$1.string(options.compression) && is$1.inArray(options.compression, ["av1", "hevc"])) {
        this.options.heifCompression = options.compression;
      } else {
        throw is$1.invalidParameterError("compression", "one of: av1, hevc", options.compression);
      }
    }
    if (is$1.defined(options.effort)) {
      if (is$1.integer(options.effort) && is$1.inRange(options.effort, 0, 9)) {
        this.options.heifEffort = options.effort;
      } else {
        throw is$1.invalidParameterError("effort", "integer between 0 and 9", options.effort);
      }
    }
    if (is$1.defined(options.chromaSubsampling)) {
      if (is$1.string(options.chromaSubsampling) && is$1.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
        this.options.heifChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is$1.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
      }
    }
  }
  return this._updateFormatOut("heif", options);
}
function jxl(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.quality)) {
      if (is$1.integer(options.quality) && is$1.inRange(options.quality, 1, 100)) {
        this.options.jxlDistance = options.quality >= 30 ? 0.1 + (100 - options.quality) * 0.09 : 53 / 3e3 * options.quality * options.quality - 23 / 20 * options.quality + 25;
      } else {
        throw is$1.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    } else if (is$1.defined(options.distance)) {
      if (is$1.number(options.distance) && is$1.inRange(options.distance, 0, 15)) {
        this.options.jxlDistance = options.distance;
      } else {
        throw is$1.invalidParameterError("distance", "number between 0.0 and 15.0", options.distance);
      }
    }
    if (is$1.defined(options.decodingTier)) {
      if (is$1.integer(options.decodingTier) && is$1.inRange(options.decodingTier, 0, 4)) {
        this.options.jxlDecodingTier = options.decodingTier;
      } else {
        throw is$1.invalidParameterError("decodingTier", "integer between 0 and 4", options.decodingTier);
      }
    }
    if (is$1.defined(options.lossless)) {
      if (is$1.bool(options.lossless)) {
        this.options.jxlLossless = options.lossless;
      } else {
        throw is$1.invalidParameterError("lossless", "boolean", options.lossless);
      }
    }
    if (is$1.defined(options.effort)) {
      if (is$1.integer(options.effort) && is$1.inRange(options.effort, 3, 9)) {
        this.options.jxlEffort = options.effort;
      } else {
        throw is$1.invalidParameterError("effort", "integer between 3 and 9", options.effort);
      }
    }
  }
  return this._updateFormatOut("jxl", options);
}
function raw(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.depth)) {
      if (is$1.string(options.depth) && is$1.inArray(
        options.depth,
        ["char", "uchar", "short", "ushort", "int", "uint", "float", "complex", "double", "dpcomplex"]
      )) {
        this.options.rawDepth = options.depth;
      } else {
        throw is$1.invalidParameterError("depth", "one of: char, uchar, short, ushort, int, uint, float, complex, double, dpcomplex", options.depth);
      }
    }
  }
  return this._updateFormatOut("raw");
}
function tile(options) {
  if (is$1.object(options)) {
    if (is$1.defined(options.size)) {
      if (is$1.integer(options.size) && is$1.inRange(options.size, 1, 8192)) {
        this.options.tileSize = options.size;
      } else {
        throw is$1.invalidParameterError("size", "integer between 1 and 8192", options.size);
      }
    }
    if (is$1.defined(options.overlap)) {
      if (is$1.integer(options.overlap) && is$1.inRange(options.overlap, 0, 8192)) {
        if (options.overlap > this.options.tileSize) {
          throw is$1.invalidParameterError("overlap", `<= size (${this.options.tileSize})`, options.overlap);
        }
        this.options.tileOverlap = options.overlap;
      } else {
        throw is$1.invalidParameterError("overlap", "integer between 0 and 8192", options.overlap);
      }
    }
    if (is$1.defined(options.container)) {
      if (is$1.string(options.container) && is$1.inArray(options.container, ["fs", "zip"])) {
        this.options.tileContainer = options.container;
      } else {
        throw is$1.invalidParameterError("container", "one of: fs, zip", options.container);
      }
    }
    if (is$1.defined(options.layout)) {
      if (is$1.string(options.layout) && is$1.inArray(options.layout, ["dz", "google", "iiif", "iiif3", "zoomify"])) {
        this.options.tileLayout = options.layout;
      } else {
        throw is$1.invalidParameterError("layout", "one of: dz, google, iiif, iiif3, zoomify", options.layout);
      }
    }
    if (is$1.defined(options.angle)) {
      if (is$1.integer(options.angle) && !(options.angle % 90)) {
        this.options.tileAngle = options.angle;
      } else {
        throw is$1.invalidParameterError("angle", "positive/negative multiple of 90", options.angle);
      }
    }
    this._setBackgroundColourOption("tileBackground", options.background);
    if (is$1.defined(options.depth)) {
      if (is$1.string(options.depth) && is$1.inArray(options.depth, ["onepixel", "onetile", "one"])) {
        this.options.tileDepth = options.depth;
      } else {
        throw is$1.invalidParameterError("depth", "one of: onepixel, onetile, one", options.depth);
      }
    }
    if (is$1.defined(options.skipBlanks)) {
      if (is$1.integer(options.skipBlanks) && is$1.inRange(options.skipBlanks, -1, 65535)) {
        this.options.tileSkipBlanks = options.skipBlanks;
      } else {
        throw is$1.invalidParameterError("skipBlanks", "integer between -1 and 255/65535", options.skipBlanks);
      }
    } else if (is$1.defined(options.layout) && options.layout === "google") {
      this.options.tileSkipBlanks = 5;
    }
    const centre = is$1.bool(options.center) ? options.center : options.centre;
    if (is$1.defined(centre)) {
      this._setBooleanOption("tileCentre", centre);
    }
    if (is$1.defined(options.id)) {
      if (is$1.string(options.id)) {
        this.options.tileId = options.id;
      } else {
        throw is$1.invalidParameterError("id", "string", options.id);
      }
    }
    if (is$1.defined(options.basename)) {
      if (is$1.string(options.basename)) {
        this.options.tileBasename = options.basename;
      } else {
        throw is$1.invalidParameterError("basename", "string", options.basename);
      }
    }
  }
  if (is$1.inArray(this.options.formatOut, ["jpeg", "png", "webp"])) {
    this.options.tileFormat = this.options.formatOut;
  } else if (this.options.formatOut !== "input") {
    throw is$1.invalidParameterError("format", "one of: jpeg, png, webp", this.options.formatOut);
  }
  return this._updateFormatOut("dz");
}
function timeout(options) {
  if (!is$1.plainObject(options)) {
    throw is$1.invalidParameterError("options", "object", options);
  }
  if (is$1.integer(options.seconds) && is$1.inRange(options.seconds, 0, 3600)) {
    this.options.timeoutSeconds = options.seconds;
  } else {
    throw is$1.invalidParameterError("seconds", "integer between 0 and 3600", options.seconds);
  }
  return this;
}
function _updateFormatOut(formatOut, options) {
  if (!(is$1.object(options) && options.force === false)) {
    this.options.formatOut = formatOut;
  }
  return this;
}
function _setBooleanOption(key, val) {
  if (is$1.bool(val)) {
    this.options[key] = val;
  } else {
    throw is$1.invalidParameterError(key, "boolean", val);
  }
}
function _read() {
  if (!this.options.streamOut) {
    this.options.streamOut = true;
    this._pipeline();
  }
}
function _pipeline(callback) {
  if (typeof callback === "function") {
    if (this._isStreamInput()) {
      this.on("finish", () => {
        this._flattenBufferIn();
        sharp$1.pipeline(this.options, callback);
      });
    } else {
      sharp$1.pipeline(this.options, callback);
    }
    return this;
  } else if (this.options.streamOut) {
    if (this._isStreamInput()) {
      this.once("finish", () => {
        this._flattenBufferIn();
        sharp$1.pipeline(this.options, (err, data, info) => {
          if (err) {
            this.emit("error", err);
          } else {
            this.emit("info", info);
            this.push(data);
          }
          this.push(null);
          this.on("end", () => this.emit("close"));
        });
      });
      if (this.streamInFinished) {
        this.emit("finish");
      }
    } else {
      sharp$1.pipeline(this.options, (err, data, info) => {
        if (err) {
          this.emit("error", err);
        } else {
          this.emit("info", info);
          this.push(data);
        }
        this.push(null);
        this.on("end", () => this.emit("close"));
      });
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this.once("finish", () => {
          this._flattenBufferIn();
          sharp$1.pipeline(this.options, (err, data, info) => {
            if (err) {
              reject(err);
            } else {
              if (this.options.resolveWithObject) {
                resolve({ data, info });
              } else {
                resolve(data);
              }
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp$1.pipeline(this.options, (err, data, info) => {
          if (err) {
            reject(err);
          } else {
            if (this.options.resolveWithObject) {
              resolve({ data, info });
            } else {
              resolve(data);
            }
          }
        });
      });
    }
  }
}
var output = function(Sharp2) {
  Object.assign(Sharp2.prototype, {
    // Public
    toFile,
    toBuffer,
    withMetadata,
    toFormat,
    jpeg,
    jp2,
    png,
    webp,
    tiff,
    avif,
    heif,
    jxl,
    gif,
    raw,
    tile,
    timeout,
    // Private
    _updateFormatOut,
    _setBooleanOption,
    _read,
    _pipeline
  });
};
const fs = require$$0;
const path = require$$2;
const events = require$$2$1;
const detectLibc = detectLibc$2;
const is = is$9;
const platformAndArch = platform$1();
const sharp = sharpExports;
const format = sharp.format();
format.heif.output.alias = ["avif", "heic"];
format.jpeg.output.alias = ["jpe", "jpg"];
format.tiff.output.alias = ["tif"];
format.jp2k.output.alias = ["j2c", "j2k", "jp2", "jpx"];
const interpolators = {
  /** [Nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation). Suitable for image enlargement only. */
  nearest: "nearest",
  /** [Bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation). Faster than bicubic but with less smooth results. */
  bilinear: "bilinear",
  /** [Bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default). */
  bicubic: "bicubic",
  /** [LBB interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/lbb.cpp#L100). Prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2. */
  locallyBoundedBicubic: "lbb",
  /** [Nohalo interpolation](http://eprints.soton.ac.uk/268086/). Prevents acutance but typically reduces performance by a factor of 3. */
  nohalo: "nohalo",
  /** [VSQBS interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/vsqbs.cpp#L48). Prevents "staircasing" when enlarging. */
  vertexSplitQuadraticBasisSpline: "vsqbs"
};
let versions = {
  vips: sharp.libvipsVersion()
};
try {
  versions = commonjsRequire(`../vendor/${versions.vips}/${platformAndArch}/versions.json`);
} catch (_err) {
}
versions.sharp = require$$7.version;
const vendor = {
  current: platformAndArch,
  installed: []
};
try {
  vendor.installed = fs.readdirSync(path.join(__dirname, `../vendor/${versions.vips}`));
} catch (_err) {
}
function cache(options) {
  if (is.bool(options)) {
    if (options) {
      return sharp.cache(50, 20, 100);
    } else {
      return sharp.cache(0, 0, 0);
    }
  } else if (is.object(options)) {
    return sharp.cache(options.memory, options.files, options.items);
  } else {
    return sharp.cache();
  }
}
cache(true);
function concurrency(concurrency2) {
  return sharp.concurrency(is.integer(concurrency2) ? concurrency2 : null);
}
if (detectLibc.familySync() === detectLibc.GLIBC && !sharp._isUsingJemalloc()) {
  sharp.concurrency(1);
}
const queue = new events.EventEmitter();
function counters() {
  return sharp.counters();
}
function simd(simd2) {
  return sharp.simd(is.bool(simd2) ? simd2 : null);
}
simd(true);
function block(options) {
  if (is.object(options)) {
    if (Array.isArray(options.operation) && options.operation.every(is.string)) {
      sharp.block(options.operation, true);
    } else {
      throw is.invalidParameterError("operation", "Array<string>", options.operation);
    }
  } else {
    throw is.invalidParameterError("options", "object", options);
  }
}
function unblock(options) {
  if (is.object(options)) {
    if (Array.isArray(options.operation) && options.operation.every(is.string)) {
      sharp.block(options.operation, false);
    } else {
      throw is.invalidParameterError("operation", "Array<string>", options.operation);
    }
  } else {
    throw is.invalidParameterError("options", "object", options);
  }
}
var utility = function(Sharp2) {
  Sharp2.cache = cache;
  Sharp2.concurrency = concurrency;
  Sharp2.counters = counters;
  Sharp2.simd = simd;
  Sharp2.format = format;
  Sharp2.interpolators = interpolators;
  Sharp2.versions = versions;
  Sharp2.vendor = vendor;
  Sharp2.queue = queue;
  Sharp2.block = block;
  Sharp2.unblock = unblock;
};
const Sharp = constructor;
input(Sharp);
resize_1(Sharp);
composite_1(Sharp);
operation(Sharp);
colour(Sharp);
channel(Sharp);
output(Sharp);
utility(Sharp);
var lib = Sharp;
const index = /* @__PURE__ */ main.getDefaultExportFromCjs(lib);
const index$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: index
}, [lib]);
exports.index = index$1;
