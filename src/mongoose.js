const mongoose = require('mongoose');

const { DB_URI } = process.env;

async function connectDB() {
  await mongoose.connect(DB_URI);
}

const userSchema = new mongoose.Schema({
    username: String,
    type: String,
    is_private: Boolean,
    userId: Number
});

const UserModel = mongoose.model('Users', userSchema);

module.exports = {
    UserModel,
    connectDB
}