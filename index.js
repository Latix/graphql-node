const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Define Mongoose Schema
const ItemSchema = new mongoose.Schema({
    name: String,
    description: String,
});
const Item = mongoose.model('Item', ItemSchema);

// Define GraphQL Schema
const typeDefs = `
  type Item {
    id: ID!
    name: String!
    description: String!
  }

  type Query {
    items: [Item]
    item(id: ID!): Item
  }

  type Mutation {
    addItem(name: String!, description: String!): Item
    updateItem(id: ID!, name: String, description: String): Item
    deleteItem(id: ID!): Boolean
  }
`;

const resolvers = {
    Query: {
        items: async () => await Item.find(),
        item: async (_, { id }) => await Item.findById(id),
    },
    Mutation: {
        addItem: async (_, { name, description }) => {
            const newItem = new Item({ name, description });
            return await newItem.save();
        },
        updateItem: async (_, { id, name, description }) => {
            return await Item.findByIdAndUpdate(
                id,
                { name, description },
                { new: true }
            );
        },
        deleteItem: async (_, { id }) => {
            const deleted = await Item.findByIdAndDelete(id);
            return !!deleted;
        },
    },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// GraphQL Endpoint
app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true,
}));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/graphql`);
});
