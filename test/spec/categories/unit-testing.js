var Ajv = require('ajv');
var setupAsync = require('ajv-async');

var ajv = setupAsync(new Ajv);

var data = require('../../log/categories-10-4-2018');

/**
 * get the schema
 * @typeofdocument the schema fetch categories
 */
var getSchema = {
  "$async":true,
  "type":"object",
  "properties":{
    "folderId":{"type":"string"},
    "LastEvaluatedKey":{
      "type":"object",
      "properties":{
        "folderId":{"type":"string"},
        "folderOrder":{"type":"number"}
      }
    }
  }
};

/**
 * postschema model used to insert in the category
 * @AutoGenerated [folderId,'folderOrder','subcategory',subCount]
 * @required [name]
 */
var postSchema = {
	"$async":true,
  "additionalProperties": false,
  "required": [ "folderId","folderName"],
	"type":"object",
  "properties":{
    "folderId":{"type":"string"},
    "folderOrder":{"type":"number"},
    "folderName":{"type":"string"},
    "folderDescription":{"type":"string"},
    "folderThumbnailId":{"type":"string"}
  }
};
/**
 * update the model used to change the prevoius value
 * @required_fields [id,folderOrder]
 * @can_change(all are optional and one of them must exist) [name,description,thumbnailId] 
 * @one more schema can be valid if move from one to another then change the list 
 */
var updateSchema = {
  "$async":true,
  "type":"object",
  "additionalProperties": false,
  "required": [ "folderId","folderOrder" ],
  "properties":{
    "folderId":{"type":"string"},
    "folderOrder":{"type":"number"},
    "folderName":{"type":"string"},
    "folderDescription":{"type":"string"},
    "folderThumbnailId":{"type":"string"},
    "newfolderOrder":{"type":"number"}
  }
};

/**
 * delete the previous model
 * @required_fields [id,folderOrder]
 */
var deleteSchema = {
  "$async":true,
  "type":"object",
  "additionalProperties": false,
  "required": [ "folderId","folderOrder" ],
  "properties":{
    "folderId":{"type":"string"},
    "folderOrder":{"type":"number"}
  }
};

var validate={};
 validate['get'] = ajv.compile(getSchema);
 validate['post'] = ajv.compile(postSchema);
 validate['update'] = ajv.compile(updateSchema);
 validate['delete'] = ajv.compile(deleteSchema);

function validate_all (validate,data) { 
	return new Promise((resolve,reject)=>{
		validate(data).then(function (res) {
        console.log(res);
        // resolve(res)
		}).catch(function(err){
		  console.log(JSON.stringify( err,null,6));
		  reject(err.errors[0].dataPath+" "+err.errors[0].message);
		})
	})
}

/**
 * test start from here
 */
describe('categories tests', function () {
  it('validation test', function (done) {
    for(d in data){
      // console.log(data[d]);
      data[d].forEach(function (elem) { 
      validate_all(validate[d],elem)
        .then(function (data) {
          console.log('Valid:', data)
        })
        .catch(function (err) {
          console.log('Invalid:', err)
        })
    })
    }
    done()
  })
})