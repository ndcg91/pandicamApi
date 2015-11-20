var mongoose	=require('mongoose');
var Schema	=mongoose.Schema;

var GroupSchema	=new Schema({
	groupName:String,
	password:String,
	images:Array,
	users:Array,
	pending:Boolean,
	active:Boolean,
	token:String
});

module.exports = mongoose.model('Group',GroupSchema);
