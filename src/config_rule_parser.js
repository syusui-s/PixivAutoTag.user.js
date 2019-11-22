import { Rule, Rules, Pattern } from './domain/rule.js';
import { Tag } from './domain/tag.js';

/** @typedef {import('./domain/rule.js').Action} Action */

class ConfigRuleParseError {
  /**
   * @param {number} lineNumber
   * @param {string} message
   */
  constructor(lineNumber, message) {
    this.lineNumber = lineNumber;
    this.message = message;
  }
}

class ConfigRuleParseResult {
  /**
   * @param {ConfigRuleParseError[]} errors
   */
  static error(errors) {
    return new this(null, errors);
  }

  /**
   * @param {Rules} success
   */
  static success(success) {
    return new this(success, null);
  }

  /**
   * @param {Rules?}                  success
   * @param {ConfigRuleParseError[]?} errors
   */
  constructor(success, errors) {
    this.success = success;
    this.errors = errors;
  }
}

/**
 * ルールの設定文字列
 */
export class ConfigRuleParser {
  /**
   * パースしてRulesを生成する
   *
   * @param  {string} ruleStr
   * @throws ConfigSyntaxError 間違った構文のときに例外を投げる
   * @return {ConfigRuleParseResult}
   */
  parse(ruleStr) {
    /** @type {Action[]} */
    const patternRule = [];
    /** @type {Action[]} */
    const patternAllRule = [];
    /** @type {Action[]} */
    const additionRule = [];
    /** @type {Action[]} */
    const additionAllRule = [];
    /** @type {Action[]} */
    const privateRule = [];
    /** @type {ConfigRuleParseError[]} */
    const errors = [];

    ruleStr.split('\n').forEach(
      /** @type {(line: string, num: number) => void} */ (line, num) => {
        const typeRegex = /^(pattern|match|addition_pattern)(_all)?$/i;

        const parsed = line.split(/\s+/);

        if (parsed.length >= 3 && parsed[0] && parsed[0].match(typeRegex)) {
          const [ruleName, ...params] = parsed;
          const [tagName, ...patternStrs] = params;
          const match = ruleName && ruleName.match(typeRegex);
          const [ruleType, all] = (match && match.slice(1)) || [];

          const rules = all ? patternAllRule : patternRule;
          const isRemove = tagName[0] === '-';
          const tag = Tag.for(tagName.substr(isRemove ? 1 : 0));

          // TODO 激ヤバコードなのでいつか直す
          const AppendSome = 0,
            AppendAll = 1,
            RemoveSome = 2,
            RemoveAll = 3;
          let ruleFactory;
          switch ((Number(isRemove) << 1) + Number(!!all)) {
            case AppendSome:
              ruleFactory = Rule.appendSome;
              break;
            case AppendAll:
              ruleFactory = Rule.appendAll;
              break;
            case RemoveSome:
              ruleFactory = Rule.removeSome;
              break;
            case RemoveAll:
              ruleFactory = Rule.removeAll;
              break;
            default:
              throw new Error(
                `実装上漏れのあるケースがあります: isRemove: ${isRemove} all: ${all}`
              );
          }

          switch (ruleType) {
            case 'match':
            case 'match_all':
              {
                const patterns =
                  patternStrs && patternStrs.map(tag => Pattern.exact(tag));
                rules.push(ruleFactory(tag, patterns));
              }
              break;
            case 'pattern':
            case 'pattern_all':
              {
                const patterns =
                  patternStrs && patternStrs.map(tag => Pattern.regexp(tag));
                rules.push(ruleFactory(tag, patterns));
              }
              break;
            case 'addition_pattern':
            case 'addition_pattern_all':
              errors.push(
                new ConfigRuleParseError(
                  num + 1,
                  `申し訳ありませんが、addition_patternルールに対応していません。内容: ${line}`
                )
              );
              break;
            default:
              throw new Error(`実装上漏れのあるケースがあります: ${ruleType}`);
          }
        } else if (parsed.length >= 2 && parsed[0].match(/^private$/i)) {
          // 非公開タグ
          const rules = parsed.slice(1).map(tag => Pattern.exact(tag));
          privateRule.push(Rule.privateSome(rules));
        } else if (line.match(/^\s*$|^\s*#/)) {
          // 空行 or コメント行
          // nothing to do
        } else {
          errors.push({
            lineNumber: (num + 1),
            message: `不正なコマンドを使用しているか、コマンドへの引数が少なすぎます。内容: ${line}`,
          });
          return;
        }
      }
    );

    if (errors.length !== 0) {
      return ConfigRuleParseResult.error(errors);
    }

    return ConfigRuleParseResult.success(
      new Rules(
        privateRule
          .concat(patternRule)
          .concat(patternAllRule)
          .concat(additionRule)
          .concat(additionAllRule)
      )
    );
  }
}
