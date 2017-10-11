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
 * @param Return Button Setting
 * @desc Use Notetag to set property of Return Button
 * @type note
 * @default "Set Button Position in specified Window.\n<ButtonPosition Window_MenuCommand:108,330>\Set Button Position in specified combination of Window and Scene.\n<ButtonPosition Scene_Item Window_ItemList:108,-24>"
 *
 * @param Next Page Button Setting
 * @desc Use Notetag to set property of Next Page Button
 * @type note
 * @default "Set Button Position in specified Window.\n<ButtonPosition Window_MenuCommand:60,330>\Set Button Position in specified combination of Window and Scene.\n<ButtonPosition Scene_Item Window_ItemList:60,-24>"
 *
 * @param Previous Page Button Setting
 * @desc Use Notetag to set property of Previous Page Button
 * @type note
 * @default "Set Button Position in specified Window.\n<ButtonPosition Window_MenuCommand:12,330>\Set Button Position in specified combination of Window and Scene.\n<ButtonPosition Scene_Item Window_ItemList:12,-24>"
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
 *	<ButtonPosition [window_name]:[x],[y]> : set the button's position for a 
 * specified window. [window_name] refers to windows's name, or
 * [Scene_Name Window_Name] to specifies combination of scene and window.
 * [x] and [y] is the button's position. Windows not refered with this taｇ
 * will have their button automatically placed on right up.
 *
 *  <ButtonFile [window_name]:[filename]> : set the button's image file for a
 * specified window. [window_name] refers to windows's name, or
 * [Scene_Name Window_Name] to specifies combination of scene and window.
 * [filename] is the button's image file in img/system. default is buttonReturn
 * for Return Button, buttonNextPage for Next Page Button, buttonPreviousPage
 * for Previous Page Button.
 *
 *  <HideButton [window_name]> : hide the button on specified window
 * even though it have corresponding functionallity.
 * [window_name] refers to windows's name, or
 * [Scene_Name Window_Name] to specifies combination of scene and window.
 * 
 *

*/
//=============================================================================
/*:ja
 * @plugindesc 戻るボタンを追加します。任意のシーンに任意の位置と画像を指定することもできます
 * @author Kien
 *
 * @param Return Button Setting
 * @text 戻るボタン設定
 * @desc ノートタグを使って戻るボタンの設定を行います。
 * @type note
 * @default "ボタンの位置をウインドウで設定する\n<ButtonPosition Window_MenuCommand:108,330>\nボタンの位置をウインドウとシーンで設定する\n<ButtonPosition Scene_Item Window_ItemList:0,0>"
 *
 * @param Next Page Button Setting
 * @text 次のページボタン設定
 * @desc ノートタグを使って次のページボタンの設定を行います。
 * @type note
 * @default "ボタンの位置をウインドウで設定する\n<ButtonPosition Window_MenuCommand:60,330>\nボタンの位置をウインドウとシーンで設定する\n<ButtonPosition Scene_Item Window_ItemList:0,0>"
 *
 * @param Previous Page Button Setting
 * @text 前のページボタン設定
 * @desc ノートタグを使って前のページボタンの設定を行います。
 * @type note
 * @default "ボタンの位置をウインドウで設定する\n<ButtonPosition Window_MenuCommand:12,330>\nボタンの位置をウインドウとシーンで設定する\n<ButtonPosition Scene_Item Window_ItemList:0,0>"
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
 * @desc オンにすることでシーンの遷移を行ったときにコンソール上に現在のシーンの名前を出力し、アクティブウインドウが変更されたときに
 * そのウインドウの名前を出力します。
 * 
 * @requiredAssets img/system/buttonReturn
 * @requiredAssets img/system/buttonPreviousPage
 * @requiredAssets img/system/buttonNextPage
 * @help
 * * ボタン設定のパラメーターで使うノートタグ：
 * 
 *	<ButtonPosition [window_name]:[x],[y]>:特定ウインドウの対応するボタンの位置を変更します。
 * [window_name]にはウインドウの名前、または「シーン名 ウインドウ名」を入れ、[x]と[y]にはボタンの座標を入れます。
 * このタグが設定されていないウインドウはウインドウの右上にボタンが表示されます。
 *
 *  <ButtonFile [window_name]:[filename]>:特定ウインドウの対応するボタンの画像を変更します。
 * [window_name]にはウインドウの名前、または「シーン名 ウインドウ名」を入れ、
 * [filename]にはボタンとして使用するファイルの名前をいれます。
 *　ファイルはimg/systemに入っているものを使い、デフォルトでは戻るボタンはbuttonReturn、
 * 次のページはbuttonNextPage、前のページはbuttonPreviousPageが使われます。
 *
 *  <HideButton [window_name]>:特定ウインドウの対応するボタンを非表示にします。
 *
*/

