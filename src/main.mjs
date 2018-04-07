const shouldBe = (x, cls, arg) => {
  switch (typeof cls) {
  case 'function':
    if (!( x instanceof cls))
      throw TypeError(`argument ${`${arg} ` || ''}should be an instance of ${cls.name}, but ${x} was given`);
    break;
  case 'string':
    if (typeof x !== cls)
      throw TypeError(`argument ${`${arg} ` || ''}should be a/an ${cls}, but ${x} was given`);
    break;
  default:
    throw TypeError(`${cls.name} is not valid argument for shouldBe`);
  }
};

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
 * 作品
 */
export class Work {
  static fromObject({ title, description, tags }) {
    return new this(title, description, tags);
  }

  /**
   * @param {string} title       タイトル
   * @param {string} description 説明文
   * @param {Tags}   tags        作品タグ
   */
  constructor(title, description, tags) {
    shouldBe(title,       'string', 'title');
    shouldBe(description, 'string', 'description');
    shouldBe(tags,        Tags,     'tags');

    Object.assign(this, { title, description, tags });
    Object.freeze(this);
  }
}

/**
 * ブックマークの公開範囲
 *
 * Public: 公開
 * Private: 非公開
 */
export const BookmarkScope = new Enum([ 'Public', 'Private' ]);

/**
 * ブックマーク
 */
export class Bookmark {
  static fromObject({ comment, tags, scope }) {
    return new this(comment, tags, scope);
  }


  /**
   * 空のブックマークを返す
   */
  static empty() {
    return new this('', Tags.empty(), BookmarkScope.Public);
  }

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
    Object.assign(merged, this);
    Object.assign(merged, obj || {});

    const { comment, tags, scope } = merged;
    return new this.constructor(comment, tags, scope);
  }

  withComment(comment) {
    shouldBe(comment, 'string', 'comment');

    return this.copy({ comment });
  }

  withTags(tags) {
    shouldBe(tags, Tags, 'tags');

    return this.copy({ tags });
  }

  toPrivate() {
    return this.copy({ scope: BookmarkScope.Private });
  }

  toPublic() {
    return this.copy({ scope: BookmarkScope.Public });
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

  toString() {
    return this.text;
  }
}

/**
 * ブックマークに追加されるタグ
 *
 * マッチ結果のグループへの参照を表記できる。
 */
export class TagRef extends Tag {
  /**
   * 参照をマッチの結果で置き換える
   */
  resolveReference(match) {
    const text = this.text.replace(/~(\d)/g, (_, idx) => match.at(+idx) || '');

    return Tag.for(text);
  }
}

/**
 * タグの集合
 */
export class Tags {
  /**
   *
   */
  static fromArgs(...args) {
    return new this(args);
  }

  static empty() {
    return new this([]);
  }

  /**
   * @param {Tag[]} tags
   */
  constructor(tags) {
    this.map = new Map( tags.map(tag => [ tag.text, tag ]) );
  }

  /**
   * 引数のタグを自身が持っている時にtrueを返す
   */
  has(tag) {
    return tag instanceof Tag &&
      this.map.has(tag.text);
  }

  /**
   * 引数のタグの集合と自身が一致するならば、trueを返す
   */
  equals(other) {
    return other.map.size === this.map.size &&
      other.toArray().every(tag => this.has(tag));
  }

  /**
   * 保持しているタグの配列を返す
   *
   * @return {Tag[]}
   */
  toArray() {
    return Object.freeze(Array.from(this.map.values()));
  }

  /**
   * 引数と自身の和集合を返す
   */
  union(other) {
    const thisArray = this.toArray();
    const otherArray = other.toArray();

    return new this.constructor( thisArray.concat(otherArray) );
  }

  /**
   * 自身から引数を引いた差集合を返す
   */
  diff(other) {
    const tags = this.toArray().filter(key => ! other.has(key));
    return new this.constructor(tags);
  }

  /**
   * 自身と引数の交差集合を返す
   */
  intersect(other) {
    const tags = this.toArray().filter(key => other.has(key));
    return new this.constructor(tags);
  }

  /**
   * タグを追加した新しいタグの集合を返す
   *
   * @param {Tag} tag
   * @return {Tags} 新しいタグ
   */
  append(tag) {
    shouldBe(tag, Tag, 'tag');

    return new this.constructor(this.toArray().concat([tag]));
  }

