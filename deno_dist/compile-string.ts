import Parse from "./parse.ts";

/* TYPES */

import type { EtaConfig } from "./config.ts";
import type { AstObject } from "./parse.ts";

/* END TYPES */

/**
 * Compiles a template string to a function string. Most often users just use `compile()`, which calls `compileToString` and creates a new function using the result
 *
 * **Example**
 *
 * ```js
 * compileToString("Hi <%= it.user %>", eta.config)
 * // "var tR='',include=E.include.bind(E),includeFile=E.includeFile.bind(E);tR+='Hi ';tR+=E.e(it.user);if(cb){cb(null,tR)} return tR"
 * ```
 */

export default function compileToString(
  str: string,
  config: EtaConfig,
): string {
  var buffer: Array<AstObject> = Parse(str, config);

  var res = "var tR='',__l,__lP" +
    (config.include ? ",include=E.include.bind(E)" : "") +
    (config.includeFile ? ",includeFile=E.includeFile.bind(E)" : "") +
    "\nfunction layout(p,d){__l=p;__lP=d}\n" +
    (config.useWith ? "with(" + config.varName + "||{}){" : "") +
    compileScope(buffer, config) +
    (config.includeFile
      ? "if(__l)tR=" +
        (config.async ? "await " : "") +
        `includeFile(__l,Object.assign(__lP||${config.varName},{body:tR}))\n`
      : config.include
      ? "if(__l)tR=" +
        (config.async ? "await " : "") +
        `include(__l,Object.assign(__lP||${config.varName},{body:tR}))\n`
      : "") +
    "if(cb){cb(null,tR)} return tR" +
    (config.useWith ? "}" : "");

  if (config.plugins) {
    for (var i = 0; i < config.plugins.length; i++) {
      var plugin = config.plugins[i];
      if (plugin.processFnString) {
        res = plugin.processFnString(res, config);
      }
    }
  }

  return res;
}

/**
 * Loops through the AST generated by `parse` and transform each item into JS calls
 *
 * **Example**
 *
 * ```js
 * // AST version of 'Hi <%= it.user %>'
 * let templateAST = ['Hi ', { val: 'it.user', t: 'i' }]
 * compileScope(templateAST, eta.config)
 * // "tR+='Hi ';tR+=E.e(it.user);"
 * ```
 */

function compileScope(buff: Array<AstObject>, config: EtaConfig) {
  var i = 0;
  var buffLength = buff.length;
  var returnStr = "";

  for (i; i < buffLength; i++) {
    var currentBlock = buff[i];
    if (typeof currentBlock === "string") {
      var str = currentBlock;

      // we know string exists
      returnStr += "tR+='" + str + "'\n";
    } else {
      var type = currentBlock.t; // ~, s, !, ?, r
      var content = currentBlock.val || "";

      if (type === "r") {
        // raw

        if (config.filter) {
          content = "E.filter(" + content + ")";
        }

        returnStr += "tR+=" + content + "\n";
      } else if (type === "i") {
        // interpolate

        if (config.filter) {
          content = "E.filter(" + content + ")";
        }

        if (config.autoEscape) {
          content = "E.e(" + content + ")";
        }
        returnStr += "tR+=" + content + "\n";
        // reference
      } else if (type === "e") {
        // execute
        returnStr += content + "\n"; // you need a \n in case you have <% } %>
      }
    }
  }

  return returnStr;
}
