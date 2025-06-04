// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __require = import.meta.require;

// node_modules/dotenv/package.json
var require_package = __commonJS((exports, module) => {
  module.exports = {
    name: "dotenv",
    version: "16.5.0",
    description: "Loads environment variables from .env file",
    main: "lib/main.js",
    types: "lib/main.d.ts",
    exports: {
      ".": {
        types: "./lib/main.d.ts",
        require: "./lib/main.js",
        default: "./lib/main.js"
      },
      "./config": "./config.js",
      "./config.js": "./config.js",
      "./lib/env-options": "./lib/env-options.js",
      "./lib/env-options.js": "./lib/env-options.js",
      "./lib/cli-options": "./lib/cli-options.js",
      "./lib/cli-options.js": "./lib/cli-options.js",
      "./package.json": "./package.json"
    },
    scripts: {
      "dts-check": "tsc --project tests/types/tsconfig.json",
      lint: "standard",
      pretest: "npm run lint && npm run dts-check",
      test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
      "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=lcov",
      prerelease: "npm test",
      release: "standard-version"
    },
    repository: {
      type: "git",
      url: "git://github.com/motdotla/dotenv.git"
    },
    homepage: "https://github.com/motdotla/dotenv#readme",
    funding: "https://dotenvx.com",
    keywords: [
      "dotenv",
      "env",
      ".env",
      "environment",
      "variables",
      "config",
      "settings"
    ],
    readmeFilename: "README.md",
    license: "BSD-2-Clause",
    devDependencies: {
      "@types/node": "^18.11.3",
      decache: "^4.6.2",
      sinon: "^14.0.1",
      standard: "^17.0.0",
      "standard-version": "^9.5.0",
      tap: "^19.2.0",
      typescript: "^4.8.4"
    },
    engines: {
      node: ">=12"
    },
    browser: {
      fs: false
    }
  };
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS((exports, module) => {
  var fs = __require("fs");
  var path = __require("path");
  var os = __require("os");
  var crypto2 = __require("crypto");
  var packageJson = require_package();
  var version = packageJson.version;
  var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function parse(src) {
    const obj = {};
    let lines = src.toString();
    lines = lines.replace(/\r\n?/mg, `
`);
    let match;
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      const maybeQuote = value[0];
      value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, `
`);
        value = value.replace(/\\r/g, "\r");
      }
      obj[key] = value;
    }
    return obj;
  }
  function _parseVault(options) {
    const vaultPath = _vaultPath(options);
    const result = DotenvModule.configDotenv({ path: vaultPath });
    if (!result.parsed) {
      const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
      err.code = "MISSING_DATA";
      throw err;
    }
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;
    let decrypted;
    for (let i = 0;i < length; i++) {
      try {
        const key = keys[i].trim();
        const attrs = _instructions(result, key);
        decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
        break;
      } catch (error) {
        if (i + 1 >= length) {
          throw error;
        }
      }
    }
    return DotenvModule.parse(decrypted);
  }
  function _warn(message) {
    console.log(`[dotenv@${version}][WARN] ${message}`);
  }
  function _debug(message) {
    console.log(`[dotenv@${version}][DEBUG] ${message}`);
  }
  function _dotenvKey(options) {
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
      return options.DOTENV_KEY;
    }
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
      return process.env.DOTENV_KEY;
    }
    return "";
  }
  function _instructions(result, dotenvKey) {
    let uri;
    try {
      uri = new URL(dotenvKey);
    } catch (error) {
      if (error.code === "ERR_INVALID_URL") {
        const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      throw error;
    }
    const key = uri.password;
    if (!key) {
      const err = new Error("INVALID_DOTENV_KEY: Missing key part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environment = uri.searchParams.get("environment");
    if (!environment) {
      const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey];
    if (!ciphertext) {
      const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
      err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
      throw err;
    }
    return { ciphertext, key };
  }
  function _vaultPath(options) {
    let possibleVaultPath = null;
    if (options && options.path && options.path.length > 0) {
      if (Array.isArray(options.path)) {
        for (const filepath of options.path) {
          if (fs.existsSync(filepath)) {
            possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
      }
    } else {
      possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
    }
    if (fs.existsSync(possibleVaultPath)) {
      return possibleVaultPath;
    }
    return null;
  }
  function _resolveHome(envPath) {
    return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
  }
  function _configVault(options) {
    const debug = Boolean(options && options.debug);
    if (debug) {
      _debug("Loading env from encrypted .env.vault");
    }
    const parsed = DotenvModule._parseVault(options);
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsed, options);
    return { parsed };
  }
  function configDotenv(options) {
    const dotenvPath = path.resolve(process.cwd(), ".env");
    let encoding = "utf8";
    const debug = Boolean(options && options.debug);
    if (options && options.encoding) {
      encoding = options.encoding;
    } else {
      if (debug) {
        _debug("No encoding is specified. UTF-8 is used by default");
      }
    }
    let optionPaths = [dotenvPath];
    if (options && options.path) {
      if (!Array.isArray(options.path)) {
        optionPaths = [_resolveHome(options.path)];
      } else {
        optionPaths = [];
        for (const filepath of options.path) {
          optionPaths.push(_resolveHome(filepath));
        }
      }
    }
    let lastError;
    const parsedAll = {};
    for (const path2 of optionPaths) {
      try {
        const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
        DotenvModule.populate(parsedAll, parsed, options);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${path2} ${e.message}`);
        }
        lastError = e;
      }
    }
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsedAll, options);
    if (lastError) {
      return { parsed: parsedAll, error: lastError };
    } else {
      return { parsed: parsedAll };
    }
  }
  function config(options) {
    if (_dotenvKey(options).length === 0) {
      return DotenvModule.configDotenv(options);
    }
    const vaultPath = _vaultPath(options);
    if (!vaultPath) {
      _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
      return DotenvModule.configDotenv(options);
    }
    return DotenvModule._configVault(options);
  }
  function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), "hex");
    let ciphertext = Buffer.from(encrypted, "base64");
    const nonce = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(-16);
    ciphertext = ciphertext.subarray(12, -16);
    try {
      const aesgcm = crypto2.createDecipheriv("aes-256-gcm", key, nonce);
      aesgcm.setAuthTag(authTag);
      return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
      const isRange = error instanceof RangeError;
      const invalidKeyLength = error.message === "Invalid key length";
      const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
      if (isRange || invalidKeyLength) {
        const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      } else if (decryptionFailed) {
        const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        err.code = "DECRYPTION_FAILED";
        throw err;
      } else {
        throw error;
      }
    }
  }
  function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    if (typeof parsed !== "object") {
      const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      err.code = "OBJECT_REQUIRED";
      throw err;
    }
    for (const key of Object.keys(parsed)) {
      if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
        if (override === true) {
          processEnv[key] = parsed[key];
        }
        if (debug) {
          if (override === true) {
            _debug(`"${key}" is already defined and WAS overwritten`);
          } else {
            _debug(`"${key}" is already defined and was NOT overwritten`);
          }
        }
      } else {
        processEnv[key] = parsed[key];
      }
    }
  }
  var DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate
  };
  exports.configDotenv = DotenvModule.configDotenv;
  exports._configVault = DotenvModule._configVault;
  exports._parseVault = DotenvModule._parseVault;
  exports.config = DotenvModule.config;
  exports.decrypt = DotenvModule.decrypt;
  exports.parse = DotenvModule.parse;
  exports.populate = DotenvModule.populate;
  module.exports = DotenvModule;
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS((exports, module) => {
  var options = {};
  if (process.env.DOTENV_CONFIG_ENCODING != null) {
    options.encoding = process.env.DOTENV_CONFIG_ENCODING;
  }
  if (process.env.DOTENV_CONFIG_PATH != null) {
    options.path = process.env.DOTENV_CONFIG_PATH;
  }
  if (process.env.DOTENV_CONFIG_DEBUG != null) {
    options.debug = process.env.DOTENV_CONFIG_DEBUG;
  }
  if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
    options.override = process.env.DOTENV_CONFIG_OVERRIDE;
  }
  if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
    options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
  }
  module.exports = options;
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS((exports, module) => {
  var re = /^dotenv_config_(encoding|path|debug|override|DOTENV_KEY)=(.+)$/;
  module.exports = function optionMatcher(args) {
    return args.reduce(function(acc, cur) {
      const matches = cur.match(re);
      if (matches) {
        acc[matches[1]] = matches[2];
      }
      return acc;
    }, {});
  };
});

// node_modules/dotenv/config.js
var require_config = __commonJS(() => {
  (function() {
    require_main().config(Object.assign({}, require_env_options(), require_cli_options()(process.argv)));
  })();
});

// src/main.ts
var import_config = __toESM(require_config(), 1);

// node_modules/@asteasolutions/zod-to-openapi/dist/index.mjs
function __rest(s, e) {
  var t = {};
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s);i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function isZodType(schema, typeName) {
  var _a;
  return ((_a = schema === null || schema === undefined ? undefined : schema._def) === null || _a === undefined ? undefined : _a.typeName) === typeName;
}
function isAnyZodType(schema) {
  return "_def" in schema;
}
function preserveMetadataFromModifier(zod, modifier) {
  const zodModifier = zod.ZodType.prototype[modifier];
  zod.ZodType.prototype[modifier] = function(...args) {
    const result = zodModifier.apply(this, args);
    result._def.openapi = this._def.openapi;
    return result;
  };
}
function extendZodWithOpenApi(zod) {
  if (typeof zod.ZodType.prototype.openapi !== "undefined") {
    return;
  }
  zod.ZodType.prototype.openapi = function(refOrOpenapi, metadata) {
    var _a, _b, _c, _d, _e, _f;
    const openapi = typeof refOrOpenapi === "string" ? metadata : refOrOpenapi;
    const _g = openapi !== null && openapi !== undefined ? openapi : {}, { param } = _g, restOfOpenApi = __rest(_g, ["param"]);
    const _internal = Object.assign(Object.assign({}, (_a = this._def.openapi) === null || _a === undefined ? undefined : _a._internal), typeof refOrOpenapi === "string" ? { refId: refOrOpenapi } : undefined);
    const resultMetadata = Object.assign(Object.assign(Object.assign({}, (_b = this._def.openapi) === null || _b === undefined ? undefined : _b.metadata), restOfOpenApi), ((_d = (_c = this._def.openapi) === null || _c === undefined ? undefined : _c.metadata) === null || _d === undefined ? undefined : _d.param) || param ? {
      param: Object.assign(Object.assign({}, (_f = (_e = this._def.openapi) === null || _e === undefined ? undefined : _e.metadata) === null || _f === undefined ? undefined : _f.param), param)
    } : undefined);
    const result = new this.constructor(Object.assign(Object.assign({}, this._def), { openapi: Object.assign(Object.assign({}, Object.keys(_internal).length > 0 ? { _internal } : undefined), Object.keys(resultMetadata).length > 0 ? { metadata: resultMetadata } : undefined) }));
    if (isZodType(this, "ZodObject")) {
      const originalExtend = this.extend;
      result.extend = function(...args) {
        var _a2, _b2, _c2, _d2, _e2, _f2;
        const extendedResult = originalExtend.apply(this, args);
        extendedResult._def.openapi = {
          _internal: {
            extendedFrom: ((_b2 = (_a2 = this._def.openapi) === null || _a2 === undefined ? undefined : _a2._internal) === null || _b2 === undefined ? undefined : _b2.refId) ? { refId: (_d2 = (_c2 = this._def.openapi) === null || _c2 === undefined ? undefined : _c2._internal) === null || _d2 === undefined ? undefined : _d2.refId, schema: this } : (_e2 = this._def.openapi) === null || _e2 === undefined ? undefined : _e2._internal.extendedFrom
          },
          metadata: (_f2 = extendedResult._def.openapi) === null || _f2 === undefined ? undefined : _f2.metadata
        };
        return extendedResult;
      };
    }
    return result;
  };
  preserveMetadataFromModifier(zod, "optional");
  preserveMetadataFromModifier(zod, "nullable");
  preserveMetadataFromModifier(zod, "default");
  preserveMetadataFromModifier(zod, "transform");
  preserveMetadataFromModifier(zod, "refine");
  const zodDeepPartial = zod.ZodObject.prototype.deepPartial;
  zod.ZodObject.prototype.deepPartial = function() {
    const initialShape = this._def.shape();
    const result = zodDeepPartial.apply(this);
    const resultShape = result._def.shape();
    Object.entries(resultShape).forEach(([key, value]) => {
      var _a, _b;
      value._def.openapi = (_b = (_a = initialShape[key]) === null || _a === undefined ? undefined : _a._def) === null || _b === undefined ? undefined : _b.openapi;
    });
    result._def.openapi = undefined;
    return result;
  };
  const zodPick = zod.ZodObject.prototype.pick;
  zod.ZodObject.prototype.pick = function(...args) {
    const result = zodPick.apply(this, args);
    result._def.openapi = undefined;
    return result;
  };
  const zodOmit = zod.ZodObject.prototype.omit;
  zod.ZodObject.prototype.omit = function(...args) {
    const result = zodOmit.apply(this, args);
    result._def.openapi = undefined;
    return result;
  };
}
function isEqual(x, y) {
  if (x === null || x === undefined || y === null || y === undefined) {
    return x === y;
  }
  if (x === y || x.valueOf() === y.valueOf()) {
    return true;
  }
  if (Array.isArray(x)) {
    if (!Array.isArray(y)) {
      return false;
    }
    if (x.length !== y.length) {
      return false;
    }
  }
  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }
  const keysX = Object.keys(x);
  return Object.keys(y).every((keyY) => keysX.indexOf(keyY) !== -1) && keysX.every((key) => isEqual(x[key], y[key]));
}

class ObjectSet {
  constructor() {
    this.buckets = new Map;
  }
  put(value) {
    const hashCode = this.hashCodeOf(value);
    const itemsByCode = this.buckets.get(hashCode);
    if (!itemsByCode) {
      this.buckets.set(hashCode, [value]);
      return;
    }
    const alreadyHasItem = itemsByCode.some((_) => isEqual(_, value));
    if (!alreadyHasItem) {
      itemsByCode.push(value);
    }
  }
  contains(value) {
    const hashCode = this.hashCodeOf(value);
    const itemsByCode = this.buckets.get(hashCode);
    if (!itemsByCode) {
      return false;
    }
    return itemsByCode.some((_) => isEqual(_, value));
  }
  values() {
    return [...this.buckets.values()].flat();
  }
  stats() {
    let totalBuckets = 0;
    let totalValues = 0;
    let collisions = 0;
    for (const bucket of this.buckets.values()) {
      totalBuckets += 1;
      totalValues += bucket.length;
      if (bucket.length > 1) {
        collisions += 1;
      }
    }
    const hashEffectiveness = totalBuckets / totalValues;
    return { totalBuckets, collisions, totalValues, hashEffectiveness };
  }
  hashCodeOf(object) {
    let hashCode = 0;
    if (Array.isArray(object)) {
      for (let i = 0;i < object.length; i++) {
        hashCode ^= this.hashCodeOf(object[i]) * i;
      }
      return hashCode;
    }
    if (typeof object === "string") {
      for (let i = 0;i < object.length; i++) {
        hashCode ^= object.charCodeAt(i) * i;
      }
      return hashCode;
    }
    if (typeof object === "number") {
      return object;
    }
    if (typeof object === "object") {
      for (const [key, value] of Object.entries(object)) {
        hashCode ^= this.hashCodeOf(key) + this.hashCodeOf(value !== null && value !== undefined ? value : "");
      }
    }
    return hashCode;
  }
}
function isNil(value) {
  return value === null || value === undefined;
}
function mapValues(object, mapper) {
  const result = {};
  Object.entries(object).forEach(([key, value]) => {
    result[key] = mapper(value);
  });
  return result;
}
function omit(object, keys) {
  const result = {};
  Object.entries(object).forEach(([key, value]) => {
    if (!keys.some((keyToOmit) => keyToOmit === key)) {
      result[key] = value;
    }
  });
  return result;
}
function omitBy(object, predicate) {
  const result = {};
  Object.entries(object).forEach(([key, value]) => {
    if (!predicate(value, key)) {
      result[key] = value;
    }
  });
  return result;
}
function compact(arr) {
  return arr.filter((elem) => !isNil(elem));
}
var objectEquals = isEqual;
function uniq(values) {
  const set = new ObjectSet;
  values.forEach((value) => set.put(value));
  return [...set.values()];
}
function isString(val) {
  return typeof val === "string";
}
class OpenAPIRegistry {
  constructor(parents) {
    this.parents = parents;
    this._definitions = [];
  }
  get definitions() {
    var _a, _b;
    const parentDefinitions = (_b = (_a = this.parents) === null || _a === undefined ? undefined : _a.flatMap((par) => par.definitions)) !== null && _b !== undefined ? _b : [];
    return [...parentDefinitions, ...this._definitions];
  }
  register(refId, zodSchema) {
    const schemaWithRefId = this.schemaWithRefId(refId, zodSchema);
    this._definitions.push({ type: "schema", schema: schemaWithRefId });
    return schemaWithRefId;
  }
  registerParameter(refId, zodSchema) {
    var _a, _b, _c;
    const schemaWithRefId = this.schemaWithRefId(refId, zodSchema);
    const currentMetadata = (_a = schemaWithRefId._def.openapi) === null || _a === undefined ? undefined : _a.metadata;
    const schemaWithMetadata = schemaWithRefId.openapi(Object.assign(Object.assign({}, currentMetadata), { param: Object.assign(Object.assign({}, currentMetadata === null || currentMetadata === undefined ? undefined : currentMetadata.param), { name: (_c = (_b = currentMetadata === null || currentMetadata === undefined ? undefined : currentMetadata.param) === null || _b === undefined ? undefined : _b.name) !== null && _c !== undefined ? _c : refId }) }));
    this._definitions.push({
      type: "parameter",
      schema: schemaWithMetadata
    });
    return schemaWithMetadata;
  }
  registerPath(route) {
    this._definitions.push({
      type: "route",
      route
    });
  }
  registerWebhook(webhook) {
    this._definitions.push({
      type: "webhook",
      webhook
    });
  }
  registerComponent(type, name, component) {
    this._definitions.push({
      type: "component",
      componentType: type,
      name,
      component
    });
    return {
      name,
      ref: { $ref: `#/components/${type}/${name}` }
    };
  }
  schemaWithRefId(refId, zodSchema) {
    return zodSchema.openapi(refId);
  }
}

class ZodToOpenAPIError {
  constructor(message) {
    this.message = message;
  }
}

class ConflictError extends ZodToOpenAPIError {
  constructor(message, data) {
    super(message);
    this.data = data;
  }
}

class MissingParameterDataError extends ZodToOpenAPIError {
  constructor(data) {
    super(`Missing parameter data, please specify \`${data.missingField}\` and other OpenAPI parameter props using the \`param\` field of \`ZodSchema.openapi\``);
    this.data = data;
  }
}
function enhanceMissingParametersError(action, paramsToAdd) {
  try {
    return action();
  } catch (error) {
    if (error instanceof MissingParameterDataError) {
      throw new MissingParameterDataError(Object.assign(Object.assign({}, error.data), paramsToAdd));
    }
    throw error;
  }
}

class UnknownZodTypeError extends ZodToOpenAPIError {
  constructor(data) {
    super(`Unknown zod object type, please specify \`type\` and other OpenAPI props using \`ZodSchema.openapi\`.`);
    this.data = data;
  }
}

class Metadata {
  static getMetadata(zodSchema) {
    var _a;
    const innerSchema = this.unwrapChained(zodSchema);
    const metadata = zodSchema._def.openapi ? zodSchema._def.openapi : innerSchema._def.openapi;
    const zodDescription = (_a = zodSchema.description) !== null && _a !== undefined ? _a : innerSchema.description;
    return {
      _internal: metadata === null || metadata === undefined ? undefined : metadata._internal,
      metadata: Object.assign({ description: zodDescription }, metadata === null || metadata === undefined ? undefined : metadata.metadata)
    };
  }
  static getInternalMetadata(zodSchema) {
    const innerSchema = this.unwrapChained(zodSchema);
    const openapi = zodSchema._def.openapi ? zodSchema._def.openapi : innerSchema._def.openapi;
    return openapi === null || openapi === undefined ? undefined : openapi._internal;
  }
  static getParamMetadata(zodSchema) {
    var _a, _b;
    const innerSchema = this.unwrapChained(zodSchema);
    const metadata = zodSchema._def.openapi ? zodSchema._def.openapi : innerSchema._def.openapi;
    const zodDescription = (_a = zodSchema.description) !== null && _a !== undefined ? _a : innerSchema.description;
    return {
      _internal: metadata === null || metadata === undefined ? undefined : metadata._internal,
      metadata: Object.assign(Object.assign({}, metadata === null || metadata === undefined ? undefined : metadata.metadata), {
        param: Object.assign({ description: zodDescription }, (_b = metadata === null || metadata === undefined ? undefined : metadata.metadata) === null || _b === undefined ? undefined : _b.param)
      })
    };
  }
  static buildSchemaMetadata(metadata) {
    return omitBy(omit(metadata, ["param"]), isNil);
  }
  static buildParameterMetadata(metadata) {
    return omitBy(metadata, isNil);
  }
  static applySchemaMetadata(initialData, metadata) {
    return omitBy(Object.assign(Object.assign({}, initialData), this.buildSchemaMetadata(metadata)), isNil);
  }
  static getRefId(zodSchema) {
    var _a;
    return (_a = this.getInternalMetadata(zodSchema)) === null || _a === undefined ? undefined : _a.refId;
  }
  static unwrapChained(schema) {
    return this.unwrapUntil(schema);
  }
  static getDefaultValue(zodSchema) {
    const unwrapped = this.unwrapUntil(zodSchema, "ZodDefault");
    return unwrapped === null || unwrapped === undefined ? undefined : unwrapped._def.defaultValue();
  }
  static unwrapUntil(schema, typeName) {
    if (typeName && isZodType(schema, typeName)) {
      return schema;
    }
    if (isZodType(schema, "ZodOptional") || isZodType(schema, "ZodNullable") || isZodType(schema, "ZodBranded")) {
      return this.unwrapUntil(schema.unwrap(), typeName);
    }
    if (isZodType(schema, "ZodDefault") || isZodType(schema, "ZodReadonly")) {
      return this.unwrapUntil(schema._def.innerType, typeName);
    }
    if (isZodType(schema, "ZodEffects")) {
      return this.unwrapUntil(schema._def.schema, typeName);
    }
    if (isZodType(schema, "ZodPipeline")) {
      return this.unwrapUntil(schema._def.in, typeName);
    }
    return typeName ? undefined : schema;
  }
  static isOptionalSchema(zodSchema) {
    return zodSchema.isOptional();
  }
}

class ArrayTransformer {
  transform(zodSchema, mapNullableType, mapItems) {
    var _a, _b;
    const itemType = zodSchema._def.type;
    return Object.assign(Object.assign({}, mapNullableType("array")), { items: mapItems(itemType), minItems: (_a = zodSchema._def.minLength) === null || _a === undefined ? undefined : _a.value, maxItems: (_b = zodSchema._def.maxLength) === null || _b === undefined ? undefined : _b.value });
  }
}

class BigIntTransformer {
  transform(mapNullableType) {
    return Object.assign(Object.assign({}, mapNullableType("string")), { pattern: `^d+$` });
  }
}

class DiscriminatedUnionTransformer {
  transform(zodSchema, isNullable, mapNullableOfArray, mapItem, generateSchemaRef) {
    const options = [...zodSchema.options.values()];
    const optionSchema = options.map(mapItem);
    if (isNullable) {
      return {
        oneOf: mapNullableOfArray(optionSchema, isNullable)
      };
    }
    return {
      oneOf: optionSchema,
      discriminator: this.mapDiscriminator(options, zodSchema.discriminator, generateSchemaRef)
    };
  }
  mapDiscriminator(zodObjects, discriminator, generateSchemaRef) {
    if (zodObjects.some((obj) => Metadata.getRefId(obj) === undefined)) {
      return;
    }
    const mapping = {};
    zodObjects.forEach((obj) => {
      var _a;
      const refId = Metadata.getRefId(obj);
      const value = (_a = obj.shape) === null || _a === undefined ? undefined : _a[discriminator];
      if (isZodType(value, "ZodEnum") || isZodType(value, "ZodNativeEnum")) {
        const keys = Object.values(value.enum).filter(isString);
        keys.forEach((enumValue) => {
          mapping[enumValue] = generateSchemaRef(refId);
        });
        return;
      }
      const literalValue = value === null || value === undefined ? undefined : value._def.value;
      if (typeof literalValue !== "string") {
        throw new Error(`Discriminator ${discriminator} could not be found in one of the values of a discriminated union`);
      }
      mapping[literalValue] = generateSchemaRef(refId);
    });
    return {
      propertyName: discriminator,
      mapping
    };
  }
}

class EnumTransformer {
  transform(zodSchema, mapNullableType) {
    return Object.assign(Object.assign({}, mapNullableType("string")), { enum: zodSchema._def.values });
  }
}

class IntersectionTransformer {
  transform(zodSchema, isNullable, mapNullableOfArray, mapItem) {
    const subtypes = this.flattenIntersectionTypes(zodSchema);
    const allOfSchema = {
      allOf: subtypes.map(mapItem)
    };
    if (isNullable) {
      return {
        anyOf: mapNullableOfArray([allOfSchema], isNullable)
      };
    }
    return allOfSchema;
  }
  flattenIntersectionTypes(schema) {
    if (!isZodType(schema, "ZodIntersection")) {
      return [schema];
    }
    const leftSubTypes = this.flattenIntersectionTypes(schema._def.left);
    const rightSubTypes = this.flattenIntersectionTypes(schema._def.right);
    return [...leftSubTypes, ...rightSubTypes];
  }
}

class LiteralTransformer {
  transform(zodSchema, mapNullableType) {
    return Object.assign(Object.assign({}, mapNullableType(typeof zodSchema._def.value)), { enum: [zodSchema._def.value] });
  }
}
function enumInfo(enumObject) {
  const keysExceptReverseMappings = Object.keys(enumObject).filter((key) => typeof enumObject[enumObject[key]] !== "number");
  const values = keysExceptReverseMappings.map((key) => enumObject[key]);
  const numericCount = values.filter((_) => typeof _ === "number").length;
  const type = numericCount === 0 ? "string" : numericCount === values.length ? "numeric" : "mixed";
  return { values, type };
}

class NativeEnumTransformer {
  transform(zodSchema, mapNullableType) {
    const { type, values } = enumInfo(zodSchema._def.values);
    if (type === "mixed") {
      throw new ZodToOpenAPIError("Enum has mixed string and number values, please specify the OpenAPI type manually");
    }
    return Object.assign(Object.assign({}, mapNullableType(type === "numeric" ? "integer" : "string")), { enum: values });
  }
}

class NumberTransformer {
  transform(zodSchema, mapNullableType, getNumberChecks) {
    return Object.assign(Object.assign({}, mapNullableType(zodSchema.isInt ? "integer" : "number")), getNumberChecks(zodSchema._def.checks));
  }
}

class ObjectTransformer {
  transform(zodSchema, defaultValue, mapNullableType, mapItem) {
    var _a;
    const extendedFrom = (_a = Metadata.getInternalMetadata(zodSchema)) === null || _a === undefined ? undefined : _a.extendedFrom;
    const required = this.requiredKeysOf(zodSchema);
    const properties = mapValues(zodSchema._def.shape(), mapItem);
    if (!extendedFrom) {
      return Object.assign(Object.assign(Object.assign(Object.assign({}, mapNullableType("object")), { properties, default: defaultValue }), required.length > 0 ? { required } : {}), this.generateAdditionalProperties(zodSchema, mapItem));
    }
    const parent = extendedFrom.schema;
    mapItem(parent);
    const keysRequiredByParent = this.requiredKeysOf(parent);
    const propsOfParent = mapValues(parent === null || parent === undefined ? undefined : parent._def.shape(), mapItem);
    const propertiesToAdd = Object.fromEntries(Object.entries(properties).filter(([key, type]) => {
      return !objectEquals(propsOfParent[key], type);
    }));
    const additionallyRequired = required.filter((prop) => !keysRequiredByParent.includes(prop));
    const objectData = Object.assign(Object.assign(Object.assign(Object.assign({}, mapNullableType("object")), { default: defaultValue, properties: propertiesToAdd }), additionallyRequired.length > 0 ? { required: additionallyRequired } : {}), this.generateAdditionalProperties(zodSchema, mapItem));
    return {
      allOf: [
        { $ref: `#/components/schemas/${extendedFrom.refId}` },
        objectData
      ]
    };
  }
  generateAdditionalProperties(zodSchema, mapItem) {
    const unknownKeysOption = zodSchema._def.unknownKeys;
    const catchallSchema = zodSchema._def.catchall;
    if (isZodType(catchallSchema, "ZodNever")) {
      if (unknownKeysOption === "strict") {
        return { additionalProperties: false };
      }
      return {};
    }
    return { additionalProperties: mapItem(catchallSchema) };
  }
  requiredKeysOf(objectSchema) {
    return Object.entries(objectSchema._def.shape()).filter(([_key, type]) => !Metadata.isOptionalSchema(type)).map(([key, _type]) => key);
  }
}

class RecordTransformer {
  transform(zodSchema, mapNullableType, mapItem) {
    const propertiesType = zodSchema._def.valueType;
    const keyType = zodSchema._def.keyType;
    const propertiesSchema = mapItem(propertiesType);
    if (isZodType(keyType, "ZodEnum") || isZodType(keyType, "ZodNativeEnum")) {
      const keys = Object.values(keyType.enum).filter(isString);
      const properties = keys.reduce((acc, curr) => Object.assign(Object.assign({}, acc), { [curr]: propertiesSchema }), {});
      return Object.assign(Object.assign({}, mapNullableType("object")), { properties });
    }
    return Object.assign(Object.assign({}, mapNullableType("object")), { additionalProperties: propertiesSchema });
  }
}

class StringTransformer {
  transform(zodSchema, mapNullableType) {
    var _a, _b, _c;
    const regexCheck = this.getZodStringCheck(zodSchema, "regex");
    const length = (_a = this.getZodStringCheck(zodSchema, "length")) === null || _a === undefined ? undefined : _a.value;
    const maxLength = Number.isFinite(zodSchema.minLength) ? (_b = zodSchema.minLength) !== null && _b !== undefined ? _b : undefined : undefined;
    const minLength = Number.isFinite(zodSchema.maxLength) ? (_c = zodSchema.maxLength) !== null && _c !== undefined ? _c : undefined : undefined;
    return Object.assign(Object.assign({}, mapNullableType("string")), {
      minLength: length !== null && length !== undefined ? length : maxLength,
      maxLength: length !== null && length !== undefined ? length : minLength,
      format: this.mapStringFormat(zodSchema),
      pattern: regexCheck === null || regexCheck === undefined ? undefined : regexCheck.regex.source
    });
  }
  mapStringFormat(zodString) {
    if (zodString.isUUID)
      return "uuid";
    if (zodString.isEmail)
      return "email";
    if (zodString.isURL)
      return "uri";
    if (zodString.isDate)
      return "date";
    if (zodString.isDatetime)
      return "date-time";
    if (zodString.isCUID)
      return "cuid";
    if (zodString.isCUID2)
      return "cuid2";
    if (zodString.isULID)
      return "ulid";
    if (zodString.isIP)
      return "ip";
    if (zodString.isEmoji)
      return "emoji";
    return;
  }
  getZodStringCheck(zodString, kind) {
    return zodString._def.checks.find((check) => {
      return check.kind === kind;
    });
  }
}

class TupleTransformer {
  constructor(versionSpecifics) {
    this.versionSpecifics = versionSpecifics;
  }
  transform(zodSchema, mapNullableType, mapItem) {
    const { items } = zodSchema._def;
    const schemas = items.map(mapItem);
    return Object.assign(Object.assign({}, mapNullableType("array")), this.versionSpecifics.mapTupleItems(schemas));
  }
}

class UnionTransformer {
  transform(zodSchema, mapNullableOfArray, mapItem) {
    const options = this.flattenUnionTypes(zodSchema);
    const schemas = options.map((schema) => {
      const optionToGenerate = this.unwrapNullable(schema);
      return mapItem(optionToGenerate);
    });
    return {
      anyOf: mapNullableOfArray(schemas)
    };
  }
  flattenUnionTypes(schema) {
    if (!isZodType(schema, "ZodUnion")) {
      return [schema];
    }
    const options = schema._def.options;
    return options.flatMap((option) => this.flattenUnionTypes(option));
  }
  unwrapNullable(schema) {
    if (isZodType(schema, "ZodNullable")) {
      return this.unwrapNullable(schema.unwrap());
    }
    return schema;
  }
}

class OpenApiTransformer {
  constructor(versionSpecifics) {
    this.versionSpecifics = versionSpecifics;
    this.objectTransformer = new ObjectTransformer;
    this.stringTransformer = new StringTransformer;
    this.numberTransformer = new NumberTransformer;
    this.bigIntTransformer = new BigIntTransformer;
    this.literalTransformer = new LiteralTransformer;
    this.enumTransformer = new EnumTransformer;
    this.nativeEnumTransformer = new NativeEnumTransformer;
    this.arrayTransformer = new ArrayTransformer;
    this.unionTransformer = new UnionTransformer;
    this.discriminatedUnionTransformer = new DiscriminatedUnionTransformer;
    this.intersectionTransformer = new IntersectionTransformer;
    this.recordTransformer = new RecordTransformer;
    this.tupleTransformer = new TupleTransformer(versionSpecifics);
  }
  transform(zodSchema, isNullable, mapItem, generateSchemaRef, defaultValue) {
    if (isZodType(zodSchema, "ZodNull")) {
      return this.versionSpecifics.nullType;
    }
    if (isZodType(zodSchema, "ZodUnknown") || isZodType(zodSchema, "ZodAny")) {
      return this.versionSpecifics.mapNullableType(undefined, isNullable);
    }
    if (isZodType(zodSchema, "ZodObject")) {
      return this.objectTransformer.transform(zodSchema, defaultValue, (_) => this.versionSpecifics.mapNullableType(_, isNullable), mapItem);
    }
    const schema = this.transformSchemaWithoutDefault(zodSchema, isNullable, mapItem, generateSchemaRef);
    return Object.assign(Object.assign({}, schema), { default: defaultValue });
  }
  transformSchemaWithoutDefault(zodSchema, isNullable, mapItem, generateSchemaRef) {
    if (isZodType(zodSchema, "ZodUnknown") || isZodType(zodSchema, "ZodAny")) {
      return this.versionSpecifics.mapNullableType(undefined, isNullable);
    }
    if (isZodType(zodSchema, "ZodString")) {
      return this.stringTransformer.transform(zodSchema, (schema) => this.versionSpecifics.mapNullableType(schema, isNullable));
    }
    if (isZodType(zodSchema, "ZodNumber")) {
      return this.numberTransformer.transform(zodSchema, (schema) => this.versionSpecifics.mapNullableType(schema, isNullable), (_) => this.versionSpecifics.getNumberChecks(_));
    }
    if (isZodType(zodSchema, "ZodBigInt")) {
      return this.bigIntTransformer.transform((schema) => this.versionSpecifics.mapNullableType(schema, isNullable));
    }
    if (isZodType(zodSchema, "ZodBoolean")) {
      return this.versionSpecifics.mapNullableType("boolean", isNullable);
    }
    if (isZodType(zodSchema, "ZodLiteral")) {
      return this.literalTransformer.transform(zodSchema, (schema) => this.versionSpecifics.mapNullableType(schema, isNullable));
    }
    if (isZodType(zodSchema, "ZodEnum")) {
      return this.enumTransformer.transform(zodSchema, (schema) => this.versionSpecifics.mapNullableType(schema, isNullable));
    }
    if (isZodType(zodSchema, "ZodNativeEnum")) {
      return this.nativeEnumTransformer.transform(zodSchema, (schema) => this.versionSpecifics.mapNullableType(schema, isNullable));
    }
    if (isZodType(zodSchema, "ZodArray")) {
      return this.arrayTransformer.transform(zodSchema, (_) => this.versionSpecifics.mapNullableType(_, isNullable), mapItem);
    }
    if (isZodType(zodSchema, "ZodTuple")) {
      return this.tupleTransformer.transform(zodSchema, (_) => this.versionSpecifics.mapNullableType(_, isNullable), mapItem);
    }
    if (isZodType(zodSchema, "ZodUnion")) {
      return this.unionTransformer.transform(zodSchema, (_) => this.versionSpecifics.mapNullableOfArray(_, isNullable), mapItem);
    }
    if (isZodType(zodSchema, "ZodDiscriminatedUnion")) {
      return this.discriminatedUnionTransformer.transform(zodSchema, isNullable, (_) => this.versionSpecifics.mapNullableOfArray(_, isNullable), mapItem, generateSchemaRef);
    }
    if (isZodType(zodSchema, "ZodIntersection")) {
      return this.intersectionTransformer.transform(zodSchema, isNullable, (_) => this.versionSpecifics.mapNullableOfArray(_, isNullable), mapItem);
    }
    if (isZodType(zodSchema, "ZodRecord")) {
      return this.recordTransformer.transform(zodSchema, (_) => this.versionSpecifics.mapNullableType(_, isNullable), mapItem);
    }
    if (isZodType(zodSchema, "ZodDate")) {
      return this.versionSpecifics.mapNullableType("string", isNullable);
    }
    const refId = Metadata.getRefId(zodSchema);
    throw new UnknownZodTypeError({
      currentSchema: zodSchema._def,
      schemaName: refId
    });
  }
}

class OpenAPIGenerator {
  constructor(definitions, versionSpecifics) {
    this.definitions = definitions;
    this.versionSpecifics = versionSpecifics;
    this.schemaRefs = {};
    this.paramRefs = {};
    this.pathRefs = {};
    this.rawComponents = [];
    this.openApiTransformer = new OpenApiTransformer(versionSpecifics);
    this.sortDefinitions();
  }
  generateDocumentData() {
    this.definitions.forEach((definition) => this.generateSingle(definition));
    return {
      components: this.buildComponents(),
      paths: this.pathRefs
    };
  }
  generateComponents() {
    this.definitions.forEach((definition) => this.generateSingle(definition));
    return {
      components: this.buildComponents()
    };
  }
  buildComponents() {
    var _a, _b;
    const rawComponents = {};
    this.rawComponents.forEach(({ componentType, name, component }) => {
      var _a2;
      (_a2 = rawComponents[componentType]) !== null && _a2 !== undefined || (rawComponents[componentType] = {});
      rawComponents[componentType][name] = component;
    });
    return Object.assign(Object.assign({}, rawComponents), { schemas: Object.assign(Object.assign({}, (_a = rawComponents.schemas) !== null && _a !== undefined ? _a : {}), this.schemaRefs), parameters: Object.assign(Object.assign({}, (_b = rawComponents.parameters) !== null && _b !== undefined ? _b : {}), this.paramRefs) });
  }
  sortDefinitions() {
    const generationOrder = [
      "schema",
      "parameter",
      "component",
      "route"
    ];
    this.definitions.sort((left, right) => {
      if (!("type" in left)) {
        if (!("type" in right)) {
          return 0;
        }
        return -1;
      }
      if (!("type" in right)) {
        return 1;
      }
      const leftIndex = generationOrder.findIndex((type) => type === left.type);
      const rightIndex = generationOrder.findIndex((type) => type === right.type);
      return leftIndex - rightIndex;
    });
  }
  generateSingle(definition) {
    if (!("type" in definition)) {
      this.generateSchemaWithRef(definition);
      return;
    }
    switch (definition.type) {
      case "parameter":
        this.generateParameterDefinition(definition.schema);
        return;
      case "schema":
        this.generateSchemaWithRef(definition.schema);
        return;
      case "route":
        this.generateSingleRoute(definition.route);
        return;
      case "component":
        this.rawComponents.push(definition);
        return;
    }
  }
  generateParameterDefinition(zodSchema) {
    const refId = Metadata.getRefId(zodSchema);
    const result = this.generateParameter(zodSchema);
    if (refId) {
      this.paramRefs[refId] = result;
    }
    return result;
  }
  getParameterRef(schemaMetadata, external) {
    var _a, _b, _c, _d, _e;
    const parameterMetadata = (_a = schemaMetadata === null || schemaMetadata === undefined ? undefined : schemaMetadata.metadata) === null || _a === undefined ? undefined : _a.param;
    const existingRef = ((_b = schemaMetadata === null || schemaMetadata === undefined ? undefined : schemaMetadata._internal) === null || _b === undefined ? undefined : _b.refId) ? this.paramRefs[(_c = schemaMetadata._internal) === null || _c === undefined ? undefined : _c.refId] : undefined;
    if (!((_d = schemaMetadata === null || schemaMetadata === undefined ? undefined : schemaMetadata._internal) === null || _d === undefined ? undefined : _d.refId) || !existingRef) {
      return;
    }
    if (parameterMetadata && existingRef.in !== parameterMetadata.in || (external === null || external === undefined ? undefined : external.in) && existingRef.in !== external.in) {
      throw new ConflictError(`Conflicting location for parameter ${existingRef.name}`, {
        key: "in",
        values: compact([
          existingRef.in,
          external === null || external === undefined ? undefined : external.in,
          parameterMetadata === null || parameterMetadata === undefined ? undefined : parameterMetadata.in
        ])
      });
    }
    if (parameterMetadata && existingRef.name !== parameterMetadata.name || (external === null || external === undefined ? undefined : external.name) && existingRef.name !== (external === null || external === undefined ? undefined : external.name)) {
      throw new ConflictError(`Conflicting names for parameter`, {
        key: "name",
        values: compact([
          existingRef.name,
          external === null || external === undefined ? undefined : external.name,
          parameterMetadata === null || parameterMetadata === undefined ? undefined : parameterMetadata.name
        ])
      });
    }
    return {
      $ref: `#/components/parameters/${(_e = schemaMetadata._internal) === null || _e === undefined ? undefined : _e.refId}`
    };
  }
  generateInlineParameters(zodSchema, location) {
    var _a;
    const metadata = Metadata.getMetadata(zodSchema);
    const parameterMetadata = (_a = metadata === null || metadata === undefined ? undefined : metadata.metadata) === null || _a === undefined ? undefined : _a.param;
    const referencedSchema = this.getParameterRef(metadata, { in: location });
    if (referencedSchema) {
      return [referencedSchema];
    }
    if (isZodType(zodSchema, "ZodObject")) {
      const propTypes = zodSchema._def.shape();
      const parameters = Object.entries(propTypes).map(([key, schema]) => {
        var _a2, _b;
        const innerMetadata = Metadata.getMetadata(schema);
        const referencedSchema2 = this.getParameterRef(innerMetadata, {
          in: location,
          name: key
        });
        if (referencedSchema2) {
          return referencedSchema2;
        }
        const innerParameterMetadata = (_a2 = innerMetadata === null || innerMetadata === undefined ? undefined : innerMetadata.metadata) === null || _a2 === undefined ? undefined : _a2.param;
        if ((innerParameterMetadata === null || innerParameterMetadata === undefined ? undefined : innerParameterMetadata.name) && innerParameterMetadata.name !== key) {
          throw new ConflictError(`Conflicting names for parameter`, {
            key: "name",
            values: [key, innerParameterMetadata.name]
          });
        }
        if ((innerParameterMetadata === null || innerParameterMetadata === undefined ? undefined : innerParameterMetadata.in) && innerParameterMetadata.in !== location) {
          throw new ConflictError(`Conflicting location for parameter ${(_b = innerParameterMetadata.name) !== null && _b !== undefined ? _b : key}`, {
            key: "in",
            values: [location, innerParameterMetadata.in]
          });
        }
        return this.generateParameter(schema.openapi({ param: { name: key, in: location } }));
      });
      return parameters;
    }
    if ((parameterMetadata === null || parameterMetadata === undefined ? undefined : parameterMetadata.in) && parameterMetadata.in !== location) {
      throw new ConflictError(`Conflicting location for parameter ${parameterMetadata.name}`, {
        key: "in",
        values: [location, parameterMetadata.in]
      });
    }
    return [
      this.generateParameter(zodSchema.openapi({ param: { in: location } }))
    ];
  }
  generateSimpleParameter(zodSchema) {
    var _a;
    const metadata = Metadata.getParamMetadata(zodSchema);
    const paramMetadata = (_a = metadata === null || metadata === undefined ? undefined : metadata.metadata) === null || _a === undefined ? undefined : _a.param;
    const required = !Metadata.isOptionalSchema(zodSchema) && !zodSchema.isNullable();
    const schema = this.generateSchemaWithRef(zodSchema);
    return Object.assign({
      schema,
      required
    }, paramMetadata ? Metadata.buildParameterMetadata(paramMetadata) : {});
  }
  generateParameter(zodSchema) {
    var _a;
    const metadata = Metadata.getMetadata(zodSchema);
    const paramMetadata = (_a = metadata === null || metadata === undefined ? undefined : metadata.metadata) === null || _a === undefined ? undefined : _a.param;
    const paramName = paramMetadata === null || paramMetadata === undefined ? undefined : paramMetadata.name;
    const paramLocation = paramMetadata === null || paramMetadata === undefined ? undefined : paramMetadata.in;
    if (!paramName) {
      throw new MissingParameterDataError({ missingField: "name" });
    }
    if (!paramLocation) {
      throw new MissingParameterDataError({
        missingField: "in",
        paramName
      });
    }
    const baseParameter = this.generateSimpleParameter(zodSchema);
    return Object.assign(Object.assign({}, baseParameter), { in: paramLocation, name: paramName });
  }
  generateSchemaWithMetadata(zodSchema) {
    var _a;
    const innerSchema = Metadata.unwrapChained(zodSchema);
    const metadata = Metadata.getMetadata(zodSchema);
    const defaultValue = Metadata.getDefaultValue(zodSchema);
    const result = ((_a = metadata === null || metadata === undefined ? undefined : metadata.metadata) === null || _a === undefined ? undefined : _a.type) ? { type: metadata === null || metadata === undefined ? undefined : metadata.metadata.type } : this.toOpenAPISchema(innerSchema, zodSchema.isNullable(), defaultValue);
    return (metadata === null || metadata === undefined ? undefined : metadata.metadata) ? Metadata.applySchemaMetadata(result, metadata.metadata) : omitBy(result, isNil);
  }
  constructReferencedOpenAPISchema(zodSchema) {
    var _a;
    const metadata = Metadata.getMetadata(zodSchema);
    const innerSchema = Metadata.unwrapChained(zodSchema);
    const defaultValue = Metadata.getDefaultValue(zodSchema);
    const isNullableSchema = zodSchema.isNullable();
    if ((_a = metadata === null || metadata === undefined ? undefined : metadata.metadata) === null || _a === undefined ? undefined : _a.type) {
      return this.versionSpecifics.mapNullableType(metadata.metadata.type, isNullableSchema);
    }
    return this.toOpenAPISchema(innerSchema, isNullableSchema, defaultValue);
  }
  generateSimpleSchema(zodSchema) {
    var _a;
    const metadata = Metadata.getMetadata(zodSchema);
    const refId = Metadata.getRefId(zodSchema);
    if (!refId || !this.schemaRefs[refId]) {
      return this.generateSchemaWithMetadata(zodSchema);
    }
    const schemaRef = this.schemaRefs[refId];
    const referenceObject = {
      $ref: this.generateSchemaRef(refId)
    };
    const newMetadata = omitBy(Metadata.buildSchemaMetadata((_a = metadata === null || metadata === undefined ? undefined : metadata.metadata) !== null && _a !== undefined ? _a : {}), (value, key) => value === undefined || objectEquals(value, schemaRef[key]));
    if (newMetadata.type) {
      return {
        allOf: [referenceObject, newMetadata]
      };
    }
    const newSchemaMetadata = omitBy(this.constructReferencedOpenAPISchema(zodSchema), (value, key) => value === undefined || objectEquals(value, schemaRef[key]));
    const appliedMetadata = Metadata.applySchemaMetadata(newSchemaMetadata, newMetadata);
    if (Object.keys(appliedMetadata).length > 0) {
      return {
        allOf: [referenceObject, appliedMetadata]
      };
    }
    return referenceObject;
  }
  generateSchemaWithRef(zodSchema) {
    const refId = Metadata.getRefId(zodSchema);
    const result = this.generateSimpleSchema(zodSchema);
    if (refId && this.schemaRefs[refId] === undefined) {
      this.schemaRefs[refId] = result;
      return { $ref: this.generateSchemaRef(refId) };
    }
    return result;
  }
  generateSchemaRef(refId) {
    return `#/components/schemas/${refId}`;
  }
  getRequestBody(requestBody) {
    if (!requestBody) {
      return;
    }
    const { content } = requestBody, rest = __rest(requestBody, ["content"]);
    const requestBodyContent = this.getBodyContent(content);
    return Object.assign(Object.assign({}, rest), { content: requestBodyContent });
  }
  getParameters(request) {
    if (!request) {
      return [];
    }
    const { headers } = request;
    const query = this.cleanParameter(request.query);
    const params = this.cleanParameter(request.params);
    const cookies = this.cleanParameter(request.cookies);
    const queryParameters = enhanceMissingParametersError(() => query ? this.generateInlineParameters(query, "query") : [], { location: "query" });
    const pathParameters = enhanceMissingParametersError(() => params ? this.generateInlineParameters(params, "path") : [], { location: "path" });
    const cookieParameters = enhanceMissingParametersError(() => cookies ? this.generateInlineParameters(cookies, "cookie") : [], { location: "cookie" });
    const headerParameters = enhanceMissingParametersError(() => {
      if (Array.isArray(headers)) {
        return headers.flatMap((header) => this.generateInlineParameters(header, "header"));
      }
      const cleanHeaders = this.cleanParameter(headers);
      return cleanHeaders ? this.generateInlineParameters(cleanHeaders, "header") : [];
    }, { location: "header" });
    return [
      ...pathParameters,
      ...queryParameters,
      ...headerParameters,
      ...cookieParameters
    ];
  }
  cleanParameter(schema) {
    if (!schema) {
      return;
    }
    return isZodType(schema, "ZodEffects") ? this.cleanParameter(schema._def.schema) : schema;
  }
  generatePath(route) {
    const { method, path, request, responses } = route, pathItemConfig = __rest(route, ["method", "path", "request", "responses"]);
    const generatedResponses = mapValues(responses, (response) => {
      return this.getResponse(response);
    });
    const parameters = enhanceMissingParametersError(() => this.getParameters(request), { route: `${method} ${path}` });
    const requestBody = this.getRequestBody(request === null || request === undefined ? undefined : request.body);
    const routeDoc = {
      [method]: Object.assign(Object.assign(Object.assign(Object.assign({}, pathItemConfig), parameters.length > 0 ? {
        parameters: [...pathItemConfig.parameters || [], ...parameters]
      } : {}), requestBody ? { requestBody } : {}), { responses: generatedResponses })
    };
    return routeDoc;
  }
  generateSingleRoute(route) {
    const routeDoc = this.generatePath(route);
    this.pathRefs[route.path] = Object.assign(Object.assign({}, this.pathRefs[route.path]), routeDoc);
    return routeDoc;
  }
  getResponse(response) {
    if (this.isReferenceObject(response)) {
      return response;
    }
    const { content, headers } = response, rest = __rest(response, ["content", "headers"]);
    const responseContent = content ? { content: this.getBodyContent(content) } : {};
    if (!headers) {
      return Object.assign(Object.assign({}, rest), responseContent);
    }
    const responseHeaders = isZodType(headers, "ZodObject") ? this.getResponseHeaders(headers) : headers;
    return Object.assign(Object.assign(Object.assign({}, rest), { headers: responseHeaders }), responseContent);
  }
  isReferenceObject(schema) {
    return "$ref" in schema;
  }
  getResponseHeaders(headers) {
    const schemaShape = headers._def.shape();
    const responseHeaders = mapValues(schemaShape, (_) => this.generateSimpleParameter(_));
    return responseHeaders;
  }
  getBodyContent(content) {
    return mapValues(content, (config) => {
      if (!config || !isAnyZodType(config.schema)) {
        return config;
      }
      const { schema: configSchema } = config, rest = __rest(config, ["schema"]);
      const schema = this.generateSchemaWithRef(configSchema);
      return Object.assign({ schema }, rest);
    });
  }
  toOpenAPISchema(zodSchema, isNullable, defaultValue) {
    return this.openApiTransformer.transform(zodSchema, isNullable, (_) => this.generateSchemaWithRef(_), (_) => this.generateSchemaRef(_), defaultValue);
  }
}

class OpenApiGeneratorV30Specifics {
  get nullType() {
    return { nullable: true };
  }
  mapNullableOfArray(objects, isNullable) {
    if (isNullable) {
      return [...objects, this.nullType];
    }
    return objects;
  }
  mapNullableType(type, isNullable) {
    return Object.assign(Object.assign({}, type ? { type } : undefined), isNullable ? this.nullType : undefined);
  }
  mapTupleItems(schemas) {
    const uniqueSchemas = uniq(schemas);
    return {
      items: uniqueSchemas.length === 1 ? uniqueSchemas[0] : { anyOf: uniqueSchemas },
      minItems: schemas.length,
      maxItems: schemas.length
    };
  }
  getNumberChecks(checks) {
    return Object.assign({}, ...checks.map((check) => {
      switch (check.kind) {
        case "min":
          return check.inclusive ? { minimum: Number(check.value) } : { minimum: Number(check.value), exclusiveMinimum: true };
        case "max":
          return check.inclusive ? { maximum: Number(check.value) } : { maximum: Number(check.value), exclusiveMaximum: true };
        default:
          return {};
      }
    }));
  }
}

class OpenApiGeneratorV3 {
  constructor(definitions) {
    const specifics = new OpenApiGeneratorV30Specifics;
    this.generator = new OpenAPIGenerator(definitions, specifics);
  }
  generateDocument(config) {
    const baseData = this.generator.generateDocumentData();
    return Object.assign(Object.assign({}, config), baseData);
  }
  generateComponents() {
    return this.generator.generateComponents();
  }
}

class OpenApiGeneratorV31Specifics {
  get nullType() {
    return { type: "null" };
  }
  mapNullableOfArray(objects, isNullable) {
    if (isNullable) {
      return [...objects, this.nullType];
    }
    return objects;
  }
  mapNullableType(type, isNullable) {
    if (!type) {
      return {};
    }
    if (isNullable) {
      return {
        type: Array.isArray(type) ? [...type, "null"] : [type, "null"]
      };
    }
    return {
      type
    };
  }
  mapTupleItems(schemas) {
    return {
      prefixItems: schemas
    };
  }
  getNumberChecks(checks) {
    return Object.assign({}, ...checks.map((check) => {
      switch (check.kind) {
        case "min":
          return check.inclusive ? { minimum: Number(check.value) } : { exclusiveMinimum: Number(check.value) };
        case "max":
          return check.inclusive ? { maximum: Number(check.value) } : { exclusiveMaximum: Number(check.value) };
        default:
          return {};
      }
    }));
  }
}
function isWebhookDefinition(definition) {
  return "type" in definition && definition.type === "webhook";
}

class OpenApiGeneratorV31 {
  constructor(definitions) {
    this.definitions = definitions;
    this.webhookRefs = {};
    const specifics = new OpenApiGeneratorV31Specifics;
    this.generator = new OpenAPIGenerator(this.definitions, specifics);
  }
  generateDocument(config) {
    const baseDocument = this.generator.generateDocumentData();
    this.definitions.filter(isWebhookDefinition).forEach((definition) => this.generateSingleWebhook(definition.webhook));
    return Object.assign(Object.assign(Object.assign({}, config), baseDocument), { webhooks: this.webhookRefs });
  }
  generateComponents() {
    return this.generator.generateComponents();
  }
  generateSingleWebhook(route) {
    const routeDoc = this.generator.generatePath(route);
    this.webhookRefs[route.path] = Object.assign(Object.assign({}, this.webhookRefs[route.path]), routeDoc);
    return routeDoc;
  }
}

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1;i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1;j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
};
var getPath = (request) => {
  const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
  return match ? match[1] : "";
};
var getQueryStrings = (url) => {
  const queryIndex = url.indexOf("?", 8);
  return queryIndex === -1 ? "" : "?" + url.slice(queryIndex + 1);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
};
var mergePath = (...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p[p.length - 1] === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
};
var checkOptionalParameter = (path) => {
  if (!path.match(/\:.+\?$/)) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return /%/.test(value) ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? undefined : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? undefined : nextKeyIndex : valueIndex);
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? undefined : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = (cookie, name) => {
  const pairs = cookie.trim().split(";");
  return pairs.reduce((parsedCookie, pairStr) => {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      return parsedCookie;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      return parsedCookie;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
    }
    return parsedCookie;
  }, {});
};
var _serialize = (name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite}`;
  }
  if (opt.partitioned) {
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt = {}) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return;
    }
    const obj2 = parse(cookie, key);
    return obj2[key];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
};

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType
    }
  });
  return response.formData();
};

// node_modules/hono/dist/validator/validator.js
var validator = (target, validationFunc) => {
  return async (c, next) => {
    let value = {};
    const contentType = c.req.header("Content-Type");
    switch (target) {
      case "json":
        if (!contentType || !contentType.startsWith("application/json")) {
          const message = `Invalid HTTP header: Content-Type=${contentType}`;
          console.error(message);
          return c.json({
            success: false,
            message
          }, 400);
        }
        try {
          const arrayBuffer = c.req.bodyCache.arrayBuffer ?? await c.req.raw.arrayBuffer();
          value = await new Response(arrayBuffer).json();
          c.req.bodyCache.json = value;
          c.req.bodyCache.arrayBuffer = arrayBuffer;
        } catch {
          console.error("Error: Malformed JSON in request body");
          return c.json({
            success: false,
            message: "Malformed JSON in request body"
          }, 400);
        }
        break;
      case "form": {
        try {
          const contentType2 = c.req.header("Content-Type");
          if (contentType2) {
            const arrayBuffer = c.req.bodyCache.arrayBuffer ?? await c.req.raw.arrayBuffer();
            const formData = await bufferToFormData(arrayBuffer, contentType2);
            const form = {};
            formData.forEach((value2, key) => {
              form[key] = value2;
            });
            value = form;
            c.req.bodyCache.formData = formData;
            c.req.bodyCache.arrayBuffer = arrayBuffer;
          }
        } catch (e) {
          let message = "Malformed FormData request.";
          message += e instanceof Error ? ` ${e.message}` : ` ${String(e)}`;
          return c.json({
            success: false,
            message
          }, 400);
        }
        break;
      }
      case "query":
        value = Object.fromEntries(Object.entries(c.req.queries()).map(([k, v]) => {
          return v.length === 1 ? [k, v[0]] : [k, v];
        }));
        break;
      case "queries":
        value = c.req.queries();
        console.log("Warnings: Validate type `queries` is deprecated. Use `query` instead.");
        break;
      case "param":
        value = c.req.param();
        break;
      case "header":
        value = c.req.header();
        break;
      case "cookie":
        value = getCookie(c);
        break;
    }
    const res = await validationFunc(value, c);
    if (res instanceof Response) {
      return res;
    }
    c.req.addValidatedData(target, res);
    await next();
  };
};

// node_modules/@hono/zod-validator/dist/index.js
var zValidator = (target, schema, hook, options) => validator(target, async (value, c) => {
  let validatorValue = value;
  if (target === "header" && "_def" in schema || target === "header" && "_zod" in schema) {
    const schemaKeys = Object.keys(schema.shape);
    const caseInsensitiveKeymap = Object.fromEntries(schemaKeys.map((key) => [key.toLowerCase(), key]));
    validatorValue = Object.fromEntries(Object.entries(value).map(([key, value2]) => [caseInsensitiveKeymap[key] || key, value2]));
  }
  const result = options && options.validationFunction ? await options.validationFunction(schema, validatorValue) : await schema.safeParseAsync(validatorValue);
  if (hook) {
    const hookResult = await hook({ data: validatorValue, ...result, target }, c);
    if (hookResult) {
      if (hookResult instanceof Response) {
        return hookResult;
      }
      if ("response" in hookResult) {
        return hookResult.response;
      }
    }
  }
  if (!result.success) {
    return c.json(result, 400);
  }
  return result.data;
});

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var escapeRe = /[&<>'"]/;
var stringBufferToString = async (buffer) => {
  let str = "";
  const callbacks = [];
  for (let i = buffer.length - 1;; i--) {
    str += buffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = await buffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
};
var escapeToBuffer = (str, buffer) => {
  const match = str.search(escapeRe);
  if (match === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match;index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/utils/stream.js
var StreamingApi = class {
  constructor(writable, _readable) {
    this.abortSubscribers = [];
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder;
    const reader = _readable.getReader();
    this.responseReadable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        done ? controller.close() : controller.enqueue(value);
      },
      cancel: () => {
        this.abortSubscribers.forEach((subscriber) => subscriber());
      }
    });
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch (e) {}
    return this;
  }
  async writeln(input) {
    await this.write(input + `
`);
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch (e) {}
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
  async onAbort(listener) {
    this.abortSubscribers.push(listener);
  }
};

// node_modules/hono/dist/context.js
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = (headers, map = {}) => {
  Object.entries(map).forEach(([key, value]) => headers.set(key, value));
  return headers;
};
var _status;
var _executionCtx;
var _headers;
var _preparedHeaders;
var _res;
var _isFresh;
var Context = class {
  constructor(req, options) {
    this.env = {};
    this._var = {};
    this.finalized = false;
    this.error = undefined;
    __privateAdd(this, _status, 200);
    __privateAdd(this, _executionCtx, undefined);
    __privateAdd(this, _headers, undefined);
    __privateAdd(this, _preparedHeaders, undefined);
    __privateAdd(this, _res, undefined);
    __privateAdd(this, _isFresh, true);
    this.renderer = (content) => this.html(content);
    this.notFoundHandler = () => new Response;
    this.render = (...args) => this.renderer(...args);
    this.setRenderer = (renderer) => {
      this.renderer = renderer;
    };
    this.header = (name, value, options2) => {
      if (value === undefined) {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).delete(name);
        } else if (__privateGet(this, _preparedHeaders)) {
          delete __privateGet(this, _preparedHeaders)[name.toLocaleLowerCase()];
        }
        if (this.finalized) {
          this.res.headers.delete(name);
        }
        return;
      }
      if (options2?.append) {
        if (!__privateGet(this, _headers)) {
          __privateSet(this, _isFresh, false);
          __privateSet(this, _headers, new Headers(__privateGet(this, _preparedHeaders)));
          __privateSet(this, _preparedHeaders, {});
        }
        __privateGet(this, _headers).append(name, value);
      } else {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).set(name, value);
        } else {
          __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
          __privateGet(this, _preparedHeaders)[name.toLowerCase()] = value;
        }
      }
      if (this.finalized) {
        if (options2?.append) {
          this.res.headers.append(name, value);
        } else {
          this.res.headers.set(name, value);
        }
      }
    };
    this.status = (status) => {
      __privateSet(this, _isFresh, false);
      __privateSet(this, _status, status);
    };
    this.set = (key, value) => {
      this._var ?? (this._var = {});
      this._var[key] = value;
    };
    this.get = (key) => {
      return this._var ? this._var[key] : undefined;
    };
    this.newResponse = (data, arg, headers) => {
      if (__privateGet(this, _isFresh) && !headers && !arg && __privateGet(this, _status) === 200) {
        return new Response(data, {
          headers: __privateGet(this, _preparedHeaders)
        });
      }
      if (arg && typeof arg !== "number") {
        const headers2 = setHeaders(new Headers(arg.headers), __privateGet(this, _preparedHeaders));
        return new Response(data, {
          headers: headers2,
          status: arg.status
        });
      }
      const status = typeof arg === "number" ? arg : __privateGet(this, _status);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers);
      setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      if (__privateGet(this, _res)) {
        __privateGet(this, _res).headers.forEach((v, k) => {
          __privateGet(this, _headers)?.set(k, v);
        });
        setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      }
      headers ?? (headers = {});
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          __privateGet(this, _headers).set(k, v);
        } else {
          __privateGet(this, _headers).delete(k);
          for (const v2 of v) {
            __privateGet(this, _headers).append(k, v2);
          }
        }
      }
      return new Response(data, {
        status,
        headers: __privateGet(this, _headers)
      });
    };
    this.body = (data, arg, headers) => {
      return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
    };
    this.text = (text, arg, headers) => {
      if (!__privateGet(this, _preparedHeaders)) {
        if (__privateGet(this, _isFresh) && !headers && !arg) {
          return new Response(text);
        }
        __privateSet(this, _preparedHeaders, {});
      }
      __privateGet(this, _preparedHeaders)["content-type"] = TEXT_PLAIN;
      return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
    };
    this.json = (object, arg, headers) => {
      const body = JSON.stringify(object);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "application/json; charset=UTF-8";
      return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
    };
    this.jsonT = (object, arg, headers) => {
      return this.json(object, arg, headers);
    };
    this.html = (html, arg, headers) => {
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "text/html; charset=UTF-8";
      if (typeof html === "object") {
        if (!(html instanceof Promise)) {
          html = html.toString();
        }
        if (html instanceof Promise) {
          return html.then((html2) => resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {})).then((html2) => {
            return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
          });
        }
      }
      return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
    };
    this.redirect = (location, status = 302) => {
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers);
      __privateGet(this, _headers).set("Location", location);
      return this.newResponse(null, status);
    };
    this.streamText = (cb, arg, headers) => {
      headers ?? (headers = {});
      this.header("content-type", TEXT_PLAIN);
      this.header("x-content-type-options", "nosniff");
      this.header("transfer-encoding", "chunked");
      return this.stream(cb, arg, headers);
    };
    this.stream = (cb, arg, headers) => {
      const { readable, writable } = new TransformStream;
      const stream = new StreamingApi(writable, readable);
      cb(stream).finally(() => stream.close());
      return typeof arg === "number" ? this.newResponse(stream.responseReadable, arg, headers) : this.newResponse(stream.responseReadable, arg);
    };
    this.cookie = (name, value, opt) => {
      const cookie = serialize(name, value, opt);
      this.header("set-cookie", cookie, { append: true });
    };
    this.notFound = () => {
      return this.notFoundHandler(this);
    };
    this.req = req;
    if (options) {
      __privateSet(this, _executionCtx, options.executionCtx);
      this.env = options.env;
      if (options.notFoundHandler) {
        this.notFoundHandler = options.notFoundHandler;
      }
    }
  }
  get event() {
    if (__privateGet(this, _executionCtx) && "respondWith" in __privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (__privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    __privateSet(this, _isFresh, false);
    return __privateGet(this, _res) || __privateSet(this, _res, new Response("404 Not Found", { status: 404 }));
  }
  set res(_res2) {
    __privateSet(this, _isFresh, false);
    if (__privateGet(this, _res) && _res2) {
      __privateGet(this, _res).headers.delete("content-type");
      for (const [k, v] of __privateGet(this, _res).headers.entries()) {
        if (k === "set-cookie") {
          const cookies = __privateGet(this, _res).headers.getSetCookie();
          _res2.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res2.headers.append("set-cookie", cookie);
          }
        } else {
          _res2.headers.set(k, v);
        }
      }
    }
    __privateSet(this, _res, _res2);
    this.finalized = true;
  }
  get var() {
    return { ...this._var };
  }
  get runtime() {
    const global = globalThis;
    if (global?.Deno !== undefined) {
      return "deno";
    }
    if (global?.Bun !== undefined) {
      return "bun";
    }
    if (typeof global?.WebSocketPair === "function") {
      return "workerd";
    }
    if (typeof global?.EdgeRuntime === "string") {
      return "edge-light";
    }
    if (global?.fastly !== undefined) {
      return "fastly";
    }
    if (global?.__lagon__ !== undefined) {
      return "lagon";
    }
    if (global?.process?.release?.name === "node") {
      return "node";
    }
    return "other";
  }
};
_status = new WeakMap;
_executionCtx = new WeakMap;
_headers = new WeakMap;
_preparedHeaders = new WeakMap;
_res = new WeakMap;
_isFresh = new WeakMap;

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        if (context instanceof Context) {
          context.req.routeIndex = i;
        }
      } else {
        handler = i === middleware.length && next || undefined;
      }
      if (!handler) {
        if (context instanceof Context && context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      } else {
        try {
          res = await handler(context, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && context instanceof Context && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  constructor(status = 500, options) {
    super(options?.message);
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      return this.res;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = { all: false }) => {
  const contentType = request.headers.get("Content-Type");
  if (isFormDataContent(contentType)) {
    return parseFormData(request, options);
  }
  return {};
};
function isFormDataContent(contentType) {
  if (contentType === null) {
    return false;
  }
  return contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded");
}
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = {};
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] && isArrayField(form[key])) {
    appendToExistingArray(form[key], value);
  } else if (form[key]) {
    convertToNewArray(form, key, value);
  } else {
    form[key] = value;
  }
};
function isArrayField(field) {
  return Array.isArray(field);
}
var appendToExistingArray = (arr, value) => {
  arr.push(value);
};
var convertToNewArray = (form, key, value) => {
  form[key] = [form[key], value];
};

// node_modules/hono/dist/request.js
var __accessCheck2 = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet2 = (obj, member, getter) => {
  __accessCheck2(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd2 = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet2 = (obj, member, value, setter) => {
  __accessCheck2(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _validatedData;
var _matchResult;
var HonoRequest = class {
  constructor(request, path = "/", matchResult = [[]]) {
    __privateAdd2(this, _validatedData, undefined);
    __privateAdd2(this, _matchResult, undefined);
    this.routeIndex = 0;
    this.bodyCache = {};
    this.cachedBody = (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
        return cachedBody;
      }
      if (bodyCache.arrayBuffer) {
        return (async () => {
          return await new Response(bodyCache.arrayBuffer)[key]();
        })();
      }
      return bodyCache[key] = raw2[key]();
    };
    this.raw = request;
    this.path = path;
    __privateSet2(this, _matchResult, matchResult);
    __privateSet2(this, _validatedData, {});
  }
  param(key) {
    return key ? this.getDecodedParam(key) : this.getAllDecodedParams();
  }
  getDecodedParam(key) {
    const paramKey = __privateGet2(this, _matchResult)[0][this.routeIndex][1][key];
    const param = this.getParamValue(paramKey);
    return param ? /\%/.test(param) ? decodeURIComponent_(param) : param : undefined;
  }
  getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(__privateGet2(this, _matchResult)[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.getParamValue(__privateGet2(this, _matchResult)[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? decodeURIComponent_(value) : value;
      }
    }
    return decoded;
  }
  getParamValue(paramKey) {
    return __privateGet2(this, _matchResult)[1] ? __privateGet2(this, _matchResult)[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name.toLowerCase()) ?? undefined;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  cookie(key) {
    const cookie = this.raw.headers.get("Cookie");
    if (!cookie) {
      return;
    }
    const obj = parse(cookie);
    if (key) {
      const value = obj[key];
      return value;
    } else {
      return obj;
    }
  }
  async parseBody(options) {
    if (this.bodyCache.parsedBody) {
      return this.bodyCache.parsedBody;
    }
    const parsedBody = await parseBody(this, options);
    this.bodyCache.parsedBody = parsedBody;
    return parsedBody;
  }
  json() {
    return this.cachedBody("json");
  }
  text() {
    return this.cachedBody("text");
  }
  arrayBuffer() {
    return this.cachedBody("arrayBuffer");
  }
  blob() {
    return this.cachedBody("blob");
  }
  formData() {
    return this.cachedBody("formData");
  }
  addValidatedData(target, data) {
    __privateGet2(this, _validatedData)[target] = data;
  }
  valid(target) {
    return __privateGet2(this, _validatedData)[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route);
  }
  get routePath() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
  get headers() {
    return this.raw.headers;
  }
  get body() {
    return this.raw.body;
  }
  get bodyUsed() {
    return this.raw.bodyUsed;
  }
  get integrity() {
    return this.raw.integrity;
  }
  get keepalive() {
    return this.raw.keepalive;
  }
  get referrer() {
    return this.raw.referrer;
  }
  get signal() {
    return this.raw.signal;
  }
};
_validatedData = new WeakMap;
_matchResult = new WeakMap;

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/hono-base.js
var __accessCheck3 = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet3 = (obj, member, getter) => {
  __accessCheck3(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd3 = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet3 = (obj, member, value, setter) => {
  __accessCheck3(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var COMPOSED_HANDLER = Symbol("composedHandler");
function defineDynamicClass() {
  return class {
  };
}
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  const message = "Internal Server Error";
  return c.text(message, 500);
};
var _path;
var _Hono = class extends defineDynamicClass() {
  constructor(options = {}) {
    super();
    this._basePath = "/";
    __privateAdd3(this, _path, "/");
    this.routes = [];
    this.notFoundHandler = notFoundHandler;
    this.errorHandler = errorHandler;
    this.onError = (handler) => {
      this.errorHandler = handler;
      return this;
    };
    this.notFound = (handler) => {
      this.notFoundHandler = handler;
      return this;
    };
    this.head = () => {
      console.warn("`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.");
      return this;
    };
    this.handleEvent = (event) => {
      return this.dispatch(event.request, event, undefined, event.request.method);
    };
    this.fetch = (request, Env, executionCtx) => {
      return this.dispatch(request, executionCtx, Env, request.method);
    };
    this.request = (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
        if (requestInit !== undefined) {
          input = new Request(input, requestInit);
        }
        return this.fetch(input, Env, executionCtx);
      }
      input = input.toString();
      const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
      const req = new Request(path, requestInit);
      return this.fetch(req, Env, executionCtx);
    };
    this.fire = () => {
      addEventListener("fetch", (event) => {
        event.respondWith(this.dispatch(event.request, event, undefined, event.request.method));
      });
    };
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.map((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          __privateSet3(this, _path, args1);
        } else {
          this.addRoute(method, __privateGet3(this, _path), args1);
        }
        args.map((handler) => {
          if (typeof handler !== "string") {
            this.addRoute(method, __privateGet3(this, _path), handler);
          }
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      if (!method) {
        return this;
      }
      __privateSet3(this, _path, path);
      for (const m of [method].flat()) {
        handlers.map((handler) => {
          this.addRoute(m.toUpperCase(), __privateGet3(this, _path), handler);
        });
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        __privateSet3(this, _path, arg1);
      } else {
        handlers.unshift(arg1);
      }
      handlers.map((handler) => {
        this.addRoute(METHOD_NAME_ALL, __privateGet3(this, _path), handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  route(path, app) {
    const subApp = this.basePath(path);
    if (!app) {
      return subApp;
    }
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  showRoutes() {
    const length = 8;
    this.routes.map((route) => {
      console.log(`\x1B[32m${route.method}\x1B[0m ${" ".repeat(length - route.method.length)} ${route.path}`);
    });
  }
  mount(path, applicationHandler, optionHandler) {
    const mergedPath = mergePath(this._basePath, path);
    const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
    const handler = async (c, next) => {
      let executionContext = undefined;
      try {
        executionContext = c.executionCtx;
      } catch {}
      const options = optionHandler ? optionHandler(c) : [c.env, executionContext];
      const optionsArray = Array.isArray(options) ? options : [options];
      const queryStrings = getQueryStrings(c.req.url);
      const res = await applicationHandler(new Request(new URL((c.req.path.slice(pathPrefixLength) || "/") + queryStrings, c.req.url), c.req.raw), ...optionsArray);
      if (res) {
        return res;
      }
      await next();
    };
    this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  get routerName() {
    this.matchRoute("GET", "/");
    return this.router.name;
  }
  addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  matchRoute(method, path) {
    return this.router.match(method, path);
  }
  handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.matchRoute(method, path);
    const c = new Context(new HonoRequest(request, path, matchResult), {
      env,
      executionCtx,
      notFoundHandler: this.notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.notFoundHandler(c);
        });
      } catch (err) {
        return this.handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.notFoundHandler(c))).catch((err) => this.handleError(err, c)) : res;
    }
    const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error("Context is not finalized. You may forget returning Response object or `await next()`");
        }
        return context.res;
      } catch (err) {
        return this.handleError(err, c);
      }
    })();
  }
};
var Hono = _Hono;
_path = new WeakMap;

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  constructor() {
    this.children = {};
  }
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.index !== undefined) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.children[regexpStr];
      if (!node) {
        if (Object.keys(this.children).some((k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[regexpStr] = new Node;
        if (name !== "") {
          node.varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.varIndex]);
      }
    } else {
      node = this.children[token];
      if (!node) {
        if (Object.keys(this.children).some((k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[token] = new Node;
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.children[k];
      return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
    });
    if (typeof this.index === "number") {
      strList.unshift(`#${this.index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  constructor() {
    this.context = { varIndex: 0 };
    this.root = new Node;
  }
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0;; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1;i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1;j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (typeof handlerIndex !== "undefined") {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (typeof paramIndex !== "undefined") {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var methodNames = [METHOD_NAME_ALL, ...METHODS].map((method) => method.toUpperCase());
var emptyParam = [];
var nullMatcher = [/^$/, [], {}];
var wildcardRegExpCache = {};
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ?? (wildcardRegExpCache[path] = new RegExp(path === "*" ? "" : `^${path.replace(/\/\*/, "(?:|/.*)")}$`));
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = {};
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie;
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map((route) => [!/\*|\/:/.test(route[0]), ...route]).sort(([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length);
  const staticMap = {};
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length;i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, {}]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = {};
      paramCount -= 1;
      for (;paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length;i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length;j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length;k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return;
}
var RegExpRouter = class {
  constructor() {
    this.name = "RegExpRouter";
    this.middleware = { [METHOD_NAME_ALL]: {} };
    this.routes = { [METHOD_NAME_ALL]: {} };
  }
  add(method, path, handler) {
    var _a;
    const { middleware, routes } = this;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (methodNames.indexOf(method) === -1) {
      methodNames.push(method);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = {};
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a2;
          (_a2 = middleware[m])[path] || (_a2[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a = middleware[method])[path] || (_a[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach((p) => re.test(p) && routes[m][p].push([handler, paramCount]));
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length;i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a2;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a2 = routes[m])[path2] || (_a2[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  buildAllMatchers() {
    const matchers = {};
    methodNames.forEach((method) => {
      matchers[method] = this.buildMatcher(method) || matchers[METHOD_NAME_ALL];
    });
    this.middleware = this.routes = undefined;
    return matchers;
  }
  buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute || (hasOwnRoute = true);
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]]));
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  constructor(init) {
    this.name = "SmartRouter";
    this.routers = [];
    this.routes = [];
    Object.assign(this, init);
  }
  add(method, path, handler) {
    if (!this.routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.routes) {
      throw new Error("Fatal error");
    }
    const { routers, routes } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (;i < len; i++) {
      const router = routers[i];
      try {
        routes.forEach((args) => {
          router.add(...args);
        });
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.routers = [router];
      this.routes = undefined;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.routes || this.routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var Node2 = class {
  constructor(method, handler, children) {
    this.order = 0;
    this.params = {};
    this.children = children || {};
    this.methods = [];
    this.name = "";
    if (method && handler) {
      const m = {};
      m[method] = { handler, possibleKeys: [], score: 0, name: this.name };
      this.methods = [m];
    }
    this.patterns = [];
  }
  insert(method, path, handler) {
    this.name = `${method} ${path}`;
    this.order = ++this.order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    const parentPatterns = [];
    for (let i = 0, len = parts.length;i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.children).includes(p)) {
        parentPatterns.push(...curNode.patterns);
        curNode = curNode.children[p];
        const pattern2 = getPattern(p);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.children[p] = new Node2;
      const pattern = getPattern(p);
      if (pattern) {
        curNode.patterns.push(pattern);
        parentPatterns.push(...curNode.patterns);
        possibleKeys.push(pattern[1]);
      }
      parentPatterns.push(...curNode.patterns);
      curNode = curNode.children[p];
    }
    if (!curNode.methods.length) {
      curNode.methods = [];
    }
    const m = {};
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      name: this.name,
      score: this.order
    };
    m[method] = handlerSet;
    curNode.methods.push(m);
    return curNode;
  }
  gHSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.methods.length;i < len; i++) {
      const m = node.methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== undefined) {
        handlerSet.params = {};
        handlerSet.possibleKeys.forEach((key) => {
          const processed = processedSet[handlerSet.name];
          handlerSet.params[key] = params[key] && !processed ? params[key] : nodeParams[key] ?? params[key];
          processedSet[handlerSet.name] = true;
        });
        handlerSets.push(handlerSet);
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.params = {};
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length;i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length;j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.children[part];
        if (nextNode) {
          nextNode.params = node.params;
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(...this.gHSets(nextNode.children["*"], method, node.params, {}));
            }
            handlerSets.push(...this.gHSets(nextNode, method, node.params, {}));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.patterns.length;k < len3; k++) {
          const pattern = node.patterns[k];
          const params = { ...node.params };
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.gHSets(astNode, method, node.params, {}));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.gHSets(child, method, node.params, params));
            continue;
          }
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              params[name] = part;
              if (isLast === true) {
                handlerSets.push(...this.gHSets(child, method, params, node.params));
                if (child.children["*"]) {
                  handlerSets.push(...this.gHSets(child.children["*"], method, params, node.params));
                }
              } else {
                child.params = params;
                tempNodes.push(child);
              }
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    const results = handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [results.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  constructor() {
    this.name = "TrieRouter";
    this.node = new Node2;
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (const p of results) {
        this.node.insert(method, p, handler);
      }
      return;
    }
    this.node.insert(method, path, handler);
  }
  match(method, path) {
    return this.node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter, new TrieRouter]
    });
  }
};

// node_modules/zod/dist/esm/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// node_modules/zod/dist/esm/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/dist/esm/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/dist/esm/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/dist/esm/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// node_modules/zod/dist/esm/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// node_modules/zod/dist/esm/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/dist/esm/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// node_modules/@hono/zod-openapi/dist/index.js
var OpenAPIHono = class _OpenAPIHono extends Hono2 {
  openAPIRegistry;
  defaultHook;
  constructor(init) {
    super(init);
    this.openAPIRegistry = new OpenAPIRegistry;
    this.defaultHook = init?.defaultHook;
  }
  openapi = ({ middleware: routeMiddleware, hide, ...route }, handler, hook = this.defaultHook) => {
    if (!hide) {
      this.openAPIRegistry.registerPath(route);
    }
    const validators = [];
    if (route.request?.query) {
      const validator2 = zValidator("query", route.request.query, hook);
      validators.push(validator2);
    }
    if (route.request?.params) {
      const validator2 = zValidator("param", route.request.params, hook);
      validators.push(validator2);
    }
    if (route.request?.headers) {
      const validator2 = zValidator("header", route.request.headers, hook);
      validators.push(validator2);
    }
    if (route.request?.cookies) {
      const validator2 = zValidator("cookie", route.request.cookies, hook);
      validators.push(validator2);
    }
    const bodyContent = route.request?.body?.content;
    if (bodyContent) {
      for (const mediaType of Object.keys(bodyContent)) {
        if (!bodyContent[mediaType]) {
          continue;
        }
        const schema = bodyContent[mediaType]["schema"];
        if (!(schema instanceof ZodType)) {
          continue;
        }
        if (isJSONContentType(mediaType)) {
          const validator2 = zValidator("json", schema, hook);
          if (route.request?.body?.required) {
            validators.push(validator2);
          } else {
            const mw = async (c, next) => {
              if (c.req.header("content-type")) {
                if (isJSONContentType(c.req.header("content-type"))) {
                  return await validator2(c, next);
                }
              }
              c.req.addValidatedData("json", {});
              await next();
            };
            validators.push(mw);
          }
        }
        if (isFormContentType(mediaType)) {
          const validator2 = zValidator("form", schema, hook);
          if (route.request?.body?.required) {
            validators.push(validator2);
          } else {
            const mw = async (c, next) => {
              if (c.req.header("content-type")) {
                if (isFormContentType(c.req.header("content-type"))) {
                  return await validator2(c, next);
                }
              }
              c.req.addValidatedData("form", {});
              await next();
            };
            validators.push(mw);
          }
        }
      }
    }
    const middleware = routeMiddleware ? Array.isArray(routeMiddleware) ? routeMiddleware : [routeMiddleware] : [];
    this.on([route.method], route.path.replaceAll(/\/{(.+?)}/g, "/:$1"), ...middleware, ...validators, handler);
    return this;
  };
  getOpenAPIDocument = (config) => {
    const generator = new OpenApiGeneratorV3(this.openAPIRegistry.definitions);
    const document = generator.generateDocument(config);
    return this._basePath ? addBasePathToDocument(document, this._basePath) : document;
  };
  getOpenAPI31Document = (config) => {
    const generator = new OpenApiGeneratorV31(this.openAPIRegistry.definitions);
    const document = generator.generateDocument(config);
    return this._basePath ? addBasePathToDocument(document, this._basePath) : document;
  };
  doc = (path, configure) => {
    return this.get(path, (c) => {
      const config = typeof configure === "function" ? configure(c) : configure;
      try {
        const document = this.getOpenAPIDocument(config);
        return c.json(document);
      } catch (e) {
        return c.json(e, 500);
      }
    });
  };
  doc31 = (path, configure) => {
    return this.get(path, (c) => {
      const config = typeof configure === "function" ? configure(c) : configure;
      try {
        const document = this.getOpenAPI31Document(config);
        return c.json(document);
      } catch (e) {
        return c.json(e, 500);
      }
    });
  };
  route(path, app) {
    const pathForOpenAPI = path.replaceAll(/:([^\/]+)/g, "{$1}");
    super.route(path, app);
    if (!(app instanceof _OpenAPIHono)) {
      return this;
    }
    app.openAPIRegistry.definitions.forEach((def) => {
      switch (def.type) {
        case "component":
          return this.openAPIRegistry.registerComponent(def.componentType, def.name, def.component);
        case "route":
          return this.openAPIRegistry.registerPath({
            ...def.route,
            path: mergePath(pathForOpenAPI, app._basePath.replaceAll(/:([^\/]+)/g, "{$1}"), def.route.path)
          });
        case "webhook":
          return this.openAPIRegistry.registerWebhook({
            ...def.webhook,
            path: mergePath(pathForOpenAPI, app._basePath.replaceAll(/:([^\/]+)/g, "{$1}"), def.webhook.path)
          });
        case "schema":
          return this.openAPIRegistry.register(def.schema._def.openapi._internal.refId, def.schema);
        case "parameter":
          return this.openAPIRegistry.registerParameter(def.schema._def.openapi._internal.refId, def.schema);
        default: {
          const errorIfNotExhaustive = def;
          throw new Error(`Unknown registry type: ${errorIfNotExhaustive}`);
        }
      }
    });
    return this;
  }
  basePath(path) {
    return new _OpenAPIHono({ ...super.basePath(path), defaultHook: this.defaultHook });
  }
};
var createRoute = (routeConfig) => {
  const route = {
    ...routeConfig,
    getRoutingPath() {
      return routeConfig.path.replaceAll(/\/{(.+?)}/g, "/:$1");
    }
  };
  return Object.defineProperty(route, "getRoutingPath", { enumerable: false });
};
extendZodWithOpenApi(exports_external);
function addBasePathToDocument(document, basePath) {
  const updatedPaths = {};
  Object.keys(document.paths).forEach((path) => {
    updatedPaths[mergePath(basePath.replaceAll(/:([^\/]+)/g, "{$1}"), path)] = document.paths[path];
  });
  return {
    ...document,
    paths: updatedPaths
  };
}
function isJSONContentType(contentType) {
  return /^application\/([a-z-\.]+\+)?json/.test(contentType);
}
function isFormContentType(contentType) {
  return contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded");
}

// node_modules/postgres/src/index.js
import os from "os";
import fs from "fs";

// node_modules/postgres/src/query.js
var originCache = new Map;
var originStackCache = new Map;
var originError = Symbol("OriginError");
var CLOSE = {};

class Query extends Promise {
  constructor(strings, args, handler, canceller, options = {}) {
    let resolve, reject;
    super((a, b) => {
      resolve = a;
      reject = b;
    });
    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler;
    this.canceller = canceller;
    this.options = options;
    this.state = null;
    this.statement = null;
    this.resolve = (x) => (this.active = false, resolve(x));
    this.reject = (x) => (this.active = false, reject(x));
    this.active = false;
    this.cancelled = null;
    this.executed = false;
    this.signature = "";
    this[originError] = this.handler.debug ? new Error : this.tagged && cachedError(this.strings);
  }
  get origin() {
    return (this.handler.debug ? this[originError].stack : this.tagged && originStackCache.has(this.strings) ? originStackCache.get(this.strings) : originStackCache.set(this.strings, this[originError].stack).get(this.strings)) || "";
  }
  static get [Symbol.species]() {
    return Promise;
  }
  cancel() {
    return this.canceller && (this.canceller(this), this.canceller = null);
  }
  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }
  async readable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  async writable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === "function") {
      fn = rows;
      rows = 1;
    }
    this.cursorRows = rows;
    if (typeof fn === "function")
      return this.cursorFn = fn, this;
    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (this.executed && !this.active)
            return { done: true };
          prev && prev();
          const promise = new Promise((resolve, reject) => {
            this.cursorFn = (value) => {
              resolve({ value, done: false });
              return new Promise((r) => prev = r);
            };
            this.resolve = () => (this.active = false, resolve({ done: true }));
            this.reject = (x) => (this.active = false, reject(x));
          });
          this.execute();
          return promise;
        },
        return() {
          prev && prev(CLOSE);
          return { done: true };
        }
      })
    };
  }
  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this;
  }
  stream() {
    throw new Error(".stream has been renamed to .forEach");
  }
  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this;
  }
  raw() {
    this.isRaw = true;
    return this;
  }
  values() {
    this.isRaw = "values";
    return this;
  }
  async handle() {
    !this.executed && (this.executed = true) && await 1 && this.handler(this);
  }
  execute() {
    this.handle();
    return this;
  }
  then() {
    this.handle();
    return super.then.apply(this, arguments);
  }
  catch() {
    this.handle();
    return super.catch.apply(this, arguments);
  }
  finally() {
    this.handle();
    return super.finally.apply(this, arguments);
  }
}
function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs);
  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error);
  Error.stackTraceLimit = x;
  return originCache.get(xs);
}

// node_modules/postgres/src/errors.js
class PostgresError extends Error {
  constructor(x) {
    super(x.message);
    this.name = this.constructor.name;
    Object.assign(this, x);
  }
}
var Errors = {
  connection,
  postgres,
  generic,
  notSupported
};
function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(new Error("write " + x + " " + (options.path || host + ":" + port)), {
    code: x,
    errno: x,
    address: options.path || host
  }, options.path ? {} : { port });
  Error.captureStackTrace(error, connection);
  return error;
}
function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error;
}
function generic(code, message) {
  const error = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error, generic);
  return error;
}
function notSupported(x) {
  const error = Object.assign(new Error(x + " (B) is not supported"), {
    code: "MESSAGE_NOT_SUPPORTED",
    name: x
  });
  Error.captureStackTrace(error, notSupported);
  return error;
}

// node_modules/postgres/src/types.js
var types2 = {
  string: {
    to: 25,
    from: null,
    serialize: (x) => "" + x
  },
  number: {
    to: 0,
    from: [21, 23, 26, 700, 701],
    serialize: (x) => "" + x,
    parse: (x) => +x
  },
  json: {
    to: 114,
    from: [114, 3802],
    serialize: (x) => JSON.stringify(x),
    parse: (x) => JSON.parse(x)
  },
  boolean: {
    to: 16,
    from: 16,
    serialize: (x) => x === true ? "t" : "f",
    parse: (x) => x === "t"
  },
  date: {
    to: 1184,
    from: [1082, 1114, 1184],
    serialize: (x) => (x instanceof Date ? x : new Date(x)).toISOString(),
    parse: (x) => new Date(x)
  },
  bytea: {
    to: 17,
    from: 17,
    serialize: (x) => "\\x" + Buffer.from(x).toString("hex"),
    parse: (x) => Buffer.from(x.slice(2), "hex")
  }
};

class NotTagged {
  then() {
    notTagged();
  }
  catch() {
    notTagged();
  }
  finally() {
    notTagged();
  }
}

class Identifier extends NotTagged {
  constructor(value) {
    super();
    this.value = escapeIdentifier(value);
  }
}

class Parameter extends NotTagged {
  constructor(value, type, array) {
    super();
    this.value = value;
    this.type = type;
    this.array = array;
  }
}

class Builder extends NotTagged {
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }
  build(before, parameters, types3, options) {
    const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b) => a.i - b.i).pop();
    return keyword.i === -1 ? escapeIdentifiers(this.first, options) : keyword.fn(this.first, this.rest, parameters, types3, options);
  }
}
function handleValue(x, parameters, types3, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === undefined) {
    x instanceof Parameter ? x.value = options.transform.undefined : value = x = options.transform.undefined;
    if (value === undefined)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
  }
  return "$" + types3.push(x instanceof Parameter ? (parameters.push(x.value), x.array ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value) : x.type) : (parameters.push(x), inferType(x)));
}
var defaultHandlers = typeHandlers(types2);
function stringify(q, string, value, parameters, types3, options) {
  for (let i = 1;i < q.strings.length; i++) {
    string += stringifyValue(string, value, parameters, types3, options) + q.strings[i];
    value = q.args[i];
  }
  return string;
}
function stringifyValue(string, value, parameters, types3, o) {
  return value instanceof Builder ? value.build(string, parameters, types3, o) : value instanceof Query ? fragment(value, parameters, types3, o) : value instanceof Identifier ? value.value : value && value[0] instanceof Query ? value.reduce((acc, x) => acc + " " + fragment(x, parameters, types3, o), "") : handleValue(value, parameters, types3, o);
}
function fragment(q, parameters, types3, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types3, options);
}
function valuesBuilder(first, parameters, types3, columns, options) {
  return first.map((row) => "(" + columns.map((column) => stringifyValue("values", row[column], parameters, types3, options)).join(",") + ")").join(",");
}
function values(first, rest, parameters, types3, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types3, columns, options);
}
function select(first, rest, parameters, types3, options) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options);
  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map((x) => {
    value = first[x];
    return (value instanceof Query ? fragment(value, parameters, types3, options) : value instanceof Identifier ? value.value : handleValue(value, parameters, types3, options)) + " as " + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x);
  }).join(",");
}
var builders = Object.entries({
  values,
  in: (...xs) => {
    const x = values(...xs);
    return x === "()" ? "(null)" : x;
  },
  select,
  as: select,
  returning: select,
  "\\(": select,
  update(first, rest, parameters, types3, options) {
    return (rest.length ? rest.flat() : Object.keys(first)).map((x) => escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) + "=" + stringifyValue("values", first[x], parameters, types3, options));
  },
  insert(first, rest, parameters, types3, options) {
    const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
    return "(" + escapeIdentifiers(columns, options) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], parameters, types3, columns, options);
  }
}).map(([x, fn]) => [new RegExp("((?:^|[\\s(])" + x + "(?:$|[\\s(]))(?![\\s\\S]*\\1)", "i"), fn]);
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
var serializers = defaultHandlers.serializers;
var parsers = defaultHandlers.parsers;
function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0]);
  return typeof x === "string" ? 1009 : 0;
}
var mergeUserTypes = function(types3) {
  const user = typeHandlers(types3 || {});
  return {
    serializers: Object.assign({}, serializers, user.serializers),
    parsers: Object.assign({}, parsers, user.parsers)
  };
};
function typeHandlers(types3) {
  return Object.keys(types3).reduce((acc, k) => {
    types3[k].from && [].concat(types3[k].from).forEach((x) => acc.parsers[x] = types3[k].parse);
    if (types3[k].serialize) {
      acc.serializers[types3[k].to] = types3[k].serialize;
      types3[k].from && [].concat(types3[k].from).forEach((x) => acc.serializers[x] = types3[k].serialize);
    }
    return acc;
  }, { parsers: {}, serializers: {} });
}
function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map((x) => escapeIdentifier(column.to ? column.to(x) : x)).join(",");
}
var escapeIdentifier = function escape(str) {
  return '"' + str.replace(/"/g, '""').replace(/\./g, '"."') + '"';
};
var inferType = function inferType2(x) {
  return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? inferType2(x[0]) : 0;
};
var escapeBackslash = /\\/g;
var escapeQuote = /"/g;
function arrayEscape(x) {
  return x.replace(escapeBackslash, "\\\\").replace(escapeQuote, "\\\"");
}
var arraySerializer = function arraySerializer2(xs, serializer, options, typarray) {
  if (Array.isArray(xs) === false)
    return xs;
  if (!xs.length)
    return "{}";
  const first = xs[0];
  const delimiter = typarray === 1020 ? ";" : ",";
  if (Array.isArray(first) && !first.type)
    return "{" + xs.map((x) => arraySerializer2(x, serializer, options, typarray)).join(delimiter) + "}";
  return "{" + xs.map((x) => {
    if (x === undefined) {
      x = options.transform.undefined;
      if (x === undefined)
        throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    }
    return x === null ? "null" : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : "" + x) + '"';
  }).join(delimiter) + "}";
};
var arrayParserState = {
  i: 0,
  char: null,
  str: "",
  quoted: false,
  last: 0
};
var arrayParser = function arrayParser2(x, parser, typarray) {
  arrayParserState.i = arrayParserState.last = 0;
  return arrayParserLoop(arrayParserState, x, parser, typarray);
};
function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  const delimiter = typarray === 1020 ? ";" : ",";
  for (;s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === "\\") {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = "";
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === "{") {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === "}") {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break;
    } else if (s.char === delimiter && s.p !== "}" && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs;
}
var toCamel = (x) => {
  let str = x[0];
  for (let i = 1;i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toPascal = (x) => {
  let str = x[0].toUpperCase();
  for (let i = 1;i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toKebab = (x) => x.replace(/_/g, "-");
var fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
var fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
var fromKebab = (x) => x.replace(/-/g, "_");
function createJsonTransform(fn) {
  return function jsonTransform(x, column) {
    return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
  };
}
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
var camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
var pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
var kebab = { ...toKebab };
kebab.column.to = fromKebab;

// node_modules/postgres/src/connection.js
import net from "net";
import tls from "tls";
import crypto2 from "crypto";
import Stream from "stream";
import { performance } from "perf_hooks";

// node_modules/postgres/src/result.js
class Result extends Array {
  constructor() {
    super();
    Object.defineProperties(this, {
      count: { value: null, writable: true },
      state: { value: null, writable: true },
      command: { value: null, writable: true },
      columns: { value: null, writable: true },
      statement: { value: null, writable: true }
    });
  }
  static get [Symbol.species]() {
    return Array;
  }
}

// node_modules/postgres/src/queue.js
var queue_default = Queue;
function Queue(initial = []) {
  let xs = initial.slice();
  let index = 0;
  return {
    get length() {
      return xs.length - index;
    },
    remove: (x) => {
      const index2 = xs.indexOf(x);
      return index2 === -1 ? null : (xs.splice(index2, 1), x);
    },
    push: (x) => (xs.push(x), x),
    shift: () => {
      const out = xs[index++];
      if (index === xs.length) {
        index = 0;
        xs = [];
      } else {
        xs[index - 1] = undefined;
      }
      return out;
    }
  };
}

// node_modules/postgres/src/bytes.js
var size = 256;
var buffer = Buffer.allocUnsafe(size);
var messages = "BCcDdEFfHPpQSX".split("").reduce((acc, x) => {
  const v = x.charCodeAt(0);
  acc[x] = () => {
    buffer[0] = v;
    b.i = 5;
    return b;
  };
  return acc;
}, {});
var b = Object.assign(reset, messages, {
  N: String.fromCharCode(0),
  i: 0,
  inc(x) {
    b.i += x;
    return b;
  },
  str(x) {
    const length = Buffer.byteLength(x);
    fit(length);
    b.i += buffer.write(x, b.i, length, "utf8");
    return b;
  },
  i16(x) {
    fit(2);
    buffer.writeUInt16BE(x, b.i);
    b.i += 2;
    return b;
  },
  i32(x, i) {
    if (i || i === 0) {
      buffer.writeUInt32BE(x, i);
      return b;
    }
    fit(4);
    buffer.writeUInt32BE(x, b.i);
    b.i += 4;
    return b;
  },
  z(x) {
    fit(x);
    buffer.fill(0, b.i, b.i + x);
    b.i += x;
    return b;
  },
  raw(x) {
    buffer = Buffer.concat([buffer.subarray(0, b.i), x]);
    b.i = buffer.length;
    return b;
  },
  end(at = 1) {
    buffer.writeUInt32BE(b.i - at, at);
    const out = buffer.subarray(0, b.i);
    b.i = 0;
    buffer = Buffer.allocUnsafe(size);
    return out;
  }
});
var bytes_default = b;
function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer, length = prev.length;
    buffer = Buffer.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}
function reset() {
  b.i = 0;
  return b;
}

// node_modules/postgres/src/connection.js
var connection_default = Connection;
var uid = 1;
var Sync = bytes_default().S().end();
var Flush = bytes_default().H().end();
var SSLRequest = bytes_default().i32(8).i32(80877103).end(8);
var ExecuteUnnamed = Buffer.concat([bytes_default().E().str(bytes_default.N).i32(0).end(), Sync]);
var DescribeUnnamed = bytes_default().D().str("S").str(bytes_default.N).end();
var noop = () => {};
var retryRoutines = new Set([
  "FetchPreparedStatement",
  "RevalidateCachedQuery",
  "transformAssignedExpr"
]);
var errorFields = {
  83: "severity_local",
  86: "severity",
  67: "code",
  77: "message",
  68: "detail",
  72: "hint",
  80: "position",
  112: "internal_position",
  113: "internal_query",
  87: "where",
  115: "schema_name",
  116: "table_name",
  99: "column_name",
  100: "data type_name",
  110: "constraint_name",
  70: "file",
  76: "line",
  82: "routine"
};
function Connection(options, queues = {}, { onopen = noop, onend = noop, onclose = noop } = {}) {
  const {
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers: parsers2,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff,
    target_session_attrs
  } = options;
  const sent = queue_default(), id = uid++, backend = { pid: null, secret: null }, idleTimer = timer(end, options.idle_timeout), lifeTimer = timer(end, options.max_lifetime), connectTimer = timer(connectTimedOut, options.connect_timeout);
  let socket = null, cancelMessage, result = new Result, incoming = Buffer.alloc(0), needsTypes = options.fetch_types, backendParameters = {}, statements = {}, statementId = Math.random().toString(36).slice(2), statementCount = 1, closedDate = 0, remaining = 0, hostIndex = 0, retries = 0, length = 0, delay = 0, rows = 0, serverSignature = null, nextWriteTimer = null, terminated = false, incomings = null, results = null, initial = null, ending = null, stream = null, chunk = null, ended = null, nonce = null, query = null, final = null;
  const connection2 = {
    queue: queues.closed,
    idleTimer,
    connect(query2) {
      initial = query2;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };
  queues.closed && queues.closed.push(connection2);
  return connection2;
  async function createSocket() {
    let x;
    try {
      x = options.socket ? await Promise.resolve(options.socket(options)) : new net.Socket;
    } catch (e) {
      error(e);
      return;
    }
    x.on("error", error);
    x.on("close", closed);
    x.on("drain", drain);
    return x;
  }
  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = bytes_default().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once("error", reject);
      socket.once("close", resolve);
    } catch (error2) {
      reject(error2);
    }
  }
  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection("CONNECTION_DESTROYED", options));
    if (q.cancelled)
      return;
    try {
      q.state = backend;
      query ? sent.push(q) : (query = q, query.active = true);
      build(q);
      return write(toBuffer(q)) && !q.describeFirst && !q.cursorFn && sent.length < max_pipeline && (!q.options.onexecute || q.options.onexecute(connection2));
    } catch (error2) {
      sent.length === 0 && write(Sync);
      errored(error2);
      return true;
    }
  }
  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
    return q.options.simple ? bytes_default().Q().str(q.statement.string + bytes_default.N).end() : q.describeFirst ? Buffer.concat([describe(q), Flush]) : q.prepare ? q.prepared ? prepared(q) : Buffer.concat([describe(q), prepared(q)]) : unnamed(q);
  }
  function describe(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe("S", q.statement.name)
    ]);
  }
  function prepared(q) {
    return Buffer.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn ? Execute("", q.cursorRows) : ExecuteUnnamed
    ]);
  }
  function unnamed(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ]);
  }
  function build(q) {
    const parameters = [], types3 = [];
    const string = stringify(q, q.strings[0], q.args[0], parameters, types3, options);
    !q.tagged && q.args.forEach((x) => handleValue(x, parameters, types3, options));
    q.prepare = options.prepare && ("prepare" in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types3 + string;
    q.onlyDescribe && delete statements[q.signature];
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || parameters.length && !q.prepared;
    q.statement = q.prepared ? statements[q.signature] : { string, types: types3, name: q.prepare ? statementId + statementCount++ : "" };
    typeof options.debug === "function" && options.debug(id, string, parameters, types3);
  }
  function write(x, fn) {
    chunk = chunk ? Buffer.concat([chunk, x]) : Buffer.from(x);
    if (fn || chunk.length >= 1024)
      return nextWrite(fn);
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true;
  }
  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x;
  }
  function connectTimedOut() {
    errored(Errors.connection("CONNECT_TIMEOUT", options, socket));
    socket.destroy();
  }
  async function secure() {
    write(SSLRequest);
    const canSSL = await new Promise((r) => socket.once("data", (x) => r(x[0] === 83)));
    if (!canSSL && ssl === "prefer")
      return connected();
    socket.removeAllListeners();
    socket = tls.connect({
      socket,
      servername: net.isIP(socket.host) ? undefined : socket.host,
      ...ssl === "require" || ssl === "allow" || ssl === "prefer" ? { rejectUnauthorized: false } : ssl === "verify-full" ? {} : typeof ssl === "object" ? ssl : {}
    });
    socket.on("secureConnect", connected);
    socket.on("error", error);
    socket.on("close", closed);
    socket.on("drain", drain);
  }
  function drain() {
    !query && onopen(connection2);
  }
  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return;
    }
    incoming = incomings ? Buffer.concat(incomings, length - remaining) : incoming.length === 0 ? x : Buffer.concat([incoming, x], incoming.length + x.length);
    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break;
      }
      try {
        handle(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }
  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());
    if (!socket)
      return;
    connectTimer.start();
    if (options.socket)
      return ssl ? secure() : connected();
    socket.on("connect", ssl ? secure : connected);
    if (options.path)
      return socket.connect(options.path);
    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];
    hostIndex = (hostIndex + 1) % port.length;
  }
  function reconnect() {
    setTimeout(connect, closedDate ? closedDate + delay - performance.now() : 0);
  }
  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on("data", data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1000 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err) {
      error(err);
    }
  }
  function error(err) {
    if (connection2.queue === queues.connecting && options.host[retries + 1])
      return;
    errored(err);
    while (sent.length)
      queryError(sent.shift(), err);
  }
  function errored(err) {
    stream && (stream.destroy(err), stream = null);
    query && queryError(query, err);
    initial && (queryError(initial, err), initial = null);
  }
  function queryError(query2, err) {
    if (query2.reserve)
      return query2.reject(err);
    if (!err || typeof err !== "object")
      err = new Error(err);
    "query" in err || "parameters" in err || Object.defineProperties(err, {
      stack: { value: err.stack + query2.origin.replace(/.*\n/, `
`), enumerable: options.debug },
      query: { value: query2.string, enumerable: options.debug },
      parameters: { value: query2.parameters, enumerable: options.debug },
      args: { value: query2.args, enumerable: options.debug },
      types: { value: query2.statement && query2.statement.types, enumerable: options.debug }
    });
    query2.reject(err);
  }
  function end() {
    return ending || (!connection2.reserved && onend(connection2), !connection2.reserved && !initial && !query && sent.length === 0 ? (terminate(), new Promise((r) => socket && socket.readyState !== "closed" ? socket.once("close", r) : r())) : ending = new Promise((r) => ended = r));
  }
  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection("CONNECTION_DESTROYED", options));
    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener("data", data);
      socket.removeListener("connect", connected);
      socket.readyState === "open" && socket.end(bytes_default().X().end());
    }
    ended && (ended(), ending = ended = null);
  }
  async function closed(hadError) {
    incoming = Buffer.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener("data", data);
    socket.removeListener("connect", connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();
    socket.removeAllListeners();
    socket = null;
    if (initial)
      return reconnect();
    !hadError && (query || sent.length) && error(Errors.connection("CONNECTION_CLOSED", options, socket));
    closedDate = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff === "function" ? backoff(options.shared.retries) : backoff) * 1000;
    onclose(connection2, Errors.connection("CONNECTION_CLOSED", options, socket));
  }
  function handle(xs, x = xs[0]) {
    (x === 68 ? DataRow : x === 100 ? CopyData : x === 65 ? NotificationResponse : x === 83 ? ParameterStatus : x === 90 ? ReadyForQuery : x === 67 ? CommandComplete : x === 50 ? BindComplete : x === 49 ? ParseComplete : x === 116 ? ParameterDescription : x === 84 ? RowDescription : x === 82 ? Authentication : x === 110 ? NoData : x === 75 ? BackendKeyData : x === 69 ? ErrorResponse : x === 115 ? PortalSuspended : x === 51 ? CloseComplete : x === 71 ? CopyInResponse : x === 78 ? NoticeResponse : x === 72 ? CopyOutResponse : x === 99 ? CopyDone : x === 73 ? EmptyQueryResponse : x === 86 ? FunctionCallResponse : x === 118 ? NegotiateProtocolVersion : x === 87 ? CopyBothResponse : UnknownMessage)(xs);
  }
  function DataRow(x) {
    let index = 7;
    let length2;
    let column;
    let value;
    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0;i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length2 = x.readInt32BE(index);
      index += 4;
      value = length2 === -1 ? null : query.isRaw === true ? x.subarray(index, index += length2) : column.parser === undefined ? x.toString("utf8", index, index += length2) : column.parser.array === true ? column.parser(x.toString("utf8", index + 1, index += length2)) : column.parser(x.toString("utf8", index, index += length2));
      query.isRaw ? row[i] = query.isRaw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
    }
    query.forEachFn ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result) : result[rows++] = transform.row.from ? transform.row.from(row) : row;
  }
  function ParameterStatus(x) {
    const [k, v] = x.toString("utf8", 5, x.length - 1).split(bytes_default.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }
  function ReadyForQuery(x) {
    query && query.options.simple && query.resolve(results || result);
    query = results = null;
    result = new Result;
    connectTimer.cancel();
    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState();
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate();
      }
      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes();
      }
      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return;
    }
    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);
    if (query)
      return;
    connection2.reserved ? !connection2.reserved.release && x[5] === 73 ? ending ? terminate() : (connection2.reserved = null, onopen(connection2)) : connection2.reserved() : ending ? terminate() : onopen(connection2);
  }
  function CommandComplete(x) {
    rows = 0;
    for (let i = x.length - 1;i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString("utf8", i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString("utf8", 5, i);
        result.state = backend;
        break;
      }
    }
    final && (final(), final = null);
    if (result.command === "BEGIN" && max !== 1 && !connection2.reserved)
      return errored(Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1"));
    if (query.options.simple)
      return BindComplete();
    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }
    query.resolve(result);
  }
  function ParseComplete() {
    query.parsing = false;
  }
  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }
  function ParameterDescription(x) {
    const length2 = x.readUInt16BE(5);
    for (let i = 0;i < length2; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));
    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }
  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result);
      result.count = null;
      query.statement.columns = null;
    }
    const length2 = x.readUInt16BE(5);
    let index = 7;
    let start;
    query.statement.columns = Array(length2);
    for (let i = 0;i < length2; ++i) {
      start = index;
      while (x[index++] !== 0)
        ;
      const table = x.readUInt32BE(index);
      const number = x.readUInt16BE(index + 4);
      const type = x.readUInt32BE(index + 6);
      query.statement.columns[i] = {
        name: transform.column.from ? transform.column.from(x.toString("utf8", start, index - 1)) : x.toString("utf8", start, index - 1),
        parser: parsers2[type],
        table,
        number,
        type
      };
      index += 18;
    }
    result.statement = query.statement;
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  async function Authentication(x, type = x.readUInt32BE(5)) {
    (type === 3 ? AuthenticationCleartextPassword : type === 5 ? AuthenticationMD5Password : type === 10 ? SASL : type === 11 ? SASLContinue : type === 12 ? SASLFinal : type !== 0 ? UnknownAuth : noop)(x, type);
  }
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(bytes_default().p().str(payload).z(1).end());
  }
  async function AuthenticationMD5Password(x) {
    const payload = "md5" + await md5(Buffer.concat([
      Buffer.from(await md5(await Pass() + user)),
      x.subarray(9)
    ]));
    write(bytes_default().p().str(payload).z(1).end());
  }
  async function SASL() {
    nonce = (await crypto2.randomBytes(18)).toString("base64");
    bytes_default().p().str("SCRAM-SHA-256" + bytes_default.N);
    const i = bytes_default.i;
    write(bytes_default.inc(4).str("n,,n=*,r=" + nonce).i32(bytes_default.i - i - 4, i).end());
  }
  async function SASLContinue(x) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {});
    const saltedPassword = await crypto2.pbkdf2Sync(await Pass(), Buffer.from(res.s, "base64"), parseInt(res.i), 32, "sha256");
    const clientKey = await hmac(saltedPassword, "Client Key");
    const auth = "n=*,r=" + nonce + "," + "r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=biws,r=" + res.r;
    serverSignature = (await hmac(await hmac(saltedPassword, "Server Key"), auth)).toString("base64");
    const payload = "c=biws,r=" + res.r + ",p=" + xor(clientKey, Buffer.from(await hmac(await sha2562(clientKey), auth))).toString("base64");
    write(bytes_default().p().str(payload).end());
  }
  function SASLFinal(x) {
    if (x.toString("utf8", 9).split(bytes_default.N, 1)[0].slice(2) === serverSignature)
      return;
    errored(Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature"));
    socket.destroy();
  }
  function Pass() {
    return Promise.resolve(typeof options.pass === "function" ? options.pass() : options.pass);
  }
  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }
  async function fetchArrayTypes() {
    needsTypes = false;
    const types3 = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types3.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }
  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray])
      return;
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }
  function tryNext(x, xs) {
    return x === "read-write" && xs.default_transaction_read_only === "on" || x === "read-only" && xs.default_transaction_read_only === "off" || x === "primary" && xs.in_hot_standby === "on" || x === "standby" && xs.in_hot_standby === "off" || x === "prefer-standby" && xs.in_hot_standby === "off" && options.host[retries];
  }
  function fetchState() {
    const query2 = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query2.resolve = ([[a], [b2]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b2.pg_is_in_recovery ? "on" : "off";
    };
    query2.execute();
  }
  function ErrorResponse(x) {
    query && (query.cursorFn || query.describeFirst) && write(Sync);
    const error2 = Errors.postgres(parseError(x));
    query && query.retried ? errored(query.retried) : query && query.prepared && retryRoutines.has(error2.routine) ? retry(query, error2) : errored(error2);
  }
  function retry(q, error2) {
    delete statements[q.signature];
    q.retried = error2;
    execute(q);
  }
  function NotificationResponse(x) {
    if (!onnotify)
      return;
    let index = 9;
    while (x[index++] !== 0)
      ;
    onnotify(x.toString("utf8", 9, index - 1), x.toString("utf8", index, x.length - 1));
  }
  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE ? write(Close(query.portal)) : (result = new Result, write(Execute("", query.cursorRows)));
    } catch (err) {
      write(Sync);
      query.reject(err);
    }
  }
  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }
  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() {
        socket.resume();
      }
    });
    query.resolve(stream);
  }
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() {
        socket.resume();
      },
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }
  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }
  function NoticeResponse(x) {
    onnotice ? onnotice(parseError(x)) : console.log(parseError(x));
  }
  function EmptyQueryResponse() {}
  function FunctionCallResponse() {
    errored(Errors.notSupported("FunctionCallResponse"));
  }
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported("NegotiateProtocolVersion"));
  }
  function UnknownMessage(x) {
    console.error("Postgres.js : Unknown Message:", x[0]);
  }
  function UnknownAuth(x, type) {
    console.error("Postgres.js : Unknown Auth:", type);
  }
  function Bind(parameters, types3, statement = "", portal = "") {
    let prev, type;
    bytes_default().B().str(portal + bytes_default.N).str(statement + bytes_default.N).i16(0).i16(parameters.length);
    parameters.forEach((x, i) => {
      if (x === null)
        return bytes_default.i32(4294967295);
      type = types3[i];
      parameters[i] = x = type in options.serializers ? options.serializers[type](x) : "" + x;
      prev = bytes_default.i;
      bytes_default.inc(4).str(x).i32(bytes_default.i - prev - 4, prev);
    });
    bytes_default.i16(0);
    return bytes_default.end();
  }
  function Parse(str, parameters, types3, name = "") {
    bytes_default().P().str(name + bytes_default.N).str(str + bytes_default.N).i16(parameters.length);
    parameters.forEach((x, i) => bytes_default.i32(types3[i] || 0));
    return bytes_default.end();
  }
  function Describe(x, name = "") {
    return bytes_default().D().str(x).str(name + bytes_default.N).end();
  }
  function Execute(portal = "", rows2 = 0) {
    return Buffer.concat([
      bytes_default().E().str(portal + bytes_default.N).i32(rows2).end(),
      Flush
    ]);
  }
  function Close(portal = "") {
    return Buffer.concat([
      bytes_default().C().str("P").str(portal + bytes_default.N).end(),
      bytes_default().S().end()
    ]);
  }
  function StartupMessage() {
    return cancelMessage || bytes_default().inc(4).i16(3).z(2).str(Object.entries(Object.assign({
      user,
      database,
      client_encoding: "UTF8"
    }, options.connection)).filter(([, v]) => v).map(([k, v]) => k + bytes_default.N + v).join(bytes_default.N)).z(2).end(0);
  }
}
function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5;i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString("utf8", start + 1, i);
      start = i + 1;
    }
  }
  return error;
}
function md5(x) {
  return crypto2.createHash("md5").update(x).digest("hex");
}
function hmac(key, x) {
  return crypto2.createHmac("sha256", key).update(x).digest();
}
function sha2562(x) {
  return crypto2.createHash("sha256").update(x).digest();
}
function xor(a, b2) {
  const length = Math.max(a.length, b2.length);
  const buffer2 = Buffer.allocUnsafe(length);
  for (let i = 0;i < length; i++)
    buffer2[i] = a[i] ^ b2[i];
  return buffer2;
}
function timer(fn, seconds) {
  seconds = typeof seconds === "function" ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop, start: noop };
  let timer2;
  return {
    cancel() {
      timer2 && (clearTimeout(timer2), timer2 = null);
    },
    start() {
      timer2 && clearTimeout(timer2);
      timer2 = setTimeout(done, seconds * 1000, arguments);
    }
  };
  function done(args) {
    fn.apply(null, args);
    timer2 = null;
  }
}

// node_modules/postgres/src/subscribe.js
var noop2 = () => {};
function Subscribe(postgres2, options) {
  const subscribers = new Map, slot = "postgresjs_" + Math.random().toString(36).slice(2), state = {};
  let connection2, stream, ended = false;
  const sql = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: async function() {
      if (ended)
        return;
      stream = null;
      state.pid = state.secret = undefined;
      connected(await init(sql, slot, options.publications));
      subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
    },
    no_subscribe: true
  });
  const { end, close } = sql;
  sql.end = async () => {
    ended = true;
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return end();
  };
  sql.close = async () => {
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return close();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop2, onerror = noop2) {
    event = parseEvent(event);
    if (!connection2)
      connection2 = init(sql, slot, options.publications);
    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, new Set([subscriber])).get(event);
    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };
    return connection2.then((x) => {
      connected(x);
      onsubscribe();
      stream && stream.on("error", onerror);
      return { unsubscribe, state, sql };
    });
  }
  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }
  async function init(sql2, slot2, publications) {
    if (!publications)
      throw new Error("Missing publication names");
    const xs = await sql2.unsafe(`CREATE_REPLICATION_SLOT ${slot2} TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`);
    const [x] = xs;
    const stream2 = await sql2.unsafe(`START_REPLICATION SLOT ${slot2} LOGICAL ${x.consistent_point} (proto_version '1', publication_names '${publications}')`).writable();
    const state2 = {
      lsn: Buffer.concat(x.consistent_point.split("/").map((x2) => Buffer.from(("00000000" + x2).slice(-8), "hex")))
    };
    stream2.on("data", data);
    stream2.on("error", error);
    stream2.on("close", sql2.close);
    return { stream: stream2, state: xs.state };
    function error(e) {
      console.error("Unexpected error during logical streaming - reconnecting", e);
    }
    function data(x2) {
      if (x2[0] === 119) {
        parse2(x2.subarray(25), state2, sql2.options.parsers, handle, options.transform);
      } else if (x2[0] === 107 && x2[17]) {
        state2.lsn = x2.subarray(1, 9);
        pong();
      }
    }
    function handle(a, b2) {
      const path = b2.relation.schema + "." + b2.relation.table;
      call("*", a, b2);
      call("*:" + path, a, b2);
      b2.relation.keys.length && call("*:" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
      call(b2.command, a, b2);
      call(b2.command + ":" + path, a, b2);
      b2.relation.keys.length && call(b2.command + ":" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
    }
    function pong() {
      const x2 = Buffer.alloc(34);
      x2[0] = 114;
      x2.fill(state2.lsn, 1);
      x2.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2000, 0, 1)) * BigInt(1000), 25);
      stream2.write(x2);
    }
  }
  function call(x, a, b2) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b2, x));
  }
}
function Time(x) {
  return new Date(Date.UTC(2000, 0, 1) + Number(x / BigInt(1000)));
}
function parse2(x, state, parsers2, handle, transform) {
  const char = (acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc);
  Object.entries({
    R: (x2) => {
      let i = 1;
      const r = state[x2.readUInt32BE(i)] = {
        schema: x2.toString("utf8", i += 4, i = x2.indexOf(0, i)) || "pg_catalog",
        table: x2.toString("utf8", i + 1, i = x2.indexOf(0, i + 1)),
        columns: Array(x2.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;
      let columnIndex = 0, column;
      while (i < x2.length) {
        column = r.columns[columnIndex++] = {
          key: x2[i++],
          name: transform.column.from ? transform.column.from(x2.toString("utf8", i, i = x2.indexOf(0, i))) : x2.toString("utf8", i, i = x2.indexOf(0, i)),
          type: x2.readUInt32BE(i += 1),
          parser: parsers2[x2.readUInt32BE(i)],
          atttypmod: x2.readUInt32BE(i += 4)
        };
        column.key && r.keys.push(column);
        i += 4;
      }
    },
    Y: () => {},
    O: () => {},
    B: (x2) => {
      state.date = Time(x2.readBigInt64BE(9));
      state.lsn = x2.subarray(1, 9);
    },
    I: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      const { row } = tuples(x2, relation.columns, i += 7, transform);
      handle(row, {
        command: "insert",
        relation
      });
    },
    D: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      handle(key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform).row : null, {
        command: "delete",
        relation,
        key
      });
    },
    U: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      const xs = key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform) : null;
      xs && (i = xs.i);
      const { row } = tuples(x2, relation.columns, i + 3, transform);
      handle(row, {
        command: "update",
        relation,
        key,
        old: xs && xs.row
      });
    },
    T: () => {},
    C: () => {}
  }).reduce(char, {})[x[0]](x);
}
function tuples(x, columns, xi, transform) {
  let type, column, value;
  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0;i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 ? null : type === 117 ? undefined : column.parser === undefined ? x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)) : column.parser.array === true ? column.parser(x.toString("utf8", xi + 5, xi += 4 + x.readUInt32BE(xi))) : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    transform.raw ? row[i] = transform.raw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];
  if (!xs)
    throw new Error("Malformed subscribe pattern: " + x);
  const [, command, path, key] = xs;
  return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key ? "=" + key : "");
}

// node_modules/postgres/src/large.js
import Stream2 from "stream";
function largeObject(sql, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve, reject) => {
    await sql.begin(async (sql2) => {
      let finish;
      !oid && ([{ oid }] = await sql2`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql2`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: () => sql2`select lo_close(${fd})`.then(finish),
        tell: () => sql2`select lo_tell64(${fd})`,
        read: (x) => sql2`select loread(${fd}, ${x}) as data`,
        write: (x) => sql2`select lowrite(${fd}, ${x})`,
        truncate: (x) => sql2`select lo_truncate64(${fd}, ${x})`,
        seek: (x, whence = 0) => sql2`select lo_lseek64(${fd}, ${x}, ${whence})`,
        size: () => sql2`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };
      resolve(lo);
      return new Promise(async (r) => finish = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream2.Readable({
          highWaterMark,
          async read(size2) {
            const l = size2 > max ? size2 - max : size2;
            max -= size2;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size2)
              this.push(null);
          }
        });
      }
      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
    }).catch(reject);
  });
}

