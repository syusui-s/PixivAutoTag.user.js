import { Config } from './config.js';
import views from './view.js';
import { h } from 'hyperapp';
import hyperx from 'hyperx';
const hx = hyperx(h);

/**
 * @typedef {import('./config_store.js').ConfigStore} ConfigStore
 */

/**
 * 設定に関する状態遷移
 */
class ConfigState {
  /**
   * @param {object} override
   */
  constructor(override) {
    Object.assign(this, override);
  }

  toggle() {
    return this;
  }
  change() {
    return this;
  }
  save() {
    return this;
  }
  reset() {
    return this;
  }
  discard() {
    return this;
  }
  keep() {
    return this;
  }
}

ConfigState.Closed = new ConfigState({
  toggle() {
    return ConfigState.NoChange;
  },
});

ConfigState.NoChange = new ConfigState({
  toggle() {
    return ConfigState.Closed;
  },
  change() {
    return ConfigState.Changed;
  },
});

ConfigState.Changed = new ConfigState({
  toggle() {
    return ConfigState.AskClose;
  },
  save() {
    return ConfigState.NoChange;
  },
  reset() {
    return ConfigState.NoChange;
  },
});

ConfigState.AskClose = new ConfigState({
  discard() {
    return ConfigState.NoChange;
  },
  keep() {
    return ConfigState.Changed;
  },
});

/** @typedef {{ configState: ConfigState, ruleRaw: string }} AppState */

/** @type {(configRepository: ConfigStore) => AppState} */
export const state = configRepository => ({
  configState: ConfigState.Closed,
  ruleRaw: (configRepository.load() || Config.default()).ruleRaw,
});

/**
 * @param {() => void} autoTag
 * @param {ConfigStore} configRepository
 */
export const actions = (autoTag, configRepository) => {
  const self = {
    /** @type {() => (state: AppState) => AppState} */
    executeAutoTag: () => state => {
      autoTag();
      return state;
    },

    /** @type {() => (state: AppState) => AppState} */
    configToggle: () => state => {
      const newState = { ...state, configState: state.configState.toggle() };

      if (newState.configState === ConfigState.AskClose) {
        const message = '設定が変更されています。破棄してもよろしいですか？';
        const result = window.confirm(message);

        if (result) {
          return self.configDiscardChange()(newState);
        } else {
          return self.configKeepChange()(newState);
        }
      }

      return newState;
    },

    /**
     * @typedef {{ ruleRaw: string }} ConfigSaveIn
     * @type {(arg0: ConfigSaveIn) => (state: AppState) => AppState}
     */
    configSave: ({ ruleRaw }) => state => {
      const config = Config.create(ruleRaw);

      try {
        configRepository.save(config);
        alert('保存しました');
      } catch (e) {
        alert(`保存に失敗しました: ${e}`);
      }

      return { ...state, ruleRaw, configState: state.configState.save() };
    },

    /**
     * @type {() => (state: AppState) => AppState}
     */
    configUpdate: () => state => ({
      ...state,
      configState: state.configState.change(),
    }),

    /** @type {() => (state: AppState) => AppState} */
    configDiscardChange: () => state => ({
      ...state,
      configState: state.configState.discard(),
    }),

    /** @type {() => (state: AppState) => AppState} */
    configKeepChange: () => state => ({
      ...state,
      configState: state.configState.keep(),
    }),

    /** @type {() => (state: AppState) => AppState} */
    configDownload: () => state => state,
  };

  return self;
};

/**
 * @param {AppState} state
 * @param {typeof actions} actions
 */
export const view = (state, actions) => {
  const open = state.configState !== ConfigState.Closed;
  const h = hx`
    <span>
      ${views.buttons(actions, state)}
      ${open ? views.config(actions, state) : ''}
    </span>
  `;

  return h;
};
