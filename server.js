
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var mongodb     = require('mongodb');
var url = "mongodb://localhost:27017/";
var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())

// parse application/json
app.use(bodyParser.json())
// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

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

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("material_collections");
        dbo.collection("listOfItemAndPannaSize").findOne({}, function (err, result) {
            if (err) throw err;
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
            res.send(result);
        });
    });

});

app.get('/get_vendor_list',function(req,res){
MongoClient.connect(url, function(err, db){
    var dbo = db.db("material_collections");
    var vendorList = [];    
    dbo.collection("contractor_list").find({}).toArray(function(err, result){
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
    MongoClient.connect(url, function(err, db){
        var dbo = db.db("material_collections");
        var vendorList = [];    
        dbo.collection("contractor_list").find().toArray(function(err, result){
            if(err){
                res.send(err);
            }
            res.send(result);
        })
        
    })
})


app.post('/get_orders',function(req,res){
    console.log(req.body)
    MongoClient.connect(url, function(err, db){
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
    console.log(req.body)
    console.log("/////////////////////////")
    const id = mongodb.ObjectID(req.body._id);
    MongoClient.connect(url, function(err, db){
        var dbo = db.db("material_collections");  
        dbo.collection("order_data").find( { $and: [ { "vendorDetails.name" : req.body.vendorName }, { "_id" : id }] }).toArray(function(err, result){
            // console.log("result",result)
            for(let order of result[0]['orders']){
                if(order['recipetNumber'] === req.body.recipetNumber){
                    order['totalClothHaveToTakeOrToGive'] = req.body.totalClothHaveToTakeOrToGive;
                    order['totalClothGiven'] = req.body.totalClothGiven;
                }
            }
            const response = result
            console.log(result)
            console.log("====================")
            console.log(result[0]['orders'])
            console.log("====================")


            dbo.collection("order_data").deleteOne({ $and: [ { "vendorDetails.name" : req.body.vendorName }, { "_id" : id }] }, function(err, obj) {
                if (err) throw err;
                dbo.collection("order_data").insert(response, function (err, result) {
                    if (err) throw err;
                    res.end(JSON.stringify({success : true}));
                });
            })

            // if(err){
            //     res.send(err);
            // }
            // res.send(result);
        })
    })
})




var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});