// node_modules/postgres/src/index.js
Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: (x) => BigInt(x),
    serialize: (x) => x.toString()
  }
});
var src_default = Postgres;
function Postgres(a, b2) {
  const options = parseOptions(a, b2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });
  let ending = false;
  const queries = queue_default(), connecting = queue_default(), reserved = queue_default(), closed = queue_default(), ended = queue_default(), open = queue_default(), busy = queue_default(), full = queue_default(), queues = { connecting, reserved, closed, ended, open, busy, full };
  const connections = [...Array(options.max)].map(() => connection_default(options, queues, { onopen, onend, onclose }));
  const sql = Sql(handler);
  Object.assign(sql, {
    get parameters() {
      return options.parameters;
    },
    largeObject: largeObject.bind(null, sql),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });
  return sql;
  function Sql(handler2) {
    handler2.debug = options.debug;
    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc;
    }, typed);
    Object.assign(sql2, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json,
      file
    });
    return sql2;
    function typed(value, type) {
      return new Parameter(value, type);
    }
    function sql2(strings, ...args) {
      const query = strings && Array.isArray(strings.raw) ? new Query(strings, args, handler2, cancel) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
      return query;
    }
    function unsafe(string, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([string], args, handler2, cancel, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    function file(path, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([], args, (query2) => {
        fs.readFile(path, "utf8", (err, string) => {
          if (err)
            return query2.reject(err);
          query2.strings = [string];
          handler2(query2);
        });
      }, cancel, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
  }
  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };
    const sql2 = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name2, { listeners }]) => {
          delete listen.channels[name2];
          Promise.all(listeners.map((l) => listen(name2, l.fn, l.onlisten).catch(() => {})));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach((l) => l.fn(x));
      }
    }));
    const channels = listen.channels || (listen.channels = {}), exists = name in channels;
    if (exists) {
      channels[name].listeners.push(listener);
      const result2 = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result2.state, unlisten };
    }
    channels[name] = { result: sql2`listen ${sql2.unsafe('"' + name.replace(/"/g, '""') + '"')}`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten };
    async function unlisten() {
      if (name in channels === false)
        return;
      channels[name].listeners = channels[name].listeners.filter((x) => x !== listener);
      if (channels[name].listeners.length)
        return;
      delete channels[name];
      return sql2`unlisten ${sql2.unsafe('"' + name.replace(/"/g, '""') + '"')}`;
    }
  }
  async function notify(channel, payload) {
    return await sql`select pg_notify(${channel}, ${"" + payload})`;
  }
  async function reserve() {
    const queue = queue_default();
    const c = open.length ? open.shift() : await new Promise((resolve, reject) => {
      const query = { reserve: resolve, reject };
      queries.push(query);
      closed.length && connect(closed.shift(), query);
    });
    move(c, reserved);
    c.reserved = () => queue.length ? c.execute(queue.shift()) : move(c, reserved);
    c.reserved.release = true;
    const sql2 = Sql(handler2);
    sql2.release = () => {
      c.reserved = null;
      onopen(c);
    };
    return sql2;
    function handler2(q) {
      c.queue === full ? queue.push(q) : c.execute(q) || move(c, full);
    }
  }
  async function begin(options2, fn) {
    !fn && (fn = options2, options2 = "");
    const queries2 = queue_default();
    let savepoints = 0, connection2, prepare = null;
    try {
      await sql.unsafe("begin " + options2.replace(/[^a-z ]/ig, ""), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection2, fn),
        new Promise((_, reject) => connection2.onclose = reject)
      ]);
    } catch (error) {
      throw error;
    }
    async function scope(c, fn2, name) {
      const sql2 = Sql(handler2);
      sql2.savepoint = savepoint;
      sql2.prepare = (x) => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError, result;
      name && await sql2`savepoint ${sql2(name)}`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn2(sql2);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });
        if (uncaughtError)
          throw uncaughtError;
      } catch (e) {
        await (name ? sql2`rollback to ${sql2(name)}` : sql2`rollback`);
        throw e instanceof PostgresError && e.code === "25P02" && uncaughtError || e;
      }
      if (!name) {
        prepare ? await sql2`prepare transaction '${sql2.unsafe(prepare)}'` : await sql2`commit`;
      }
      return result;
      function savepoint(name2, fn3) {
        if (name2 && Array.isArray(name2.raw))
          return savepoint((sql3) => sql3.apply(sql3, arguments));
        arguments.length === 1 && (fn3 = name2, name2 = null);
        return scope(c, fn3, "s" + savepoints++ + (name2 ? "_" + name2 : ""));
      }
      function handler2(q) {
        q.catch((e) => uncaughtError || (uncaughtError = e));
        c.queue === full ? queries2.push(q) : c.execute(q) || move(c, full);
      }
    }
    function onexecute(c) {
      connection2 = c;
      move(c, reserved);
      c.reserved = () => queries2.length ? c.execute(queries2.shift()) : move(c, reserved);
    }
  }
  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open ? c.idleTimer.start() : c.idleTimer.cancel();
    return c;
  }
  function json(x) {
    return new Parameter(x, 3802);
  }
  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments));
    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap);
  }
  function handler(query) {
    if (ending)
      return query.reject(Errors.connection("CONNECTION_ENDED", options, options));
    if (open.length)
      return go(open.shift(), query);
    if (closed.length)
      return connect(closed.shift(), query);
    busy.length ? go(busy.shift(), query) : queries.push(query);
  }
  function go(c, query) {
    return c.execute(query) ? move(c, busy) : move(c, full);
  }
  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state ? query.active ? connection_default(options).cancel(query.state, resolve, reject) : query.cancelled = { resolve, reject } : (queries.remove(query), query.cancelled = true, query.reject(Errors.generic("57014", "canceling statement due to user request")), resolve());
    });
  }
  async function end({ timeout = null } = {}) {
    if (ending)
      return ending;
    await 1;
    let timer2;
    return ending = Promise.race([
      new Promise((r) => timeout !== null && (timer2 = setTimeout(destroy, timeout * 1000, r))),
      Promise.all(connections.map((c) => c.end()).concat(listen.sql ? listen.sql.end({ timeout: 0 }) : [], subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []))
    ]).then(() => clearTimeout(timer2));
  }
  async function close() {
    await Promise.all(connections.map((c) => c.end()));
  }
  async function destroy(resolve) {
    await Promise.all(connections.map((c) => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection("CONNECTION_DESTROYED", options));
    resolve();
  }
  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c;
  }
  function onend(c) {
    move(c, ended);
  }
  function onopen(c) {
    if (queries.length === 0)
      return move(c, open);
    let max = Math.ceil(queries.length / (connecting.length + 1)), ready = true;
    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c);
      ready = c.execute(query);
    }
    ready ? move(c, busy) : move(c, full);
  }
  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
}
function parseOptions(a, b2) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b2 : a) || {}, { url, multihost } = parseUrl(a), query = [...url.searchParams].reduce((a2, [b3, c]) => (a2[b3] = c, a2), {}), host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || "localhost", port = o.port || url.port || env.PGPORT || 5432, user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query.sslrootcert === "system" && (query.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive"];
  const defaults = {
    max: 10,
    ssl: false,
    idle_timeout: null,
    connect_timeout: 30,
    max_lifetime,
    max_pipeline: 100,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    publications: "alltables",
    target_session_attrs: null
  };
  return {
    host: Array.isArray(host) ? host : host.split(",").map((x) => x.split(":")[0]),
    port: Array.isArray(port) ? port : host.split(",").map((x) => parseInt(x.split(":")[1] || port)),
    path: o.path || host.indexOf("/") > -1 && host + "/.s.PGSQL." + port,
    database: o.database || o.db || (url.pathname || "").slice(1) || env.PGDATABASE || user,
    user,
    pass: o.pass || o.password || url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce((acc, [k, d]) => {
      const value = k in o ? o[k] : (k in query) ? query[k] === "disable" || query[k] === "false" ? false : query[k] : env["PG" + k.toUpperCase()] || d;
      acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
      return acc;
    }, {}),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => ((k in defaults) || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    transform: parseTransform(o.transform || { undefined: undefined }),
    parameters: {},
    shared: { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  };
}
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: new Map } };
  let host = url;
  host = host.slice(host.indexOf("://") + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf("@") + 1));
  const urlObj = new URL(url.replace(host, host.split(",")[0]));
  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(",") > -1 && host
  };
}
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}

