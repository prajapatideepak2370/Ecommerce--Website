require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

process.env.NODE_ENV = "test";

jest.setTimeout(30000);
