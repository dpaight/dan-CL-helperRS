// Compiled using ts2gas 3.6.4 (TypeScript 4.2.4)
// Compiled using ts2gas 3.6.4 (TypeScript 4.2.4)
// Compiled using ts2gas 3.6.4 (TypeScript 4.1.3)
var ss = SpreadsheetApp.getActiveSpreadsheet();
var roster = ss.getSheetByName('roster');
var ss2 = SpreadsheetApp.openById("1HoulMp8RlpCxvN4qf10TbxW1vzxzTjbA8xKhFjRdZY8");
var sp = CacheService.getScriptCache(); //PropertiesService.getScriptProperties();
var fname = 'arguments.callee.toString().match(/function ([^\(]+)/)[1]';
// @ts-ignore
var moment = Moment.load();
function sendLevelsForm(stuName, stuId, teachemail) {
    Logger.log('stuName: %s, stuId: %s, teachemail: %s', stuName, stuId, teachemail);
    // stuName = 'Wanda Wanderer', stuId = 'WandererWanda123456', teachemail = 'dpaight@hemetusd.org';
    // 1PdCenM9sTAwTlb-TxmreJAPuMKYYpBgjeXK-7h0wdtg  
    var formId = '1PdCenM9sTAwTlb-TxmreJAPuMKYYpBgjeXK-7h0wdtg';
    var form = FormApp.openById(formId);
    var respArray = [stuName, stuId];
    var formResponse = form.createResponse();
    var items = form.getItems();
    for (var i = 0; i < 2; i++) {
        var item = items[i];
        item.getType();
        var resp = respArray[i];
        var itemResponse = item.asTextItem().createResponse(resp);
        formResponse.withItemResponse(itemResponse);
    }
    // var ui = SpreadsheetApp.getUi(), to;
    // var cc = ui.alert("Do you want to also send this to the general ed teacher: " + teachemail + "?", ui.ButtonSet.YES_NO_CANCEL);
    // if (cc == ui.Button.CANCEL) {
    //     return 'fail';
    // } else if (cc == ui.Button.NO) {
    //     to = 'dpaight@hemetusd.org';
    // } else {
    //     to = 'dpaight@hemetusd.org, ' + teachemail;
    // }
    var levelsUrl = formResponse.toPrefilledUrl();
    try {
        MailApp.sendEmail({
            to: teachemail,
            subject: stuName + "'s levels of performance",
            htmlBody: "{" + teachemail + "}<br><br>" +
                "The IEP for " + stuName + " is coming up, and I need some information, please. " +
                "The link below points to a Levels of Performance questionnaire in a Google form. I'll use the " +
                "information you provide as data for the IEP. Thank you for your time.<br><br>" +
                "NB: This email was sent automatically. If you have already responded, please ignore this request." +
                "<h2><a href=" + levelsUrl + ">Levels of Performance for " + stuName + "</a></h2>"
        });
    }
    catch (err) {
        Logger.log('failed at email try');
        return 'fail';
    }
    var confirmationMsg = form.getConfirmationMessage() + "; " + formResponse.getEditResponseUrl();
    saveLogEntry([stuId, "levels ques sent: " + teachemail]);
    return stuId; // picked up by success handler (focus())
}
function saveLastId(id) {
    PropertiesService.getScriptProperties()
        .setProperty('lastId', id.toString());
    return id;
}
function doGet(e) {
    ss.getSheetByName('roster').sort(1);
    var t = HtmlService.createTemplateFromFile("caseLog");
    t.version = "v25";
    return t.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('roster_seis');
    //Parsing the request body
    var body = JSON.parse(e.postData.contents);
    //Adding a new row with content from the request body
    sheet.appendRow([body.id,
    body.date_created,
    body.first_name,
    body.shipping.address,
    body.shipping.phone,
    body.billing.phone,
    body.billing.postcode
    ]);
}
// gets the last id stored in a script properties
function getLastId() {
    var scriptProp = PropertiesService.getScriptProperties()
    var savedId = scriptProp.getProperty('lastId').toString();
    var last = ss.getSheetByName('roster').getRange('J2:J').getValues().filter(String).length;
    var idList = ss.getSheetByName('roster').getRange('J2:J' + (last + 1)).getValues().flat();
    if (
        (savedId.search(/[0-9]{7}/g) != -1) &&
        (idList.indexOf(savedId) != -1)) {
        var id = savedId;
        Logger.log('id is %s', id);
    }
    else {
        // if nothing is there, it gets the id of the First Student in the list on the spreadsheet
        id = idList[0].toString();
        scriptProp.setProperty('lastId', id);
        Logger.log('id is %s', id);
    }
    return id;
}
// script and CSS files have to be stored in HTML files for Google app script
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}
/**
 * finds the last row containing data in the named sheet as a number
 *
 * @param {string} sheetName The sheet name
 * @param {number} column The column to test for data
 * @return number indicating the last row containing data in column
 * @customfunction
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
// takes Data sent from the client side and saves it on the server side spreadsheet; 
// returns id for 'show...' function
function saveLogEntry(input) {
    var id = input[0], entry = input[1];
    var students = getAllRecords('roster');
    var row = [[moment().format('MM/DD/YY HH:mm'), Session.getActiveUser().getEmail(), , entry, , id]];
    var logResp = ss.getSheetByName('logRespMerged');
    var colAlen = logResp.getRange('A1:A').getValues().filter(String).length;
    var range = logResp.getRange(colAlen + 1, 1, 1, row[0].length);
    range.setValues(row);
    SpreadsheetApp.flush();
    return id;
}
/**
 *
 * @param input [id, [students]]
 * @returns [firstName, lastName, matchingVar]
 */
function getStuName_id(input) {
    var id = input[0], students = input[1];
    var found = false;
    var i = 0;
    while (found == false && i < 50) {
        var el = students[i];
        if (el[9].toString() == id.toString()) {
            found = true;
            var fn = el[11];
            var ln = el[10];
            var match = el[0];
            return [fn, ln, match];
        }
        i++;
    }
}
function openEvent(eventId) {
    if (eventId === void 0) {
        eventId = '761bevgjr7802mpj7tds8egajd';
    }
    var user = "dpaight@hemetusd.org";
    var identity = ScriptApp.getOAuthToken(); //getIdentityToken().toString();
    CalendarApp.getCalendarById('hemetusd.k12.ca.us_mu0bm8h5amcsfvcvpmim3v1fag@group.calendar.google.com').getEventById(eventId);
    var cal = CalendarApp.getCalendarById('hemetusd.k12.ca.us_mu0bm8h5amcsfvcvpmim3v1fag@group.calendar.google.com');
    // CalendarApp
}
/**
 *
 * @param data array: [glEditId, glEditLevel, glEditArea, glEditStnd, glEditGl]
 * glEditId idNo or -1 for new id
 */
function saveGoalSS(obj) {
    Logger.log('receive = %s', JSON.stringify(obj));
    var sheet = ss.getSheetByName('goals');
    var last = sheet.getRange('A1:A').getValues().filter(String).length;
    var range = sheet.getRange(1, 1, last, sheet.getLastColumn());
    var values = range.getValues();
    var nextRow = last + 1;
    var headings = values.shift();
    var max = 0;
    Logger.log('the obj var = %s', JSON.stringify(obj));
    var array0 = Object.values(obj);
    var array = [
        obj.glEditId,
        obj.glEditLevel,
        obj.glEditArea,
        obj.glEditStrand,
        obj.glEditAnnual,
        obj.glEditStandard,
        obj.glEditObj1,
        obj.glEditObj2,
        obj.glEditObj3,
        obj.timestamp
    ];
    Logger.log('the array var = %s', JSON.stringify(array));
    if (obj.glEditId != -1) {
        for (let i = 0; i < values.length; i++) {
            const eli = values[i];
            var [glId, glEditLevel, glEditArea, glEditStrand, glEditAnnual, glEditStandard, glEditObj1, glEditObj2, glEditObj3, timestamp] = eli;
            if (glId == obj.glEditId) {
                range = sheet.getRange(i + 2, 1, 1, array.length);
                range.setValues([array]);
                return "replaced";
            }
        }
    }
    else {
        const arrayColumn = (arr, n) => arr.map(x => x[n]);
        var idCol = arrayColumn(values, 0);
        var newId = Math.max(...idCol) + 1;
        Logger.log('idCol = %s; max value +1 = %s', JSON.stringify(idCol), newId);
        array.splice(0, 1, newId);
        range = sheet.getRange(nextRow, 1, 1, array.length);
        range.setValues([array]);
        return obj.glEditId;
    }
}
/**
 *
 * @param lvlArea [levels area, goal area, id]
 * @returns [search term in form 'gradeLevel_area', found goals for display in goal picker
 */
