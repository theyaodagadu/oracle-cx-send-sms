const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html")
})

app.post("/", function(req, res) {
    //console.log(req.body);
    const url =
      "https://fa-esgt-test-saasfaprod1.fa.ocs.oraclecloud.com/crmRestApi/resources/11.13.18.05/contacts";

    const options = {
        method: "POST",
        auth: "richardo@letshego.com:tR1anGl3s",
        headers: {
            "Content-Type": "application/vnd.oracle.adf.resourceitem+json"
        }
    }

    const data = {
        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        EmailAddress: req.body.email,
        AddressLine1: req.body.addressLine1,
        AddressLine2: req.body.addressLine2,
        City: req.body.city,
        Country: req.body.country
    };

    const jsonData = JSON.stringify(data);

    const apiCall = https.request(url, options, function(response) {
        // response.on("data", function(d) {
        //     console.log(d.toString());
        // })
        //console.log(webRes);
        //res.send("Data Posted successfully");
        //const status = response.statusCode;

        if (response.statusCode === 201) {
            res.send("Data Successfully Created");
        }
        else {
            res.send(response.statusCode);
        }

    })

    apiCall.write(jsonData);
    apiCall.end();
})

app.listen(process.env.PORT || 7070, function() {
    console.log("Listening on port 7070");
})