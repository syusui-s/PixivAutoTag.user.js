/**
 * Symbolを用いたEnumオブジェクトを生成する
 */
export class Enum {
  constructor(set) {
    for (const entry of set) {
      const entryStr = entry.toString();
      this[entryStr] = Symbol(entryStr);
    }

    return Object.freeze(this);
  }

  includes(item) {
    return Object.values(this).includes(item);
  }
}

/**
 * 作品を表現する
 */
export class Work {
  /**
   * @param {string} title       タイトル
   * @param {string} description 説明文
   * @param {Tags}   tags        作品タグ
   */
  constructor(title, description, tags) {
    Object.assign(this, { title, description, tags });
    Object.freeze(this);
  }
}

/**
 * ブックマークの公開範囲
 */
export const BookmarkScope = new Enum([ 'Public', 'Private' ]);

/**
 * ブックマーク
 */
export class Bookmark {
  /**
   * @param {string} comment ブックマークコメント
   * @param {Tags}   tags    タグ
   * @param {symbol} scope   公開／非公開
   */
  constructor(comment, tags, scope) {
    Object.assign(this, { comment, tags, scope });
  }

  /**
   * オブジェクトをコピーする
   *
   * 引数にオブジェクトが渡されたら、
   * そのオブジェクトの持つプロパティでコンストラクタへの引数が上書きされる。
   *
   * Scalaのcase classに生えるcopyメソッドを参考にしている。
   */
  copy(obj) {
    const merged = {};
    Object.assign(newObj, this);
    Object.assign(newObj, obj || {});

    const { comment, tags, scope } = merged;
    return new this.constructor(comment, tags, scope);
  }
}

/**
 * タグ
 */
export class Tag {
  static for(text) {
    return new this(text);
  }

  constructor(text) {
    this.text = text;
    Object.freeze(this);
  }

  equals(tag) {
    return tag instanceof this.constructor && tag.text === this.text;
  }
}

/**
 * タグの集合
 */
export class Tags {
  /**
   * @param {Tag[]} tags
   */
  constructor(tags) {
    this.map = new Map( tags.map(tag => [ tag.text, tag ]) );
  }

  /**
   * 引数のタグを持っている時にtrueを返す
   */
  has(tag) {
    return tag instanceof Tag &&
      this.map.has(tag.text);
  }

  equals(other) {
    return other.map.size === this.map.size &&
      other.toArray().every(tag => this.has(tag));
  }

  /**
   * @return {Tag[]}
   */
  toArray() {
    return Array.from(this.map.values());
  }

  matchAll(pattern) {
    const matches = this.toArray.every(pattern.match);
    return new this.constructor(matches);
  }

  matchSome(pattern) {
    const matches = this.toArray.any(pattern.match);
    return new this.constructor(matches);
  }

  union(other) {
    const thisArray = this.toArray();
    const otherArray = other.toArray();

    return new this.constructor( thisArray.concat(otherArray) );
  }

  diff(other) {
    const tags = this.toArray().filter(key => ! other.has(key));
    return new this.constructor(tags);
  }

  intersect(other) {
    const tags = this.toArray().filter(key => other.has(key));
    return new this.constructor(tags);
  }
}

/**
 * タグに一致するパターン
 */
export class Pattern {
  static string(str) {
    const regex = new RegExp('^' + str.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&') + '$');
    return new this(regex);
  }

  static regexp(regex) {
    return new this(new RegExp(regex));
  }

  constructor(regex) {
    this.regex = regex;
  }

  match(tag) {
    return this.regex.test(tag.text);
  }
}

/**
 * ルールの集合
 */
export class Rules {
  add(rule) {
  }
}

/**
 * ルールのベースとなるクラス
 */
class RuleBase {
  constructor(pattern) {
    Object.assign(this, { pattern });
  }

  // workTags -> bookmark -> bookmark
  process(workTags, bookmark) { throw Error("NotImplemented"); }

  // Tags -> Tags
  matches(tags) { throw Error("NotImplemented"); }
}

const RuleAppendTag = Base => class extends Base {
  process(workTags, bookmark) {
    const tags = bookmark.tags.union( this.matches(workTags) );
    bookmark.copy({ tags });
  }
};

const RuleRemoveTag = Base => class extends Base {
  process(workTags, bookmark) {
    const tags = bookmark.tags.diff( this.matches(workTags) );
    bookmark.copy({ tags });
  }
};

const RuleAll = Base => class extends Base {
  matches(tags) { return tags.matchAll(this.pattern); }
};

const RuleSome = Base => class extends Base {
  matches(tags) { return tags.matchSome(this.pattern); }
};