// src/infrastructure/database/connection.ts
var createDatabaseConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return src_default(databaseUrl, {
      max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
      transform: {
        undefined: null
      },
      debug: console.log
    });
  }
  return src_default({
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME || "cofrinho",
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "password",
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
    ssl: false,
    transform: {
      undefined: null
    },
    debug: console.log
  });
};
var sql = createDatabaseConnection();
var checkDatabaseConnection = async () => {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
};
var closeDatabaseConnection = async () => {
  try {
    await sql.end();
    console.log("Database connection closed gracefully");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
};
var connection_default2 = sql;

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      return () => optsOrigin;
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : optsOrigin[0];
    }
  })(opts.origin);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "");
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      set("Vary", "Origin");
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      if (opts.allowMethods?.length) {
        set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: c.res.statusText
      });
    }
    await next();
  };
};

// src/infrastructure/web/middleware/cors.middleware.ts
var corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ];
    if (false) {}
    if (!origin || allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      return origin || "*";
    }
    return null;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposeHeaders: ["X-Total-Count", "X-Page-Count"],
  credentials: true,
  maxAge: 86400
});

// src/infrastructure/web/middleware/logger.middleware.ts
var loggerMiddleware = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header("User-Agent") || "Unknown";
  console.log(`\u27A1\uFE0F  ${method} ${path} - ${userAgent}`);
  try {
    await next();
    const duration = Date.now() - start;
    const status = c.res.status;
    const statusEmoji = status >= 500 ? "\u274C" : status >= 400 ? "\u26A0\uFE0F" : "\u2705";
    console.log(`${statusEmoji} ${method} ${path} - ${status} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`\uD83D\uDCA5 ${method} ${path} - ERROR (${duration}ms):`, error);
    throw error;
  }
};

// src/infrastructure/web/middleware/error-handler.middleware.ts
var errorHandlerMiddleware = async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("\uD83D\uDEA8 Unhandled error:", error);
    if (error instanceof HTTPException) {
      const response2 = {
        error: {
          message: error.message,
          code: "HTTP_EXCEPTION",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      };
      return c.json(response2, error.status);
    }
    if (error instanceof Error && error.name === "ZodError") {
      const response2 = {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors || error.message,
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      };
      return c.json(response2, 400);
    }
    if (error instanceof Error) {
      if (error.message.includes("cannot be") || error.message.includes("is required") || error.message.includes("must be")) {
        const response2 = {
          error: {
            message: error.message,
            code: "BUSINESS_RULE_VIOLATION",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        };
        return c.json(response2, 400);
      }
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        const response2 = {
          error: {
            message: error.message,
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        };
        return c.json(response2, 404);
      }
    }
    if (error instanceof Error && (error.message.includes("duplicate key") || error.message.includes("violates unique constraint"))) {
      const response2 = {
        error: {
          message: "Resource already exists",
          code: "DUPLICATE_RESOURCE",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      };
      return c.json(response2, 409);
    }
    const response = {
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_SERVER_ERROR",
        details: error instanceof Error ? error.stack : error,
        timestamp: new Date().toISOString(),
        path: c.req.path
      }
    };
    return c.json(response, 500);
  }
};

// node_modules/hono/dist/helper/html/index.js
var html = (strings, ...values2) => {
  const buffer2 = [""];
  for (let i = 0, len = strings.length - 1;i < len; i++) {
    buffer2[0] += strings[i];
    const children = values2[i] instanceof Array ? values2[i].flat(Infinity) : [values2[i]];
    for (let i2 = 0, len2 = children.length;i2 < len2; i2++) {
      const child = children[i2];
      if (typeof child === "string") {
        escapeToBuffer(child, buffer2);
      } else if (typeof child === "boolean" || child === null || child === undefined) {
        continue;
      } else if (typeof child === "object" && child.isEscaped || typeof child === "number") {
        const tmp = child.toString();
        if (tmp instanceof Promise) {
          buffer2.unshift("", tmp);
        } else {
          buffer2[0] += tmp;
        }
      } else if (child instanceof Promise) {
        buffer2.unshift("", child);
      } else {
        escapeToBuffer(child.toString(), buffer2);
      }
    }
  }
  buffer2[0] += strings[strings.length - 1];
  return buffer2.length === 1 ? raw(buffer2[0]) : stringBufferToString(buffer2);
};

// node_modules/@hono/swagger-ui/dist/index.js
var RENDER_TYPE = {
  STRING_ARRAY: "string_array",
  STRING: "string",
  JSON_STRING: "json_string",
  RAW: "raw"
};
var RENDER_TYPE_MAP = {
  configUrl: RENDER_TYPE.STRING,
  deepLinking: RENDER_TYPE.RAW,
  presets: RENDER_TYPE.STRING_ARRAY,
  plugins: RENDER_TYPE.STRING_ARRAY,
  spec: RENDER_TYPE.JSON_STRING,
  url: RENDER_TYPE.STRING,
  urls: RENDER_TYPE.JSON_STRING,
  layout: RENDER_TYPE.STRING,
  docExpansion: RENDER_TYPE.STRING,
  maxDisplayedTags: RENDER_TYPE.RAW,
  operationsSorter: RENDER_TYPE.RAW,
  requestInterceptor: RENDER_TYPE.RAW,
  responseInterceptor: RENDER_TYPE.RAW,
  persistAuthorization: RENDER_TYPE.RAW,
  defaultModelsExpandDepth: RENDER_TYPE.RAW,
  defaultModelExpandDepth: RENDER_TYPE.RAW,
  defaultModelRendering: RENDER_TYPE.STRING,
  displayRequestDuration: RENDER_TYPE.RAW,
  filter: RENDER_TYPE.RAW,
  showExtensions: RENDER_TYPE.RAW,
  showCommonExtensions: RENDER_TYPE.RAW,
  queryConfigEnabled: RENDER_TYPE.RAW,
  displayOperationId: RENDER_TYPE.RAW,
  tagsSorter: RENDER_TYPE.RAW,
  onComplete: RENDER_TYPE.RAW,
  syntaxHighlight: RENDER_TYPE.JSON_STRING,
  tryItOutEnabled: RENDER_TYPE.RAW,
  requestSnippetsEnabled: RENDER_TYPE.RAW,
  requestSnippets: RENDER_TYPE.JSON_STRING,
  oauth2RedirectUrl: RENDER_TYPE.STRING,
  showMutabledRequest: RENDER_TYPE.RAW,
  request: RENDER_TYPE.JSON_STRING,
  supportedSubmitMethods: RENDER_TYPE.JSON_STRING,
  validatorUrl: RENDER_TYPE.STRING,
  withCredentials: RENDER_TYPE.RAW,
  modelPropertyMacro: RENDER_TYPE.RAW,
  parameterMacro: RENDER_TYPE.RAW
};
var renderSwaggerUIOptions = (options) => {
  const optionsStrings = Object.entries(options).map(([k, v]) => {
    const key = k;
    if (!RENDER_TYPE_MAP[key] || v === undefined) {
      return "";
    }
    switch (RENDER_TYPE_MAP[key]) {
      case RENDER_TYPE.STRING:
        return `${key}: '${v}'`;
      case RENDER_TYPE.STRING_ARRAY:
        if (!Array.isArray(v)) {
          return "";
        }
        return `${key}: [${v.map((ve) => `${ve}`).join(",")}]`;
      case RENDER_TYPE.JSON_STRING:
        return `${key}: ${JSON.stringify(v)}`;
      case RENDER_TYPE.RAW:
        return `${key}: ${v}`;
      default:
        return "";
    }
  }).filter((item) => item !== "").join(",");
  return optionsStrings;
};
var remoteAssets = ({ version }) => {
  const url = `https://cdn.jsdelivr.net/npm/swagger-ui-dist${version !== undefined ? `@${version}` : ""}`;
  return {
    css: [`${url}/swagger-ui.css`],
    js: [`${url}/swagger-ui-bundle.js`]
  };
};
var SwaggerUI = (options) => {
  const asset = remoteAssets({ version: options?.version });
  delete options.version;
  if (options.manuallySwaggerUIHtml) {
    return options.manuallySwaggerUIHtml(asset);
  }
  const optionsStrings = renderSwaggerUIOptions(options);
  return `
    <div>
      <div id="swagger-ui"></div>
      ${asset.css.map((url) => html`<link rel="stylesheet" href="${url}" />`)}
      ${asset.js.map((url) => html`<script src="${url}" crossorigin="anonymous"></script>`)}
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            dom_id: '#swagger-ui',${optionsStrings},
          })
        }
      </script>
    </div>
  `;
};
var middleware = (options) => async (c) => {
  const title = options?.title ?? "SwaggerUI";
  return c.html(`
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="SwaggerUI" />
          <title>${title}</title>
        </head>
        <body>
          ${SwaggerUI(options)}
        </body>
      </html>
    `);
};

// src/infrastructure/web/docs/openapi.config.ts
var createOpenAPIApp = () => {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json({
          error: {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: result.error.issues,
            timestamp: new Date().toISOString()
          }
        }, 400);
      }
    }
  });
};
var openAPIConfig = {
  openapi: "3.0.0",
  info: {
    title: "Cofrinho API",
    description: "Personal expense tracker and financial management API",
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "pedro@cofrinho.app"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server"
    }
  ],
  tags: [
    {
      name: "Transactions",
      description: "Transaction management operations"
    },
    {
      name: "Categories",
      description: "Category management operations"
    },
    {
      name: "Payment Methods",
      description: "Payment method management operations"
    },
    {
      name: "Installment Plans",
      description: "Installment plan management operations"
    },
    {
      name: "Subscriptions",
      description: "Subscription management operations"
    },
    {
      name: "Savings Buckets",
      description: "Savings bucket management operations"
    },
    {
      name: "Reports",
      description: "Financial reporting operations"
    }
  ],
  components: {
    schemas: {},
    responses: {
      ValidationError: {
        description: "Validation error response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    code: { type: "string" },
                    details: { type: "array", items: { type: "object" } },
                    timestamp: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    code: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                    path: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      ServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    code: { type: "string" },
                    timestamp: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// src/infrastructure/web/docs/docs.routes.ts
function createDocsRoutes(app) {
  app.doc("/api/openapi.json", openAPIConfig);
  app.get("/api/docs", middleware({
    url: "/api/openapi.json",
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: "list",
    filter: true,
    displayRequestDuration: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    syntaxHighlight: {
      activated: true,
      theme: ["arta"]
    },
    plugins: [],
    layout: "BaseLayout"
  }));
  app.get("/api/redoc", (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cofrinho API Documentation</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; }
            redoc { display: block; }
          </style>
        </head>
        <body>
          <redoc spec-url="/api/openapi.json" theme="light"></redoc>
          <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
        </body>
      </html>
    `);
  });
  app.get("/api/info", (c) => {
    return c.json({
      title: "Cofrinho API",
      description: "Personal expense tracker and financial management API",
      version: "1.0.0",
      documentation: {
        swagger: "/api/docs",
        redoc: "/api/redoc",
        openapi: "/api/openapi.json"
      },
      endpoints: {
        transactions: "/api/transactions",
        categories: "/api/categories",
        paymentMethods: "/api/payment-methods",
        installmentPlans: "/api/installment-plans",
        subscriptions: "/api/subscriptions",
        savingsBuckets: "/api/buckets",
        reports: "/api/reports"
      },
      features: [
        "Full CRUD operations for all entities",
        "Advanced filtering and pagination",
        "Financial reporting and analytics",
        "Type-safe API with Zod validation",
        "Comprehensive OpenAPI documentation"
      ],
      lastUpdated: new Date().toISOString()
    });
  });
  return app;
}

// src/domain/entities/transaction.ts
class Transaction {
  _id;
  _date;
  _amount;
  _categoryId;
  _paymentMethodId;
  _description;
  _type;
  _source;
  _sourceId;
  _createdAt;
  _updatedAt;
  constructor(id, date, amount, categoryId, paymentMethodId, type, description = null, source = "manual" /* MANUAL */, sourceId = null, createdAt, updatedAt) {
    this.validateId(id);
    this.validateDate(date);
    this.validateAmount(amount, type);
    this.validateCategoryId(categoryId);
    this.validatePaymentMethodId(paymentMethodId);
    this.validateSourceRelation(source, sourceId);
    this._id = id;
    this._date = new Date(date);
    this._amount = amount;
    this._categoryId = categoryId;
    this._paymentMethodId = paymentMethodId;
    this._type = type;
    this._description = description?.trim() || null;
    this._source = source;
    this._sourceId = sourceId;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get date() {
    return new Date(this._date);
  }
  get amount() {
    return this._amount;
  }
  get categoryId() {
    return this._categoryId;
  }
  get paymentMethodId() {
    return this._paymentMethodId;
  }
  get description() {
    return this._description;
  }
  get type() {
    return this._type;
  }
  get source() {
    return this._source;
  }
  get sourceId() {
    return this._sourceId;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateDate(date) {
    this.validateDate(date);
    this._date = new Date(date);
    this._updatedAt = new Date;
  }
  updateAmount(amount) {
    this.validateAmount(amount, this._type);
    this._amount = amount;
    this._updatedAt = new Date;
  }
  updateCategory(categoryId) {
    this.validateCategoryId(categoryId);
    this._categoryId = categoryId;
    this._updatedAt = new Date;
  }
  updatePaymentMethod(paymentMethodId) {
    this.validatePaymentMethodId(paymentMethodId);
    this._paymentMethodId = paymentMethodId;
    this._updatedAt = new Date;
  }
  updateDescription(description) {
    this._description = description?.trim() || null;
    this._updatedAt = new Date;
  }
  isIncome() {
    return this._type === "income" /* INCOME */;
  }
  isExpense() {
    return this._type === "expense" /* EXPENSE */;
  }
  isManual() {
    return this._source === "manual" /* MANUAL */;
  }
  isFromInstallment() {
    return this._source === "installment" /* INSTALLMENT */;
  }
  isFromSubscription() {
    return this._source === "subscription" /* SUBSCRIPTION */;
  }
  isInMonth(year, month) {
    return this._date.getFullYear() === year && this._date.getMonth() === month - 1;
  }
  isInYear(year) {
    return this._date.getFullYear() === year;
  }
  isInDateRange(startDate, endDate) {
    return this._date >= startDate && this._date <= endDate;
  }
  equals(other) {
    return this._id === other._id;
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Transaction ID cannot be empty");
    }
  }
  validateDate(date) {
    if (!date || isNaN(date.getTime())) {
      throw new Error("Invalid transaction date");
    }
    const now = new Date;
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (date > futureLimit) {
      throw new Error("Transaction date cannot be more than 1 year in the future");
    }
  }
  validateAmount(amount, type) {
    if (!amount) {
      throw new Error("Transaction amount is required");
    }
    if (amount.amount <= 0) {
      throw new Error("Transaction amount must be positive");
    }
  }
  validateCategoryId(categoryId) {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new Error("Category ID cannot be empty");
    }
  }
  validatePaymentMethodId(paymentMethodId) {
    if (!paymentMethodId || paymentMethodId.trim().length === 0) {
      throw new Error("Payment method ID cannot be empty");
    }
  }
  validateSourceRelation(source, sourceId) {
    if (source === "manual" /* MANUAL */ && sourceId !== null) {
      throw new Error("Manual transactions cannot have a source ID");
    }
    if ((source === "installment" /* INSTALLMENT */ || source === "subscription" /* SUBSCRIPTION */) && !sourceId) {
      throw new Error(`${source} transactions must have a source ID`);
    }
  }
  static createManual(id, date, amount, categoryId, paymentMethodId, type, description) {
    return new Transaction(id, date, amount, categoryId, paymentMethodId, type, description, "manual" /* MANUAL */, null);
  }
  static createFromInstallment(id, date, amount, categoryId, paymentMethodId, type, installmentPlanId, description) {
    return new Transaction(id, date, amount, categoryId, paymentMethodId, type, description, "installment" /* INSTALLMENT */, installmentPlanId);
  }
  static createFromSubscription(id, date, amount, categoryId, paymentMethodId, type, subscriptionId, description) {
    return new Transaction(id, date, amount, categoryId, paymentMethodId, type, description, "subscription" /* SUBSCRIPTION */, subscriptionId);
  }
}

// src/domain/value-objects/money.ts
class Money {
  _amount;
  _currency;
  constructor(amount, currency = "BRL") {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    if (!currency || currency.trim().length === 0) {
      throw new Error("Currency cannot be empty");
    }
    this._amount = Math.round(amount * 100) / 100;
    this._currency = currency.toUpperCase();
  }
  get amount() {
    return this._amount;
  }
  get currency() {
    return this._currency;
  }
  add(other) {
    this.validateSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }
  subtract(other) {
    this.validateSameCurrency(other);
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new Error("Subtraction result cannot be negative");
    }
    return new Money(result, this._currency);
  }
  multiply(factor) {
    if (factor < 0) {
      throw new Error("Factor cannot be negative");
    }
    return new Money(this._amount * factor, this._currency);
  }
  divide(divisor) {
    if (divisor <= 0) {
      throw new Error("Divisor must be positive");
    }
    return new Money(this._amount / divisor, this._currency);
  }
  equals(other) {
    return this._amount === other._amount && this._currency === other._currency;
  }
  isGreaterThan(other) {
    this.validateSameCurrency(other);
    return this._amount > other._amount;
  }
  isLessThan(other) {
    this.validateSameCurrency(other);
    return this._amount < other._amount;
  }
  toString() {
    return `${this._currency} ${this._amount.toFixed(2)}`;
  }
  validateSameCurrency(other) {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot operate on different currencies: ${this._currency} and ${other._currency}`);
    }
  }
  static zero(currency = "BRL") {
    return new Money(0, currency);
  }
  static fromCents(cents, currency = "BRL") {
    return new Money(cents / 100, currency);
  }
}

// src/infrastructure/database/repositories/postgresql-transaction.repository.ts
class PostgreSQLTransactionRepository {
  async save(transaction) {
    await connection_default2`
      INSERT INTO transactions (
        id, date, amount, category_id, payment_method_id, 
        description, type, source_type, source_id, created_at, updated_at
      ) VALUES (
        ${transaction.id},
        ${transaction.date},
        ${this.getAmountForStorage(transaction)},
        ${transaction.categoryId},
        ${transaction.paymentMethodId},
        ${transaction.description},
        ${transaction.type.toLowerCase()},
        ${transaction.source},
        ${transaction.sourceId},
        ${transaction.createdAt},
        ${transaction.updatedAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM transactions WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM transactions ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(transaction) {
    await connection_default2`
      UPDATE transactions 
      SET 
        date = ${transaction.date},
        amount = ${this.getAmountForStorage(transaction)},
        category_id = ${transaction.categoryId},
        payment_method_id = ${transaction.paymentMethodId},
        description = ${transaction.description},
        updated_at = ${new Date}
      WHERE id = ${transaction.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM transactions WHERE id = ${id}`;
  }
  async findByDateRange(dateRange) {
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByYear(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByCategory(categoryId) {
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE category_id = ${categoryId}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByPaymentMethod(paymentMethodId) {
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE payment_method_id = ${paymentMethodId}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findBySource(sourceId) {
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE source_id = ${sourceId}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByInstallmentPlan(installmentPlanId) {
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE source_type = 'installment' AND source_id = ${installmentPlanId}
      ORDER BY date ASC, created_at ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findBySubscription(subscriptionId) {
    const result = await connection_default2`
      SELECT * FROM transactions 
      WHERE source_type = 'subscription' AND source_id = ${subscriptionId}
      ORDER BY date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findPaginated(page, limit, filters) {
    const offset = (page - 1) * limit;
    const whereConditions = [];
    const params = [];
    if (filters) {
      if (filters.categoryId) {
        whereConditions.push(`category_id = $${params.length + 1}`);
        params.push(filters.categoryId);
      }
      if (filters.paymentMethodId) {
        whereConditions.push(`payment_method_id = $${params.length + 1}`);
        params.push(filters.paymentMethodId);
      }
      if (filters.startDate) {
        whereConditions.push(`date >= $${params.length + 1}`);
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        whereConditions.push(`date <= $${params.length + 1}`);
        params.push(filters.endDate);
      }
      if (filters.type) {
        whereConditions.push(`type = $${params.length + 1}`);
        params.push(filters.type);
      }
      if (filters.source) {
        whereConditions.push(`source_type = $${params.length + 1}`);
        params.push(filters.source);
      }
      if (filters.description) {
        whereConditions.push(`description ILIKE $${params.length + 1}`);
        params.push(`%${filters.description}%`);
      }
      if (filters.minAmount !== undefined) {
        whereConditions.push(`ABS(amount) >= $${params.length + 1}`);
        params.push(filters.minAmount);
      }
      if (filters.maxAmount !== undefined) {
        whereConditions.push(`ABS(amount) <= $${params.length + 1}`);
        params.push(filters.maxAmount);
      }
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*) as count FROM transactions ${whereClause}`;
    const countResult = await connection_default2.unsafe(countQuery, params);
    const totalItems = parseInt(countResult[0].count);
    const dataQuery = `
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    const result = await connection_default2.unsafe(dataQuery, params);
    const items = result.map((row) => this.mapRowToEntity(row));
    const totalPages = Math.ceil(totalItems / limit);
    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }
  async getTotalByCategory(categoryId, dateRange) {
    let query;
    let params = [categoryId];
    if (dateRange) {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE category_id = $1 AND date BETWEEN $2 AND $3
      `;
      params.push(dateRange.startDate, dateRange.endDate);
    } else {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE category_id = $1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return parseFloat(result[0].total || "0");
  }
  async getTotalByPaymentMethod(paymentMethodId, dateRange) {
    let query;
    let params = [paymentMethodId];
    if (dateRange) {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE payment_method_id = $1 AND date BETWEEN $2 AND $3
      `;
      params.push(dateRange.startDate, dateRange.endDate);
    } else {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE payment_method_id = $1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return parseFloat(result[0].total || "0");
  }
  async getTotalIncomeForPeriod(dateRange) {
    const result = await connection_default2`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'income' 
      AND date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
    `;
    return parseFloat(result[0].total || "0");
  }
  async getTotalExpenseForPeriod(dateRange) {
    const result = await connection_default2`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total 
      FROM transactions 
      WHERE type = 'expense' 
      AND date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
    `;
    return parseFloat(result[0].total || "0");
  }
  async getMonthlyTotals(year) {
    const result = await connection_default2`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expense
      FROM transactions 
      WHERE EXTRACT(YEAR FROM date) = ${year}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY month
    `;
    return result.map((row) => ({
      month: parseInt(row.month),
      year: parseInt(row.year),
      totalIncome: parseFloat(row.total_income || "0"),
      totalExpense: parseFloat(row.total_expense || "0"),
      net: parseFloat(row.total_income || "0") - parseFloat(row.total_expense || "0")
    }));
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM transactions WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const amount = new Money(Math.abs(row.amount));
    const type = row.type === "income" ? "income" /* INCOME */ : "expense" /* EXPENSE */;
    const source = this.mapSourceType(row.source_type);
    return new Transaction(row.id, row.date, amount, row.category_id, row.payment_method_id, type, row.description, source, row.source_id, row.created_at, row.updated_at);
  }
  mapSourceType(sourceType) {
    switch (sourceType) {
      case "manual":
        return "manual" /* MANUAL */;
      case "installment":
        return "installment" /* INSTALLMENT */;
      case "subscription":
        return "subscription" /* SUBSCRIPTION */;
      default:
        return "manual" /* MANUAL */;
    }
  }
  getAmountForStorage(transaction) {
    const baseAmount = transaction.amount.amount;
    return transaction.isIncome() ? baseAmount : -baseAmount;
  }
}

// src/domain/entities/category.ts
class Category {
  _id;
  _name;
  _type;
  _color;
  _isActive;
  _createdAt;
  _updatedAt;
  constructor(id, name, type, color = null, isActive = true, createdAt, updatedAt) {
    this.validateName(name);
    this.validateId(id);
    this._id = id;
    this._name = name.trim();
    this._type = type;
    this._color = color?.trim() || null;
    this._isActive = isActive;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get type() {
    return this._type;
  }
  get color() {
    return this._color;
  }
  get isActive() {
    return this._isActive;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateName(name) {
    this.validateName(name);
    this._name = name.trim();
    this._updatedAt = new Date;
  }
  updateColor(color) {
    this._color = color?.trim() || null;
    this._updatedAt = new Date;
  }
  activate() {
    this._isActive = true;
    this._updatedAt = new Date;
  }
  deactivate() {
    this._isActive = false;
    this._updatedAt = new Date;
  }
  isForIncomeTransactions() {
    return this._type === "income" /* INCOME */;
  }
  isForExpenseTransactions() {
    return this._type === "expense" /* EXPENSE */;
  }
  canBeUsedForTransactionType(transactionType) {
    return this._type === transactionType;
  }
  equals(other) {
    return this._id === other._id;
  }
  validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Category name cannot be empty");
    }
    if (name.trim().length > 50) {
      throw new Error("Category name cannot exceed 50 characters");
    }
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Category ID cannot be empty");
    }
  }
  static create(id, name, type, color) {
    return new Category(id, name, type, color);
  }
}

// src/infrastructure/database/repositories/postgresql-category.repository.ts
class PostgreSQLCategoryRepository {
  async save(category) {
    await connection_default2`
      INSERT INTO categories (
        id, name, type, color, is_active, created_at, updated_at
      ) VALUES (
        ${category.id},
        ${category.name},
        ${category.type.toLowerCase()},
        ${category.color},
        ${category.isActive},
        ${category.createdAt},
        ${category.updatedAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM categories WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM categories ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(category) {
    await connection_default2`
      UPDATE categories 
      SET 
        name = ${category.name},
        color = ${category.color},
        is_active = ${category.isActive},
        updated_at = ${new Date}
      WHERE id = ${category.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM categories WHERE id = ${id}`;
  }
  async findByType(type) {
    const result = await connection_default2`
      SELECT * FROM categories 
      WHERE type = ${type.toLowerCase()} AND is_active = true
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findActiveCategories() {
    const result = await connection_default2`
      SELECT * FROM categories 
      WHERE is_active = true 
      ORDER BY type, name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findInactiveCategories() {
    const result = await connection_default2`
      SELECT * FROM categories 
      WHERE is_active = false 
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByName(name) {
    const result = await connection_default2`
      SELECT * FROM categories 
      WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM categories WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  async existsByName(name, excludeId) {
    let query;
    let params = [name];
    if (excludeId) {
      query = `
        SELECT 1 FROM categories 
        WHERE LOWER(name) = LOWER($1) AND is_active = true AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM categories 
        WHERE LOWER(name) = LOWER($1) AND is_active = true 
        LIMIT 1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const type = row.type === "income" ? "income" /* INCOME */ : "expense" /* EXPENSE */;
    return new Category(row.id, row.name, type, row.color, row.is_active, row.created_at, row.updated_at);
  }
}

// src/domain/entities/payment-method.ts
var PaymentMethodType;
((PaymentMethodType2) => {
  PaymentMethodType2["CASH"] = "cash";
  PaymentMethodType2["BANK"] = "bank";
  PaymentMethodType2["CREDIT_CARD"] = "credit_card";
})(PaymentMethodType ||= {});

class PaymentMethod {
  _id;
  _name;
  _type;
  _isActive;
  _createdAt;
  _updatedAt;
  constructor(id, name, type, isActive = true, createdAt, updatedAt) {
    this.validateId(id);
    this.validateName(name);
    this.validateType(type);
    this._id = id;
    this._name = name.trim();
    this._type = type;
    this._isActive = isActive;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get type() {
    return this._type;
  }
  get isActive() {
    return this._isActive;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateName(name) {
    this.validateName(name);
    this._name = name.trim();
    this._updatedAt = new Date;
  }
  activate() {
    this._isActive = true;
    this._updatedAt = new Date;
  }
  deactivate() {
    this._isActive = false;
    this._updatedAt = new Date;
  }
  isCash() {
    return this._type === "cash" /* CASH */;
  }
  isBank() {
    return this._type === "bank" /* BANK */;
  }
  isCreditCard() {
    return this._type === "credit_card" /* CREDIT_CARD */;
  }
  supportsInstallments() {
    return this._type === "credit_card" /* CREDIT_CARD */;
  }
  equals(other) {
    return this._id === other._id;
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Payment method ID cannot be empty");
    }
  }
  validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Payment method name cannot be empty");
    }
    if (name.trim().length > 50) {
      throw new Error("Payment method name cannot exceed 50 characters");
    }
  }
  validateType(type) {
    if (!Object.values(PaymentMethodType).includes(type)) {
      throw new Error(`Invalid payment method type: ${type}`);
    }
  }
  static create(id, name, type) {
    return new PaymentMethod(id, name, type);
  }
  static createCash(id, name = "Cash") {
    return new PaymentMethod(id, name, "cash" /* CASH */);
  }
  static createBank(id, name) {
    return new PaymentMethod(id, name, "bank" /* BANK */);
  }
  static createCreditCard(id, name) {
    return new PaymentMethod(id, name, "credit_card" /* CREDIT_CARD */);
  }
}

// src/infrastructure/database/repositories/postgresql-payment-method.repository.ts
class PostgreSQLPaymentMethodRepository {
  async save(paymentMethod) {
    await connection_default2`
      INSERT INTO payment_methods (
        id, name, type, is_active, created_at, updated_at
      ) VALUES (
        ${paymentMethod.id},
        ${paymentMethod.name},
        ${paymentMethod.type.toLowerCase()},
        ${paymentMethod.isActive},
        ${paymentMethod.createdAt},
        ${paymentMethod.updatedAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM payment_methods WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM payment_methods ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(paymentMethod) {
    await connection_default2`
      UPDATE payment_methods 
      SET 
        name = ${paymentMethod.name},
        is_active = ${paymentMethod.isActive},
        updated_at = ${new Date}
      WHERE id = ${paymentMethod.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM payment_methods WHERE id = ${id}`;
  }
  async findActivePaymentMethods() {
    const result = await connection_default2`
      SELECT * FROM payment_methods 
      WHERE is_active = true 
      ORDER BY type, name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findInactivePaymentMethods() {
    const result = await connection_default2`
      SELECT * FROM payment_methods 
      WHERE is_active = false 
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByName(name) {
    const result = await connection_default2`
      SELECT * FROM payment_methods 
      WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM payment_methods WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  async findByType(type) {
    const result = await connection_default2`
      SELECT * FROM payment_methods 
      WHERE type = ${type.toLowerCase()} AND is_active = true
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findSupportingInstallments() {
    const result = await connection_default2`
      SELECT * FROM payment_methods 
      WHERE type IN ('credit_card', 'bank') AND is_active = true
      ORDER BY type, name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async existsByName(name, excludeId) {
    let query;
    let params = [name];
    if (excludeId) {
      query = `
        SELECT 1 FROM payment_methods 
        WHERE LOWER(name) = LOWER($1) AND is_active = true AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM payment_methods 
        WHERE LOWER(name) = LOWER($1) AND is_active = true 
        LIMIT 1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const type = this.mapTypeFromDatabase(row.type);
    return new PaymentMethod(row.id, row.name, type, row.is_active, row.created_at, row.updated_at);
  }
  mapTypeFromDatabase(type) {
    switch (type) {
      case "cash":
        return "cash" /* CASH */;
      case "bank":
        return "bank" /* BANK */;
      case "credit_card":
        return "credit_card" /* CREDIT_CARD */;
      default:
        return "cash" /* CASH */;
    }
  }
}

// src/domain/entities/installment-plan.ts
class InstallmentPlan {
  _id;
  _totalAmount;
  _purchaseDate;
  _installmentCount;
  _monthlyAmount;
  _description;
  _paymentMethodId;
  _categoryId;
  _status;
  _createdAt;
  _updatedAt;
  constructor(id, totalAmount, purchaseDate, installmentCount, description, paymentMethodId, categoryId, status = "active" /* ACTIVE */, createdAt, updatedAt) {
    this.validateId(id);
    this.validateTotalAmount(totalAmount);
    this.validatePurchaseDate(purchaseDate);
    this.validateInstallmentCount(installmentCount);
    this.validateDescription(description);
    this.validatePaymentMethodId(paymentMethodId);
    this.validateCategoryId(categoryId);
    this._id = id;
    this._totalAmount = totalAmount;
    this._purchaseDate = new Date(purchaseDate);
    this._installmentCount = installmentCount;
    this._monthlyAmount = totalAmount.divide(installmentCount);
    this._description = description.trim();
    this._paymentMethodId = paymentMethodId;
    this._categoryId = categoryId;
    this._status = status;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get totalAmount() {
    return this._totalAmount;
  }
  get purchaseDate() {
    return new Date(this._purchaseDate);
  }
  get installmentCount() {
    return this._installmentCount;
  }
  get monthlyAmount() {
    return this._monthlyAmount;
  }
  get description() {
    return this._description;
  }
  get paymentMethodId() {
    return this._paymentMethodId;
  }
  get categoryId() {
    return this._categoryId;
  }
  get status() {
    return this._status;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateDescription(description) {
    this.validateDescription(description);
    this._description = description.trim();
    this._updatedAt = new Date;
  }
  complete() {
    if (this._status === "cancelled" /* CANCELLED */) {
      throw new Error("Cannot complete a cancelled installment plan");
    }
    this._status = "completed" /* COMPLETED */;
    this._updatedAt = new Date;
  }
  cancel() {
    if (this._status === "completed" /* COMPLETED */) {
      throw new Error("Cannot cancel a completed installment plan");
    }
    this._status = "cancelled" /* CANCELLED */;
    this._updatedAt = new Date;
  }
  isActive() {
    return this._status === "active" /* ACTIVE */;
  }
  isCompleted() {
    return this._status === "completed" /* COMPLETED */;
  }
  isCancelled() {
    return this._status === "cancelled" /* CANCELLED */;
  }
  calculateInstallmentDates() {
    const dates = [];
    for (let i = 0;i < this._installmentCount; i++) {
      const installmentDate = new Date(this._purchaseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      dates.push(installmentDate);
    }
    return dates;
  }
  getInstallmentDateForIndex(index) {
    if (index < 0 || index >= this._installmentCount) {
      throw new Error(`Installment index must be between 0 and ${this._installmentCount - 1}`);
    }
    const installmentDate = new Date(this._purchaseDate);
    installmentDate.setMonth(installmentDate.getMonth() + index);
    return installmentDate;
  }
  getRemainingAmount(paidInstallments) {
    if (paidInstallments < 0 || paidInstallments > this._installmentCount) {
      throw new Error(`Paid installments must be between 0 and ${this._installmentCount}`);
    }
    const remainingInstallments = this._installmentCount - paidInstallments;
    return this._monthlyAmount.multiply(remainingInstallments);
  }
  equals(other) {
    return this._id === other._id;
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Installment plan ID cannot be empty");
    }
  }
  validateTotalAmount(totalAmount) {
    if (!totalAmount) {
      throw new Error("Total amount is required");
    }
    if (totalAmount.amount <= 0) {
      throw new Error("Total amount must be positive");
    }
  }
  validatePurchaseDate(purchaseDate) {
    if (!purchaseDate || isNaN(purchaseDate.getTime())) {
      throw new Error("Invalid purchase date");
    }
    const now = new Date;
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (purchaseDate > futureLimit) {
      throw new Error("Purchase date cannot be more than 1 year in the future");
    }
  }
  validateInstallmentCount(installmentCount) {
    if (!Number.isInteger(installmentCount) || installmentCount < 2) {
      throw new Error("Installment count must be an integer greater than 1");
    }
    if (installmentCount > 60) {
      throw new Error("Installment count cannot exceed 60 months");
    }
  }
  validateDescription(description) {
    if (!description || description.trim().length === 0) {
      throw new Error("Description cannot be empty");
    }
    if (description.trim().length > 200) {
      throw new Error("Description cannot exceed 200 characters");
    }
  }
  validatePaymentMethodId(paymentMethodId) {
    if (!paymentMethodId || paymentMethodId.trim().length === 0) {
      throw new Error("Payment method ID cannot be empty");
    }
  }
  validateCategoryId(categoryId) {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new Error("Category ID cannot be empty");
    }
  }
  static create(id, totalAmount, purchaseDate, installmentCount, description, paymentMethodId, categoryId) {
    return new InstallmentPlan(id, totalAmount, purchaseDate, installmentCount, description, paymentMethodId, categoryId);
  }
}

// src/infrastructure/database/repositories/postgresql-installment-plan.repository.ts
class PostgreSQLInstallmentPlanRepository {
  async save(installmentPlan) {
    await connection_default2`
      INSERT INTO installment_plans (
        id, total_amount, purchase_date, installment_count, monthly_amount,
        description, payment_method_id, category_id, status, created_at, updated_at
      ) VALUES (
        ${installmentPlan.id},
        ${installmentPlan.totalAmount.amount},
        ${installmentPlan.purchaseDate},
        ${installmentPlan.installmentCount},
        ${installmentPlan.monthlyAmount.amount},
        ${installmentPlan.description},
        ${installmentPlan.paymentMethodId},
        ${installmentPlan.categoryId},
        ${installmentPlan.status.toLowerCase()},
        ${installmentPlan.createdAt},
        ${installmentPlan.updatedAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM installment_plans WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM installment_plans ORDER BY purchase_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(installmentPlan) {
    await connection_default2`
      UPDATE installment_plans 
      SET 
        description = ${installmentPlan.description},
        status = ${installmentPlan.status.toLowerCase()},
        updated_at = ${new Date}
      WHERE id = ${installmentPlan.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM installment_plans WHERE id = ${id}`;
  }
  async findByStatus(status) {
    const result = await connection_default2`
      SELECT * FROM installment_plans 
      WHERE status = ${status.toLowerCase()}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findActiveInstallmentPlans() {
    const result = await connection_default2`
      SELECT * FROM installment_plans 
      WHERE status = 'active'
      ORDER BY purchase_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByCategory(categoryId) {
    const result = await connection_default2`
      SELECT * FROM installment_plans 
      WHERE category_id = ${categoryId}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByPaymentMethod(paymentMethodId) {
    const result = await connection_default2`
      SELECT * FROM installment_plans 
      WHERE payment_method_id = ${paymentMethodId}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByDateRange(startDate, endDate) {
    const result = await connection_default2`
      SELECT * FROM installment_plans 
      WHERE purchase_date BETWEEN ${startDate} AND ${endDate}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findPendingInstallmentsForMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const result = await connection_default2`
      SELECT * FROM installment_plans 
      WHERE status = 'active'
      AND purchase_date <= ${endDate}
      ORDER BY purchase_date ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM installment_plans WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const totalAmount = new Money(row.total_amount);
    const status = this.mapStatusFromDatabase(row.status);
    return new InstallmentPlan(row.id, totalAmount, row.purchase_date, row.installment_count, row.description || "", row.payment_method_id, row.category_id, status, row.created_at, row.updated_at);
  }
  mapStatusFromDatabase(status) {
    switch (status) {
      case "active":
        return "active" /* ACTIVE */;
      case "completed":
        return "completed" /* COMPLETED */;
      case "cancelled":
        return "cancelled" /* CANCELLED */;
      default:
        return "active" /* ACTIVE */;
    }
  }
}

// src/domain/entities/subscription.ts
class Subscription {
  _id;
  _name;
  _monthlyAmount;
  _startDate;
  _endDate;
  _categoryId;
  _paymentMethodId;
  _status;
  _createdAt;
  _updatedAt;
  constructor(id, name, monthlyAmount, startDate, categoryId, paymentMethodId, endDate = null, status = "active" /* ACTIVE */, createdAt, updatedAt) {
    this.validateId(id);
    this.validateName(name);
    this.validateMonthlyAmount(monthlyAmount);
    this.validateStartDate(startDate);
    this.validateCategoryId(categoryId);
    this.validatePaymentMethodId(paymentMethodId);
    this.validateEndDate(startDate, endDate);
    this._id = id;
    this._name = name.trim();
    this._monthlyAmount = monthlyAmount;
    this._startDate = new Date(startDate);
    this._endDate = endDate ? new Date(endDate) : null;
    this._categoryId = categoryId;
    this._paymentMethodId = paymentMethodId;
    this._status = status;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get monthlyAmount() {
    return this._monthlyAmount;
  }
  get startDate() {
    return new Date(this._startDate);
  }
  get endDate() {
    return this._endDate ? new Date(this._endDate) : null;
  }
  get categoryId() {
    return this._categoryId;
  }
  get paymentMethodId() {
    return this._paymentMethodId;
  }
  get status() {
    return this._status;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateName(name) {
    this.validateName(name);
    this._name = name.trim();
    this._updatedAt = new Date;
  }
  cancel(endDate) {
    if (this._status === "cancelled" /* CANCELLED */) {
      throw new Error("Subscription is already cancelled");
    }
    const cancelDate = endDate || new Date;
    this.validateEndDate(this._startDate, cancelDate);
    this._endDate = cancelDate;
    this._status = "cancelled" /* CANCELLED */;
    this._updatedAt = new Date;
  }
  pause() {
    if (this._status === "cancelled" /* CANCELLED */) {
      throw new Error("Cannot pause a cancelled subscription");
    }
    if (this._status === "paused" /* PAUSED */) {
      throw new Error("Subscription is already paused");
    }
    this._status = "paused" /* PAUSED */;
    this._updatedAt = new Date;
  }
  resume() {
    if (this._status === "cancelled" /* CANCELLED */) {
      throw new Error("Cannot resume a cancelled subscription");
    }
    if (this._status === "active" /* ACTIVE */) {
      throw new Error("Subscription is already active");
    }
    this._status = "active" /* ACTIVE */;
    this._updatedAt = new Date;
  }
  isActive() {
    return this._status === "active" /* ACTIVE */;
  }
  isCancelled() {
    return this._status === "cancelled" /* CANCELLED */;
  }
  isPaused() {
    return this._status === "paused" /* PAUSED */;
  }
  isActiveOnDate(date) {
    if (!this.isActive()) {
      return false;
    }
    if (date < this._startDate) {
      return false;
    }
    if (this._endDate && date > this._endDate) {
      return false;
    }
    return true;
  }
  calculateTotalAmount(fromDate, toDate) {
    if (fromDate > toDate) {
      throw new Error("From date cannot be after to date");
    }
    let totalMonths = 0;
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      if (this.isActiveOnDate(currentDate)) {
        totalMonths++;
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return this._monthlyAmount.multiply(totalMonths);
  }
  getNextPaymentDate(fromDate = new Date) {
    if (!this.isActive()) {
      return null;
    }
    const nextPayment = new Date(fromDate);
    nextPayment.setDate(this._startDate.getDate());
    if (nextPayment <= fromDate) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    if (this._endDate && nextPayment > this._endDate) {
      return null;
    }
    return nextPayment;
  }
  shouldGeneratePaymentForMonth(year, month) {
    if (!this.isActive()) {
      return false;
    }
    const monthDate = new Date(year, month - 1, this._startDate.getDate());
    return this.isActiveOnDate(monthDate);
  }
  equals(other) {
    return this._id === other._id;
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Subscription ID cannot be empty");
    }
  }
  validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Subscription name cannot be empty");
    }
    if (name.trim().length > 100) {
      throw new Error("Subscription name cannot exceed 100 characters");
    }
  }
  validateMonthlyAmount(monthlyAmount) {
    if (!monthlyAmount) {
      throw new Error("Monthly amount is required");
    }
    if (monthlyAmount.amount <= 0) {
      throw new Error("Monthly amount must be positive");
    }
  }
  validateStartDate(startDate) {
    if (!startDate || isNaN(startDate.getTime())) {
      throw new Error("Invalid start date");
    }
  }
  validateEndDate(startDate, endDate) {
    if (endDate && endDate <= startDate) {
      throw new Error("End date must be after start date");
    }
  }
  validateCategoryId(categoryId) {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new Error("Category ID cannot be empty");
    }
  }
  validatePaymentMethodId(paymentMethodId) {
    if (!paymentMethodId || paymentMethodId.trim().length === 0) {
      throw new Error("Payment method ID cannot be empty");
    }
  }
  static create(id, name, monthlyAmount, startDate, categoryId, paymentMethodId) {
    return new Subscription(id, name, monthlyAmount, startDate, categoryId, paymentMethodId);
  }
}

// src/infrastructure/database/repositories/postgresql-subscription.repository.ts
class PostgreSQLSubscriptionRepository {
  async save(subscription) {
    await connection_default2`
      INSERT INTO subscriptions (
        id, name, monthly_amount, start_date, end_date,
        category_id, payment_method_id, status, created_at, updated_at
      ) VALUES (
        ${subscription.id},
        ${subscription.name},
        ${subscription.monthlyAmount.amount},
        ${subscription.startDate},
        ${subscription.endDate},
        ${subscription.categoryId},
        ${subscription.paymentMethodId},
        ${subscription.status.toLowerCase()},
        ${subscription.createdAt},
        ${subscription.updatedAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM subscriptions WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM subscriptions ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(subscription) {
    await connection_default2`
      UPDATE subscriptions 
      SET 
        name = ${subscription.name},
        monthly_amount = ${subscription.monthlyAmount.amount},
        end_date = ${subscription.endDate},
        category_id = ${subscription.categoryId},
        payment_method_id = ${subscription.paymentMethodId},
        status = ${subscription.status.toLowerCase()},
        updated_at = ${new Date}
      WHERE id = ${subscription.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM subscriptions WHERE id = ${id}`;
  }
  async findByStatus(status) {
    const result = await connection_default2`
      SELECT * FROM subscriptions 
      WHERE status = ${status.toLowerCase()}
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findActiveForMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const result = await connection_default2`
      SELECT * FROM subscriptions 
      WHERE status = 'active'
      AND start_date <= ${endDate}
      AND (end_date IS NULL OR end_date >= ${startDate})
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findActiveSubscriptions() {
    const result = await connection_default2`
      SELECT * FROM subscriptions 
      WHERE status = 'active'
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByCategory(categoryId) {
    const result = await connection_default2`
      SELECT * FROM subscriptions 
      WHERE category_id = ${categoryId}
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByPaymentMethod(paymentMethodId) {
    const result = await connection_default2`
      SELECT * FROM subscriptions 
      WHERE payment_method_id = ${paymentMethodId}
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByName(name) {
    const result = await connection_default2`
      SELECT * FROM subscriptions 
      WHERE LOWER(name) = LOWER(${name}) AND status = 'active'
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM subscriptions WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  async existsByName(name, excludeId) {
    let query;
    let params = [name];
    if (excludeId) {
      query = `
        SELECT 1 FROM subscriptions 
        WHERE LOWER(name) = LOWER($1) AND status = 'active' AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM subscriptions 
        WHERE LOWER(name) = LOWER($1) AND status = 'active' 
        LIMIT 1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const monthlyAmount = new Money(row.monthly_amount);
    const status = this.mapStatusFromDatabase(row.status);
    return new Subscription(row.id, row.name, monthlyAmount, row.start_date, row.category_id, row.payment_method_id, row.end_date, status, row.created_at, row.updated_at);
  }
  mapStatusFromDatabase(status) {
    switch (status) {
      case "active":
        return "active" /* ACTIVE */;
      case "cancelled":
        return "cancelled" /* CANCELLED */;
      case "paused":
        return "paused" /* PAUSED */;
      default:
        return "active" /* ACTIVE */;
    }
  }
}

// src/domain/entities/savings-bucket.ts
class SavingsBucket {
  _id;
  _name;
  _targetAmount;
  _currentBalance;
  _description;
  _isActive;
  _createdAt;
  _updatedAt;
  constructor(id, name, targetAmount = null, currentBalance = null, description = null, isActive = true, createdAt, updatedAt) {
    this.validateId(id);
    this.validateName(name);
    this.validateTargetAmount(targetAmount);
    this.validateCurrentBalance(currentBalance);
    this._id = id;
    this._name = name.trim();
    this._targetAmount = targetAmount;
    this._currentBalance = currentBalance || Money.zero();
    this._description = description?.trim() || null;
    this._isActive = isActive;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get targetAmount() {
    return this._targetAmount;
  }
  get currentBalance() {
    return this._currentBalance;
  }
  get description() {
    return this._description;
  }
  get isActive() {
    return this._isActive;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateName(name) {
    this.validateName(name);
    this._name = name.trim();
    this._updatedAt = new Date;
  }
  updateTargetAmount(targetAmount) {
    this.validateTargetAmount(targetAmount);
    this._targetAmount = targetAmount;
    this._updatedAt = new Date;
  }
  updateDescription(description) {
    this._description = description?.trim() || null;
    this._updatedAt = new Date;
  }
  addFunds(amount) {
    this.validateTransferAmount(amount);
    this._currentBalance = this._currentBalance.add(amount);
    this._updatedAt = new Date;
  }
  withdrawFunds(amount) {
    this.validateTransferAmount(amount);
    if (this._currentBalance.isLessThan(amount)) {
      throw new Error("Insufficient funds in bucket");
    }
    this._currentBalance = this._currentBalance.subtract(amount);
    this._updatedAt = new Date;
  }
  activate() {
    this._isActive = true;
    this._updatedAt = new Date;
  }
  deactivate() {
    this._isActive = false;
    this._updatedAt = new Date;
  }
  hasTarget() {
    return this._targetAmount !== null;
  }
  isTargetReached() {
    if (!this.hasTarget()) {
      return false;
    }
    return this._currentBalance.isGreaterThan(this._targetAmount) || this._currentBalance.equals(this._targetAmount);
  }
  getProgressPercentage() {
    if (!this.hasTarget()) {
      return null;
    }
    if (this._targetAmount.amount === 0) {
      return 100;
    }
    const progress = this._currentBalance.amount / this._targetAmount.amount * 100;
    return Math.min(progress, 100);
  }
  getRemainingAmount() {
    if (!this.hasTarget()) {
      return null;
    }
    if (this.isTargetReached()) {
      return Money.zero(this._targetAmount.currency);
    }
    return this._targetAmount.subtract(this._currentBalance);
  }
  canWithdraw(amount) {
    try {
      this.validateTransferAmount(amount);
      return this._currentBalance.isGreaterThan(amount) || this._currentBalance.equals(amount);
    } catch {
      return false;
    }
  }
  isEmpty() {
    return this._currentBalance.amount === 0;
  }
  equals(other) {
    return this._id === other._id;
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Bucket ID cannot be empty");
    }
  }
  validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Bucket name cannot be empty");
    }
    if (name.trim().length > 100) {
      throw new Error("Bucket name cannot exceed 100 characters");
    }
  }
  validateTargetAmount(targetAmount) {
    if (targetAmount && targetAmount.amount < 0) {
      throw new Error("Target amount cannot be negative");
    }
  }
  validateCurrentBalance(currentBalance) {
    if (currentBalance && currentBalance.amount < 0) {
      throw new Error("Current balance cannot be negative");
    }
  }
  validateTransferAmount(amount) {
    if (!amount) {
      throw new Error("Transfer amount is required");
    }
    if (amount.amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }
    if (this._currentBalance.currency !== amount.currency) {
      throw new Error(`Currency mismatch: bucket uses ${this._currentBalance.currency}, transfer uses ${amount.currency}`);
    }
  }
  static create(id, name, targetAmount, description) {
    return new SavingsBucket(id, name, targetAmount || null, null, description || null);
  }
  static createWithInitialBalance(id, name, initialBalance, targetAmount, description) {
    return new SavingsBucket(id, name, targetAmount || null, initialBalance, description || null);
  }
}

// src/infrastructure/database/repositories/postgresql-savings-bucket.repository.ts
class PostgreSQLSavingsBucketRepository {
  async save(bucket) {
    await connection_default2`
      INSERT INTO savings_buckets (
        id, name, target_amount, current_balance, description, is_active, created_at, updated_at
      ) VALUES (
        ${bucket.id},
        ${bucket.name},
        ${bucket.targetAmount?.amount || null},
        ${bucket.currentBalance.amount},
        ${bucket.description},
        ${bucket.isActive},
        ${bucket.createdAt},
        ${bucket.updatedAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM savings_buckets WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM savings_buckets ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(bucket) {
    await connection_default2`
      UPDATE savings_buckets 
      SET 
        name = ${bucket.name},
        target_amount = ${bucket.targetAmount?.amount || null},
        current_balance = ${bucket.currentBalance.amount},
        description = ${bucket.description},
        is_active = ${bucket.isActive},
        updated_at = ${new Date}
      WHERE id = ${bucket.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM savings_buckets WHERE id = ${id}`;
  }
  async findActiveBuckets() {
    const result = await connection_default2`
      SELECT * FROM savings_buckets 
      WHERE is_active = true 
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findInactiveBuckets() {
    const result = await connection_default2`
      SELECT * FROM savings_buckets 
      WHERE is_active = false 
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByName(name) {
    const result = await connection_default2`
      SELECT * FROM savings_buckets 
      WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findBucketsWithTargets() {
    const result = await connection_default2`
      SELECT * FROM savings_buckets 
      WHERE target_amount IS NOT NULL AND is_active = true
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findBucketsWithoutTargets() {
    const result = await connection_default2`
      SELECT * FROM savings_buckets 
      WHERE target_amount IS NULL AND is_active = true
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findTargetReachedBuckets() {
    const result = await connection_default2`
      SELECT * FROM savings_buckets 
      WHERE target_amount IS NOT NULL 
      AND current_balance >= target_amount 
      AND is_active = true
      ORDER BY name ASC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM savings_buckets WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  async existsByName(name, excludeId) {
    let query;
    let params = [name];
    if (excludeId) {
      query = `
        SELECT 1 FROM savings_buckets 
        WHERE LOWER(name) = LOWER($1) AND is_active = true AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM savings_buckets 
        WHERE LOWER(name) = LOWER($1) AND is_active = true 
        LIMIT 1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const currentBalance = new Money(row.current_balance);
    const targetAmount = row.target_amount ? new Money(row.target_amount) : null;
    return new SavingsBucket(row.id, row.name, currentBalance, targetAmount, row.description, row.is_active, row.created_at, row.updated_at);
  }
}

// src/domain/entities/bucket-transfer.ts
var BucketTransferType;
((BucketTransferType2) => {
  BucketTransferType2["DEPOSIT"] = "deposit";
  BucketTransferType2["WITHDRAWAL"] = "withdrawal";
})(BucketTransferType ||= {});

class BucketTransfer {
  _id;
  _date;
  _amount;
  _type;
  _bucketId;
  _description;
  _createdAt;
  _updatedAt;
  constructor(id, date, amount, type, bucketId, description = null, createdAt, updatedAt) {
    this.validateId(id);
    this.validateDate(date);
    this.validateAmount(amount);
    this.validateType(type);
    this.validateBucketId(bucketId);
    this._id = id;
    this._date = new Date(date);
    this._amount = amount;
    this._type = type;
    this._bucketId = bucketId;
    this._description = description?.trim() || null;
    this._createdAt = createdAt || new Date;
    this._updatedAt = updatedAt || new Date;
  }
  get id() {
    return this._id;
  }
  get date() {
    return new Date(this._date);
  }
  get amount() {
    return this._amount;
  }
  get type() {
    return this._type;
  }
  get bucketId() {
    return this._bucketId;
  }
  get description() {
    return this._description;
  }
  get createdAt() {
    return new Date(this._createdAt);
  }
  get updatedAt() {
    return new Date(this._updatedAt);
  }
  updateDescription(description) {
    this._description = description?.trim() || null;
    this._updatedAt = new Date;
  }
  isDeposit() {
    return this._type === "deposit" /* DEPOSIT */;
  }
  isWithdrawal() {
    return this._type === "withdrawal" /* WITHDRAWAL */;
  }
  isInMonth(year, month) {
    return this._date.getFullYear() === year && this._date.getMonth() === month - 1;
  }
  isInYear(year) {
    return this._date.getFullYear() === year;
  }
  isInDateRange(startDate, endDate) {
    return this._date >= startDate && this._date <= endDate;
  }
  equals(other) {
    return this._id === other._id;
  }
  validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error("Transfer ID cannot be empty");
    }
  }
  validateDate(date) {
    if (!date || isNaN(date.getTime())) {
      throw new Error("Invalid transfer date");
    }
    const now = new Date;
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (date > futureLimit) {
      throw new Error("Transfer date cannot be more than 1 year in the future");
    }
  }
  validateAmount(amount) {
    if (!amount) {
      throw new Error("Transfer amount is required");
    }
    if (amount.amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }
  }
  validateType(type) {
    if (!Object.values(BucketTransferType).includes(type)) {
      throw new Error(`Invalid transfer type: ${type}`);
    }
  }
  validateBucketId(bucketId) {
    if (!bucketId || bucketId.trim().length === 0) {
      throw new Error("Bucket ID cannot be empty");
    }
  }
  static createDeposit(id, date, amount, bucketId, description) {
    return new BucketTransfer(id, date, amount, "deposit" /* DEPOSIT */, bucketId, description);
  }
  static createWithdrawal(id, date, amount, bucketId, description) {
    return new BucketTransfer(id, date, amount, "withdrawal" /* WITHDRAWAL */, bucketId, description);
  }
}

// src/infrastructure/database/repositories/postgresql-bucket-transfer.repository.ts
class PostgreSQLBucketTransferRepository {
  async save(transfer) {
    await connection_default2`
      INSERT INTO bucket_transfers (
        id, bucket_id, amount, transfer_date, description, created_at
      ) VALUES (
        ${transfer.id},
        ${transfer.bucketId},
        ${transfer.amount.amount},
        ${transfer.date},
        ${transfer.description},
        ${transfer.createdAt}
      )
    `;
  }
  async findById(id) {
    const result = await connection_default2`
      SELECT * FROM bucket_transfers WHERE id = ${id}
    `;
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }
  async findAll() {
    const result = await connection_default2`
      SELECT * FROM bucket_transfers ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async update(transfer) {
    await connection_default2`
      UPDATE bucket_transfers 
      SET 
        amount = ${transfer.amount.amount},
        transfer_date = ${transfer.date},
        description = ${transfer.description}
      WHERE id = ${transfer.id}
    `;
  }
  async delete(id) {
    await connection_default2`DELETE FROM bucket_transfers WHERE id = ${id}`;
  }
  async findByBucket(bucketId) {
    const result = await connection_default2`
      SELECT * FROM bucket_transfers 
      WHERE bucket_id = ${bucketId}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByBucketAndDateRange(bucketId, dateRange) {
    const result = await connection_default2`
      SELECT * FROM bucket_transfers 
      WHERE bucket_id = ${bucketId}
      AND transfer_date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByDateRange(dateRange) {
    const result = await connection_default2`
      SELECT * FROM bucket_transfers 
      WHERE transfer_date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async getTotalTransfersByBucket(bucketId, dateRange) {
    let query;
    let params = [bucketId];
    if (dateRange) {
      query = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM bucket_transfers 
        WHERE bucket_id = $1 AND transfer_date BETWEEN $2 AND $3
      `;
      params.push(dateRange.startDate, dateRange.endDate);
    } else {
      query = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM bucket_transfers 
        WHERE bucket_id = $1
      `;
    }
    const result = await connection_default2.unsafe(query, params);
    return parseFloat(result[0].total || "0");
  }
  async findByType(type) {
    const operator = type === "deposit" /* DEPOSIT */ ? ">=" : "<";
    const result = await connection_default2`
      SELECT * FROM bucket_transfers 
      WHERE amount ${connection_default2.unsafe(operator)} 0
      ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const result = await connection_default2`
      SELECT * FROM bucket_transfers 
      WHERE transfer_date >= ${startDate} AND transfer_date <= ${endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async findByYear(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const result = await connection_default2`
      SELECT * FROM bucket_transfers 
      WHERE transfer_date >= ${startDate} AND transfer_date <= ${endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    return result.map((row) => this.mapRowToEntity(row));
  }
  async getTotalByBucket(bucketId, type) {
    let query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM bucket_transfers 
      WHERE bucket_id = $1
    `;
    const params = [bucketId];
    if (type) {
      if (type === "deposit" /* DEPOSIT */) {
        query += ` AND amount >= 0`;
      } else {
        query += ` AND amount < 0`;
      }
    }
    const result = await connection_default2.unsafe(query, params);
    return parseFloat(result[0].total || "0");
  }
  async getTotalByBucketAndDateRange(bucketId, dateRange, type) {
    let query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM bucket_transfers 
      WHERE bucket_id = $1 AND transfer_date BETWEEN $2 AND $3
    `;
    const params = [bucketId, dateRange.startDate, dateRange.endDate];
    if (type) {
      if (type === "deposit" /* DEPOSIT */) {
        query += ` AND amount >= 0`;
      } else {
        query += ` AND amount < 0`;
      }
    }
    const result = await connection_default2.unsafe(query, params);
    return parseFloat(result[0].total || "0");
  }
  async exists(id) {
    const result = await connection_default2`
      SELECT 1 FROM bucket_transfers WHERE id = ${id} LIMIT 1
    `;
    return result.length > 0;
  }
  mapRowToEntity(row) {
    const amount = new Money(Math.abs(row.amount));
    const type = row.amount >= 0 ? "deposit" /* DEPOSIT */ : "withdrawal" /* WITHDRAWAL */;
    return new BucketTransfer(row.id, row.transfer_date, amount, type, row.bucket_id, row.description, row.created_at);
  }
}

// src/domain/value-objects/date-range.ts
class DateRange {
  _startDate;
  _endDate;
  constructor(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }
    if (startDate > endDate) {
      throw new Error("Start date cannot be after end date");
    }
    this._startDate = new Date(startDate);
    this._endDate = new Date(endDate);
  }
  get startDate() {
    return new Date(this._startDate);
  }
  get endDate() {
    return new Date(this._endDate);
  }
  contains(date) {
    return date >= this._startDate && date <= this._endDate;
  }
  getDurationInDays() {
    const timeDiff = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }
  overlaps(other) {
    return this._startDate <= other._endDate && this._endDate >= other._startDate;
  }
  equals(other) {
    return this._startDate.getTime() === other._startDate.getTime() && this._endDate.getTime() === other._endDate.getTime();
  }
  toString() {
    return `${this._startDate.toISOString().split("T")[0]} to ${this._endDate.toISOString().split("T")[0]}`;
  }
  static monthlyRange(year, month) {
    if (month < 1 || month > 12) {
      throw new Error("Month must be between 1 and 12");
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return new DateRange(startDate, endDate);
  }
  static yearlyRange(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return new DateRange(startDate, endDate);
  }
  static customRange(startDate, endDate) {
    return new DateRange(new Date(startDate), new Date(endDate));
  }
}

// src/domain/services/transaction-service.ts
class TransactionService {
  transactionRepo;
  categoryRepo;
  paymentMethodRepo;
  constructor(transactionRepo, categoryRepo, paymentMethodRepo) {
    this.transactionRepo = transactionRepo;
    this.categoryRepo = categoryRepo;
    this.paymentMethodRepo = paymentMethodRepo;
  }
  async validateTransaction(transaction) {
    const errors2 = [];
    const category = await this.categoryRepo.findById(transaction.categoryId);
    if (!category) {
      errors2.push("Category not found");
    } else if (!category.isActive) {
      errors2.push("Category is inactive");
    } else if (!category.canBeUsedForTransactionType(transaction.type)) {
      errors2.push(`Category cannot be used for ${transaction.type} transactions`);
    }
    const paymentMethod = await this.paymentMethodRepo.findById(transaction.paymentMethodId);
    if (!paymentMethod) {
      errors2.push("Payment method not found");
    } else if (!paymentMethod.isActive) {
      errors2.push("Payment method is inactive");
    }
    return {
      isValid: errors2.length === 0,
      errors: errors2
    };
  }
  async calculateNetForPeriod(dateRange) {
    const totalIncome = await this.transactionRepo.getTotalIncomeForPeriod(dateRange);
    const totalExpense = await this.transactionRepo.getTotalExpenseForPeriod(dateRange);
    return Money.fromCents(totalIncome - totalExpense);
  }
  async getMonthlyBreakdown(year) {
    const monthlyTotals = await this.transactionRepo.getMonthlyTotals(year);
    return monthlyTotals.map((total) => ({
      month: total.month,
      year: total.year,
      totalIncome: Money.fromCents(total.totalIncome),
      totalExpense: Money.fromCents(total.totalExpense),
      net: Money.fromCents(total.net),
      percentage: this.calculatePercentageChange(total)
    }));
  }
  async getCategorySpending(categoryId, dateRange) {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    const total = await this.transactionRepo.getTotalByCategory(categoryId, dateRange);
    const transactions = dateRange ? await this.transactionRepo.findByDateRange(dateRange) : await this.transactionRepo.findByCategory(categoryId);
    const categoryTransactions = transactions.filter((t) => t.categoryId === categoryId);
    return {
      category: category.name,
      totalAmount: Money.fromCents(total),
      transactionCount: categoryTransactions.length,
      averageAmount: categoryTransactions.length > 0 ? Money.fromCents(total / categoryTransactions.length) : Money.zero(),
      period: dateRange
    };
  }
  async getPaymentMethodUsage(paymentMethodId, dateRange) {
    const paymentMethod = await this.paymentMethodRepo.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }
    const total = await this.transactionRepo.getTotalByPaymentMethod(paymentMethodId, dateRange);
    const transactions = dateRange ? await this.transactionRepo.findByDateRange(dateRange) : await this.transactionRepo.findByPaymentMethod(paymentMethodId);
    const paymentMethodTransactions = transactions.filter((t) => t.paymentMethodId === paymentMethodId);
    return {
      paymentMethod: paymentMethod.name,
      totalAmount: Money.fromCents(total),
      transactionCount: paymentMethodTransactions.length,
      averageAmount: paymentMethodTransactions.length > 0 ? Money.fromCents(total / paymentMethodTransactions.length) : Money.zero(),
      period: dateRange
    };
  }
  async detectDuplicateTransactions(transaction) {
    const startOfDay = new Date(transaction.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(transaction.date);
    endOfDay.setHours(23, 59, 59, 999);
    const dayTransactions = await this.transactionRepo.findByDateRange(new DateRange(startOfDay, endOfDay));
    return dayTransactions.filter((t) => t.id !== transaction.id && t.amount.equals(transaction.amount) && t.categoryId === transaction.categoryId && t.paymentMethodId === transaction.paymentMethodId);
  }
  async calculateRunningBalance(transactions, startingBalance = Money.zero()) {
    let runningBalance = startingBalance;
    const sortedTransactions = transactions.sort((a, b2) => a.date.getTime() - b2.date.getTime());
    return sortedTransactions.map((transaction) => {
      if (transaction.isIncome()) {
        runningBalance = runningBalance.add(transaction.amount);
      } else {
        runningBalance = runningBalance.subtract(transaction.amount);
      }
      return {
        transaction,
        balance: runningBalance
      };
    });
  }
  calculatePercentageChange(total) {
    return 0;
  }
}

// src/domain/services/installment-service.ts
class InstallmentService {
  installmentRepo;
  transactionRepo;
  paymentMethodRepo;
  constructor(installmentRepo, transactionRepo, paymentMethodRepo) {
    this.installmentRepo = installmentRepo;
    this.transactionRepo = transactionRepo;
    this.paymentMethodRepo = paymentMethodRepo;
  }
  async validateInstallmentPlan(plan) {
    const errors2 = [];
    const paymentMethod = await this.paymentMethodRepo.findById(plan.paymentMethodId);
    if (!paymentMethod) {
      errors2.push("Payment method not found");
    } else if (!paymentMethod.supportsInstallments()) {
      errors2.push("Payment method does not support installments");
    } else if (!paymentMethod.isActive) {
      errors2.push("Payment method is inactive");
    }
    return {
      isValid: errors2.length === 0,
      errors: errors2
    };
  }
  async generateInstallmentTransactions(planId) {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error("Installment plan not found");
    }
    if (!plan.isActive()) {
      throw new Error("Cannot generate transactions for inactive installment plan");
    }
    const installmentDates = plan.calculateInstallmentDates();
    const transactions = [];
    for (let i = 0;i < installmentDates.length; i++) {
      const transactionId = `${planId}-installment-${i + 1}`;
      const existingTransaction = await this.transactionRepo.findById(transactionId);
      if (existingTransaction) {
        continue;
      }
      const transaction = Transaction.createFromInstallment(transactionId, installmentDates[i], plan.monthlyAmount, plan.categoryId, plan.paymentMethodId, "expense" /* EXPENSE */, planId, `${plan.description} - Installment ${i + 1}/${plan.installmentCount}`);
      transactions.push(transaction);
    }
    return transactions;
  }
  async generatePendingInstallmentsForMonth(year, month) {
    const pendingPlans = await this.installmentRepo.findPendingInstallmentsForMonth(year, month);
    const allTransactions = [];
    for (const plan of pendingPlans) {
      const installmentDates = plan.calculateInstallmentDates();
      const monthlyInstallments = installmentDates.filter((date) => date.getFullYear() === year && date.getMonth() === month - 1);
      for (const installmentDate of monthlyInstallments) {
        const installmentIndex = installmentDates.findIndex((d) => d.getTime() === installmentDate.getTime());
        const transactionId = `${plan.id}-installment-${installmentIndex + 1}`;
        const existingTransaction = await this.transactionRepo.findById(transactionId);
        if (existingTransaction) {
          continue;
        }
        const transaction = Transaction.createFromInstallment(transactionId, installmentDate, plan.monthlyAmount, plan.categoryId, plan.paymentMethodId, "expense" /* EXPENSE */, plan.id, `${plan.description} - Installment ${installmentIndex + 1}/${plan.installmentCount}`);
        allTransactions.push(transaction);
      }
    }
    return allTransactions;
  }
  async getInstallmentProgress(planId) {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error("Installment plan not found");
    }
    const transactions = await this.transactionRepo.findByInstallmentPlan(planId);
    const paidInstallments = transactions.length;
    const remainingInstallments = plan.installmentCount - paidInstallments;
    const remainingAmount = plan.getRemainingAmount(paidInstallments);
    return {
      planId: plan.id,
      description: plan.description,
      totalInstallments: plan.installmentCount,
      paidInstallments,
      remainingInstallments,
      totalAmount: plan.totalAmount,
      paidAmount: plan.monthlyAmount.multiply(paidInstallments),
      remainingAmount,
      progressPercentage: paidInstallments / plan.installmentCount * 100,
      isCompleted: paidInstallments >= plan.installmentCount,
      nextInstallmentDate: this.getNextInstallmentDate(plan, paidInstallments)
    };
  }
  async markInstallmentAsCompleted(planId) {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error("Installment plan not found");
    }
    const transactions = await this.transactionRepo.findByInstallmentPlan(planId);
    if (transactions.length >= plan.installmentCount) {
      plan.complete();
      await this.installmentRepo.update(plan);
    }
  }
  async cancelInstallmentPlan(planId) {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error("Installment plan not found");
    }
    plan.cancel();
    await this.installmentRepo.update(plan);
  }
  getNextInstallmentDate(plan, paidInstallments) {
    if (paidInstallments >= plan.installmentCount) {
      return null;
    }
    try {
      return plan.getInstallmentDateForIndex(paidInstallments);
    } catch {
      return null;
    }
  }
}

// src/domain/services/subscription-service.ts
class SubscriptionService {
  subscriptionRepo;
  transactionRepo;
  constructor(subscriptionRepo, transactionRepo) {
    this.subscriptionRepo = subscriptionRepo;
    this.transactionRepo = transactionRepo;
  }
  async generateSubscriptionTransactionsForMonth(year, month) {
    const activeSubscriptions = await this.subscriptionRepo.findActiveForMonth(year, month);
    const transactions = [];
    for (const subscription of activeSubscriptions) {
      if (!subscription.shouldGeneratePaymentForMonth(year, month)) {
        continue;
      }
      const transactionId = `${subscription.id}-${year}-${month.toString().padStart(2, "0")}`;
      const existingTransaction = await this.transactionRepo.findById(transactionId);
      if (existingTransaction) {
        continue;
      }
      const paymentDate = new Date(year, month - 1, subscription.startDate.getDate());
      const transaction = Transaction.createFromSubscription(transactionId, paymentDate, subscription.monthlyAmount, subscription.categoryId, subscription.paymentMethodId, "expense" /* EXPENSE */, subscription.id, `${subscription.name} - Monthly payment`);
      transactions.push(transaction);
    }
    return transactions;
  }
  async getSubscriptionOverview(subscriptionId) {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    const transactions = await this.transactionRepo.findBySubscription(subscriptionId);
    const totalPaid = transactions.reduce((sum, t) => sum.add(t.amount), subscription.monthlyAmount.multiply(0));
    const monthsActive = this.calculateMonthsActive(subscription);
    const nextPaymentDate = subscription.getNextPaymentDate();
    return {
      subscriptionId: subscription.id,
      name: subscription.name,
      monthlyAmount: subscription.monthlyAmount,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      monthsActive,
      totalPaid,
      nextPaymentDate,
      isActive: subscription.isActive(),
      paymentCount: transactions.length
    };
  }
  async getActiveSubscriptionsTotal() {
    const activeSubscriptions = await this.subscriptionRepo.findActiveSubscriptions();
    let totalMonthlyAmount = activeSubscriptions[0]?.monthlyAmount.multiply(0) || null;
    for (const subscription of activeSubscriptions) {
      if (totalMonthlyAmount) {
        totalMonthlyAmount = totalMonthlyAmount.add(subscription.monthlyAmount);
      } else {
        totalMonthlyAmount = subscription.monthlyAmount;
      }
    }
    return {
      count: activeSubscriptions.length,
      totalMonthlyAmount,
      subscriptions: activeSubscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        monthlyAmount: s.monthlyAmount
      }))
    };
  }
  async cancelSubscription(subscriptionId, endDate) {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    subscription.cancel(endDate);
    await this.subscriptionRepo.update(subscription);
  }
  async pauseSubscription(subscriptionId) {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    subscription.pause();
    await this.subscriptionRepo.update(subscription);
  }
  async resumeSubscription(subscriptionId) {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    subscription.resume();
    await this.subscriptionRepo.update(subscription);
  }
  async getUpcomingPayments(daysAhead = 30) {
    const activeSubscriptions = await this.subscriptionRepo.findActiveSubscriptions();
    const upcomingPayments = [];
    const now = new Date;
    const futureDate = new Date;
    futureDate.setDate(now.getDate() + daysAhead);
    for (const subscription of activeSubscriptions) {
      const nextPaymentDate = subscription.getNextPaymentDate(now);
      if (nextPaymentDate && nextPaymentDate <= futureDate) {
        upcomingPayments.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          amount: subscription.monthlyAmount,
          dueDate: nextPaymentDate,
          daysUntilDue: Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }
    return upcomingPayments.sort((a, b2) => a.dueDate.getTime() - b2.dueDate.getTime());
  }
  calculateMonthsActive(subscription) {
    const now = new Date;
    const endDate = subscription.endDate || now;
    const startDate = subscription.startDate;
    const monthsActive = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    return Math.max(0, monthsActive);
  }
}

// src/domain/services/reporting-service.ts
class ReportingService {
  transactionRepo;
  categoryRepo;
  paymentMethodRepo;
  subscriptionRepo;
  savingsBucketRepo;
  constructor(transactionRepo, categoryRepo, paymentMethodRepo, subscriptionRepo, savingsBucketRepo) {
    this.transactionRepo = transactionRepo;
    this.categoryRepo = categoryRepo;
    this.paymentMethodRepo = paymentMethodRepo;
    this.subscriptionRepo = subscriptionRepo;
    this.savingsBucketRepo = savingsBucketRepo;
  }
  async generateMonthlyReport(year, month) {
    const dateRange = DateRange.monthlyRange(year, month);
    const [
      transactions,
      totalIncome,
      totalExpense,
      categories,
      paymentMethods
    ] = await Promise.all([
      this.transactionRepo.findByMonth(year, month),
      this.transactionRepo.getTotalIncomeForPeriod(dateRange),
      this.transactionRepo.getTotalExpenseForPeriod(dateRange),
      this.categoryRepo.findAll(),
      this.paymentMethodRepo.findAll()
    ]);
    const net2 = totalIncome - totalExpense;
    const categoryBreakdown = await this.generateCategoryBreakdown(categories, dateRange);
    const paymentMethodBreakdown = await this.generatePaymentMethodBreakdown(paymentMethods, dateRange);
    const topExpenseCategories = categoryBreakdown.filter((c) => c.type === "expense" /* EXPENSE */).sort((a, b2) => b2.totalAmount.amount - a.totalAmount.amount).slice(0, 5);
    const topIncomeCategories = categoryBreakdown.filter((c) => c.type === "income" /* INCOME */).sort((a, b2) => b2.totalAmount.amount - a.totalAmount.amount).slice(0, 5);
    return {
      period: dateRange,
      summary: {
        totalIncome: Money.fromCents(totalIncome),
        totalExpense: Money.fromCents(totalExpense),
        net: Money.fromCents(net2),
        transactionCount: transactions.length,
        averageTransactionAmount: transactions.length > 0 ? Money.fromCents((totalIncome + totalExpense) / transactions.length) : Money.zero()
      },
      categoryBreakdown,
      paymentMethodBreakdown,
      topExpenseCategories,
      topIncomeCategories,
      dailyTrends: this.calculateDailyTrends(transactions, dateRange)
    };
  }
  async generateYearlyReport(year) {
    const dateRange = DateRange.yearlyRange(year);
    const [
      monthlyTotals,
      totalIncome,
      totalExpense,
      categories,
      yearlyTransactions
    ] = await Promise.all([
      this.transactionRepo.getMonthlyTotals(year),
      this.transactionRepo.getTotalIncomeForPeriod(dateRange),
      this.transactionRepo.getTotalExpenseForPeriod(dateRange),
      this.categoryRepo.findAll(),
      this.transactionRepo.findByYear(year)
    ]);
    const net2 = totalIncome - totalExpense;
    const categoryBreakdown = await this.generateCategoryBreakdown(categories, dateRange);
    const monthlyBreakdown = monthlyTotals.map((m) => ({
      month: m.month,
      year: m.year,
      totalIncome: Money.fromCents(m.totalIncome),
      totalExpense: Money.fromCents(m.totalExpense),
      net: Money.fromCents(m.net)
    }));
    const avgMonthlyIncome = Money.fromCents(totalIncome / 12);
    const avgMonthlyExpense = Money.fromCents(totalExpense / 12);
    return {
      year,
      period: dateRange,
      summary: {
        totalIncome: Money.fromCents(totalIncome),
        totalExpense: Money.fromCents(totalExpense),
        net: Money.fromCents(net2),
        avgMonthlyIncome,
        avgMonthlyExpense,
        transactionCount: yearlyTransactions.length,
        monthsWithData: monthlyTotals.length
      },
      monthlyBreakdown,
      categoryBreakdown,
      trends: this.calculateYearlyTrends(monthlyTotals)
    };
  }
  async generateCashFlowReport(dateRange) {
    const transactions = await this.transactionRepo.findByDateRange(dateRange);
    const sortedTransactions = transactions.sort((a, b2) => a.date.getTime() - b2.date.getTime());
    let runningBalance = Money.zero();
    const dailyBalances = [];
    const cashFlowItems = [];
    const transactionsByDay = new Map;
    for (const transaction of sortedTransactions) {
      const dateKey = transaction.date.toISOString().split("T")[0];
      if (!transactionsByDay.has(dateKey)) {
        transactionsByDay.set(dateKey, []);
      }
      transactionsByDay.get(dateKey).push(transaction);
    }
    for (const [dateStr, dayTransactions] of transactionsByDay) {
      let dailyIncome = Money.zero();
      let dailyExpense = Money.zero();
      for (const transaction of dayTransactions) {
        const item = {
          date: transaction.date,
          description: transaction.description || "No description",
          amount: transaction.amount,
          type: transaction.type,
          category: "Unknown",
          balance: runningBalance
        };
        if (transaction.isIncome()) {
          runningBalance = runningBalance.add(transaction.amount);
          dailyIncome = dailyIncome.add(transaction.amount);
        } else {
          runningBalance = runningBalance.subtract(transaction.amount);
          dailyExpense = dailyExpense.add(transaction.amount);
        }
        item.balance = runningBalance;
        cashFlowItems.push(item);
      }
      dailyBalances.push({
        date: new Date(dateStr),
        income: dailyIncome,
        expense: dailyExpense,
        net: dailyIncome.subtract(dailyExpense),
        balance: runningBalance
      });
    }
    return {
      period: dateRange,
      openingBalance: Money.zero(),
      closingBalance: runningBalance,
      totalInflow: cashFlowItems.filter((item) => item.type === "income" /* INCOME */).reduce((sum, item) => sum.add(item.amount), Money.zero()),
      totalOutflow: cashFlowItems.filter((item) => item.type === "expense" /* EXPENSE */).reduce((sum, item) => sum.add(item.amount), Money.zero()),
      dailyBalances,
      cashFlowItems
    };
  }
  async generateCategoryBreakdown(categories, dateRange) {
    const breakdown = [];
    for (const category of categories) {
      const total = await this.transactionRepo.getTotalByCategory(category.id, dateRange);
      if (total > 0) {
        breakdown.push({
          categoryId: category.id,
          categoryName: category.name,
          type: category.type,
          totalAmount: Money.fromCents(total),
          transactionCount: 0,
          averageAmount: Money.zero(),
          percentage: 0
        });
      }
    }
    return breakdown;
  }
  async generatePaymentMethodBreakdown(paymentMethods, dateRange) {
    const breakdown = [];
    for (const paymentMethod of paymentMethods) {
      const total = await this.transactionRepo.getTotalByPaymentMethod(paymentMethod.id, dateRange);
      if (total > 0) {
        breakdown.push({
          paymentMethodId: paymentMethod.id,
          paymentMethodName: paymentMethod.name,
          paymentMethodType: paymentMethod.type,
          totalAmount: Money.fromCents(total),
          transactionCount: 0,
          percentage: 0
        });
      }
    }
    return breakdown;
  }
  calculateDailyTrends(transactions, dateRange) {
    return [];
  }
  calculateYearlyTrends(monthlyTotals) {
    return {
      incomeGrowth: 0,
      expenseGrowth: 0,
      bestMonth: { month: 1, net: Money.zero() },
      worstMonth: { month: 1, net: Money.zero() }
    };
  }
}

// src/domain/services/savings-bucket-service.ts
class SavingsBucketService {
  bucketRepo;
  transferRepo;
  constructor(bucketRepo, transferRepo) {
    this.bucketRepo = bucketRepo;
    this.transferRepo = transferRepo;
  }
  async depositToBucket(bucketId, amount, description) {
    const bucket = await this.bucketRepo.findById(bucketId);
    if (!bucket) {
      throw new Error("Savings bucket not found");
    }
    if (!bucket.isActive) {
      throw new Error("Cannot deposit to inactive bucket");
    }
    bucket.addFunds(amount);
    await this.bucketRepo.update(bucket);
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transfer = BucketTransfer.createDeposit(transferId, new Date, amount, bucketId, description);
    await this.transferRepo.save(transfer);
    return transfer;
  }
  async withdrawFromBucket(bucketId, amount, description) {
    const bucket = await this.bucketRepo.findById(bucketId);
    if (!bucket) {
      throw new Error("Savings bucket not found");
    }
    if (!bucket.isActive) {
      throw new Error("Cannot withdraw from inactive bucket");
    }
    if (!bucket.canWithdraw(amount)) {
      throw new Error("Insufficient funds in bucket");
    }
    bucket.withdrawFunds(amount);
    await this.bucketRepo.update(bucket);
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transfer = BucketTransfer.createWithdrawal(transferId, new Date, amount, bucketId, description);
    await this.transferRepo.save(transfer);
    return transfer;
  }
  async getBucketSummary(bucketId) {
    const bucket = await this.bucketRepo.findById(bucketId);
    if (!bucket) {
      throw new Error("Savings bucket not found");
    }
    const transfers = await this.transferRepo.findByBucket(bucketId);
    const deposits = transfers.filter((t) => t.isDeposit());
    const withdrawals = transfers.filter((t) => t.isWithdrawal());
    const totalDeposits = deposits.reduce((sum, t) => sum.add(t.amount), Money.zero());
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum.add(t.amount), Money.zero());
    return {
      bucketId: bucket.id,
      name: bucket.name,
      description: bucket.description,
      currentBalance: bucket.currentBalance,
      targetAmount: bucket.targetAmount,
      progressPercentage: bucket.getProgressPercentage(),
      remainingAmount: bucket.getRemainingAmount(),
      isTargetReached: bucket.isTargetReached(),
      totalDeposits,
      totalWithdrawals,
      transferCount: transfers.length,
      isActive: bucket.isActive
    };
  }
  async getAllBucketsSummary() {
    const allBuckets = await this.bucketRepo.findAll();
    const activeBuckets = allBuckets.filter((b2) => b2.isActive);
    let totalBalance = Money.zero();
    let totalTargetAmount = Money.zero();
    let bucketsWithTargets = 0;
    let targetsReached = 0;
    const bucketSummaries = [];
    for (const bucket of activeBuckets) {
      const summary = await this.getBucketSummary(bucket.id);
      bucketSummaries.push(summary);
      totalBalance = totalBalance.add(bucket.currentBalance);
      if (bucket.hasTarget()) {
        bucketsWithTargets++;
        totalTargetAmount = totalTargetAmount.add(bucket.targetAmount);
        if (bucket.isTargetReached()) {
          targetsReached++;
        }
      }
    }
    return {
      totalBuckets: activeBuckets.length,
      totalBalance,
      totalTargetAmount: bucketsWithTargets > 0 ? totalTargetAmount : null,
      bucketsWithTargets,
      targetsReached,
      overallProgress: bucketsWithTargets > 0 ? totalBalance.amount / totalTargetAmount.amount * 100 : null,
      buckets: bucketSummaries
    };
  }
  async getTransferHistory(bucketId, dateRange) {
    if (dateRange) {
      return this.transferRepo.findByBucketAndDateRange(bucketId, dateRange);
    }
    return this.transferRepo.findByBucket(bucketId);
  }
  async calculateSavingsRate(dateRange) {
    const allBuckets = await this.bucketRepo.findActiveBuckets();
    let totalDeposits = Money.zero();
    let totalWithdrawals = Money.zero();
    for (const bucket of allBuckets) {
      const deposits = await this.transferRepo.getTotalByBucketAndDateRange(bucket.id, dateRange, "deposit" /* DEPOSIT */);
      const withdrawals = await this.transferRepo.getTotalByBucketAndDateRange(bucket.id, dateRange, "withdrawal" /* WITHDRAWAL */);
      totalDeposits = totalDeposits.add(Money.fromCents(deposits));
      totalWithdrawals = totalWithdrawals.add(Money.fromCents(withdrawals));
    }
    const netSavings = totalDeposits.subtract(totalWithdrawals);
    return {
      period: dateRange,
      totalDeposits,
      totalWithdrawals,
      netSavings,
      savingsCount: allBuckets.length
    };
  }
  async suggestTargetReallocation() {
    const bucketsWithTargets = await this.bucketRepo.findBucketsWithTargets();
    const suggestions = [];
    for (const bucket of bucketsWithTargets) {
      if (bucket.isTargetReached()) {
        suggestions.push({
          bucketId: bucket.id,
          bucketName: bucket.name,
          currentBalance: bucket.currentBalance,
          currentTarget: bucket.targetAmount,
          suggestion: "Consider increasing the target amount or creating a new savings goal",
          type: "INCREASE_TARGET"
        });
      } else {
        const progress = bucket.getProgressPercentage();
        if (progress !== null && progress < 10) {
          suggestions.push({
            bucketId: bucket.id,
            bucketName: bucket.name,
            currentBalance: bucket.currentBalance,
            currentTarget: bucket.targetAmount,
            suggestion: "Consider setting up automatic transfers to reach your goal faster",
            type: "AUTOMATE_SAVINGS"
          });
        }
      }
    }
    return suggestions;
  }
}

// src/application/dto/transaction.dto.ts
class TransactionDTOMapper {
  static toResponseDTO(transaction) {
    return {
      id: transaction.id,
      date: transaction.date.toISOString(),
      amount: transaction.amount.amount,
      currency: transaction.amount.currency,
      categoryId: transaction.categoryId,
      paymentMethodId: transaction.paymentMethodId,
      type: transaction.type,
      description: transaction.description,
      source: transaction.source,
      sourceId: transaction.sourceId,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString()
    };
  }
  static toDomainMoney(amount, currency = "BRL") {
    return new Money(amount, currency);
  }
  static toDomainType(type) {
    return type === "income" ? "income" /* INCOME */ : "expense" /* EXPENSE */;
  }
  static toDomainSource(source) {
    switch (source) {
      case "installment":
        return "installment" /* INSTALLMENT */;
      case "subscription":
        return "subscription" /* SUBSCRIPTION */;
      default:
        return "manual" /* MANUAL */;
    }
  }
}

// src/application/use-cases/transaction/create-transaction.use-case.ts
class CreateTransactionUseCase {
  transactionRepo;
  categoryRepo;
  paymentMethodRepo;
  transactionService;
  constructor(transactionRepo, categoryRepo, paymentMethodRepo, transactionService) {
    this.transactionRepo = transactionRepo;
    this.categoryRepo = categoryRepo;
    this.paymentMethodRepo = paymentMethodRepo;
    this.transactionService = transactionService;
  }
  async execute(dto) {
    try {
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }
      const amount = TransactionDTOMapper.toDomainMoney(dto.amount, dto.currency);
      const type = TransactionDTOMapper.toDomainType(dto.type);
      const date = new Date(dto.date);
      const id = this.generateId();
      const transaction = Transaction.createManual(id, date, amount, dto.categoryId, dto.paymentMethodId, type, dto.description);
      const validationResult = await this.transactionService.validateTransaction(transaction);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      const duplicates = await this.transactionService.detectDuplicateTransactions(transaction);
      if (duplicates.length > 0) {
        return {
          success: false,
          errors: ["Potential duplicate transaction detected. Please verify this transaction is unique."]
        };
      }
      await this.transactionRepo.save(transaction);
      return {
        success: true,
        transaction: TransactionDTOMapper.toResponseDTO(transaction)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create transaction: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  async validateRelatedEntities(dto) {
    const errors2 = [];
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      errors2.push("Category not found");
    } else if (!category.isActive) {
      errors2.push("Category is not active");
    } else if (!category.canBeUsedForTransactionType(TransactionDTOMapper.toDomainType(dto.type))) {
      errors2.push(`Category cannot be used for ${dto.type} transactions`);
    }
    const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
    if (!paymentMethod) {
      errors2.push("Payment method not found");
    } else if (!paymentMethod.isActive) {
      errors2.push("Payment method is not active");
    }
    return errors2;
  }
  generateId() {
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// src/application/use-cases/transaction/update-transaction.use-case.ts
class UpdateTransactionUseCase {
  transactionRepo;
  categoryRepo;
  paymentMethodRepo;
  transactionService;
  constructor(transactionRepo, categoryRepo, paymentMethodRepo, transactionService) {
    this.transactionRepo = transactionRepo;
    this.categoryRepo = categoryRepo;
    this.paymentMethodRepo = paymentMethodRepo;
    this.transactionService = transactionService;
  }
  async execute(id, dto) {
    try {
      const transaction = await this.transactionRepo.findById(id);
      if (!transaction) {
        return {
          success: false,
          errors: ["Transaction not found"]
        };
      }
      if (!transaction.isManual()) {
        return {
          success: false,
          errors: ["Only manual transactions can be updated. Installment and subscription transactions are read-only."]
        };
      }
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }
      if (dto.date !== undefined) {
        transaction.updateDate(new Date(dto.date));
      }
      if (dto.amount !== undefined) {
        const amount = TransactionDTOMapper.toDomainMoney(dto.amount, dto.currency);
        transaction.updateAmount(amount);
      }
      if (dto.categoryId !== undefined) {
        transaction.updateCategory(dto.categoryId);
      }
      if (dto.paymentMethodId !== undefined) {
        transaction.updatePaymentMethod(dto.paymentMethodId);
      }
      if (dto.description !== undefined) {
        transaction.updateDescription(dto.description);
      }
      const validationResult = await this.transactionService.validateTransaction(transaction);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      await this.transactionRepo.update(transaction);
      return {
        success: true,
        transaction: TransactionDTOMapper.toResponseDTO(transaction)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to update transaction: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  async validateRelatedEntities(dto) {
    const errors2 = [];
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category) {
        errors2.push("Category not found");
      } else if (!category.isActive) {
        errors2.push("Category is not active");
      }
    }
    if (dto.paymentMethodId !== undefined) {
      const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
      if (!paymentMethod) {
        errors2.push("Payment method not found");
      } else if (!paymentMethod.isActive) {
        errors2.push("Payment method is not active");
      }
    }
    return errors2;
  }
}

// src/application/use-cases/transaction/delete-transaction.use-case.ts
class DeleteTransactionUseCase {
  transactionRepo;
  constructor(transactionRepo) {
    this.transactionRepo = transactionRepo;
  }
  async execute(id) {
    try {
      const transaction = await this.transactionRepo.findById(id);
      if (!transaction) {
        return {
          success: false,
          errors: ["Transaction not found"]
        };
      }
      if (!transaction.isManual()) {
        return {
          success: false,
          errors: [
            "Only manual transactions can be deleted. " + "To remove installment or subscription transactions, cancel the plan or subscription instead."
          ]
        };
      }
      await this.transactionRepo.delete(id);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to delete transaction: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
}

// src/application/use-cases/transaction/list-transactions.use-case.ts
class ListTransactionsUseCase {
  transactionRepo;
  constructor(transactionRepo) {
    this.transactionRepo = transactionRepo;
  }
  async execute(dto) {
    try {
      const filters = this.buildFilters(dto);
      const result = await this.transactionRepo.findPaginated(dto.page || 1, dto.limit || 20, filters);
      const response = {
        items: result.items.map((transaction) => TransactionDTOMapper.toResponseDTO(transaction)),
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      };
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to list transactions: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  buildFilters(dto) {
    const filters = {};
    if (dto.categoryId) {
      filters.categoryId = dto.categoryId;
    }
    if (dto.paymentMethodId) {
      filters.paymentMethodId = dto.paymentMethodId;
    }
    if (dto.startDate) {
      filters.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      filters.endDate = new Date(dto.endDate);
    }
    if (dto.type) {
      filters.type = dto.type;
    }
    if (dto.source) {
      filters.source = dto.source;
    }
    if (dto.description) {
      filters.description = dto.description;
    }
    if (dto.minAmount !== undefined) {
      filters.minAmount = dto.minAmount;
    }
    if (dto.maxAmount !== undefined) {
      filters.maxAmount = dto.maxAmount;
    }
    return filters;
  }
}

// src/application/dto/installment-plan.dto.ts
class InstallmentPlanDTOMapper {
  static toResponseDTO(plan) {
    return {
      id: plan.id,
      totalAmount: plan.totalAmount.amount,
      currency: plan.totalAmount.currency,
      purchaseDate: plan.purchaseDate.toISOString(),
      installmentCount: plan.installmentCount,
      monthlyAmount: plan.monthlyAmount.amount,
      description: plan.description,
      paymentMethodId: plan.paymentMethodId,
      categoryId: plan.categoryId,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString()
    };
  }
  static toDomainMoney(amount, currency = "BRL") {
    return new Money(amount, currency);
  }
  static toProgressResponseDTO(progress) {
    return {
      planId: progress.planId,
      description: progress.description,
      totalInstallments: progress.totalInstallments,
      paidInstallments: progress.paidInstallments,
      remainingInstallments: progress.remainingInstallments,
      totalAmount: progress.totalAmount.amount,
      currency: progress.totalAmount.currency,
      paidAmount: progress.paidAmount.amount,
      remainingAmount: progress.remainingAmount.amount,
      progressPercentage: progress.progressPercentage,
      isCompleted: progress.isCompleted,
      nextInstallmentDate: progress.nextInstallmentDate?.toISOString() || null
    };
  }
}

// src/application/use-cases/installment/create-installment-plan.use-case.ts
class CreateInstallmentPlanUseCase {
  installmentPlanRepo;
  categoryRepo;
  paymentMethodRepo;
  installmentService;
  constructor(installmentPlanRepo, categoryRepo, paymentMethodRepo, installmentService) {
    this.installmentPlanRepo = installmentPlanRepo;
    this.categoryRepo = categoryRepo;
    this.paymentMethodRepo = paymentMethodRepo;
    this.installmentService = installmentService;
  }
  async execute(dto) {
    try {
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }
      const totalAmount = InstallmentPlanDTOMapper.toDomainMoney(dto.totalAmount, dto.currency);
      const purchaseDate = new Date(dto.purchaseDate);
      const id = this.generateId();
      const installmentPlan = InstallmentPlan.create(id, totalAmount, purchaseDate, dto.installmentCount, dto.description, dto.paymentMethodId, dto.categoryId);
      const validationResult = await this.installmentService.validateInstallmentPlan(installmentPlan);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      await this.installmentPlanRepo.save(installmentPlan);
      try {
        await this.installmentService.generateInstallmentTransactions(installmentPlan.id);
      } catch (error) {
        await this.installmentPlanRepo.delete(installmentPlan.id);
        throw new Error(`Failed to generate installment transactions: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return {
        success: true,
        installmentPlan: InstallmentPlanDTOMapper.toResponseDTO(installmentPlan)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create installment plan: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  async validateRelatedEntities(dto) {
    const errors2 = [];
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      errors2.push("Category not found");
    } else if (!category.isActive) {
      errors2.push("Category is not active");
    } else if (!category.canBeUsedForTransactionType("expense" /* EXPENSE */)) {
      errors2.push("Category cannot be used for expense transactions");
    }
    const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
    if (!paymentMethod) {
      errors2.push("Payment method not found");
    } else if (!paymentMethod.isActive) {
      errors2.push("Payment method is not active");
    } else if (!paymentMethod.supportsInstallments()) {
      errors2.push("Payment method does not support installments");
    }
    return errors2;
  }
  generateId() {
    return `ip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// src/application/dto/subscription.dto.ts
class SubscriptionDTOMapper {
  static toResponseDTO(subscription) {
    return {
      id: subscription.id,
      name: subscription.name,
      monthlyAmount: subscription.monthlyAmount.amount,
      currency: subscription.monthlyAmount.currency,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate?.toISOString() || null,
      categoryId: subscription.categoryId,
      paymentMethodId: subscription.paymentMethodId,
      status: subscription.status,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString()
    };
  }
  static toDomainMoney(amount, currency = "BRL") {
    return new Money(amount, currency);
  }
  static toOverviewResponseDTO(overview) {
    return {
      subscriptionId: overview.subscriptionId,
      name: overview.name,
      monthlyAmount: overview.monthlyAmount.amount,
      currency: overview.monthlyAmount.currency,
      status: overview.status,
      startDate: overview.startDate.toISOString(),
      endDate: overview.endDate?.toISOString() || null,
      monthsActive: overview.monthsActive,
      totalPaid: overview.totalPaid.amount,
      nextPaymentDate: overview.nextPaymentDate?.toISOString() || null,
      isActive: overview.isActive,
      paymentCount: overview.paymentCount
    };
  }
  static toUpcomingPaymentResponseDTO(payment) {
    return {
      subscriptionId: payment.subscriptionId,
      subscriptionName: payment.subscriptionName,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      dueDate: payment.dueDate.toISOString(),
      daysUntilDue: payment.daysUntilDue
    };
  }
}

// src/application/use-cases/subscription/create-subscription.use-case.ts
class CreateSubscriptionUseCase {
  subscriptionRepo;
  categoryRepo;
  paymentMethodRepo;
  constructor(subscriptionRepo, categoryRepo, paymentMethodRepo) {
    this.subscriptionRepo = subscriptionRepo;
    this.categoryRepo = categoryRepo;
    this.paymentMethodRepo = paymentMethodRepo;
  }
  async execute(dto) {
    try {
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }
      const existingSubscription = await this.subscriptionRepo.findByName(dto.name);
      if (existingSubscription && existingSubscription.isActive()) {
        return {
          success: false,
          errors: ["A subscription with this name already exists"]
        };
      }
      const monthlyAmount = SubscriptionDTOMapper.toDomainMoney(dto.monthlyAmount, dto.currency);
      const startDate = new Date(dto.startDate);
      const endDate = dto.endDate ? new Date(dto.endDate) : null;
      const id = this.generateId();
      const subscription = new Subscription(id, dto.name, monthlyAmount, startDate, dto.categoryId, dto.paymentMethodId, endDate);
      await this.subscriptionRepo.save(subscription);
      return {
        success: true,
        subscription: SubscriptionDTOMapper.toResponseDTO(subscription)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create subscription: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  async validateRelatedEntities(dto) {
    const errors2 = [];
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      errors2.push("Category not found");
    } else if (!category.isActive) {
      errors2.push("Category is not active");
    } else if (!category.canBeUsedForTransactionType("expense" /* EXPENSE */)) {
      errors2.push("Category cannot be used for expense transactions");
    }
    const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
    if (!paymentMethod) {
      errors2.push("Payment method not found");
    } else if (!paymentMethod.isActive) {
      errors2.push("Payment method is not active");
    }
    if (dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);
      if (endDate <= startDate) {
        errors2.push("End date must be after start date");
      }
    }
    return errors2;
  }
  generateId() {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// src/application/use-cases/subscription/cancel-subscription.use-case.ts
class CancelSubscriptionUseCase {
  subscriptionRepo;
  constructor(subscriptionRepo) {
    this.subscriptionRepo = subscriptionRepo;
  }
  async execute(id, dto) {
    try {
      const subscription = await this.subscriptionRepo.findById(id);
      if (!subscription) {
        return {
          success: false,
          errors: ["Subscription not found"]
        };
      }
      if (subscription.isCancelled()) {
        return {
          success: false,
          errors: ["Subscription is already cancelled"]
        };
      }
      const endDate = dto.endDate ? new Date(dto.endDate) : new Date;
      subscription.cancel(endDate);
      await this.subscriptionRepo.update(subscription);
      return {
        success: true,
        subscription: SubscriptionDTOMapper.toResponseDTO(subscription)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to cancel subscription: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
}

// src/application/dto/report.dto.ts
class ReportDTOMapper {
  static toMonthlyReportResponseDTO(report) {
    return {
      period: {
        year: report.period.startDate.getFullYear(),
        month: report.period.startDate.getMonth() + 1,
        startDate: report.period.startDate.toISOString(),
        endDate: report.period.endDate.toISOString()
      },
      summary: {
        totalIncome: report.summary.totalIncome.amount,
        totalExpense: report.summary.totalExpense.amount,
        net: report.summary.net.amount,
        currency: report.summary.totalIncome.currency,
        transactionCount: report.summary.transactionCount,
        averageTransactionAmount: report.summary.averageTransactionAmount.amount
      },
      categoryBreakdown: report.categoryBreakdown.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage
      })),
      paymentMethodBreakdown: report.paymentMethodBreakdown.map((item) => ({
        paymentMethodId: item.paymentMethodId,
        paymentMethodName: item.paymentMethodName,
        paymentMethodType: item.paymentMethodType,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        percentage: item.percentage
      })),
      topExpenseCategories: report.topExpenseCategories.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage
      })),
      topIncomeCategories: report.topIncomeCategories.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage
      })),
      dailyTrends: report.dailyTrends.map((trend) => ({
        date: trend.date.toISOString(),
        income: trend.income.amount,
        expense: trend.expense.amount,
        net: trend.net.amount,
        currency: trend.income.currency
      }))
    };
  }
  static toYearlyReportResponseDTO(report) {
    return {
      year: report.year,
      period: {
        startDate: report.period.startDate.toISOString(),
        endDate: report.period.endDate.toISOString()
      },
      summary: {
        totalIncome: report.summary.totalIncome.amount,
        totalExpense: report.summary.totalExpense.amount,
        net: report.summary.net.amount,
        currency: report.summary.totalIncome.currency,
        avgMonthlyIncome: report.summary.avgMonthlyIncome.amount,
        avgMonthlyExpense: report.summary.avgMonthlyExpense.amount,
        transactionCount: report.summary.transactionCount,
        monthsWithData: report.summary.monthsWithData
      },
      monthlyBreakdown: report.monthlyBreakdown.map((item) => ({
        month: item.month,
        year: item.year,
        totalIncome: item.totalIncome.amount,
        totalExpense: item.totalExpense.amount,
        net: item.net.amount,
        currency: item.totalIncome.currency
      })),
      categoryBreakdown: report.categoryBreakdown.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage
      })),
      trends: {
        incomeGrowth: report.trends.incomeGrowth,
        expenseGrowth: report.trends.expenseGrowth,
        bestMonth: {
          month: report.trends.bestMonth.month,
          net: report.trends.bestMonth.net.amount,
          currency: report.trends.bestMonth.net.currency
        },
        worstMonth: {
          month: report.trends.worstMonth.month,
          net: report.trends.worstMonth.net.amount,
          currency: report.trends.worstMonth.net.currency
        }
      }
    };
  }
}

// src/application/use-cases/report/generate-monthly-report.use-case.ts
class GenerateMonthlyReportUseCase {
  reportingService;
  constructor(reportingService) {
    this.reportingService = reportingService;
  }
  async execute(dto) {
    try {
      const errors2 = this.validateDate(dto.year, dto.month);
      if (errors2.length > 0) {
        return {
          success: false,
          errors: errors2
        };
      }
      const report = await this.reportingService.generateMonthlyReport(dto.year, dto.month);
      return {
        success: true,
        report: ReportDTOMapper.toMonthlyReportResponseDTO(report)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to generate monthly report: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  validateDate(year, month) {
    const errors2 = [];
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 1) {
      errors2.push("Year must be between 2000 and next year");
    }
    if (month < 1 || month > 12) {
      errors2.push("Month must be between 1 and 12");
    }
    const reportDate = new Date(year, month - 1, 1);
    const currentDate = new Date;
    const maxDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (reportDate > maxDate) {
      errors2.push("Cannot generate report for future months beyond next month");
    }
    return errors2;
  }
}

// src/application/use-cases/report/generate-yearly-report.use-case.ts
class GenerateYearlyReportUseCase {
  reportingService;
  constructor(reportingService) {
    this.reportingService = reportingService;
  }
  async execute(dto) {
    try {
      const errors2 = this.validateYear(dto.year);
      if (errors2.length > 0) {
        return {
          success: false,
          errors: errors2
        };
      }
      const report = await this.reportingService.generateYearlyReport(dto.year);
      return {
        success: true,
        report: ReportDTOMapper.toYearlyReportResponseDTO(report)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to generate yearly report: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  validateYear(year) {
    const errors2 = [];
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear) {
      errors2.push("Year must be between 2000 and current year");
    }
    if (year > currentYear) {
      errors2.push("Cannot generate report for future years");
    }
    return errors2;
  }
}

// src/application/dto/savings-bucket.dto.ts
class SavingsBucketDTOMapper {
  static toResponseDTO(bucket) {
    return {
      id: bucket.id,
      name: bucket.name,
      targetAmount: bucket.targetAmount?.amount || null,
      currency: bucket.currentBalance.currency,
      currentBalance: bucket.currentBalance.amount,
      description: bucket.description,
      isActive: bucket.isActive,
      createdAt: bucket.createdAt.toISOString(),
      updatedAt: bucket.updatedAt.toISOString(),
      progressPercentage: bucket.getProgressPercentage(),
      remainingAmount: bucket.getRemainingAmount()?.amount || null,
      isTargetReached: bucket.isTargetReached()
    };
  }
  static toTransferResponseDTO(transfer) {
    return {
      id: transfer.id,
      bucketId: transfer.bucketId,
      amount: transfer.amount.amount,
      currency: transfer.amount.currency,
      type: transfer.type,
      description: transfer.description,
      date: transfer.date.toISOString(),
      createdAt: transfer.createdAt.toISOString()
    };
  }
  static toBucketSummaryResponseDTO(summary) {
    return {
      bucketId: summary.bucketId,
      name: summary.name,
      description: summary.description,
      currentBalance: summary.currentBalance.amount,
      currency: summary.currentBalance.currency,
      targetAmount: summary.targetAmount?.amount || null,
      progressPercentage: summary.progressPercentage,
      remainingAmount: summary.remainingAmount?.amount || null,
      isTargetReached: summary.isTargetReached,
      totalDeposits: summary.totalDeposits.amount,
      totalWithdrawals: summary.totalWithdrawals.amount,
      transferCount: summary.transferCount,
      isActive: summary.isActive
    };
  }
  static toDomainMoney(amount, currency = "BRL") {
    return new Money(amount, currency);
  }
}

// src/application/use-cases/savings-bucket/create-savings-bucket.use-case.ts
class CreateSavingsBucketUseCase {
  savingsBucketRepo;
  constructor(savingsBucketRepo) {
    this.savingsBucketRepo = savingsBucketRepo;
  }
  async execute(dto) {
    try {
      const existingBucket = await this.savingsBucketRepo.findByName(dto.name);
      if (existingBucket && existingBucket.isActive) {
        return {
          success: false,
          errors: ["A savings bucket with this name already exists"]
        };
      }
      const targetAmount = dto.targetAmount ? SavingsBucketDTOMapper.toDomainMoney(dto.targetAmount, dto.currency) : null;
      const initialBalance = dto.initialBalance ? SavingsBucketDTOMapper.toDomainMoney(dto.initialBalance, dto.currency) : null;
      const id = this.generateId();
      let bucket;
      if (initialBalance) {
        bucket = SavingsBucket.createWithInitialBalance(id, dto.name, initialBalance, targetAmount || undefined, dto.description);
      } else {
        bucket = SavingsBucket.create(id, dto.name, targetAmount || undefined, dto.description);
      }
      await this.savingsBucketRepo.save(bucket);
      return {
        success: true,
        bucket: SavingsBucketDTOMapper.toResponseDTO(bucket)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create savings bucket: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
  generateId() {
    return `bucket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// src/application/use-cases/savings-bucket/transfer-to-bucket.use-case.ts
class TransferToBucketUseCase {
  savingsBucketRepo;
  savingsBucketService;
  constructor(savingsBucketRepo, savingsBucketService) {
    this.savingsBucketRepo = savingsBucketRepo;
    this.savingsBucketService = savingsBucketService;
  }
  async execute(bucketId, dto) {
    try {
      const bucket = await this.savingsBucketRepo.findById(bucketId);
      if (!bucket) {
        return {
          success: false,
          errors: ["Savings bucket not found"]
        };
      }
      if (!bucket.isActive) {
        return {
          success: false,
          errors: ["Savings bucket is not active"]
        };
      }
      const amount = SavingsBucketDTOMapper.toDomainMoney(dto.amount, dto.currency);
      let transfer;
      if (dto.type === "deposit") {
        transfer = await this.savingsBucketService.depositToBucket(bucketId, amount, dto.description);
      } else {
        if (!bucket.canWithdraw(amount)) {
          return {
            success: false,
            errors: ["Insufficient funds in bucket for withdrawal"]
          };
        }
        transfer = await this.savingsBucketService.withdrawFromBucket(bucketId, amount, dto.description);
      }
      return {
        success: true,
        transfer: SavingsBucketDTOMapper.toTransferResponseDTO(transfer)
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to process transfer: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
    }
  }
}

// src/infrastructure/web/controllers/transaction.controller.ts
class TransactionController {
  createTransactionUseCase;
  updateTransactionUseCase;
  deleteTransactionUseCase;
  listTransactionsUseCase;
  constructor(createTransactionUseCase, updateTransactionUseCase, deleteTransactionUseCase, listTransactionsUseCase) {
    this.createTransactionUseCase = createTransactionUseCase;
    this.updateTransactionUseCase = updateTransactionUseCase;
    this.deleteTransactionUseCase = deleteTransactionUseCase;
    this.listTransactionsUseCase = listTransactionsUseCase;
  }
  async create(c) {
    const body = await c.req.json();
    const result = await this.createTransactionUseCase.execute(body);
    if (!result.success) {
      return c.json({
        error: {
          message: result.errors?.join(", ") || "Failed to create transaction",
          code: "CREATION_FAILED",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, 400);
    }
    return c.json({
      data: result.transaction,
      message: "Transaction created successfully"
    }, 201);
  }
  async findById(c) {
    const id = c.req.param("id");
    try {
      return c.json({
        data: {
          id,
          date: new Date().toISOString(),
          amount: 100,
          currency: "BRL",
          categoryId: "cat-1",
          paymentMethodId: "pm-1",
          type: "expense",
          description: "Sample transaction",
          source: "manual",
          sourceId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      throw error;
    }
  }
  async findAll(c) {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const result = await this.listTransactionsUseCase.execute({
      page,
      limit,
      categoryId: c.req.query("categoryId"),
      paymentMethodId: c.req.query("paymentMethodId"),
      startDate: c.req.query("startDate"),
      endDate: c.req.query("endDate"),
      type: c.req.query("type"),
      source: c.req.query("source"),
      description: c.req.query("description"),
      minAmount: c.req.query("minAmount") ? parseFloat(c.req.query("minAmount")) : undefined,
      maxAmount: c.req.query("maxAmount") ? parseFloat(c.req.query("maxAmount")) : undefined
    });
    if (!result.success) {
      return c.json({
        error: {
          message: result.errors?.join(", ") || "Failed to fetch transactions",
          code: "FETCH_FAILED",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, 400);
    }
    if (result.data) {
      c.res.headers.set("X-Total-Count", result.data.totalItems.toString());
      c.res.headers.set("X-Page-Count", result.data.totalPages.toString());
    }
    return c.json({
      data: result.data?.items || [],
      pagination: result.data ? {
        currentPage: result.data.currentPage,
        totalPages: result.data.totalPages,
        totalItems: result.data.totalItems,
        hasNext: result.data.hasNext,
        hasPrevious: result.data.hasPrevious
      } : undefined
    });
  }
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const result = await this.updateTransactionUseCase.execute(id, body);
    if (!result.success) {
      const statusCode = result.errors?.some((err) => err.includes("not found")) ? 404 : 400;
      return c.json({
        error: {
          message: result.errors?.join(", ") || "Failed to update transaction",
          code: statusCode === 404 ? "NOT_FOUND" : "UPDATE_FAILED",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, statusCode);
    }
    return c.json({
      data: result.transaction,
      message: "Transaction updated successfully"
    });
  }
  async delete(c) {
    const id = c.req.param("id");
    const result = await this.deleteTransactionUseCase.execute(id);
    if (!result.success) {
      const statusCode = result.errors?.some((err) => err.includes("not found")) ? 404 : 400;
      return c.json({
        error: {
          message: result.errors?.join(", ") || "Failed to delete transaction",
          code: statusCode === 404 ? "NOT_FOUND" : "DELETE_FAILED",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, statusCode);
    }
    return c.json({
      message: "Transaction deleted successfully"
    }, 204);
  }
  async getByCategory(c) {
    const categoryId = c.req.param("categoryId");
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }
  async getByPaymentMethod(c) {
    const paymentMethodId = c.req.param("paymentMethodId");
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }
  async getMonthly(c) {
    const year = c.req.param("year");
    const month = c.req.param("month");
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }
  async getYearly(c) {
    const year = c.req.param("year");
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }
}

// src/infrastructure/web/controllers/category.controller.ts
class CategoryController {
  categoryRepository;
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }
  async create(c) {
    const body = await c.req.json();
    try {
      const category = Category.create(crypto.randomUUID(), body.name, body.type === "income" ? "income" /* INCOME */ : "expense" /* EXPENSE */, body.color);
      await this.categoryRepository.save(category);
      return c.json({
        data: {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        },
        message: "Category created successfully"
      }, 201);
    } catch (error) {
      throw error;
    }
  }
  async findAll(c) {
    try {
      const categories = await this.categoryRepository.findActiveCategories();
      return c.json({
        data: categories.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }))
      });
    } catch (error) {
      throw error;
    }
  }
  async findById(c) {
    const id = c.req.param("id");
    try {
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        return c.json({
          error: {
            message: "Category not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      return c.json({
        data: {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      });
    } catch (error) {
      throw error;
    }
  }
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        return c.json({
          error: {
            message: "Category not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      if (body.name)
        category.updateName(body.name);
      if (body.color !== undefined)
        category.updateColor(body.color);
      await this.categoryRepository.update(category);
      return c.json({
        data: {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        },
        message: "Category updated successfully"
      });
    } catch (error) {
      throw error;
    }
  }
  async delete(c) {
    const id = c.req.param("id");
    try {
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        return c.json({
          error: {
            message: "Category not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      category.deactivate();
      await this.categoryRepository.update(category);
      return c.json({
        message: "Category deleted successfully"
      }, 204);
    } catch (error) {
      throw error;
    }
  }
}

// src/infrastructure/web/controllers/payment-method.controller.ts
class PaymentMethodController {
  paymentMethodRepository;
  constructor(paymentMethodRepository) {
    this.paymentMethodRepository = paymentMethodRepository;
  }
  async create(c) {
    const body = await c.req.json();
    try {
      const paymentMethod = PaymentMethod.create(crypto.randomUUID(), body.name, this.mapTypeFromString(body.type));
      await this.paymentMethodRepository.save(paymentMethod);
      return c.json({
        data: this.mapToResponse(paymentMethod),
        message: "Payment method created successfully"
      }, 201);
    } catch (error) {
      throw error;
    }
  }
  async findAll(c) {
    try {
      const paymentMethods = await this.paymentMethodRepository.findActivePaymentMethods();
      return c.json({
        data: paymentMethods.map((pm) => this.mapToResponse(pm))
      });
    } catch (error) {
      throw error;
    }
  }
  async findById(c) {
    const id = c.req.param("id");
    try {
      const paymentMethod = await this.paymentMethodRepository.findById(id);
      if (!paymentMethod) {
        return c.json({
          error: {
            message: "Payment method not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      return c.json({
        data: this.mapToResponse(paymentMethod)
      });
    } catch (error) {
      throw error;
    }
  }
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const paymentMethod = await this.paymentMethodRepository.findById(id);
      if (!paymentMethod) {
        return c.json({
          error: {
            message: "Payment method not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      if (body.name)
        paymentMethod.updateName(body.name);
      await this.paymentMethodRepository.update(paymentMethod);
      return c.json({
        data: this.mapToResponse(paymentMethod),
        message: "Payment method updated successfully"
      });
    } catch (error) {
      throw error;
    }
  }
  async delete(c) {
    const id = c.req.param("id");
    try {
      const paymentMethod = await this.paymentMethodRepository.findById(id);
      if (!paymentMethod) {
        return c.json({
          error: {
            message: "Payment method not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      paymentMethod.deactivate();
      await this.paymentMethodRepository.update(paymentMethod);
      return c.json({
        message: "Payment method deleted successfully"
      }, 204);
    } catch (error) {
      throw error;
    }
  }
  mapTypeFromString(type) {
    switch (type.toLowerCase()) {
      case "cash":
        return "cash" /* CASH */;
      case "bank":
        return "bank" /* BANK */;
      case "credit_card":
        return "credit_card" /* CREDIT_CARD */;
      default:
        throw new Error(`Invalid payment method type: ${type}`);
    }
  }
  mapToResponse(paymentMethod) {
    return {
      id: paymentMethod.id,
      name: paymentMethod.name,
      type: paymentMethod.type.toLowerCase(),
      isActive: paymentMethod.isActive,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt
    };
  }
}

// src/infrastructure/web/controllers/subscription.controller.ts
class SubscriptionController {
  createSubscriptionUseCase;
  cancelSubscriptionUseCase;
  subscriptionRepository;
  constructor(createSubscriptionUseCase, cancelSubscriptionUseCase, subscriptionRepository) {
    this.createSubscriptionUseCase = createSubscriptionUseCase;
    this.cancelSubscriptionUseCase = cancelSubscriptionUseCase;
    this.subscriptionRepository = subscriptionRepository;
  }
  async create(c) {
    const body = await c.req.json();
    try {
      const result = await this.createSubscriptionUseCase.execute({
        name: body.name,
        monthlyAmount: body.monthlyAmount,
        currency: body.currency || "BRL",
        startDate: body.startDate,
        categoryId: body.categoryId,
        paymentMethodId: body.paymentMethodId
      });
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to create subscription",
            code: "CREATION_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 400);
      }
      return c.json({
        data: result.subscription,
        message: "Subscription created successfully"
      }, 201);
    } catch (error) {
      throw error;
    }
  }
  async findAll(c) {
    try {
      const subscriptions = await this.subscriptionRepository.findActiveSubscriptions();
      return c.json({
        data: subscriptions.map((sub) => this.mapToResponse(sub))
      });
    } catch (error) {
      throw error;
    }
  }
  async findById(c) {
    const id = c.req.param("id");
    try {
      const subscription = await this.subscriptionRepository.findById(id);
      if (!subscription) {
        return c.json({
          error: {
            message: "Subscription not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      return c.json({
        data: this.mapToResponse(subscription)
      });
    } catch (error) {
      throw error;
    }
  }
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const subscription = await this.subscriptionRepository.findById(id);
      if (!subscription) {
        return c.json({
          error: {
            message: "Subscription not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      if (body.name)
        subscription.updateName(body.name);
      await this.subscriptionRepository.update(subscription);
      return c.json({
        data: this.mapToResponse(subscription),
        message: "Subscription updated successfully"
      });
    } catch (error) {
      throw error;
    }
  }
  async delete(c) {
    const id = c.req.param("id");
    try {
      const subscription = await this.subscriptionRepository.findById(id);
      if (!subscription) {
        return c.json({
          error: {
            message: "Subscription not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      await this.subscriptionRepository.delete(id);
      return c.json({
        message: "Subscription deleted successfully"
      }, 204);
    } catch (error) {
      throw error;
    }
  }
  async cancel(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const result = await this.cancelSubscriptionUseCase.execute(id, {
        endDate: body.endDate
      });
      if (!result.success) {
        const statusCode = result.errors?.some((err) => err.includes("not found")) ? 404 : 400;
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to cancel subscription",
            code: statusCode === 404 ? "NOT_FOUND" : "CANCEL_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, statusCode);
      }
      return c.json({
        data: result.subscription,
        message: "Subscription cancelled successfully"
      });
    } catch (error) {
      throw error;
    }
  }
  mapToResponse(subscription) {
    return {
      id: subscription.id,
      name: subscription.name,
      monthlyAmount: subscription.monthlyAmount.amount,
      currency: "BRL",
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate?.toISOString() || null,
      categoryId: subscription.categoryId,
      paymentMethodId: subscription.paymentMethodId,
      status: subscription.status.toLowerCase(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString()
    };
  }
}

// src/infrastructure/web/controllers/savings-bucket.controller.ts
class SavingsBucketController {
  createSavingsBucketUseCase;
  transferToBucketUseCase;
  savingsBucketRepository;
  constructor(createSavingsBucketUseCase, transferToBucketUseCase, savingsBucketRepository) {
    this.createSavingsBucketUseCase = createSavingsBucketUseCase;
    this.transferToBucketUseCase = transferToBucketUseCase;
    this.savingsBucketRepository = savingsBucketRepository;
  }
  async create(c) {
    const body = await c.req.json();
    try {
      const result = await this.createSavingsBucketUseCase.execute({
        name: body.name,
        targetAmount: body.targetAmount,
        currency: body.currency || "BRL",
        description: body.description
      });
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to create savings bucket",
            code: "CREATION_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 400);
      }
      return c.json({
        data: result.bucket,
        message: "Savings bucket created successfully"
      }, 201);
    } catch (error) {
      throw error;
    }
  }
  async findAll(c) {
    try {
      const buckets = await this.savingsBucketRepository.findActiveBuckets();
      return c.json({
        data: buckets.map((bucket) => this.mapToResponse(bucket))
      });
    } catch (error) {
      throw error;
    }
  }
  async findById(c) {
    const id = c.req.param("id");
    try {
      const bucket = await this.savingsBucketRepository.findById(id);
      if (!bucket) {
        return c.json({
          error: {
            message: "Savings bucket not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      return c.json({
        data: this.mapToResponse(bucket)
      });
    } catch (error) {
      throw error;
    }
  }
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const bucket = await this.savingsBucketRepository.findById(id);
      if (!bucket) {
        return c.json({
          error: {
            message: "Savings bucket not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      if (body.name)
        bucket.updateName(body.name);
      if (body.description !== undefined)
        bucket.updateDescription(body.description);
      await this.savingsBucketRepository.update(bucket);
      return c.json({
        data: this.mapToResponse(bucket),
        message: "Savings bucket updated successfully"
      });
    } catch (error) {
      throw error;
    }
  }
  async delete(c) {
    const id = c.req.param("id");
    try {
      const bucket = await this.savingsBucketRepository.findById(id);
      if (!bucket) {
        return c.json({
          error: {
            message: "Savings bucket not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      bucket.deactivate();
      await this.savingsBucketRepository.update(bucket);
      return c.json({
        message: "Savings bucket deleted successfully"
      }, 204);
    } catch (error) {
      throw error;
    }
  }
  async transfer(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const result = await this.transferToBucketUseCase.execute(id, {
        amount: body.amount,
        currency: body.currency || "BRL",
        type: body.type || "deposit",
        description: body.description
      });
      if (!result.success) {
        const statusCode = result.errors?.some((err) => err.includes("not found")) ? 404 : 400;
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to transfer to bucket",
            code: statusCode === 404 ? "NOT_FOUND" : "TRANSFER_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, statusCode);
      }
      return c.json({
        data: result.transfer,
        message: "Transfer completed successfully"
      }, 201);
    } catch (error) {
      throw error;
    }
  }
  mapToResponse(bucket) {
    return {
      id: bucket.id,
      name: bucket.name,
      currentBalance: bucket.currentBalance.amount,
      targetAmount: bucket.targetAmount?.amount || null,
      currency: "BRL",
      description: bucket.description,
      isActive: bucket.isActive,
      progress: bucket.targetAmount ? bucket.currentBalance.amount / bucket.targetAmount.amount * 100 : null,
      createdAt: bucket.createdAt.toISOString(),
      updatedAt: bucket.updatedAt.toISOString()
    };
  }
}

// src/infrastructure/web/controllers/installment-plan.controller.ts
class InstallmentPlanController {
  createInstallmentPlanUseCase;
  installmentPlanRepository;
  constructor(createInstallmentPlanUseCase, installmentPlanRepository) {
    this.createInstallmentPlanUseCase = createInstallmentPlanUseCase;
    this.installmentPlanRepository = installmentPlanRepository;
  }
  async create(c) {
    const body = await c.req.json();
    try {
      const result = await this.createInstallmentPlanUseCase.execute({
        totalAmount: body.totalAmount,
        currency: body.currency || "BRL",
        purchaseDate: body.purchaseDate,
        installmentCount: body.installmentCount,
        description: body.description,
        paymentMethodId: body.paymentMethodId,
        categoryId: body.categoryId
      });
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to create installment plan",
            code: "CREATION_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 400);
      }
      return c.json({
        data: result.installmentPlan,
        message: "Installment plan created successfully"
      }, 201);
    } catch (error) {
      throw error;
    }
  }
  async findAll(c) {
    try {
      const installmentPlans = await this.installmentPlanRepository.findActiveInstallmentPlans();
      return c.json({
        data: installmentPlans.map((plan) => this.mapToResponse(plan))
      });
    } catch (error) {
      throw error;
    }
  }
  async findById(c) {
    const id = c.req.param("id");
    try {
      const installmentPlan = await this.installmentPlanRepository.findById(id);
      if (!installmentPlan) {
        return c.json({
          error: {
            message: "Installment plan not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      return c.json({
        data: this.mapToResponse(installmentPlan)
      });
    } catch (error) {
      throw error;
    }
  }
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    try {
      const installmentPlan = await this.installmentPlanRepository.findById(id);
      if (!installmentPlan) {
        return c.json({
          error: {
            message: "Installment plan not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      if (body.description)
        installmentPlan.updateDescription(body.description);
      await this.installmentPlanRepository.update(installmentPlan);
      return c.json({
        data: this.mapToResponse(installmentPlan),
        message: "Installment plan updated successfully"
      });
    } catch (error) {
      throw error;
    }
  }
  async delete(c) {
    const id = c.req.param("id");
    try {
      const installmentPlan = await this.installmentPlanRepository.findById(id);
      if (!installmentPlan) {
        return c.json({
          error: {
            message: "Installment plan not found",
            code: "NOT_FOUND",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 404);
      }
      installmentPlan.cancel();
      await this.installmentPlanRepository.update(installmentPlan);
      return c.json({
        message: "Installment plan cancelled successfully"
      }, 204);
    } catch (error) {
      throw error;
    }
  }
  mapToResponse(installmentPlan) {
    return {
      id: installmentPlan.id,
      totalAmount: installmentPlan.totalAmount.amount,
      monthlyAmount: installmentPlan.monthlyAmount.amount,
      currency: "BRL",
      purchaseDate: installmentPlan.purchaseDate.toISOString(),
      installmentCount: installmentPlan.installmentCount,
      description: installmentPlan.description,
      paymentMethodId: installmentPlan.paymentMethodId,
      categoryId: installmentPlan.categoryId,
      status: installmentPlan.status.toLowerCase(),
      createdAt: installmentPlan.createdAt.toISOString(),
      updatedAt: installmentPlan.updatedAt.toISOString()
    };
  }
}

// src/infrastructure/web/controllers/report.controller.ts
class ReportController {
  generateMonthlyReportUseCase;
  generateYearlyReportUseCase;
  constructor(generateMonthlyReportUseCase, generateYearlyReportUseCase) {
    this.generateMonthlyReportUseCase = generateMonthlyReportUseCase;
    this.generateYearlyReportUseCase = generateYearlyReportUseCase;
  }
  async getMonthlyReport(c) {
    const year = parseInt(c.req.param("year"));
    const month = parseInt(c.req.param("month"));
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return c.json({
        error: {
          message: "Invalid year or month parameter",
          code: "INVALID_PARAMETERS",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, 400);
    }
    try {
      const result = await this.generateMonthlyReportUseCase.execute({
        year,
        month
      });
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to generate monthly report",
            code: "REPORT_GENERATION_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 400);
      }
      return c.json({
        data: result.report
      });
    } catch (error) {
      throw error;
    }
  }
  async getYearlyReport(c) {
    const year = parseInt(c.req.param("year"));
    if (isNaN(year)) {
      return c.json({
        error: {
          message: "Invalid year parameter",
          code: "INVALID_PARAMETERS",
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, 400);
    }
    try {
      const result = await this.generateYearlyReportUseCase.execute({
        year
      });
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(", ") || "Failed to generate yearly report",
            code: "REPORT_GENERATION_FAILED",
            timestamp: new Date().toISOString(),
            path: c.req.path
          }
        }, 400);
      }
      return c.json({
        data: result.report
      });
    } catch (error) {
      throw error;
    }
  }
  async getSummary(c) {
    const currentDate = new Date;
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    try {
      const [monthlyResult, yearlyResult] = await Promise.all([
        this.generateMonthlyReportUseCase.execute({ year: currentYear, month: currentMonth }),
        this.generateYearlyReportUseCase.execute({ year: currentYear })
      ]);
      return c.json({
        data: {
          currentMonth: monthlyResult.success ? monthlyResult.report : null,
          currentYear: yearlyResult.success ? yearlyResult.report : null,
          errors: [
            ...monthlyResult.success ? [] : monthlyResult.errors || [],
            ...yearlyResult.success ? [] : yearlyResult.errors || []
          ]
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

// src/application/validation/transaction.schema.ts
var MoneySchema = exports_external.object({
  amount: exports_external.number().positive("Amount must be positive"),
  currency: exports_external.string().default("BRL")
});
var TransactionTypeSchema = exports_external.enum(["income", "expense"], {
  errorMap: () => ({ message: "Type must be either income or expense" })
});
var TransactionSourceSchema = exports_external.enum(["manual", "installment", "subscription"], {
  errorMap: () => ({ message: "Source must be manual, installment, or subscription" })
});
var CreateTransactionSchema = exports_external.object({
  date: exports_external.string().datetime("Invalid date format. Use ISO 8601 format"),
  amount: exports_external.number().positive("Amount must be positive"),
  currency: exports_external.string().min(3).max(3).default("BRL"),
  categoryId: exports_external.string().min(1, "Category ID is required"),
  paymentMethodId: exports_external.string().min(1, "Payment method ID is required"),
  type: TransactionTypeSchema,
  description: exports_external.string().max(500, "Description cannot exceed 500 characters").optional()
});
var UpdateTransactionSchema = exports_external.object({
  date: exports_external.string().datetime("Invalid date format. Use ISO 8601 format").optional(),
  amount: exports_external.number().positive("Amount must be positive").optional(),
  currency: exports_external.string().min(3).max(3).optional(),
  categoryId: exports_external.string().min(1, "Category ID cannot be empty").optional(),
  paymentMethodId: exports_external.string().min(1, "Payment method ID cannot be empty").optional(),
  description: exports_external.string().max(500, "Description cannot exceed 500 characters").nullable().optional()
});
var ListTransactionsQuerySchema = exports_external.object({
  page: exports_external.coerce.number().int().min(1).default(1),
  limit: exports_external.coerce.number().int().min(1).max(100).default(20),
  categoryId: exports_external.string().optional(),
  paymentMethodId: exports_external.string().optional(),
  startDate: exports_external.string().datetime().optional(),
  endDate: exports_external.string().datetime().optional(),
  type: TransactionTypeSchema.optional(),
  source: TransactionSourceSchema.optional(),
  description: exports_external.string().optional(),
  minAmount: exports_external.coerce.number().positive().optional(),
  maxAmount: exports_external.coerce.number().positive().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["startDate"]
}).refine((data) => {
  if (data.minAmount && data.maxAmount) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: "Minimum amount must be less than or equal to maximum amount",
  path: ["minAmount"]
});
var TransactionResponseSchema = exports_external.object({
  id: exports_external.string(),
  date: exports_external.string().datetime(),
  amount: exports_external.number(),
  currency: exports_external.string(),
  categoryId: exports_external.string(),
  paymentMethodId: exports_external.string(),
  type: TransactionTypeSchema,
  description: exports_external.string().nullable(),
  source: TransactionSourceSchema,
  sourceId: exports_external.string().nullable(),
  createdAt: exports_external.string().datetime(),
  updatedAt: exports_external.string().datetime()
});
var PaginatedTransactionsResponseSchema = exports_external.object({
  items: exports_external.array(TransactionResponseSchema),
  totalItems: exports_external.number().int().min(0),
  totalPages: exports_external.number().int().min(0),
  currentPage: exports_external.number().int().min(1),
  hasNext: exports_external.boolean(),
  hasPrevious: exports_external.boolean()
});
var TransactionIdParamSchema = exports_external.object({
  id: exports_external.string().min(1, "Transaction ID is required")
});

// src/infrastructure/web/docs/transaction.openapi.ts
var ErrorResponseSchema = exports_external.object({
  error: exports_external.object({
    message: exports_external.string(),
    code: exports_external.string(),
    timestamp: exports_external.string(),
    path: exports_external.string().optional(),
    details: exports_external.array(exports_external.any()).optional()
  })
});
var listTransactionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Transactions"],
  summary: "List transactions",
  description: "Retrieve a paginated list of transactions with optional filtering",
  request: {
    query: ListTransactionsQuerySchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedTransactionsResponseSchema
        }
      },
      description: "List of transactions with pagination"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      },
      description: "Validation error"
    }
  }
});
var createTransactionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Transactions"],
  summary: "Create transaction",
  description: "Create a new transaction",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateTransactionSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TransactionResponseSchema
        }
      },
      description: "Transaction created successfully"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      },
      description: "Validation error"
    }
  }
});
var getTransactionRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Get transaction",
  description: "Retrieve a specific transaction by ID",
  request: {
    params: TransactionIdParamSchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionResponseSchema
        }
      },
      description: "Transaction details"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      },
      description: "Transaction not found"
    }
  }
});
var updateTransactionRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Update transaction",
  description: "Update an existing transaction",
  request: {
    params: TransactionIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTransactionSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionResponseSchema
        }
      },
      description: "Transaction updated successfully"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      },
      description: "Validation error"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      },
      description: "Transaction not found"
    }
  }
});
var deleteTransactionRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Delete transaction",
  description: "Delete a transaction",
  request: {
    params: TransactionIdParamSchema
  },
  responses: {
    204: {
      description: "Transaction deleted successfully"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      },
      description: "Transaction not found"
    }
  }
});

// src/infrastructure/web/routes/transaction.routes.ts
function createTransactionRoutes(transactionController) {
  const router = createOpenAPIApp();
  router.openapi(listTransactionsRoute, async (c) => {
    return await transactionController.findAll(c);
  });
  router.openapi(createTransactionRoute, async (c) => {
    return await transactionController.create(c);
  });
  router.openapi(getTransactionRoute, async (c) => {
    return await transactionController.findById(c);
  });
  router.openapi(updateTransactionRoute, async (c) => {
    return await transactionController.update(c);
  });
  router.openapi(deleteTransactionRoute, async (c) => {
    return await transactionController.delete(c);
  });
  router.get("/category/:categoryId", async (c) => {
    return await transactionController.getByCategory(c);
  });
  router.get("/payment-method/:paymentMethodId", async (c) => {
    return await transactionController.getByPaymentMethod(c);
  });
  router.get("/monthly/:year/:month", async (c) => {
    return await transactionController.getMonthly(c);
  });
  router.get("/yearly/:year", async (c) => {
    return await transactionController.getYearly(c);
  });
  return router;
}

// src/application/validation/category.schema.ts
var CategoryTypeSchema = exports_external.enum(["income", "expense", "both"], {
  errorMap: () => ({ message: "Type must be income, expense, or both" })
});
var CreateCategorySchema = exports_external.object({
  name: exports_external.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  type: CategoryTypeSchema,
  color: exports_external.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)").optional()
});
var UpdateCategorySchema = exports_external.object({
  name: exports_external.string().min(1, "Name cannot be empty").max(100, "Name cannot exceed 100 characters").optional(),
  color: exports_external.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)").nullable().optional()
});
var CategoryResponseSchema = exports_external.object({
  id: exports_external.string(),
  name: exports_external.string(),
  type: CategoryTypeSchema,
  color: exports_external.string().nullable(),
  isActive: exports_external.boolean(),
  createdAt: exports_external.string().datetime(),
  updatedAt: exports_external.string().datetime()
});
var CategoryIdParamSchema = exports_external.object({
  id: exports_external.string().min(1, "Category ID is required")
});
var CategoryListQuerySchema = exports_external.object({
  type: CategoryTypeSchema.optional(),
  active: exports_external.coerce.boolean().optional()
});

// src/infrastructure/web/docs/category.openapi.ts
var ErrorResponseSchema2 = exports_external.object({
  error: exports_external.object({
    message: exports_external.string(),
    code: exports_external.string(),
    timestamp: exports_external.string(),
    path: exports_external.string().optional(),
    details: exports_external.array(exports_external.any()).optional()
  })
});
var listCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Categories"],
  summary: "List categories",
  description: "Retrieve all categories with optional filtering",
  request: {
    query: CategoryListQuerySchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: exports_external.array(CategoryResponseSchema)
        }
      },
      description: "List of categories"
    }
  }
});
var createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Categories"],
  summary: "Create category",
  description: "Create a new category",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCategorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema
        }
      },
      description: "Category created successfully"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema2
        }
      },
      description: "Validation error"
    }
  }
});
var getCategoryRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Get category",
  description: "Retrieve a specific category by ID",
  request: {
    params: CategoryIdParamSchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema
        }
      },
      description: "Category details"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema2
        }
      },
      description: "Category not found"
    }
  }
});
var updateCategoryRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Update category",
  description: "Update an existing category",
  request: {
    params: CategoryIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateCategorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema
        }
      },
      description: "Category updated successfully"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema2
        }
      },
      description: "Validation error"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema2
        }
      },
      description: "Category not found"
    }
  }
});
var deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Delete category",
  description: "Delete a category",
  request: {
    params: CategoryIdParamSchema
  },
  responses: {
    204: {
      description: "Category deleted successfully"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema2
        }
      },
      description: "Category not found"
    }
  }
});

// src/infrastructure/web/routes/category.routes.ts
function createCategoryRoutes(categoryController) {
  const router = createOpenAPIApp();
  router.openapi(listCategoriesRoute, async (c) => {
    return categoryController.findAll(c);
  });
  router.openapi(createCategoryRoute, async (c) => {
    return categoryController.create(c);
  });
  router.openapi(getCategoryRoute, async (c) => {
    return categoryController.findById(c);
  });
  router.openapi(updateCategoryRoute, async (c) => {
    return categoryController.update(c);
  });
  router.openapi(deleteCategoryRoute, async (c) => {
    return categoryController.delete(c);
  });
  return router;
}

// src/application/validation/payment-method.schema.ts
var PaymentMethodTypeSchema = exports_external.enum(["cash", "bank", "credit_card"], {
  errorMap: () => ({ message: "Type must be cash, bank, or credit_card" })
});
var CreatePaymentMethodSchema = exports_external.object({
  name: exports_external.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  type: PaymentMethodTypeSchema
});
var UpdatePaymentMethodSchema = exports_external.object({
  name: exports_external.string().min(1, "Name cannot be empty").max(100, "Name cannot exceed 100 characters").optional()
});
var PaymentMethodResponseSchema = exports_external.object({
  id: exports_external.string(),
  name: exports_external.string(),
  type: PaymentMethodTypeSchema,
  isActive: exports_external.boolean(),
  supportsInstallments: exports_external.boolean(),
  createdAt: exports_external.string().datetime(),
  updatedAt: exports_external.string().datetime()
});
var PaymentMethodIdParamSchema = exports_external.object({
  id: exports_external.string().min(1, "Payment method ID is required")
});
var PaymentMethodListQuerySchema = exports_external.object({
  type: PaymentMethodTypeSchema.optional(),
  active: exports_external.coerce.boolean().optional(),
  supportsInstallments: exports_external.coerce.boolean().optional()
});

// src/infrastructure/web/docs/payment-method.openapi.ts
var ErrorResponseSchema3 = exports_external.object({
  error: exports_external.object({
    message: exports_external.string(),
    code: exports_external.string(),
    timestamp: exports_external.string(),
    path: exports_external.string().optional(),
    details: exports_external.array(exports_external.any()).optional()
  })
});
var listPaymentMethodsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Payment Methods"],
  summary: "List payment methods",
  description: "Retrieve all payment methods with optional filtering",
  request: {
    query: PaymentMethodListQuerySchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: exports_external.array(PaymentMethodResponseSchema)
        }
      },
      description: "List of payment methods"
    }
  }
});
var createPaymentMethodRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Payment Methods"],
  summary: "Create payment method",
  description: "Create a new payment method",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePaymentMethodSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: PaymentMethodResponseSchema
        }
      },
      description: "Payment method created successfully"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema3
        }
      },
      description: "Validation error"
    }
  }
});
var getPaymentMethodRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Payment Methods"],
  summary: "Get payment method",
  description: "Retrieve a specific payment method by ID",
  request: {
    params: PaymentMethodIdParamSchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaymentMethodResponseSchema
        }
      },
      description: "Payment method details"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema3
        }
      },
      description: "Payment method not found"
    }
  }
});
var updatePaymentMethodRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Payment Methods"],
  summary: "Update payment method",
  description: "Update an existing payment method",
  request: {
    params: PaymentMethodIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdatePaymentMethodSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaymentMethodResponseSchema
        }
      },
      description: "Payment method updated successfully"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema3
        }
      },
      description: "Validation error"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema3
        }
      },
      description: "Payment method not found"
    }
  }
});
var deletePaymentMethodRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Payment Methods"],
  summary: "Delete payment method",
  description: "Delete a payment method",
  request: {
    params: PaymentMethodIdParamSchema
  },
  responses: {
    204: {
      description: "Payment method deleted successfully"
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema3
        }
      },
      description: "Payment method not found"
    }
  }
});

