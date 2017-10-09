//=============================================================================
// Import Export Savedata
// ImportExportSaveFile.js
// Version: 1.02
//=============================================================================
var Imported = Imported || {};
Imported.Kien_IESaveData = true;

var Kien = Kien || {};
Kien.IESaveData = {};
//=============================================================================
/*:
 * @plugindesc Add ability to export/import savedata as String.
 * @author Kien
 *
   @help
   * Resources:
     Require following images presenting in img/system:
      'buttonOk' : shown in the imported/exported data screen to allow user confirm.
      'buttonCancel' : shown in the imported data screen to allow user cancel his action.
      'buttonImport' : shown in the save/load screen to allow user start imporing.
      'buttonExport' : shown in the save/load screen to allow user start exporting.
     The image is using same format as default 'ButtonSet' image (top default bottom touching), 
     except all buttons are in separate files.

     changelog:
     1.02: support plugin parameter typing.
     1.01: fix the export/import button keep showing when Button Type is 1.
     1.00: first release.

   @param Text Area X
   @type number
   @desc X coordinate of Text area.
   @default 208

   @param Text Area Y
   @type number
   @desc Y coordinate of Text area.
   @default 100

   @param Text Area Width
   @type number
   @desc Width of Text area.
   @default 400

   @param Text Area Height
   @type number
   @desc Height of Text area.
   @default 400
   
   @param OK Button X
   @type number
   @desc X coordinate of ok button when text area is shown
   @default 308

   @param OK Button Y
   @type number
   @desc Y coordinate of ok button when text area is shown
   @default 520

   @param Cancel Button X
   @type number
   @desc X coordinate of ok button when text area is shown
   @default 508

   @param Cancel Button Y
   @type number
   @desc Y coordinate of ok button when text area is shown
   @default 520

   @param Menu Button Type
   @type number
   @desc Type of Button.
   1 = Show button on File automatically, 2 = Show button at a customizable position.
   @default 1

   @param Import Button X
   @type number
   @desc X coordinate of button when Button type is set to 2
   @default 680

   @param Import Button Y
   @type number
   @desc Y coordinate of button when button type is set to 2
   @default 16

   @param Export Button X
   @type number
   @desc X coordinate of button when Button type is set to 2
   @default 750

   @param Export Button Y
   @type number
   @desc Y coordinate of button when button type is set to 2
   @default 16
   
   @param Export Help Text
   @type string
   @desc Text shown in help window when export button is clicked.
   @default Copy all text to backup.

   @param Import Help Text
   @type string
   @desc Text shown in help window when import button is clicked.
   @default paste your backup to import.


 * @requiredAssets img/system/buttonCancel
 * @requiredAssets img/system/buttonExport
 * @requiredAssets img/system/buttonImport
 * @requiredAssets img/system/buttonOk
   
*/

