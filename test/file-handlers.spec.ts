/* global it, expect, describe */

import { renderFile, __express, templates, compile } from '../src/index'
import EtaErr from '../src/err'

var path = require('path'),
  filePath = path.join(__dirname, 'templates/simple.eta'),
  errFilePath = path.join(__dirname, 'templates/badsyntax.eta'),
  fakeFilePath = path.join(__dirname, 'templates/fake.eta')

describe('Simple renderFile tests', () => {
  it('renders a simple template file', async () => {
    var renderedFile = await renderFile(filePath, { name: 'Ben' })

    expect(renderedFile).toEqual('Hi Ben')
  })

  it('renderFile is aliased as __express', async () => {
    var renderedFile = await __express(filePath, { name: 'Ben' })

    expect(renderedFile).toEqual('Hi Ben')
  })

  it('renders async template with callback', (done) => {
    function cb(_err: Error | null, res?: string) {
      try {
        expect(res).toBe('Hi Ada Lovelace')
        done()
      } catch (error) {
        done(error)
      }
    }

    renderFile(filePath, { name: 'Ada Lovelace', async: true }, cb)
  })

  it('renders a simple template w/ a callback', async () => {
    renderFile(filePath, { name: 'Ben' }, function (_err: Error | null, res?: string) {
      expect(res).toEqual('Hi Ben')
    })
  })

  it('renders a simple template w/ callback and explicit config', async () => {
    // Note that rmWhitespace doesn't do anything specific
    renderFile(filePath, { name: 'Ben' }, { rmWhitespace: true }, function (
      _err: Error | null,
      res?: string
    ) {
      expect(res).toEqual('Hi Ben')
    })
  })

  it('renders an async template using Promises', async () => {
    var res = await renderFile(filePath, { name: 'Ada', async: true })
    expect(res).toEqual('Hi Ada')
  })

  it('renders an async template with an explicit config using Promises', async () => {
    var res = await renderFile(filePath, { name: 'Ada' }, { async: true })
    expect(res).toEqual('Hi Ada')
  })

  it('uses cached version of a file', async () => {
    templates.define(fakeFilePath, compile('This template does not exist'))

    // renderFile should just look straight in the cache for the template
    renderFile(fakeFilePath, { cache: true }, function (_err: Error | null, res?: string) {
      expect(res).toEqual('This template does not exist')
    })
  })

  it('parses a simple template w/ settings from Express', async () => {
    renderFile(
      filePath,
      {
        name: '<p>Ben</p>',
        cache: true,
        settings: {
          views: [path.join(__dirname, 'templates'), path.join(__dirname, 'othertemplates')],
          'view cache': true,
          'view options': { autoEscape: false },
        },
      },
      function (_err: Error | null, res?: string) {
        expect(res).toEqual('Hi <p>Ben</p>')
      }
    )
  })
})

describe('File location tests', () => {
  it('locates a file with the views option', async () => {
    let res = await renderFile(
      'simple.eta',
      { name: 'Ada' },
      { views: path.join(__dirname, 'templates') }
    )

    expect(res).toEqual('Hi Ada')
  })
})

describe('renderFile error tests', () => {
  it('render file with callback works on error', (done) => {
    function cb(err: Error, _res?: string) {
      expect(err).toBeTruthy()
      expect(err.message)
        .toEqual(`Loading file: /home/nebrelbug/Coding/eta/test/templates/badsyntax.eta failed:

Bad template syntax

Unexpected token '='
====================
var tR=''
tR+='Hi '
tR+=E.e(badSyntax(=!)
if(cb){cb(null,tR)} return tR
`)
      done()
    }

    renderFile(errFilePath, { name: 'Ada Lovelace', async: true }, cb)
  })

  test('throws with bad inner JS syntax using Promises', async () => {
    await expect(async () => {
      await renderFile(errFilePath, {})
    }).rejects.toThrow(
      EtaErr(`Loading file: /home/nebrelbug/Coding/eta/test/templates/badsyntax.eta failed:

Bad template syntax

Unexpected token '='
====================
var tR=''
tR+='Hi '
tR+=E.e(badSyntax(=!)
if(cb){cb(null,tR)} return tR
`)
    )
  })
})