function getGoalListItems(lvlArea = [2, "reading", "1010101"]) {
    var [glLvl, glArea, SEIS_ID] = lvlArea;
    var goals = [];
    var sheet = ss.getSheetByName('goals');
    var last = sheet.getRange('A1:A').getValues().filter(String).length;
    var range = sheet.getRange(2, 1, last - 1, sheet.getLastColumn());
    var values = range.getValues();
    var listItems = [];
    var foundGoals = [];
    values.forEach(function (el, i) {
        var [gId, gLvl, gArea, gStrand, gAnl, gStandard, gO1, gO2, gO3] = el;
        if ((gLvl.toString() == glLvl.toString() && gArea == glArea) || (glLvl == -1 && gArea == glArea)) {
            let foundGoal = new Goal(gId, gLvl, gArea, gStrand, gAnl, gStandard, gO1, gO2, gO3);
            listItems.push(foundGoal.list());
            foundGoals.push(foundGoal);
        }
    });
    // Logger.log(JSON.stringify(goals));
    return listItems;
}
function Goal(id, grdLvl, area, strand, annual, standard, objctv1, objctv2, objctv3) {
    this.id = id;
    this.lvl = grdLvl;
    this.area = area;
    this.strand = strand;
    this.annual = annual;
    this.standard = standard;
    this.objective1 = objctv1;
    this.objective2 = objctv2;
    this.objective3 = objctv3;
    this.snip = function () {
        return '[' +
            '"area" = "' + this.area + '",' +
            '"strand" = "' + this.strand + '",' +
            '"stnd" = "' + this.standard + '",' +
            '"gl" = "' + this.annual + '"' +
            ']';
    };
    this.list = function () {
        return '<li class="goalList" glId="' + this.id + '">'
            + '["' + this.lvl + '"' + ', '
            + '"' + this.strand + '"' + ', '
            + '"' + this.annual + '"' + ', '
            + '"' + this.standard + '"' + ', '
            + '"' + this.id + '"]</li>';
    };
}
/**
 *
 * @param gId
 * @returns formatted string for use in a text blaze macro
 */
function getGoal(gId = 47) {
    var sheet = ss.getSheetByName('goals');
    var last = sheet.getRange('A1:A').getValues().filter(String).length;
    var range = sheet.getRange(2, 1, last - 1, sheet.getLastColumn());
    var values = range.getValues();
    for (let i = 0; i < values.length; i++) {
        const el = values[i];
        if (el[0] == gId) {
            var [id, grdLvl, area, strand, annual, standard, objctv1, objctv2, objctv3] = el;
            var goal = new Goal(id, grdLvl, area, strand, annual, standard, objctv1, objctv2, objctv3);
        }
        ;
        // return false;
    }
    return goal;
}
function getOneGoalForEditing(gId = 47) {
    var sheet = ss.getSheetByName('goals');
    var last = sheet.getRange('A1:A').getValues().filter(String).length;
    var range = sheet.getRange(2, 1, last - 1, sheet.getLastColumn());
    var values = range.getValues();
    for (let i = 0; i < values.length; i++) {
        const el = values[i];
        if (el[0] == gId) {
            var [id, grdLvl, area, strand, annual, standard, objctv1, objctv2, objctv3] = el;
            return new Goal(id, grdLvl, area, strand, annual, standard, objctv1, objctv2, objctv3);
        }
    }
    return 'goal ' + gId + ' not found';
}
// /**
//  *
//  * @param SEIS_ID
//  * @returns string formatted for text blaze for levels of performance page
//  */
// function getLevels(SEIS_ID) {
//     if (SEIS_ID === void 0) {
//         SEIS_ID = getLastId();
//     }
//     var sheet = ss.getSheetByName('lop_mirror');
//     var last = sheet.getRange('A1:A').getValues().filter(String).length;
//     var range = sheet.getRange(1, 1, last, sheet.getLastColumn());
//     var lvVals = range.getDisplayValues();
//     var headings = lvVals.shift();
//     lvVals.sort((a, b) => moment(b[0]) - moment(a[0]));
//     // headings = headings.flat();
//     var snipCol = headings.indexOf("combinedSnip");
//     var allLevelsSnippet = "not found";
//     for (var i = 0; i < lvVals.length; i++) {
//         var el = lvVals[i];
//         if (el[3].toString() == SEIS_ID.toString()) {
//             allLevelsSnippet = el[snipCol];
//             break;
//         }
//     }
//     return allLevelsSnippet.toString();
// }
/**
 *
 * @param data [array of user alterable data on client side]; saves data to spreadsheet
 */
function updateRecord(data = ['1010101;', '9515995901;', 'dpaight@hemetusd.org;',
    '951555-6565;', 'silliussoddus@gmail.com;', 'jpaight@hemetusd.org;', 'testing']) {
    data;
    var [id, phone, pem, phone2, pem2, tem, notes] = data;
    // var SEIS_ID = data[0], Parent_1_Home_Phone = data[1], Parent_1_Email = data[2], u1_phone = data[3], u3_Parent_1a_Email = data[4], teachemail = data[5];
    // data = data || ["145980", "(951) 305-1378", ""];
    var values = getAllRecords('roster');
    var hdngs = values[0].flat();
    // nmJdob	idAeries	teachemail	u1_phone	stuemail	u3_Parent_1a_Email	corrlng	langFlu	u6_teacher	SEIS_ID	Last_Name	First_Name	Date_of_Birth	Case_Manager	Date_of_Last_Annual_IEP	Date_of_Last_Evaluation	Date_of_Initial_Parent_Consent	Parent_1_Mail_Address	Parent_1_Email	Parent_1_Home_Phone	Parent_1_Cell_Phone	Grade_Code	Student_Eligibility_Status	Disability_1	Disability_2	Parent_Guardian_1_Name	Parent_Guardian_2_Name	Date_of_Next_Annual_IEP	reading group	notes
    Logger.log('seis index: ' + hdngs.indexOf('seis_id'));
    var seis_id_idx = hdngs.indexOf('seis_id');
    var u3_Parent_1a_Email_idx = hdngs.indexOf('u3_Parent_1a_Email`');
    var notes_idx = hdngs.indexOf('notes');
    var u1_phone_idx = hdngs.indexOf('u1_phone');
    var teachemail_idx = hdngs.indexOf('teachemail');
    for (var i = 0; i < values.length; i++) {
        var el = values[i];
        if (id.toString() == el[seis_id_idx].toString()) {
            // el.splice()
            el.splice(u1_phone_idx, 1, phone2);
            el.splice(u3_Parent_1a_Email_idx, 1, pem2);
            el.splice(teachemail_idx, 1, tem);
            el.splice(notes_idx, 1, notes);
            var destRng = ss.getSheetByName('roster').getRange(i + 1, 1, 1, el.length);
            destRng.setValues([el]);
            return el;
        }
    }
    return 'error: record not found';
}
function makeMatchVarFromRange(data) {
    var sheet = ss.getActiveSheet();
    var row = ss.getActiveCell().getRow();
    data = sheet.getRange(row, 11, 1, 3).getDisplayValues();
    data = data[0];
    var y2 = moment(data[2], 'MM-DD-YYYY').format('YY');
    var doy = moment(data[2], 'MM-DD-YYYY').dayOfYear();
    var destCell = sheet.getRange(row, 1, 1, 1);
    destCell.setValue((data[0] + data[1] + y2 + doy).toString().replace(/[^A-z0-9]/g, ""));
    // return (data[0] + data[1] + y2 + doy).toString().replace(/[^A-z0-9]/g, "");
}
/**
 *
 * @param data {array} [last, first, dob]
 * @returns constructed "match" variable using lastName, firstName, and dob as julian date
 */
function makeMatchVar(data) {
    if (data === void 0) {
        data = ['Paight', 'Daniel', '1/21/2013'];
    }
    var y2 = moment(data[2], 'MM-DD-YYYY').format('YY');
    var doy = moment(data[2], 'MM-DD-YYYY').dayOfYear();
    return (data[0] + data[1] + y2 + doy).toString().replace(/[^A-z0-9]/g, "");
}
/**
 *
 * @param nmJdob {string}
 * @param array {array} allPupils sheet in current school students spreadsheet
 * @param matchIndex {number} the index of the lastNameFirstNameDOBasJulianDate
 * @param targetIndex {number} the index of the field in current school students that is to be looked up
 * @returns data field specified in parameters for the record having the "match" variable specified
 */
function getFieldFromNmJdob(nmJdob, array, matchIndex, targetIndex) {
    for (var i = 0; i < array.length; i++) {
        var el = array[i];
        if (el[matchIndex] == nmJdob) {
            return el[targetIndex];
        }
    }
}
/**
 *
 * @param id {string} SEIS_ID
 * @param array {array} default 'roster'
 * @returns the entire record having the id number
 */
function getRecord_noCache(id) {
    var array = getAllRecords('roster');
    for (var i = 0; i < array.length; i++) {
        // Logger.log('after else ran ' + i);
        var el = array[i];
        if (id == el[9]) {
            var found = el;
            break;
        }
    }
    saveLastId(id);
    return found;
}
/**
 *
 * @param key
 * @param keyIndex
 * @param array
 * @returns array of contact log entries for the given student specified by id (key)
 */
function doFilter(key, keyIndex, array) {
    var iObj = getIndicesByHeading(array);
    var output = [];
    for (var i = 0; i < array.length; i++) {
        var el = array[i];
        if (el[keyIndex] == key) {
            output.push(el);
        }
    }
    return output;
}
/**
 *
 * @param array
 * @returns object with key = heading and value = index of key in table row
 */
