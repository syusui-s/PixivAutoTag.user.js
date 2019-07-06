import { Rule, Pattern } from './domain.mjs';

class RuleConfigParseResult {
  static error(error) {
    return new this(null, error);
  }

  static success(success) {
    return new this(success, null);
  }

  constructor(success, error) {
    Object.assign(this, { success, error });
  }
}

/**
 * ルールの設定文字列
 */
export class RuleConfigParser {
  /**
   * パースしてRulesを生成する
   *
   * @throws {ConfigSyntaxError} 間違った構文のときに例外を投げる
   * @return {Rules}
   */
  parse(ruleStr) {
    const patternRule     = [];
    const patternAllRule  = [];
    const additionRule    = [];
    const additionAllRule = [];
    const privateRule     = [];
    const errors          = [];

    ruleStr.split('\n').forEach((line, num) => {
      const typeRegex = /^pattern|match|addition_pattern(_all)?$/i;

      const parsed = line.split(/\s+/);

      if (parsed.length >= 3 && parsed[0] && parsed[0].match(typeRegex)) {
        const [ ruleName, params ] = parsed;
        const [ tagName, ...patternStrs ] = params;
        const [ ruleType, all ] = ruleName && ruleName.match(typeRegex) || [];

        const rules = all ? patternAllRule : patternRule;
        const isRemove = tagName[0] === '-';
        const tag = Tag.for(tagName.substr(isRemove ? 1 : 0));
        const patterns = patternStrs && patternStrs.map(tag => Pattern.exact(tag));

        // TODO 激ヤバコードなのでいつか直す
        const AppendSome = 0, AppendAll = 1, RemoveSome = 2, RemoveAll = 3;
        let ruleFactory;
        switch (+isRemove << 1 + (+!!all)) {
        case AppendSome: ruleFactory = Rule.appendSome;
          break;
        case AppendAll:  ruleFactory = Rule.appendAll;
          break;
        case RemoveSome: ruleFactory = Rule.removeSome;
          break;
        case RemoveAll:  ruleFactory = Rule.removeAll;
          break;
        default:
          throw new Error('');
        }

        switch (ruleType) {
        case 'match':
        case 'match_all':
        case 'pattern':
        case 'pattern_all':
          rules.push(ruleFactory(tag, patterns));
          break;
        case 'addition_pattern':
          // throw new Error('not implemented');
          break;
        default:
          throw new Error(`未知のルールです: ${ruleType}`);
        }
      } else if ( parsed.length >= 2 && parsed[0].match(/^private$/i) ) { // 非公開タグ
        const rules = parsed.slice(1).map(tag => Pattern.exact(tag));
        privateRule.push(Rule.privateSome(rules));
      } else if ( line.match(/^\s*$|^\s*#/) ) { // 空行 or コメント行
        // nothing to do
      } else {
        errors.push({
          lineNumber: (num+1),
          message: `不正なコマンドを使用しているか、コマンドへの引数が少なすぎます。内容: ${line}`
        });
        return false;
      }
    });

    if (errors.length !== 0) {
      return RuleConfigParseResult.error(errors);
    }

    return RuleConfigParseResult.success(new Rules(
      privateRule
        .concat(patternRule)
        .concat(patternAllRule)
        .concat(additionRule)
        .concat(additionAllRule)
    ));
  }
}
