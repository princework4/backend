const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/*.js']; // Path to your route files

swaggerAutogen(outputFile, endpointsFiles);