function getIndicesByHeading(array) {
    var headingsObj = {};
    array.forEach(function (el, i, array) {
        let elConv = el.toString().toLowerCase().replace(/[ /]/g, "_");
        headingsObj[elConv] = i;
    });
    // MailApp.sendEmail("dpaight@hemetusd.org","log", JSON.stringify(headingsObj));
    return headingsObj;
}
function createDraftEmail(buttonVal, paramsJSN) {
    Logger.log(paramsJSN);
    var params = JSON.parse(paramsJSN);
    var file = DriveApp.getFileById('1hRKDCRV0UB79E_V_KZKIF13gXpFPeW9u');
    var mt1 = file.getMimeType();
    var file2 = DriveApp.getFileById('1JbzZ12pxkRGTv_jSu8hccXMRheSJXso_');
    if (params.translate == '1') {
        params.bodySpan = LanguageApp.translate(params.body.toString(), 'en', 'es');
        params.subjSpan = LanguageApp.translate(params.subj.toString(), 'en', 'es');
        params.body = params.bodySpan + '\n\n' + params.body;
        params.subj = params.subjSpan + ' / ' + params.subj;
    }
    if (buttonVal == 'send') {
        GmailApp.sendEmail(params.to, params.subj, params.body, { from: "dpaight@hemetusd.org" });
    }
    else {
        GmailApp.createDraft(params.to, params.subj, params.body, {
            // @ts-ignore
            // attachments: [file.getAs(MimeType.PDF), file2.getAs(MimeType.PDF)]
        });
    }
    return params.body.toString();
}
/**
 * Retrieve and log events from the given calendar that have been modified
 * since the last sync. If the sync token is missing or invalid, log all
 * events from up to a month ago (a full sync).
 *
 * @param {string} calendarId The ID of the calender to retrieve events from.
 * @param {boolean} fullSync If true, throw out any existing sync token and
 *        perform a full sync; if false, use the existing sync token if possible.
 */
// Compiled using ts2gas 3.6.1 (TypeScript 3.8.3)
/**
 * Retrieve and log events from the given calendar that have been modified
 * since the last sync. If the sync token is missing or invalid, log all
 * events from up to a month ago (a full sync).
 *
 * @param {string} calendarId The ID of the calender to retrieve events from.
 * @param {boolean} fullSync If true, throw out any existing sync token and
 *        perform a full sync; if false, use the existing sync token if possible.
 */
function getSyncedEvents_bak(calendarId, fullSync) {
    calendarId = "dpaight@hemetusd.org";
    // hemetusd.k12.ca.us_mu0bm8h5amcsfvcvpmim3v1fag@group.calendar.google.com
    var myEvents = [];
    var properties = PropertiesService.getScriptProperties();
    var options = {
        maxResults: 100
    };
    var syncToken = properties.getProperty('syncToken');
    if (syncToken && !fullSync) {
        // @ts-ignore
        // options.syncToken = syncToken;
    }
    else {
        // Sync events up to thirty (180) days in the past.
        // @ts-ignore
        options.timeMin = getRelativeDate(-180, 0).toISOString();
    }
    // Retrieve events one page at a time.
    var events;
    var pageToken;
    do {
        try {
            // @ts-ignore
            options.pageToken = pageToken;
            //            properties.deleteProperty('syncToken');
            events = Calendar.Events.list(calendarId, options);
            Logger.log('events: %s', JSON.stringify(events));
        }
        catch (e) {
            // Check to see if the sync token was invalidated by the server;
            // if so, perform a full sync instead.
            if (e.message === 'Sync token is no longer valid, a full sync is required.') {
                properties.deleteProperty('syncToken');
                getSyncedEvents(calendarId, true);
                return;
            }
            else {
                throw new Error(e.message);
            }
        }
        if (events.items && events.items.length > 0) {
            for (var i = 0; i < events.items.length; i++) {
                var event = events.items[i];
                if (event.status === 'cancelled') {
                    deleteCanceledEvent(event.id);
                }
                else if (event.start.date) {
                    // All-day event.
                    var start = new Date(event.start.date);
                }
                else {
                    // Events that don't last all day; they have defined start times.
                    start = moment(event.start.dateTime).format("MM/DD/YY HH:mm");
                    var end = moment(event.end.dateTime).format("MM/DD/YY HH:mm");
                    if (event.attendees != null) {
                        var attendeeStr = JSON.stringify(event.attendees);
                        if (attendeeStr.indexOf("dpaight@hemetusd.org") != -1 ||
                            // hemetusd.k12.ca.us_mu0bm8h5amcsfvcvpmim3v1fag@group.calendar.google.com
                            event.description.toString().search(/test/g) != -1) {
                            myEvents.push([
                                event.id,
                                event.summary,
                                start,
                                end,
                                event.description,
                                event.htmlLink
                            ]);
                        }
                    }
                }
            }
            addMyEventsToList(myEvents);
        }
        else {
        }
        pageToken = events.nextPageToken;
    } while (pageToken);
    properties.setProperty('syncToken', events.nextSyncToken);
}
function getSyncedEvents(calendarId, fullSync) {
    fullSync = true;
    calendarId = "dpaight@hemetusd.org";
    // hemetusd.k12.ca.us_mu0bm8h5amcsfvcvpmim3v1fag@group.calendar.google.com
    var myEvents = [];
    var properties = PropertiesService.getScriptProperties();
    var options = {
        maxResults: 100
    };
    var syncToken = properties.getProperty('syncToken');
    if (syncToken && !fullSync) {
        // @ts-ignore
        options.syncToken = syncToken;
    }
    else {
        // Sync events up to thirty (90) days in the past.
        // @ts-ignore
        options.timeMin = getRelativeDate(-90, 0).toISOString();
    }
    // Retrieve events one page at a time.
    var events;
    var pageToken;
    do {
        try {
            // @ts-ignore
            options.pageToken = pageToken;
            //            properties.deleteProperty('syncToken');
            events = Calendar.Events.list(calendarId, options);
            Logger.log('events: %s', JSON.stringify(events));
        }
        catch (e) {
            // Check to see if the sync token was invalidated by the server;
            // if so, perform a full sync instead.
            if (e.message === 'Sync token is no longer valid, a full sync is required.') {
                properties.deleteProperty('syncToken');
                getSyncedEvents(calendarId, true);
                return;
            }
            else {
                throw new Error(e.message);
            }
        }
        if (events.items && events.items.length > 0) {
            for (var i = 0; i < events.items.length; i++) {
                var event = events.items[i];
                if (event.status === 'cancelled') {
                    // deleteCanceledEvent(event.id);
                }
                else if (event.start.date) {
                    // All-day event.
                    var start = new Date(event.start.date);
                }
                else {
                    // Events that don't last all day; they have defined start times.
                    start = moment(event.start.dateTime).format("MM/DD/YY HH:mm");
                    var end = moment(event.end.dateTime).format("MM/DD/YY HH:mm");
                    if (event.attendees != null) {
                        var attendeeStr = JSON.stringify(event.attendees);
                        if (attendeeStr.indexOf("dpaight@hemetusd.org") != -1) {
                            // hemetusd.k12.ca.us_mu0bm8h5amcsfvcvpmim3v1fag@group.calendar.google.com
                            var attendees = condenseAttendees(event.attendees);
                            myEvents.push([
                                event.id,
                                event.summary,
                                start,
                                end,
                                event.description,
                                event.hangoutLink,
                                event.htmlLink,
                                attendees
                            ]);
                        }
                    }
                }
            }
        }
        else {
        }
        pageToken = events.nextPageToken;
    } while (pageToken);
    properties.setProperty('syncToken', events.nextSyncToken);
    if (myEvents.length == 0) {
        var ui = SpreadsheetApp.getUi();
        // ui.alert("No records created. Something is probably broken.");
        var range = ss.getSheetByName('meetings').getRange("A1:H");
        range.clearContent();
        // range = ss.getSheetByName('meetings').getRange("A1:A1");
        // range.setValues([['no iep meetings were found; is something broken?']]);
    }
    else {
        var range = ss.getSheetByName('meetings').getRange("A1:H");
        range.clearContent();
        range = ss.getSheetByName('meetings').getRange(1, 1, myEvents.length, myEvents[0].length);
        range.setValues(myEvents);
    }
}
function getSyncedEventsDpaight(calendarId, fullSync) {
    fullSync = true;
    calendarId = "dpaight@hemetusd.org";
    var myEvents = [];
    var properties = PropertiesService.getScriptProperties();
    var options = {
        maxResults: 100
    };
    var syncToken = properties.getProperty('syncToken');
    if (syncToken && !fullSync) {
        // @ts-ignore
        options.syncToken = syncToken;
    }
    else {
        // Sync events up to thirty (90) days in the past.
        // @ts-ignore
        options.timeMin = getRelativeDate(-90, 0).toISOString();
    }
    // Retrieve events one page at a time.
    var events;
    var pageToken;
    do {
        try {
            // @ts-ignore
            options.pageToken = pageToken;
            //            properties.deleteProperty('syncToken');
            events = Calendar.Events.list(calendarId, options);
        }
        catch (e) {
            // Check to see if the sync token was invalidated by the server;
            // if so, perform a full sync instead.
            if (e.message === 'Sync token is no longer valid, a full sync is required.') {
                properties.deleteProperty('syncToken');
                getSyncedEvents(calendarId, true);
                return;
            }
            else {
                throw new Error(e.message);
            }
        }
        if (events.items && events.items.length > 0) {
            for (var i = 0; i < events.items.length; i++) {
                var event = events.items[i];
                if (event.status === 'cancelled') {
                    // deleteCanceledEvent(event.id);
                }
                else if (event.start.date) {
                    // All-day event.
                    var start = new Date(event.start.date);
                }
                else {
                    // Events that don't last all day; they have defined start times.
                    start = moment(event.start.dateTime).format("MM/DD/YY HH:mm");
                    var end = moment(event.end.dateTime).format("MM/DD/YY HH:mm");
                    if (event.attendees != null) {
                        var attendeeStr = JSON.stringify(event.attendees);
                        if (attendeeStr.indexOf(calendarId) != -1) {
                            var attendees = condenseAttendees(event.attendees);
                            myEvents.push([
                                event.id,
                                event.summary,
                                start,
                                end,
                                event.description,
                                event.hangoutLink,
                                event.htmlLink,
                                attendees
                            ]);
                        }
                    }
                }
            }
        }
        else {
        }
        pageToken = events.nextPageToken;
    } while (pageToken);
    properties.setProperty('syncToken', events.nextSyncToken);
    if (myEvents.length == 0) {
        var ui = SpreadsheetApp.getUi();
        // ui.alert("No records created. Something is probably broken.");
        var range = ss.getSheetByName('meetings').getRange("A1:H");
        range.clearContent();
        // range = ss.getSheetByName('meetings').getRange("A1:A1");
        // range.setValues([['no iep meetings were found; is something broken?']]);
    }
    else {
        var range = ss.getSheetByName('meetings').getRange("A1:H");
        range.clearContent();
        range = ss.getSheetByName('meetings').getRange(1, 1, myEvents.length, myEvents[0].length);
        range.setValues(myEvents);
    }
}
/**
 *
 * @param input
 * @returns  email addresses without the @ sign or anything following the @ sign
 */