// src/infrastructure/web/routes/payment-method.routes.ts
function createPaymentMethodRoutes(paymentMethodController) {
  const router = createOpenAPIApp();
  router.openapi(listPaymentMethodsRoute, async (c) => {
    return paymentMethodController.findAll(c);
  });
  router.openapi(createPaymentMethodRoute, async (c) => {
    return paymentMethodController.create(c);
  });
  router.openapi(getPaymentMethodRoute, async (c) => {
    return paymentMethodController.findById(c);
  });
  router.openapi(updatePaymentMethodRoute, async (c) => {
    return paymentMethodController.update(c);
  });
  router.openapi(deletePaymentMethodRoute, async (c) => {
    return paymentMethodController.delete(c);
  });
  return router;
}

// src/infrastructure/web/docs/generate-all-docs.ts
var ErrorResponseSchema4 = exports_external.object({
  error: exports_external.object({
    message: exports_external.string(),
    code: exports_external.string(),
    timestamp: exports_external.string(),
    path: exports_external.string().optional(),
    details: exports_external.array(exports_external.any()).optional()
  })
});
var IdParamSchema = exports_external.object({
  id: exports_external.string().openapi({ param: { name: "id", in: "path" } })
});
var createBasicCRUDRoutes = (entity, schemas, customTag) => {
  const tag = customTag || entity.charAt(0).toUpperCase() + entity.slice(1);
  return {
    list: createRoute({
      method: "get",
      path: `/`,
      tags: [tag],
      summary: `List ${entity}`,
      description: `Retrieve all ${entity}`,
      responses: {
        200: {
          content: {
            "application/json": {
              schema: schemas.list
            }
          },
          description: `List of ${entity}`
        }
      }
    }),
    create: createRoute({
      method: "post",
      path: `/`,
      tags: [tag],
      summary: `Create ${entity.slice(0, -1)}`,
      description: `Create a new ${entity.slice(0, -1)}`,
      request: {
        body: {
          content: {
            "application/json": {
              schema: schemas.create
            }
          }
        }
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: schemas.response
            }
          },
          description: `${entity.slice(0, -1)} created successfully`
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema4
            }
          },
          description: "Validation error"
        }
      }
    }),
    get: createRoute({
      method: "get",
      path: `/{id}`,
      tags: [tag],
      summary: `Get ${entity.slice(0, -1)}`,
      description: `Retrieve a specific ${entity.slice(0, -1)} by ID`,
      request: {
        params: IdParamSchema
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: schemas.response
            }
          },
          description: `${entity.slice(0, -1)} details`
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema4
            }
          },
          description: `${entity.slice(0, -1)} not found`
        }
      }
    }),
    update: createRoute({
      method: "put",
      path: `/{id}`,
      tags: [tag],
      summary: `Update ${entity.slice(0, -1)}`,
      description: `Update an existing ${entity.slice(0, -1)}`,
      request: {
        params: IdParamSchema,
        body: {
          content: {
            "application/json": {
              schema: schemas.update
            }
          }
        }
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: schemas.response
            }
          },
          description: `${entity.slice(0, -1)} updated successfully`
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema4
            }
          },
          description: "Validation error"
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema4
            }
          },
          description: `${entity.slice(0, -1)} not found`
        }
      }
    }),
    delete: createRoute({
      method: "delete",
      path: `/{id}`,
      tags: [tag],
      summary: `Delete ${entity.slice(0, -1)}`,
      description: `Delete a ${entity.slice(0, -1)}`,
      request: {
        params: IdParamSchema
      },
      responses: {
        204: {
          description: `${entity.slice(0, -1)} deleted successfully`
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema4
            }
          },
          description: `${entity.slice(0, -1)} not found`
        }
      }
    })
  };
};

