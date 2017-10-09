//=============================================================================
// Return Button
// ReturnButton.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_ReturnButton = true;

var Kien = Kien || {};
Kien.ReturnButton = {};
//=============================================================================
/*:
 * @plugindesc Add a little lovely button for return scene in few scenes.
 * @author Kien
 *
 * @param Button Setting
 * @type note
 * @default "<ButtonPosition Scene_Menu:755,13>\n<ButtonPosition Scene_Item:755,13>\n<ButtonPosition Scene_Skill:755,13>\n<ButtonPosition Scene_Equip:755,13>\n<ButtonPosition Scene_Status:755,13>\n<ButtonPosition Scene_Options:755,13>\n<ButtonPosition Scene_Save:755,13>\n<ButtonPosition Scene_Load:755,13>\n<ButtonPosition Scene_GameEnd:755,13>"
 *
 * @param filesToPreserve
 * @type file[]
 * @require 1
 * @dir img/system
 * @default
 * @desc Select files in this param to prevent these file removed when deploying.
 *
 * @param Debug Mode
 * @type boolean
 * @default false
 * @desc output the current scene name into console.
 *
 * @requiredAssets img/system/buttonReturn
 * @help
 * * Note tags in Button Position parameter:
 *
 *	<ButtonPosition [scene_name]:[x],[y]> : set the button's position for a 
 * specified scene. [scene_name] refers to scene's name,
 * [x] and [y] is the button's position. Scenes not refered with this tag
 * will not have a button.
 *
 *  <ButtonFile [scene_name]:[filename]> : set the button's image file for a
 * specified scene. [scene_name] refers to scene's name,
 * [filename] is the button's image file in img/system. default is buttonReturn.
 *

*/
//=============================================================================
/*:ja
 * @plugindesc 戻るボタンを追加します。任意のシーンに任意の位置と画像を指定することもできます
 * @author Kien
 *
 * @param Button Setting
 * @text ボタン設定
 * @desc ノートタグを使ってボタンの設定を行います。
 * @type note
 * @default "<ButtonPosition Scene_Menu:755,13>\n<ButtonPosition Scene_Item:755,13>\n<ButtonPosition Scene_Skill:755,13>\n<ButtonPosition Scene_Equip:755,13>\n<ButtonPosition Scene_Status:755,13>\n<ButtonPosition Scene_Options:755,13>\n<ButtonPosition Scene_Save:755,13>\n<ButtonPosition Scene_Load:755,13>\n<ButtonPosition Scene_GameEnd:755,13>"
 *
 * @param filesToPreserve
 * @text 使用ファイル
 * @type file[]
 * @require 1
 * @dir img/system
 * @default
 * @desc 使用したファイルを選択することで「未使用ファイルを含まない」オプションによって除外されることを防ぎます。
 *
 * @param Debug Mode
 * @text デバッグモード
 * @type boolean
 * @default false
 * @desc オンにすることでシーンの遷移を行ったときにコンソール上に現在のシーンの名前を出力します。
 * 
 * @requiredAssets img/system/buttonReturn
 * @help
 * * ボタン設定のパラメーターで使うノートタグ：
 * 
 *	<ButtonPosition [scene_name]:[x],[y]>:特定のシーンに戻るボタンを追加します。 
 * [scene_name]にはシーンの名前を入れ,[x]と[y]にはボタンの座標を入れます。
 * このタグが設定されていないシーンではボタンは表示されません。
 *
 *  <ButtonFile [scene_name]:[filename]>:特定のシーンのボタンの画像を変更します。
 * [scene_name]にはシーンの名前を入れ,[filename]にはボタンとして使用するファイルの名前をいれます。
 *　ファイルはimg/systemに入っており、デフォルトではbuttonReturnが使用されます。
 *
*/

Kien.ReturnButton.parameters = PluginManager.parameters("ReturnButton");
Kien.ReturnButton.setting =  {};
Kien.ReturnButton.setting.note = Kien.ReturnButton.parameters["Button Setting"];
Kien.ReturnButton.setting.debugMode = (Kien.ReturnButton.parameters["Debug Mode"] == "true");

DataManager.extractMetadata(Kien.ReturnButton.setting);

Kien.ReturnButton.isSettingHaveScene = function(sceneName) {
	var setting = Kien.ReturnButton.setting;
	if (setting.meta["ButtonPosition " + sceneName] !== undefined) {
		return true;
	}
	return false;
}

Kien.ReturnButton.getButtonPosition = function(sceneName) {
	var setting = Kien.ReturnButton.setting;
	if (setting.meta["ButtonPosition " + sceneName] !== undefined) {
		if (setting.meta["ButtonPosition " + sceneName].match(/(\d+)\,(\d+)/)) {
			return [parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10)];
		}
	}
	return [0,0];
}

Kien.ReturnButton.getButtonFile = function(sceneName) {
	var setting = Kien.ReturnButton.setting;
	if (setting.meta["ButtonFile " + sceneName] !== undefined) {
		return setting.meta["ButtonFile " + sceneName];
	}
	return "buttonReturn";
}


/**
 * The Superclass of all scene within the game.
 * 
 * @class Scene_Base
 * @constructor 
 * @extends Stage
 */
Kien.ReturnButton.Scene_Base_create = Scene_Base.prototype.create;
Scene_Base.prototype.create = function() {
	Kien.ReturnButton.Scene_Base_create.call(this);
	if (Kien.ReturnButton.setting.debugMode && $gameTemp.isPlaytest()) {
		console.log(this.constructor.name);
	}
	if (this._isShowReturnButton()) {
	    var listener = function(bitmap) {
	        var h = bitmap.height;
	        var w = bitmap.width;
	        this.setColdFrame(0, 0, w, h/2);
	        this.setHotFrame(0, h/2, w, h/2);
	        this.updateFrame();
	    }
	    var filename = this._getReturnButtonName();
	    var position = this._getReturnButtonPosition();
		this._returnButton = new Sprite_Button();
		this._returnButton.bitmap = ImageManager.loadSystem(filename);
	    this._returnButton.bitmap.addLoadListener(listener.bind(this._returnButton));
	    this._returnButton.x = position[0];
	    this._returnButton.y = position[1];
        this._returnButton.setClickHandler(this.popScene.bind(this));
	}
};

Scene_Base.prototype._getReturnButtonPosition = function() {
	return Kien.ReturnButton.getButtonPosition(this.constructor.name);
}

Scene_Base.prototype._getReturnButtonName = function() {
	return Kien.ReturnButton.getButtonFile(this.constructor.name);
}

Scene_Base.prototype._isShowReturnButton = function() {
	return Kien.ReturnButton.isSettingHaveScene(this.constructor.name);
}

Kien.ReturnButton.Scene_Base_start = Scene_Base.prototype.start;
Scene_Base.prototype.start = function() {
	Kien.ReturnButton.Scene_Base_start.call(this);
	if (this._isShowReturnButton()) {
		this.addChild(this._returnButton);
	}
};