//=============================================================================
/*:ja
 * @plugindesc セーブデータのインポート・エクスポート機能をセーブ・ロード画面に追加します。
 * @author Kien
 *
   @help
   　このプラグインが動作するには以下の画像ファイルがimg/system内に存在する必要があります：
      'buttonOk' : インポート・エクスポート画面においてユーザーのアクションを決定するボタンとして表示されます。
      'buttonCancel' : インポート画面においてインポートを行わずにセーブ・ロード画面に戻るボタンとして表示されます。
      'buttonImport' : セーブ・ロード画面においてインポート画面に移行するためのボタンとして表示されます。
      'buttonExport' : セーブ・ロード画面においてエクスポート画面に移行するためのボタンとして表示されます。
    画像はデフォルト素材の'ButtonSet'と同様、上半分にデフォルト状態、下半分に押された状態の画像として作成してください。

    更新履歴：
    1.02: プラグインパラメーターの型設定に対応
    1.01: Button Typeが１の時、インポート・エクスポートボタンが表示されるべきでない状態で表示される問題を修正。
    1.00: 初出

   @param Text Area X
   @type number
   @desc インポート・エクスポートされたセーブデータの内容を表示するエリアの X 座標です。
   @default 208

   @param Text Area Y
   @type number
   @desc インポート・エクスポートされたセーブデータの内容を表示するエリアの Y 座標です。
   @default 100

   @param Text Area Width
   @type number
   @desc インポート・エクスポートされたセーブデータの内容を表示するエリアの横幅です。
   @default 400

   @param Text Area Height
   @type number
   @desc インポート・エクスポートされたセーブデータの内容を表示するエリアの縦幅です。
   @default 400
   
   @param OK Button X
   @type number
   @desc インポート・エクスポート画面で表示するOKボタンの X 座標です。
   @default 308

   @param OK Button Y
   @type number
   @desc インポート・エクスポート画面で表示するOKボタンの Y 座標です。
   @default 520

   @param Cancel Button X
   @type number
   @desc インポート・エクスポート画面で表示するキャンセルボタンの X 座標です。
   @default 508

   @param Cancel Button Y
   @type number
   @desc インポート・エクスポート画面で表示するキャンセルボタンの Y 座標です。
   @default 520

   @param Menu Button Type
   @type number
   @desc インポート・エクスポートボタンの位置を決定します。
   1 = 選択中のセーブファイル上, 2 = 指定した座標
   @default 1

   @param Import Button X
   @type number
   @desc Menu Button Typeが2に設定されている場合のみ、インポートボタンの X 座標を指定します。
   @default 680

   @param Import Button Y
   @type number
   @desc Menu Button Typeが2に設定されている場合のみ、インポートボタンの Y 座標を指定します。
   @default 16

   @param Export Button X
   @type number
   @desc Menu Button Typeが2に設定されている場合のみ、エクスポートボタンの X 座標を指定します。
   @default 750

   @param Export Button Y
   @type number
   @desc Menu Button Typeが2に設定されている場合のみ、エクスポートボタンの Y 座標を指定します。
   @default 16
   
   @param Export Help Text
   @type string
   @desc エクスポート画面で表示されるヘルプテキストになります。
   @default 表示されているテキストを保存してください。

   @param Import Help Text
   @type string
   @desc インポート画面で表示されるヘルプテキストになります。
   @default セーブデータのテキストを貼り付けてください。
   
 * @requiredAssets img/system/buttonCancel
 * @requiredAssets img/system/buttonExport
 * @requiredAssets img/system/buttonImport
 * @requiredAssets img/system/buttonOk
*/
Kien.IESaveData.parameters = PluginManager.parameters("ImportExportSaveFile");
Kien.IESaveData.buttonType = parseInt(Kien.IESaveData.parameters['Menu Button Type'], 10);
Kien.IESaveData.textAreaX = parseInt(Kien.IESaveData.parameters['Text Area X'], 10);
Kien.IESaveData.textAreaY = parseInt(Kien.IESaveData.parameters['Text Area Y'], 10);
Kien.IESaveData.textAreaWidth = parseInt(Kien.IESaveData.parameters['Text Area Width'], 10);
Kien.IESaveData.textAreaHeight = parseInt(Kien.IESaveData.parameters['Text Area Height'], 10);
Kien.IESaveData.okButtonX = parseInt(Kien.IESaveData.parameters['OK Button X'], 10);
Kien.IESaveData.okButtonY = parseInt(Kien.IESaveData.parameters['OK Button Y'], 10);
Kien.IESaveData.cancelButtonX = parseInt(Kien.IESaveData.parameters['Cancel Button X'], 10);
Kien.IESaveData.cancelButtonY = parseInt(Kien.IESaveData.parameters['Cancel Button Y'], 10);
Kien.IESaveData.importButtonX = parseInt(Kien.IESaveData.parameters['Import Button X'], 10);
Kien.IESaveData.importButtonY = parseInt(Kien.IESaveData.parameters['Import Button Y'], 10);
Kien.IESaveData.exportButtonX = parseInt(Kien.IESaveData.parameters['Export Button X'], 10);
Kien.IESaveData.exportButtonY = parseInt(Kien.IESaveData.parameters['Export Button Y'], 10);
Kien.IESaveData.exportHelpText = Kien.IESaveData.parameters['Export Help Text'];
Kien.IESaveData.importHelpText = Kien.IESaveData.parameters['Import Help Text'];


//-----------------------------------------------------------------------------
/**
 * The static class that carries out graphics processing.
 *
 * @class Graphics
 */

