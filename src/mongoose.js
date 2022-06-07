const mongoose = require("mongoose");

const { DB_URI } = process.env;

async function connectDB() {
  await mongoose.connect(DB_URI);
}

const userSchema = new mongoose.Schema({
  username: String,
  is_private: Boolean,
  userId: {
    type: Number,
    unique: true,
    index: 1,
  },
  isCommented: Boolean,
  isResolvedFollower: Boolean,
  isResolvedFollowing: Boolean,
});

const UserModel = mongoose.model("Users", userSchema);

module.exports = {
  UserModel,
  connectDB,
};
