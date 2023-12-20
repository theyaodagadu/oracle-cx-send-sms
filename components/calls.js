require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const app = express();
const baseUrl = process.env.ORA_BASE_URL + "/serviceRequests";
const messageUrl = process.env.ORA_BASE_URL + "/Messages_c";
const orcAuth = process.env.ORA_KEY;
const orcHeader = {
    "Content-Type": "application/vnd.oracle.adf.resourceitem+json"
};


function infobipCall(phoneNumber, msg) {
    const url = process.env.SMS_GW_URL;

    const options = {
        method: "POST",
        auth: process.env.SMS_GW_KEY,
        headers: {
            "Accept": "application/json"
        }
    }

    const data = {
        "messages": [
            {
                "destinations": [
                    {
                    "to": phoneNumber
                    }
                ],
                "from": process.env.SMS_SENDER,
                "text": msg
            }
        ]
    };

    const smsRequest = https.request(url, options, (response) =>{
        if (response.statusCode === 201) {
            //res.send("SMS message successfully sent");
            console.log("SMS message successfully sent")
        }
        else {
            console.log(response.statusCode);
        }
    })

    let smsData = JSON.stringify(data);

    console.log(smsData);
    
    smsRequest.write(smsData);
    smsRequest.end();
}

function updateSrAcknowledgeMsg(srNumber) {
    const url = baseUrl + "/" + srNumber;

    const options = {
        method: "PATCH",
        auth: orcAuth,
        headers: orcHeader
    }

    const data = {
        AcknowledgeMsg_c: "Y"
    };

    const updateRequest = https.request(url, options, (response) =>{
        if (response.statusCode === 200) {
            //res.send("SMS message successfully sent");
            console.log("Aknowledge message successfully updated")
        }
        else {
            console.log(response.statusCode);
        }
    })

    let updateData = JSON.stringify(data);

    console.log(updateData);
    
    updateRequest.write(updateData);
    updateRequest.end();

}

function updateSrResolutionMsg(srNumber) {
    const url = baseUrl + "/" + srNumber;

    const options = {
        method: "PATCH",
        auth: orcAuth,
        headers: orcHeader
    }

    const data = {
        ResolutionMsg_c: "Y"
    };

    const updateRequest = https.request(url, options, (response) =>{
        if (response.statusCode === 200) {
            //res.send("SMS message successfully sent");
            console.log("Resolved Message successfully updated")
        }
        else {
            console.log("Update Error Message: " + response.statusCode);
        }
    })

    let updateData = JSON.stringify(data);

    console.log(updateData);
    
    updateRequest.write(updateData);
    updateRequest.end();

}

function createMessageLog(PartyId, msg, staffId, isSent,contact,phoneNumber) {
    const url = messageUrl;

    const options = {
        method: "POST",
        auth: orcAuth,
        headers: orcHeader
    }

    const data = {
        PartyId_c: PartyId,
        MsgDate_c: currDate(),
        MsgType_c: "BIRTHDAY",
        IsSent_c: isSent,
        StaffId_c: staffId,
        TextMessage_c: msg,
        ContactName_c: contact,
        PhoneNumber_c: phoneNumber
    };

    const createLog = https.request(url, options, (response) =>{
        if (response.statusCode === 201) {
            //res.send("SMS message successfully sent");
            console.log("Message Log Created")
        }
        else {
            console.log("Message Error: " + response.statusCode);
        }
    })

    let updateData = JSON.stringify(data);

    console.log(updateData);
    
    createLog.write(updateData);
    createLog.end();

}

function initCap(str) {
    return String(str).toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
       return m.toUpperCase();
    });
 };


 function currDate() {
    let now = new Date().toJSON().substring(0,10);
    return now;
}

module.exports = {updateSrResolutionMsg, updateSrAcknowledgeMsg, infobipCall, initCap, currDate, createMessageLog};