function condenseAttendees(input) {
    var a = "";
    for (var i = 0; i < input.length; i++) {
        var el = input[i];
        if (el.email.indexOf("k12") == -1) {
            if (el.organizer == true) {
                a += el.email.replace(/@[A-z0-9]+.[A-z]{3}/g, "") + "(CC)" + ", ";
            }
            else {
                a += el.email.replace(/@[A-z0-9]+.[A-z]{3}/g, "") + ", ";
            }
            a += el.email + ", ";
        }
    }
    return a.replace(/@[A-z0-9]+.[A-z]{3}/g, "");
}
/**
 *
 * @param array
 * @returns nothing, but does filter calendar entries that are mine and records them to 'meetings'
 */
function addMyEventsToList(array) {
    // var _a = array[0], idh = _a[0], summaryh = _a[1], starth = _a[2], endh = _a[3], descriptionh = _a[4], htmlLinkh = _a[5];
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("meetings");
    var values, newEvents = [];
    var last = sheet.getRange('a1:a20').getValues().filter(String).length;
    if (last < 2) {
        values = array;
    }
    else {
        var range = sheet.getRange(1, 1, last, sheet.getLastColumn());
        values = range.getDisplayValues();
        var oldIds = [];
        values.forEach(function (el, i) {
            oldIds.push(el[0]);
        });
        array.forEach(function (el) {
            // each item in the meetings table will be 1) deleted, 2) updated, or 3) left as is
            var id = el[0], summary = el[1], start = el[2], end = el[3], desc = el[4], link = el[5];
            if (oldIds.indexOf(id) === -1) {
                // new event -- push
                values.push(el);
            }
            else {
                // on both lists -- update
                values.splice(oldIds.indexOf(id), 1, el);
            }
        });
    }
    var destRange = sheet.getRange(1, 1, values.length, values[0].length);
    destRange.setValues(values);
}
function deleteCanceledEvent(eventId) {
    var sheet = ss.getSheetByName("meetings");
    var last = ss.getSheetByName('meetings').getRange('A1:A').getValues().filter(String).length;
    if (last > 1) {
        var mtngsRng = sheet.getRange(1, 1, last, sheet.getLastColumn());
        var mtngsVals = mtngsRng.getValues();
        mtngsRng.clearContent();
        mtngsVals.shift();
        for (var i = 0; i < mtngsVals.length; i++) {
            var row = mtngsVals[i];
            if (row[0] == eventId) {
                mtngsVals.splice(i, 1);
            }
        }
        mtngsRng = sheet.getRange(2, 1, mtngsVals.length, mtngsVals[0].length);
        mtngsRng.setValues(mtngsVals);
    }
}
/**
 * Helper function to get a new Date object relative to the current date.
 * @param {number} daysOffset The number of days in the future for the new date.
 * @param {number} hour The hour of the day for the new date, in the time zone
 *     of the script.
 * @return {Date} The new date.
 */
function getRelativeDate(daysOffset, hour) {
    var date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}
function removeOldMeetings() {
    var sheet, range, values, last;
    var sc = CacheService.getScriptCache();
    sheet = ss.getSheetByName('meetings');
    last = ss.getSheetByName('meetings').getRange('a1:a').getValues().filter(String).length;
    if (last > 1) {
        range = sheet.getRange(1, 1, last, sheet.getLastColumn());
        values = range.getValues();
        var headings = values.shift();
        var ids = [0];
        for (var i = values.length - 1; i > 0; i--) {
            var el = values[i];
            if (ids.indexOf(el[1]) == -1) {
                ids.push(el[1]);
            }
            else {
                sc.remove('_' + el[1]);
                values.splice(i, 1);
            }
        }
        sheet.clear();
        headings = ["id", "summary", "start", "end", "desc", "link"];
        values = headings.concat(values);
        var destR = sheet.getRange(2, 1, values.length, values[0].length);
        destR.setValues(values);
    }
}
//# sourceMappingURL=module.jsx.map
function printSelectedLogEntries(stuName, array) {
    var destFile = SpreadsheetApp.openById('1sEkijMXT3j9uIJWPqExmREZ2M8U8pO1olxLo-WgsTtI');
    var destSheet = destFile.getSheets()[0];
    var sheet = ss.getSheetByName('logRespMerged');
    var last = findLastRow('logRespMerged', 1);
    var range = sheet.getRange('A2:F' + (last + 1).toString());
    var entries = range.getValues();
    var headings = [['Timestamp', 'Entries for ' + stuName]];
    var keepers = array;
    keepers = headings.concat(keepers);
    destSheet.clearContents();
    var destRange = destSheet.getRange(1, 1, keepers.length, 2);
    destRange.setValues(keepers);
    SpreadsheetApp.flush();
    var ssFile = DriveApp.getFileById('1sEkijMXT3j9uIJWPqExmREZ2M8U8pO1olxLo-WgsTtI');
    var file = DriveApp.createFile(ssFile.getBlob());
    var url = file.getUrl();
    try {
        var folder = DriveApp.getFolderById('1S7TEP1ixTjhHwZ0APcasGj0fqAaZhvqC');
        folder.createFile(file);
        // var fileUrl = file
    }
    catch (error) {
        Logger.log(error);
        return "failed " + error;
    }
    return {
        'msg': 'contact logs saved to ' + file.getName(),
        'url': url
    };
}
// Compiled using ts2gas 3.6.3 (TypeScript 3.9.7)
// this returns table data to the success Handler on the client side
function getTableData_roster(id) {
    if (id === void 0) {
        id = getLastId();
    }
    var loc = 'loc00';
    var sheetName = 'roster';
    var sheet = ss.getSheetByName(sheetName);
    var lastR = sheet.getRange('B1:B').getDisplayValues().filter(String).length;
    Logger.log('lastR = %s', lastR);
    var lastC = sheet.getLastColumn();
    lastR = (lastR > 1) ? lastR : 2;
    var data = sheet.getRange(2, 1, lastR - 1, lastC).getDisplayValues();
    // var sc = CacheService.getScriptCache();
    // var sp = PropertiesService.getScriptProperties();
    data.sort(function (a, b) { return moment(a[7]) - moment(b[7]); });
    // sc.put('counter', '0');
    // lt_logLogTimeEnd(arguments.callee.toString().match(/function ([^\(]+)/)[1]);
    // Logger.log(JSON.stringify([loc, data, id]));
    return [loc, data, id];
}
// this returns contact log data to the client-side script
// called by "    $("body").on("click", ".setStudent", function (event) {..."
function getLogEntries(array) {
    Logger.log('array = %s', JSON.stringify(array));
    var id = array[0];
    var loc = array[1];
    SpreadsheetApp.flush();
    if (id === void 0) {
        id = getLastId();
    }
    // lt_logLogTimeStart(eval(fname));
    var d1 = new Date();
    // lt_logLogTimeStart(eval(fname));    
    var logEntries = getAllRecords('logRespMerged');
    var logEntriesFilt = doFilter(id, 5, logEntries);
    // var record = record_fat.shift();
    logEntriesFilt.sort(function (a, b) {
        if (moment(a[0]) < moment(b[0])) {
            return 1;
        }
        else if (moment(a[0]) > moment(b[0])) {
            return -1;
        }
        else {
            return 0;
        }
    });
    return [logEntriesFilt, loc];
}
/**
 *
 * @param sheetName
 * @param cBegin
 * @param cEnd
 * @returns all records from named sheet in parameters
 */
