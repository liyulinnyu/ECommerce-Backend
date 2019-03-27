const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    identification: {
        type: Number,
        required: true
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }]
});

module.exports = mongoose.model('User', UserSchema);