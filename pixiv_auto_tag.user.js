// ==UserScript==
// @name              Pixiv自動ブックマークタグ付け
// @description       Pixivのブックマークタグ付けを半自動化してくれる
// @include           http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=*
// @run-at            document-end
// @version           0.2.0
// ==/UserScript==

// デフォルトルール
var defaultRuleStr = 'private R-18';

// 設定テキストを解析し、連想配列で返す
var parseRules = function(ruleStr) {
	var patternRule   = [];
	var privateRule = [];
	var errors      = [];

	ruleStr.split('\n').forEach(function(line, i){
		var parsed = line.split(/\s+/);
		if        (parsed.length >= 2 && parsed[0].match(/^private$/i)) { // 非公開タグ
			privateRule.push.apply(privateRule, parsed.slice(1));
		} else if (parsed.length >= 3 && parsed[0].match(/^match$/i))   { // 一致
			patternRule.push({
				tag: parsed[1],
				regexps: parsed.slice(2).map(function(tag){
					return new RegExp('^' + tag.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&') + '$');
				})
			});
		} else if (parsed.length >= 3 && parsed[0].match(/^pattern$/i)) { // 正規表現
			patternRule.push({
				tag: parsed[1],
				regexps: parsed.slice(2).map(function(regexStr){
					var regexp;
					try { regexp = new RegExp(regexStr); }
					catch (e) {
						errors.push({ lineNumber: (i+1), message: ('RegularExpression Error:' + e.name + ':' + e.massage + ',Str:' + regexStr) });
						return null;
					}
					return regexp;
				}).filter(function(e){ return e; })
			});
		} else if (line.match(/^\s*$|^\s*#/)) {                           // 空行 or コメント行
			return;
		} else { errors.push({lineNumber: (i+1), message: 'CommandError:Invalid Command or Too Few Arguments'}); }
	});
	return { privateRule: privateRule, patternRule: patternRule, errors: errors };
};

// matchDataの配列を渡すと文中の~数字をそれで置き換える
var replaceWithMatch = function(input, matchData) {
	return input.split(/(~\d)/).map(function(str){
		var match = str.match(/^~(\d)/);
		if(match) { return matchData[parseInt(match[1])] || ''; }
		return str;
	}).join('');
};

// 設定画面の生成・消去
var toggleSettingsView = function() {
	// すでに存在していたなら消去
	var settingsView = document.querySelector('#autotag-settings-view');
	if (settingsView) { settingsView.remove(); return; }

	// 保存済みデータの取得
	var ruleStr = window.localStorage.pixivAutoTag_taggingRule || defaultRuleStr;

	// フォームの作成
	settingsView = document.createElement('form');
	settingsView.id = 'autotag-settings-view';
	settingsView.style.backgroundColor = '#FFFFFF';
	settingsView.style.marginTop    = '5px';
	settingsView.style.padding      = '10px 9px';
	settingsView.style.borderRadius = '5px';

	var templateStr  = '<p><label>タグ付けルール<br><textarea id="autotag-settings-tagging-rule" cols="80" rows="10" style="height:auto;">{{:rule}}</textarea></label></p>';
	settingsView.innerHTML = templateStr.replace('{{:rule}}', ruleStr);

	var buttonsParagraph = document.createElement('p');

	var saveButton = document.createElement('input');
	saveButton.type = 'submit';
	saveButton.className = '_button';
	saveButton.value = '保存';
	settingsView.onsubmit = function() {
		var ruleStr = document.querySelector('#autotag-settings-tagging-rule').value;
		var rule = parseRules(ruleStr);
		if (rule.errors.length === 0) {
			window.localStorage.pixivAutoTag_taggingRule = ruleStr;
			alert('保存しました');
		} else {
			alert(rule.errors.map(function(err){ return '[Error] line: ' + err.lineNumber + ', message: ' + err.message; }).join('\n'));
		}
		return false;
	};
	buttonsParagraph.appendChild(saveButton);

	var cancelButton = document.createElement('input');
	cancelButton.className = '_button';
	cancelButton.type = 'reset';
	cancelButton.value = 'キャンセル';
	// cancelButton.onclick = function() { document.querySelector('#autotag-settings-view').remove(); };
	buttonsParagraph.appendChild(cancelButton);

	settingsView.appendChild(buttonsParagraph);

	var settingsButton = document.querySelector('#autotag-settings-button');
	settingsButton.parentElement.insertBefore(settingsView, settingsButton.nextSibling);
};

// タグの自動追加関数
var autoTag = function() {
	var ruleText = window.localStorage.pixivAutoTag_taggingRule || defaultRuleStr;
	var rule = parseRules(ruleText);

	// 作品タグとタグクラウドの取得
	var tagCloud = Array.prototype.slice.call(document.querySelectorAll('#wrapper > div.layout-body > div > section.list-container.tag-container.tag-cloud-container > ul.list-items.tag-cloud > li')).map(function(item){ return item.textContent; });
	var tagsExist = Array.prototype.concat.apply([], Array.prototype.slice.call(document.querySelectorAll('#wrapper > div.layout-body > div > section.list-container.tag-container.work-tags-container > div > ul > li')).map(function(item){ return item.textContent.replace(/^\*/, '').split('/'); }));

	// 非公開タグが含まれていた場合、自動で非公開に設定
	if (tagsExist.some(function(tag){ return rule.privateRule.indexOf(tag) !== -1; })) {
		document.querySelector('#wrapper > div.layout-body > section > form > div.submit-container > ul > li:nth-child(2) > label').click();
	}

	// ブックマークタグリストの生成
	var input = document.querySelector('#input_tag');
	if (input.value.length === 0) {
		// なぜ遅いのにタグクラウドの方をイテレーションしているかというと、タグをつけた回数が多い順に並ぶようにするため
		var tagsFound = tagsExist.filter(function(existTag){ return tagCloud.some(function(cloudTag){ return existTag === cloudTag; }); });

		// 付与タグリストの生成
		var tagsAdded = [];
		tagsExist.forEach(function(foundTag){
			rule.patternRule.forEach(function(patternRule){
				var matchData = [];
				var foundMatchFlag = patternRule.regexps.some(function(pattern){
					matchData = foundTag.match(pattern);
					return matchData;
				});
				if (foundMatchFlag) {
					tagsAdded.push(replaceWithMatch(patternRule.tag, matchData));
				}
			});
		});

		// タグを消去する
		var tagsFound = tagsFound.filter(function(foundTag){ return tagsAdded.indexOf('-'+foundTag) === -1; });
		var tagsAdded = tagsAdded.filter(function(tag){ return !tag.match(/^-/); });

		input.value = tagsFound.concat(tagsAdded).filter(function(elem, i, ary) { return ary.indexOf(elem) === i; }).join(' ');

		// タグのハイライトを表示させる
		var keyupEvent = document.createEvent('HTMLEvents');
		keyupEvent.initEvent('keyup', true, true);
		input.dispatchEvent(keyupEvent);
	}
};

window.setTimeout(autoTag, 750);

(function(){
	// 設定ボタンの生成
	var settingsButton = document.createElement('button');
	settingsButton.className = '_button';
	settingsButton.style.marginLeft = '1em';
	settingsButton.id = 'autotag-settings-button';
	settingsButton.textContent = 'タグ自動化設定';
	settingsButton.onclick = toggleSettingsView;

	var target = document.querySelector('#wrapper > div.layout-body > div > section.list-container.tag-container.work-tags-container > div > h1');
	target.parentElement.insertBefore(settingsButton, target.nextSibling);
})();