  $append(tag) {
    shouldBe(tag, Tag, 'tag');

    this.map.set(tag.text, tag);

    return this;
  }
}

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

  succeeded() {
    return !! this.match;
  }

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

  $append(rule) {
    this.rules.push(rule);
  }

  /**
   *
   */
  process(work, bookmark) {
    return this.array.reduce(rule => rule.process(work, bookmark), bookmark);
  }
}

class ConfigSyntaxError extends Error {
  constructor() {
    super();
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
  process(work, bookmark) { throw Error('NotImplemented'); }

  /**
   * タグの集合を受けとって、マッチ結果を返す
   *
   * @param {Tags} tags
   * @return {Match} 
   */
  matches(tags) { throw Error('NotImplemented'); }
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
   * @param {Work}  work  ルールの適用対象と成る作品
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

    const tag = this.appendTag.resolveReference(match);

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
 *
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

/**
 * ルールの設定文字列
 */
class RuleConfigParser {
  /**
   * パースしてRulesを生成する
   *
   * @throws {ConfigSyntaxError} 間違った構文のときに例外を投げる
   * @return {Rules}
   */
  parse(str) {
    // TODO 綺麗にしたい
    const patternRule     = [];
    const patternAllRule  = [];
    const additionRule    = [];
    const additionAllRule = [];
    const privateRule     = [];
    const errors          = [];

    // 正規表現を表す文字列のリストから、正規表現のリストを作成
    function createRegExpFromStrAry(regexpStrAry, lineNumber) {
      const regexps = [];
      regexpStrAry.forEach(regexpStr => {
        try { regexps.push(new RegExp(regexpStr)); }
        catch (e) {
          errors.push({
            lineNumber,
            message: `正規表現のエラーです（${e.name}:${e.message}）。内容: ${regexpStr}`
          });
        }
      });
      return regexps;
    }

    // strに完全一致する正規表現を生成
    function createRegExpPerfectMatch(str) {
      return new RegExp(`^${str.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&')}$`);
    }

    // タグ、正規表現リスト、追加先を受け取り、追加する
    function addRule(tag, regexps, rules) {
      const rule = { tag, regexps };
      rules.push(rule);
    }

    ruleStr.split('\n').forEach((line, num) => {
      const parsed = line.split(/\s+/);
      let matchData;

      const matchPattern = /^(pattern|match|addition_pattern)(|_all)$/i;

      if ( parsed.length >= 3 && (matchData = parsed[0].match(matchPattern)) ) {
        const tag = parsed[1];
        const type = matchData[1];
        const isSome = matchData[2].length === 0;
        let regexps;

        if ( type === 'match' ) {  // 一致
          const rules = isSome ? patternRule : patternAllRule;
          const match_tags = parsed.slice(2);
          regexps = match_tags.map(createRegExpPerfectMatch);

          addRule(tag, regexps, rules);
        } else if ( type === 'pattern' ) { // 正規表現
          const rules = isSome ? patternRule : patternAllRule;
          const str_regexps = parsed.slice(2);
          regexps = createRegExpFromStrAry(str_regexps, num + 1);

          addRule(tag, regexps, rules);
        } else if ( type === 'addition_pattern' ) { // 追加タグ
          const rules = isSome ? additionRule : additionAllRule;
          const str_regexps = parsed.slice(2);
          regexps = createRegExpFromStrAry(str_regexps, num + 1);

          addRule(tag, regexps, rules);
        } else {
          errors.push({
            lineNumber: (num+1),
            message: `予期しないエラーが発生しました。作者にお知らせください。内容: ${line}`
          });
          return;
        }
      } else if ( parsed.length >= 2 && parsed[0].match(/^private$/i) ) { // 非公開タグ
        const rules = parsed.slice(1);
        privateRule.push(...rules);
      } else if ( line.match(/^\s*$|^\s*#/) ) { // 空行 or コメント行
        // nothing to do
      } else {
        errors.push({
          lineNumber: (num+1),
          message: `不正なコマンドを使用しているか、引数が少なすぎます。内容: ${line}`
        });
        return false;
      }
    });

    return {
      privateRule,
      patternRule,
      patternAllRule,
      additionRule,
      additionAllRule,
      errors,
    };
  }
}

/**
 *
 */
class RuleConfigStore {
  save(ruleConfig) {
  }

  get() {
  }
}