// src/application/validation/subscription.schema.ts
var SubscriptionStatusSchema = exports_external.enum(["active", "cancelled", "paused"], {
  errorMap: () => ({ message: "Status must be active, cancelled, or paused" })
});
var CreateSubscriptionSchema = exports_external.object({
  name: exports_external.string().min(1, "Name is required").max(200, "Name cannot exceed 200 characters"),
  monthlyAmount: exports_external.number().positive("Monthly amount must be positive"),
  currency: exports_external.string().min(3).max(3).default("BRL"),
  startDate: exports_external.string().datetime("Invalid date format. Use ISO 8601 format"),
  categoryId: exports_external.string().min(1, "Category ID is required"),
  paymentMethodId: exports_external.string().min(1, "Payment method ID is required"),
  endDate: exports_external.string().datetime("Invalid date format. Use ISO 8601 format").optional()
}).refine((data) => {
  if (data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const futureLimit = new Date;
  futureLimit.setFullYear(futureLimit.getFullYear() + 10);
  return startDate <= futureLimit;
}, {
  message: "Start date cannot be more than 10 years in the future",
  path: ["startDate"]
});
var UpdateSubscriptionSchema = exports_external.object({
  name: exports_external.string().min(1, "Name cannot be empty").max(200, "Name cannot exceed 200 characters").optional()
});
var CancelSubscriptionSchema = exports_external.object({
  endDate: exports_external.string().datetime("Invalid date format. Use ISO 8601 format").optional()
}).refine((data) => {
  if (data.endDate) {
    const endDate = new Date(data.endDate);
    const today = new Date;
    today.setHours(0, 0, 0, 0);
    return endDate >= today;
  }
  return true;
}, {
  message: "End date cannot be in the past",
  path: ["endDate"]
});
var SubscriptionResponseSchema = exports_external.object({
  id: exports_external.string(),
  name: exports_external.string(),
  monthlyAmount: exports_external.number(),
  currency: exports_external.string(),
  startDate: exports_external.string().datetime(),
  endDate: exports_external.string().datetime().nullable(),
  categoryId: exports_external.string(),
  paymentMethodId: exports_external.string(),
  status: SubscriptionStatusSchema,
  createdAt: exports_external.string().datetime(),
  updatedAt: exports_external.string().datetime()
});
var SubscriptionOverviewResponseSchema = exports_external.object({
  subscriptionId: exports_external.string(),
  name: exports_external.string(),
  monthlyAmount: exports_external.number(),
  currency: exports_external.string(),
  status: SubscriptionStatusSchema,
  startDate: exports_external.string().datetime(),
  endDate: exports_external.string().datetime().nullable(),
  monthsActive: exports_external.number().int().min(0),
  totalPaid: exports_external.number(),
  nextPaymentDate: exports_external.string().datetime().nullable(),
  isActive: exports_external.boolean(),
  paymentCount: exports_external.number().int().min(0)
});
var UpcomingPaymentResponseSchema = exports_external.object({
  subscriptionId: exports_external.string(),
  subscriptionName: exports_external.string(),
  amount: exports_external.number(),
  currency: exports_external.string(),
  dueDate: exports_external.string().datetime(),
  daysUntilDue: exports_external.number().int()
});
var SubscriptionIdParamSchema = exports_external.object({
  id: exports_external.string().min(1, "Subscription ID is required")
});
var SubscriptionListQuerySchema = exports_external.object({
  status: SubscriptionStatusSchema.optional(),
  categoryId: exports_external.string().optional(),
  paymentMethodId: exports_external.string().optional()
});

// src/infrastructure/web/docs/subscription.openapi.ts
var subscriptionRoutes = createBasicCRUDRoutes("subscriptions", {
  list: exports_external.array(SubscriptionResponseSchema),
  create: CreateSubscriptionSchema,
  update: UpdateSubscriptionSchema,
  response: SubscriptionResponseSchema
}, "Subscriptions");
var listSubscriptionsRoute = subscriptionRoutes.list;
var createSubscriptionRoute = subscriptionRoutes.create;
var getSubscriptionRoute = subscriptionRoutes.get;
var updateSubscriptionRoute = subscriptionRoutes.update;
var deleteSubscriptionRoute = subscriptionRoutes.delete;

// src/infrastructure/web/middleware/validation.middleware.ts
var idParamSchema = exports_external.object({
  id: exports_external.string().uuid("Invalid ID format")
});
var paginationQuerySchema = exports_external.object({
  page: exports_external.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: exports_external.string().optional().transform((val) => val ? parseInt(val) : 20)
}).refine((data) => data.page > 0, { message: "Page must be greater than 0" }).refine((data) => data.limit > 0 && data.limit <= 100, { message: "Limit must be between 1 and 100" });
var validateBody = (schema) => {
  return validator("json", (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return c.json({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.errors,
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, 400);
    }
    return parsed.data;
  });
};
var validateParam = (schema) => {
  return validator("param", (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return c.json({
        error: {
          message: "Invalid path parameters",
          code: "VALIDATION_ERROR",
          details: parsed.error.errors,
          timestamp: new Date().toISOString(),
          path: c.req.path
        }
      }, 400);
    }
    return parsed.data;
  });
};

