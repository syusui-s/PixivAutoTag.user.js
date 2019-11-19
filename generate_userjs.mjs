import fs from 'fs';
import path from 'path';
import util from 'util';
import licenseChecker from 'license-checker';

class UserScriptMetadataBuilder {

  static validateRunAt(value) {
    return this.runAtValues.includes(value);
  }

  constructor() {
    this.lines = [];
  }

  addLine(line) {
    this.lines.push(line);
  }

  name(value) {
    this.addLine(['@name', value]);

    return this;
  }

  description(value) {
    this.addLine(['@description', value]);

    return this;
  }

  version(value) {
    this.addLine(['@version', value]);

    return this;
  }

  match(value) {
    this.addLine(['@match', value]);

    return this;
  }

  runAt(value) {
    if (! this.constructor.validateRunAt(value)) {
      throw new Error(`runAt argument must be ${this.constructor.runAtValues} but given ${value}`);
    }

    this.addLine(['@run-at', value]);

    return this;
  }

  build() {
    const maxLength =
      this.lines.reduce((acc, [type]) => Math.max(acc, type.length), 0);
    const padLength = maxLength + 7;
    const formattedLines =
      this.lines.map(([type, ...rest]) => [type.padEnd(padLength), ...rest].join(' '));

    const lines = [
      this.constructor.firstLine,
      ...formattedLines,
      this.constructor.lastLine,
    ];

    return `${lines.map(line => `// ${line}`).join('\n')}\n`;
  }
}

Object.assign(UserScriptMetadataBuilder, {
  firstLine:   '==UserScript==',
  runAtValues: [ 'document-end' ],
  lastLine:    '==/UserScript==',
});

const readFile = util.promisify(fs.readFile);

const myLicense = () => readFile('./LICENSE_SHORT', { encoding: 'utf8' });

const commentify = multiLineString => multiLineString
  .split('\n')
  .map(line => `// ${line}`)
  .join('\n');

const generateLicenses = async function() {
  const packages = await new Promise((resolve, reject) =>
    licenseChecker.init({ start: path.resolve(), production: true }, (err, packages) => 
      err ? reject(err) : resolve(packages)
    )
  );

  const fqdn = Object.keys(packages).filter(name => name.startsWith('pixiv-auto-tag'));
  if (fqdn.length > 0)
    delete packages[fqdn];

  const licenseTexts = Object.keys(packages).map(name =>
    readFile(packages[name].licenseFile, { encoding: 'utf8' })
      .then(text => ({ name, text }))
  );

  return Promise.all(licenseTexts);
};

export default async function generateUserJs() {
  const json = await readFile('./package.json', { encoding: 'utf8' });
  const data = JSON.parse(json);
  const { description, version } = data;

  const banner = new UserScriptMetadataBuilder()
    .name('PixivAutoTag.user.js')
    .description(description)
    .version(version)
    .match('https://www.pixiv.net/member_illust.php?*illust_id=*')
    .match('https://www.pixiv.net/bookmark_add.php?*')
    .match('https://www.pixiv.net/novel/show.php?id=*')
    .match('https://www.pixiv.net/novel/bookmark_add.php?id=*')
    .runAt('document-end')
    .build();

  const myLicenseText = await myLicense();
  const licensesTexts = await generateLicenses();
  const licenses = licensesTexts
    .map(({ name, text }) => commentify(`\n${name}\n${(text)}`))
    .join('\n');

  return banner + commentify(myLicenseText) + licenses;
}
