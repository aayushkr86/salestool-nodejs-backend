/// // ...................................... start default setup ............................................////
let mode,sns,dynamodb,docClient,S3;
const AWS 			= require('aws-sdk')
const response 		= require('./lib/response.js')

if (process.env.AWS_REGION == 'local') {
  mode 			= 'offline'
  // sns 			= require('../../../offline/sns');
  docClient 		= require('../../../offline/dynamodb').docClient
  // S3 			= require('../../../offline/S3');
  // dynamodb 	= require('../../../offline/dynamodb').dynamodb;
} else {
  mode 			= 'online'
  // sns 			= new AWS.SNS();
  docClient 		= new AWS.DynamoDB.DocumentClient({})
  // S3 			= new AWS.S3();
  // dynamodb 	= new AWS.DynamoDB();
}
/// // ...................................... end default setup ............................................////

/**
 * modules list
 */
const uuid 			= require('uuid')
const async         = require('async')
const Ajv 			= require('ajv')
const setupAsync 	= require('ajv-async')
const ajv 			= setupAsync(new Ajv())

var updateSchema = {
    $async:true,
    type: "object",
    properties: {
        status : {
            type: "string",
            enum : ['active']
        },
        updatedAt : {
            type : "number"
        },
        company : {
            type: "string",
        },
        logo : {
            type: "string",
        },
        userid : {
            type: "string",
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        },
    },
    required : ["status","updatedAt"]
}

var validate = ajv.compile(updateSchema)
/**
 * This is the Promise caller which will call each and every function based
 * @param  {[type]}   data     [content to manipulate the data]
 * @param  {Function} callback [need to send response with]
 * @return {[type]}            [description]
 */
function execute (data, callback) {
  validate_all(validate, data)
    .then(function (result) {
      return update_logo(result)
    })
    .then(function (result) {
      response({code: 200, body: result.result}, callback)
    })
    .catch(function (err) {
      console.log(err)
      response({code: 400, err: {err}}, callback)
    })
}

/**
 * validate the data to the categories
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function validate_all (validate, data) { // console.log(data)
  return new Promise((resolve, reject) => {
    validate(JSON.parse(data)).then(function (res) {
		    resolve(res)
    }).catch(function (err) {
		  console.log(JSON.stringify(err, null, 6))
		  reject(err.errors[0].dataPath + ' ' + err.errors[0].message)
    })
  })
}

function update_logo (result) {
    var params = {
        TableName: "logo",
        Key: {
            "status": "active",
            "updatedAt": result.updatedAt,
        },
        ReturnValues: 'ALL_OLD', // optional (NONE | ALL_OLD)
    }
    return new Promise(function(resolve, reject) {
        async.waterfall([
            function(done) {
                docClient.delete(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update. Error:", JSON.stringify(err, null, 2));
                        done(true, err.message)
                    }else if(Object.keys(data).length == 0) {
                        done(true, "no item found")
                    } 
                    else {
                        console.log("deleted succeeded",data);
                        done(null, data)
                    }
                })
            },
            function(create, done) {
                params = {
                    TableName: "logo",
                    Item: {},     
                }
                for(var obj in create.Attributes) { 
                    params.Item[obj] = result[obj] ? result[obj] : create.Attributes[obj]
                }
                params.Item.updatedAt = new Date().getTime();
                console.log(params)
                docClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Error:", JSON.stringify(err, null, 2));
                        done(true, err.message)
                    } else {
                        console.log("Successfully updated:", data);
                        result['result'] = {'message': 'Inserted Successfully'}
                        resolve(result)
                    }
                }) 
            }
        ],function(err, data) {
            // console.log(data)
            reject(data)
        })
    })
}
/**
 * last line of code
 * @json {main_object}
 */
module.exports = {execute}