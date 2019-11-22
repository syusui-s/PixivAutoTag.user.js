import { h } from 'hyperapp';
import hyperx from 'hyperx';

/**
 * @typedef {import('./ui.js').AppState} AppState
 */

const hx = hyperx(h);

/**
 * ボタンを描画する
 *
 * @param {Actions} actions
 */
export function buttons(actions) {
  const configId = 'autotagConfigToggle';
  const autotagId = 'autotagExec';

  const v = hx`
  <span>
    <button class="_button" id="${configId}" style=${{
    marginLeft: '1em',
  }} onclick=${actions.configToggle}>タグ自動化設定</button>
    <button class="_button" id="${autotagId}" style=${{
    marginLeft: '0.25em',
  }} onclick=${actions.executeAutoTag}>上書きタグ付け</button>
  </span>
  `;

  return v;
}

/**
 * 設定画面を描画する
 *
 * @param {Actions} actions
 * @param {{ruleRaw: string}} arg1
 */
export function config(actions, { ruleRaw }) {
  const formId = 'autotagConfigForm';
  const ruleId = 'autotagConfigForm__Rule';
  const saveId = 'autotagConfigForm__Save';

  /** @type {(event: InputEvent) => void} */
  const onsubmit = event => {
    event.preventDefault();
    event.target &&
      actions.configSave({
        ruleRaw: event.target.querySelector(`#${ruleId}`).value,
      });
  };

  /** @type {(event: InputEvent) => void} */
  const download = event => {
    event.preventDefault();
    actions.configDownload();
  };

  const v = hx`
    <form id="${formId}" style=${{
    background: '#fff',
    marginTop: '5px',
    padding: '10px 9px',
    borderRadius: '5px',
  }} onsubmit=${onsubmit}>
    <p>
      <label>タグ付けルール</label>
      <br>
      <textarea id="${ruleId}" cols="80" rows="10" style=${{
    height: 'auto',
  }}>${ruleRaw}</textarea>
    </p>
    <p>
      <input class="_button" type="submit" value="保存" />
      <input class="_button" type="reset" value="リセット" />
      <input class="_button" id="${saveId}" type="button" value="設定のダウンロード" onclick=${download}/>
    </p>
    </form>
  `;

  return v;
}

const view = {
  buttons,
  config,
};

export default view;