Kien.IESaveData.Graphics_initialize = Graphics.initialize;
Graphics.initialize = function(width, height, type) {
    Kien.IESaveData.Graphics_initialize.apply(this, arguments);
    this._importExportElement = null;
    this.createImportExportElement();
}

Graphics.createImportExportElement = function() {
    this._importExportElement = document.createElement('textarea');
    this._importExportElement.style.position = 'absolute';
    this._importExportElement.style.left = Kien.IESaveData.textAreaX + 'px';
    this._importExportElement.style.top = Kien.IESaveData.textAreaY + 'px';
    this._importExportElement.style.width = Kien.IESaveData.textAreaWidth + 'px';
    this._importExportElement.style.height = Kien.IESaveData.textAreaHeight + 'px';
    this._importExportElement.zIndex = -1;
    document.body.appendChild(this._importExportElement);
}

//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.

DataManager.loadCompressedGamedata = function(savefileId) {
    try {
        return this.loadCompressedGamedataWithoutRescue(savefileId);
    } catch (e) {
        console.error(e);
        return null;
    }
}

DataManager.loadCompressedGamedataWithoutRescue = function(savefileId) {
    var globalInfo = this.loadGlobalInfo();
    if (this.isThisGameFile(savefileId)) {
        var string = StorageManager.loadWithoutDecompress(savefileId);
        var json = JsonEx.parse(LZString.decompressFromBase64(string));
        var obj = {
            'data' : json,
            'info' : globalInfo[savefileId]
        }
        return LZString.compressToBase64(JsonEx.stringify(obj));
    } else {
        return null;
    }
}

DataManager.saveCompressedGamedata = function(savefileId, string) {
    try {
        StorageManager.backup(savefileId);
        return this.saveCompressedGamedataWithoutRescue(savefileId, string);
    } catch (e) {
        console.error(e);
        try {
            StorageManager.remove(savefileId);
            StorageManager.restoreBackup(savefileId);
        } catch (e2) {
        }
        return false;
    }
};

DataManager.saveCompressedGamedataWithoutRescue = function(savefileId, string) {
    var json = JsonEx.parse(LZString.decompressFromBase64(string));
    var data = JsonEx.stringify(json.data);
    if (data.length >= 200000) {
        console.warn('Save data too big!');
    }
    StorageManager.save(savefileId, data);
    this._lastAccessedId = savefileId;
    var globalInfo = this.loadGlobalInfo() || [];
    globalInfo[savefileId] = json.info;
    this.saveGlobalInfo(globalInfo);
    return true;
};

//-----------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.

StorageManager.loadWithoutDecompress = function(savefileId) {
    if (this.isLocalMode()) {
        return this.loadFromLocalFileWithoutDecompress(savefileId);
    } else {
        return this.loadFromWebStorageWithoutDecompress(savefileId);
    }
};

StorageManager.loadFromLocalFileWithoutDecompress = function(savefileId) {
    var data = null;
    var fs = require('fs');
    var filePath = this.localFilePath(savefileId);
    if (fs.existsSync(filePath)) {
        data = fs.readFileSync(filePath, { encoding: 'utf8' });
    }
    return data;
};

StorageManager.loadFromWebStorageWithoutDecompress = function(savefileId) {
    var key = this.webStorageKey(savefileId);
    var data = localStorage.getItem(key);
    return data;
};

//-----------------------------------------------------------------------------
// Window_SavefileList
//
// The window for selecting a save file on the save and load screens.

Kien.IESaveData.Window_SavefileList_initialize = Window_SavefileList.prototype.initialize;
Window_SavefileList.prototype.initialize = function(x, y, width, height) {
    Kien.IESaveData.Window_SavefileList_initialize.apply(this, arguments);
    if (Kien.IESaveData.buttonType !== 2) {
        this.createImportExportButton();
    }
};