// src/infrastructure/web/routes/subscription.routes.ts
function createSubscriptionRoutes(subscriptionController) {
  const router = createOpenAPIApp();
  router.openapi(listSubscriptionsRoute, async (c) => {
    return subscriptionController.findAll(c);
  });
  router.openapi(createSubscriptionRoute, async (c) => {
    return subscriptionController.create(c);
  });
  router.openapi(getSubscriptionRoute, async (c) => {
    return subscriptionController.findById(c);
  });
  router.openapi(updateSubscriptionRoute, async (c) => {
    return subscriptionController.update(c);
  });
  router.openapi(deleteSubscriptionRoute, async (c) => {
    return subscriptionController.delete(c);
  });
  router.post("/:id/cancel", validateParam(idParamSchema), validateBody(CancelSubscriptionSchema), async (c) => {
    return subscriptionController.cancel(c);
  });
  return router;
}

// src/application/validation/savings-bucket.schema.ts
var BucketTransferTypeSchema = exports_external.enum(["deposit", "withdrawal"], {
  errorMap: () => ({ message: "Transfer type must be deposit or withdrawal" })
});
var CreateSavingsBucketSchema = exports_external.object({
  name: exports_external.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  targetAmount: exports_external.number().positive("Target amount must be positive").optional(),
  currency: exports_external.string().min(3).max(3).default("BRL"),
  description: exports_external.string().max(500, "Description cannot exceed 500 characters").optional(),
  initialBalance: exports_external.number().min(0, "Initial balance cannot be negative").optional()
});
var UpdateSavingsBucketSchema = exports_external.object({
  name: exports_external.string().min(1, "Name cannot be empty").max(100, "Name cannot exceed 100 characters").optional(),
  targetAmount: exports_external.number().positive("Target amount must be positive").nullable().optional(),
  currency: exports_external.string().min(3).max(3).optional(),
  description: exports_external.string().max(500, "Description cannot exceed 500 characters").nullable().optional()
});
var TransferToBucketSchema = exports_external.object({
  amount: exports_external.number().positive("Amount must be positive"),
  currency: exports_external.string().min(3).max(3).default("BRL"),
  description: exports_external.string().max(200, "Description cannot exceed 200 characters").optional(),
  type: BucketTransferTypeSchema
});
var SavingsBucketResponseSchema = exports_external.object({
  id: exports_external.string(),
  name: exports_external.string(),
  targetAmount: exports_external.number().nullable(),
  currency: exports_external.string(),
  currentBalance: exports_external.number(),
  description: exports_external.string().nullable(),
  isActive: exports_external.boolean(),
  createdAt: exports_external.string().datetime(),
  updatedAt: exports_external.string().datetime(),
  progressPercentage: exports_external.number().min(0).max(100).nullable(),
  remainingAmount: exports_external.number().nullable(),
  isTargetReached: exports_external.boolean()
});
var BucketTransferResponseSchema = exports_external.object({
  id: exports_external.string(),
  bucketId: exports_external.string(),
  amount: exports_external.number(),
  currency: exports_external.string(),
  type: BucketTransferTypeSchema,
  description: exports_external.string().nullable(),
  date: exports_external.string().datetime(),
  createdAt: exports_external.string().datetime()
});
var BucketSummaryResponseSchema = exports_external.object({
  bucketId: exports_external.string(),
  name: exports_external.string(),
  description: exports_external.string().nullable(),
  currentBalance: exports_external.number(),
  currency: exports_external.string(),
  targetAmount: exports_external.number().nullable(),
  progressPercentage: exports_external.number().min(0).max(100).nullable(),
  remainingAmount: exports_external.number().nullable(),
  isTargetReached: exports_external.boolean(),
  totalDeposits: exports_external.number(),
  totalWithdrawals: exports_external.number(),
  transferCount: exports_external.number().int().min(0),
  isActive: exports_external.boolean()
});
var SavingsBucketIdParamSchema = exports_external.object({
  id: exports_external.string().min(1, "Savings bucket ID is required")
});
var SavingsBucketListQuerySchema = exports_external.object({
  active: exports_external.coerce.boolean().optional(),
  hasTarget: exports_external.coerce.boolean().optional(),
  targetReached: exports_external.coerce.boolean().optional()
});
var BucketTransferListQuerySchema = exports_external.object({
  bucketId: exports_external.string().optional(),
  type: BucketTransferTypeSchema.optional(),
  startDate: exports_external.string().datetime().optional(),
  endDate: exports_external.string().datetime().optional(),
  minAmount: exports_external.coerce.number().positive().optional(),
  maxAmount: exports_external.coerce.number().positive().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["startDate"]
}).refine((data) => {
  if (data.minAmount && data.maxAmount) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: "Minimum amount must be less than or equal to maximum amount",
  path: ["minAmount"]
});

