import assert from 'assert';
import { Tag, Tags } from '../src/domain/tag.js';
import { Bookmark } from '../src/domain/bookmark.js';
import { Work } from '../src/domain/work.js';
import { Pattern, Rule } from '../src/domain/rule.js';

describe('Rule', () => {
  const tagStr = 'タグ';
  const tag = Tag.for(tagStr);

  const tagStr1 = 'タグ1';
  const tag1 = Tag.for(tagStr1);

  const work = new Work('作品名', Tags.fromArgs(tag, tag1));

  describe('.appendSome', () => {
    const ruleMatch = Rule.appendSome(Tag.for('追加~0'), [
      Pattern.exact('マッチしない1'),
      Pattern.exact('マッチしない2'),
      Pattern.exact('マッチしない3'),
      Pattern.regexp('^タグ1?$'),
    ]);

    const ruleNotMatch = Rule.appendSome(Tag.for('追加タグ'), [
      Pattern.exact('マッチしない'),
    ]);

    describe('#process', () => {
      describe('when rule matches a tag', () => {
        it('should return bookmark which has a tag', () => {
          const appendedTag = Tag.for('追加タグ');
          const appendedTag1 = Tag.for('追加タグ1');
          const resultBookmark = ruleMatch(work)(Bookmark.empty());
          assert(resultBookmark.tags.has(appendedTag));
          assert(resultBookmark.tags.has(appendedTag1));
        });
      });

      describe('when rule does not match a tag', () => {
        it('should return bookmark which does not have a tag', () => {
          const tag = Tag.for('追加タグ');
          const resultBookmark = ruleNotMatch(work)(Bookmark.empty());
          assert(!resultBookmark.tags.has(tag));
        });
      });
    });
  });

  describe('.appendAll', () => {
    const ruleMatch = Rule.appendAll(Tag.for('追加タグ'), [
      Pattern.exact('タグ1'),
      Pattern.exact('タグ'),
    ]);

    const ruleNotMatch = Rule.appendAll(Tag.for('追加タグ'), [
      Pattern.exact('タグ'),
      Pattern.exact('タグ1'),
      Pattern.exact('マッチしない'),
    ]);

    describe('#process', () => {
      describe('when rule matches a tag', () => {
        it('should return bookmark which has a tag', () => {
          const tag = Tag.for('追加タグ');
          const resultBookmark = ruleMatch(work)(Bookmark.empty());
          assert(resultBookmark.tags.has(tag));
        });
      });

      describe('when rule does not match a tag', () => {
        it('should return bookmark which does not have a tag', () => {
          const tag = Tag.for('追加タグ');
          const resultBookmark = ruleNotMatch(work)(Bookmark.empty());
          assert(!resultBookmark.tags.has(tag));
        });
      });
    });
  });

  describe('.removeSome', () => {
    const tagRef = Tag.for('タグ');

    const ruleMatch = Rule.removeSome(tagRef, [
      Pattern.exact('マッチしない1'),
      Pattern.exact('マッチしない2'),
      Pattern.exact('マッチしない3'),
      Pattern.exact('タグ'),
    ]);

    const ruleNotMatch = Rule.removeSome(tagRef, [
      Pattern.exact('マッチしない'),
      Pattern.exact('マッチしない1'),
      Pattern.exact('マッチしない2'),
      Pattern.exact('マッチしない3'),
    ]);

    const commonTags = Tags.fromArgs(tag);
    const bookmark = Bookmark.empty().withTags(commonTags);

    describe('#process', () => {
      describe('when rule matches a tag', () => {
        it('should return bookmark which does not have a tag', () => {
          const resultBookmark = ruleMatch(work)(bookmark);
          assert(!resultBookmark.tags.has(tag));
        });
      });

      describe('when rule does not match a tag', () => {
        it('should return bookmark which has a tag', () => {
          const resultBookmark = ruleNotMatch(work)(bookmark);
          assert(resultBookmark.tags.has(tag));
        });
      });
    });
  });

  describe('.removeAll', () => {
    const tagRef = Tag.for('タグ');

    const ruleMatch = Rule.removeAll(tagRef, [
      Pattern.exact('タグ'),
      Pattern.exact('タグ1'),
    ]);

    const ruleNotMatch = Rule.removeAll(tagRef, [
      Pattern.exact('タグ'),
      Pattern.exact('タグ1'),
      Pattern.exact('マッチしない'),
    ]);

    const commonTags = Tags.fromArgs(tag);
    const bookmark = Bookmark.empty().withTags(commonTags);

    describe('#process', () => {
      describe('when rule matches a tag', () => {
        it('should return bookmark which does not have a tag', () => {
          const resultBookmark = ruleMatch(work)(bookmark);
          assert(!resultBookmark.tags.has(tag));
        });
      });

      describe('when rule does not match a tag', () => {
        it('should return bookmark which has a tag', () => {
          const resultBookmark = ruleNotMatch(work)(bookmark);
          assert(resultBookmark.tags.has(tag));
        });
      });
    });
  });
});
