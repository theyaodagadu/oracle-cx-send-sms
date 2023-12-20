require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const app = express();
const calls = require("./components/calls.js");
const baseUrl = process.env.ORA_BASE_URL + "/serviceRequests?onlyData=true&fields=SrNumber,PrimaryContactFormattedPhoneNumber,PrimaryContactPartyName,SrCategoryType_c,StatusTypeCd,AcknowledgeMsg_c,ResolutionMsg_c&limit=500";
const contactsUrl  = process.env.ORA_BASE_URL + "/contacts?onlyData=true&fields=PartyId,PersonDEO_IsFdCustomer_c,ContactName,FirstName,PersonDEO_StaffId_c,FormattedMobileNumber&limit=500";
const orcAuth = process.env.ORA_KEY; 
const orcHeader = {
    "Content-Type": "application/vnd.oracle.adf.resourceitem+json"
};

//const date = new Date().toJSON().substring(0,10);

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html")
})

app.get("/newsrs", (req, res) => {
    //Get a list of all SRs Created on a date
    //Loop through 
    console.log("current date: " + calls.currDate());
    const url = baseUrl + "&orderBy=CreationDate:desc&q=CreationDate LIKE '" + calls.currDate() + "%'";
    //console.log(url);
    
    const options = {
        method: "GET",
        auth: orcAuth,
        headers: orcHeader
    }

    let chunks = [];

    https.get(url, options, function(response) {
        response.on("data", function (data) {
            chunks.push(data)}).on("end", function() {
                let fData = Buffer.concat(chunks);
                const info = JSON.parse(fData);
                //console.log(chunks);

                console.log(info.items);
                info.items.forEach(sr => {
                    if (!sr.PrimaryContactFormattedPhoneNumber || sr.PrimaryContactFormattedPhoneNumber.length > 15 ) {
                        console.log("Invalid Number |" + sr.PrimaryContactFormattedPhoneNumber + " | " + sr.SrNumber);
                        //calls.updateSrAcknowledgeMsg(sr.SrNumber);
                    } else {
                        if (sr.StatusTypeCd === "ORA_SVC_NEW" && sr.AcknowledgeMsg_c != "Y" && sr.SrCategoryType_c == "REQUEST") {
                        //send sms
                        //Dear Desmond, Your complaint has been logged successfully with SR Number xxxxxxxxxx
                        let msg = "Dear " + calls.initCap(sr.PrimaryContactPartyName.split(' ').slice(0,1)) + ", Your "+ 
                            sr.SrCategoryType_c.toLowerCase() + " has been logged successfully with SR Number: " + sr.SrNumber;
                        calls.infobipCall(sr.PrimaryContactFormattedPhoneNumber, msg);
                        calls.updateSrAcknowledgeMsg(sr.SrNumber);
                        //update SR Data, to skip the next time it is run
                        //Dear Desmond, Your complaint has been logged with SR Number xxxxxxxxxx. 
                        //If unresolved after 30 days, you may escalate to the Bank of Ghana.
                        } else if (sr.StatusTypeCd === "ORA_SVC_NEW" && sr.AcknowledgeMsg_c != "Y" && sr.SrCategoryType_c == "COMPLAINT") {
                            //send sms
                            //Dear Desmond, Your complaint has been logged successfully with SR Number xxxxxxxxxx
                            let msg = "Dear " + calls.initCap(sr.PrimaryContactPartyName.split(' ').slice(0,1)) + ", Your "+ 
                                sr.SrCategoryType_c.toLowerCase() + " has been logged successfully with SR Number: " + sr.SrNumber+
                                ". If unresolved after 30 days, you may escalate to the Bank of Ghana";
                            calls.infobipCall(sr.PrimaryContactFormattedPhoneNumber, msg);
                            calls.updateSrAcknowledgeMsg(sr.SrNumber);
                            //update SR Data, to skip the next time it is run
                            //Dear Desmond, Your complaint has been logged with SR Number xxxxxxxxxx. 
                            //If unresolved after 30 days, you may escalate to the Bank of Ghana.
                        }
                    }
                    
               }); 
               res.send("Process Completed");
                // Loop through for New Items   
        });
    }).on('error', (e) => {
        console.error(e);
      }); 
    
});

