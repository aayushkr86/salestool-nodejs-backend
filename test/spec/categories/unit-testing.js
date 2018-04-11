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
    "id":{"type":"string"}
  }
};

/**
 * postschema model used to insert in the category
 * @AutoGenerated [id,'listNumbers','subcategory',subCount]
 * @required [name]
 */
var postSchema = {
	"$async":true,
  "additionalProperties": false,
  "required": [ "name"],
	"type":"object",
  "properties":{
    "name":{"type":"string"},
    "description":{"type":"string"},
    "thumbnailId":{"type":"string"}
  }
};
/**
 * update the model used to change the prevoius value
 * @required_fields [id,listNumbers]
 * @can_change(all are optional and one of them must exist) [name,description,thumbnailId] 
 * @one more schema can be valid if move from one to another then change the list 
 */
var updateSchema = {
  "$async":true,
  "type":"object",
  "additionalProperties": false,
  "required": [ "id","listNumbers" ],
  "properties":{
    "id":{"type":"string"},
    "listNumbers":{"type":"number"},
    "name":{"type":"string"},
    "description":{"type":"string"},
    "thumbnailId":{"type":"string"},
    "newListNumbers":{"type":"number"}
  }
};

/**
 * delete the previous model
 * @required_fields [id,listNumbers]
 */
var deleteSchema = {
  "$async":true,
  "type":"object",
  "additionalProperties": false,
  "required": [ "id","listNumbers" ],
  "properties":{
    "id":{"type":"string"},
    "listNumbers":{"type":"number"}
  }
}

var validate={};
 validate['get'] = ajv.compile(getSchema);
 validate['post'] = ajv.compile(postSchema);
 validate['update'] = ajv.compile(updateSchema);
 validate['delete'] = ajv.compile(deleteSchema);

function validate_all (validate,data) {
	return new Promise((resolve,reject)=>{
		validate(data).then(function (res) {
		    console.log(res);
		}).catch(function(err){
		  console.log(JSON.stringify( err,null,6) );
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