const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ versionKey: false });
  obj.id = obj._id;
  delete obj._id;
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
