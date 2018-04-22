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

    return Object.freeze(this);
  }

  includes(item) {
    return Object.values(this).includes(item);
  }
}
