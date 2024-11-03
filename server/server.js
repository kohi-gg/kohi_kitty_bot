require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const runServer = () => {
	app.get('/', (req, res) => {
		res.send('Deployed Success! Connected to Server!');
	});

	app.listen(PORT, () => {
		console.log(`Bot is connected. Listening on PORT ${PORT}`);
	});
};

module.exports = runServer;