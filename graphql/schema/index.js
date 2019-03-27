const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type User {
        _id: ID!
        email: String!
        password: String
        identification: Int!
        products: [Product!]!
    }

    type Product {
        _id: ID!
        owner: User!
        name: String!
        price: Float!
        count: Int!
        description: String! 
    }

    type Order {
        _id: ID!
        customer: User!
        products: [Product!]!
        date: String!
    }

    type AuthUser {
        userId: ID!
        email: String!
        token: String!
        tokenExp: Int!
        identification: Int!
    }

    type OutputProduct {
        total: Int!
        products: [Product!]!
    }

    type OutputOrder {
        total: Int!
        orders: [Order!]!
    }


    input ProductInput {
        owner: String!
        name: String!
        price: Float!
        count: Int!
        description: String
    }

    input OrderInput {
        customer: String!
    }

    input OrderProduct {
        productId: String!
        seller: String!
        count: Int!
    }

    type RootQuery {
        user(email: String!, password: String!): User! 
        product(owner: String, name: String, productId: String, limit: Int!, offset: Int!): OutputProduct!
        order(userId: String!, limit: Int!, offset: Int!): OutputOrder!
        login(email: String!, password: String!): AuthUser!
    }

    type RootMutation {
        createUser(email: String!, password:String!, identification: Int!): User!
        createProduct(productInput: ProductInput!): Product!
        deleteProduct(productId: String!, userId: String!): Product!
        updateProduct(productId: String!, productInput: ProductInput): Product!
        createOrder(orderInput: OrderInput!, orderProduct: [OrderProduct!]): Order!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);
