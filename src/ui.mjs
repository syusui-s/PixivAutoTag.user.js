import { Config } from './domain.mjs';
import views from './view.mjs';
import hyperx from 'hyperx';
import { h } from 'hyperapp';
const hx = hyperx(h);

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


export const state = configRepository => ({
  configState: ConfigState.Closed,
  ruleRaw: (configRepository.load() || Config.default()).ruleRaw,
});

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
    configRepository.save(config);

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
