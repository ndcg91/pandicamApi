var mongoose	=require('mongoose');
var Schema	=mongoose.Schema;

var UserSchema	=new Schema({
	username:String,
	password:String,
	free:Boolean,
	images:Array,
	token:String,
	email:String,
	belongsTo:Array
});

module.exports = mongoose.model('User',UserSchema);
