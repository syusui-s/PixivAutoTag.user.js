
const work = new Work(
  'イラスト',
  Tags.fromIterable([
    Tag.for('艦これ'),
    Tag.for('響(艦隊これくしょん)'),
    Tag.for('艦これかわいい'),
  ]),
);
console.log(work);

const bookmark = new Bookmark(
  'comment',
  Tags.empty(),
  BookmarkScope.Public,
);
console.log(bookmark);

const tagCloud = new Tags([
  Tag.for('艦隊これくしょん'),
  Tag.for('響'),
  Tag.for('艦これかわいい'),
  Tag.for('艦これ'),
]);


///////////

const rules = [
  forAllPatterns([/^艦これ$/])(removeAction(Tag.for('艦これ'))),
  forAllPatterns([/^艦これ$/])(appendAction(Tag.for('艦隊これくしょん'))),
  forSomePatterns([/ベールヌイ/, /響/])(appendAction(Tag.for('響'))),
  forSomePatterns([/響/])(privateAction),
];

// addition Ruleの実行

// 共通タグの抽出
const commonTags = work.tags.intersect(tagCloud);
const bookmarkWithCommonTags = bookmark.withTags(commonTags);
console.log(commonTags);

// additionルール

// 付与タグリストの生成
const taggedBookmark = rules.reduce((bookmark, rule) => rule(work)(bookmark), bookmarkWithCommonTags);
console.log(taggedBookmark);
