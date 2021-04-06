// Compiled using ts2gas 3.6.4 (TypeScript 4.1.3)
// Compiled using ts2gas 3.6.4 (TypeScript 4.1.3)
function updateRoster() {
    // get current data
    var roster = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('roster');
    var last = roster.getRange('a1:a').getValues().filter(String).length;
    var rosterVals = roster.getRange(1, 1, last, roster.getLastColumn()).getDisplayValues();
    var rosterHeadings = rosterVals.shift().map(x => x.toString().replace(/[ -\/]/g, "_").toLowerCase());
    // get aeries data for school
    var allPupilsSheet = ss2.getSheetByName('allPupils');
    var last = allPupilsSheet.getRange('a1:a').getValues().filter(String).length;
    var allPupilsArray = allPupilsSheet.getRange(1, 1, last, allPupilsSheet.getLastColumn()).getDisplayValues();
    var allPupilsHeadings = allPupilsArray.shift().map(x => x.toString().replace(/[ -\/]/g, "_").toLowerCase());
    // get seis data
    var folder = DriveApp.getFolderById('1g1JGj5L6QIIsYG-CLQj9np3m4QgtClLF');
    var files = folder.getFiles();
    var fileIds = [];
    // looking for .csv file
    var found = false;
    while (files.hasNext() && found == false) {
        var file = files.next();
        var fileName = file.getName();
        var status; // '1' if parse function is successful
        if (fileName.toString().search(/roster_seis.csv/) !== -1) {
            found = true;
            var sheetName = 'roster_seis';
            var csvFile = file.getBlob().getDataAsString();
            fileIds.push(file.getId());
            var seisData = Utilities.parseCsv(csvFile);
            var iObj = getIndicesByHeading(seisData[0]);
            Logger.log('iObj = %s', JSON.stringify(iObj));
        }
    }
    seisData = addMatchVarColOne(seisData);
    var seisDataHeadings = seisData.shift().map(x => x.toString().replace(/[ -\/]/g, "_").toLowerCase());
    var indexes = matchRosterFieldsToSeisAndAllPupils(rosterHeadings, seisDataHeadings, allPupilsHeadings);
    // find matching records and update with new seis data
    // new seis data by rows
    var newRecords = [];
    for (var i = 0; i < seisData.length; i++) {
        var elNew = seisData[i];
        var seisNmjdob = elNew[0];
        // generate the matching key
        // var dob = elNew[iObj['Date of Birth']];
        // var fn = elNew[iObj['First Name']];
        // var ln = elNew[iObj['Last Name']];
        var found = false;
        // roster table by rows
        var newValue;
        for (var j = 0; j < rosterVals.length; j++) {
            // this gets the row number for the matching record in allPupils
            var apRi = getRecordIndex(seisNmjdob, allPupilsArray);
            var elRos = rosterVals[j];
            var nmJdob = elRos[0];
            if (elRos[0] == seisNmjdob) {
                found = true;
                // iterate the columns in this record to update from either
                //  seis or allPupils
                for (let c = 0; c < elRos.length; c++) {
                    var fieldName = rosterHeadings[c];
                    var thisFieldCols = indexes[fieldName];
                    //  checking seis
                    if (thisFieldCols[1] != -1) {
                        newValue = seisData[i][thisFieldCols[1]];
                        rosterVals[j].splice(c, 1, newValue);
                    }
                    else if (thisFieldCols[2] != -1) {
                        newValue = allPupilsArray[apRi][thisFieldCols[2]];
                        rosterVals[j].splice(c, 1, newValue);
                    }
                }
            }
        }
        if (found == false) {
            // make a new record
            var row = [];
            for (let c = 0; c < elRos.length; c++) {
                var fieldName = rosterHeadings[c];
                var thisFieldCols = indexes[fieldName];
                //  checking seis
                if (thisFieldCols[1] != -1) {
                    newValue = seisData[i][thisFieldCols[1]];
                    row.push(newValue);
                }
                else if (thisFieldCols[2] != -1) {
                    newValue = allPupilsArray[apRi][thisFieldCols[2]];
                    row.push(newValue);
                }
                else {
                    row.push('');
                }
            }
            newRecords.push(row);
        }
    }
    var joined = rosterVals.concat(newRecords); //
    var sorted = joined.sort((a, b) => {
        if (a[0] < b[0]) {
            return -1;
        }
        else if (a[0] == b[0]) {
            return 0;
        }
        else {
            return 1;
        }
    });
    var allData = [rosterHeadings].concat(sorted);
    var destRng = roster.getRange(1, 1, allData.length, allData[0].length);
    roster.clearContents();
    destRng.setValues(allData);
}
/**
 *
 * @param data {array} [last, first, dob]
 * @returns constructed "match" variable using lastName, firstName, and dob as julian date
 */
function addMatchVarColOne(array) {
    var headings = array.shift();
    var searchItems = { 'birth': -1, 'first': -1, 'last': -1 };
    for (let i = 0; i < headings.length; i++) {
        const el = headings[i];
        for (const key in searchItems) {
            if (Object.prototype.hasOwnProperty.call(searchItems, key)) {
                const element = searchItems[key];
                if (element == -1 && el.toString().toLowerCase().search(new RegExp(key)) != -1) {
                    searchItems[key] = i;
                }
            }
        }
    }
    if (searchItems.birth == -1 || searchItems.first == -1 || searchItems.last == -1) {
        throw 'couldn\'t find all search items in headings of seis data';
    }
    var seisDataMod = [];
    for (let i = 0; i < array.length; i++) {
        const row = array[i];
        var y2 = moment(row[searchItems.birth], 'MM-DD-YYYY').format('YY');
        var doy = moment(row[searchItems.birth], 'MM-DD-YYYY').dayOfYear();
        var nmjdob = row[searchItems.last].toString() + row[searchItems.first].toString() +
            y2.toString() + doy.toString();
        row.unshift(nmjdob);
        seisDataMod.push(row);
    }
    headings.unshift('nmjdob');
    // console.log(JSON.stringify(array));
    return [headings].concat(seisDataMod);
}
//# sourceMappingURL=module.jsx.map
//# sourceMappingURL=module.jsx.map