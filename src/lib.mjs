export const shouldBe = (x, cls, arg) => {
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

    Object.freeze(this);

    return new Proxy(this, {
      get(target, name) {
        if (name in target) {
          return target[name];
        }

        throw new TypeError(`No such enum property: ${name}`);
      },
    });
  }

  includes(item) {
    return Object.values(this).includes(item);
  }
}

export class Copyable {
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

    const copied = Object.create(this.constructor.prototype);
    Object.assign(copied, merged);

    return copied;
  }
}
