//=============================================================================
// Extra Item Types
// ExtraItemTypes.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_ExtraItemType = true;

var Kien = Kien || {};
Kien.ExtraItemTypes = {};
//=============================================================================
/*:
 * @plugindesc Add Item type in Item screen.
 * @author Kien
 *
 * @help
 *  * <KienItemType:n> to set Item's type to Item Type List. Starts from 0.
 * 
 *
 * @param Item Type List
 * @type String[]
 * @default []
 * @desc Set Item type's shown name.
*/

Kien.ExtraItemTypes.parameters = Kien.lib.getParameters("ExtraItemTypes");
Kien.ExtraItemTypes.typeList = Kien.ExtraItemTypes.parameters["Item Type List"];

//-----------------------------------------------------------------------------
// Window_ItemCategory
//
// The window for selecting a category of items on the item and shop screens.

Kien.ExtraItemTypes.Window_ItemCategory_makeCommandList = Window_ItemCategory.prototype.makeCommandList;
Window_ItemCategory.prototype.makeCommandList = function() {
	Kien.ExtraItemTypes.Window_ItemCategory_makeCommandList.apply(this, arguments);
	for (var i = 0; i < Kien.ExtraItemTypes.typeList.length; i++) {
		this.addCommand(Kien.ExtraItemTypes.typeList[i], "kienextra" + i);
	}
};

Kien.ExtraItemTypes.Window_ItemList_includes = Window_ItemList.prototype.includes;
Window_ItemList.prototype.includes = function(item) {
	if (this._category.match(/kienextra(\d+)/)) {
		return DataManager.isItem(item) && item.meta["KienItemType"] == RegExp.$1;
	} else if (DataManager.isItem(item) && item.meta["KienItemType"]) {
		return false;
	}
    return Kien.ExtraItemTypes.Window_ItemList_includes.apply(this, arguments);
};
