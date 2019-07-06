/**
 * 設定
 */
export class Config {

  static fromJson(json) {
    const obj = JSON.parse(json);
    return obj && this.fromObject(obj);
  }

  static fromObject({ ruleRaw }) {
    return new this(ruleRaw);
  }

  static default() {
    return new this(
      'private R-18'
    );
  }

  static create(ruleRaw) {
    return new this(ruleRaw);
  }

  /**
   * @param {string} ruleRaw ルールの文字列
   */
  constructor(ruleRaw) {
    this.ruleRaw = ruleRaw;
  }

  /**
   * ルールを取得する
   */
  get rule() {
    const parser = new RuleConfigParser();
    return parser.parse(this.ruleRaw).success;
  }

  toJson() {
    return JSON.stringify(this);
  }

  export() {
    // TODO DOMAINの外に移す
    const a = document.createElement('a');
    const date = new Date();

    const blob = new Blob([this.toJson()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    
    a.href = url.toString();
    a.download = `pixiv_auto_tag-${date.getTime()}.txt`;
    a.click();
  }
}
