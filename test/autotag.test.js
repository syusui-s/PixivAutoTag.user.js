import assert from 'assert';
import { Bookmark, BookmarkScope } from '../src/domain/bookmark.js';
import { Tag, Tags } from '../src/domain/tag.js';
import { Work } from '../src/domain/work.js';
import { Rule, Pattern } from '../src/domain/rule.js';

describe('ConfigRuleParser', () => {
  const work = new Work(
    'イラスト',
    Tags.fromIterable([
      Tag.for('艦これ'),
      Tag.for('響(艦隊これくしょん)'),
      Tag.for('艦これかわいい'),
    ]),
  );

  const bookmark = new Bookmark('comment', Tags.empty(), BookmarkScope.Public);

  const tagCloud = new Tags([
    Tag.for('艦隊これくしょん'),
    Tag.for('響'),
    Tag.for('艦これかわいい'),
    Tag.for('艦これ'),
  ]);

  ///////////

  const rules = [
    Rule.removeAll(Tag.for('艦これ'), [Pattern.regexp('^艦これ$')]),
    Rule.appendAll(Tag.for('艦隊これくしょん'), [Pattern.regexp('^艦これ$')]),
    Rule.appendSome(Tag.for('響'), [
      Pattern.regexp('ベールヌイ'),
      Pattern.regexp('響'),
    ]),
    Rule.privateSome([Pattern.regexp('響')]),
  ];

  // TBD addition Ruleの実行

  // 共通タグの抽出
  const commonTags = work.tags.intersect(tagCloud);
  const bookmarkWithCommonTags = bookmark.withTags(commonTags);

  // 付与タグリストの生成
  const taggedBookmark = rules.reduce(
    (bookmark, rule) => rule(work)(bookmark),
    bookmarkWithCommonTags,
  );
  assert(taggedBookmark.tags.has(Tag.for('艦隊これくしょん')));
  assert(taggedBookmark.tags.has(Tag.for('響')));
  assert(taggedBookmark.tags.has(Tag.for('艦これかわいい')));
  assert(taggedBookmark.tags.size() === 3);
});
