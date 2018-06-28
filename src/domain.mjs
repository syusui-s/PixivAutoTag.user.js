import { shouldBe, Enum, Copyable } from './lib.mjs';

/**
 * 作品
 */
export class Work {
  static fromObject({ title, tags }) {
    return new this(title, tags);
  }

  /**
   * @param {string} title       タイトル
   * @param {Tags}   tags        作品タグ
   */
  constructor(title, tags) {
    shouldBe(title,       'string', 'title');
    shouldBe(tags,        Tags,     'tags');

    Object.assign(this, { title, tags });
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
export class Bookmark extends Copyable {
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
    super();
    Object.assign(this, { comment, tags, scope });
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

  isEmpty() {
    return this.comment.length === 0 && this.tags.isEmpty();
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

  notEquals(tag) {
    return ! this.equals(tag);
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

  static fromIterable(tags) {
    return new this(Array.from(tags));
  }

  /**
   * 空のタグ集合を返す
   */
  static empty() {
    return new this([]);
  }

  /**
   * @param {Tag[]} tags
   */
  constructor(tags) {
    tags.every(tag => shouldBe(tag, Tag));

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

  /**
   * 破壊的にタグを追加する
   *
   * @param {Tag} tag
   * @return {Tags} 自身を返す
   */
  $append(tag) {
    shouldBe(tag, Tag, 'tag');

    this.map.set(tag.text, tag);

    return this;
  }

  /**
   * タグを削除した新しいタグの集合を返す
   *
   * @param {Tag} tag
   * @return {Tags} 新しいタグ
   */
  remove(tag) {
    shouldBe(tag, Tag, 'tag');

    return new this.constructor(this.toArray().filter(e => e.notEquals(tag)));
  }

  /**
   * 破壊的にタグを削除する
   *
   * @param {Tag} tag
   * @return {Tags} 自身を返す
   */
  $remove(tag) {
    shouldBe(tag, Tag, 'tag');

    this.map.delete(tag.text, tag);

    return this;
  }

  isEmpty() {
    return this.map.size === 0;
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

class RuleConfigParseResult {
  static error(error) {
    return new this(null, error);
  }

  static success(success) {
    return new this(success, null);
  }

  constructor(success, error) {
    Object.assign(this, { success, error });
  }
}

/**
 * ルールの設定文字列
 */
export class RuleConfigParser {
  /**
   * パースしてRulesを生成する
   *
   * @throws {ConfigSyntaxError} 間違った構文のときに例外を投げる
   * @return {Rules}
   */
  parse(ruleStr) {
    const patternRule     = [];
    const patternAllRule  = [];
    const additionRule    = [];
    const additionAllRule = [];
    const privateRule     = [];
    const errors          = [];

    ruleStr.split('\n').forEach((line, num) => {
      const typeRegex = /^pattern|match|addition_pattern(_all)?$/i;

      const parsed = line.split(/\s+/);

      if (parsed.length >= 3 && parsed[0] && parsed[0].match(typeRegex)) {
        const [ ruleName, params ] = parsed;
        const [ tagName, ...patternStrs ] = params;
        const [ ruleType, all ] = ruleName && ruleName.match(typeRegex) || [];

        const rules = all ? patternAllRule : patternRule;
        const isRemove = tagName[0] === '-';
        const tag = Tag.for(tagName.substr(isRemove ? 1 : 0));
        const patterns = patternStrs && patternStrs.map(tag => Pattern.exact(tag));

        // TODO 激ヤバコードなのでいつか直す
        const AppendSome = 0, AppendAll = 1, RemoveSome = 2, RemoveAll = 3;
        let ruleFactory;
        switch (+isRemove << 1 + !!all) {
        case AppendSome: ruleFactory = Rule.appendSome;
          break;
        case AppendAll:  ruleFactory = Rule.appendAll;
          break;
        case RemoveSome: ruleFactory = Rule.removeSome;
          break;
        case RemoveAll:  ruleFactory = Rule.removeAll;
          break;
        default:
          throw new Error('');
        }

        switch (ruleType) {
        case 'match':
        case 'match_all':
        case 'pattern':
        case 'pattern_all':
          rules.push(ruleFactory(tag, patterns));
          break;
        case 'addition_pattern':
          // throw new Error('not implemented');
          break;
        default:
          throw new Error(`未知のルールです: ${ruleType}`);
        }
      } else if ( parsed.length >= 2 && parsed[0].match(/^private$/i) ) { // 非公開タグ
        const rules = parsed.slice(1).map(tag => Pattern.exact(tag));
        privateRule.push(Rule.privateSome(rules));
      } else if ( line.match(/^\s*$|^\s*#/) ) { // 空行 or コメント行
        // nothing to do
      } else {
        errors.push({
          lineNumber: (num+1),
          message: `不正なコマンドを使用しているか、コマンドへの引数が少なすぎます。内容: ${line}`
        });
        return false;
      }
    });

    if (errors.length !== 0) {
      return RuleConfigParseResult.error(errors);
    }

    return RuleConfigParseResult.success(new Rules(
      privateRule
        .concat(patternRule)
        .concat(patternAllRule)
        .concat(additionRule)
        .concat(additionAllRule)
    ));
  }
}

/**
 * 設定
 */
export class Config {

  static fromJson(json) {
    const obj = JSON.parse(json);
    return obj && this.fromObject(obj);
  }

  static fromObject({ ruleRaw }) {
    return new this(ruleRaw);
  }

  static default() {
    return new this(
      'private R-18'
    );
  }

  static create(ruleRaw) {
    return new this(ruleRaw);
  }

  /**
   * @param {string} ruleRaw ルールの文字列
   */
  constructor(ruleRaw) {
    this.ruleRaw = ruleRaw;
  }

  /**
   * ルールを取得する
   */
  get rule() {
    const parser = new RuleConfigParser();
    return parser.parse(this.ruleRaw).success;
  }

  toJson() {
    return JSON.stringify(this);
  }

  export() {
    // TODO DOMAINの外に移す
    const a = document.createElement('a');
    const date = new Date();

    const blob = new Blob([this.toJson()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    
    a.href = url.toString();
    a.download = `pixiv_auto_tag-${date.getTime()}.txt`;
    a.click();
  }
}

export class AutoTagService {
  constructor(configRepository) {
    Object.assign(this, { configRepository });
  }

  /**
   * @param {Work}     work
   * @param {Tags}     tagCloud  
   * @param {Bookmark} bookmark
   */
  execute(tagCloud, work) {
    const config = this.configRepository.load() || Config.default();

    const rule = config.rule;
    const commonTags = work.tags.intersect(tagCloud);

    const bookmark = Bookmark.empty().withTags(commonTags);

    return rule.process(work, bookmark);
  }
}

