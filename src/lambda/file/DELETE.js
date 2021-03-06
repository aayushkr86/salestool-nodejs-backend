///// ...................................... start default setup ............................................////
let mode,sns,dynamodb,docClient,S3;
const AWS = require('aws-sdk');
const response = require('./lib/response.js');
const database = require('./lib/database.js');

if(process.env.AWS_REGION == "local") {
	mode 		= "offline";
	sns 		= require('../../../offline/sns');
	docClient 	= require('../../../offline/dynamodb').docClient;
	S3 			= require('../../../offline/S3');
	// dynamodb = require('../../../offline/dynamodb').dynamodb;
}else {
	mode 		= "online";
	sns 		= new AWS.SNS();
	docClient 	= new AWS.DynamoDB.DocumentClient({});
	S3 			= new AWS.S3();
	// dynamodb    = new AWS.DynamoDB();
}
///// ...................................... end default setup ............................................////

/**
 * modules list
 */
const uuid 			= require('uuid');
const Ajv 			= require('ajv');
const setupAsync 	= require('ajv-async');
const ajv 			= setupAsync(new Ajv);

const deleteSchema = {
  "$async":true,
  "type":"object",
  "additionalProperties": false,
  "required": [ "fileId","fileOrder" ],
  "properties":{
    "fileId":{"type":"string"},
    "fileOrder":{"type":"number"}
  }
};

const validate = ajv.compile(deleteSchema);

/**
 * This is the Promise caller which will call each and every function based
 * @param  {[type]}   data     [content to manipulate the data]
 * @param  {Function} callback [need to send response with]
 * @return {[type]}            [description]
 */
function execute(data,callback){
	if(typeof data == "string"){
		data = JSON.parse(data);
	}
	validate_all(validate,data)
		.then(function(result){
			return delete_file(result);
		})
		.then(function(result){
			console.log(result);
			return find_count_to_decrease_folder(result);
		})
		.then(function(result){
			console.log(arguments);
			if(result.decrease== undefined){
				return result;
			}else{
				return decrease_folder_count(result);
			}
		})
		.then(function(result){
			console.log("result");
			response({code:200,body:result.result},callback);
		})
		.catch(function(err){
			console.log(err);
			response({code:400,err:{err}},callback);
		})
}

/**
 * validate the data to the categories
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function validate_all (validate,data) {
	return new Promise((resolve,reject)=>{
		validate(data).then(function (res) {
		    resolve(res);
		}).catch(function(err){
		  console.log(JSON.stringify( err,null,6) );
		  reject(err.errors[0].dataPath+" "+err.errors[0].message);
		})
	})
}

function delete_file(result){
	var params = {
	    TableName: database.Table[0].TableName,
	    Key: {
	    	"fileId":result.fileId,
	    	"fileOrder":result.fileOrder
	    },
	    ConditionExpression: 'attribute_exists(fileId) AND attribute_exists(fileOrder)'
	    //delete all the comments for that files
	};
	console.log(params);
	return new Promise((resolve,reject)=>{
		docClient.delete(params,function(err,categories){
			if(err){
				reject(err.message);
			}
			result['result']={"message":"Deleted Successfully"};

			resolve(result);
		})
	});
}

function find_count_to_decrease_folder(result){
	//find the folderid in folderSub 
	var params = {
		TableName: database.Table[1].TableName,
	    IndexName: 'folderSub-index',
	    KeyConditionExpression: 'folderSub = :value', 
	    ExpressionAttributeValues: { // a map of substitutions for all attribute values
	      ':value': result.fileId
	    },
	    Limit: 1, // optional (limit the number of items to evaluate)
	};
	return new Promise((resolve,reject)=>{
		docClient.query(params,function(err,folder){
			if(err){
				reject(err.message);
			}
			console.log(folder);
			if(folder.Items[0] != undefined){
				let content = folder.Items[0];
				result['decrease']=content;
			}
			resolve(result);
		})
	})
}

function decrease_folder_count(result){
	let decrease = result.decrease;
	var params = {
	    TableName: database.Table[1].TableName,
	    Key: {
	        folderId: decrease.folderId,
	        folderOrder: decrease.folderOrder  
	    },
	    UpdateExpression: 'SET folderSubCount = folderSubCount - :value', 
	    ExpressionAttributeValues: { // a map of substitutions for all attribute values
	        ':value': 1
	    }
	};
	return new Promise((resolve,reject)=>{
		docClient.update(params, function(err, folder) {
		   	if(err){
				reject(err.message);
			}
				resolve(result);
		});
	})
}
/**
 * last line of code
 * @json {main_object}
 */
module.exports={execute};

