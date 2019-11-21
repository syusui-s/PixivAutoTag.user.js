import { Pattern, Match } from '../src/domain/rule.js';
import { Tag } from '../src/domain/tag.js';

import assert from 'assert';

describe('Pattern', () => {
  describe('.exact', () => {
    it('should return a new Pattern', () => {
      const pattern = Pattern.exact('あああ');

      assert(pattern instanceof Pattern);
    });
  });

  describe('.regexp', () => {
    it('should return a new Pattern', () => {
      const pattern = Pattern.regexp('[0-9]*');

      assert(pattern instanceof Pattern);
    });
  });

  describe('#match', () => {
    describe('when matched', () => {
      it('should return Match and Match#succeeded should return true', () => {
        const pattern = Pattern.regexp('^[あかさ]+$');
        const tag = Tag.for('あかさかさかあか');

        const match = pattern.match(tag);

        assert(match instanceof Match);
        assert(match.succeeded());
      });
    });

    describe('when did not matched', () => {
      it('should return Match and Match#failed should return true', () => {
        const pattern = Pattern.exact('あいうえお');
        const tag = Tag.for('かきくけこ');

        const match = pattern.match(tag);

        assert(match instanceof Match);
        assert(match.failed());
      });
    });
  });
});