Window_SavefileList.prototype.createImportExportButton = function() {
    var listener = function(bitmap) {
        var h = bitmap.height;
        var w = bitmap.width;
        this.setColdFrame(0, 0, w, h/2);
        this.setHotFrame(0, h/2, w, h/2);
        this.updateFrame();
    }
    this.importButton = new Sprite_Button();
    this.importButton.bitmap = ImageManager.loadSystem('buttonImport');
    this.importButton.bitmap.addLoadListener(listener.bind(this.importButton));
    this.importButton.x = Kien.IESaveData.importButtonX;
    this.importButton.y = Kien.IESaveData.importButtonY;
    this.addChild(this.importButton);

    this.exportButton = new Sprite_Button();
    this.exportButton.bitmap = ImageManager.loadSystem('buttonExport');
    this.exportButton.bitmap.addLoadListener(listener.bind(this.exportButton));
    this.exportButton.x = Kien.IESaveData.exportButtonX;
    this.exportButton.y = Kien.IESaveData.exportButtonY;
    this.addChild(this.exportButton);
}

Kien.IESaveData.Window_SavefileList_updateCursor = Window_SavefileList.prototype.updateCursor;
Window_SavefileList.prototype.updateCursor = function() {
    Kien.IESaveData.Window_SavefileList_updateCursor.apply(this, arguments);
    if (Kien.IESaveData.buttonType !== 2 && this.importButton && this.exportButton) {
        if (this._cursorAll) {
            this.importButton.visible = false;
            this.exportButton.visible = false;
        } else if (this.isCursorVisible()) {
            var rect = this.itemRect(this.index());
            this.exportButton.x = rect.x + rect.width - this.exportButton.width;
            this.exportButton.y = rect.y + this.exportButton.height / 2;
            this.importButton.x = this.exportButton.x - this.importButton.width - 20;
            this.importButton.y = rect.y + this.importButton.height / 2;
            this.exportButton.visible = DataManager.isThisGameFile(this.index() + 1);
            this.importButton.visible = true;
        } else {
            this.exportButton.visible = false;
            this.importButton.visible = false;
            this.setCursorRect(0, 0, 0, 0);
        }
    }
};

Window_SavefileList.prototype.setExportHandler = function(handler) {
    if (Kien.IESaveData.buttonType !== 2) {
        this.exportButton.setClickHandler(handler);
    }
}

Window_SavefileList.prototype.setImportHandler = function(handler) {
    if (Kien.IESaveData.buttonType !== 2) {
        this.importButton.setClickHandler(handler);
    }
}

