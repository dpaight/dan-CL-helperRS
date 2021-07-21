// Compiled using ts2gas 3.6.4 (TypeScript 4.2.4)
// Compiled using ts2gas 3.6.4 (TypeScript 4.2.4)
var ss = SpreadsheetApp.getActiveSpreadsheet();
/**
 *
 * @param sheetName : string
 * @param column : number
 * @param flat :boolean
 * @returns : [headings, values, sheet, range, lastR, lastC]
 */
function get(sheetName, column = -1, flat = false) {
    if (!sheetName) {
        Logger.log('missing value');
    }
    else {
        Logger.log(sheetName);
    }
    ;
    var sheet, headings, values, range, lastR, lastC;
    sheet = ss.getSheetByName(sheetName);
    lastR = findLastRow(sheetName, 1);
    lastC = sheet.getLastColumn();
    range = (column == -1) ?
        sheet.getRange(1, 1, lastR, lastC) :
        sheet.getRange(1, column, lastR, 1);
    values = (flat == undefined || flat == false) ?
        range.getValues() :
        range.getValues().flat();
    headings = values.shift();
    return [headings, values, sheet, range, lastR, lastC];
}
function getDisp(sheetName, column = -1, flat = false) {
    if (!sheetName) {
        Logger.log('missing value');
    }
    else {
        Logger.log(sheetName);
    }
    ;
    var sheet, headings, values, range, lastR, lastC;
    sheet = ss.getSheetByName(sheetName);
    lastR = findLastRow(sheetName, 1);
    lastC = sheet.getLastColumn();
    range = (column == -1) ?
        sheet.getRange(1, 1, lastR, lastC) :
        sheet.getRange(1, column, lastR, 1);
    values = (flat == undefined || flat == false) ?
        range.getDisplayValues() :
        range.getDisplayValues().flat();
    headings = values.shift();
    return [headings, values, sheet, range, lastR, lastC];
}
/**
 *
 * @param sheet: String (name of sheet)
 * @param column : the column number to check
 * @returns number (last row with data)
 */
function findLastRow(sheet, column) {
    var theSheet = ss.getSheetByName(sheet);
    var theValues = theSheet.getRange(1, column, theSheet.getLastRow(), 1)
        .getValues();
    var last = (theValues.filter(String).length > 0) ?
        theValues.filter(String).length :
        1;
    return last;
}
//# sourceMappingURL=module.jsx.map
//# sourceMappingURL=module.jsx.map