// src/infrastructure/web/docs/savings-bucket.openapi.ts
var savingsBucketRoutes = createBasicCRUDRoutes("buckets", {
  list: exports_external.array(SavingsBucketResponseSchema),
  create: CreateSavingsBucketSchema,
  update: UpdateSavingsBucketSchema,
  response: SavingsBucketResponseSchema
}, "Savings Buckets");
var transferToBucketRoute = {
  path: "/{id}/transfer",
  method: "put",
  tags: ["Savings Buckets"],
  summary: "Transfer money to/from savings bucket",
  description: "Deposit or withdraw money from a savings bucket",
  request: {
    params: exports_external.object({
      id: exports_external.string().openapi({
        param: {
          name: "id",
          in: "path",
          description: "Savings bucket ID",
          required: true
        }
      })
    }),
    body: {
      content: {
        "application/json": {
          schema: TransferToBucketSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Transfer completed successfully",
      content: {
        "application/json": {
          schema: exports_external.object({
            data: BucketTransferResponseSchema,
            message: exports_external.string()
          })
        }
      }
    },
    400: {
      description: "Bad request - Invalid transfer data",
      content: {
        "application/json": {
          schema: exports_external.object({
            error: exports_external.object({
              message: exports_external.string(),
              code: exports_external.string(),
              timestamp: exports_external.string(),
              path: exports_external.string()
            })
          })
        }
      }
    },
    404: {
      description: "Savings bucket not found",
      content: {
        "application/json": {
          schema: exports_external.object({
            error: exports_external.object({
              message: exports_external.string(),
              code: exports_external.string(),
              timestamp: exports_external.string(),
              path: exports_external.string()
            })
          })
        }
      }
    }
  }
};
var listSavingsBucketsRoute = savingsBucketRoutes.list;
var createSavingsBucketRoute = savingsBucketRoutes.create;
var getSavingsBucketRoute = savingsBucketRoutes.get;
var updateSavingsBucketRoute = savingsBucketRoutes.update;
var deleteSavingsBucketRoute = savingsBucketRoutes.delete;

// src/infrastructure/web/routes/savings-bucket.routes.ts
function createSavingsBucketRoutes(savingsBucketController) {
  const router = createOpenAPIApp();
  router.openapi(listSavingsBucketsRoute, async (c) => {
    return savingsBucketController.findAll(c);
  });
  router.openapi(createSavingsBucketRoute, async (c) => {
    return savingsBucketController.create(c);
  });
  router.openapi(getSavingsBucketRoute, async (c) => {
    return savingsBucketController.findById(c);
  });
  router.openapi(updateSavingsBucketRoute, async (c) => {
    return savingsBucketController.update(c);
  });
  router.openapi(deleteSavingsBucketRoute, async (c) => {
    return savingsBucketController.delete(c);
  });
  router.openapi(transferToBucketRoute, async (c) => {
    return savingsBucketController.transfer(c);
  });
  return router;
}

// src/application/validation/installment-plan.schema.ts
var CreateInstallmentPlanSchema = exports_external.object({
  totalAmount: exports_external.number().positive("Total amount must be positive"),
  currency: exports_external.string().min(3).max(3).default("BRL"),
  purchaseDate: exports_external.string().datetime("Invalid date format. Use ISO 8601 format"),
  installmentCount: exports_external.number().int().min(2, "Installment count must be at least 2").max(60, "Installment count cannot exceed 60"),
  description: exports_external.string().min(1, "Description is required").max(200, "Description cannot exceed 200 characters"),
  paymentMethodId: exports_external.string().min(1, "Payment method ID is required"),
  categoryId: exports_external.string().min(1, "Category ID is required")
}).refine((data) => {
  const purchaseDate = new Date(data.purchaseDate);
  const futureLimit = new Date;
  futureLimit.setFullYear(futureLimit.getFullYear() + 1);
  return purchaseDate <= futureLimit;
}, {
  message: "Purchase date cannot be more than 1 year in the future",
  path: ["purchaseDate"]
});
var UpdateInstallmentPlanSchema = exports_external.object({
  description: exports_external.string().min(1, "Description cannot be empty").max(200, "Description cannot exceed 200 characters").optional()
});
var InstallmentPlanStatusSchema = exports_external.enum(["active", "completed", "cancelled"]);
var InstallmentPlanResponseSchema = exports_external.object({
  id: exports_external.string(),
  totalAmount: exports_external.number(),
  currency: exports_external.string(),
  purchaseDate: exports_external.string().datetime(),
  installmentCount: exports_external.number().int(),
  monthlyAmount: exports_external.number(),
  description: exports_external.string(),
  paymentMethodId: exports_external.string(),
  categoryId: exports_external.string(),
  status: InstallmentPlanStatusSchema,
  createdAt: exports_external.string().datetime(),
  updatedAt: exports_external.string().datetime()
});
var InstallmentProgressResponseSchema = exports_external.object({
  planId: exports_external.string(),
  description: exports_external.string(),
  totalInstallments: exports_external.number().int(),
  paidInstallments: exports_external.number().int(),
  remainingInstallments: exports_external.number().int(),
  totalAmount: exports_external.number(),
  currency: exports_external.string(),
  paidAmount: exports_external.number(),
  remainingAmount: exports_external.number(),
  progressPercentage: exports_external.number().min(0).max(100),
  isCompleted: exports_external.boolean(),
  nextInstallmentDate: exports_external.string().datetime().nullable()
});
var InstallmentPlanIdParamSchema = exports_external.object({
  id: exports_external.string().min(1, "Installment plan ID is required")
});

// src/infrastructure/web/docs/installment-plan.openapi.ts
var installmentPlanRoutes = createBasicCRUDRoutes("installment-plans", {
  list: exports_external.array(InstallmentPlanResponseSchema),
  create: CreateInstallmentPlanSchema,
  update: UpdateInstallmentPlanSchema,
  response: InstallmentPlanResponseSchema
}, "Installment Plans");
var listInstallmentPlansRoute = installmentPlanRoutes.list;
var createInstallmentPlanRoute = installmentPlanRoutes.create;
var getInstallmentPlanRoute = installmentPlanRoutes.get;
var updateInstallmentPlanRoute = installmentPlanRoutes.update;
var deleteInstallmentPlanRoute = installmentPlanRoutes.delete;

// src/infrastructure/web/routes/installment-plan.routes.ts
function createInstallmentPlanRoutes(installmentPlanController) {
  const router = createOpenAPIApp();
  router.openapi(listInstallmentPlansRoute, async (c) => {
    return installmentPlanController.findAll(c);
  });
  router.openapi(createInstallmentPlanRoute, async (c) => {
    return installmentPlanController.create(c);
  });
  router.openapi(getInstallmentPlanRoute, async (c) => {
    return installmentPlanController.findById(c);
  });
  router.openapi(updateInstallmentPlanRoute, async (c) => {
    return installmentPlanController.update(c);
  });
  router.openapi(deleteInstallmentPlanRoute, async (c) => {
    return installmentPlanController.delete(c);
  });
  return router;
}

// src/infrastructure/web/docs/report.openapi.ts
var ErrorResponseSchema5 = exports_external.object({
  error: exports_external.object({
    message: exports_external.string(),
    code: exports_external.string(),
    timestamp: exports_external.string(),
    path: exports_external.string().optional(),
    details: exports_external.array(exports_external.any()).optional()
  })
});
var SummaryReportSchema = exports_external.object({
  period: exports_external.object({
    year: exports_external.number(),
    month: exports_external.number(),
    startDate: exports_external.string(),
    endDate: exports_external.string()
  }),
  totals: exports_external.object({
    income: exports_external.number(),
    expenses: exports_external.number(),
    savings: exports_external.number(),
    netFlow: exports_external.number()
  }),
  categories: exports_external.array(exports_external.object({
    id: exports_external.string(),
    name: exports_external.string(),
    total: exports_external.number(),
    count: exports_external.number()
  })),
  paymentMethods: exports_external.array(exports_external.object({
    id: exports_external.string(),
    name: exports_external.string(),
    total: exports_external.number(),
    count: exports_external.number()
  }))
});
var MonthlyReportSchema = exports_external.object({
  period: exports_external.object({
    year: exports_external.number(),
    month: exports_external.number(),
    startDate: exports_external.string(),
    endDate: exports_external.string()
  }),
  totals: exports_external.object({
    income: exports_external.number(),
    expenses: exports_external.number(),
    savings: exports_external.number(),
    netFlow: exports_external.number()
  }),
  dailyBreakdown: exports_external.array(exports_external.object({
    date: exports_external.string(),
    income: exports_external.number(),
    expenses: exports_external.number(),
    netFlow: exports_external.number()
  })),
  categoryBreakdown: exports_external.array(exports_external.object({
    id: exports_external.string(),
    name: exports_external.string(),
    total: exports_external.number(),
    count: exports_external.number(),
    percentage: exports_external.number()
  }))
});
var YearlyReportSchema = exports_external.object({
  period: exports_external.object({
    year: exports_external.number(),
    startDate: exports_external.string(),
    endDate: exports_external.string()
  }),
  totals: exports_external.object({
    income: exports_external.number(),
    expenses: exports_external.number(),
    savings: exports_external.number(),
    netFlow: exports_external.number()
  }),
  monthlyBreakdown: exports_external.array(exports_external.object({
    month: exports_external.number(),
    income: exports_external.number(),
    expenses: exports_external.number(),
    netFlow: exports_external.number()
  })),
  categoryBreakdown: exports_external.array(exports_external.object({
    id: exports_external.string(),
    name: exports_external.string(),
    total: exports_external.number(),
    count: exports_external.number(),
    percentage: exports_external.number()
  }))
});
var YearMonthParamSchema = exports_external.object({
  year: exports_external.string().regex(/^\d{4}$/, "Year must be a 4-digit number").openapi({ param: { name: "year", in: "path" } }),
  month: exports_external.string().regex(/^(0?[1-9]|1[0-2])$/, "Month must be between 1 and 12").openapi({ param: { name: "month", in: "path" } })
});
var YearParamSchema = exports_external.object({
  year: exports_external.string().regex(/^\d{4}$/, "Year must be a 4-digit number").openapi({ param: { name: "year", in: "path" } })
});
var getSummaryReportRoute = createRoute({
  method: "get",
  path: "/summary",
  tags: ["Reports"],
  summary: "Get report summary",
  description: "Get current month and year financial summary",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SummaryReportSchema
        }
      },
      description: "Financial summary report"
    }
  }
});
var getMonthlyReportRoute = createRoute({
  method: "get",
  path: "/monthly/{year}/{month}",
  tags: ["Reports"],
  summary: "Get monthly report",
  description: "Generate detailed monthly financial report",
  request: {
    params: YearMonthParamSchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MonthlyReportSchema
        }
      },
      description: "Monthly financial report"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema5
        }
      },
      description: "Invalid date parameters"
    }
  }
});
var getYearlyReportRoute = createRoute({
  method: "get",
  path: "/yearly/{year}",
  tags: ["Reports"],
  summary: "Get yearly report",
  description: "Generate detailed yearly financial report",
  request: {
    params: YearParamSchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: YearlyReportSchema
        }
      },
      description: "Yearly financial report"
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema5
        }
      },
      description: "Invalid year parameter"
    }
  }
});