function getAllRecords(sheetName) {
    var sheet, last, range, values;
    sheet = ss.getSheetByName(sheetName);
    last = sheet.getRange('A1:A').getValues().filter(String).length;
    if (last < 2) {
        last = 2;
    }
    ;
    range = sheet.getRange(1, 1, last, sheet.getLastColumn());
    values = range.getDisplayValues();
    return values;
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
/**
 * @returns [[data from meetings sheet]]
 */
function getCalData_events() {
    var x = getAllRecords('meetings');
    var y = [];
    for (let i = 0; i < x.length; i++) {
        const element = x[i];
        if (moment(element[2], 'YYYY-MM-DDTHH:mm:SS') < moment()) {
            // do nothing
            Logger.log('did nothing for %s', element[1]);
        }
        else {
            Logger.log('did SOMEthing for %s', element[1]);
            let thisDate = moment(element[2], 'YYYY-MM-DDTHH:mm:SS');
            element.splice(2, 1, moment(thisDate).format('YYYY-MM-DD HH:mm'));
            y.push(element);
        }
    }
    y.sort(function (a, b) {
        if (a[2] > b[2]) {
            return 1;
        }
        else if (a[2] < b[2]) {
            return -1;
        }
        else {
            return 0;
        }
    });
    return y;
}
function getRecord(id) {
    var key = 'rec' + id;
    // if (id === void 0) { id = getLastId().toString(); }
    if (sp.get(key) != null && sp.get(key) != undefined) {
        var found = JSON.parse(sp.get(key));
        Logger.log("found cached record " + JSON.stringify(found));
    }
    else {
        // record was not cached; search for it
        var array = getAllRecords('roster');
        for (var i = 0; i < array.length; i++) {
            Logger.log('after else ran ' + i);
            var el = array[i];
            sp.put('rec' + el[9], JSON.stringify(el));
            // cache all records along the way
            if (id == el[9]) {
                found = el;
                break;
            }
        }
    }
    saveLastId(id);
    return found;
}
/**
 * @returns array with all records from 'roster'
 */
function getRosterValues() {
    var sheetName = 'roster';
    var sheet = ss.getSheetByName(sheetName);
    var lastR = sheet.getRange('B1:B').getDisplayValues().filter(String).length;
    var lastC = sheet.getLastColumn();
    var values = sheet.getRange(1, 1, lastR, lastC).getDisplayValues();
    return values;
}
// this retrieves data from a CSV file obtained from SEIS
// also uses the current ramona students file to look up other values
// function updateRoster() {
//     // get current data
//     var roster = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('roster');
//     var last = roster.getRange('a1:a').getValues().filter(String).length;
//     var rosterVals = roster.getRange(1, 1, last, roster.getLastColumn()).getDisplayValues();
//     var rosterHeadings = rosterVals.shift();
//     // get aeries data for school
//     var allPupilsSheet = ss2.getSheetByName('allPupils');
//     var last = allPupilsSheet.getRange('a1:a').getValues().filter(String).length;
//     var allPupilsArray = allPupilsSheet.getRange(1, 1, last, allPupilsSheet.getLastColumn()).getDisplayValues();
//     var allPupilsHeadings = allPupilsArray.shift();
//     // get seis data
//     var folder = DriveApp.getFolderById('1g1JGj5L6QIIsYG-CLQj9np3m4QgtClLF');
//     var files = folder.getFiles();
//     var fileIds = [];
//     // looking for .csv file
//     var found = false;
//     while (files.hasNext() && found == false) {
//         var file = files.next();
//         var fileName = file.getName();
//         var status; // '1' if parse function is successful
//         if (fileName.toString().search(/roster_seis.csv/) !== -1) {
//             found = true;
//             var sheetName = 'roster_seis';
//             var csvFile = file.getBlob().getDataAsString();
//             fileIds.push(file.getId());
//             var seisData = Utilities.parseCsv(csvFile);
//             var iObj = getIndicesByHeading(seisData[0]);
//             var seisDataHeadings = seisData.shift();
//         }
//     }
//     // find matching records and update with new seis data
//     // new seis data by rows
//     var newRecords = [];
//     for (var i = 0; i < seisData.length; i++) {
//         var elNew = seisData[i];
//         // generate the matching key
//         var dob = elNew[iObj['Date of Birth']];
//         var fn = elNew[iObj['First Name']];
//         var ln = elNew[iObj['Last Name']];
//         var nmJdob = makeMatchVar([ln.toString(), fn.toString(), dob.toString()]);
//         var found = false;
//         // roster table by rows
//         for (var j = 0; j < rosterVals.length; j++) {
//             var elRos = rosterVals[j];
//             if (elRos[0] == nmJdob) {
//                 // update lookups in cols 1-9 (0-8)
//                 // only ones are teachemail and corr
//                 var currentTem = elRos[2];
//                 var updatedTem = getFieldFromNmJdob(elRos[0], allPupilsArray, 27, 24);
//                 if (currentTem != updatedTem) {
//                     rosterVals[j].splice(2, 1, updatedTem);
//                 }
//                 var currentCorr = elRos[6].toString();
//                 var updatedCorr = getFieldFromNmJdob(elRos[0], allPupilsArray, 27, 23);
//                 if (currentCorr != updatedCorr) {
//                     rosterVals[j].splice(6, 1, updatedCorr);
//                 }
//                 var langProf = elRos[7].toString();
//                 var updatedLangProf = getFieldFromNmJdob(elRos[0], allPupilsArray, 27, 13);
//                 if (langProf != updatedLangProf) {
//                     rosterVals[j].splice(7, 1, updatedLangProf);
//                 }
//                 // matched roster row by columns, starting at column 10 (index 9)
//                 found = true;
//                 var updated = [
//                     elNew[0], elNew[1], elNew[2], elNew[3], elNew[4], elNew[5], elNew[6], elNew[7], elNew[8], elNew[9], elNew[10],
//                     elNew[11], elNew[12], elNew[13], elNew[14], elNew[15], elNew[16], elNew[17], elNew[18]
//                 ];
//                 for (var k = 0; k < updated.length; k++) {
//                     rosterVals[j].splice(k + 9, 1, updated[k]);
//                 }
//             }
//         }
//         if (found == false) {
//             newRecords.push([i, nmJdob]);
//         }
//         found = false;
//     }
//     var rows = [];
//     if (newRecords.length > 0) { // i should go 0,2,4...; nmJdob: 1,3,5...
//         for (var i = 0; i < newRecords.length; i++) {
//             nmJdob = newRecords[i][1]; //.toString();
//             var element = seisData[newRecords[i][0]];
//             var key, id, tem, u1, u2, u3, u4, u5, u6;
//             key = nmJdob;
//             id = getFieldFromNmJdob(nmJdob, allPupilsArray, 27, 0);
//             tem = getFieldFromNmJdob(nmJdob, allPupilsArray, 27, 24);
//             u1 = "";
//             u2 = getFieldFromNmJdob(nmJdob, allPupilsArray, 27, 16);
//             u3 = "";
//             u4 = "";
//             u5 = getFieldFromNmJdob(nmJdob, allPupilsArray, 27, 13);
//             ;
//             u6 = "";
//             rows.push([key, id.toString(), tem, u1, u2, u3, u4, u5, u6,
//                 element[0], element[1], element[2], element[3], element[4], element[5], element[6], element[7], element[8], element[9],
//                 element[10],
//                 element[11], element[12], element[13], element[14], element[15], element[16], element[17], element[18]]);
//             rows[i].splice(0, 1, nmJdob);
//             rows[i].splice(1, 1, id);
//             rows[i].splice(2, 1, tem);
//             // rows[i].splice(3,1,nmJdob);
//             rows[i].splice(4, 1, u2);
//             // rows[i].splice(5,1,nmJdob);
//             // rows[i].splice(6,1,nmJdob);
//             // rows[i].splice(7,1,nmJdob);
//             // rows[i].splice(8,1,nmJdob);
//             //  id, tem, u1, u2, u3, u4, u5, u6);
//         }
//         rosterVals = rosterVals.concat(rows);
//     }
//     rosterVals.unshift(rosterHeadings);
//     var destRng = roster.getRange(1, 1, rosterVals.length, rosterVals[0].length);
//     destRng.setValues(rosterVals);
// }
function addTimTest() {
    var fileIdS, fileIdD, lastCol, last, destSheet, destR;
    var filesS = ['1SKGEJsXdRcjvGUGT-C6n39JQkINVa_iOiXIYYToEv24', '1enI0CF5MHtkZ1CTRC2xQDSa8EVxTTQvuMlR38_JdgJo'];
    var filesD = ['1HoulMp8RlpCxvN4qf10TbxW1vzxzTjbA8xKhFjRdZY8', '1P8Pa_174aEJbHXE0ZtmUTaTS4SN-o901dacT-Hsknf4'];
    var lastCols = [25, 28];
    for (let i = 0; i < 2; i++) {
        fileIdS = filesS[i]; // test record
        fileIdD = filesD[i]; // current res
        lastCol = lastCols[i];
        var timT = SpreadsheetApp.openById(fileIdS)
            .getSheets()[0]
            .getRange(1, 1, 1, lastCol)
            .getValues();
        destSheet = SpreadsheetApp.openById(fileIdD).getSheets()[0];
        last = destSheet.getRange('A1:A').getValues().filter(String).length;
        destR = destSheet
            .getRange(last + 1, 1, 1, lastCol);
        destR.setValues(timT);
    }
}
function makeLevelsShortcut(id) {
    if (id === void 0) {
        id = getLastId();
    }
    var sheet, range, values, last;
    sheet = ss.getSheetByName('levels');
    last = sheet.getRange('A1:A').getValues().filter(String).length;
    range = sheet.getRange(2, 1, last - 1, sheet.getlastColumn());
    values = range.getValues();
    var Timestamp = values[0], email = values[1], name = values[2], idLvls = values[3], prefs = values[4], oral = values[5], oral1 = values[6], reading = values[7], reading1 = values[8], reading2 = values[9], reading3 = values[10], reading4 = values[11], writing = values[12], writing1 = values[13], writing2 = values[14], writing3 = values[15], math = values[16], math1 = values[17], math2 = values[18], math3 = values[19], workHabits = values[20], workHabits1 = values[21], motor = values[22], health = values[23], attendance = values[24], playground = values[25];
    var levels = {
        'Timestamp': Timestamp,
        'email': email,
        'name': name,
        'id': id,
        'prefs': prefs,
        'oral': oral,
        'oral1': oral1,
        'reading': reading,
        'reading1': reading1,
        'reading2': reading2,
        'reading3': reading3,
        'reading4': reading4,
        'writing': writing,
        'writing1': writing1,
        'writing2': writing2,
        'writing3': writing3,
        'math': math,
        'math1': math1,
        'math2': math2,
        'math3': math3,
        'workHabits': workHabits,
        'workHabits1': workHabits1,
        'motor': motor,
        'health': health,
        'attendance': attendance,
        'playground': playground
    };
    var c = ""; // clipboard
    var bt = '","'; // between (items)
    var fQ = "From general ed teacher's responses to a questionnaire: "; //from questionnaire
    // build clipboard contents
    c += "";
    // {={clipboard}["reading"]}
    // {key: tab}{click}{={clipboard}["writing"]}
    // {key: tab}{click}{={clipboard}["math"]}
    // {key: tab}{click}{={clipboard}["lang"]}
    // {key: tab}{={clipboard}["motor"]}
    // {key:tab}{click}{={clipboard}["bhvr"]}; {key: tab}{={clipboard}["health"]}
    // {key:tab}{click}{={clipboard}["wrkHbts"]}{key: tab}{click}
    // {={clipboard}["adptvBhvr"]}
    // "prefs" = "art, PE", "lang" = "language skills are delayed:; Xavier tries hard and never gives up in class. He is respectful and gets along with peers. Xavier is far below basic in reading, language arts. His map scores have remained far below grade level since kindergarten. His guided reading level is D and he is in a daily reading group with three other students before the national emergency to stay home. He has difficulty completing seat work in language arts when compared to peers his same age. He cannot keep up in class with subject matter. He tries to copy a little bit of words to make a sentence but needs a great deal of extra time. He attended Mrs. Paight's ELL group 5 days a week for 30 minutes and worked on activities at their individual level. Where they practice listening, speaking, copying, writing complete sentences and sharing ideas. Xavier has difficulty writing his own complete sentences. They also practiced writing together sentences and then copied them. Wen asked a question, Xavier will answer in one or two words. ", "reading" = "student reads substantially below grade level; segmenting words into their component phonemes, blending sounds into words when presented aurally, consonant digraphs (e.g., ch, th, ng), vowel digraphs (e.g., ai, oa, ay), reading silent e words, reading words with consonant clusters (e.g., st, pr, bl, etc.), syllabication; He can read the high frequency words at kindergarten level and a few of 1st grade. ; approx. grade level for reading comprehension: He has a low and is not progressing from kindergarten level at the same rate when compared to peers his same age. He needs extra time to answer questions in whole group and usually only gives one word answers.; When he is reading is seems like it takes a little while for the visual to catch up with his use of language and speech. He is given more time to respond and I use lower level questions so he can have success in whole group and small group instruction. I was sending home level D books from reading group and Xavier seemed to enjoy the books as he read with me.", "writing" = "written expression skills are substantially below grade level; ending punctuation, use of standard spelling, use of invented spelling (e.g., leaves out important phonetic elements 'par' for 'paper'); writing includes minimal content, ideas are poorly organized; has difficulty writing a coherent paragraph, thoughts are incomplete at the sentence level (not due simply to poor punctuation), He can copy short sentences we have written together. ; I noticed his copying was progressing with Mr. Paight smaller group instruction and he was drawing wonder pictures to go with his writing. But he doesn't create coherent sentences or a paragraph on is own yet.", "math" = "student's math skills are substantially below grade level; Xavier tries hard to understand what we are learning in class. He can add a few numbers when adding and subtracting two digit numbers. However, timed tests he doesn't seem to be able to get more than 5- 10 correct out of 100 problems for 5 minutes. He has difficulty with math fluency. He is far below grade level in math. He likes to use the manipulatives and use drawing with his math problems. His map testing went up 3 points since kindergarten. He cannot comprehend regrouping math 3 digit numbers being added or subtracted complete second grade math. He needs a space to learn where there are a smaller amount of students in the room.; Xavier loves to use drawing in math. I think draw can help him but he still is a lot of difficulty. He needs a lot of support with word problems and cannot complete them by himself. I think comprehension and language limits his ability in word problems. I had him seated by a bilingual student that could help him with math and reading. I also had him in the front row for learning in whole group instruction. I would have him come to the round table for small group instruction in math with his math lessons after instruction.  However he has difficulty still completing math at the second grade level by himself. ; Xavier needs material at a lower level in math to differentiate math lessons. I put him at a lower level for Eureka math with Zearn to help him with gaps. ", "wrkHbts" = "Xavier tries hard. He needs a few reminders to take out his work or begin working. He is a nice young boy and is a pleasure to work with in class.  I miss working with Xavier.", "bhvr" = "He is respectful and tries to listen to instruction. I find him playing with manipulative or drawing on his page. I redirect him back to the problem or page. He doesn't bother anyone else when that happens. ; He has great behavior out of class on the playground.  ", "adptvBhvr" = "Adaptive behaviors (everyday living skills such as walking, talking, getting dressed, going to school, preparing a snack, picking up around the house) are age-appropriate (similar to those of other children at this age)., He needs a little more time to assimilate what is communicated and help with comprehension skills.", "health" = "no chronic health issues are documented in school records", "motor" = "gross-motor skills are age-appropriate (participates in recess games and PE on par with peers), fine-motor skills appear to be delayed (judging from performance on printing/coloring/cutting activities)"
}
function levData(id = '1010101') {
    var sheet = ss.getSheetByName('lop_mirror2');
    var last = sheet.getRange('A1:A').getDisplayValues().filter(String).length;
    var values = sheet.getRange(1, 1, last, sheet.getLastColumn()).getValues();
    var headings = values.shift();
    for (let i = values.length - 1; i > -1; i--) {
        const el = values[i];
        if (el[3].toString() == id.toString()) {
            return el;
        }
    }
    return '["baseln"="for baseline data, refer to the appropriate section on the Levels of Performance page"]';
}
function getPresentLevelsAsTextBlazeListItem(seisId = '1010101', areas = ['reading', 'writing', 'math', 'lang', 'motor', 'bhvr', 'health', 'wrkHbts', 'prefs']) {
    var lvlsRecord = levData(seisId);
    if (lvlsRecord.toString().search(/baseln/) != -1) {
        return lvlsRecord;
    }
    else {
        var list = new LevelsPerformance(lvlsRecord);
        var wholeSnip = list.getSnip(areas);
        // Logger.log(wholeSnip);
        return wholeSnip;
    }
}
function LevelsPerformance(el) {
    this['lvls'] = {};
    this['lvls'].bhvr1play = (el[25].length > 0) ?
        'teacher observation: ' + el[25].toString().replace(/"/g, "'") :
        '';
    this['lvls'].heal11th = el[23].toString().replace(/"/g, "'");
    this['lvls'].heal2thattendance = el[24].toString().replace(/"/g, "'");
    this['lvls'].langOverall = (el[5].length > 0) ?
        'teacher observation: ' + el[5].toString().replace(/"/g, "'") :
        '';
    this['lvls'].langOther = el[6].toString().replace(/"/g, "'");
    this['lvls'].math1Overall =
        (el[16].length > 0) ?
            'teacher observation: ' + el[16].toString().replace(/"/g, "'") :
            '';
    this['lvls'].math2Facts = el[17].toString().replace(/"/g, "'");
    this['lvls'].math3Calc = el[18].toString().replace(/"/g, "'");
    this['lvls'].math4Reasoning = el[19].toString().replace(/"/g, "'");
    this['lvls'].math5Other = el[26].toString().replace(/"/g, "'");
    this['lvls'].moto1rM = (el[22].length > 0) ?
        'teacher observation: ' + el[22].toString().replace(/"/g, "'") :
        '';
    this['lvls'].name = el[2].toString().replace(/"/g, "'");
    this['lvls'].prefs = el[4].toString().replace(/"/g, "'");
    this['lvls'].read1Overall = (el[7].length > 0) ?
        'teacher observation: ' + el[7].toString().replace(/"/g, "'") :
        '';
    this['lvls'].read2Found = el[8].toString().replace(/"/g, "'");
    if (el[9].toString().length > 0) {
        this['lvls'].read3HighFreq = el[9].toString().replace(/"/g, "'");
    }
    else {
        this['lvls'].read3HighFreq = '';
    }
    if (el[10].toString().length > 0) {
        this['lvls'].read4Comp = (el[10].length > 0) ?
            'comprehension level (GE) = ' + el[10].toString().replace(/"/g, "'") :
            '';
    }
    this['lvls'].read5Other = el[11].toString().replace(/"/g, "'");
    this['lvls'].stuId = el[3].toString().replace(/"/g, "'");
    this['lvls'].timestamp = el[0].toString().replace(/"/g, "'");
    this['lvls'].wrkH1bts = el[20].toString().replace(/"/g, "'");
    this['lvls'].wrkH2bts = (el[21].length > 0) ?
        'able to attend to a classwork task at instructional level for ' + el[21].toString().replace(/"/g, "'") + ' minutes' :
        '';
    this['lvls'].writ1eOverall = (el[12].length > 0) ?
        'teacher observation: ' + el[12].toString().replace(/"/g, "'") :
        '';
    this['lvls'].writ2eMech = el[13].toString().replace(/"/g, "'");
    this['lvls'].writ3eContent = el[14].toString().replace(/"/g, "'");
    this['lvls'].writ4eOther = el[15].toString().replace(/"/g, "'");
    this.getSnip = function (snipAreas) {
        // initialize the string vars for making snip lists
        // snipAreas are those collections of questionnaire answers, collections that Tblaze uses to fill forms
        // convert object to an array object named 'ary'
        this['lvlsAry'] = [];
        for (const key in this.lvls) {
            if (Object.prototype.hasOwnProperty.call(this.lvls, key)) {
                const el = [key, this.lvls[key]];
                this.lvlsAry.push(el);
            }
        }
        // Logger.log('this.lvlsAry is %s', JSON.stringify(this.lvlsAry));
        // Logger.log('the length of this.lvlsAry is ' + this.lvlsAry.length);
        var wholeSnip = '';
        // wholeSnip is a set of snipAreas:  {["snipArea"="content of snip", "snipArea"="content of snip"]}
        var partSnip = '';
        // a partSnip is a single snipArea
        // iterate through list of areas on which to make items in a snip list
        for (let i = 0; i < snipAreas.length; i++) {
            const element = snipAreas[i];
            var partialSnipArea = element.toString().slice(0, 4);
            if (i > 0) {
                partSnip += ', ';
            }
            partSnip += '"' + element + '"=' + '"'; // opening " for value
            for (let j = 0; j < this.lvlsAry.length; j++) {
                const kyval = this.lvlsAry[j];
                var partialKey = kyval[0].toString().slice(0, 4);
                if (partialSnipArea == partialKey && kyval[1].toString().length > 0) {
                    partSnip += kyval[1] + '; '; // ; separator for items within area
                }
            }
            partSnip += '"'; // closing " for value
            if (partSnip.length > 2) {
                wholeSnip += partSnip;
            }
            else {
                wholeSnip += '"' + snipAreas[i] + '"=""';
            }
            partSnip = '';
        }
        wholeSnip = '[' + wholeSnip + ']';
        return wholeSnip;
    };
    this.getSnip_old = function (snipAreas) {
        // initialize the string vars for making snip lists
        // snipAreas are those collections of questionnaire answers, collections that Tblaze uses to fill forms
        // convert object to an array object named 'ary'
        this['lvlsAry'] = [];
        for (const key in this.lvls) {
            if (Object.prototype.hasOwnProperty.call(this.lvls, key)) {
                const el = [key, this.lvls[key]];
                this.lvlsAry.push(el);
            }
        }
        // Logger.log('this.lvlsAry is %s', JSON.stringify(this.lvlsAry));
        // Logger.log('the length of this.lvlsAry is ' + this.lvlsAry.length);
        var wholeSnip = '[';
        // wholeSnip is a set of snipAreas:  {["snipArea"="content of snip", "snipArea"="content of snip"]}
        var partSnip = '';
        // a partSnip is a single snipArea
        // iterate through list of areas on which to make items in a snip list
        for (let i = 0; i < snipAreas.length; i++) {
            const element = snipAreas[i];
            var partialSnipArea = element.toString().slice(0, 4);
            var counter = 0;
            for (const key in this.lvls) {
                if (Object.prototype.hasOwnProperty.call(this.lvls, key)) {
                    const el = this.lvls[key];
                    counter++;
                    // areas ('math', 'read', 'writ', etc) are contained in first 4 characters of the key and 'snipArea'
                    // this should gather all the parts that match the category
                    var partialKey = key.toString().slice(0, 4);
                    if (partialSnipArea == partialKey) {
                        partSnip += el + '; ';
                    }
                    if (counter >= 26) {
                        partSnip = partSnip.toString().replace(/"/, "'");
                        partSnip = '"' + element + '"="' + partSnip + '"';
                        // now we have "area"="value of area"
                        wholeSnip = (wholeSnip == '[') ?
                            // if this is the firs addition to wholeSnip, omit the comma
                            wholeSnip + partSnip :
                            wholeSnip + ',' + partSnip;
                        partSnip = '';
                    }
                }
            }
        }
        if (wholeSnip) {
            wholeSnip = wholeSnip.toString().replace(/,$/, '');
            wholeSnip += ']';
            wholeSnip = wholeSnip.toString().replace(/[; ]+/g, '; ');
        }
        // Logger.log('wholeSnip = %s; snipAreas = %s', wholeSnip, JSON.stringify(snipAreas));
        // Logger.log('partSnip = %s; wholeSnip = %s; i = %s; snipArea = %s', partSnip, wholeSnip, i, snipAreas[i]);
        return wholeSnip;
    };
    this.getSnipGoal = function (snipAreas) {
        // initialize the string vars for making snip lists
        // snipAreas are those collections of questionnaire answers, collections that Tblaze uses to fill forms
        // wholeSnip is a set of snipAreas:  {["snipArea"="content of snip", "snipArea"="content of snip"]}
        var partSnip = this.getSnip(snipAreas);
        partSnip = partSnip.toString().replace(/"snipAreas[0]="/, '"baseln"=');
        partSnip = partSnip.toString().replace(/\]/, '');
        // a partSnip is a single snipArea
        // iterate through list of areas on which to make items in a snip list
        var wholeSnip = partSnip + ']';
        // now we have "baseln"="value of area"
        if (wholeSnip) {
            wholeSnip = wholeSnip.toString().replace(/,$/, '');
            wholeSnip.toString().replace(/[; ]+/g, '; ');
        }
        // Logger.log('wholeSnip = %s; snipAreas = %s', wholeSnip, JSON.stringify(snipAreas));
        // Logger.log('partSnip = %s; wholeSnip = %s; i = %s; snipArea = %s', partSnip, wholeSnip, i, snipAreas[i]);
        return wholeSnip;
    };
}
;
function addStudentByIdFromRESstudentsServer(obj) {
    obj = { "first": "", "last": "", "StudentID": "135262", "lastAnnual": "", "lastEval": "", "seisID": "135262" };
    var sheet = ss2.getSheetByName('allPupils');
    var last = sheet.getRange('A1:A').getValues().filter(String).length;
    var lastCol = sheet.getLastColumn();
    var range = sheet.getRange(1, 1, last, lastCol);
    var values = range.getValues();
    var headings = values.shift();
    var iObj = getIndicesByHeading(headings);
    var stuId = obj.StudentID;
    var lastAnnual = obj.lastAnnual;
    var lastEval = obj.lastEval;
    var seisID = obj.seisID;
    for (let i = 0; i < values.length; i++) {
        const el = values[i];
        if (stuId == el[0]) {
            var stuToAdd = el;
            break;
        }
    }
    var rosterHeadings = ss.getSheetByName('roster').getRange(1, 1, 1, 29).getValues().flat();
    var newRosterRecord = [[]];
    for (let i = 0; i < rosterHeadings.length; i++) {
        const el = rosterHeadings[i].toString().toLowerCase();
        var index = parseInt(iObj[el]);
        newRosterRecord[0].push(stuToAdd[index]);
    }
    Logger.log(JSON.stringify(newRosterRecord));
    var roster = ss.getSheetByName('roster');
    var last = roster.getRange('A1:A').getValues().filter(String).length;
    var destRange = roster.getRange(last + 1, 1, 1, newRosterRecord.length);
    destRange.setValues([newRosterRecord]);
    return seisID;
    //  [nmJdob, idAeries, teachemail, u1_phone, stuemail, u3_Parent_1a_Email, corrlng, langFlu, u6_teacher,
    //     SEIS_ID, Last_Name, First_Name, Date_of_Birth, Case_Manager, Date_of_Last_Annual_IEP, Date_of_Last_Evaluation,
    //     Date_of_Initial_Parent_Consent, Parent_1_Mail_Address, Parent_1_Email, Parent_1_Home_Phone, Parent_1_Cell_Phone,
    //     Grade_Code, Student_Eligibility_Status, Disability_1, Disability_2, Parent_Guardian_1_Name, Parent_Guardian_2_Name,
    //     Date_of_Next_Annual_IEP, readingGroup, notes, meet]
}
function getRecordIndex(nmJdob, allPupilsArray, allPupilsHeadings) {
    var index = allPupilsHeadings.indexOf("nmjdob");
    for (let p = 0; p < allPupilsArray.length; p++) {
        const pel = allPupilsArray[p];
        if (nmJdob.toLowerCase() == pel[index].toLowerCase()) {
            return p;
        }
    }
}
function matchRosterFieldsToSeisAndAllPupils(rosH, seisH, alpH) {
    var fieldMatches = {};
    for (let i = 0; i < rosH.length; i++) {
        var thisFieldName = rosH[i];
        var thisFieldIndexes = fieldMatches[thisFieldName] = [];
        thisFieldIndexes.push(i);
        thisFieldIndexes.push(seisH.indexOf(thisFieldName));
        thisFieldIndexes.push(alpH.indexOf(thisFieldName));
    }
    Logger.log('fieldMatches = %s', JSON.stringify(fieldMatches));
    return fieldMatches;
}
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
    var folder = DriveApp.getFolderById('1-gZV54ZzShjlmfu91rBmdD7G-XK6Z7bK');
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
            var apRi = getRecordIndex(seisNmjdob, allPupilsArray, allPupilsHeadings);
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
function foldersFromNames() {
    var filing = DriveApp.getFolderById('0B3J9971qOaVIUUlCWXRCbTNjcUE');
    var sheet = ss.getSheetByName('roster');
    var last = findLastRow('roster', 1);
    var range = sheet.getRange('A2:A22');
    var entries = range.getValues().flat();
    for (let i = 0; i < entries.length; i++) {
        const element = entries[i];
        filing.createFolder(element);
    }
}
function fileInFolders() {
    var sheet = ss.getSheetByName('roster');
    var last = findLastRow('roster', 1);
    var range = sheet.getRange('K2:K' + last);
    // these are last names -- something that will be in both the file name and its destination folder name
    var entries = range.getValues().flat();
    // this is the parent folder of the folders and files 
    var filing = DriveApp.getFolderById('0B3J9971qOaVIUUlCWXRCbTNjcUE');
    // these are the folders into which docs will be filed
    var folders = filing.getFolders();
    // these are the files 
    while (folders.hasNext()) {
        var folder = folders.next();
        var folderName = folder.getName();
        var files = filing.getFiles();
        for (let i = 0; i < entries.length; i++) {
            var elLn = new RegExp(entries[i], "gi");
            if (folderName.search(elLn) != -1) {
                files = filing.getFiles();
                while (files.hasNext()) {
                    var file = files.next();
                    var fileName = file.getName();
                    if (fileName.search(elLn) != -1) {
                        folder.addFile(file);
                        filing.removeFile(file);
                    }
                }
            }
        }
    }
}
// Compiled using ts2gas 3.6.4 (TypeScript 4.2.4)
// Compiled using ts2gas 3.6.4 (TypeScript 4.2.4)
function scanForTasks() {
    // if (moment().month() < 8) { return };
    var taskSheet = ss.getSheetByName('tasks');
    var last = taskSheet.getRange('A1:A').getValues().filter(String).length;
    last = (last < 2) ? 1 : last;
    var taskRange = taskSheet.getRange('D2:D' + last);
    var taskNotesVals = taskRange.getValues().flat();
    var array = [];
    var values = getAllRecords('roster');
    var headings = values.shift();
    var iObj = getIndicesByHeading(headings);
    var taskList = getTaskLists();
    var taskListId = taskList[0].id;
    var tasks = getTasks(taskListId);
    var nextYear = (moment().month() < 5) ?
        moment((moment().year()).toString() + '-08-01', 'YYYY-MM-DD') :
        moment((moment().year() + 1).toString() + '-08-01', 'YYYY-MM-DD');
    Logger.log('nextYear is %s', moment(nextYear).format('YYYY-MM-DD'));
    for (let i = 0; i < values.length; i++) {
        var el = values[i];
        var anl = moment(el[iObj['date_of_last_annual_iep']], 'YYYY-MM-DD');
        var tri = moment(el[iObj['date_of_last_evaluation']], 'YYYY-MM-DD');
        var nxtAnl = moment(anl).add(1, 'y');
        var nxtTri = moment(tri).add(3, 'y');
        Logger.log('Anl is %s; Tri is %s', moment(anl).format('YYYY-MM-DD'), moment(tri).format('YYYY-MM-DD'));
        Logger.log('nxtAnl is %s; nxtTri is %s', moment(nxtAnl).format('YYYY-MM-DD'), moment(nxtTri).format('YYYY-MM-DD'));
        var fn = el[iObj['first_name']];
        var ln = el[iObj['last_name']];
        var id = el[iObj['seis_id']];
        var nmjdob = el[iObj['nmjdob']];
        var langflu = el[iObj['langflu']];
        var key = nmjdob;
        if (taskNotesVals.indexOf(key + id) > -1) {
            // do nothing
        }
        else {
            var title = 'sched meet: ' + fn + ' ' + ln + '; \nanl: ' + moment(nxtAnl).format('YYYY-MM-DD') + '; \ntri: ' +
                '; ' + moment(nxtTri).format('YYYY-MM-DD') +
                '\n--send Levels questionnaire' +
                '\n--do informal assessments' + '\n[' + key + '] ';
            if (moment(nxtAnl).isBefore(moment(nxtTri))) {
                var due = moment(nxtAnl).subtract(40, 'd').format('YYYY-MM-DD') + 'T00:00:00.000Z';
                title += 'annual review; ';
            }
            if (moment(nxtTri).isBefore(moment(nextYear))) {
                var due = moment(nxtTri).subtract(70, 'd').format('YYYY-MM-DD') + 'T00:00:00.000Z';
                title += 'triennial review is due; ';
            }
            if (langflu.toString().search(/3/g) !== -1) {
                title += '\narrange for interpreter if needed; ';
                due = moment(due).subtract(7, 'd').format('YYYY-MM-DD') + 'T00:00:00.000Z';;
            }
            var task = {
                'title': title,
                'notes': key + id,
                'due': due
            };
            try {
                var newTask = Tasks.Tasks.insert(task, taskListId);
                //@ts-ignore
                var newTaskId = newTask.getId();
                array.push(newTask);
            }
            catch (error) {
                Logger.log('error: %s', error);
            }
        }
    }
    Logger.log(JSON.stringify(array));
    var last = taskSheet.getRange('A1:A').getValues().filter(String).length;
    last = (last < 2) ? 1 : last;
    var taskArray = [];
    if (array.length > 0) {
        for (let i = 0; i < array.length; i++) {
            const el = array[i];
            taskArray.push([el.id, el.title, el.due, el.notes]);
        }
        var range = taskSheet.getRange(last + 1, 1, taskArray.length, taskArray[0].length);
        range.setValues(taskArray);
    }
}
/**
 * Returns the ID and name of every task list in the user's account.
 * @return {Array.<Object>} The task list data.
 */
function getTaskLists() {
    //@ts-ignore
    var taskLists = Tasks.Tasklists.list().getItems();
    if (!taskLists) {
        return [];
    }
    return taskLists.map(function (taskList) {
        Logger.log(JSON.stringify({
            id: taskList.getId(),
            name: taskList.getTitle()
        }));
        return {
            id: taskList.getId(),
            name: taskList.getTitle()
        };
    });
}
/**
 * Returns information about the tasks within a given task list.
 * @param {String} taskListId The ID of the task list.
 * @return {Array.<Object>} The task data.
 */
function getTasks(taskListId) {
    //@ts-ignore
    var tasks = Tasks.Tasks.list(taskListId).getItems();
    if (!tasks) {
        return [];
    }
    return tasks.map(function (task) {
        return {
            id: task.getId(),
            title: task.getTitle(),
            notes: task.getNotes(),
            due: task.getDue(),
            completed: Boolean(task.getCompleted())
        };
    }).filter(function (task) {
        return task.title;
    });
}
/**
 * Sets the completed status of a given task.
 * @param {String} taskListId The ID of the task list.
 * @param {String} taskId The ID of the task.
 * @param {Boolean} completed True if the task should be marked as complete, false otherwise.
 */
function setCompleted(taskListId, taskId, completed) {
    var task = Tasks.newTask();
    if (completed) {
        //@ts-ignore
        task.setStatus('completed');
    }
    else {
        //@ts-ignore
        task.setStatus('needsAction');
        //@ts-ignore
        task.setCompleted(null);
    }
    Tasks.Tasks.patch(task, taskListId, taskId);
}
/**
 * Adds a new task to the task list.
 * @param {String} taskListId The ID of the task list.
 * @param {String} title The title of the new task.
 */
function getTasksB(taskListId) {
    taskListId = "MDU5NzU5MzE5MTQxNzk5NDEzODU6MDow";
    //@ts-ignore
    var tasks = Tasks.Tasks.list(taskListId).getItems();
    if (!tasks) {
        return [];
    }
    Logger.log(JSON.stringify(tasks));
    Logger.log(JSON.stringify(tasks));
}
function addTask0(taskListId) {
    taskListId = 'MDU5NzU5MzE5MTQxNzk5NDEzODU6MDow';
    var task = {
        title: 'Pick up dry cleaning',
        notes: 'Remember to get this done!'
    };
}
//# sourceMappingURL=module.jsx.map
//# sourceMappingURL=module.jsx.map