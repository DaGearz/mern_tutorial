const User = require('../models/User.js');
const Note = require('../models/Note.js');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');


//@desc Get all users
// @route GET /users
//@access Private

const getAllUsers = asyncHandler(async (req, res) =>{
	const users = await User.find().select('-password').lean();
	
	if(!users?.length){
		return res.status(400).json({message: 'No users found'})
	}
	
	res.json(users)
})

//@desc create new user
// @route POST /users
//@access Private

const createNewUser = asyncHandler(async (req, res) =>{
	const {username, password, roles} = req.body;
	//confirm data
	if(!username || !password || !Array.isArray(roles) || !roles.length){
		return res.status(400).json({message: 'All fields are required'})
	}
	
	//check for duplicates
	const duplicate = await User.findOne({username}).lean().exec();
	if(duplicate){
		return res.status(409).json({message: 'Duplicate username'})
	}
	
	//hashed pasword
	const hashedPwd = await bcrypt.hash(password, 10);
	
	const userObject = {username, "password": hashedPwd, roles}
	
	//create store new User
	const user = await User.create(userObject);
	
	if(user){
		res.status(201).json({message: `New user ${username} created`})
	} else
		res.status(400).json({message: "Invalid user data received"})
	
})

//@desc update a user
// @route PATCH /users
//@access Private

const updateUser = asyncHandler(async (req, res) =>{
	const {id, username, password, roles, active} = req.body;
	
	if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
		return res.status(400).json({message: 'All fields are required'})
	}
	
	const user = await User.findById(id).exec();
	
	if(!user) return res.status(400).json({message: "user not found"});
		
	//check for duplicate
	const duplicate = await User.findOne({username}).lean().exec();
	//allow update to original User
	if(duplicate && duplicate?._id.toString() !== id){
		return res.status(409).json({message: 'Duplicate username'})
	}
	user.username= username;
	user.roles = roles;
	user.active = active;
	
	if(password){
		user.password = await bcrypt.hash(password, 10)
	}
	const updatedUser = await user.save();
	
	res.json({message: `${updatedUser.username} updted`})

	
})

//@desc delete a user
// @route DELETE /users
//@access Private

const deleteUser = asyncHandler(async (req, res) =>{
	const {id} = req.body;
	
	if(!id) return res.status(400).json({message: 'User ID required'})
		
	const hasNote = await Note.findOne({user: id}).lean().exec()
	if(hasNote) return res.status(400).json({message: 'User has assigned notes'})
		
	const user = await User.findById(id).exec();
	
	if (!user) return res.status(400).json({message: 'User not found'});
	
	const result = await user.deleteOne();
	
	const reply = `Username ${user.username} with ID ${user._id} deleted`
	
	res.json(reply)
	
})

module.exports = {
	getAllUsers,
	createNewUser,
	updateUser,
	deleteUser
}