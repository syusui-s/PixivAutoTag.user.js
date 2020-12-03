/**
 * @typedef {import('./tag.js').Tag}           Tag
 * @typedef {import('./tag.js').Tags}          Tags
 * @typedef {import('./work.js').Work}         Work
 * @typedef {import('./bookmark.js').Bookmark} Bookmark
 */

/**
 * @typedef {(bookmark: Bookmark) => Bookmark}        BookmarkAction
 * @typedef {(matchResult: Match) => BookmarkAction}  MatchAction
 * @typedef {(tag: Tag) => MatchAction}               TagMatchAction
 *
 * @typedef {(work: Work) => BookmarkAction}          Action
 */

/**
 * タグに一致するパターン
 */
export class Pattern {
  /**
   * 引数の文字列に完全一致するパターンを生成する
   *
   * @param {string} str
   */
  static exact(str) {
    const regex = new RegExp(
      `^${str.replace(/[.*+?^${}()|[\]\\]/g, (sym) => `\\${sym}`)}$`,
    );
    return new this(regex);
  }

  /**
   * 引数の正規表現に完全一致するパターンを生成する
   *
   * @param {string} regex
   */
  static regexp(regex) {
    return new this(new RegExp(regex));
  }

  /**
   * @param {RegExp} regex
   */
  constructor(regex) {
    this.regex = regex;
    Object.freeze(this);
  }

  /**
   * 引数のタグが自身のパターンに一致するかどうかを返す
   *
   * @param {Tag} tag
   */
  match(tag) {
    const match = tag.toString().match(this.regex);
    return new Match(match);
  }

  /**
   * 自身のパターンに引数のタグの集合のいずれかが一致するかどうかを返す
   *
   * @param {Tags} tags
   * @return {Match}
   */
  matchSome(tags) {
    for (const tag of tags.toArray()) {
      const match = this.match(tag);

      if (match.succeeded()) return match;
    }

    return Match.failed();
  }
}

/**
 * マッチの結果を保持するクラス
 */
export class Match {
  static failed() {
    return new this(null);
  }

  /**
   * @param {RegExpMatchArray?} match マッチオブジェクト
   */
  constructor(match) {
    this.match = match;
  }

  /**
   * マッチ結果のidx番目のグループのマッチ文字列を返す
   *
   * @param {number} idx
   * @return {string?}
   */
  at(idx) {
    return this.match && this.match[idx];
  }

  /**
   * マッチが成功であれば、true
   */
  succeeded() {
    return !!this.match;
  }

  /**
   * マッチが失敗であれば、true
   */
  failed() {
    return !this.match;
  }
}

/**
 * ルールの集合
 */
export class Rules {
  /**
   * @param {Iterable<Action>} iter イテレーション可能なオブジェクト
   */
  constructor(iter) {
    this.rules = Array.from(iter);
  }

  /**
   * 新しいルールを加えた新しいRulesを返す
   *
   * @param  {Action}  rule 追加するルール
   * @return {Rules} ruleを加えたRules
   */
  append(rule) {
    return new Rules(this.rules.concat([rule]));
  }

  /**
   * 破壊的にルールを追加する
   *
   * @param  {Action}  rule 追加するルール
   * @return {Rules} ruleを加えたRules
   */
  $append(rule) {
    this.rules.push(rule);
    return this;
  }

  /**
   * 全てのルールを適用する
   *
   * @param {Work}     work 作品情報
   * @param {Bookmark} bookmark 作品情報
   * @return {Bookmark} 処理したBookmark
   */
  process(work, bookmark) {
    return this.rules.reduce(
      (accumulatedBookmark, rule) => rule(work)(accumulatedBookmark),
      bookmark,
    );
  }
}

/**
 * @type {TagMatchAction}
 */
const appendAction = (tag) => (matchResult) => (bookmark) => {
  // bookmark.tags.$append(tag.resolveReference(matchResult));
  // return bookmark;
  const newTags = bookmark.tags.append(tag.resolveReference(matchResult));
  return bookmark.withTags(newTags);
};

/**
 * @type {TagMatchAction}
 */
const removeAction = (tag) => (matchResult) => (bookmark) => {
  // bookmark.tags.$remove(tag.resolveReference(matchResult));
  // return bookmark;
  const newTags = bookmark.tags.remove(tag.resolveReference(matchResult));
  return bookmark.withTags(newTags);
};

/**
 * @type {MatchAction}
 */
const privateAction = () => (bookmark) => bookmark.toPrivate();

/**
 * いずれかのパターンがいずれかのタグに一致する必要がある
 *
 * @type {(patterns: Pattern[]) => ((action: MatchAction) => Action)}
 */
const forSomePatterns = (patterns) => (action) => (work) => (bookmark) => {
  let b = bookmark;
  for (const pattern of patterns) {
    for (const tag of work.tags.toArray()) {
      const matchResult = pattern.match(tag);
      if (matchResult.succeeded()) {
        console.log(bookmark.tags.map.keys());
        b = action(matchResult)(b);
      }
    }
  }

  return b;
};

/**
 * すべてのパターンはいずれかのタグに一致する必要がある
 * @type {(patterns: Pattern[]) => ((action: MatchAction) => Action)}
 */
const forAllPatterns = (patterns) => (action) => (work) => (bookmark) => {
  let matchResult;
  let allMatched = true;

  for (const pattern of patterns) {
    let someMatched = false;

    for (const tag of work.tags.toArray()) {
      const temp = pattern.match(tag);
      if (temp.succeeded()) {
        someMatched = true;
        matchResult = temp;
        break;
      }
    }

    allMatched = allMatched && someMatched;

    if (!allMatched) {
      break;
    }
  }

  return allMatched && matchResult ? action(matchResult)(bookmark) : bookmark;
};

/**
 * ルールのファクトリ
 */
export const Rule = {
  /**
   * @param {Pattern[]} patterns
   * @return {Action}
   */
  privateSome(patterns) {
    return forAllPatterns(patterns)(privateAction);
  },

  /**
   * @param {Tag} tag
   * @param {Pattern[]} patterns
   * @return {Action}
   */
  appendAll(tag, patterns) {
    return forAllPatterns(patterns)(appendAction(tag));
  },

  /**
   * @param {Tag} tag
   * @param {Pattern[]} patterns
   * @return {Action}
   */
  appendSome(tag, patterns) {
    return forSomePatterns(patterns)(appendAction(tag));
  },

  /**
   * @param {Tag} tag
   * @param {Pattern[]} patterns
   * @return {Action}
   */
  removeAll(tag, patterns) {
    return forAllPatterns(patterns)(removeAction(tag));
  },

  /**
   * @param {Tag} tag
   * @param {Pattern[]} patterns
   * @return {Action}
   */
  removeSome(tag, patterns) {
    return forSomePatterns(patterns)(removeAction(tag));
  },
};
