const User = require('../../models/user');
const Product = require('../../models/product');
const Order = require('../../models/order');
const JWT = require('jsonwebtoken');

const nestedUser = async (userId) => {
    const user = await User.findById(userId);
    return {
        _id: user._id,
        email: user.email,
        identification: user.identification,
        products: nestedProduct.bind(this, user.products)
    };
}

const nestedProduct = async (products) => {
    return products.map(async item => {

        let product = null;
        if (!item.productId) {
            product = await Product.findById(item);
        } else {
            product = await Product.findById(item.productId);
        }
        return {
            _id: product._id,
            name: product.name,
            price: product.price,
            count: (!item.productId) ? product.count : item.count,
            description: product.description,
            owner: nestedUser.bind(this, product.owner)
        };
    })
}

module.exports = {
    user: async (args) => {
        try {
            let user = await User.findOne({email: args.email});
            return {
                _id: user._id,
                email: user.email,
                identification: user.identification,
                products: nestedProduct.bind(this, user.products)
            };
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    product: async (args) => {
        let products = null;
        let total = null;
        if (!args.owner && !args.name && !args.productId) {
            products = await Product.find().skip(args.offset).limit(args.limit);
            total = await Product.find().count();
        }
        if (args.name) {
            try { return await Product.find({name: args.name}); }
            catch (err) { throw err; }
        }
        if (args.owner) {
            try { 
                products = await Product.find({owner: args.owner}).skip(args.offset).limit(args.limit);
                total = await Product.find({owner: args.owner}).count();
            }
            catch (err) { throw err; }
        }
        if (args.productId) {
            try { return await Product.findOne({_id:args.productId}); }
            catch (err) { throw err; }
        }
        return {
            total: total,
            products: nestedProduct(products)
        };
    },

    order: async (args, req) => {
        if (req.isAuth === false) {
            return new Error('invalid user');
        }
        try {
            const user = await User.findById(args.userId);
            let orders = null;
            let total = 0;
            if (user.identification === 0) {
                // customer
                orders = await Order.find({customer: args.userId}).skip(args.offset).limit(args.limit);
                total = await Order.find({customer: args.userId}).count();
                orders = orders.map(item => {
                    return {
                        _id: item._id,
                        customer: nestedUser.bind(this, item.customer),
                        products: nestedProduct.bind(this, item.products),
                        date: new Date(item.date).toLocaleDateString()
                    }
                })
            } else {
                orders = await Order.find({products:{$elemMatch: {productId: {$in: user.products}} }}).skip(args.offset).limit(args.limit);;
                total = await Order.find({products:{$elemMatch: {productId: {$in: user.products}} }}).count();
                orders = orders.map(item => {
                    let arr = item.products;
                    arr = arr.map(product => {
                        if (user.products.indexOf(product.productId) === -1) {
                            return;
                        }
                        return product;
                    });
                    // delete undefined
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] === undefined) {
                            arr.splice(i, 1);
                            i--;
                        }
                    }
                    if (arr.length === 0) {
                        return;
                    }
                    return {
                        _id: item._id,
                        products: nestedProduct.bind(this, arr.slice()),
                        customer: nestedUser.bind(this, item.customer),
                        date: new Date(item.date).toLocaleDateString()
                    }
                });
            }

            return {
                total: total,
                orders: orders
            }
        } catch (err) {
            throw err;
        }
    },

    login: async (args) => {
        try {
            const user = await User.findOne({email: args.email});
            if (!user) {
                return new Error('user does not exist');
            }
            if (user.password !== args.password) {
                return new Error('wrong password');
            }
            const token = JWT.sign({
                userId: user._id
            }, 'AuthKey', {expiresIn: "1h"});
            return {
                userId: user._id,
                email: user.email,
                identification: user.identification,
                token: token,
                tokenExp: 1
            }
        } catch (err) {
            throw err;
        }
    },

    createUser: async (args) => {
        let hasUser = await User.findOne({email: args.email});
        if (hasUser) {
            return new Error('User exists');
        }
        const user = new User({
            email: args.email,
            password: args.password,
            identification: parseInt(args.identification),
            products: []
        });
        try {
            let backUser = await user.save();
            return backUser;
        } catch (err) {
            throw err;
        }
    },

    createProduct: async (args, req) => {
        if (req.isAuth === false) {
            return new Error('invalid user');
        }
    
        const user = await User.findById(args.productInput.owner);
        if (!user) {return new Error(`owner doesn't exist`);}

        const product = new Product({
            name: args.productInput.name,
            price: parseFloat(args.productInput.price),
            description: args.productInput.description || '',
            owner: args.productInput.owner,
            count: parseInt(args.productInput.count)
        });
        try {
            user.products.push(product);
            await user.save();
            return await product.save();
        } catch (err) {
            throw err;
        }
    },

    deleteProduct: async (args, req) => {
        if (req.isAuth === false) {
            return new Error('invalid user');
        }
        // every product only belongs to one user
        const user = await User.findById(args.userId);
        const index = user.products.indexOf(args.productId);
        if (index === -1) {
            return new Error('invalid Product!');
        }
        user.products.splice(index, 1);
        try {
            await user.save();
            return await Product.findByIdAndRemove(args.productId);
        } catch (err) { throw err; }
    },

    updateProduct: async (args, req) => {
        if (req.isAuth === false) {
            return new Error('invalid user');
        }
        try {
            await Product.findOneAndUpdate(
                {_id: args.productId}, 
                {
                    owner: args.productInput.owner,
                    price: parseFloat(args.productInput.price),
                    count: parseInt(args.productInput.count),
                    name: args.productInput.name,
                    description: args.productInput.description || ''
                }
            );
            return {
                _id: args.productId,
                owner: nestedUser.bind(this, args.productInput.owner),
                name: args.productInput.name,
                price: parseFloat(args.productInput.price),
                count: parseInt(args.productInput.count),
                description: args.productInput.description || ''
            };
        } catch (err) {
            throw err;
        }
    },

    createOrder: async (args, req) => {
        if (req.isAuth === false) {
            return new Error('invalid user');
        }
        try {
            const order = new Order({
                customer: args.orderInput.customer,
                products: args.orderProduct,
                date: new Date()
            });
            args.orderProduct.forEach(async item => {
                let product = await Product.findById(item.productId);
                if (product.count - item.count < 0) {
                    return new Error(`Do not have ${item.count} orders of this product`);
                }
                product.count -= item.count;
                await product.save();
            });

            let temp = await order.save();

            return {
                _id: temp._id,
                customer: nestedUser.bind(this, temp.customer),
                products: nestedProduct.bind(this, temp.products),
                date: new Date(temp.date).toLocaleDateString()
            }
        } catch (err) {
            throw err;
        }
    }
}