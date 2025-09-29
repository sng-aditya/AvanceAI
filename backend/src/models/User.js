const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
}, { timestamps: true });

userSchema.method('toPublic', function () {
  return {
    id: this._id,
    email: this.email,
    first_name: this.first_name,
    last_name: this.last_name,
    created_at: this.createdAt
  };
});

module.exports = mongoose.model('User', userSchema);
