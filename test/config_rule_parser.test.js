import assert from 'assert';
import { ConfigRuleParser } from '../src/config_rule_parser.js';

// import util from 'util';

describe('ConfigRuleParser', () => {
  const parser = new ConfigRuleParser();

  describe('#parse', () => {
    describe('when collect rule is given', () => {
      it('should parse rule', () => {
        const rule =
          '# 非公開設定\n' +
          'private R-18 R-18G R-17.9 R-15\n' +
          '\n' +
          '# 一般\n' +
          'pattern オリジナル オリジナル\n' +
          '# 艦これ\n' +
          'match       -~1 艦これ\n' +
          'match_all   アリス・キャロル ARIA アリス\n' +
          'match_all   -アリス          ARIA アリス\n' +
          'pattern_all ~1 ^艦これ$|^艦隊これくしょん$ ^(.+)(改|改二)$\n' +
          'pattern     ~1 ^(.+)(艦隊これくしょん)$\n' +
          'match 卯月 うーちゃん\n' +
          '# 東方\n' +
          'match_all 多々良小傘 東方 小傘\n';
        // 'addition_pattern_all ~1(アズールレーン) ^アズールレーン|アズレン|碧蓝航线$ ^睦月|如月|卯月|水無月)$';

        const result = parser.parse(rule);
        assert(result.success);
        // console.log(util.inspect(result.success.rules, false, null));
      });
    });

    describe('when invalid rule is given', () => {
      it('should ends up with error', () => {
        const rule = 'macth_all 多々良小傘 東方 小傘\n';

        const result = parser.parse(rule);
        assert(!result.success);
        // console.log(util.inspect(result.success.rules, false, null));
      });
    });
  });
});