Kien.IESaveData.Window_SavefileList_processTouch = Window_SavefileList.prototype.processTouch;
Window_SavefileList.prototype.processTouch = function() {
    if (Kien.IESaveData.buttonType !== 2 && this.exportButton && this.importButton) {
        if (this.exportButton._touching || this.importButton._touching) {
            return;
        }
    }
    Kien.IESaveData.Window_SavefileList_processTouch.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Scene_File
//
// The superclass of Scene_Save and Scene_Load.

Kien.IESaveData.Scene_File_createListWindow = Scene_File.prototype.createListWindow;
Scene_File.prototype.createListWindow = function() {
    Kien.IESaveData.Scene_File_createListWindow.call(this);
    this.createOkCancelButton();
    if (Kien.IESaveData.buttonType === 2) {
        this.createImportExportButton();
    } else {
        this._listWindow.setExportHandler(this.onExportClicked.bind(this));
        this._listWindow.setImportHandler(this.onImportClicked.bind(this));
    }
};

Kien.IESaveData.Scene_File_start = Scene_File.prototype.start;
Scene_File.prototype.start = function() {
    Kien.IESaveData.Scene_File_start.apply(this, arguments);
    this._listWindow.setTopRow(this.firstSavefileIndex() - 2);
    this._listWindow.select(this.firstSavefileIndex());
};

Scene_File.prototype.createOkCancelButton = function() {
    var listener = function(bitmap) {
        var h = bitmap.height;
        var w = bitmap.width;
        this.setColdFrame(0, 0, w, h/2);
        this.setHotFrame(0, h/2, w, h/2);
    }
    this.okButton = new Sprite_Button()
    this.okButton.bitmap = ImageManager.loadSystem('buttonOk');
    this.okButton.bitmap.addLoadListener(listener.bind(this.okButton));
    this.okButton.x = Kien.IESaveData.okButtonX;
    this.okButton.y = Kien.IESaveData.okButtonY;
    this.okButton.visible = false;
    this.addChild(this.okButton);

    this.cancelButton = new Sprite_Button()
    this.cancelButton.bitmap = ImageManager.loadSystem('buttonCancel');
    this.cancelButton.bitmap.addLoadListener(listener.bind(this.cancelButton));
    this.cancelButton.x = Kien.IESaveData.cancelButtonX;
    this.cancelButton.y = Kien.IESaveData.cancelButtonY;
    this.cancelButton.visible = false;
    this.addChild(this.cancelButton);

}

Scene_File.prototype.createImportExportButton = function() {
    var listener = function(bitmap) {
        var h = bitmap.height;
        var w = bitmap.width;
        this.setColdFrame(0, 0, w, h/2);
        this.setHotFrame(0, h/2, w, h/2);
    }
    this.importButton = new Sprite_Button()
    this.importButton.bitmap = ImageManager.loadSystem('buttonImport');
    this.importButton.bitmap.addLoadListener(listener.bind(this.importButton));
    this.importButton.x = Kien.IESaveData.importButtonX;
    this.importButton.y = Kien.IESaveData.importButtonY;
    this.importButton.setClickHandler(this.onImportClicked.bind(this));
    this.addChild(this.importButton);

    this.exportButton = new Sprite_Button()
    this.exportButton.bitmap = ImageManager.loadSystem('buttonExport');
    this.exportButton.bitmap.addLoadListener(listener.bind(this.exportButton));
    this.exportButton.x = Kien.IESaveData.exportButtonX;
    this.exportButton.y = Kien.IESaveData.exportButtonY;
    this.exportButton.setClickHandler(this.onExportClicked.bind(this));
    this.addChild(this.exportButton);
}

Scene_File.prototype.onExportClicked = function() {
    if (DataManager.isThisGameFile(this.savefileId())) {
        this._listWindow.deactivate();
        Graphics._importExportElement.value = DataManager.loadCompressedGamedata(this.savefileId());
        Graphics._importExportElement.setSelectionRange(0, Graphics._importExportElement.textLength);
        Graphics._importExportElement.style.zIndex = 98;
        this.okButton.visible = true;
        this.cancelButton.visible = false;
        this.okButton.setClickHandler(this.onExportOkClicked.bind(this));
        this.cancelButton.setClickHandler(null);
        this._helpWindow.setText(Kien.IESaveData.exportHelpText);
        SoundManager.playOk();
    } else {
        SoundManager.playBuzzer();
    }
}

Scene_File.prototype.onImportClicked = function() {
    this._listWindow.deactivate();
    Graphics._importExportElement.value = Kien.IESaveData.importHelpText;
    Graphics._importExportElement.setSelectionRange(0, Graphics._importExportElement.textLength);
    Graphics._importExportElement.style.zIndex = 98;
    this.okButton.visible = true;
    this.cancelButton.visible = true;
    this.okButton.setClickHandler(this.onImportOkClicked.bind(this));
    this.cancelButton.setClickHandler(this.onImportCancelClicked.bind(this));
    this._helpWindow.setText(Kien.IESaveData.importHelpText);
}

Scene_File.prototype.onExportOkClicked = function() {
    Graphics._importExportElement.value = "";
    Graphics._importExportElement.style.zIndex = -1;
    this.okButton.visible = false;
    this.activateListWindow();
    this._helpWindow.setText(this.helpWindowText());
    this.okButton.setClickHandler(null);
    SoundManager.playOk();
}

Scene_File.prototype.onImportOkClicked = function() {
    var string = Graphics._importExportElement.value;
    if (DataManager.saveCompressedGamedata(this.savefileId(), string)) {
        SoundManager.playOk();
    } else {
        SoundManager.playBuzzer();
    }
    this._listWindow.refresh();
    this.onImportCancelClicked();
}

Scene_File.prototype.onImportCancelClicked = function() {
    Graphics._importExportElement.value = "";
    Graphics._importExportElement.style.zIndex = -1;
    this.okButton.visible = false;
    this.cancelButton.visible = false;
    this.activateListWindow();
    this._helpWindow.setText(this.helpWindowText());
    this.okButton.setClickHandler(null);
    this.cancelButton.setClickHandler(null);
}