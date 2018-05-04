function html(callSites, ...substitutions) {
  const escapedSubstitutions = substitutions.map(value =>
    value.toString().replace(/[&'`"<>]/g, match => ({
      '&': '&amp;',
      '\'': '&#x27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
    }[match]))
  );

  const htmlString = String.raw(callSites, ...escapedSubstitutions);

  const domParser = new DOMParser();
  const doc = domParser.parseFromString(htmlString, 'text/html');

  return doc.body.firstChild;
}

/**
 * ボタンを描画する
 */
export function buttons(actions) {
  const settingsId = 'autotagSettingsToggle';
  const autotagId  = 'autotagExec';

  const h = html`
  <button class="_button" id="${settingsId}" style="margin-left: 1em;">タグ自動化設定</button>
  <button class="_button" id="${autotagId}" style="margin-left: 0.25em;">上書きタグ付け</button>
  `;

  h.getElementById(settingsId).addEventListener('click', () =>
    actions.configToggle()
  );

  h.getElementById(autotagId).addEventListener('click', () =>
    actions.executeAutotag()
  );

  return h;
}

/**
 * 設定画面を描画する
 */
export function settings(actions, { ruleRaw }) {
  const formId = 'autotagSettingsForm';
  const ruleId = 'autotagSettingsForm__Rule';
  const saveId = 'autotagSettingsForm__Save';

  const h = html`
    <form id="${formId}" style="background: #fff; margin-top: 5px; padding: 10px 9px; border-radius: 5px">
    <p>
      <label>タグ付けルール</label>
      <br>
      <textarea id="${ruleId}" cols="80" rows="10" style="height: auto;" />
    </p>
    <p>
      <input class="_button" type="submit" value="保存" />
      <input class="_button" type="reset" value="リセット" />
      <input class="_button" id="${saveId}" type="button" value="設定のダウンロード" />
    </p>
    </form>
  `;

  const rule = h.getElementById(ruleId);

  rule.defaultValue = ruleRaw;

  rule.addEventListener('change', () => {
    actions.configChange();
  });

  h.getElementById(formId).addEventListener('submit', event => {
    event.preventDefault();
    actions.configSave({ ruleRaw: rule.value });
  });

  h.getElementById(formId).addEventListener('click', event => {
    event.preventDefault();
    actions.configDownload();
  });

  return h;
}