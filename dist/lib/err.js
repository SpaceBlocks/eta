"use strict";
// v 1.0.32
Object.defineProperty(exports, "__esModule", { value: true });
var setPrototypeOf = Object.setPrototypeOf ||
    function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    };
function SqrlErr(message) {
    var err = new Error(message);
    setPrototypeOf(err, SqrlErr.prototype);
    return err;
}
SqrlErr.prototype = Object.create(Error.prototype, {
    name: { value: 'Squirrelly Error', enumerable: false }
});
// TODO: Class transpilation adds a lot to the bundle size
function ParseErr(message, str, indx) {
    var whitespace = str
        .slice(0, indx) // +2 because of {{
        .split(/\n/);
    // console.log('whitespace: \n' + JSON.stringify(whitespace))
    var lineNo = whitespace.length;
    var colNo = whitespace[lineNo - 1].length + 1;
    message +=
        ' at line ' +
            lineNo +
            ' col ' +
            colNo +
            ':\n\n' +
            '  ' +
            str.split(/\n/)[lineNo - 1] +
            '\n' +
            '  ' +
            Array(colNo).join(' ') +
            '^';
    throw SqrlErr(message);
}
exports.ParseErr = ParseErr;
//# sourceMappingURL=err.js.map