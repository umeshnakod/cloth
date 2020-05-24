
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var mongodb     = require('mongodb');
var url = "mongodb://13.126.178.150:27017/";
// var url = "mongodb://localhost:27017/";
var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())

// parse application/json
app.use(bodyParser.json())
// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://cloth-material.s3-website.ap-south-1.amazonaws.com:9000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', function (req, res) {
    console.log("calleddd----")
    MongoClient.connect(url,{ useUnifiedTopology: true }, function (err, db) {
        if (err) throw err;
        var dbo = db.db("material_collections");
        dbo.collection("listOfItemAndPannaSize").findOne({}, function (err, result) {
            if (err) throw err;
            res.setHeader('Access-Control-Allow-Origin', 'http://cloth-material.s3-website.ap-south-1.amazonaws.com:9000');
            res.send(result);
        });
    });

});

app.get('/get_vendor_list',function(req,res){
MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db){
    var dbo = db.db("material_collections");
    var vendorList = [];    
    dbo.collection("Contractor_List").find({}).toArray(function(err, result){
        if(err){
            res.send(err);
        }
        res.send(result);
    })
    
})

})


app.post('/post', function (req, res) {
    // Prepare output in JSON format  
    MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
        if (err) throw err;
        var dbo = db.db("material_collections");
        dbo.collection("contractor_list").find({ 'contractorName.name' : req.body.contractorName.name })
        .toArray(function(err, result) {
            if(result.length){
                let response = result;
                for(let record of req.body.itemList){
                    response[0]['itemList'].push(record)
                }
                var myquery = { 'contractorName.name' : req.body.contractorName.name };
                dbo.collection("contractor_list").deleteOne(myquery, function(err, obj) {
                 if (err) throw err;
                 dbo.collection("contractor_list").insert(response, function(err, result){
                if (err) throw err;
                res.end(JSON.stringify({success : true}));

                })
                  db.close();
                });

            }else{
            dbo.collection("contractor_list").insert(req.body, function (err, result) {
            if (err) throw err;
            res.end(JSON.stringify({success : true}));
            });
            }

        })        
        
    })
});




app.post('/create-new-order', function (req, res) {
    // Prepare output in JSON format  
    req.body.orderedDate = new Date().setHours(0,0,0,0)
    req.body.orderedDate = req.body.orderedDate.toString()
    MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
        if (err) throw err;
        var dbo = db.db("material_collections");
        var todayDate = new Date().setHours(0,0,0,0);
        todayDate = todayDate.toString()
        dbo.collection("order_data").find( { $and: [ { "vendorDetails.name" : req.body.vendorDetails.name }, { "orderedDate" : todayDate } ] })
        .toArray(function(err, result) {
            if (err) throw err;
            if(result.length){
                var response = result;
                console.log(req.body)
                response[0]['orders'].push(req.body['orders'][0])
                dbo.collection("order_data").deleteOne({ $and: [ { "vendorDetails.name" : req.body.vendorDetails.name }, { "orderedDate" : todayDate } ] }, function(err, obj) {
                    if (err) throw err;
                    dbo.collection("order_data").insert(response, function (err, result) {
                        if (err) throw err;
                        res.end(JSON.stringify({success : true}));
                    });
                })
            }else{
                dbo.collection("order_data").insert(req.body, function (err, result) {
                    if (err) throw err;
                    res.end(JSON.stringify({success : true}));
                });
            }
            
        })
    })
})


app.post('/save_new_item', function (req, res) {

    MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {

        var dbo = db.db("material_collections");
        dbo.collection("listOfItemAndPannaSize").findOne({}, function (err, result) {
            var response = result;       
            dbo.collection("listOfItemAndPannaSize").deleteOne({ $and: [ { "_id" : result._id } ] }, function(err, obj) {
                if(result.hasOwnProperty('itemList')){
                    response.itemList.push(req.body)
                    dbo.collection("listOfItemAndPannaSize").insert(response, function (err, result) {
                        if (err) throw err;
                        res.end(JSON.stringify({success : true}));
                    });
                }else{
                    response.itemList = [];
                    response.itemList.push(req.body)
                    dbo.collection("listOfItemAndPannaSize").insert(response, function (err, result) {
                        if (err) throw err;
                        res.end(JSON.stringify({success : true}));
                    });
                }
            })


        });

    })

})


app.get('/get_vendors_name_list',function(req,res){
    MongoClient.connect(url, { useUnifiedTopology: true },function(err, db){
        var dbo = db.db("material_collections");
        var vendorList = [];    
        dbo.collection("Contractor_List").find().toArray(function(err, result){
            if(err){
                res.send(err);
            }
            res.send(result);
        })
        
    })
})


app.post('/get_orders',function(req,res){
    console.log(req.body)
    MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db){
        var dbo = db.db("material_collections");  
        dbo.collection("order_data").find( { $and: [ { "vendorDetails.name" : req.body.name }] }).toArray(function(err, result){
            if(err){
                res.send(err);
            }
            res.send(result);
        })
        
    })
    
})

app.post('/make_cloth_settlement',function(req,res){

    const id = mongodb.ObjectID(req.body.reqHeader.id);
    MongoClient.connect(url, { useUnifiedTopology: true },function(err, db){
        var dbo = db.db("material_collections");  
        var response = null; 
        dbo.collection("order_data").find( { $and: [ { "vendorDetails.name" : req.body.reqHeader.name }, { "_id" : id }] }).toArray(function(err, result){
            console.log("result",result[0]['orders'][1]);
            console.log("-------------------------------------")
            console.log("==========req",req.body['changedData']);

            if(req.body.isClothSettlement){
                for (let index = 0; index < result[0]['orders'].length; index++) {
                    if(result[0]['orders'][index]['selectedItem'] == req.body['changedData']['selectedItem']){

                        result[0]['orders'][index] = req.body['changedData'];
                        response = result;
                        dbo.collection("order_data").deleteOne({ $and: [ { "vendorDetails.name" : req.body.reqHeader.name }, { "_id" : id }] }, function(err, obj) {
                            if (err) throw err;
                            dbo.collection("order_data").insertMany(response, function (err, result) {
                                if (err) throw err;
                                res.end(JSON.stringify({success : true}));
                            });
                        })
                    }
                    
                }

            }
            else{
                for (let index = 0; index < result[0]['orders'].length; index++) {
                    
                    if(result[0]['orders'][index]['recipetNumber'] == req.body['changedData']['recipetNumber']){
                        result[0]['orders'][index]['order'] = req.body['changedData']['order'];
                        response = result;
                        dbo.collection("order_data").deleteOne({ $and: [ { "vendorDetails.name" : req.body.reqHeader.name }, { "_id" : id }] }, function(err, obj) {
                            if (err) throw err;
                            dbo.collection("order_data").insertMany(response, function (err, result) {
                                if (err) throw err;
                                res.end(JSON.stringify({success : true}));
                            });
                        })
                    }
                    
                }
                // for(let order of result[0]['orders']){
                //     if(order['recipetNumber'] === req.body['changedData']['recipetNumber']){
                //         // console.log("----------",order['order'][0])
                //         order['order'] = req.body['changedData']['order']
                //     }
                // }
 
            }

        })
    })
})




var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});
