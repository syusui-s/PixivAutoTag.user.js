import { Config } from './config.js';
import views from './view.js';
import { h } from 'hyperapp';
import hyperx from 'hyperx';
const hx = hyperx(h);

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

  toggle()  { return this; }
  change()  { return this; }
  save()    { return this; }
  reset()   { return this; }
  discard() { return this; }
  keep()    { return this; }
}

ConfigState.Closed = new ConfigState({
  toggle() { return ConfigState.NoChange; },
});

ConfigState.NoChange = new ConfigState({
  toggle() { return ConfigState.Closed;  },
  change() { return ConfigState.Changed; },
});

ConfigState.Changed = new ConfigState({
  toggle() { return ConfigState.AskClose; },
  save()   { return ConfigState.NoChange; },
  reset()  { return ConfigState.NoChange; },
});

ConfigState.AskClose = new ConfigState({
  discard() { return ConfigState.NoChange; },
  keep()    { return ConfigState.Changed;  },
});

/** @typedef {{ configState: ConfigState, ruleRaw: string }} AppState */

/** @type {(ConfigStore) => AppState} */
export const state = configRepository => ({
  configState: ConfigState.Closed,
  ruleRaw: (configRepository.load() || Config.default()).ruleRaw,
});

/**
 * @type {(autoTag: () => void, configRepository: ConfigStore) => object}
 */
export const actions = (autoTag, configRepository) => ({
  executeAutoTag: () => state => {
    autoTag();
    return state;
  },

  configToggle: () => state => {
    const newState = { ...state, configState: state.configState.toggle() };

    if (newState.configState === ConfigState.AskClose) {
      const message = '設定が変更されています。破棄してもよろしいですか？';
      const result = window.confirm(message);

      if (result) {
        return actions.configDiscardChange()(newState);
      } else {
        return actions.configKeepChange()(newState);
      }
    }

    return newState;
  },

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

  configUpdate: () => state => (
    { ...state, configState: state.configState.change() }
  ),

  configDownload: () => state => state,
});

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
