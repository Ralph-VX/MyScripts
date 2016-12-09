//=============================================================================
// Different Maximum Amount of Item
// DifferentMaximums.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_DifferentMaximum = true;

var Kien = Kien || {};
Kien.DifferentMaximum = {};
//=============================================================================
/*:
 * @plugindesc A system allow you to set your items maximum amount.
 * @author Kien
 *
*/

//-----------------------------------------------------------------------------
// Game_Party
//
// The game object class for the party. Information such as gold and items is
// included.

Game_Party.prototype.maxItems = function(item) {
    return !!item.meta["Max Amount"] ? parseInt(item.meta["Max Amount"]) : 99;
};
