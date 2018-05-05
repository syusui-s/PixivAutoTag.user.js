import { ConfigStore } from './repository.mjs';
import { Bookmark, BookmarkScope, Work, Tag, Tags, Config, } from './domain.mjs';
import { Enum } from './lib.mjs';
import view from './view.mjs';

{

  const ActionType = new Enum(
    'EXECUTE',
    'CONFIG_TOGGLE',
    'CONFIG_SAVE',
    'CONFIG_CHANGED',
    'CONFIG_DISCARD_CHANGE',
    'CONFIG_DOWNLOAD',
  );

  /**
   * モデルに値を提案する関数群を定義する
   *
   * モデルをこの値を受理して新しい状態を生成するか、
   * 拒否して新しい状態を生成しないことを選択する。
   */
  class ActionCreator {
    /**
     * 関数型風に言うと、dispatch -> data -> newState というのを実現したい
     * dispatchを部分適用してdata -> newStateにして、それをviewに渡したい。
     *
     * @param {function} dispatcher 提案値を受け取るコールバック関数。paxos風に言うと、learnerに当たるはず。
     */
    constructor(dispatcher) {
      this.dispatcher = dispatcher;
    }

    executeAutotag(data) {

      const bookmark = Bookmark.fromObject({
        comment: data.bookmark.comment,
        tags: Tags.fromIterable(data.bookmark.tags.map(e => Tag.for(e))),
        scope: BookmarkScope[data.bookmark.scope] || BookmarkScope.Public,
      });

      const work = new Work(
        data.work.title,
        data.work.description,
        data.work.tags,
      );

      this.dispatcher({
        type: ActionType.EXECUTE,
        payload: { bookmark, work, }
      });
    }

    configToggle() {
      this.present({ type: ActionType.CONFIG_TOGGLE });
    }

    configSave({ ruleRaw }) {
      this.present({ type: ActionType.CONFIG_SAVE, payload: { ruleRaw } });
    }

    configUpdate() {
      this.present({ type: ActionType.CONFIG_UPDATE });
    }

    configDownload() {
      this.present({ type: ActionType.CONFIG_DOWNLOAD });
    }

  }

  /**
   * 設定に関する状態遷移
   */
  class ConfigState {
    constructor(overrides) {
      Object.assign(this, overrides);
    }

    toggle()  { return this; }
    change()  { return this; }
    save()    { return this; }
    reset()   { return this; }
    discard() { return this; }
    keep()    { return this; }
  }

  Object.assign(ConfigState, {

    Closed: new ConfigState({
      toggle() { return ConfigState.NoChange; },
    }),

    NoChange: new ConfigState({
      toggle() { return ConfigState.Closed;  },
      change() { return ConfigState.Changed; },
    }),

    Changed: new ConfigState({
      toggle() { return ConfigState.AskClose; },
      save()   { return ConfigState.NoChange; },
      reset()  { return ConfigState.NoChange; },
    }),

    AskClose: new ConfigState({
      discard() { return ConfigState.NoChange; },
      keep()    { return ConfigState.Changed;  },
    }),

  });

  class AutotagService {
    constructor({ configRepository }) {
      Object.assign(this, { configRepository });
    }

    execute(work, tagCloud, bookmark) {
      const rule = this.configRepository.load().rule;

      const commonTags = work.tags.intersect(tagCloud);
    }
  }

  /**
   * アプリケーションの状態と状態の変化を管理する
   * ここでは、自身を破壊的に変更しても良いものとする
   */
  class Store {
    /**
     * アプリケーションの初期状態
     */
    static initialState(configRepository) {
      return new this(
        configRepository,
        null,
        ConfigState.Closed,
      );
    }

    /**
     * @param {ConfigStore} configRepository
     * @param {Bookmark}    bookmark
     * @param {ConfigState} configState
     */
    constructor(configRepository, bookmark, configState) {
      Object.assign(this, {
        configRepository,
        bookmark,
        configState,
      });
    }

    /**
     * 提案された値を受け取り、
     * 受理して新しい状態を生成するか、拒否してnullを返す
     */
    update(action) {
      switch (action.type) {

      case ActionType.EXECUTE:
        {
          const { work, bookmark } = action.payload;

        }
        break;

      case ActionType.CONFIG_TOGGLE:
        this.ConfigState = this.ConfigState.toggle();
        break;

      case ActionType.CONFIG_DISCARD_CHANGE:
        this.ConfigState = this.ConfigState.discard();
        break;

      case ActionType.CONFIG_SAVE:
        this.ConfigState = this.ConfigState.save();
        {
          const { ruleRaw } = action.payload;
          const config = Config.create(ruleRaw);

          this.configRepository.save(config);
        }
        break;

      case ActionType.CONFIG_CHANGED:
        this.ConfigState = this.ConfigState.change();
        break;

      case ActionType.CONFIG_DOWNLOAD:
        window.console.log(`実装されていません: ${action.type}`);
        break;

      default:
        throw new Error(`予期されていないか、網羅されていないアクション種別です: ${action.type}`);
      }

      return this;
    }

  }

  /**
   * 状態遷移に関する処理を行う
   */
  class State {
    /**
     * @param {object} view DI
     */
    constructor(view, actionCreators) {
      this.view = view;
      this.actionCreators = actionCreators;
    }

    bookmarkInitialized(model) {
      return model.bookmark !== undefined;
    }

    render(model) {
    }

  }

  const dispatcher = {
    on(handler) {
      this.handler = handler;
    },

    dispatch(event) {
      this.handler(event);
    }
  };

  const store   = Store.initialState(state => dispatcher.dispatch(state), new ConfigStore());
  const actions = new ActionCreator(action => model.update(action));
  const state   = new State(view, actions);

  dispatcher.on(() => state.render(store));

  state.render(model);

}
