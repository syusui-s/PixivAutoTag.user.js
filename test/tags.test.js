import assert from 'assert';
import { Tag, Tags } from '../src/domain/tag.js';

const tagsArrayA = [
  '艦隊これくしょん',
  '艦これ',
  '卯月',
  '卯月(艦隊これくしょん)',
  '艦隊これくしょん',
].map((txt) => Tag.for(txt));

const tagsArrayB = ['艦隊これくしょん', '卯月', '艦これかわいい'].map((txt) =>
  Tag.for(txt),
);

const tagsArrayDiff = ['艦これ', '卯月(艦隊これくしょん)'].map((txt) =>
  Tag.for(txt),
);

const tagsArrayCommon = ['艦隊これくしょん', '卯月'].map((txt) => Tag.for(txt));

const tagsArrayUnion = tagsArrayA.concat(tagsArrayB);

const tagsA = new Tags(tagsArrayA);
const tagA = tagsA.toArray()[0];
const tagsAA = new Tags(tagsArrayA);
const tagsB = new Tags(tagsArrayB);
const tagsDiff = new Tags(tagsArrayDiff);
const tagsCommon = new Tags(tagsArrayCommon);
const tagsUnion = new Tags(tagsArrayUnion);
const tagsX = new Tags([]);
const tagsZ = new Tags([]);

describe('Tags', () => {
  describe('#toArray', () => {
    it('should return array of Tag', () => {
      assert(
        tagsA.toArray().every((tag, index) => tagsArrayA[index].equals(tag)),
      );
      assert.equal(tagsA.toArray().length, 4);

      assert.equal(tagsZ.toArray(), 0);
    });
  });

  describe('#has', () => {
    describe('when it contains a given tag', () => {
      it('should return true', () => {
        assert(tagsArrayA.every((tag) => tagsA.has(tag)));
        assert(tagsArrayB.every((tag) => tagsB.has(tag)));
      });
    });

    describe('when it does not contain a given tag', () => {
      it('should return false', () => {
        assert(!tagsA.has(Tag.for('睦月')));
        assert(!tagsB.has(Tag.for('如月')));
        assert(!tagsZ.has(Tag.for('弥生')));
      });
    });
  });

  describe('#equals', () => {
    describe('when argument has same contents', () => {
      it('should return true', () => {
        assert(tagsA.equals(tagsAA));
      });
    });

    describe('when argument does not have same contents', () => {
      it('should return false', () => {
        assert(!tagsA.equals(tagsB));
      });
    });
  });

  describe('#union', () => {
    it('should return union', () => {
      assert(tagsA.union(tagsB).equals(tagsUnion));
    });
  });

  describe('#diff', () => {
    it('should return difference', () => {
      assert(tagsA.diff(tagsB).equals(tagsDiff));
      assert(tagsA.diff(tagsZ).equals(tagsA));
    });
  });

  describe('#intersect', () => {
    it('should return intersect', () => {
      assert(tagsA.intersect(tagsB).equals(tagsCommon));
      assert(tagsA.intersect(tagsZ).equals(tagsZ));
    });
  });

  describe('#append', () => {
    it('should return a new Tags which has a given tag', () => {
      const tag = Tag.for('あ');
      assert(!tagsA.has(tag));
      assert(tagsA.append(tag).has(tag));
    });
  });

  describe('#$append', () => {
    it('should append a given tag to itself', () => {
      const tag = Tag.for('あ');
      assert(!tagsX.has(tag));
      tagsX.$append(tag);
      assert(tagsX.has(tag));
    });
  });

  describe('#remove', () => {
    it('should return a new Tags which does not have a given tag', () => {
      assert(tagsA.has(tagA));
      assert(!tagsA.remove(tagA).has(tagA));
    });
  });
});
