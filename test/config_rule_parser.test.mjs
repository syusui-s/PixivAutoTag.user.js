import {
  ConfigRuleParser
} from '../src/config_rule_parser.js';

import assert from 'assert';

import util from 'util';

describe('ConfigRuleParser', () => {

  const parser = new ConfigRuleParser();

  describe('#parse', () => {

    describe('when collect rule is given', () => {

      it('should parse rule', () => {
        const rule =
          '# 非公開設定\n' +
          'private R-18 R-18G R-17.9 R-15\n' +
          '# 一般\n' +
          'pattern オリジナル オリジナル\n' +
          '# 艦これ\n' +
          'pattern_all ~1 ^艦これ$|^艦隊これくしょん$ ^(.+)(改|改二)$\n' +
          'pattern     ~1 ^(.+)(艦隊これくしょん)$\n' +
          'match 卯月 うーちゃん\n' +
          '# 東方\n' +
          'match_all 多々良小傘 東方 小傘\n';
          // 'addition_pattern_all ~1(アズールレーン) ^アズールレーン|アズレン|碧蓝航线$ ^睦月|如月|卯月|水無月)$';

        console.log(util.inspect(parser.parse(rule).success.rules, false, null));
        
        assert(true);
      });
    });
  });
});