// src/infrastructure/web/routes/report.routes.ts
function createReportRoutes(reportController) {
  const router = createOpenAPIApp();
  router.openapi(getSummaryReportRoute, async (c) => {
    return reportController.getSummary(c);
  });
  router.openapi(getMonthlyReportRoute, async (c) => {
    return reportController.getMonthlyReport(c);
  });
  router.openapi(getYearlyReportRoute, async (c) => {
    return reportController.getYearlyReport(c);
  });
  return router;
}

// src/infrastructure/web/routes/index.ts
function createApiRoutes(controllers) {
  const api = new OpenAPIHono;
  api.route("/transactions", createTransactionRoutes(controllers.transactionController));
  api.route("/categories", createCategoryRoutes(controllers.categoryController));
  api.route("/payment-methods", createPaymentMethodRoutes(controllers.paymentMethodController));
  api.route("/subscriptions", createSubscriptionRoutes(controllers.subscriptionController));
  api.route("/buckets", createSavingsBucketRoutes(controllers.savingsBucketController));
  api.route("/installment-plans", createInstallmentPlanRoutes(controllers.installmentPlanController));
  api.route("/reports", createReportRoutes(controllers.reportController));
  return api;
}

// src/main.ts
var app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: result.error.issues,
          timestamp: new Date().toISOString()
        }
      }, 400);
    }
  }
});
app.use("*", errorHandlerMiddleware);
app.use("*", corsMiddleware);
app.use("*", loggerMiddleware);
app.get("/health", async (c) => {
  const dbConnected = await checkDatabaseConnection();
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: dbConnected ? "connected" : "disconnected"
  });
});
var transactionRepository = new PostgreSQLTransactionRepository;
var categoryRepository = new PostgreSQLCategoryRepository;
var paymentMethodRepository = new PostgreSQLPaymentMethodRepository;
var installmentPlanRepository = new PostgreSQLInstallmentPlanRepository;
var subscriptionRepository = new PostgreSQLSubscriptionRepository;
var savingsBucketRepository = new PostgreSQLSavingsBucketRepository;
var bucketTransferRepository = new PostgreSQLBucketTransferRepository;
var transactionService = new TransactionService(transactionRepository, categoryRepository, paymentMethodRepository);
var installmentService = new InstallmentService(installmentPlanRepository, transactionRepository, paymentMethodRepository);
var subscriptionService = new SubscriptionService(subscriptionRepository, transactionRepository);
var reportingService = new ReportingService(transactionRepository, categoryRepository, paymentMethodRepository, subscriptionRepository, savingsBucketRepository);
var savingsBucketService = new SavingsBucketService(savingsBucketRepository, bucketTransferRepository);
var createTransactionUseCase = new CreateTransactionUseCase(transactionRepository, categoryRepository, paymentMethodRepository, transactionService);
var updateTransactionUseCase = new UpdateTransactionUseCase(transactionRepository, categoryRepository, paymentMethodRepository, transactionService);
var deleteTransactionUseCase = new DeleteTransactionUseCase(transactionRepository);
var listTransactionsUseCase = new ListTransactionsUseCase(transactionRepository);
var createInstallmentPlanUseCase = new CreateInstallmentPlanUseCase(installmentPlanRepository, categoryRepository, paymentMethodRepository, installmentService);
var createSubscriptionUseCase = new CreateSubscriptionUseCase(subscriptionRepository, categoryRepository, paymentMethodRepository);
var cancelSubscriptionUseCase = new CancelSubscriptionUseCase(subscriptionRepository);
var generateMonthlyReportUseCase = new GenerateMonthlyReportUseCase(reportingService);
var generateYearlyReportUseCase = new GenerateYearlyReportUseCase(reportingService);
var createSavingsBucketUseCase = new CreateSavingsBucketUseCase(savingsBucketRepository);
var transferToBucketUseCase = new TransferToBucketUseCase(savingsBucketRepository, savingsBucketService);
var controllers = {
  transactionController: new TransactionController(createTransactionUseCase, updateTransactionUseCase, deleteTransactionUseCase, listTransactionsUseCase),
  categoryController: new CategoryController(categoryRepository),
  paymentMethodController: new PaymentMethodController(paymentMethodRepository),
  subscriptionController: new SubscriptionController(createSubscriptionUseCase, cancelSubscriptionUseCase, subscriptionRepository),
  savingsBucketController: new SavingsBucketController(createSavingsBucketUseCase, transferToBucketUseCase, savingsBucketRepository),
  installmentPlanController: new InstallmentPlanController(createInstallmentPlanUseCase, installmentPlanRepository),
  reportController: new ReportController(generateMonthlyReportUseCase, generateYearlyReportUseCase)
};
var apiRoutes = createApiRoutes(controllers);
app.route("/api", apiRoutes);
createDocsRoutes(app);
app.notFound((c) => {
  return c.json({
    error: {
      message: "Endpoint not found",
      code: "NOT_FOUND",
      timestamp: new Date().toISOString(),
      path: c.req.path
    }
  }, 404);
});
var port = parseInt(process.env.PORT || "3000");
console.log(`\uD83D\uDE80 Starting Cofrinho Server...
`);
var dbConnected = await checkDatabaseConnection();
if (!dbConnected) {
  console.error("\u274C Failed to connect to database. Exiting...");
  process.exit(1);
}
console.log("\u2705 Database connection established");
var main_default = {
  fetch: app.fetch,
  port
};
console.log(`\uD83C\uDF1F Server running on http://localhost:${port}`);
console.log(`\uD83D\uDCCA Health check: http://localhost:${port}/health`);
console.log(`\uD83D\uDCDD API Base: http://localhost:${port}/api`);
console.log(`\uD83D\uDCDA API Documentation: http://localhost:${port}/api/docs`);
console.log(`\uD83D\uDCC4 OpenAPI Spec: http://localhost:${port}/api/openapi.json`);
console.log(`\uD83D\uDD0D Alternative Docs: http://localhost:${port}/api/redoc`);
console.log(`
\uD83D\uDCCB Available API Endpoints:`);
console.log("  \u2022 GET /api/transactions - List transactions");
console.log("  \u2022 GET /api/categories - List categories");
console.log("  \u2022 GET /api/payment-methods - List payment methods");
console.log("  \u2022 GET /api/subscriptions - List subscriptions");
console.log("  \u2022 GET /api/buckets - List savings buckets");
console.log("  \u2022 GET /api/installment-plans - List installment plans");
console.log("  \u2022 GET /api/reports/summary - Get report summary");
process.on("SIGINT", async () => {
  console.log(`
\u23F9\uFE0F  Shutting down server...`);
  await closeDatabaseConnection();
  console.log("\u2705 Server shutdown complete");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log(`
\u23F9\uFE0F  Received SIGTERM, shutting down gracefully...`);
  await closeDatabaseConnection();
  console.log("\u2705 Server shutdown complete");
  process.exit(0);
});
export {
  main_default as default
};
