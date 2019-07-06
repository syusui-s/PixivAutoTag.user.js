import { shouldBe, Enum, Copyable } from './lib.mjs';

/**
 * タグに一致するパターン
 */
export class Pattern {
  /**
   * 引数の文字列に完全一致するパターンを生成する
   */
  static exact(str) {
    const regex = new RegExp(`^${str.replace(/[.*+?^${}()|[\]\\]/g, sym => `\\${sym}`)}$`);
    return new this(regex);
  }

  /**
   * 引数の正規表現に完全一致するパターンを生成する
   */
  static regexp(regex) {
    return new this(new RegExp(regex));
  }

  constructor(regex) {
    this.regex = regex;
    Object.freeze(this);
  }

  /**
   * 引数のタグが自身のパターンに一致するかどうかを返す
   */
  match(tag) {
    const match = tag.toString().match(this.regex);
    return new Match(match);
  }

  /**
   * 自身のパターンに引数のタグの集合のいずれかが一致するかどうかを返す
   */
  matchSome(tags) {
    for (const tag of tags.toArray()) {
      const match = this.match(tag);

      if (match)
        return match;
    }

    return null;
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
   * @param {array} match マッチオブジェクト
   */
  constructor(match) {
    this.match = match;
  }

  /**
   * マッチ結果のidx番目のグループのマッチ文字列を返す
   */
  at(idx) {
    return this.match[idx];
  }

  /**
   * マッチが成功であれば、true
   */
  succeeded() {
    return !! this.match;
  }

  /**
   * マッチが失敗であれば、true
   */
  failed() {
    return ! this.match;
  }
}

/**
 * ルールの集合
 */
export class Rules {
  /**
   * @param {iterable} iter イテレーション可能なオブジェクト
   */
  constructor(iter) {
    this.rules = Array.from(iter);
  }

  /**
   * 新しいルールを加えた新しいRulesを返す
   *
   * @param  {Rule}  rule 追加するルール
   * @return {Rules} ruleを加えたRules
   */
  append(rule) {
    shouldBe(rule, RuleBase, 'rule');
    return new this.constructor(this.rules.concat([rule]));
  }

  /**
   * 破壊的にルールを追加する
   */
  $append(rule) {
    this.rules.push(rule);
  }

  /**
   * 全てのルールを適用する
   *
   * @param {Work} 作品情報
   * @return {Bookmark} 処理したBookmark
   */
  process(work, bookmark) {
    return this.rules.reduce((bookmark, rule) => rule.process(work, bookmark), bookmark);
  }
}

/**
 * ルールのベースとなるクラス
 */
class RuleBase {
  /**
   * @param {Pattern[]} patterns パターンの配列
   */
  constructor(patterns) {
    shouldBe(patterns, Array, 'patterns');
    this.patterns = patterns;
  }

  /**
   * 作品とブックマークを受けとって、Bookmarkを返す
   * work -> bookmark
   *
   * @param {Work}  work  ルールの適用対象と成る作品
   * @return {Bookmark} ルールを元に生成されたブックマーク
   */
  // process(work, bookmark) { throw Error('NotImplemented'); }

  /**
   * タグの集合を受けとって、マッチ結果を返す
   *
   * @param {Tags} tags
   * @return {Match} 
   */
  //matches(tags) { throw Error('NotImplemented'); }
}

const RuleAppendTag = Base => class extends Base {
  /**
   * @param {Tag} appendTag 追加するタグ
   * @param {Pattern[]} patterns パターンの配列
   */
  constructor(appendTag, patterns) {
    super(patterns);

    this.appendTag = appendTag;
  }

  /**
   * 作品とブックマークを受けとって、ルールを適用したブックマークを返す
   * work -> bookmark
   *
   * @param {Work}     work     ルールの適用対象と成る作品
   * @param {Bookmark} bookmark
   * @return {Bookmark} ルールを元に生成されたブックマーク
   */
  process(work, bookmark) {
    const match = this.matches(work.tags);

    if (match.failed())
      return bookmark;

    const tag = this.appendTag.resolveReference(match);

    return bookmark.withTags(bookmark.tags.append(tag));
  }
};

const RuleRemoveTag = Base => class extends Base {
  /**
   * @param {Tag} appendTag 追加するタグ
   * @param {Pattern[]} patterns パターンの配列
   */
  constructor(removeTag, patterns) {
    super(patterns);

    this.removeTag = removeTag;
  }

  /**
   * マッチした場合にタグを除去する
   */
  process(work, bookmark) {
    const match = this.matches(work.tags);

    if (match.failed())
      return bookmark;

    const tag = this.removeTag.resolveReference(match);

    return bookmark.withTags(bookmark.tags.remove(tag));
  }
};

const RulePrivateTag = Base => class extends Base {
  /**
   * マッチした場合にブックマークを非公開にする
   */
  process(work, bookmark) {
    return this.matches(work.tags).succeeded() ? bookmark.toPrivate() : bookmark;
  }
};

const RuleAll = Base => class extends Base {
  /**
   * 「全て」のパターンが引数のタグ集合のいずれかにマッチするならMatchを返す
   */
  matches(tags) {
    const matchResults = this.patterns.map(pat => pat.matchSome(tags));

    return matchResults.all(m => m.succeeded()) ?  matchResults[0] : Match.failed();
  }
};

const RuleSome = Base => class extends Base {
  /**
   * 「いずれか」のパターンが引数のタグ集合のいずれかにマッチするならMatchを返す
   */
  matches(tags) {
    for (const pat of this.patterns) {
      const match = pat.matchSome(tags);

      if (match.succeeded())
        return match;
    }

    return Match.failed();
  }
};

const RulePrivateSome = RulePrivateTag(RuleSome(RuleBase));
const RuleRemoveAll   = RuleRemoveTag(RuleAll(RuleBase));
const RuleRemoveSome  = RuleRemoveTag(RuleSome(RuleBase));
const RuleAppendAll   = RuleAppendTag(RuleAll(RuleBase));
const RuleAppendSome  = RuleAppendTag(RuleSome(RuleBase));

/**
 * ルールのファクトリ
 */
export const Rule = {

  privateSome(...args) {
    return new RulePrivateSome(...args);
  },

  appendAll(...args) {
    return new RuleAppendAll(...args);
  },

  appendSome(...args) {
    return new RuleAppendSome(...args);
  },

  removeAll(...args) {
    return new RuleRemoveAll(...args);
  },

  removeSome(...args) {
    return new RuleRemoveSome(...args);
  },

};
