// try{
let POST = require('./POST');
let PUT = require('./PUT');
// let UPDATE = require('./UPDATE');
let DELETE = require('./DELETE');
let GET = require('./GET');
let DUMP = require('./DUMP');
// }catch(e){console.log(e);}
/**
 * Main field where we will fetch all the content and passer
 * @param  {[type]}   event    [description]
 * @param  {[type]}   context  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
exports.handler = function  (event,context,callback) {
	console.log(event.httpMethod);
	switch(event.httpMethod){
		case 'GET': GET.execute(event.queryStringParameters,callback);
					break;
		case 'POST': POST.execute(event.body,callback);
					break;
		case 'PUT': PUT.execute(event.body,callback);
					break;
		// case 'UPDATE': UPDATE.execute(event.body,callback);
		// 			break;
		case 'DELETE': DELETE.execute(event.body,callback);
					break;
		default : DUMP.execute({},callback);
	}
}