Kien.ReturnButton.parameters = PluginManager.parameters("ReturnButton");
Kien.ReturnButton.returnSetting =  {};
Kien.ReturnButton.returnSetting.note = Kien.ReturnButton.parameters["Return Button Setting"];
Kien.ReturnButton.nextPageSetting =  {};
Kien.ReturnButton.nextPageSetting.note = Kien.ReturnButton.parameters["Next Page Button Setting"];
Kien.ReturnButton.previousPageSetting =  {};
Kien.ReturnButton.previousPageSetting.note = Kien.ReturnButton.parameters["Previous Page Button Setting"];
Kien.ReturnButton.debugMode = (Kien.ReturnButton.parameters["Debug Mode"] == "true");

DataManager.extractMetadata(Kien.ReturnButton.returnSetting);
DataManager.extractMetadata(Kien.ReturnButton.nextPageSetting);
DataManager.extractMetadata(Kien.ReturnButton.previousPageSetting);

Kien.ReturnButton.defaultButtonName = {
	"return" : "buttonReturn",
	"nextPage" : "buttonNextPage",
	"previousPage" : "buttonPreviousPage"
}

Kien.ReturnButton.isButtonHided = function(buttonType, windowName, sceneName) {
	var setting = Kien.ReturnButton[buttonType + "Setting"];
	if (sceneName) {
		if (setting.meta["HideButton " + sceneName + " " + windowName]) {
			return true;
		}
	}
	if (setting.meta["HideButton " + windowName]) {
		return true;
	}
	return false;
}

Kien.ReturnButton.getButtonPosition = function(buttonType, windowName, sceneName) {
	var setting = Kien.ReturnButton[buttonType + "Setting"];
	if (sceneName) {
		if (setting.meta["ButtonPosition " + sceneName + " " + windowName] !== undefined) {
			if (setting.meta["ButtonPosition " + sceneName + " " + windowName].match(/(\d+)\,(\d+)/)) {
				return [parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10)];
			}
		}
	}
	if (setting.meta["ButtonPosition " + windowName] !== undefined) {
		if (setting.meta["ButtonPosition " + windowName].match(/(\d+)\,(\d+)/)) {
			return [parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10)];
		}
	}
	return [null,null];
}

Kien.ReturnButton.getButtonFile = function(buttonType, windowName, sceneName) {
	var setting = Kien.ReturnButton[buttonType + "Setting"];
	if (sceneName) {
		if (setting.meta["ButtonFile " + sceneName + " " + windowName] !== undefined) {
			return setting.meta["ButtonFile " + sceneName + " " + windowName];
		}
	}
	if (setting.meta["ButtonFile " + windowName] !== undefined) {
		return setting.meta["ButtonFile " + windowName];
	}
	return Kien.ReturnButton.defaultButtonName[buttonType];
}

Kien.ReturnButton.buttonBitmapListener = function(bitmap) {
 	var h = bitmap.height;
 	var w = bitmap.width;
 	this.setColdFrame(0, 0, w, h/2);
 	this.setHotFrame(0, h/2, w, h/2);
	this.updateFrame();
}