app.get("/resolvedsrs", (req, res) => {
    //Get a list of all SRs Created on a date
    //Loop through 
    console.log("current date: " + calls.currDate());
    const url = baseUrl + "&orderBy=LastResolvedDate:desc&q=LastResolvedDate LIKE '" + calls.currDate() + "%'";

    const options = {
        method: "GET",
        auth: orcAuth,
        headers: orcHeader
    }

    let chunks = [];

    https.get(url, options, function(response) {
        response.on("data", function (data) {
            chunks.push(data)}).on("end", function() {
                let fData = Buffer.concat(chunks);
                const info = JSON.parse(fData);

                //console.log(info.items);
                info.items.forEach(sr => {
                    if (!sr.PrimaryContactFormattedPhoneNumber || sr.PrimaryContactFormattedPhoneNumber.length > 15 ) {
                        console.log("Invalid Number |" + sr.PrimaryContactFormattedPhoneNumber + " | " + sr.SrNumber);
                    } else {
                        if (sr.StatusTypeCd === "ORA_SVC_RESOLVED" && sr.ResolutionMsg_c != "Y" && sr.SrCategoryType_c != "ENQUIRY") {
                        //send sms
                        //Dear Desmond, Your complaint lodged with ticket number ******** has been resolved. 
                        //For any further inquiries please contact us on 0302745454/0800110124
                        let msg = "Dear " + calls.initCap(sr.PrimaryContactPartyName.split(' ').slice(0,1)) +", Your "+ 
                            sr.SrCategoryType_c.toLowerCase() + " lodged with ticket number " + sr.SrNumber + " has been resolved. "+
                            "For any further inquiries please contact us on 0302745454/0800110124";
                        calls.infobipCall(sr.PrimaryContactFormattedPhoneNumber, msg);
                        calls.updateSrResolutionMsg(sr.SrNumber);
                        //update SR Data, to skip the next time it is run
                        } 
                    }
                    
                });
                res.send("Process Completed");
                // Loop through for New Items

        });
    })
});

app.get("/birthdays", (req, res) => {
    //Get a list of all SRs Created on a date
    //Loop through 
    console.log("current date: " + calls.currDate().toString().substring(5));
    const url =
    contactsUrl + "&orderBy=PersonDEO_IsFdCustomer_c:asc&q=PersonDEO_DateOfBirthConvert_c='"+ calls.currDate().toString().substring(5)+"'"; 
    //q=DateOfBirth LIKE '" + calls.currDate() + "%'"
    //PersonDEO_StaffId_c='9708841'";

    const options = {
        method: "GET",
        auth: orcAuth,
        headers: orcHeader
    }

    let chunks = [];

    https.get(url, options, function(response) {
        response.on("data", function (data) {
            chunks.push(data)}).on("end", function() {
                let fData = Buffer.concat(chunks);
                const info = JSON.parse(fData);
                //console.log(chunks);

                console.log(info.items);
                info.items.forEach(contact => {
                    
                    if(contact.PersonDEO_IsFdCustomer_c  === 'Y') {
                        if(!contact.FormattedMobileNumber || contact.FormattedMobileNumber.length > 15) {
                            console.log("Invalid Number |" + contact.FormattedMobileNumber + " | " + contact.FirstName);
                            calls.createMessageLog(contact.PartyId, "Invalid Number |" + contact.FormattedMobileNumber, contact.PersonDEO_StaffId_c, 'N',contact.ContactName, contact.FormattedMobileNumber);
                        } else {
                            let msg = "Dear " + calls.initCap(contact.FirstName) +", *** wishes you a wonderful birthday celebration."+
                            "May happiness be yours on this special day and always. Kindly reach us on ********** or at "+ 
                            "info@email.com";
                        calls.infobipCall(contact.FormattedMobileNumber, msg);
                        //calls.updateSrResolutionMsg(sr.SrNumber);
                        calls.createMessageLog(contact.PartyId, msg, contact.PersonDEO_StaffId_c,'Y',contact.ContactName, contact.FormattedMobileNumber);
                        //update SR Data, to skip the next time it is run
                       // }
                        }
                    } else {
                        console.log("Not an FD customer |" + contact.FormattedMobileNumber + " | " + contact.FirstName);
                    }
                    
                //res.send("Process Completed");
                // Loop through for New Items
                });
                    
               }); 
               res.send("Process Completed");
                // Loop through for New Items   
        });
})


app.listen(process.env.PORT || 7070, function() {
    console.log("Listening on port 7070");
})