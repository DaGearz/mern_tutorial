require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT;
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const {logger, logEvents} = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')

console.clear();
console.log(process.env.NODE_ENV); // to check if the environment variable is set correctly


connectDB()

app.use(logger); 

app.use(cors(corsOptions))

//middleware needed to read static files in /public and json files
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(cookieParser());

//we are using routes to set up route. this middleware pulls it logic from root.js to route
app.use('/', require('./routes/root'));

app.use('/users', require('./routes/userRoutes'));

app.use('/notes', require('./routes/noteRoutes'));


 //catch all
app.all(/\/*/, (req,res) => {
	res.status(404);
	
	try{
		if(req.accepts('html')){
		res.sendFile(path.join(__dirname, "views", "404.html"))
		} else if(req.accepts('json')){
			res.json({'message': "404 Not found"})
		} else{
			res.type('txt').send('404 Not Found')
		}
		
	
		
	}catch(err){
		console.log(err)
	}
	

});

app.use(errorHandler);


mongoose.connection.once('open', () =>{
	console.log('Connected to MongoDB')
	app.listen(PORT, () => {
	console.log(`server running on port: ${PORT}`);
	
})
})

mongoose.connection.on('error', err => {
	console.log(err);
	logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
	
})

//

