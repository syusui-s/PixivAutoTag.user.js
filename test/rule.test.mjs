import {
  Bookmark, Work,
  Tag, TagRef, Tags, Pattern, Rule,
} from '../src/main.mjs';

import assert from 'assert';

describe('Rule', () => {
  const work = Work.fromObject({
    title: '作品名',
    description: '説明',
    tags: Tags.fromArgs( Tag.for('タグ') ),
  });

  describe('.appendSome', () => {
    const ruleMatch = Rule.appendSome(
      TagRef.for('追加タグ'),
      [
        Pattern.exact('タグ'),
      ]
    );

    const ruleNotMatch = Rule.appendSome(
      TagRef.for('追加タグ'),
      [
        Pattern.exact('マッチしない'),
      ]
    );

    describe('#process', () => {
      describe('when rule matches a tag', () => {
        it('should return bookmark which has a tag', () => {
          const tag = Tag.for('追加タグ');
          const resultBookmark = ruleMatch.process(work, Bookmark.empty());
          assert( resultBookmark.tags.has(tag) );
        });
      });

      describe('when rule does not match a tag', () => {
        it('should return bookmark which does not have a tag', () => {
          const tag = Tag.for('追加タグ');
          const resultBookmark = ruleNotMatch.process(work, Bookmark.empty());
          assert( ! resultBookmark.tags.has(tag) );
        });
      });
    });
  });
});
