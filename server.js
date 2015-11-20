var express 	= require('express');
var app 		= express();
var bodyParser 	= require('body-parser');
var mongoose	= require('mongoose');
var jwt			= require('jsonwebtoken');
var morgan		= require('morgan');
var User 		= require('./modules/user.js');
var Group 		= require('./modules/groups.js');

mongoose.connect('mongodb://express:express@ds055574.mongolab.com:55574/testndcg9105');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(function(req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

var port = process.env.PORT || 8080;


var router = express.Router();

router.use(function(req, res, next) {
console.log("algo ha pasado");
next();
});

router.get('/', function(req, res) {
	res.json({message: 'ok api set'});
});

router.route('/users')
	.post(function(req,res){
		var user= new User();
		user.username= req.body.username;
		user.password= req.body.password;
		user.free = true;
		user.email = req.body.email; 

		User.findOne({
			username:req.body.username
		}, function(err,fetchuser){
			if(err)
				res.send(err);
			if (fetchuser == null){

			 	user.save(function(err,user){
                        		if (err)
                                		res.send(err);
					user.token = jwt.sign(user,'secretkey',{noTimestamp:true});
					user.save(function(err,user){
						if (err) res.send(err);
						res.json({message: 'User created!',id: user.id, token:user.token});
					});
                		});

			}
			else{
				res.json({message:"please chose another useer"});
			}
			
		});
	})



	.get(checkAuth,function(req,res){
		User.findOne({token: req.token},function(err,user){
			if (err){
				res.send(error);	
			}
			else if (user != null){
				User.find(function(err,users){
	                        	if(err)
                                		res.send(err);
                                	res.json({currentUser:user,alluser:users});
                		});
			}
			else{
				console.log(req.token);
				res.send(403);
			}
		});
	});

router.route("/login")
	.post(function(req,res){
		var username = req.body.username;
		var password = req.body.password;
		User.findOne({username: username},function(err,user){
			if (err) res.send(err)
			console.log(user);
			if (user != null){
				if (user.password == password){
					res.send(user);
				}
				else{
					res.send(403);
				}
			}
			else{
				res.send(403);
			}
		});
	});	

router.route("/newGroup")
	.post(checkAuth,function(req,res){
		var newGroup = new Group();
		newGroup.groupName = req.body.name;
		newGroup.password = req.body.password;
		newGroup.active = req.body.active;
		newGroup.pending = req.body.pending;
		User.findOne({token:req.token},function(err,user){
			if (err)
				res.send(err);
			if (user != null){
				newGroup.save(function(err,group){
					if (err)
						res.send(err);
					group.token = jwt.sign(group,'secretkey',{noTimestamp:true});
					group.save(function(err,savedGroup){
						if (err) res.send(err);
						 user.update({
                	                                $addToSet: {belongsTo:
                                                                {as:"server", to:savedGroup}
                                                        }
                                                },function(err){
        	                                        if (err) res.send(err);
							res.send({message:"Group Created",token:group.token});
	                                        });

					});
			
			
				});
			}
		});
	});

router.route("/getGroups")
	.get(checkAuth,function(req,res){
		var token = req.token;
		User.findOne({token:token},function(err,user){
			if(err) res.send(err);
			if (user != null){
				res.send(user.belongsTo);
			}
			else { res.send(403) }
		});
	});

router.route("/group/addUser")
	.post(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		var userToAdd = req.body.user;
		User.findOne({token:userToken},function(err, user){
        	        if (err) res.send(err);
					if (user == null){
						res.send(403);
					}
	        });
		Group.findOne({token:groupToken},function(err,group){
			if (err) res.send(err);
			if (group != null){
				User.findOne({username:userToAdd},function(err,user){
					if (err) res.send(err)
					if (user != null){
						user.update({$addToSet: {belongsTo:{as:"client",to:group}}},function(err){
							if (err) res.send(err);
						});
						group.update({$addToSet: {users: {username:user.username, joinedAs:"client"}}},function(err){
							if (err) res.send(err);
						});
					}
				});
			}
			else{
				res.send(403);
			}
		});


		
	});


router.route("/group/addPic")
        .post(checkGroupAuth,function(req,res){
                var userToken = req.token;
                var groupToken = req.groupToken;
                var picToAdd = req.body.pic;
                User.findOne({token:userToken},function(err,user){
                        if (err) res.send(err);
						if (user == nul){
							res.send(403);
						}
						else{
							 Group.findOne({token:groupToken},function(err,group){
								if (err) res.send(err);
								if (group != null){
									group.update({$addToSet: {pictures:{pic: picToAdd, timeStamp:new Date() }}},function(err){
																if (err) res.send(err);
															});
								}
								else{
									res.send(403);
								}
							});
						}
                });
        });

		
		
function checkAuth(req,res,next){
	var usertoken;
	var tokenFromHeader = req.headers["authorization"];
	if (typeof tokenFromHeader !== 'undefined'){
		var token = tokenFromHeader.split(" ")[1];
		req.token = token;
		next()
	}
	else{
	res.send(403)
	}
};

function checkGroupAuth(req,res,next){
        var usertoken;
        var tokenFromHeader = req.headers["authorization"];
        if (typeof tokenFromHeader !== 'undefined'){
                var token = tokenFromHeader.split(" ")[1];
		var grouptoken = tokenFromHeader.split(" ")[2];
                req.token = token;
		req.groupToken = grouptoken;
                next()
        }
        else{
        res.send(403)
        }
};

app.use('/api',router);
app.listen(port);
console.log('api started at port' + port);
console.log(' get => /api/users to list users, (authorization required) only for testing, we will change this to make sure only admin can check this');
console.log(' post => /api/users to create user, params username ,password, free bool and email');

console.log('post=> /api/login to enter site, params username and password, will return user info. Most important is user.token\n' +

'post => api/newGroup : (authorization required) will create a group and return a group token. Params groupName, password, active, pending\n' +

'get => /api/getGroups (authorization required)\n return the belongsTo association of the user \n' +

'post => api/group/addUser (authorization required) , add user to group. params token grouptoken on header user \n' +

'post => /api/group/addPic (group authorization required) params pic. Add a pic to the group. The group is catched ussing the header autorization api key of the group');