//-----------------------------------------------------------------------------
// Sprite_Button
//
// The sprite for displaying a button.

Sprite_Button.prototype.processTouch = function() {
    if (this.isActive()) {
        if (TouchInput.isTriggered() && this.isButtonTouched()) {
            this._touching = true;
            TouchInput.update();
        }
        if (this._touching) {
            if (TouchInput.isReleased() || !this.isButtonTouched()) {
                this._touching = false;
                if (TouchInput.isReleased()) {
                    this.callClickHandler();
                }
            }
        }
    } else {
        this._touching = false;
    }
};

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
 	if (Kien.ReturnButton.debugMode && Utils.isOptionValid('test')) {
 		console.log(this.constructor.name);
 	}
 	this._returnButton = new Sprite_Button();
 	this._nextPageButton = new Sprite_Button();
	this._previousPageButton = new Sprite_Button();
	this._lastActiveWindow = null;
};

Scene_Base.prototype._getButtonPosition = function(buttonType, win) {
	return Kien.ReturnButton.getButtonPosition(buttonType, win.constructor.name, this.constructor.name);
}

Scene_Base.prototype._getButtonName = function(buttonType, win) {
	return Kien.ReturnButton.getButtonFile(buttonType, win.constructor.name, this.constructor.name);
}

Scene_Base.prototype._isButtonHided = function(buttonType, win) {
	return Kien.ReturnButton.isButtonHided(buttonType, win.constructor.name, this.constructor.name);
}

Kien.ReturnButton.Scene_Base_update = Scene_Base.prototype.update;
Scene_Base.prototype.update = function() {
	Kien.ReturnButton.Scene_Base_update.call(this);
	this.updateButton();
};

Scene_Base.prototype.updateButton = function() {
	var currentActiveWindow = this._getActiveSelectableWindow();
	if (currentActiveWindow != this._lastActiveWindow) {
	 	if (Kien.ReturnButton.debugMode && Utils.isOptionValid('test')) {
	 		if (currentActiveWindow) {
	 			console.log(currentActiveWindow.constructor.name);
	 		}
	 	}
		var buttons = ["return","nextPage","previousPage"];
		var handlerNames = ["cancel","pagedown","pageup"];
		for (var i = 0; i < buttons.length; i++) {
			var buttonType = buttons[i];
			var handlerName = handlerNames[i];
			var button = this["_" + buttonType + "Button"];
			if (currentActiveWindow && currentActiveWindow._handlers) {
				if (currentActiveWindow.isHandled(handlerName) && !this._isButtonHided(buttonType, currentActiveWindow)) {
					var defaultPositionFunc = function(win, index, bitmap) {
						this.x = win.width - bitmap.width * (index+1);
						this.y = 0;
					}
					var bitmapName = this._getButtonName(buttonType, currentActiveWindow);
					var position = this._getButtonPosition(buttonType, currentActiveWindow);
					button.bitmap = ImageManager.loadSystem(bitmapName);
					button.bitmap.addLoadListener(Kien.ReturnButton.buttonBitmapListener.bind(button));
					if (position[0] == null || position[1] == null) {
						button.bitmap.addLoadListener(defaultPositionFunc.bind(button, currentActiveWindow, i));
					} else {
						button.x = position[0];
						button.y = position[1];
					}
					button.setClickHandler(currentActiveWindow._handlers[handlerName]);
					currentActiveWindow.addChild(button);
				}
			} else {
				if (button.parent) {
					button.parent.removeChild(button);
				}
			}
		}
		this._lastActiveWindow = currentActiveWindow;
	}
}

Scene_Base.prototype._getActiveSelectableWindow = function() {
	if (this._windowLayer) {
		var children = this._windowLayer.children;
		for (var i = 0; i < children.length; i++) {
			var win = children[i];
			if (win.active && win._handlers) {
				return win;
			}
		}
	}
	return null;
}