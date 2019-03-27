const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        },
        count: {
            type: Number,
            required: true
        }
    }],
    date: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Order', OrderSchema);