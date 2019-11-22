import { ConfigRuleParser } from './config_rule_parser.js';

/**
 * 設定
 */
export class Config {
  /**
   * @param {string} json
   */
  static fromJson(json) {
    const obj = JSON.parse(json);
    return obj && this.fromObject(obj);
  }

  /**
   * @param {string} ruleRaw
   */
  static fromRuleRaw(ruleRaw) {
    return new this(ruleRaw);
  }

  /**
   * @param {{ ruleRaw: string }} arg
   */
  static fromObject({ ruleRaw }) {
    return new this(ruleRaw);
  }

  static default() {
    return new this(
      '# 設定例: https://github.com/syusui-s/PixivAutoTag.user.js#%E3%83%AB%E3%83%BC%E3%83%AB%E3%81%AE%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB'
    );
  }

  /**
   * @param {string} ruleRaw
   */
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
  rule() {
    const parser = new ConfigRuleParser();
    return parser.parse(this.ruleRaw);
  }

  toJson() {
    return JSON.stringify(this);
  }

  export() {
    const a = document.createElement('a');
    const date = new Date();

    const blob = new Blob([this.toJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    a.href = url.toString();
    a.download = `pixiv_auto_tag-${date.getTime()}.txt`;
    a.click();
  }
}
