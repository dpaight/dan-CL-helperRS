function updateRoster(id) {
    // get current data
    // importXLS_2(); 
    var roster = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('roster');
    var last = roster.getRange('a1:a').getValues().filter(String).length;
    var rosterVals = roster.getRange(1, 1, last, roster.getLastColumn()).getDisplayValues();
    var rosterHeadings = rosterVals.shift().map(x => x.toString().replace(/[ -\/]/g, "_").toLowerCase());
    // get aeries data for school
    // var [allPupilsHeadingsRaw, allPupilsArray, allPupilsSheet, range, lastR, lastC] = get('allPupilsFromRamCurrent');
    // '1Pe-unMy1vkj3joBvGru03YB1W3a35zNn_vXw9eF0KKk',
    // var allPupilsHeadings = allPupilsHeadingsRaw.map(x => x.toString().replace(/[ -\/]/g, "_").toLowerCase());
    // get seis data
    var folder = DriveApp.getFolderById('1CZK4YhSS3uiihM-7D-m3sgZWVATWfBK0');
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
    var indexes = matchRosterFieldsToSeis(rosterHeadings, seisDataHeadings); 
    Logger.log('headings: roster, seis \n %s \n %s', JSON.stringify(rosterHeadings), JSON.stringify(seisDataHeadings));
    // find matching records and update with new seis data
    // new seis data by rows
    var newRecords = [];
    var missingRecords = [];
    // counter "i" is tracking roster_seis.csv; counter "j" will track "roster"; upon matching, counter "c" will
    // track the columns of the matching record(s) in roster_seis.csv AND allPupils (from Aeries)
    for (var i = 0; i < seisData.length; i++) {
        var elNew = seisData[i];
        var seisNmjdob = elNew[0];
        var found = false;
        // roster table by rows
        var newValue;
        for (var j = 0; j < rosterVals.length; j++) {
            // this gets the row number for the matching record in allPupils
            //  "api" stands for all pupils record index; it is the index of the record in "allPupils" that matches
            //  on nmjdob ("name julian date of birth")
            // var api = getRecordIndex(seisNmjdob, allPupilsArray, allPupilsHeadings);
            // if (api == -1) {
                // missingRecords.push(seisNmjdob);
                // break;
            // }
            var elRos = rosterVals[j];
            var nmJdob = elRos[0];
            if (elRos[0] == seisNmjdob) {
                found = true;
                // iterate the columns in this record to update from
                //  seis
                for (let c = 0; c < elRos.length; c++) {
                    var fieldName = rosterHeadings[c];
                    var fld = indexes[fieldName];
                    //  checking seis
                    if (fld[1] != -1) {
                        newValue = seisData[i][fld[1]];
                        rosterVals[j].splice(c, 1, newValue);
                    }
                }
            }
        }
        if (found == false) { //  && api != -1
            // make a new record
            var row = [];
            for (let c = 0; c < elRos.length; c++) {
                var fieldName = rosterHeadings[c];
                var fld = indexes[fieldName];
                //  checking seis
                if (fld[1] != -1) {
                    newValue = seisData[i][fld[1]];
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
    if (missingRecords.length == 0) {
    }
    else {
        var [headings, values, sheet, range, lastR, lastC] = get('roster');
        for (var i = 0; i < values.length; i++) {
            var el = values[i][0];
            if (missingRecords.indexOf(el) != -1) {
                var highlightRow = sheet.getRange((i + 2), 1, 1, 10);
                highlightRow.setBackground('#f3c9c9');
            }
        }
    }
    SpreadsheetApp.flush();
    return;
}
function matchRosterFieldsToSeis(rosH, seisH) {
    var fieldMatches = {};
    for (let i = 0; i < rosH.length; i++) {
        var thisFieldName = rosH[i];
        var thisFieldIndexes = fieldMatches[thisFieldName] = [];
        thisFieldIndexes.push(i);
        thisFieldIndexes.push(seisH.indexOf(thisFieldName));
    }
    Logger.log('fieldMatches = %s', JSON.stringify(fieldMatches));
    return fieldMatches;
}
function getAeriesData() {
    var data = get('roster');
    var [headings, values, sheet, range, lastR, lastC] = data;
    var aeriesData = getAllPupilsList();

    for (let i = 0; i < values.length; i++) {
        const elR = values[i];
        for (let j = 0; j < aeriesData.length; j++) {
            const elA = aeriesData[j];
            if (elA[34] == elR[0]) {
                elR.splice(1, 1, elA[0]);
                
            }
        }
    }

}
/**
 * @returns allPupils table from file currentRamonaStudents
 */
 function getAllPupilsList() {
    var sheet, last, range, values, keys;
    sheet = ss2.getSheetByName('allPupils');
    last = sheet.getRange('a1:a').getValues().filter(String).length;
    range = sheet.getRange(2, 1, last - 1, 1);
    values = range.getDisplayValues();
    return values;
}
